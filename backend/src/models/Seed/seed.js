// Demo data for marking. Run with: npm run seed  (WIPES the database first)
//
// Logins (passwords are plain text on purpose - the spec says not to hash them):
//   test@test.com   / test1234   regular user: 3 posts, 1 album, 3 friends, 1 pending request,
//                                eligible to request verification (2+ posts, 5+ comments, 60 days old)
//   admin@test.com  / admin1234  admin
//   everyone else   / password123
require("../../config/env");
const { connectDB, disconnectDB } = require("../../config/db");

const User = require("../User");
const Post = require("../Post");
const Album = require("../Albums");
const Comment = require("../Comment");
const Report = require("../Report");
const ReportReason = require("../ReportReason");
const VerificationRequest = require("../VerificationRequest");

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n, hour = 10) => new Date(Date.now() - n * DAY + (hour - 12) * 60 * 60 * 1000);
const photo = (id) => `https://picsum.photos/id/${id}/1200/800`;

const REPORT_REASONS = ["Spam", "Inappropriate Content", "Harassment", "False Information", "Copyright Violation", "Other"];

const USERS = [
    { key: "test", username: "testuser", name: "Test User", email: "test@test.com", password: "test1234",
      bio: "Weekend hiker and amateur photographer. Usually somewhere with a view.", location: "Pretoria, South Africa", joined: 60 },
    { key: "admin", username: "admin", name: "Site Admin", email: "admin@test.com", password: "admin1234", role: "admin",
      bio: "Keeping LifeSocialCapture friendly.", location: "Pretoria, South Africa", joined: 120 },
    { key: "thandi", username: "thandi_m", name: "Thandi Mokoena", email: "thandi@example.com",
      bio: "Landscape photographer chasing golden hour.", location: "Cape Town, South Africa", joined: 90,
      socialLinks: { website: "https://example.com/thandi" } },
    { key: "liam", username: "liam.botha", name: "Liam Botha", email: "liam@example.com",
      bio: "Trail runner. My pug disagrees with my hobbies.", location: "Stellenbosch, South Africa", joined: 75 },
    { key: "aisha", username: "aisha_k", name: "Aisha Khan", email: "aisha@example.com",
      bio: "Coffee first. Food photos second.", location: "Johannesburg, South Africa", joined: 70 },
    { key: "emma", username: "emma_vw", name: "Emma van Wyk", email: "emma@example.com",
      bio: "Wildlife guide in the Kruger. Long lens, longer patience.", location: "Hoedspruit, South Africa", joined: 65 },
    { key: "ruan", username: "ruan.p", name: "Ruan Pretorius", email: "ruan@example.com",
      bio: "Astrophotography and late nights.", location: "Sutherland, South Africa", joined: 50 },
    { key: "sipho", username: "sipho_n", name: "Sipho Nkosi", email: "sipho@example.com",
      bio: "Street and city photography.", location: "Durban, South Africa", joined: 40 },
    { key: "naledi", username: "naledi.d", name: "Naledi Dube", email: "naledi@example.com",
      bio: "Architecture student. I look up a lot.", location: "Johannesburg, South Africa", joined: 20 }
];

// Mutual friendships
const FRIENDS = [
    ["test", "thandi"], ["test", "liam"], ["test", "aisha"],
    ["thandi", "emma"], ["thandi", "sipho"],
    ["liam", "ruan"], ["aisha", "naledi"], ["emma", "ruan"]
];
// Pending friend requests [from, to]
const REQUESTS = [["sipho", "test"], ["test", "naledi"], ["ruan", "aisha"]];
// [user, favourite friend]
const FAVOURITES = [["test", "thandi"], ["thandi", "emma"]];

