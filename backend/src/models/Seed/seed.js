// seed.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") }); // backend/.env
const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // Make sure bcrypt or bcryptjs is installed

// Import Mongoose Models
const User = require("../User");       // Adjust paths according to your project structure
const Post = require("../Post");
const Album = require("../Albums");
const Comment = require("../Comment");
const Report = require("../Report");

// MongoDB Connection URI - Update with your actual MongoDB connection string
const MONGO_URI = process.env.DB_URL;
if (!MONGO_URI) {
  console.error("DB_URL is not set. Put it in backend/.env (same file server.js reads).");
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // 1. Clear existing data to avoid duplicate key errors
    console.log("Clearing old data...");
    await User.deleteMany({});
    await Post.deleteMany({});
    await Album.deleteMany({});
    await Comment.deleteMany({});
    await Report.deleteMany({});

    // 2. Create Users
    console.log("Seeding Users...");
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    const user1 = await User.create({
      username: "johndoe",
      name: "John Doe",
      email: "john@example.com",
      hashedPassword: hashedPassword, // Matches hashedPassword field[cite: 26]
      bio: "Software developer & photography enthusiast.",
      profileImage: "https://via.placeholder.com/150",
      location: "Cape Town, South Africa",
      friends: [],
      favouriteIds: [],
      sentRequests: []
    });

    const user2 = await User.create({
      username: "janesmith",
      name: "Jane Smith",
      email: "jane@example.com",
      hashedPassword: hashedPassword, // Matches hashedPassword field[cite: 26]
      bio: "Digital artist & traveler.",
      profileImage: "https://via.placeholder.com/150",
      location: "Pretoria, South Africa",
      friends: [user1._id], // Link user1 as friend
      favouriteIds: [user1._id],
      sentRequests: []
    });

    const adminUser = await User.create({
      username: "admin",
      name: "Site Admin",
      email: "admin@example.com",
      hashedPassword: hashedPassword,
      role: "admin"
    });

    // A third user with no friends yet: shows up in John/Jane's recommendations
    const user3 = await User.create({
      username: "mikebrown",
      name: "Mike Brown",
      email: "mike@example.com",
      hashedPassword: hashedPassword,
      bio: "Street photographer.",
      location: "Johannesburg, South Africa",
      friends: [user2._id]
    });
    user2.friends.push(user3._id);
    await user2.save();

    // Update user1's friends array to link user2 back
    user1.friends.push(user2._id);
    await user1.save();

    // 3. Create Posts
    console.log("Seeding Posts...");
    const post1 = await Post.create({
      userId: user1._id, // Matches Post schema[cite: 24]
      caption: "Beautiful sunset view from the mountaintop! #nature #travel",
      image: "https://picsum.photos/600/400?random=1",
      hashtags: Post.formatHashtags("#nature #travel"), // Using schema static helper[cite: 24]
      likes: 12,
      albums: []
    });

    const post2 = await Post.create({
      userId: user2._id, // Matches Post schema[cite: 24]
      caption: "Working on new UI designs today. #design #code",
      image: "https://picsum.photos/600/400?random=2",
      hashtags: Post.formatHashtags("design, code"), // Using schema static helper[cite: 24]
      likes: 5,
      albums: []
    });

    // 4. Create Albums
    console.log("Seeding Albums...");
    const album1 = await Album.create({
      title: "Nature Trips", // Matches Album schema[cite: 22]
      description: "Collection of photography from hiking trips.", // Matches Album schema[cite: 22]
      userId: user1._id, // Matches Album schema[cite: 22]
      hashtags: post1.hashtags, // album tags are auto-filled from its posts
      postId: [post1._id] // Matches Album schema[cite: 22]
    });

    // Link album back to post1
    post1.albums.push(album1._id);
    await post1.save();

    // 5. Create Comments
    console.log("Seeding Comments...");
    await Comment.create({
      postId: post1._id, // Matches Comment schema[cite: 23]
      userId: user2._id, // Matches Comment schema[cite: 23]
      text: "Incredible shot! Which camera did you use?" // Matches Comment schema[cite: 23]
    });

    await Comment.create({
      postId: post1._id, // Matches Comment schema[cite: 23]
      userId: user1._id, // Matches Comment schema[cite: 23]
      text: "Thanks Jane! Shot this on a Sony A7III." // Matches Comment schema[cite: 23]
    });

    // 6. Create Reports
    console.log("Seeding Reports...");
    await Report.create({
      postId: post2._id, // Matches Report schema[cite: 25]
      reportedBy: user1._id, // Matches Report schema[cite: 25]
      reason: "Spam", // Must match enum: ["Spam", "Inappropriate Content", ...][cite: 25]
      additionalDetails: "Looks like a duplicate post.",
      status: "Pending" // Matches enum: ["Pending", "Reviewed", "Resolved"][cite: 25]
    });

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit();
  }
};

seedDatabase();