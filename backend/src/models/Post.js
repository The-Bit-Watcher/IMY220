const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true // Indexed for fast queries on user profile / local feed
        },
        caption: {
            type: String,
            required: true,
            trim: true
        },
        image: {
            type: String,
            required: true
        },
        likes: {
            type: Number,
            default: 0
        },
        // Array of Album IDs this post belongs to
        albums: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Album"
            }
        ]
    },
    { 
        timestamps: true // Automatically manages createdAt and updatedAt fields
    }
);

module.exports = mongoose.model("Post", PostSchema);