// Picsum photo ids chosen to match each caption
const POSTS = [
    { key: "valley", by: "test", img: 1015, days: 12, tags: ["hiking", "sunrise", "nature"],
      caption: "Sunrise over the river valley on Saturday's hike. Worth the 4am alarm." },
    { key: "waterfall", by: "test", img: 1039, days: 9, tags: ["waterfall", "hiking"],
      caption: "Found this waterfall halfway up the trail. Ice-cold, but we swam anyway." },
    { key: "puppy", by: "test", img: 237, days: 3, tags: ["dogs", "puppy"],
      caption: "Meet Bruno, the newest member of the family. Already chewed one hiking boot." },
    { key: "hills", by: "thandi", img: 1018, days: 20, tags: ["landscape", "goldenhour", "mountains"],
      caption: "Layer after layer of hills at golden hour. No filter needed." },
    { key: "snow", by: "thandi", img: 1036, days: 14, tags: ["mountains", "winter", "landscape"],
      caption: "Fresh snow on the peaks this morning. Hands were frozen, totally worth it." },
    { key: "canyon", by: "thandi", img: 1016, days: 6, tags: ["travel", "landscape", "desert"],
      caption: "Red rock canyon walls. The scale of this place is hard to capture." },
    { key: "pug", by: "liam", img: 1025, days: 11, tags: ["dogs", "pug"],
      caption: "My trail buddy has officially retired from running. Blanket life only." },
    { key: "fawn", by: "liam", img: 1003, days: 4, tags: ["wildlife", "hiking", "nature"],
      caption: "Spotted this little one at the edge of the forest on my morning run." },
    { key: "barista", by: "aisha", img: 1060, days: 16, tags: ["coffee", "cafe"],
      caption: "Watching the barista work at my new favourite cafe in Maboneng." },
    { key: "mug", by: "aisha", img: 30, days: 8, tags: ["coffee", "mondays"],
      caption: "Monday fuel. Second cup, not counting." },
    { key: "strawberries", by: "aisha", img: 1080, days: 2, tags: ["food", "fresh", "summer"],
      caption: "Strawberry season is here and I have no self-control." },
    { key: "lioness", by: "emma", img: 1074, days: 18, tags: ["wildlife", "safari", "kruger"],
      caption: "Lioness resting in the shade after a long night. Kruger never disappoints." },
    { key: "vulture", by: "emma", img: 1024, days: 10, tags: ["wildlife", "birds", "safari"],
      caption: "Patience is a vulture's whole personality." },
    { key: "walrus", by: "emma", img: 1084, days: 5, tags: ["wildlife", "travel"],
      caption: "Far from the Kruger: a walrus colony on my trip up north. Loud and very smelly." },
    { key: "aurora", by: "ruan", img: 1022, days: 13, tags: ["nightsky", "aurora", "astrophotography"],
      caption: "Finally saw the northern lights. 3 hours in the cold for 20 minutes of this." },
    { key: "earth", by: "ruan", img: 1002, days: 7, tags: ["space", "astrophotography"],
      caption: "Not mine (NASA public domain) but my wallpaper of the week. Our little blue marble." },
    { key: "skyline", by: "sipho", img: 1067, days: 15, tags: ["city", "streetphotography"],
      caption: "City skyline just after sunset, the blue hour." },
    { key: "towers", by: "naledi", img: 1031, days: 1, tags: ["architecture", "city"],
      caption: "Looking straight up between the towers. Studying facades for my design project." }
];

const ALBUMS = [
    { by: "test", title: "Weekend Hikes", posts: ["valley", "waterfall"],
      description: "Trails, views and the occasional freezing swim from weekend hikes." },
    { by: "thandi", title: "Mountain Light", posts: ["hills", "snow", "canyon"],
      description: "Landscapes shot at the edges of the day." },
    { by: "aisha", title: "Cafe Diaries", posts: ["barista", "mug", "strawberries"],
      description: "Coffee spots and food finds around Joburg." },
    { by: "emma", title: "Safari Moments", posts: ["lioness", "vulture"],
      description: "Favourite sightings from game drives in the Kruger." },
    { by: "ruan", title: "Night Skies", posts: ["aurora", "earth"],
      description: "Stars, auroras and everything above the clouds." },
    { by: "liam", title: "Good Dogs", posts: ["pug", "puppy"],
      description: "Dogs of the trail, mine and my friends'." }
];

// [post, author, text, days ago]
const COMMENTS = [
    ["valley", "thandi", "That light is unreal. Which trail is this?", 12],
    ["valley", "test", "Thanks! The river trail near Magaliesberg.", 11],
    ["valley", "liam", "Adding this to my list.", 11],
    ["waterfall", "aisha", "You are braver than me, that looks freezing.", 9],
    ["puppy", "liam", "Bruno and my pug need a playdate.", 3],
    ["puppy", "aisha", "Those ears!", 2],
    ["hills", "test", "Framing on this is perfect.", 19],
    ["hills", "emma", "Golden hour queen.", 19],
    ["snow", "sipho", "Didn't know it snowed there this time of year.", 13],
    ["lioness", "thandi", "So close! What lens?", 17],
    ["lioness", "emma", "600mm, she was further than it looks.", 17],
    ["mug", "naledi", "Mondays need at least three.", 8],
    ["strawberries", "test", "Save me some.", 2],
    ["aurora", "liam", "Bucket list. Incredible.", 12],
    ["skyline", "thandi", "Blue hour is so underrated.", 14],
    ["towers", "aisha", "Love the symmetry.", 1],
    ["lioness", "test", "What a shot. Kruger is next on my list.", 16],
    ["aurora", "test", "Jealous! Where did you see them?", 12],
    ["hills", "aisha", "Need a print of this for my wall.", 18],
    ["lioness", "aisha", "Incredible patience to get this.", 15]
];

// Verification demo: Thandi was approved, Aisha is waiting for an admin
const VERIFIED = ["thandi"];
const PENDING_VERIFICATION = ["aisha"];

