// Posts, feeds, likes, comments and reports
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const ReportReason = require("../models/ReportReason");
const Album = require("../models/Albums");
const { requireAuth } = require("../Middleware/auth");
const { deletePostCascade } = require("../utils/cascade");
const { isId, sameId } = require("../utils/ids");
const { HIDE_AFTER_REPORTS, hiddenPostIds } = require("../utils/reports");
const AUTHOR_FIELDS = "username name profileImage role verified";

const badId = (res, what = "Post") =>
    res.status(400).json({ success: false, message: `Invalid ${what} ID.` });

// Feed query shared by the global and local feeds: hides heavily reported posts,
// adds the author and a comment count, and sorts by newest or most commented.
async function feedPosts(match, sortBy) {
    const sort = sortBy === "comments" ? { commentCount: -1, createdAt: -1 } : { createdAt: -1 };
    const posts = await Post.aggregate([
        { $match: { ...match, _id: { $nin: await hiddenPostIds() } } },
        { $lookup: { from: "comments", localField: "_id", foreignField: "postId", pipeline: [{ $count: "n" }], as: "c" } },
        { $addFields: { commentCount: { $ifNull: [{ $first: "$c.n" }, 0] } } },
        { $project: { c: 0, likedBy: 0 } },
        { $sort: sort },
        { $limit: 200 }
    ]);
    return Post.populate(posts, { path: "userId", select: AUTHOR_FIELDS });
}

// Owner or admin may change a post. Sends the error itself and returns null on failure.
async function loadManageablePost(req, res) {
    if (!isId(req.params.id)) {
        badId(res);
        return null;
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
        res.status(404).json({ success: false, message: "Post not found." });
        return null;
    }
    if (!sameId(post.userId, req.user.userId) && !req.user.isAdmin) {
        res.status(403).json({ success: false, message: "You can only change your own posts." });
        return null;
    }
    return post;
}

// ---------------------------------------------------------------------------
// Feeds
// ---------------------------------------------------------------------------
router.get("/api/get/global", requireAuth, async (req, res) => {
    const match = {};
    if (req.query.tag) match.hashtags = String(req.query.tag).replace(/^#/, "").toLowerCase();
    const posts = await feedPosts(match, req.query.sortBy);
    return res.status(200).json({ success: true, posts });
});

// Local feed: my own posts + my friends' posts. Favourites are flagged so the UI can pin them.
router.get("/api/get/local", requireAuth, async (req, res) => {
    const me = await User.findById(req.user.userId).select("friends favouriteIds").lean();
    const ids = [me._id, ...(me.friends || [])];
    const favourites = new Set((me.favouriteIds || []).map(String));

    const posts = await feedPosts({ userId: { $in: ids } }, req.query.sortBy);
    return res.status(200).json({
        success: true,
        posts: posts.map((p) => ({ ...p, isFavorite: favourites.has(String(p.userId?._id)) }))
    });
});

// ---------------------------------------------------------------------------
// Single post
// ---------------------------------------------------------------------------
router.get("/api/get/post/:id", requireAuth, async (req, res) => {
    if (!isId(req.params.id)) return badId(res);
    const currentUserId = req.user.userId;

    const post = await Post.findById(req.params.id).populate("userId", AUTHOR_FIELDS).lean();
    if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
    }

    const [comments, myAlbums, myReport, reportCount] = await Promise.all([
        Comment.find({ postId: post._id }).populate("userId", AUTHOR_FIELDS).sort({ createdAt: -1 }).lean(),
        Album.find({ userId: currentUserId, postId: post._id }).select("_id").lean(),
        Report.exists({ postId: post._id, reportedBy: currentUserId }),
        Report.countDocuments({ postId: post._id })
    ]);

    const likedBy = post.likedBy || [];
    delete post.likedBy; // don't ship the full list of likers

    return res.status(200).json({
        success: true,
        post: {
            ...post,
            likedByMe: likedBy.some((id) => sameId(id, currentUserId)),
            commentCount: comments.length,
            hidden: reportCount > HIDE_AFTER_REPORTS,
            reportCount: req.user.isAdmin ? reportCount : undefined
        },
        comments,
        myAlbumIds: myAlbums.map((a) => a._id),
        reportedByMe: !!myReport
    });
});

router.post("/api/create/posts", requireAuth, async (req, res) => {
    const { caption, image, hashtags, albumIds = [] } = req.body;

    if (!caption || !String(caption).trim() || !image) {
        return res.status(400).json({ success: false, message: "Caption and image are required." });
    }
    // Only data-URL images (from the upload) or http(s) links
    if (!/^data:image\/(png|jpe?g|gif|webp);base64,/.test(image) && !/^https?:\/\//.test(image)) {
        return res.status(400).json({ success: false, message: "Image must be an uploaded picture or an http(s) link." });
    }

    const formattedHashtags = Post.formatHashtags(hashtags);

    // Only albums the creator owns
    const validAlbumIds = (Array.isArray(albumIds) ? albumIds : []).filter(isId);
    const albums = validAlbumIds.length
        ? await Album.find({ _id: { $in: validAlbumIds }, userId: req.user.userId })
        : [];

    const post = await Post.create({
        userId: req.user.userId,
        caption: String(caption).trim().slice(0, 2200),
        image,
        hashtags: formattedHashtags,
        albums: albums.map((a) => a._id)
    });

    // Put it in the chosen albums and auto-add its tags to each album
    for (const album of albums) {
        album.postId.push(post._id);
        album.hashtags = [...new Set([...(album.hashtags || []), ...formattedHashtags])];
        await album.save();
    }

    return res.status(201).json({ success: true, post });
});

