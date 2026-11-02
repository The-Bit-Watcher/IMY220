// Account verification: users request it, admins approve or deny it.
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const VerificationRequest = require("../models/VerificationRequest");
const { requireAuth, requireAdmin } = require("../Middleware/auth");
const { getEligibility } = require("../utils/verification");
const { isId } = require("../utils/ids");

// My verification status, the rules and how far along I am
router.get("/api/verification/me", requireAuth, async (req, res) => {
    const eligibility = await getEligibility(req.user.userId);
    const request = await VerificationRequest.findOne({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, ...eligibility, request });
});

router.post("/api/verification/request", requireAuth, async (req, res) => {
    const e = await getEligibility(req.user.userId);

    if (e.isAdmin) {
        return res.status(403).json({ success: false, message: "Admin accounts can't request verification." });
    }
    if (e.verified) {
        return res.status(400).json({ success: false, message: "Your account is already verified." });
    }
    if (await VerificationRequest.exists({ userId: req.user.userId, status: "pending" })) {
        return res.status(409).json({ success: false, message: "You already have a request waiting for review." });
    }
    if (!e.eligible) {
        const missing = e.checks.filter((c) => !c.met).map((c) => `${c.label.toLowerCase()} (you have ${c.have})`);
        return res.status(400).json({ success: false, message: `Not eligible yet: ${missing.join(", ")}.` });
    }

    const request = await VerificationRequest.create({
        userId: req.user.userId,
        snapshot: { accountAgeDays: e.accountAgeDays, posts: e.posts, comments: e.comments }
    });
    return res.status(201).json({ success: true, message: "Request sent. An admin will review it.", request });
});

// ---------------------------------------------------------------------------
// Admin review
// ---------------------------------------------------------------------------
router.get("/api/admin/verifications", requireAuth, requireAdmin, async (req, res) => {
    const filter = req.query.status === "all" ? {} : { status: "pending" };
    const requests = await VerificationRequest.find(filter)
        .populate("userId", "name username profileImage joinedDate verified")
        .populate("reviewedBy", "username")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

    // Live numbers next to the snapshot, so the admin decides on current data
    const rows = await Promise.all(requests.filter((r) => r.userId).map(async (r) => ({
        ...r,
        current: await getEligibility(r.userId._id)
    })));
    return res.status(200).json({ success: true, requests: rows });
});

async function review(req, res, approve) {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid request ID." });

    const request = await VerificationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found." });
    if (request.status !== "pending") {
        return res.status(400).json({ success: false, message: `This request was already ${request.status}.` });
    }

    request.status = approve ? "approved" : "denied";
    request.reviewedBy = req.user.userId;
    request.reviewedAt = new Date();
    await request.save();
    await User.findByIdAndUpdate(request.userId, { verified: approve });

    return res.status(200).json({ success: true, message: approve ? "Account verified." : "Request denied.", request });
}

router.post("/api/admin/verifications/:id/approve", requireAuth, requireAdmin, (req, res) => review(req, res, true));
router.post("/api/admin/verifications/:id/deny", requireAuth, requireAdmin, (req, res) => review(req, res, false));

module.exports = router;
