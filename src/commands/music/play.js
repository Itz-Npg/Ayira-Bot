const embedBuilder = require('../../utils/embedBuilder');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function formatDuration(ms) {
    if (!ms || ms === 0) return '00:00';
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function createMusicButtons(player) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_previous')
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!player.queue.previous || player.queue.previous.length === 0),
        new ButtonBuilder()
            .setCustomId('music_pauseresume')
            .setEmoji(player.paused ? '▶️' : '⏸️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_skip')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(player.queue.tracks.length === 0),
        new ButtonBuilder()
            .setCustomId('music_stop')
            .setEmoji('⏹️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('music_like')
            .setEmoji('👍')
            .setStyle(ButtonStyle.Success)
    );

    return [row];
}

module.exports = {
    name: 'play',
    aliases: ['p'],
    description: 'Play music from any link (YouTube, Spotify, SoundCloud, Apple Music, and more) or search by name',
    usage: '!play <song name or URL>',
    category: 'Music',
    cooldown: 2000,
    
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply(embedBuilder.errorEmbed('Not in Voice Channel', 'You need to be in a voice channel!'));
        }

        if (!args.length) {
            return message.reply(embedBuilder.errorEmbed('No Query', `Usage: ${this.usage}`));
        }

        const query = args.join(' ');
        const searching = await message.reply('Searching...');

        try {
            let player = client.lavalink.getPlayer(message.guild.id);

            // Check if bot is already in a different voice channel
            if (player && player.voiceChannelId !== voiceChannel.id) {
                return searching.edit({
                    content: null,
                    ...embedBuilder.errorEmbed('Different Voice Channel', `I'm already playing music in <#${player.voiceChannelId}>! Join that channel or wait for the music to finish.`)
                });
            }

            if (!player) {
                player = client.lavalink.createPlayer({
                    guildId: message.guild.id,
                    voiceChannelId: voiceChannel.id,
                    textChannelId: message.channel.id,
                    selfDeaf: true,
                    selfMute: false,
                    volume: 100,
                });

                await player.connect();
            }

            // Detect source from URL
            let searchSource = null;
            const urlPatterns = {
                youtube: /(?:youtube\.com|youtu\.be)/i,
                spotify: /spotify\.com/i,
                soundcloud: /soundcloud\.com/i,
                applemusic: /music\.apple\.com/i
            };
            
            for (const [source, pattern] of Object.entries(urlPatterns)) {
                if (pattern.test(query)) {
                    searchSource = source;
                    break;
                }
            }

            const res = await client.lavalink.search(query, message.author.id);

            // Enhanced debug logging
            console.log(`[SEARCH DEBUG] ===== SEARCH REQUEST =====`);
            console.log(`[SEARCH DEBUG] Query: ${query}`);
            console.log(`[SEARCH DEBUG] Detected Source: ${searchSource || 'search/auto'}`);
            console.log(`[SEARCH DEBUG] Active Node: ${player?.node?.identifier || 'none'}`);
            console.log(`[SEARCH DEBUG] LoadType: ${res.loadType}`);
            console.log(`[SEARCH DEBUG] Data type: ${Array.isArray(res.data) ? 'array' : typeof res.data}`);
            
            if (res.loadType === 'error' || res.loadType === 'empty') {
                console.log(`[SEARCH DEBUG] Full Response:`, JSON.stringify(res, null, 2));
            }

            if (res.loadType === 'error') {
                const errorMessage = res.data?.message || res.data?.error || 'Unknown error occurred';
                const severity = res.data?.severity || 'unknown';
                console.error(`[SEARCH ERROR] Severity: ${severity}, Message: ${errorMessage}`);
                console.error(`[SEARCH ERROR] Full error data:`, res.data);
                
                return searching.edit({
                    content: null,
                    ...embedBuilder.errorEmbed('Search Error', `Failed to load track: ${errorMessage}\n\n> Source: ${searchSource || 'auto'}\n> This might be a Lavalink plugin issue.`)
                });
            }

            if (res.loadType === 'empty') {
                console.error(`[SEARCH EMPTY] No results for query: ${query}`);
                console.error(`[SEARCH EMPTY] Detected source: ${searchSource || 'none'}`);
                console.error(`[SEARCH EMPTY] This usually means the Lavalink plugin for this source is not working.`);
                
                let helpText = 'No tracks found for your query!';
                if (searchSource === 'spotify') {
                    helpText += '\n\n**Spotify Issue Detected:**\n> Your Lavalink server may be missing:\n> • Spotify plugin\n> • Spotify API credentials (Client ID & Secret)\n> Contact your Lavalink server administrator.';
                } else if (searchSource === 'youtube') {
                    helpText += '\n\n**YouTube Issue Detected:**\n> Your Lavalink server may be missing:\n> • YouTube source plugin\n> Contact your Lavalink server administrator.';
                } else {
                    helpText += '\n\nTry:\n• Using a different search term\n• Using a direct YouTube/Spotify link';
                }
                
                return searching.edit({
                    content: null,
                    ...embedBuilder.errorEmbed('No Results', helpText)
                });
            }

            // Handle different response types
            let tracks = [];
            
            if (res.loadType === 'track') {
                // Single track loaded directly - data might be array or object
                tracks = Array.isArray(res.data) ? res.data : [res.data];
            } else if (res.loadType === 'search' || res.loadType === 'playlist') {
                tracks = Array.isArray(res.data)
                    ? res.data
                    : res.data && 'tracks' in res.data
                    ? res.data.tracks
                    : [];
            }

            console.log(`[SEARCH DEBUG] Tracks found: ${tracks.length}`);
            if (tracks.length > 0) {
                console.log(`[SEARCH DEBUG] First track structure:`, {
                    hasInfo: !!tracks[0].info,
                    hasTitle: !!tracks[0]?.info?.title,
                    hasDuration: tracks[0]?.info?.duration !== undefined
                });
            }

            if (tracks.length === 0) {
                return searching.edit({
                    content: null,
                    ...embedBuilder.errorEmbed('No Results', 'No tracks found in search results! The link may be invalid or the platform is not supported.')
                });
            }

            // Minimum duration validation (30 seconds)
            const MIN_DURATION = 30000; // 30 seconds in milliseconds
            
            if (res.loadType === 'playlist' && !Array.isArray(res.data) && res.data.info) {
                // Filter out tracks that are too short
                const validTracks = tracks.filter(track => {
                    const duration = track.info.duration || 0;
                    return duration >= MIN_DURATION || duration === 0; // Allow live streams (duration = 0)
                });

                if (validTracks.length === 0) {
                    return searching.edit({
                        content: null,
                        ...embedBuilder.errorEmbed('Invalid Playlist', 'All tracks in this playlist are too short (minimum 30 seconds required).')
                    });
                }

                const skippedCount = tracks.length - validTracks.length;
                
                for (const track of validTracks) {
                    // Set requester on track
                    track.requester = message.author.id;
                    await player.queue.add(track);
                }
                
                const totalDuration = validTracks.reduce((acc, track) => acc + (track.info.duration || 0), 0);

                const skipMessage = skippedCount > 0 ? `\n> ⚠️ Skipped ${skippedCount} short track(s) (< 30s)` : '';
                
                await searching.edit({ 
                    content: null, 
                    ...embedBuilder.musicEmbed(
                        'Playlist Added',
                        `Added **${validTracks.length}** tracks from **${res.data.info.name}**\n\n> Queue Size: ${player.queue.tracks.length} tracks\n> Duration: ${formatDuration(totalDuration)}${skipMessage}`,
                        validTracks[0]?.info?.artworkUrl
                    )
                });
            } else {
                const track = tracks[0];
                
                // Check minimum duration for single tracks
                const duration = track.info.duration || 0;
                if (duration > 0 && duration < MIN_DURATION) {
                    return searching.edit({
                        content: null,
                        ...embedBuilder.errorEmbed('Track Too Short', `This track is too short (${formatDuration(duration)}). Minimum duration is 30 seconds.`)
                    });
                }
                
                // Set requester on track
                track.requester = message.author.id;
                await player.queue.add(track);

                const isPlaying = player.playing || player.paused;
                
                if (isPlaying) {
                    await searching.edit({ 
                        content: null, 
                        ...embedBuilder.musicEmbed(
                            'Track Enqueued',
                            `**[${track.info.title}](${track.info.uri})**\n\n> Author: ${track.info.author}\n> Duration: ${formatDuration(track.info.duration || 0)}\n> Position: #${player.queue.tracks.length}`,
                            track.info.artworkUrl
                        )
                    });
                } else {
                    await searching.delete().catch(() => {});
                }
            }

            if (!player.playing && !player.paused) {
                await player.play();
            }

        } catch (error) {
            console.error('Play error:', error);
            searching.edit({
                content: null,
                ...embedBuilder.errorEmbed('Error', 'Failed to play track. Make sure Lavalink server is running!')
            }).catch(() => {});
        }
    }
};