// [post, users who liked it]
const LIKES = [
    ["valley", ["thandi", "liam", "aisha"]], ["waterfall", ["aisha", "liam"]], ["puppy", ["liam", "aisha", "thandi"]],
    ["hills", ["test", "emma", "sipho"]], ["snow", ["test"]], ["canyon", ["emma"]], ["pug", ["test", "ruan"]],
    ["barista", ["test", "naledi"]], ["lioness", ["thandi", "ruan", "test"]], ["aurora", ["liam", "emma"]],
    ["skyline", ["thandi"]], ["towers", ["aisha"]]
];

async function seedDatabase() {
    await connectDB();

    console.log("Clearing old data...");
    const MODELS = [User, Post, Album, Comment, Report, ReportReason, VerificationRequest];
    await Promise.all(MODELS.map((M) => M.deleteMany({})));
    // Drop stale indexes/fields from older schemas (e.g. the old hashedPassword field)
    await Promise.all(MODELS.map((M) => M.syncIndexes()));

    console.log("Seeding report reasons...");
    await ReportReason.insertMany(REPORT_REASONS.map((name) => ({ name })));

    console.log("Seeding users...");
    const u = {};
    for (const def of USERS) {
        u[def.key] = await User.create({
            username: def.username,
            name: def.name,
            email: def.email,
            password: def.password || "password123",
            role: def.role || "user",
            bio: def.bio,
            location: def.location,
            socialLinks: def.socialLinks,
            joinedDate: daysAgo(def.joined)
        });
    }
    const id = (key) => u[key]._id;

    for (const [a, b] of FRIENDS) {
        await User.updateOne({ _id: id(a) }, { $addToSet: { friends: id(b) } });
        await User.updateOne({ _id: id(b) }, { $addToSet: { friends: id(a) } });
    }
    for (const [from, to] of REQUESTS) {
        await User.updateOne({ _id: id(from) }, { $addToSet: { sentRequests: id(to) } });
        await User.updateOne({ _id: id(to) }, { $addToSet: { friendRequests: id(from) } });
    }
    for (const [user, fav] of FAVOURITES) {
        await User.updateOne({ _id: id(user) }, { $addToSet: { favouriteIds: id(fav) } });
    }

    console.log("Seeding posts...");
    const likedBy = new Map(LIKES.map(([post, users]) => [post, users.map(id)]));
    const p = {};
    for (const def of POSTS) {
        const likers = likedBy.get(def.key) || [];
        const created = daysAgo(def.days, 9 + (def.img % 10));
        // timestamps: false so the back-dated createdAt is kept
        const [doc] = await Post.insertMany([{
            userId: id(def.by),
            caption: def.caption,
            image: photo(def.img),
            hashtags: def.tags,
            likes: likers.length,
            likedBy: likers,
            createdAt: created,
            updatedAt: created
        }], { timestamps: false });
        p[def.key] = doc;
    }

    console.log("Seeding albums...");
    for (const def of ALBUMS) {
        const posts = def.posts.map((key) => p[key]);
        const album = await Album.create({
            title: def.title,
            description: def.description,
            userId: id(def.by),
            postId: posts.map((post) => post._id),
            hashtags: [...new Set(posts.flatMap((post) => post.hashtags))]
        });
        await Post.updateMany({ _id: { $in: album.postId } }, { $addToSet: { albums: album._id } });
    }

    console.log("Seeding comments...");
    await Comment.insertMany(COMMENTS.map(([post, by, text, days]) => ({
        postId: p[post]._id,
        userId: id(by),
        text,
        createdAt: daysAgo(days, 18)
    })));

    console.log("Seeding reports...");
    await Report.create({
        postId: p.earth._id,
        reportedBy: id("liam"),
        reason: "Copyright Violation",
        additionalDetails: "This is a NASA photo, not the user's own work."
    });

    console.log("Seeding verification...");
    const count = async (key) => ({
        accountAgeDays: USERS.find((x) => x.key === key).joined,
        posts: await Post.countDocuments({ userId: id(key) }),
        comments: await Comment.countDocuments({ userId: id(key) })
    });
    for (const key of VERIFIED) {
        await User.updateOne({ _id: id(key) }, { verified: true });
        await VerificationRequest.create({
            userId: id(key), status: "approved", snapshot: await count(key),
            reviewedBy: id("admin"), reviewedAt: daysAgo(30)
        });
    }
    for (const key of PENDING_VERIFICATION) {
        await VerificationRequest.create({ userId: id(key), status: "pending", snapshot: await count(key) });
    }

    console.log(`Done: ${USERS.length} users, ${POSTS.length} posts, ${ALBUMS.length} albums, ${COMMENTS.length} comments.`);
}

seedDatabase()
    .catch((err) => {
        console.error("Seeding failed:", err);
        process.exitCode = 1;
    })
    .finally(disconnectDB);
