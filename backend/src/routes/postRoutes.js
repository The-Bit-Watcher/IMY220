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
            filter.hashtags = tag.startsWith('#') ? tag : `#${tag}`;
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
            const posts = await postsQuery.sort({ createdAt: -1 });
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

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        //get comments
        const comments = await Comment.find({ postId: post._id }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            post: post,
            comments: comments
        });
        }catch(error){
            next(error);
        }
});

//create post
router.post('/api/create/posts', checkTokenValidity, async (req, res, next) => {
    const { caption, image, hashtages } = req.body;

    try {
        // Basic validation
        if (!caption || !image) {
            return res.status(400).json({
                success: false,
                message: "Caption and image are required."
            });
        }

        const formattedHashtags = Post.formattedHashtags(hashtages);

        // Pull userId directly from JWT middleware for security
        const post = await Post.create({
            userId: req.user.userId,
            caption: caption,
            image: image,
            hashtags: formattedHashtags,
            likes: 0
        });

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
            existingPost.hashtags = Post.formattedHashtags(hashtags);
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
        const parentAlbums = await Album.find({ posts: postId });

        for (let album of parentAlbums) {
            // Remove post ID from album
            album.posts = album.posts.filter(pId => pId.toString() !== postId);

            //If album is now empty, delete the album
            if (album.posts.length === 0) {
                await Album.findByIdAndDelete(album._id);
            } else {
                await album.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Post deleted and parent albums cleaned up successfully."
        });
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

        const comment = await Comment.create({
            postId: postId,
            userId: req.user.userId,
            text: text
        });

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
            .populate("userId", "username profilePicture") // Optional: populate user info
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