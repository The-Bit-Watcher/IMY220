const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Album = require("../models/Albums");
const Post = require("../models/Post");
const { redisClient } = require("../config/redis");
const { requireAuth } = require("../Middleware/auth");
const { deleteUserCascade } = require("../utils/cascade");
const { isId, sameId } = require("../utils/ids");
const { buildProfileUpdates } = require("../utils/profileUpdates");
const mongoose = require("mongoose");

// What anyone may see of anyone (spec: non-friends only see name + profile picture)
const BASIC_USER_FIELDS = "username name profileImage role verified";
// What friends / yourself / admins see
const FULL_USER_FIELDS = "username name profileImage role verified bio location joinedDate socialLinks";

const badId = (res) => res.status(400).json({ success: false, message: "Invalid user ID." });

// Self, friends and admins may see a user's complete profile, posts, albums and friends
async function canViewFull(viewer, targetId) {
    if (viewer.isAdmin || sameId(viewer.userId, targetId)) return true;
    return !!(await User.exists({ _id: targetId, friends: viewer.userId }));
}

// Shared guard for the "complete profile" endpoints
async function guardFullAccess(req, res) {
    const targetId = req.params.id;
    if (!isId(targetId)) {
        badId(res);
        return false;
    }
    if (!(await User.exists({ _id: targetId }))) {
        res.status(404).json({ success: false, message: "User not found." });
        return false;
    }
    if (!(await canViewFull(req.user, targetId))) {
        res.status(403).json({ success: false, message: "Only friends can see this." });
        return false;
    }
    return true;
}

// ---------------------------------------------------------------------------
// Own profile
// ---------------------------------------------------------------------------
router.get("/api/profile/me", requireAuth, async (req, res) => {
    const me = await User.findById(req.user.userId);
    return res.status(200).json({ success: true, payload: me });
});

router.put("/api/profile/me", requireAuth, async (req, res) => {
    const { updates, error } = buildProfileUpdates(req.body || {});
    if (error) return res.status(400).json({ success: false, message: error });

    const updatedUser = await User.findByIdAndUpdate(req.user.userId, updates, { returnDocument: "after", runValidators: true });
    return res.status(200).json({ success: true, data: updatedUser });
});

// Delete own account and everything that belongs to it. Asks for the password again.
router.delete("/api/profile/me", requireAuth, async (req, res) => {
    const password = String(req.body?.password || "");
    if (!password) {
        return res.status(400).json({ success: false, message: "Please enter your password to confirm." });
    }

    const me = await User.findById(req.user.userId).select("+password");
    if (me.password !== password) {
        return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    await deleteUserCascade(me._id);

    // Kill the current token so it can't be used after the account is gone
    const ttl = (req.user.exp || 0) - Math.floor(Date.now() / 1000);
    if (req.user.jti && ttl > 0) await redisClient.set(`revoked:${req.user.jti}`, "revoked", { EX: ttl });

    return res.status(200).json({ success: true, message: "Account and all associated data deleted." });
});

// ---------------------------------------------------------------------------
// View any profile
// ---------------------------------------------------------------------------
router.get("/api/users/:id", requireAuth, async (req, res) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;
    if (!isId(targetUserId)) return badId(res);

    const target = await User.findById(targetUserId)
        .select("friends friendRequests sentRequests favouriteIds email " + FULL_USER_FIELDS)
        .lean();
    if (!target) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    const me = await User.findById(currentUserId).select("favouriteIds").lean();
    const isSelf = sameId(targetUserId, currentUserId);
    const isFriend = (target.friends || []).some((id) => sameId(id, currentUserId));
    const fullAccess = isSelf || isFriend || req.user.isAdmin;

    let relationshipStatus = "none";
    if (isSelf) relationshipStatus = "self";
    else if (isFriend) relationshipStatus = "friends";
    else if ((target.friendRequests || []).some((id) => sameId(id, currentUserId))) relationshipStatus = "request_sent";
    else if ((target.sentRequests || []).some((id) => sameId(id, currentUserId))) relationshipStatus = "request_received";

    // Non-friends: name + picture only
    let user = { _id: target._id, name: target.name, username: target.username, profileImage: target.profileImage, role: target.role, verified: !!target.verified };

    if (fullAccess) {
        user = {
            ...user,
            bio: target.bio,
            location: target.location,
            joinedDate: target.joinedDate,
            socialLinks: target.socialLinks,
            friends: await User.find({ _id: { $in: target.friends || [] } }).select(BASIC_USER_FIELDS + " location").lean()
        };
    }

    // Email is private: only the owner and admins (who manage accounts) get it
    if (isSelf || req.user.isAdmin) user.email = target.email;

    if (isSelf) {
        // Incoming requests with names so they can be accepted from the profile
        user.friendRequests = await User.find({ _id: { $in: target.friendRequests || [] } }).select(BASIC_USER_FIELDS).lean();
        user.favouriteIds = target.favouriteIds || [];
    }

    return res.status(200).json({
        success: true,
        user,
        fullAccess,
        friendCount: fullAccess ? (target.friends || []).length : null,
        relationshipStatus,
        isFavorite: (me?.favouriteIds || []).some((id) => sameId(id, targetUserId))
    });
});

