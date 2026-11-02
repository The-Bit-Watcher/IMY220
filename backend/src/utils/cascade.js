// Deletes that must clean up everything linked to the deleted document.
// Shared by the owner routes and the admin routes so the logic lives in one place.
const User = require("../models/User");
const Post = require("../models/Post");
const Album = require("../models/Albums");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const VerificationRequest = require("../models/VerificationRequest");

async function deletePostCascade(postId) {
    await Comment.deleteMany({ postId });
    await Report.deleteMany({ postId });
    await Album.updateMany({ postId }, { $pull: { postId } });
    await Post.findByIdAndDelete(postId);
}

// Removes a user and everything that belongs to them. The user document goes last,
// so if anything fails part-way the account still exists and the delete can be retried.
async function deleteUserCascade(userId) {
    const postIds = (await Post.find({ userId }).select("_id").lean()).map((p) => p._id);

    // Comments the user wrote + every comment on the user's posts
    await Comment.deleteMany({ $or: [{ userId }, { postId: { $in: postIds } }] });
    // Reports the user filed + reports against the user's posts
    await Report.deleteMany({ $or: [{ reportedBy: userId }, { postId: { $in: postIds } }] });
    // The user's albums, and the user's posts inside other people's albums
    await Album.deleteMany({ userId });
    await Album.updateMany({ postId: { $in: postIds } }, { $pull: { postId: { $in: postIds } } });
    // Undo the user's likes on other people's posts
    await Post.updateMany({ likedBy: userId }, { $pull: { likedBy: userId }, $inc: { likes: -1 } });
    await Post.deleteMany({ userId });
    await VerificationRequest.deleteMany({ userId });
    // Remove the user from everyone's friends / favourites / pending requests
    await User.updateMany({}, {
        $pull: { friends: userId, favouriteIds: userId, friendRequests: userId, sentRequests: userId }
    });
    await User.findByIdAndDelete(userId);
}

module.exports = { deletePostCascade, deleteUserCascade };
