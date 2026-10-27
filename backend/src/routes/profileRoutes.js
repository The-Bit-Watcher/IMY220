const express = require("express");
const router = express.Router();

const User = require("../models/User");
const checkTokenValidity = require("../Middleware/jwtVerifyMiddleware");
const Comment = require("../models/Comment");
const Album = require("../models/Albums");
const Post = require("../models/Post");
const Report = require("../models/Report");
const bcrypt = require("bcrypt");
const { redisClient } = require("../config/redis");
const { default: mongoose } = require("mongoose");

// Fields that are safe to send to any logged-in user
const PUBLIC_USER_FIELDS = "username name profileImage bio location";
const idEquals = (a, b) => a?.toString() === b?.toString();

// ---------------------------------------------------------------------------
// Own profile
// ---------------------------------------------------------------------------
router.get('/api/profile/me', checkTokenValidity, async (req, res, next) => {
    try {
        const existingUser = await User.findById(req.user.userId).select("-hashedPassword");

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        return res.status(200).json({ success: true, payload: existingUser });
    } catch (error) {
        next(error);
    }
});

// Delete own account and EVERYTHING that belongs to it.
// Requires the password again so a stolen/forgotten-open session can't wipe an account.
router.delete("/api/profile/me", checkTokenValidity, async (req, res, next) => {
    const userId = req.user.userId;
    const { password } = req.body || {};

    if (!password) {
        return res.status(400).json({ success: false, message: "Please enter your password to confirm." });
    }

    const session = await mongoose.startSession();
    try {
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        const passwordMatches = await bcrypt.compare(password, existingUser.hashedPassword);
        if (!passwordMatches) {
            return res.status(401).json({ success: false, message: "Incorrect password." });
        }

        await session.withTransaction(async () => {
            const userPosts = await Post.find({ userId }).select("_id").session(session);
            const postIds = userPosts.map(post => post._id);

            // Comments the user wrote + every comment on the user's posts
            await Comment.deleteMany({ $or: [{ userId }, { postId: { $in: postIds } }] }, { session });
            // Reports the user filed + reports against the user's posts
            await Report.deleteMany({ $or: [{ reportedBy: userId }, { postId: { $in: postIds } }] }, { session });
            // The user's own albums
            await Album.deleteMany({ userId }, { session });
            // The user's posts inside OTHER people's albums
            await Album.updateMany({ postId: { $in: postIds } }, { $pull: { postId: { $in: postIds } } }, { session });
            // Undo the user's likes on other people's posts
            await Post.updateMany({ likedBy: userId }, { $pull: { likedBy: userId }, $inc: { likes: -1 } }, { session });
            // The user's posts
            await Post.deleteMany({ userId }, { session });
            // Remove the user from everyone's friends / favourites / pending requests
            await User.updateMany({}, {
                $pull: { friends: userId, favouriteIds: userId, friendRequests: userId, sentRequests: userId }
            }, { session });
            // Finally the user
            await User.findByIdAndDelete(userId, { session });
        });

        // Kill the current token in Redis so it can't be used after the account is gone
        if (req.user.jti && req.user.exp) {
            const ttl = req.user.exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) await redisClient.set(`revoked:${req.user.jti}`, "revoked", { EX: ttl });
        }

        return res.status(200).json({ success: true, message: "Account and all associated data deleted." });
    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
});

// Update own profile (everything except friends / favourites)
router.put('/api/profile/me', checkTokenValidity, async (req, res, next) => {
    const { username, name, email, bio, profileImage, location, socialLinks } = req.body;
    const updates = {};

    if (username !== undefined) {
        if (!String(username).trim()) {
            return res.status(400).json({ success: false, message: "Username cannot be empty." });
        }
        updates.username = String(username).trim();
    }
    if (name !== undefined) {
        if (!String(name).trim()) {
            return res.status(400).json({ success: false, message: "Name cannot be empty." });
        }
        updates.name = String(name).trim();
    }
    if (email !== undefined) updates.email = String(email).trim().toLowerCase();
    if (bio !== undefined) updates.bio = String(bio).slice(0, 250);
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (location !== undefined) updates.location = location;
    if (socialLinks !== undefined) {
        updates.socialLinks = {
            twitter: socialLinks.twitter || "",
            github: socialLinks.github || "",
            website: socialLinks.website || ""
        };
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            updates,
            { new: true, runValidators: true }
        ).select("-hashedPassword");

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        // Duplicate username / email
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || "value";
            return res.status(409).json({ success: false, message: `That ${field} is already taken.` });
        }
        next(error);
    }
});

