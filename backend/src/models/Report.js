const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        reason: {
            type: String,
            required: true,
            enum: ["Spam", "Inappropriate Content", "Harassment", "False Information", "Other"],
            default: "Other"
        },
        additionalDetails: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ["Pending", "Reviewed", "Resolved"],
            default: "Pending"
        }
    },
    { timestamps: true }
);

// Prevent duplicate reports from the same user on the same post
ReportSchema.index({ postId: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model("Report", ReportSchema);