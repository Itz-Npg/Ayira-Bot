/**
 * Music Session Manager
 * Tracks who requested music commands and controls for user-specific button interactions
 */

class MusicSessionManager {
    constructor() {
        // Map: guildId -> { nowPlayingRequester: userId, helpRequester: userId }
        this.sessions = new Map();
    }

    /**
     * Set the requester for the now playing message in a guild
     * @param {string} guildId - The guild ID
     * @param {string} userId - The user ID who requested the track
     */
    setNowPlayingRequester(guildId, userId) {
        if (!this.sessions.has(guildId)) {
            this.sessions.set(guildId, {});
        }
        const session = this.sessions.get(guildId);
        session.nowPlayingRequester = userId;
    }

    /**
     * Get the requester for the now playing message in a guild
     * @param {string} guildId - The guild ID
     * @returns {string|null} - The user ID or null if not found
     */
    getNowPlayingRequester(guildId) {
        const session = this.sessions.get(guildId);
        return session?.nowPlayingRequester || null;
    }

    /**
     * Set the requester for help command in a guild
     * @param {string} guildId - The guild ID
     * @param {string} userId - The user ID who requested help
     */
    setHelpRequester(guildId, userId) {
        if (!this.sessions.has(guildId)) {
            this.sessions.set(guildId, {});
        }
        const session = this.sessions.get(guildId);
        session.helpRequester = userId;
    }

    /**
     * Get the requester for help command in a guild
     * @param {string} guildId - The guild ID
     * @returns {string|null} - The user ID or null if not found
     */
    getHelpRequester(guildId) {
        const session = this.sessions.get(guildId);
        return session?.helpRequester || null;
    }

    /**
     * Clear all data for a guild (when player is destroyed)
     * @param {string} guildId - The guild ID
     */
    clearGuildSession(guildId) {
        this.sessions.delete(guildId);
    }

    /**
     * Check if a user can use music controls in a guild
     * @param {string} guildId - The guild ID
     * @param {string} userId - The user ID to check
     * @returns {boolean} - True if user can use controls
     */
    canUseControls(guildId, userId) {
        const requester = this.getNowPlayingRequester(guildId);
        // If no requester is set, allow anyone (backwards compatibility)
        if (!requester) return true;
        return requester === userId;
    }

    /**
     * Check if a user can use help dropdown in a guild
     * @param {string} guildId - The guild ID
     * @param {string} userId - The user ID to check
     * @returns {boolean} - True if user can use dropdown
     */
    canUseHelpDropdown(guildId, userId) {
        const requester = this.getHelpRequester(guildId);
        // If no requester is set, allow anyone (backwards compatibility)
        if (!requester) return true;
        return requester === userId;
    }
}

// Export a singleton instance
module.exports = new MusicSessionManager();
