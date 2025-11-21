const mongoose = require('mongoose');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

class Database {
    constructor() {
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.isConnected) {
                console.log(`${colors.cyan}[DATABASE]${colors.reset} Already connected to MongoDB`);
                return;
            }

            const uri = process.env.MONGODB_URI;

            if (!uri) {
                throw new Error('MONGODB_URI is not defined in environment variables');
            }

            await mongoose.connect(uri);

            this.isConnected = true;

            console.log('\n' + colors.green);
            console.log('  ┌───────────────────────────────────────────────────────┐');
            console.log('  │        MongoDB Connected Successfully!               │');
            console.log('  └───────────────────────────────────────────────────────┘');
            console.log(colors.reset);

            mongoose.connection.on('error', (err) => {
                console.error(`${colors.red}[DATABASE ERROR]${colors.reset}`, err);
            });

            mongoose.connection.on('disconnected', () => {
                console.log(`${colors.red}[DATABASE]${colors.reset} Disconnected from MongoDB`);
                this.isConnected = false;
            });

        } catch (error) {
            console.error(`${colors.red}[DATABASE ERROR]${colors.reset} Failed to connect to MongoDB:`, error.message);
            process.exit(1);
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log(`${colors.cyan}[DATABASE]${colors.reset} Disconnected from MongoDB`);
        }
    }
}

async function saveSpotifyAuth(discordUserId, spotifyUserId, displayName, profileImage = null) {
    const User = require('../models/User'); // Assuming User model is in '../models/User'
    await User.findOneAndUpdate(
        { userId: discordUserId },
        {
            $set: {
                spotify: {
                    userId: spotifyUserId,
                    displayName: displayName,
                    profileImage: profileImage,
                    linkedAt: new Date()
                }
            }
        },
        { upsert: true, new: true }
    );
}

async function getSpotifyAuth(discordUserId) {
    const User = require('../models/User'); // Assuming User model is in '../models/User'
    const user = await User.findOne({ userId: discordUserId });
    if (!user || !user.spotify || !user.spotify.userId) {
        return null;
    }
    return {
        userId: user.spotify.userId, // Correctly returning Spotify user ID
        displayName: user.spotify.displayName, // Correctly returning display name
        profileImage: user.spotify.profileImage // Returning profile image
    };
}

async function removeSpotifyAuth(discordUserId) {
    const User = require('../models/User');
    await User.findOneAndUpdate(
        { userId: discordUserId },
        { $unset: { spotify: "" } }
    );
}

module.exports = {
    connect: new Database().connect, // Expose connect method from instance
    saveSpotifyAuth,
    getSpotifyAuth,
    removeSpotifyAuth
};