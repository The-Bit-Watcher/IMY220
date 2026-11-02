// Verification rules (spec bonus): a non-admin may request a verified badge once the account is
// more than one week old, has created at least two posts and has left at least five comments.
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const RULES = { minAccountAgeDays: 7, minPosts: 2, minComments: 5 };
const DAY = 24 * 60 * 60 * 1000;

async function getEligibility(userId) {
    const [user, posts, comments] = await Promise.all([
        User.findById(userId).select("joinedDate role verified").lean(),
        Post.countDocuments({ userId }),
        Comment.countDocuments({ userId })
    ]);
    if (!user) return null;

    const accountAgeDays = Math.floor((Date.now() - new Date(user.joinedDate).getTime()) / DAY);
    const checks = [
        { key: "age", label: "Account older than one week", met: accountAgeDays > RULES.minAccountAgeDays, have: accountAgeDays, need: RULES.minAccountAgeDays + 1, unit: "days" },
        { key: "posts", label: "At least 2 posts", met: posts >= RULES.minPosts, have: posts, need: RULES.minPosts, unit: "posts" },
        { key: "comments", label: "At least 5 comments", met: comments >= RULES.minComments, have: comments, need: RULES.minComments, unit: "comments" }
    ];

    return {
        accountAgeDays,
        posts,
        comments,
        checks,
        isAdmin: user.role === "admin",
        verified: !!user.verified,
        eligible: user.role !== "admin" && checks.every((c) => c.met)
    };
}

module.exports = { RULES, getEligibility };