// Edit caption / hashtags (owner or admin). The image can't be changed after publishing.
router.put("/api/update/post/:id", requireAuth, async (req, res) => {
    const post = await loadManageablePost(req, res);
    if (!post) return;

    const { caption, hashtags } = req.body;
    if (caption !== undefined) {
        if (!String(caption).trim()) {
            return res.status(400).json({ success: false, message: "Caption cannot be empty." });
        }
        post.caption = String(caption).trim().slice(0, 2200);
    }
    if (hashtags !== undefined) post.hashtags = Post.formatHashtags(hashtags);

    await post.save();
    return res.status(200).json({ success: true, post });
});

// Delete a post and everything linked to it (owner or admin)
router.delete("/api/delete/post/:id", requireAuth, async (req, res) => {
    const post = await loadManageablePost(req, res);
    if (!post) return;

    await deletePostCascade(post._id);
    return res.status(200).json({ success: true, message: "Post deleted." });
});

// Like / unlike (toggle). Atomic so double-clicks can't double count.
router.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.userId;
    if (!isId(postId)) return badId(res);

    let post = await Post.findOneAndUpdate(
        { _id: postId, likedBy: { $ne: userId } },
        { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
        { returnDocument: "after" }
    ).select("likes");

    let liked = true;
    if (!post) {
        post = await Post.findOneAndUpdate(
            { _id: postId, likedBy: userId },
            { $pull: { likedBy: userId }, $inc: { likes: -1 } },
            { returnDocument: "after" }
        ).select("likes");
        liked = false;
    }

    if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
    }
    return res.status(200).json({ success: true, liked, likes: Math.max(0, post.likes) });
});

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------
router.get("/api/posts/:id/comments", requireAuth, async (req, res) => {
    if (!isId(req.params.id)) return badId(res);
    const comments = await Comment.find({ postId: req.params.id })
        .populate("userId", AUTHOR_FIELDS)
        .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, comments });
});

router.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    const postId = req.params.id;
    const text = String(req.body?.text || "").trim();

    if (!isId(postId)) return badId(res);
    if (!text) {
        return res.status(400).json({ success: false, message: "Comment cannot be empty." });
    }
    if (!(await Post.exists({ _id: postId }))) {
        return res.status(404).json({ success: false, message: "Post not found." });
    }

    const created = await Comment.create({ postId, userId: req.user.userId, text: text.slice(0, 1000) });
    const comment = await created.populate("userId", AUTHOR_FIELDS);
    return res.status(201).json({ success: true, comment });
});

// Edit a comment: its author or an admin
router.put("/api/comments/:id", requireAuth, async (req, res) => {
    if (!isId(req.params.id)) return badId(res, "Comment");
    const text = String(req.body?.text || "").trim();
    if (!text) {
        return res.status(400).json({ success: false, message: "Comment cannot be empty." });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
        return res.status(404).json({ success: false, message: "Comment not found." });
    }
    if (!sameId(comment.userId, req.user.userId) && !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: "You can only edit your own comments." });
    }

    comment.text = text.slice(0, 1000);
    await comment.save();
    await comment.populate("userId", AUTHOR_FIELDS);
    return res.status(200).json({ success: true, comment });
});

// Delete a comment: its author, the post's owner, or an admin
router.delete("/api/comments/:id", requireAuth, async (req, res) => {
    if (!isId(req.params.id)) return badId(res, "Comment");

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
        return res.status(404).json({ success: false, message: "Comment not found." });
    }

    const post = await Post.findById(comment.postId).select("userId").lean();
    const allowed = sameId(comment.userId, req.user.userId)
        || sameId(post?.userId, req.user.userId)
        || req.user.isAdmin;
    if (!allowed) {
        return res.status(403).json({ success: false, message: "You cannot delete this comment." });
    }

    await comment.deleteOne();
    return res.status(200).json({ success: true, message: "Comment deleted." });
});

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
router.get("/api/report-reasons", requireAuth, async (req, res) => {
    const reasons = await ReportReason.find().sort({ createdAt: 1 }).lean();
    return res.status(200).json({ success: true, reasons });
});

router.post("/api/posts/:id/report", requireAuth, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.userId;
    const reason = String(req.body?.reason || "").trim();
    const additionalDetails = String(req.body?.additionalDetails || "").trim().slice(0, 500);

    if (!isId(postId)) return badId(res);

    const post = await Post.findById(postId).select("userId").lean();
    if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
    }
    if (sameId(post.userId, userId)) {
        return res.status(400).json({ success: false, message: "You cannot report your own post." });
    }
    if (!(await ReportReason.exists({ name: reason }))) {
        return res.status(400).json({ success: false, message: "Please choose a valid reason." });
    }
    if (await Report.exists({ postId, reportedBy: userId })) {
        return res.status(409).json({ success: false, message: "You have already reported this post." });
    }

    const report = await Report.create({ postId, reportedBy: userId, reason, additionalDetails });
    return res.status(201).json({
        success: true,
        message: "Post reported. An admin will review it.",
        report
    });
});

module.exports = router;
