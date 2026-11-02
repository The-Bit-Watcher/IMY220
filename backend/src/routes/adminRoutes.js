// Admin-only endpoints. Every route here goes through requireAuth + requireAdmin.
// Admins can also edit/delete ANY post, comment and album through the normal routes
// (those check "owner OR admin").
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const ReportReason = require("../models/ReportReason");
const { requireAuth, requireAdmin } = require("../Middleware/auth");
const { deletePostCascade, deleteUserCascade } = require("../utils/cascade");
const { buildProfileUpdates } = require("../utils/profileUpdates");
const { isId, sameId } = require("../utils/ids");

router.use("/api/admin", requireAuth, requireAdmin);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
// Reported posts, one row per post with all its reports
router.get("/api/admin/reports", async (req, res) => {
    const reports = await Report.find()
        .populate({ path: "postId", select: "caption image userId", populate: { path: "userId", select: "username name" } })
        .populate("reportedBy", "username name")
        .sort({ createdAt: -1 })
        .lean();

    const byPost = new Map();
    for (const r of reports) {
        if (!r.postId) continue; // post already gone
        const key = r.postId._id.toString();
        if (!byPost.has(key)) byPost.set(key, { post: r.postId, reports: [] });
        byPost.get(key).reports.push({ _id: r._id, reason: r.reason, additionalDetails: r.additionalDetails, reportedBy: r.reportedBy, createdAt: r.createdAt });
    }
    return res.status(200).json({ success: true, reportedPosts: [...byPost.values()] });
});

// Dismiss: keep the post, clear its reports
router.delete("/api/admin/reports/post/:postId", async (req, res) => {
    if (!isId(req.params.postId)) return res.status(400).json({ success: false, message: "Invalid post ID." });
    await Report.deleteMany({ postId: req.params.postId });
    return res.status(200).json({ success: true, message: "Reports dismissed." });
});

router.delete("/api/admin/posts/:postId", async (req, res) => {
    if (!isId(req.params.postId)) return res.status(400).json({ success: false, message: "Invalid post ID." });
    if (!(await Post.exists({ _id: req.params.postId }))) {
        return res.status(404).json({ success: false, message: "Post not found." });
    }
    await deletePostCascade(req.params.postId);
    return res.status(200).json({ success: true, message: "Post removed." });
});

// ---------------------------------------------------------------------------
// Activity (recent comments)
// ---------------------------------------------------------------------------
router.get("/api/admin/comments", async (req, res) => {
    const comments = await Comment.find()
        .populate("userId", "username name")
        .populate("postId", "caption")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
    return res.status(200).json({ success: true, comments });
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
router.get("/api/admin/users", async (req, res) => {
    const q = String(req.query.q || "").trim();
    const filter = q
        ? { $or: ["name", "username", "email"].map((f) => ({ [f]: new RegExp(escapeRegex(q), "i") })) }
        : {};

    const users = await User.find(filter)
        .select("username name email role verified profileImage joinedDate bio location")
        .sort({ joinedDate: -1 })
        .limit(200)
        .lean();

    const counts = await Post.aggregate([
        { $match: { userId: { $in: users.map((u) => u._id) } } },
        { $group: { _id: "$userId", n: { $sum: 1 } } }
    ]);
    const postCount = new Map(counts.map((c) => [c._id.toString(), c.n]));

    return res.status(200).json({
        success: true,
        users: users.map((u) => ({ ...u, postCount: postCount.get(u._id.toString()) || 0 }))
    });
});

// Edit any account: profile fields, plus role and password
router.put("/api/admin/users/:id", async (req, res) => {
    const targetId = req.params.id;
    if (!isId(targetId)) return res.status(400).json({ success: false, message: "Invalid user ID." });

    const { updates, error } = buildProfileUpdates(req.body || {});
    if (error) return res.status(400).json({ success: false, message: error });

    const { role, password } = req.body || {};
    if (role !== undefined) {
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ success: false, message: "Role must be 'user' or 'admin'." });
        }
        if (sameId(targetId, req.user.userId) && role !== "admin") {
            return res.status(400).json({ success: false, message: "You cannot remove your own admin role." });
        }
        updates.role = role;
    }
    // Admins can also revoke (or grant) the verified badge directly
    if (req.body?.verified !== undefined) updates.verified = !!req.body.verified;
    if (password !== undefined && password !== "") {
        if (String(password).length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
        }
        updates.password = String(password);
    }

    const user = await User.findByIdAndUpdate(targetId, updates, { returnDocument: "after", runValidators: true })
        .select("username name email role verified profileImage joinedDate bio location");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.status(200).json({ success: true, user });
});

router.delete("/api/admin/users/:id", async (req, res) => {
    const targetId = req.params.id;
    if (!isId(targetId)) return res.status(400).json({ success: false, message: "Invalid user ID." });
    if (sameId(targetId, req.user.userId)) {
        return res.status(400).json({ success: false, message: "Use your own profile page to delete your account." });
    }
    if (!(await User.exists({ _id: targetId }))) {
        return res.status(404).json({ success: false, message: "User not found." });
    }
    // Their tokens stop working immediately: requireAuth checks the account still exists
    await deleteUserCascade(targetId);
    return res.status(200).json({ success: true, message: "User and all their content deleted." });
});

// ---------------------------------------------------------------------------
// Report reasons (anyone can read them via GET /api/report-reasons)
// ---------------------------------------------------------------------------
router.post("/api/admin/report-reasons", async (req, res) => {
    const name = String(req.body?.name || "").trim();
    if (!name || name.length > 60) {
        return res.status(400).json({ success: false, message: "Reason must be 1-60 characters." });
    }
    if (await ReportReason.exists({ name: new RegExp(`^${escapeRegex(name)}$`, "i") })) {
        return res.status(409).json({ success: false, message: "That reason already exists." });
    }
    const reason = await ReportReason.create({ name });
    return res.status(201).json({ success: true, reason });
});

// Existing reports keep their reason text; it just can't be chosen any more
router.delete("/api/admin/report-reasons/:id", async (req, res) => {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid reason ID." });
    if ((await ReportReason.countDocuments()) <= 1) {
        return res.status(400).json({ success: false, message: "Keep at least one report reason." });
    }
    await ReportReason.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Reason removed." });
});

module.exports = router;
