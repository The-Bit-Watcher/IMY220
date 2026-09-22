const User = require("../models/User");
const checkTokenValidity = require("../Middleware/jwtVerifyMiddleware");
const Comment = require("../models/Comment");
const Album = require("../models/Albums");
const Post = require("../models/Post");
const {} = require("../controllers/albumController");
const { default: mongoose } = require("mongoose");

//get all albums
app.get('/api/get/albums/all', checkTokenValidity, async(req, res, next) => {

    try{
        const albums = await Album.find().sort({createdAt: -1});
        res.status(200).json({
            success: true,
            albums: albums || []
        });
    }catch(error){
        next(error);
    }
});

//get all users album
app.get('/api/get/albums/me', checkTokenValidity, async(req, res, next) => {

    const userId = req.user.userId;
    try{
        const existingUser = await User.findById(userId);

        if (!existingUser){
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        //get albums or empty array
        const albums = await Album.find({userId: existingUser._id}).sort({createdAt: -1});
        
        res.status(200).json({
            success: true,
            albums: albums || []
        });
    }catch(error){
        next(error);
    }
});


//get an albums details and posts
app.get('/api/get/album/:id', checkTokenValidity, async(req, res, next) => {

    const albumId = req.params.id;

    try{
        if (!mongoose.Types.ObjectId.isValid(albumId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Album ID format."
            });
        }

        const album = await Album.findById(albumId);

        if (!album){
            res.status(404).json({
                success: false,
                message: 'No such album exists'
            });
        }

        //need to get album and its posts inside it. we have the postIds
        //need to get the data for each post
        const posts = await Post.find({
            _id: { $in: album.postId || [] }
        }).sort({ createdAt: -1 });
        
        //return all album details with it post details
        //due to not being production with huge
        //will not handle many required loads.
        res.status(200).json({
            message: success,
            album: album,
            posts: posts
        });
    }catch(error){
        next(error)
    }
});

//delete an album(only delete the album leave posts intact)
app.delete('/api/delete/album/:id', checkTokenValidity, async(req, res, next) => {
    const userId = req.user._id;
    const albumId = req.params.id;

    try{ 
        if (!mongoose.Types.ObjectId.isValid(albumId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Album ID format."
            });
        }
        //check if both exists before moving on.
        const existingUser = await User.findById(userId); 
        const album = await Album.findById({_id: albumId});

        if (!existingUser){
            res.status(404).json({
                success: false, 
                message: "User not found"
            })
        }

        if (!album){
            res.status(404).json({
                success: false, 
                message: "Album not found"
            })
        }

        //hence not the owner trying to delete
        if (album.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You do not have rights to delete this album."
            });
        }

        //remove the album
        Album.findByIdandDelete(album._id);

        res.status(200).json({
            success: true,
            message: `${Album.title} deleted successfully`
        })
    }catch(error){
        next(error);
    }
});


//create an album
//hashtags auto updated based on images in it. 
app.post('/api/create/album', checkTokenValidity, async(req, res, next) => {
    //get the name, userId we get from jwt, and post are empty of of now
    //maybe later add a create for when you want to add to a album you can create and add
    //but will be done later if I have the neccessary time
    const {title} = req.body;

    try{
        // Basic validation
        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title are required."
            });
        }

        // Pull userId directly from JWT middleware for security
        const album = await Album.create({
            title: title,
            userId: req.user.userId,
            hashtags: [],
            postId: []
        });

        res.status(200).json({
            success: true,
            album: album
        })
    }catch(error){
        next(error);
    }
});

//edit album title. Hashtags will be auto changed based on posts in the album.
app.put('/api/update/album/:id', checkTokenValidity, async (req, res, next) => {
    const {title} = req.body;
    const albumId = req.params.id;
    const userId = req.user.userId;

    try{
        if (!mongoose.Types.ObjectId.isValid(albumId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Album ID format."
            });
        }

        if (!title){
            res.status(400).json({
                success: false,
                message: 'Bad request'
            })
        }

        //find album
        const album = await Album.findById(albumId);

        if (!album){
            res.status(404).json({
                success: false,
                message: "Album does not exist"
            });
        }

        //owner trying to edit is not owner
        if (album.userId.toString() !== userId){
            res.status(400).json({
                success: false,
                message: "You do not have the neccessary permission"
            });
        }

        album.title = title;

        const updatedAlbum = album.save();

        res.status(200).json({
            success: 200,
            album: updatedAlbum
        })
    }catch(error){
        next(error);
    }
});

//add to an album
app.post('/api/add/post', checkTokenValidity, async (req, res, next) => {
    const {postId, albumId} = req.body;
    const userId = req.user.userId;

    try{
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Post ID."
            });
        }
        const post = Post.findById(postId);

        if (!post){
            res.status(404).json({
                success: false,
                message: 'Post does not exist'
            });
        }

        const existingAlbum = await Album.findById(albumId);

        if (!existingAlbum){
             res.status(404).json({
                success: false,
                message: 'Album does not exist'
            });
        }

        if (existingAlbum.userId.toString() !== userId){
            res.status(400).json({
                success: false,
                message: "You do not have the neccessary permission"
            });
        }

        // Prevent duplicate post entries in array
        if (!existingAlbum.posts.some(id => id.equals(post._id))) {
            existingAlbum.posts.push(post._id);
        }

        // Recalculate unique hashtags for the album
        await syncAlbumHashtags(existingAlbum);
        await existingAlbum.save();

        res.status(200).json({
            success: true,
            message: 'Post added successfully',
            album: existingAlbum
        })
    }catch(error){
        next(error);
    }
});

//remove from an album
app.post('/api/remove/album/:id', checkTokenValidity, async (req, res, next) => {
    const {postId, albumId} = req.body;
    const userId = req.user.userId;

    try{
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Post ID."
            });
        }
        const post = Post.findById(postId);

        if (!post){
            res.status(404).json({
                success: false,
                message: 'Post does not exist'
            });
        }

        const existingAlbum = await Album.findById(albumId);

        if (!existingAlbum){
             res.status(404).json({
                success: false,
                message: 'Album does not exist'
            });
        }

        if (existingAlbum.userId.toString() !== userId){
            res.status(400).json({
                success: false,
                message: "You do not have the neccessary permission"
            });
        }

        existingAlbum.posts = existingAlbum.posts.filter(id => id.toString() !== postId);

        // Recalculate unique hashtags for remaining posts
        await syncAlbumHashtags(existingAlbum);
        await existingAlbum.save();

        res.status(200).json({
            success: true,
            message: 'Post added successfully',
            album: existingAlbum
        })
    }catch(error){
        next(error);
    }
});
