const { Collection } = require('discord.js');

// Track command usage per user
const userCommandHistory = new Collection();
const blacklistedUsers = new Collection();

// Configuration
const SPAM_CONFIG = {
    MAX_COMMANDS: 10,        // Max commands allowed
    TIME_WINDOW: 60000,      // In 1 minute (60 seconds)
    BLACKLIST_DURATION: 300000, // 5 minutes blacklist
    WARNING_THRESHOLD: 7     // Warn at 7 commands
};

/**
 * Check if user is spamming commands and auto-blacklist if necessary
 * @param {string} userId - Discord user ID
 * @param {string} commandName - Command being executed
 * @returns {object} - { isSpamming: boolean, isBlacklisted: boolean, warning: boolean, remaining: number }
 */
function checkSpam(userId, commandName) {
    // Check if user is blacklisted
    if (blacklistedUsers.has(userId)) {
        const blacklistInfo = blacklistedUsers.get(userId);
        const now = Date.now();
        
        if (now < blacklistInfo.expiresAt) {
            const timeLeft = Math.ceil((blacklistInfo.expiresAt - now) / 1000);
            return {
                isSpamming: true,
                isBlacklisted: true,
                timeLeft: timeLeft,
                reason: blacklistInfo.reason
            };
        } else {
            // Blacklist expired, remove it
            blacklistedUsers.delete(userId);
        }
    }

    // Initialize user history if not exists
    if (!userCommandHistory.has(userId)) {
        userCommandHistory.set(userId, []);
    }

    const history = userCommandHistory.get(userId);
    const now = Date.now();

    // Remove old commands outside the time window
    const recentCommands = history.filter(cmd => now - cmd.timestamp < SPAM_CONFIG.TIME_WINDOW);
    
    // Add current command
    recentCommands.push({ commandName, timestamp: now });
    userCommandHistory.set(userId, recentCommands);

    const commandCount = recentCommands.length;

    // Check if user exceeded the limit
    if (commandCount > SPAM_CONFIG.MAX_COMMANDS) {
        // Auto-blacklist the user
        const expiresAt = now + SPAM_CONFIG.BLACKLIST_DURATION;
        blacklistedUsers.set(userId, {
            reason: 'Command spam detected',
            expiresAt: expiresAt,
            commandCount: commandCount
        });

        // Clear their history
        userCommandHistory.delete(userId);

        return {
            isSpamming: true,
            isBlacklisted: true,
            timeLeft: Math.ceil(SPAM_CONFIG.BLACKLIST_DURATION / 1000),
            reason: `Auto-blacklisted for spamming (${commandCount} commands in 1 minute)`
        };
    }

    // Warning if approaching limit
    if (commandCount >= SPAM_CONFIG.WARNING_THRESHOLD) {
        return {
            isSpamming: false,
            isBlacklisted: false,
            warning: true,
            remaining: SPAM_CONFIG.MAX_COMMANDS - commandCount,
            commandCount: commandCount
        };
    }

    return {
        isSpamming: false,
        isBlacklisted: false,
        warning: false
    };
}

/**
 * Manually blacklist a user (for admin commands)
 * @param {string} userId - Discord user ID
 * @param {number} duration - Blacklist duration in milliseconds
 * @param {string} reason - Reason for blacklist
 */
function manualBlacklist(userId, duration, reason) {
    const expiresAt = Date.now() + duration;
    blacklistedUsers.set(userId, {
        reason: reason,
        expiresAt: expiresAt,
        manual: true
    });
}

/**
 * Remove user from blacklist
 * @param {string} userId - Discord user ID
 */
function removeBlacklist(userId) {
    blacklistedUsers.delete(userId);
    userCommandHistory.delete(userId);
}

/**
 * Get blacklist info for a user
 * @param {string} userId - Discord user ID
 */
function getBlacklistInfo(userId) {
    if (!blacklistedUsers.has(userId)) {
        return null;
    }
    
    const info = blacklistedUsers.get(userId);
    const timeLeft = Math.ceil((info.expiresAt - Date.now()) / 1000);
    
    return {
        ...info,
        timeLeft: timeLeft > 0 ? timeLeft : 0
    };
}

module.exports = {
    checkSpam,
    manualBlacklist,
    removeBlacklist,
    getBlacklistInfo,
    SPAM_CONFIG
};
