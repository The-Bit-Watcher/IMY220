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
        hashtags: [
            {
                type: String,
                trim: true,
                lowercase: true // Normalizes tags to lowercase for easier searching/filtering
            }
        ],
        likes: {
            type: Number,
            default: 0
        },
        // Who liked the post, so a user can only like once and can unlike
        likedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
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

PostSchema.statics.formatHashtags = function(tags) {
    if (!tags) return [];
    
    // If sent as a comma-separated string or space-separated string (e.g. "#art, #nature" or "art nature")
    if (typeof tags === "string") {
        return tags
            .split(/[\s,]+/)
            .map(tag => tag.replace(/^#/, "").trim().toLowerCase())
            .filter(Boolean);
    }
    
    // If sent as an array (e.g. ["#art", "nature"])
    if (Array.isArray(tags)) {
        return tags
            .map(tag => String(tag).replace(/^#/, "").trim().toLowerCase())
            .filter(Boolean);
    }

    return [];
};

module.exports = mongoose.model("Post", PostSchema);