// ---------------------------------------------------------------------------
// View any profile
// ---------------------------------------------------------------------------
router.get('/api/users/:id', checkTokenValidity, async (req, res, next) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format." });
        }

        const [user, currentUser] = await Promise.all([
            User.findById(targetUserId).select("-hashedPassword -email").lean(),
            User.findById(currentUserId).select("favouriteIds").lean()
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const friends = user.friends || [];
        const isSelf = idEquals(targetUserId, currentUserId);
        const isFriend = friends.some(id => idEquals(id, currentUserId));

        let relationshipStatus = "none";
        if (isSelf) relationshipStatus = "self";
        else if (isFriend) relationshipStatus = "friends";
        else if ((user.friendRequests || []).some(id => idEquals(id, currentUserId))) relationshipStatus = "request_sent";
        else if ((user.sentRequests || []).some(id => idEquals(id, currentUserId))) relationshipStatus = "request_received";

        const isFavorite = (currentUser?.favouriteIds || []).some(id => idEquals(id, targetUserId));

        // Friends list is only visible to yourself and your friends
        if (isSelf || isFriend) {
            user.friends = await User.find({ _id: { $in: friends } })
                .select(PUBLIC_USER_FIELDS)
                .lean();
        } else {
            delete user.friends;
        }

        // Your own incoming requests, with names, so you can accept them from your profile
        if (isSelf) {
            user.friendRequests = await User.find({ _id: { $in: user.friendRequests || [] } })
                .select(PUBLIC_USER_FIELDS)
                .lean();
        }

        // Never leak other people's pending request lists
        if (!isSelf) {
            delete user.friendRequests;
            delete user.sentRequests;
            delete user.favouriteIds;
        }

        return res.status(200).json({
            success: true,
            user,
            friendCount: friends.length,
            relationshipStatus,
            isFavorite
        });
    } catch (error) {
        next(error);
    }
});

// Posts of any user (profile "Posts" tab)
router.get('/api/users/:id/posts', checkTokenValidity, async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format." });
        }

        const posts = await Post.find({ userId: req.params.id })
            .select("caption image hashtags likes createdAt userId")
            .populate("userId", "username name")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ success: true, posts });
    } catch (error) {
        next(error);
    }
});

// Albums of any user, with up to 4 cover images per album
router.get('/api/users/:id/albums', checkTokenValidity, async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format." });
        }

        const albums = await Album.find({ userId: req.params.id })
            .populate({ path: "postId", select: "image caption createdAt", options: { sort: { createdAt: -1 } } })
            .sort({ _id: -1 })
            .lean();

        const formatted = albums.map(album => {
            const posts = (album.postId || []).filter(Boolean); // drop refs to deleted posts
            return {
                _id: album._id,
                title: album.title,
                description: album.description,
                hashtags: album.hashtags || [],
                postCount: posts.length,
                coverImages: posts.slice(0, 4).map(p => p.image)
            };
        });

        return res.status(200).json({ success: true, albums: formatted });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// Friend recommendations: friends-of-friends first (ranked by mutual friends),
