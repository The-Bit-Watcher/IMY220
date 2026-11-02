const mongoose = require("mongoose");

// A user's request for a verified badge, reviewed by an admin
const VerificationRequestSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
        // What the account looked like when it asked (the admin also sees live numbers)
        snapshot: {
            accountAgeDays: Number,
            posts: Number,
            comments: Number
        },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reviewedAt: Date
    },
    { timestamps: true }
);

module.exports = mongoose.model("VerificationRequest", VerificationRequestSchema);