// Posts of a user (profile "Posts" tab) - self, friends and admins only
router.get("/api/users/:id/posts", requireAuth, async (req, res) => {
    if (!(await guardFullAccess(req, res))) return;

    const posts = await Post.find({ userId: req.params.id })
        .select("caption image hashtags likes createdAt userId")
        .populate("userId", "username name")
        .sort({ createdAt: -1 })
        .lean();
    return res.status(200).json({ success: true, posts });
});

// Albums of a user, with up to 4 cover images each - self, friends and admins only
router.get("/api/users/:id/albums", requireAuth, async (req, res) => {
    if (!(await guardFullAccess(req, res))) return;

    const albums = await Album.find({ userId: req.params.id })
        .populate({ path: "postId", select: "image createdAt", options: { sort: { createdAt: -1 } } })
        .sort({ _id: -1 })
        .lean();

    const formatted = albums.map((album) => {
        const posts = (album.postId || []).filter(Boolean); // drop refs to deleted posts
        return {
            _id: album._id,
            title: album.title,
            description: album.description,
            hashtags: album.hashtags || [],
            postCount: posts.length,
            coverImages: posts.slice(0, 4).map((p) => p.image)
        };
    });
    return res.status(200).json({ success: true, albums: formatted });
});

// ---------------------------------------------------------------------------
// Friend recommendations: friends-of-friends first (ranked by mutual friends),
// topped up with other users if there aren't enough.
// ---------------------------------------------------------------------------
router.get("/api/friends/recommendations", requireAuth, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 20);
    const me = await User.findById(req.user.userId).lean();

    const myFriends = me.friends || [];
    const excluded = new Set([
        me._id.toString(),
        ...myFriends.map(String),
        ...(me.sentRequests || []).map(String),
        ...(me.friendRequests || []).map(String)
    ]);

    const friendsOfMyFriends = await User.find({ _id: { $in: myFriends } }).select("friends").lean();
    const mutualCounts = new Map();
    for (const friend of friendsOfMyFriends) {
        for (const fofId of friend.friends || []) {
            const key = fofId.toString();
            if (excluded.has(key)) continue;
            mutualCounts.set(key, (mutualCounts.get(key) || 0) + 1);
        }
    }

    const rankedIds = [...mutualCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);

    let suggestions = await User.find({ _id: { $in: rankedIds } }).select(BASIC_USER_FIELDS).lean();
    suggestions = suggestions
        .map((u) => ({ ...u, mutualFriends: mutualCounts.get(u._id.toString()) || 0 }))
        .sort((a, b) => b.mutualFriends - a.mutualFriends);

    if (suggestions.length < limit) {
        const alreadyIn = [...excluded, ...rankedIds].map((id) => new mongoose.Types.ObjectId(id));
        const extra = await User.aggregate([
            { $match: { _id: { $nin: alreadyIn }, role: { $ne: "admin" } } },
            { $sample: { size: limit - suggestions.length } },
            { $project: { username: 1, name: 1, profileImage: 1, role: 1, verified: 1 } }
        ]);
        suggestions = suggestions.concat(extra.map((u) => ({ ...u, mutualFriends: 0 })));
    }

    return res.status(200).json({ success: true, users: suggestions });
});

