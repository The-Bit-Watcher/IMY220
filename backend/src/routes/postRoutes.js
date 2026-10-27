//will be used for endpoints used by a Post in the system. The normal crud for post.
// Will have a separate for Album, meaning addition and removal+creation adn deletion
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const checkTokenValidity = require("../Middleware/jwtVerifyMiddleware");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const Album = require("../models/Albums");
const Post = require("../models/Post");
const { default: mongoose } = require("mongoose");

//get Posts of User, use the jwt to get the item.
router.get('/api/get/posts/me', checkTokenValidity, async (req, res) => {
    try{
        const existingUser = await User.findById(req.user.userId);

        //no user then no posts. 
        if (!existingUser){
            return res.status(404).json({
                message: "User not found!"
            });
        }

        //so user exist, find posts or return []
        const posts = await Post.find({ userId: existingUser._id }).sort({ createdAt: -1 });
        //might have to change structure need to add in which albums they are in
        //your posts. Used in profile page
        //using a tab will call this when on that tab page
        //different componet
        res.status(200).json({
            success: true,
            posts: posts || []
        })
    }catch{
        res.status(500).json({
            success: false,
            posts: []
        });
    }
});

//global feed
router.get('/api/get/global', checkTokenValidity, async (req, res, next) => {
    try {
        const { sortBy, tag } = req.query;
        let filter = {};

        // Filter out hidden/reported posts (reported > 2 times)
        // Fetch posts that have <= 2 reports
        const heavilyReportedPosts = await Report.aggregate([
            { $group: { _id: "$postId", count: { $sum: 1 } } },
            { $match: { count: {$gt: 2 } } }
        ]);
        const hiddenPostIds = heavilyReportedPosts.map(r => r._id);
        filter._id = { $nin: hiddenPostIds };

        // Filter by Hashtag if requested
        if (tag) {
            filter.hashtags = tag.replace(/^#/, '').toLowerCase(); // stored without '#'
        }

        let postsQuery = Post.find(filter);

        // Dynamic Sorting
        if (sortBy === 'popular' || sortBy === 'comments') {
            // Aggregate comment counts for sorting
            const posts = await Post.aggregate([
                { $match: filter },
                {
                    $lookup: {
                        from: 'comments',
                        localField: '_id',
                        foreignField: 'postId',
                        as: 'commentList'
                    }
                },
                {
                    $addFields: { commentCount: { $size: '$commentList' } }
                },
                { $sort: { commentCount: -1, createdAt: -1 } }
            ]);
            return res.status(200).json({ success: true, posts });
        } else {
            const posts = await postsQuery
                .select("-likedBy")
                .populate("userId", "username name profileImage")
                .sort({ createdAt: -1 })
                .lean();
            return res.status(200).json({ success: true, posts });
        }
    } catch (error) {
        next(error);
    }
});

// Local Feed (Friends + Favorites with Sorting)
router.get("/api/get/local", checkTokenValidity, async (req, res, next) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }

    // Fetch current user's friends and favorites
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const friendIds = currentUser.friends || [];
    const favouriteIds = currentUser.favouriteIds || [];
    const allowedUserIds = [...friendIds, ...favouriteIds];

    // Fetch posts created by friends or favorites
    const posts = await Post.find({ userId: { $in: allowedUserIds } })
      .populate("userId", "username name profileImage")
      .sort({ createdAt: -1 })
      .lean();

    // Mark posts created by favorites
    const formattedPosts = posts.map(post => ({
      ...post,
      isFavorite: favouriteIds.some(id => id.toString() === post.userId?._id?.toString())
    }));

    return res.status(200).json({
      success: true,
      posts: formattedPosts
    });
  } catch (error) {
    next(error);
  }
});

router.get('/api/get/post/:id', checkTokenValidity, async (req, res, next) => {
    try{
        const postId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Post ID format"
            });
        }

        const currentUserId = req.user.userId;

        const post = await Post.findById(postId)
            .populate("userId", "username name profileImage")
            .lean();

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        const [comments, myAlbums, myReport, reportCount] = await Promise.all([
            Comment.find({ postId: post._id })
                .populate("userId", "username name profileImage")
                .sort({ createdAt: -1 }),
            // Which of MY albums already contain this post (for the "Add to album" picker)
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
                likedByMe: likedBy.some(id => id.toString() === currentUserId),
                commentCount: comments.length,
                hidden: reportCount > 2
            },
            comments: comments,
            myAlbumIds: myAlbums.map(a => a._id),
            reportedByMe: !!myReport
        });
        }catch(error){
            next(error);
        }
});

//create post
router.post('/api/create/posts', checkTokenValidity, async (req, res, next) => {
    const { caption, image, hashtags, albumIds = [] } = req.body;

    try {
        // Basic validation
        if (!caption || !String(caption).trim() || !image) {
            return res.status(400).json({
                success: false,
                message: "Caption and image are required."
            });
        }
        // Only data-URL images (from the upload) or http(s) links
        if (!/^data:image\/(png|jpe?g|gif|webp);base64,/.test(image) && !/^https?:\/\//.test(image)) {
            return res.status(400).json({
                success: false,
                message: "Image must be an uploaded picture or an http(s) link."
            });
        }

        const formattedHashtags = Post.formatHashtags(hashtags);

        // Only albums the creator owns
        const validAlbumIds = (Array.isArray(albumIds) ? albumIds : []).filter(id => mongoose.Types.ObjectId.isValid(id));
        const albums = validAlbumIds.length
            ? await Album.find({ _id: { $in: validAlbumIds }, userId: req.user.userId })
            : [];

        // Pull userId directly from JWT middleware for security
        const post = await Post.create({
            userId: req.user.userId,
            caption: String(caption).trim().slice(0, 2200),
            image: image,
            hashtags: formattedHashtags,
            likes: 0,
            albums: albums.map(a => a._id)
        });

        // Put it in the chosen albums and auto-add its tags to each album
        for (const album of albums) {
            album.postId.push(post._id);
            album.hashtags = [...new Set([...(album.hashtags || []), ...formattedHashtags])];
            await album.save();
        }

        return res.status(201).json({
            success: true,
            post: post
        });
    } catch (error) {
        next(error);
    }
});

