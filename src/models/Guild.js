const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    prefix: {
        type: String,
        default: '!'
    },
    premium: {
        enabled: {
            type: Boolean,
            default: false
        },
        activatedBy: String,
        activatedAt: Date,
        expiresAt: Date
    },
    ignoreChannels: {
        type: [String],
        default: []
    },
    ignoreRoles: {
        type: [String],
        default: []
    },
    247: {
        enabled: {
            type: Boolean,
            default: false
        },
        voiceChannel: String,
        textChannel: String
    },
    musicPreset: {
        type: String,
        enum: ['classic', 'musicard-dynamic', 'musicard-classic', 'musicard-custom'],
        default: 'classic'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Guild', guildSchema);
