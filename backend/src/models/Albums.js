const mongoose = require("mongoose");

const AlbumSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    postId: [{//not required can make a album with no posts in yet. Then add later
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }]
});

module.exports = mongoose.Model(
    "Album",
    AlbumSchema
)