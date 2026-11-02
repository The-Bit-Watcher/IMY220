const Report = require("../models/Report");

// A post with more reports than this is hidden from feeds and search until an admin reviews it
const HIDE_AFTER_REPORTS = 2;

async function hiddenPostIds() {
    const rows = await Report.aggregate([
        { $group: { _id: "$postId", count: { $sum: 1 } } },
        { $match: { count: { $gt: HIDE_AFTER_REPORTS } } }
    ]);
    return rows.map((r) => r._id);
}

module.exports = { HIDE_AFTER_REPORTS, hiddenPostIds };
