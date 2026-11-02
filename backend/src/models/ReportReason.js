const mongoose = require("mongoose");

// Reasons a user can pick when reporting a post. Admins can add new ones.
const ReportReasonSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 60
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ReportReason", ReportReasonSchema);
