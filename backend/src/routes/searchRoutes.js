// Search users (name / username / email), posts (description), albums (name / description) and hashtags.
// Fuzzy: tolerates missing, swapped or wrong letters. Used by the autocomplete box and the results page.
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Post = require("../models/Post");
const Album = require("../models/Albums");
const { requireAuth } = require("../Middleware/auth");
const { rank } = require("../utils/fuzzy");
const { hiddenPostIds } = require("../utils/reports");

const TYPES = ["users", "posts", "albums", "hashtags"];

router.get("/api/search", requireAuth, async (req, res) => {
    const q = String(req.query.q || "").trim().slice(0, 100);
    const type = TYPES.includes(req.query.type) ? req.query.type : "all";
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const wants = (t) => type === "all" || type === t;

    const result = { users: [], posts: [], albums: [], hashtags: [] };
    if (!q) return res.status(200).json({ success: true, query: q, ...result });

    const plain = q.replace(/^#/, ""); // "#sunset" searches the same as "sunset"
    const hidden = await hiddenPostIds();

    if (wants("users")) {
        // Email is searchable but never returned
        const users = await User.find().select("name username email profileImage role verified").lean();
        result.users = rank(plain, users, (u) => [u.name, u.username, u.email], limit)
            .map((u) => ({ _id: u._id, name: u.name, username: u.username, profileImage: u.profileImage, role: u.role, verified: !!u.verified }));
    }

    if (wants("posts")) {
        // Images are left out while scoring (they can be large base64 strings) and fetched for the winners only
        const posts = await Post.find({ _id: { $nin: hidden } }).select("caption hashtags").lean();
        const top = rank(plain, posts, (p) => [p.caption, ...(p.hashtags || [])], limit).map((p) => p._id);
        const full = await Post.find({ _id: { $in: top } })
            .select("caption image hashtags likes createdAt userId")
            .populate("userId", "username name profileImage verified")
            .lean();
        const byId = new Map(full.map((p) => [p._id.toString(), p]));
        result.posts = top.map((id) => byId.get(id.toString())).filter(Boolean);
    }

    if (wants("albums")) {
        const albums = await Album.find().select("title description hashtags userId postId").lean();
        const top = rank(plain, albums, (a) => [a.title, a.description, ...(a.hashtags || [])], limit);
        const coverIds = top.map((a) => a.postId?.[0]).filter(Boolean);
        const covers = new Map((await Post.find({ _id: { $in: coverIds } }).select("image").lean())
            .map((p) => [p._id.toString(), p.image]));
        const owners = new Map((await User.find({ _id: { $in: top.map((a) => a.userId) } }).select("username name").lean())
            .map((u) => [u._id.toString(), u]));
        result.albums = top.map((a) => ({
            _id: a._id,
            title: a.title,
            description: a.description,
            hashtags: a.hashtags,
            postCount: (a.postId || []).length,
            coverImage: a.postId?.[0] ? covers.get(a.postId[0].toString()) || null : null,
            userId: owners.get(a.userId.toString()) || null
        }));
    }

    if (wants("hashtags")) {
        const tags = await Post.aggregate([
            { $match: { _id: { $nin: hidden } } },
            { $unwind: "$hashtags" },
            { $group: { _id: "$hashtags", count: { $sum: 1 } } }
        ]);
        result.hashtags = rank(plain, tags, (t) => [t._id], limit).map((t) => ({ tag: t._id, count: t.count }));
    }

    return res.status(200).json({ success: true, query: q, ...result });
});

module.exports = router;
