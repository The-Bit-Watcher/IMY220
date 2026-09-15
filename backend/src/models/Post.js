const mongoose = require("mongoose");

const PostSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model(
    "Post",
    PostSchema
)