const User = require("../models/User");
const checkTokenValidity = require("../Middleware/jwtVerifyMiddleware");
const Comment = require("../models/Comment");
const Album = require("../models/Albums");
const Post = require("../models/Post");
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


//edit album


//add to an album


//remove from an album

