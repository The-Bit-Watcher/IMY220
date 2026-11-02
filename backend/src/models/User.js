const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    // Stored as plain text on purpose: the IMY220 spec requires unhashed passwords for marking.
    // select: false keeps it out of every query unless explicitly asked for with .select("+password").
    password: {
        type: String,
        required: true,
        select: false
    },
    bio: {
        type: String,
        default:"",
    },
    profileImage:{
        type: String,
        default: ""//will store the empty robot image here, so it will have this. 
    },
    location: {
        type: String,
        default: ""
    },

    joinedDate: {
        type: Date,
        default: Date.now
    },
    friends: {
    type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    default: []
    },
    favouriteIds: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        default: []
    },
    sentRequests: [{ 
            type: mongoose.Schema.Types.ObjectId, ref: "User" 
        }],
    // Incoming friend requests (the routes already relied on this field, it was missing from the schema)
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
    socialLinks: {
        twitter: { type: String, default: "" },
        github: { type: String, default: "" },
        website: { type: String, default: "" }
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    // Set by an admin approving a verification request
    verified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model(
    "User", 
    UserSchema
);