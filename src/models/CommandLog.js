const mongoose = require('mongoose');

const commandLogSchema = new mongoose.Schema({
    userId: String,
    username: String,
    guildId: String,
    guildName: String,
    channelId: String,
    channelName: String,
    command: String,
    args: [String],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Auto-delete logs older than 30 days
commandLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('CommandLog', commandLogSchema);
