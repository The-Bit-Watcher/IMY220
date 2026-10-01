const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Album = require('../models/Albums');
const checkTokenValidity = require('../Middleware/jwtVerifyMiddleware');


// Middleware to enforce Admin role
const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
    }
    next();
};

//  Get all reported posts with aggregated reasons
router.get('/api/admin/reports', checkTokenValidity, verifyAdmin, async (req, res, next) => {
    try {
        const reports = await Report.find()
            .populate('postId')
            .populate('reportedBy', 'username email')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, reports });
    } catch (error) {
        next(error);
    }
});

// Dismiss reports for a post (Keep post, remove reports)
router.delete('/api/admin/reports/post/:postId', checkTokenValidity, verifyAdmin, async (req, res, next) => {
    try {
        await Report.deleteMany({ postId: req.params.postId });
        return res.status(200).json({ success: true, message: "Reports dismissed for this post." });
    } catch (error) {
        next(error);
    }
});

// Admin Delete Post (Cascade delete post, comments, reports)
router.delete('/api/admin/posts/:postId', checkTokenValidity, verifyAdmin, async (req, res, next) => {
    const { postId } = req.params;
    try {
        await Post.findByIdAndDelete(postId);
        await Comment.deleteMany({ postId });
        await Report.deleteMany({ postId });

        // Update albums containing this post
        await Album.updateMany({ posts: postId }, { $pull: { posts: postId } });

        return res.status(200).json({ success: true, message: "Post removed by admin successfully." });
    } catch (error) {
        next(error);
    }
});

module.exports = router;