//will be used for endpoints used by a Post in the system. The normal crud for post.
// Will have a separate for Album, meaning addition and removal+creation adn deletion

const User = require("../models/User");
const checkTokenValidity = require("../Middleware/jwtVerifyMiddleware");
const Comment = require("../models/Comment");
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
        const posts = await Post.findById({userId: existingUser._id});
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

        return res.status(200).json({
            success: true,
            post: post
        });
        }catch(error){
            next(error);
        }
});

//create post
app.post('/api/create/posts', checkTokenValidity, async (req, res, next) => {
    const { caption, image } = req.body;

    try {
        // Basic validation
        if (!caption || !image) {
            return res.status(400).json({
                success: false,
                message: "Caption and image are required."
            });
        }

        // Pull userId directly from JWT middleware for security
        const post = await Post.create({
            userId: req.user.userId,
            caption: caption,
            image: image,
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
    const { caption, image } = req.body;

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

