const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Post = require("./models/Post");
const Comment = require("./models/Comment");
const Album = require("./models/Album");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/social_app";

async function seedDatabase() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // 2. Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Album.deleteMany({});
    console.log("Existing data cleared");

    // 3. Create users
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const users = await User.create([
      {
        username: "shaun",
        name: "Shaun Marx",
        email: "shaun@example.com",
        hashedPassword: passwordHash,
        bio: "Software development student and technology enthusiast.",
        profileImage: "/images/avatars/shaun.jpg",
        location: "Pretoria, South Africa",
        joinedDate: new Date("2024-02-15"),
      },
      {
        username: "james",
        name: "James Smith",
        email: "james@example.com",
        hashedPassword: passwordHash,
        bio: "Photography, travelling and technology.",
        profileImage: "/images/avatars/james.jpg",
        location: "Johannesburg, South Africa",
        joinedDate: new Date("2024-04-10"),
      },
      {
        username: "sarah",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        hashedPassword: passwordHash,
        bio: "Designer and creative enthusiast.",
        profileImage: "/images/avatars/sarah.jpg",
        location: "Cape Town, South Africa",
        joinedDate: new Date("2024-06-22"),
      },
      {
        username: "mike",
        name: "Mike Williams",
        email: "mike@example.com",
        hashedPassword: passwordHash,
        bio: "Gaming and software development.",
        profileImage: "/images/avatars/mike.jpg",
        location: "Durban, South Africa",
        joinedDate: new Date("2024-08-05"),
      },
      {
        username: "emma",
        name: "Emma Brown",
        email: "emma@example.com",
        hashedPassword: passwordHash,
        bio: "Art, music and travelling.",
        profileImage: "/images/avatars/emma.jpg",
        location: "Pretoria, South Africa",
        joinedDate: new Date("2024-09-12"),
      },
    ]);
    console.log(`${users.length} users created`);

    // 4. Map old IDs to MongoDB ObjectIds
    const userMap = {
      1: users[0]._id,
      2: users[1]._id,
      3: users[2]._id,
      4: users[3]._id,
      5: users[4]._id,
    };

    // 5. Add friendships/favourites
    await User.findByIdAndUpdate(userMap[1], {
      friendIds: [userMap[2], userMap[3], userMap[5]],
      favoriteIds: [userMap[3]],
    });
    await User.findByIdAndUpdate(userMap[2], {
      friendIds: [userMap[1], userMap[4]],
      favoriteIds: [userMap[1]],
    });
    await User.findByIdAndUpdate(userMap[3], {
      friendIds: [userMap[1], userMap[5]],
      favoriteIds: [userMap[1]],
    });
    await User.findByIdAndUpdate(userMap[4], {
      friendIds: [userMap[2]],
      favoriteIds: [],
    });
    await User.findByIdAndUpdate(userMap[5], {
      friendIds: [userMap[1], userMap[3]],
      favoriteIds: [userMap[3]],
    });
    console.log("Friendships and favourites created");

    // 6. Create posts
    const posts = await Post.create([
      {
        userId: userMap[1],
        caption: "Batman",
        image: "/images/posts/sample-post-1.jpeg",
        createdAt: new Date("2026-09-01T10:30:00"),
        likes: 24,
      },
      {
        userId: userMap[2],
        caption: "Spaceman",
        image: "/images/posts/sample-post-2.jpeg",
        createdAt: new Date("2026-09-01T12:00:00"),
        likes: 18,
      },
      {
        userId: userMap[3],
        caption: "Beautiful day!",
        image: "/images/posts/sample-post-3.jpeg",
        createdAt: new Date("2026-09-02T09:15:00"),
        likes: 31,
      },
      {
        userId: userMap[4],
        caption: "Gaming setup",
        image: "/images/posts/sample-post-4.jpeg",
        createdAt: new Date("2026-09-02T14:45:00"),
        likes: 42,
      },
      {
        userId: userMap[5],
        caption: "Weekend adventure",
        image: "/images/posts/sample-post-5.jpeg",
        createdAt: new Date("2026-09-03T11:20:00"),
        likes: 27,
      },
      {
        userId: userMap[1],
        caption: "Another Batman post",
        image: "/images/posts/sample-post-6.jpeg",
        createdAt: new Date("2026-09-04T16:00:00"),
        likes: 36,
      },
    ]);
    console.log(`${posts.length} posts created`);

    // 7. Map old post IDs to MongoDB ObjectIds
    const postMap = {
      1: posts[0]._id,
      2: posts[1]._id,
      3: posts[2]._id,
      4: posts[3]._id,
      5: posts[4]._id,
      6: posts[5]._id,
    };

    // 8. Create comments
    const comments = await Comment.create([
      {
        postId: postMap[1],
        userId: userMap[2],
        text: "Looks great! Keep it up.",
        createdAt: new Date("2026-09-01T11:00:00"),
      },
      {
        postId: postMap[1],
        userId: userMap[3],
        text: "This looks amazing!",
        createdAt: new Date("2026-09-01T11:15:00"),
      },
      {
        postId: postMap[2],
        userId: userMap[1],
        text: "Really cool picture.",
        createdAt: new Date("2026-09-01T12:30:00"),
      },
      {
        postId: postMap[3],
        userId: userMap[4],
        text: "Beautiful!",
        createdAt: new Date("2026-09-02T09:45:00"),
      },
      {
        postId: postMap[3],
        userId: userMap[5],
        text: "What a great view.",
        createdAt: new Date("2026-09-02T10:00:00"),
      },
      {
        postId: postMap[4],
        userId: userMap[1],
        text: "That's a nice setup.",
        createdAt: new Date("2026-09-02T15:00:00"),
      },
      {
        postId: postMap[5],
        userId: userMap[2],
        text: "Looks like a fun trip!",
        createdAt: new Date("2026-09-03T12:00:00"),
      },
      {
        postId: postMap[6],
        userId: userMap[3],
        text: "Batman again! 😂",
        createdAt: new Date("2026-09-04T16:30:00"),
      },
    ]);
    console.log(`${comments.length} comments created`);

    // 9. Create albums
    const albums = await Album.create([
      {
        title: "Batman",
        userId: userMap[1],
        postIds: [postMap[1], postMap[6]],
      },
      {
        title: "Spaceman",
        userId: userMap[2],
        postIds: [postMap[2]],
      },
    ]);
    console.log(`${albums.length} albums created`);

    // 10. Finished
    console.log("\nDatabase successfully seeded!");
    console.log(`
Summary:
--------
Users: ${users.length}
Posts: ${posts.length}
Comments: ${comments.length}
Albums: ${albums.length}
`);
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedDatabase();