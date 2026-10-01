const express = require("express");
const router = express.Router();

const checkTokenValidity = require("../Middleware/jwtVerifyMiddleware");
const Album = require("../models/Albums");
const Post = require("../models/Post");
const { default: mongoose } = require("mongoose");

const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const sameId = (a, b) => a?.toString() === b?.toString();

// Union of two tag lists, normalised (lowercase, no '#', no duplicates)
const mergeTags = (existing = [], incoming = []) =>
    [...new Set([...existing, ...Post.formatHashtags(incoming)])];

// Load an album and make sure the caller owns it. Sends the error response itself and returns null on failure.
async function loadOwnedAlbum(req, res, albumId) {
    if (!isId(albumId)) {
        res.status(400).json({ success: false, message: "Invalid Album ID format." });
        return null;
    }
    const album = await Album.findById(albumId);
    if (!album) {
        res.status(404).json({ success: false, message: "Album not found." });
        return null;
    }
    if (!sameId(album.userId, req.user.userId)) {
        res.status(403).json({ success: false, message: "You can only change your own albums." });
        return null;
    }
    return album;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------
router.get('/api/get/albums/all', checkTokenValidity, async (req, res, next) => {
    try {
        const albums = await Album.find().sort({ _id: -1 });
        res.status(200).json({ success: true, albums });
    } catch (error) {
        next(error);
    }
});

// My albums (used by the "Add to album" picker and the create-post page)
router.get('/api/get/albums/me', checkTokenValidity, async (req, res, next) => {
    try {
        const albums = await Album.find({ userId: req.user.userId }).sort({ _id: -1 }).lean();
        res.status(200).json({ success: true, albums });
    } catch (error) {
        next(error);
    }
});

// One album with all its posts, in the order they were added
router.get('/api/get/album/:id', checkTokenValidity, async (req, res, next) => {
    const albumId = req.params.id;
    try {
        if (!isId(albumId)) {
            return res.status(400).json({ success: false, message: "Invalid Album ID format." });
        }

        const album = await Album.findById(albumId)
            .populate("userId", "username name profileImage")
            .lean();

        if (!album) {
            return res.status(404).json({ success: false, message: "Album not found." });
        }

        const posts = await Post.find({ _id: { $in: album.postId || [] } })
            .select("caption image hashtags likes createdAt userId")
            .populate("userId", "username name")
            .lean();

        // Keep album order; silently skip posts that no longer exist
        const byId = new Map(posts.map(p => [p._id.toString(), p]));
        const ordered = (album.postId || []).map(id => byId.get(id.toString())).filter(Boolean);

        return res.status(200).json({
            success: true,
            album: { ...album, postId: ordered.map(p => p._id) },
            posts: ordered,
            isOwner: sameId(album.userId?._id, req.user.userId)
        });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// Create / update / delete
// ---------------------------------------------------------------------------

// Create an album. Optional postIds puts posts in straight away; their hashtags are added to the album tags.
router.post('/api/create/album', checkTokenValidity, async (req, res, next) => {
    const { title, description, hashtags, postIds = [] } = req.body;

    try {
        if (!title || !String(title).trim()) {
            return res.status(400).json({ success: false, message: "Album title is required." });
        }

        const validIds = (Array.isArray(postIds) ? postIds : []).filter(isId);
        const posts = validIds.length ? await Post.find({ _id: { $in: validIds } }).select("hashtags") : [];

        let tags = Post.formatHashtags(hashtags);
        for (const p of posts) tags = mergeTags(tags, p.hashtags);

        const album = await Album.create({
            title: String(title).trim().slice(0, 80),
            description: String(description || "").trim().slice(0, 500),
            userId: req.user.userId,
            hashtags: tags,
            postId: posts.map(p => p._id)
        });

        if (posts.length) {
            await Post.updateMany({ _id: { $in: album.postId } }, { $addToSet: { albums: album._id } });
        }

        return res.status(201).json({ success: true, album });
    } catch (error) {
        next(error);
    }
});

// Edit album name, description and tags (owner only)
router.put('/api/update/album/:id', checkTokenValidity, async (req, res, next) => {
    const { title, description, hashtags } = req.body;

    try {
        const album = await loadOwnedAlbum(req, res, req.params.id);
        if (!album) return;

        if (title !== undefined) {
            if (!String(title).trim()) {
                return res.status(400).json({ success: false, message: "Album title cannot be empty." });
            }
            album.title = String(title).trim().slice(0, 80);
        }
        if (description !== undefined) album.description = String(description).trim().slice(0, 500);
        if (hashtags !== undefined) album.hashtags = Post.formatHashtags(hashtags);

        const updatedAlbum = await album.save();
        return res.status(200).json({ success: true, album: updatedAlbum });
    } catch (error) {
        next(error);
    }
});

// Delete an album. Posts are NOT deleted - they're only unlinked from the album.
router.delete('/api/delete/album/:id', checkTokenValidity, async (req, res, next) => {
    try {
        const album = await loadOwnedAlbum(req, res, req.params.id);
        if (!album) return;

        await Post.updateMany({ albums: album._id }, { $pull: { albums: album._id } });
        await Album.findByIdAndDelete(album._id);

        return res.status(200).json({
            success: true,
            message: `"${album.title}" deleted. Its posts were kept.`
        });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// Album membership
// ---------------------------------------------------------------------------

// Add a post to an album. The post's hashtags are auto-added to the album's tags.
router.post('/api/add/post', checkTokenValidity, async (req, res, next) => {
    const { postId, albumId } = req.body;

    try {
        if (!isId(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID." });
        }

        const album = await loadOwnedAlbum(req, res, albumId);
        if (!album) return;

        const post = await Post.findById(postId).select("hashtags");
        if (!post) {
            return res.status(404).json({ success: false, message: "Post does not exist." });
        }

        if (!album.postId.some(id => id.equals(post._id))) {
            album.postId.push(post._id);
        }
        album.hashtags = mergeTags(album.hashtags, post.hashtags);
        await album.save();
        await Post.findByIdAndUpdate(post._id, { $addToSet: { albums: album._id } });

        return res.status(200).json({ success: true, message: "Post added to album.", album });
    } catch (error) {
        next(error);
    }
});

// Remove a post from an album (the post itself stays). Body: { postId, albumId }
router.post('/api/remove/album/:id', checkTokenValidity, async (req, res, next) => {
    const postId = req.body.postId;
    const albumId = req.body.albumId || req.params.id;

    try {
        if (!isId(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID." });
        }

        const album = await loadOwnedAlbum(req, res, albumId);
        if (!album) return;

        album.postId = album.postId.filter(id => id.toString() !== postId);
        await album.save();
        await Post.findByIdAndUpdate(postId, { $pull: { albums: album._id } });

        // Tags are left as they are: the owner may have curated them by hand
        return res.status(200).json({ success: true, message: "Post removed from album.", album });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
