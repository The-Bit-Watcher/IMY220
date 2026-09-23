//will be used for endpoints used by a Post in the system. The normal crud for post.
// Will have a separate for Album, meaning addition and removal+creation adn deletion

const User = require("../models/User");
const checkTokenValidity = require("../Middleware/jwtVerifyMiddleware");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const Album = require("../models/Albums");
const Post = require("../models/Post");
const { default: mongoose } = require("mongoose");

//get Posts of User, use the jwt to get the item.
app.get('/api/get/posts/me', checkTokenValidity, async (req, res) => {
    try{
        const existingUser = User.findById(req.user.userId);

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
app.get('/api/get/global', checkTokenValidity, async (req, res) => {
    try{
        //get all from posts. 
        const posts = await Post.find();
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

//local feed. Friends, with fav at the top
//get all frineds post and then filter for favourites at the top,
//or on collection add it to the front if he is a fav.
app.get('/api/get/local', checkTokenValidity, async (req, res, next) => {
    try{
        //we have a friends and favourteids
        const existingUser = await User.findById(req.user.userId);

        //no user then no posts. 
        if (!existingUser){
            return res.status(404).json({
                message: "User not found!"
            });
        }

        //have the required friends+fav
        const friendsList = existingUser.friends || [];
        const favoritesList = existingUser.favouriteIds || [];

        const allRelevantUserIds = [...new Set([...friendsList, ...favoritesList])];

        const posts = await Post.find({
            userId: { $in: allRelevantUserIds }
        }).sort({ createdAt: -1 });

        // Sort results: Favorite users' posts first, then standard friends' posts
        const sortedPosts = posts.sort((a, b) => {
            const aIsFav = favoritesList.some(id => id.equals(a.userId));
            const bIsFav = favoritesList.some(id => id.equals(b.userId));

            if (aIsFav && !bIsFav) return -1;
            if (!aIsFav && bIsFav) return 1;
            return 0; // retain chronological sorting from query
        });

        return res.status(200).json({
            success: true,
            posts: sortedPosts
        });
    }catch(error){
        next(error);
    }
});

app.get('/api/get/post/:id', checkTokenValidity, async (req, res, next) => {
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
        const comments = await Post.find({postId: post._id})

        return res.status(200).json({
            success: true,
            post: post,
            commments: comments
        });
        }catch(error){
            next(error);
        }
});

//create post
app.post('/api/create/posts', checkTokenValidity, async (req, res, next) => {
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
app.put('/api/update/post/:id', checkTokenValidity, async (req, res, next) => {
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

app.delete('/api/delete/post/:id', checkTokenValidity, async (req, res, next) => {
    const postId = req.params.id;

    try {
        // 1. Validate ID format
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Post ID format."
            });
        }

        // 2. Find post
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found."
            });
        }

        // 3. Authorization check: Ensure only owner can delete
        if (post.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can only delete your own posts."
            });
        }

        // 4. Delete the post from MongoDB
        await Post.findByIdAndDelete(postId);

        // 5. Cleanup related documents (Cascade Delete)
        // Delete all comments linked to this post
        await Comment.deleteMany({ postId: postId });

        // Remove post reference from any Albums containing it
        await Album.updateMany(
            { posts: postId },
            { $pull: { posts: postId } }
        );

        return res.status(200).json({
            success: true,
            message: "Post and associated comments deleted successfully."
        });
    } catch (error) {
        next(error);
    }
});

//add comments
app.post('/api/posts/:id/comments', checkTokenValidity, async (req, res, next) => {
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
app.get('/api/posts/:id/comments', checkTokenValidity, async (req, res, next) => {
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
app.delete('/api/comments/:id', checkTokenValidity, async (req, res, next) => {
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
app.post('/api/posts/:id/report', checkTokenValidity, async (req, res, next) => {
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
