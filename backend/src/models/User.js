const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String, 
        required: true,
        unique: true
    },
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    hashedPassword: {
        type: String,
        required: true
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
    }
});

module.exports = mongoose.model(
    "User", 
    UserSchema
);