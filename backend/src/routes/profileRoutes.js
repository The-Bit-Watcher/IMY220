const User = require("../models/User");
const checkTokenValidity = require("../Middleware/jwtVerifyMiddleware");
const Comment = require("../models/Comment");
const Album = require("../models/Albums");
const Post = require("../models/Post");
const { default: mongoose } = require("mongoose");

//crud operations for profile page. Will get whole object with old val as defaults in new vals and then overwrite. Then send to backend
//afterwards update mongodb. 
//album creation and post creation if remember correctly here as well but split up in own routes and controller for better managment


//use me. Not to give away any details ? We know who you are based on jwt! 
//path then check if token is valid then request and response
//the user/admin when doing rbac will be implemented later. Its authMiddleware files have been made but empty so far
app.get('/api/profile/me', checkTokenValidity, async(req, res, next) => {
    //only get his details. The images and friends will be seperate endpoints. 
    // So we can minimize data flow only on required component switches+ reuse
    //comes from the jwt, check authController and checkTokenValidity
    try{
        const existingUser = User.findById(req.user.userId);

        if (!existingUser){
            return res.status(404).json({
                message: "User not found!"
            });
        }

        return res.status(200).json({
            success: true,
            payload: existingUser
        })
    }catch(error){
        next(error)
    }
});

//might add soft delete and on sign in cancels it ???
app.delete("/api/profile/me", checkTokenValidity, async (req, res, next) => {
        const userId = req.user.userId;
        const session = await mongoose.startSession();

        try {
            session.startTransaction();
            // Check that the user exists
            const existingUser = await User.findById(userId).session(session);
            if (!existingUser) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    message: "User not found!"
                });
            }
            // Find all posts belonging to this user
            const userPosts = await Post
                .find({ userId })
                .select("_id")
                .session(session);
            const postIds = userPosts.map(post => post._id);
            // Delete comments written by this user
            await Comment.deleteMany(
                { userId },
                { session }
            );
            // Delete comments belonging to the user's posts
            await Comment.deleteMany(
                { postId: { $in: postIds } },
                { session }
            );
            // Delete the user's posts
            await Post.deleteMany(
                { userId },
                { session }
            );
            // Delete the user's albums
            await Album.deleteMany(
                { userId },
                { session }
            );
            // Finally delete the user
            await User.findByIdAndDelete(
                userId,
                { session }
            );
            await session.commitTransaction();

            return res.status(200).json({
                success: true,
                message: "Account and associated data deleted successfully."
            });
        } catch (error) {
            await session.abortTransaction();
            next(error);
        } finally {
            await session.endSession();
        }
    });


app.put('/api/profile/me', checkTokenValidity, async (req, res, next) => {
    //will be used for all updates, except friends and favourites. Will have their own designated endpoints. 
    // This will be your overall profile excluding friebds + fav. 
    const {username, name, email, password, bio, profileImage, location} = req.body;

    const updates = {};

    if (username !== undefined) updates.username = username;
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (location !== undefined) updates.location = location;
    
    try{
        const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        updates,
        { new: true });

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        //use this as state when User changes cause re-render in useEffect.
        return res.status(200).json({
            success: true,
            data: updatedUser
        });
    }catch(error){
        next(error);
    }
});