const mongoose = require("mongoose");

const CommentSchema = mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now //think only time where this should not be default is if we use a type of buffer or system goes down and .now differs from original
    }
});

module.exports = mongoose.Model(
    "Comment",
    CommentSchema
)