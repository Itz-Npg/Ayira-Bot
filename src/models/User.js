const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    noPrefix: {
        type: Boolean,
        default: false
    },
    blacklisted: {
        type: Boolean,
        default: false
    },
    blacklistReason: String,
    premium: {
        enabled: {
            type: Boolean,
            default: false
        },
        activatedAt: Date,
        expiresAt: Date,
        servers: {
            type: [String],
            default: []
        }
    },
    playlists: [{
        name: String,
        tracks: [{
            title: String,
            author: String,
            uri: String,
            duration: Number
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    likedSongs: [{
        title: String,
        author: String,
        url: String,
        duration: Number,
        thumbnail: String,
        addedAt: { type: Date, default: Date.now }
    }],
    spotify: {
        userId: String,
        displayName: String,
        profileImage: String,
        linkedAt: Date
    }
});

module.exports = mongoose.model('User', userSchema);