// topped up with other users if there aren't enough.
// ---------------------------------------------------------------------------
router.get('/api/friends/recommendations', checkTokenValidity, async (req, res, next) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 20);

    try {
        const me = await User.findById(req.user.userId).lean();
        if (!me) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const myFriends = me.friends || [];
        const excluded = new Set([
            me._id.toString(),
            ...myFriends.map(String),
            ...(me.sentRequests || []).map(String),
            ...(me.friendRequests || []).map(String)
        ]);

        // Count how many of my friends each friend-of-friend shares with me
        const friendsOfMyFriends = await User.find({ _id: { $in: myFriends } }).select("friends").lean();
        const mutualCounts = new Map();
        for (const friend of friendsOfMyFriends) {
            for (const fofId of friend.friends || []) {
                const key = fofId.toString();
                if (excluded.has(key)) continue;
                mutualCounts.set(key, (mutualCounts.get(key) || 0) + 1);
            }
        }

        const rankedIds = [...mutualCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => id);

        let suggestions = await User.find({ _id: { $in: rankedIds } }).select(PUBLIC_USER_FIELDS).lean();
        suggestions = suggestions
            .map(u => ({ ...u, mutualFriends: mutualCounts.get(u._id.toString()) || 0 }))
            .sort((a, b) => b.mutualFriends - a.mutualFriends);

        // Top up with random other users
        if (suggestions.length < limit) {
            const alreadyIn = [...excluded, ...rankedIds].map(id => new mongoose.Types.ObjectId(id));
            const extra = await User.aggregate([
                { $match: { _id: { $nin: alreadyIn }, role: { $ne: "admin" } } },
                { $sample: { size: limit - suggestions.length } },
                { $project: { username: 1, name: 1, profileImage: 1, bio: 1, location: 1 } }
            ]);
            suggestions = suggestions.concat(extra.map(u => ({ ...u, mutualFriends: 0 })));
        }

        return res.status(200).json({ success: true, users: suggestions });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// Friend requests
// ---------------------------------------------------------------------------
router.post('/api/friends/request/:id', checkTokenValidity, async (req, res, next) => {
    const recipientId = req.params.id;
    const senderId = req.user.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format." });
        }
        if (idEquals(senderId, recipientId)) {
            return res.status(400).json({ success: false, message: "You cannot send a friend request to yourself." });
        }

        const [recipient, sender] = await Promise.all([User.findById(recipientId), User.findById(senderId)]);
        if (!recipient || !sender) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (sender.friends.some(id => idEquals(id, recipientId))) {
            return res.status(400).json({ success: false, message: "You are already friends with this user." });
        }
        if (recipient.friendRequests.some(id => idEquals(id, senderId))) {
            return res.status(400).json({ success: false, message: "Friend request already sent." });
        }

        // They already asked me: just accept instead of creating a crossed request
        if (sender.friendRequests.some(id => idEquals(id, recipientId))) {
            await User.findByIdAndUpdate(senderId, { $addToSet: { friends: recipientId }, $pull: { friendRequests: recipientId, sentRequests: recipientId } });
            await User.findByIdAndUpdate(recipientId, { $addToSet: { friends: senderId }, $pull: { sentRequests: senderId, friendRequests: senderId } });
            return res.status(200).json({ success: true, message: "You are now friends.", relationshipStatus: "friends" });
        }

        await User.findByIdAndUpdate(recipientId, { $addToSet: { friendRequests: senderId } });
        await User.findByIdAndUpdate(senderId, { $addToSet: { sentRequests: recipientId } });

        return res.status(200).json({ success: true, message: "Friend request sent successfully.", relationshipStatus: "request_sent" });
    } catch (error) {
        next(error);
    }
});

router.post('/api/friends/accept/:id', checkTokenValidity, async (req, res, next) => {
    const senderId = req.params.id;
    const currentUserId = req.user.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(senderId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format." });
        }

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        if (!currentUser.friendRequests.some(id => idEquals(id, senderId))) {
            return res.status(400).json({ success: false, message: "No pending friend request from this user." });
        }

        await User.findByIdAndUpdate(currentUserId, { $addToSet: { friends: senderId }, $pull: { friendRequests: senderId } });
        await User.findByIdAndUpdate(senderId, { $addToSet: { friends: currentUserId }, $pull: { sentRequests: currentUserId } });

        return res.status(200).json({ success: true, message: "Friend request accepted." });
    } catch (error) {
        next(error);
    }
});

// Reject an incoming request OR cancel one you sent
router.post('/api/friends/reject/:id', checkTokenValidity, async (req, res, next) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format." });
        }

        await User.findByIdAndUpdate(currentUserId, { $pull: { friendRequests: targetUserId, sentRequests: targetUserId } });
        await User.findByIdAndUpdate(targetUserId, { $pull: { friendRequests: currentUserId, sentRequests: currentUserId } });

        return res.status(200).json({ success: true, message: "Friend request cancelled/rejected." });
    } catch (error) {
        next(error);
    }
});

router.delete('/api/friends/unfriend/:id', checkTokenValidity, async (req, res, next) => {
    const friendId = req.params.id;
    const currentUserId = req.user.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format." });
        }

        // Unfriending also removes the favourite in both directions
        await User.findByIdAndUpdate(currentUserId, { $pull: { friends: friendId, favouriteIds: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: currentUserId, favouriteIds: currentUserId } });

        return res.status(200).json({ success: true, message: "Unfriended successfully." });
    } catch (error) {
        next(error);
    }
});

// Toggle a friend as favourite (only friends can be favourites)
router.post('/api/friends/favorite/:id', checkTokenValidity, async (req, res, next) => {
    const targetId = req.params.id;
    const currentUserId = req.user.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format." });
        }

        const me = await User.findById(currentUserId);
        if (!me) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        if (!me.friends.some(id => idEquals(id, targetId))) {
            return res.status(400).json({ success: false, message: "You can only favourite friends." });
        }

        const isFavorite = me.favouriteIds.some(id => idEquals(id, targetId));
        await User.findByIdAndUpdate(currentUserId, isFavorite
            ? { $pull: { favouriteIds: targetId } }
            : { $addToSet: { favouriteIds: targetId } });

        return res.status(200).json({ success: true, isFavorite: !isFavorite });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
