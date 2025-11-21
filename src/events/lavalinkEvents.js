const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
};

const log = {
    event: (msg) => console.log(`${colors.blue}[EVENT]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
};

module.exports = (client) => {
    client.lavalink.on('nodeConnect', (node) => {
        const nodeName = node.options?.id || node.options?.identifier || 'Unknown';
        console.log('\n' + colors.green);
        console.log('  ┌───────────────────────────────────────────────────────┐');
        console.log(`  │   Lavalink Node Connected: ${nodeName.padEnd(22)} │`);
        console.log('  └───────────────────────────────────────────────────────┘');
        console.log(colors.reset);
        log.success(`Node "${nodeName}" is ready at ${node.options?.host || 'unknown'}:${node.options?.port || 'unknown'}`);
        
        const webhookLogger = require('../utils/webhookLogger');
        webhookLogger.logLavalinkConnect({
            nodeName: nodeName,
            host: node.options?.host || 'unknown',
            port: node.options?.port || 'unknown'
        }).catch(() => {});
    });

    client.lavalink.on('nodeDisconnect', (node, reason) => {
        const nodeName = node.options?.id || node.options?.identifier || 'Unknown';
        console.log('\n' + colors.red);
        console.log('  ┌───────────────────────────────────────────────────────┐');
        console.log(`  │   Lavalink Node Disconnected: ${nodeName.padEnd(20)} │`);
        console.log('  └───────────────────────────────────────────────────────┘');
        console.log(colors.reset);
        log.warn(`Node "${nodeName}" disconnected - Reason: ${reason}`);
        
        const webhookLogger = require('../utils/webhookLogger');
        webhookLogger.logLavalinkDisconnect({
            nodeName: nodeName,
            reason: reason || 'Unknown'
        }).catch(() => {});
    });

    client.lavalink.on('nodeError', (node, error) => {
        const nodeName = node?.options?.id || node?.options?.identifier || 'Unknown';
        log.error(`Node "${nodeName}" error: ${error.message}`);
    });

    client.lavalink.on('trackStart', async (player, track) => {
        const guild = client.guilds.cache.get(player.guildId);
        log.event(`Track started in ${guild?.name || player.guildId}: ${track.info.title}`);
        
        const embedBuilder = require('../utils/embedBuilder');
        const sessionManager = require('../utils/musicSessionManager');
        const Guild = require('../models/Guild');
        const channel = client.channels.cache.get(player.textChannelId);
        
        if (channel) {
            const requester = track.requester ? `<@${track.requester}>` : 'Unknown';
            const requesterId = track.requester;
            
            // Set the session requester for this guild
            if (requesterId) {
                sessionManager.setNowPlayingRequester(player.guildId, requesterId);
            }
            
            // Get guild music preset
            let guildData = await Guild.findOne({ guildId: player.guildId });
            const musicPreset = guildData?.musicPreset || 'classic';
            
            // Generate musiccard if preset is not classic
            if (musicPreset.startsWith('musicard-')) {
                try {
                    const { musicCard } = require('musicard');
                    const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                    
                    // Determine theme based on preset
                    let theme = 'dynamic';
                    if (musicPreset === 'musicard-classic') theme = 'classic';
                    if (musicPreset === 'musicard-custom') theme = 'custom';
                    
                    // Generate music card
                    const cardBuffer = await musicCard({
                        thumbnailImage: track.info.artworkUrl || track.info.thumbnail || 'https://i.imgur.com/vHAu2Bb.png',
                        name: track.info.title || 'Unknown',
                        author: track.info.author || 'Unknown Artist',
                        color: 'auto',
                        theme: theme,
                        brightness: 75,
                        progress: 0,
                        startTime: 0,
                        endTime: track.info.duration || 0
                    });
                    
                    const attachment = new AttachmentBuilder(cardBuffer, { name: 'music-card.png' });
                    
                    // Use the same button creation as embedBuilder for consistency and security
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('music_previous')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('⏮️'),
                            new ButtonBuilder()
                                .setCustomId('music_pauseresume')
                                .setLabel(player.paused ? 'Resume' : 'Pause')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji(player.paused ? '▶️' : '⏸️'),
                            new ButtonBuilder()
                                .setCustomId('music_skip')
                                .setLabel('Skip')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('⏭️'),
                            new ButtonBuilder()
                                .setCustomId('music_stop')
                                .setLabel('Stop')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('⏹️'),
                            new ButtonBuilder()
                                .setCustomId('music_like')
                                .setEmoji('👍')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    await channel.send({ 
                        content: `🎵 **Now Playing** - Requested by ${requester}`,
                        files: [attachment],
                        components: [row]
                    });
                    
                    log.success(`Music card generated with ${theme} theme for ${guild?.name || player.guildId}`);
                } catch (error) {
                    log.error(`Music card generation failed: ${error.message}`);
                    log.warn(`Falling back to classic embed for ${guild?.name || player.guildId}`);
                    // Fallback to classic embed
                    channel.send(embedBuilder.nowPlayingEmbed(track, player, requester, requesterId)).catch(() => {});
                }
            } else {
                // Use classic embed
                channel.send(embedBuilder.nowPlayingEmbed(track, player, requester, requesterId)).catch(() => {});
            }
        }
    });

    client.lavalink.on('trackEnd', async (player, track, reason) => {
        const guild = client.guilds.cache.get(player.guildId);
        log.event(`Track ended in ${guild?.name || player.guildId}: ${track.info.title} (${reason})`);
        
        // If autoplay is enabled and track was manually skipped with empty queue, trigger autoplay
        if (player.autoPlay && reason === 'stopped' && player.queue.size === 0) {
            log.event(`Triggering autoplay after manual skip in ${guild?.name || player.guildId}`);
            
            try {
                // Get the track to base autoplay on
                const trackForAutoplay = player.lastPlayedTrack || track;
                
                // Search for related tracks using the same logic as package
                const searchQuery = `${trackForAutoplay.info.author} popular songs`;
                const result = await client.lavalink.search(searchQuery, track.requester);
                
                if (result.loadType === 'search' && Array.isArray(result.data) && result.data.length > 0) {
                    // Filter out the current track and pick a random one
                    const relatedTracks = result.data.filter(t => 
                        t.info.identifier !== trackForAutoplay.info.identifier &&
                        t.info.identifier !== track.info.identifier
                    );
                    
                    if (relatedTracks.length > 0) {
                        const randomTrack = relatedTracks[Math.floor(Math.random() * relatedTracks.length)];
                        await player.queue.add(randomTrack);
                        await player.skip();
                        
                        // Manually emit the autoPlayTrack event
                        client.lavalink.emit('autoPlayTrack', player, randomTrack);
                        return; // Don't show "Track Ended" message
                    }
                }
            } catch (error) {
                log.error(`Autoplay after skip failed: ${error.message}`);
            }
        }
        
        // Don't send ended message if autoplay is enabled and track finished naturally
        // This prevents the "Track Ended" message from interrupting autoplay
        if (player.autoPlay && reason === 'finished') {
            return;
        }
        
        // Don't send ended message if autoplay is enabled and track was stopped (skip triggered autoplay above)
        if (player.autoPlay && reason === 'stopped') {
            return;
        }
        
        // Only send ended message for stopped, replaced, or finished tracks (when autoplay is off)
        if (reason === 'stopped' || reason === 'replaced' || reason === 'finished') {
            const embedBuilder = require('../utils/embedBuilder');
            const channel = client.channels.cache.get(player.textChannelId);
            if (channel) {
                let endMessage = '';
                if (reason === 'stopped') {
                    endMessage = `Track stopped: **${track.info.title}**`;
                } else if (reason === 'replaced') {
                    endMessage = `Track replaced: **${track.info.title}**`;
                } else if (reason === 'finished') {
                    endMessage = `Track finished: **${track.info.title}**`;
                }
                
                channel.send(embedBuilder.infoEmbed('Track Ended', endMessage)).catch(() => {});
            }
        }
    });

    client.lavalink.on('queueEnd', async (player) => {
        const guild = client.guilds.cache.get(player.guildId);
        log.event(`Queue ended in ${guild?.name || player.guildId} | AutoPlay: ${player.autoPlay}`);
        
        const Guild = require('../models/Guild');
        const guildData = await Guild.findOne({ guildId: player.guildId });
        
        const channel = client.channels.cache.get(player.textChannelId);
        
        if (guildData && guildData['247'].enabled) {
            if (channel && !player.autoPlay) {
                const embedBuilder = require('../utils/embedBuilder');
                channel.send(embedBuilder.infoEmbed('Queue Ended', '24/7 mode is enabled. I will stay connected.')).catch(() => {});
            }
            log.event(`24/7 mode enabled in ${guild?.name || player.guildId} - staying connected`);
        } else if (!player.autoPlay) {
            if (channel) {
                const embedBuilder = require('../utils/embedBuilder');
                channel.send(embedBuilder.infoEmbed('Queue Ended', 'Add more tracks or I will leave in 60 seconds.')).catch(() => {});
            }
        }
    });

    client.lavalink.on('trackError', (player, track, error) => {
        const guild = client.guilds.cache.get(player.guildId);
        log.error(`Track error in ${guild?.name || player.guildId}: ${track.info.title} - ${error.message}`);
        
        const embedBuilder = require('../utils/embedBuilder');
        const channel = client.channels.cache.get(player.textChannelId);
        if (channel) {
            channel.send(embedBuilder.errorEmbed('Error', `Error playing: ${track.info.title}`)).catch(() => {});
        }
    });

    client.lavalink.on('autoPlayTrack', (player, track) => {
        const guild = client.guilds.cache.get(player.guildId);
        log.event(`Autoplay in ${guild?.name || player.guildId}: ${track.info.title}`);
        
        const embedBuilder = require('../utils/embedBuilder');
        const channel = client.channels.cache.get(player.textChannelId);
        if (channel) {
            const { 
                ContainerBuilder, 
                TextDisplayBuilder, 
                SectionBuilder,
                ThumbnailBuilder,
                SeparatorBuilder,
                MessageFlags
            } = require('discord.js');
            
            const container = new ContainerBuilder();
            const header = new TextDisplayBuilder()
                .setContent('## 🎵 AutoPlay');
            container.addTextDisplayComponents(header);
            container.addSeparatorComponents(new SeparatorBuilder());
            
            const requester = track.requester ? `<@${track.requester}>` : 'Unknown';
            const formatDuration = (ms) => {
                if (!ms || ms === 0) return '00:00';
                const seconds = Math.floor(ms / 1000);
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                if (hours > 0) {
                    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                }
                return `${minutes}:${String(secs).padStart(2, '0')}`;
            };
            
            const duration = track.info.duration ?? track.info.length ?? 0;
            const trackInfo = new TextDisplayBuilder()
                .setContent(`• [${track.info.title}](${track.info.uri})\n• ${track.info.author}\n• Duration: **${formatDuration(duration)}**`);
            
            const section = new SectionBuilder()
                .addTextDisplayComponents(trackInfo);
            
            const artworkUrl = track.info.artworkUrl || track.info.thumbnail;
            if (artworkUrl) {
                const thumbnail = new ThumbnailBuilder({ 
                    media: { url: artworkUrl } 
                });
                section.setThumbnailAccessory(thumbnail);
            }
            
            container.addSectionComponents(section);
            
            channel.send({ 
                components: [container], 
                flags: MessageFlags.IsComponentsV2 
            }).catch(() => {});
        }
    });

    client.lavalink.on('playerDestroy', (player, reason) => {
        const guild = client.guilds.cache.get(player.guildId);
        log.event(`Player destroyed in ${guild?.name || player.guildId} - Reason: ${reason}`);
        
        // Clear session data when player is destroyed
        const sessionManager = require('../utils/musicSessionManager');
        sessionManager.clearGuildSession(player.guildId);
    });

    client.lavalink.on('playerCreate', (player) => {
        const guild = client.guilds.cache.get(player.guildId);
        log.event(`Player created in ${guild?.name || player.guildId}`);
    });

    log.success('Lavalink events initialized');
};
