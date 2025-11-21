const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
};

const log = {
    info: (msg) => console.log(`${colors.cyan}[VC-STATUS]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[VC-STATUS]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[VC-STATUS]${colors.reset} ${msg}`),
};

const updateTimeouts = new Map();
const DEBOUNCE_TIME = 1000;

class VoiceStatusManager {
    constructor(client) {
        this.client = client;
    }

    async updateStatus(voiceChannelId, status) {
        if (!voiceChannelId) return;

        if (updateTimeouts.has(voiceChannelId)) {
            clearTimeout(updateTimeouts.get(voiceChannelId));
        }

        const timeoutId = setTimeout(async () => {
            try {
                await this.client.rest.put(`/channels/${voiceChannelId}/voice-status`, {
                    body: { status: status || '' }
                });
                
                if (status) {
                    log.info(`Status set: "${status}"`);
                } else {
                    log.info('Status cleared');
                }
            } catch (error) {
                if (error.code === 50001) {
                    log.warn('Missing access to update voice channel status');
                } else if (error.code === 50013) {
                    log.warn('Missing permissions to update voice channel status');
                } else if (error.status === 404) {
                    log.warn('Voice channel not found');
                } else {
                    log.error(`Failed to update voice status: ${error.message}`);
                }
            } finally {
                updateTimeouts.delete(voiceChannelId);
            }
        }, DEBOUNCE_TIME);

        updateTimeouts.set(voiceChannelId, timeoutId);
    }

    async setNowPlayingStatus(voiceChannelId, trackTitle, trackAuthor) {
        if (!voiceChannelId || !trackTitle) return;
        
        const status = `🎵 ${trackTitle}${trackAuthor ? ` - ${trackAuthor}` : ''}`;
        const truncated = status.length > 500 ? status.substring(0, 497) + '...' : status;
        
        await this.updateStatus(voiceChannelId, truncated);
    }

    async setIdleStatus(voiceChannelId) {
        if (!voiceChannelId) return;
        
        const idleMessages = [
            '🎧 Ready to play music',
            '💤 Waiting for next track...',
            '🎶 Queue is empty',
            '🔊 Ready when you are'
        ];
        
        const randomMessage = idleMessages[Math.floor(Math.random() * idleMessages.length)];
        await this.updateStatus(voiceChannelId, randomMessage);
    }

    async clearStatus(voiceChannelId) {
        if (!voiceChannelId) return;
        
        await this.updateStatus(voiceChannelId, '');
    }
}

let instance = null;

module.exports = {
    init: (client) => {
        if (!instance) {
            instance = new VoiceStatusManager(client);
        }
        return instance;
    },
    getInstance: () => {
        if (!instance) {
            throw new Error('VoiceStatusManager not initialized. Call init(client) first.');
        }
        return instance;
    }
};
