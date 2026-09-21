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
//add albums here. Make it easier later. to get the album it is in ? Maybe or filter ??

module.exports = mongoose.model(
    "Post",
    PostSchema
)