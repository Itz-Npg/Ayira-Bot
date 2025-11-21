
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const config = require('../../../config.json');

module.exports = {
    name: 'spotify-globalplaylist',
    aliases: ['spotifyglobalplaylist', 'spglobalplaylist', 'spplaylist'],
    description: 'Load a Spotify playlist and add all tracks to the queue',
    usage: '!spotify-globalplaylist <url>',
    category: 'Spotify',
    
    async execute(message, args, client) {
        const isSlash = message.replied !== undefined || message.deferred !== undefined;
        
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            const response = embedBuilder.errorEmbed('Not in Voice Channel', 'You need to be in a voice channel to use this command!');
            return isSlash ? message.reply({ ...response, ephemeral: true }) : message.reply(response);
        }

        const player = client.lavalink.getPlayer(message.guild.id);
        
        if (player && player.voiceChannelId !== voiceChannel.id) {
            const response = embedBuilder.errorEmbed('Different Voice Channel', `I'm playing music in <#${player.voiceChannelId}>! Join that channel to control the music.`);
            return isSlash ? message.reply({ ...response, ephemeral: true }) : message.reply(response);
        }

        if (!config.spotify.clientId || !config.spotify.clientSecret) {
            const response = embedBuilder.errorEmbed('Not Configured', '❌ Spotify integration is not configured. Please contact the bot owner.');
            return isSlash ? message.reply({ ...response, ephemeral: true }) : message.reply(response);
        }

        if (isSlash) {
            await message.deferReply();
        }

        const playlistInput = isSlash ? message.options?.getString('url') : args.join(' ');
        
        if (!playlistInput) {
            const response = embedBuilder.errorEmbed(
                'Missing Playlist URL',
                'Please provide a Spotify playlist URL or ID.\n\n**Usage:** `!spotify-globalplaylist <url>`\n**Example:** `!spotify-globalplaylist https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M`'
            );
            return isSlash ? message.editReply(response) : message.reply(response);
        }
        
        const playlistIdMatch = playlistInput.match(/playlist[\/:]([a-zA-Z0-9]+)/);
        const playlistId = playlistIdMatch ? playlistIdMatch[1] : playlistInput;

        if (!playlistId) {
            const response = embedBuilder.errorEmbed(
                'Invalid Playlist URL',
                'Please provide a valid Spotify playlist URL or ID.'
            );
            return isSlash ? message.editReply(response) : message.reply(response);
        }

        try {
            let player = client.lavalink.getPlayer(message.guild.id);

            if (!player) {
                player = client.lavalink.createPlayer({
                    guildId: message.guild.id,
                    voiceChannelId: message.member.voice.channel.id,
                    textChannelId: message.channel.id,
                    selfDeaf: true,
                    selfMute: false
                });
                await player.connect();
            }

            const spotifyUrl = `https://open.spotify.com/playlist/${playlistId}`;
            
            const userId = message.author?.id || message.user.id;
            const searchResult = await client.lavalink.search(spotifyUrl, userId);

            // Enhanced debug logging like play.js
            console.log(`[SPOTIFY PLAYLIST] ===== SEARCH REQUEST =====`);
            console.log(`[SPOTIFY PLAYLIST] URL: ${spotifyUrl}`);
            console.log(`[SPOTIFY PLAYLIST] LoadType: ${searchResult?.loadType}`);
            console.log(`[SPOTIFY PLAYLIST] Data type: ${Array.isArray(searchResult?.data) ? 'array' : typeof searchResult?.data}`);
            
            if (searchResult?.loadType === 'error' || searchResult?.loadType === 'empty') {
                console.log(`[SPOTIFY PLAYLIST] Full Response:`, JSON.stringify(searchResult, null, 2));
            }

            if (!searchResult || searchResult.loadType === 'error') {
                const errorMessage = searchResult?.data?.message || searchResult?.data?.error || 'Unknown error occurred';
                console.error(`[SPOTIFY PLAYLIST ERROR] ${errorMessage}`);
                const response = embedBuilder.errorEmbed(
                    'Playlist Not Found',
                    `Could not load the Spotify playlist. ${errorMessage}\n\nMake sure the URL is correct and the playlist is public.`
                );
                return isSlash ? message.editReply(response) : message.reply(response);
            }

            if (searchResult.loadType === 'empty') {
                console.error(`[SPOTIFY PLAYLIST] No results for: ${spotifyUrl}`);
                const response = embedBuilder.errorEmbed(
                    'Playlist Not Found',
                    'Could not load the Spotify playlist. Make sure the URL is correct and the playlist is public.\n\n**Tip:** Your Lavalink server may need Spotify plugin configuration.'
                );
                return isSlash ? message.editReply(response) : message.reply(response);
            }

            // Handle different response types (same as play.js)
            let tracks = [];
            let playlistName = 'Spotify Playlist';
            
            if (searchResult.loadType === 'track') {
                // Single track loaded directly
                tracks = Array.isArray(searchResult.data) ? searchResult.data : [searchResult.data];
            } else if (searchResult.loadType === 'playlist') {
                if (Array.isArray(searchResult.data)) {
                    tracks = searchResult.data;
                } else if (searchResult.data && 'tracks' in searchResult.data) {
                    tracks = searchResult.data.tracks || [];
                    playlistName = searchResult.data.info?.name || playlistName;
                }
            } else if (searchResult.loadType === 'search') {
                tracks = Array.isArray(searchResult.data)
                    ? searchResult.data
                    : searchResult.data && 'tracks' in searchResult.data
                    ? searchResult.data.tracks
                    : [];
            }

            console.log(`[SPOTIFY PLAYLIST] Tracks found: ${tracks.length}`);

            if (tracks.length === 0) {
                const response = embedBuilder.errorEmbed(
                    'Playlist Empty',
                    'No tracks found in the playlist.'
                );
                return isSlash ? message.editReply(response) : message.reply(response);
            }

            for (const track of tracks) {
                await player.queue.add(track);
            }

            if (!player.playing && !player.paused) {
                await player.play();
            }

            const container = new ContainerBuilder()
                .setAccentColor(parseInt('FFC0CB', 16));

            const header = new TextDisplayBuilder()
                .setContent('## Spotify Playlist Loaded');
            container.addTextDisplayComponents(header);

            container.addSeparatorComponents(new SeparatorBuilder());

            const playlistNameText = new TextDisplayBuilder()
                .setContent(`Successfully loaded **${playlistName}**`);
            container.addTextDisplayComponents(playlistNameText);

            container.addSeparatorComponents(new SeparatorBuilder());

            const stats = new TextDisplayBuilder()
                .setContent(`**Tracks Added:** ${tracks.length}\n**Status:** ${player.playing ? 'Playing' : 'Queued'}`);
            container.addTextDisplayComponents(stats);

            const result = { 
                components: [container], 
                flags: MessageFlags.IsComponentsV2 
            };
            
            return isSlash ? message.editReply(result) : message.reply(result);

        } catch (error) {
            console.error('Spotify global playlist error:', error);
            const response = embedBuilder.errorEmbed(
                'Failed to Load Playlist',
                'An error occurred while loading the Spotify playlist. Please try again later.'
            );
            return isSlash ? message.editReply(response) : message.reply(response);
        }
    }
};