//update post, might have a different one for the likes.
router.put('/api/update/post/:id', checkTokenValidity, async (req, res, next) => {
    const postId = req.params.id;
    const { caption, image, hashtags } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Post ID format."
            });
        }

        // Find the post by ID
        const existingPost = await Post.findById(postId);

        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: "Post not found."
            });
        }

        // Authorization check: Ensure only the creator can update the post
        if (existingPost.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can only update your own posts."
            });
        }

        // Apply updates if values are provided
        if (caption !== undefined) existingPost.caption = caption;
        if (image !== undefined) existingPost.image = image;
        if (hashtags !== undefined){
            existingPost.hashtags = Post.formatHashtags(hashtags);
        }

        // Save updated document
        const updatedPost = await existingPost.save();

        return res.status(200).json({
            success: true,
            post: updatedPost
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/api/delete/post/:id', checkTokenValidity, async (req, res, next) => {
    const postId = req.params.id;

    try {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found." });
        }

        if (post.userId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "Unauthorized: You can only delete your own posts." });
        }

        // Delete the post
        await Post.findByIdAndDelete(postId);

        //Delete linked comments and reports
        await Comment.deleteMany({ postId });
        await Report.deleteMany({ postId });

        // Find albums containing this post
        const parentAlbums = await Album.find({ postId: postId });

        // Remove the post from albums; albums themselves are kept even if they end up empty
        for (let album of parentAlbums) {
            album.postId = album.postId.filter(pId => pId.toString() !== postId);
            await album.save();
        }

        return res.status(200).json({
            success: true,
            message: "Post deleted and parent albums cleaned up successfully."
        });
    } catch (error) {
        next(error);
    }
});

//like / unlike a post (toggle). Atomic so double-clicks can't double count.
router.post('/api/posts/:id/like', checkTokenValidity, async (req, res, next) => {
    const postId = req.params.id;
    const userId = req.user.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        // Try to like (only matches if not liked yet)
        let post = await Post.findOneAndUpdate(
            { _id: postId, likedBy: { $ne: userId } },
            { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
            { new: true }
        ).select("likes");

        let liked = true;
        if (!post) {
            // Already liked -> unlike
            post = await Post.findOneAndUpdate(
                { _id: postId, likedBy: userId },
                { $pull: { likedBy: userId }, $inc: { likes: -1 } },
                { new: true }
            ).select("likes");
            liked = false;
        }

        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found." });
        }

        return res.status(200).json({ success: true, liked, likes: Math.max(0, post.likes) });
    } catch (error) {
        next(error);
    }
});

//add comments
router.post('/api/posts/:id/comments', checkTokenValidity, async (req, res, next) => {
    const postId = req.params.id;
    const { text } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Post ID format."
            });
        }

        if (!text || text.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Comment text cannot be empty."
            });
        }

        const postExists = await Post.exists({ _id: postId });
        if (!postExists) {
            return res.status(404).json({
                success: false,
                message: "Post not found."
            });
        }

        const created = await Comment.create({
            postId: postId,
            userId: req.user.userId,
            text: text.trim()
        });
        const comment = await created.populate("userId", "username name profileImage");

        return res.status(201).json({
            success: true,
            comment: comment
        });
    } catch (error) {
        next(error);
    }
});

//get comments
router.get('/api/posts/:id/comments', checkTokenValidity, async (req, res, next) => {
    const postId = req.params.id;

    try {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Post ID format."
            });
        }

        const comments = await Comment.find({ postId: postId })
            .populate("userId", "username name profileImage")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            comments: comments
        });
    } catch (error) {
        next(error);
    }
});

//delete a comment
router.delete('/api/comments/:id', checkTokenValidity, async (req, res, next) => {
    const commentId = req.params.id;
    const userId = req.user.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Comment ID format."
            });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found."
            });
        }

        const post = await Post.findById(comment.postId);

        // Allow deletion if requester is the comment author OR post owner
        const isCommentAuthor = comment.userId.toString() === userId;
        const isPostOwner = post && post.userId.toString() === userId;

        if (!isCommentAuthor && !isPostOwner) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You cannot delete this comment."
            });
        }

        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully."
        });
    } catch (error) {
        next(error);
    }
});

//report a post
router.post('/api/posts/:id/report', checkTokenValidity, async (req, res, next) => {
    const postId = req.params.id;
    const { reason, additionalDetails } = req.body;
    const userId = req.user.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Post ID format."
            });
        }

        const postExists = await Post.exists({ _id: postId });
        if (!postExists) {
            return res.status(404).json({
                success: false,
                message: "Post not found."
            });
        }

        // Check for existing report from same user
        const existingReport = await Report.findOne({ postId: postId, reportedBy: userId });
        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: "You have already reported this post."
            });
        }

        const report = await Report.create({
            postId: postId,
            reportedBy: userId,
            reason: reason || "Other",
            additionalDetails: additionalDetails || ""
        });

        return res.status(201).json({
            success: true,
            message: "Post reported successfully. Our team will review it.",
            report: report
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;