// ---------------------------------------------------------------------------
// Friend requests
// ---------------------------------------------------------------------------
router.post("/api/friends/request/:id", requireAuth, async (req, res) => {
    const recipientId = req.params.id;
    const senderId = req.user.userId;

    if (!isId(recipientId)) return badId(res);
    if (sameId(senderId, recipientId)) {
        return res.status(400).json({ success: false, message: "You cannot send a friend request to yourself." });
    }

    const [recipient, sender] = await Promise.all([User.findById(recipientId), User.findById(senderId)]);
    if (!recipient) {
        return res.status(404).json({ success: false, message: "User not found." });
    }
    if (sender.friends.some((id) => sameId(id, recipientId))) {
        return res.status(400).json({ success: false, message: "You are already friends with this user." });
    }
    if (recipient.friendRequests.some((id) => sameId(id, senderId))) {
        return res.status(400).json({ success: false, message: "Friend request already sent." });
    }

    // They already asked me: accept instead of creating a crossed request
    if (sender.friendRequests.some((id) => sameId(id, recipientId))) {
        await User.findByIdAndUpdate(senderId, { $addToSet: { friends: recipientId }, $pull: { friendRequests: recipientId, sentRequests: recipientId } });
        await User.findByIdAndUpdate(recipientId, { $addToSet: { friends: senderId }, $pull: { sentRequests: senderId, friendRequests: senderId } });
        return res.status(200).json({ success: true, message: "You are now friends.", relationshipStatus: "friends" });
    }

    await User.findByIdAndUpdate(recipientId, { $addToSet: { friendRequests: senderId } });
    await User.findByIdAndUpdate(senderId, { $addToSet: { sentRequests: recipientId } });
    return res.status(200).json({ success: true, message: "Friend request sent.", relationshipStatus: "request_sent" });
});

router.post("/api/friends/accept/:id", requireAuth, async (req, res) => {
    const senderId = req.params.id;
    const currentUserId = req.user.userId;
    if (!isId(senderId)) return badId(res);

    const me = await User.findById(currentUserId).select("friendRequests").lean();
    if (!(me.friendRequests || []).some((id) => sameId(id, senderId))) {
        return res.status(400).json({ success: false, message: "No pending friend request from this user." });
    }

    await User.findByIdAndUpdate(currentUserId, { $addToSet: { friends: senderId }, $pull: { friendRequests: senderId } });
    await User.findByIdAndUpdate(senderId, { $addToSet: { friends: currentUserId }, $pull: { sentRequests: currentUserId } });
    return res.status(200).json({ success: true, message: "Friend request accepted." });
});

// Decline an incoming request OR cancel one you sent
router.post("/api/friends/reject/:id", requireAuth, async (req, res) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;
    if (!isId(targetUserId)) return badId(res);

    await User.findByIdAndUpdate(currentUserId, { $pull: { friendRequests: targetUserId, sentRequests: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $pull: { friendRequests: currentUserId, sentRequests: currentUserId } });
    return res.status(200).json({ success: true, message: "Friend request removed." });
});

router.delete("/api/friends/unfriend/:id", requireAuth, async (req, res) => {
    const friendId = req.params.id;
    const currentUserId = req.user.userId;
    if (!isId(friendId)) return badId(res);

    // Unfriending also removes the favourite in both directions
    await User.findByIdAndUpdate(currentUserId, { $pull: { friends: friendId, favouriteIds: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: currentUserId, favouriteIds: currentUserId } });
    return res.status(200).json({ success: true, message: "Unfriended." });
});

// Toggle a friend as favourite (only friends can be favourites)
router.post("/api/friends/favorite/:id", requireAuth, async (req, res) => {
    const targetId = req.params.id;
    if (!isId(targetId)) return badId(res);

    const me = await User.findById(req.user.userId).select("friends favouriteIds");
    if (!me.friends.some((id) => sameId(id, targetId))) {
        return res.status(400).json({ success: false, message: "You can only favourite friends." });
    }

    const isFavorite = me.favouriteIds.some((id) => sameId(id, targetId));
    await User.findByIdAndUpdate(me._id, isFavorite ? { $pull: { favouriteIds: targetId } } : { $addToSet: { favouriteIds: targetId } });
    return res.status(200).json({ success: true, isFavorite: !isFavorite });
});

module.exports = router;
