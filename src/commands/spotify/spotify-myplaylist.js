
const { ActionRowBuilder, StringSelectMenuBuilder, ComponentType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const axios = require('axios');
const config = require('../../../config.json');
const { saveSpotifyAuth, getSpotifyAuth } = require('../../handlers/database');

module.exports = {
    name: 'spotify-myplaylist',
    aliases: ['spotifymyplaylist', 'spmyplaylist', 'myspotify'],
    description: 'View and play your linked Spotify public playlists',
    usage: '!spotify-myplaylist',
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
        
        if (isSlash) {
            await message.deferReply();
        }

        const userId = message.author?.id || message.user.id;
        const auth = await getSpotifyAuth(userId);
        
        if (!auth) {
            const response = embedBuilder.errorEmbed('Not Linked', '❌ You need to link your Spotify account first! Use `!spotify-login` or `/spotify-login`');
            return isSlash ? message.editReply(response) : message.reply(response);
        }

        try {
            const authResponse = await axios.post('https://accounts.spotify.com/api/token', 
                'grant_type=client_credentials', {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(config.spotify.clientId + ':' + config.spotify.clientSecret).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const accessToken = authResponse.data.access_token;
            
            const response = await axios.get(`https://api.spotify.com/v1/users/${auth.userId}/playlists?limit=50`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            const playlists = response.data.items || [];
            const accessiblePlaylists = playlists.filter(pl => pl.public !== false);

            if (accessiblePlaylists.length === 0) {
                const result = embedBuilder.musicEmbed(
                    '🎵 Your Playlists', 
                    'No playlists found for your linked Spotify account.\n\nMake sure your playlists are set to public in Spotify settings.'
                );
                return isSlash ? message.editReply(result) : message.reply(result);
            }

            const container = new ContainerBuilder()
                .setAccentColor(parseInt('FFC0CB', 16));

            const header = new TextDisplayBuilder()
                .setContent(`## 🎵 Your Spotify Playlists`);
            container.addTextDisplayComponents(header);

            container.addSeparatorComponents(new SeparatorBuilder());

            const info = new TextDisplayBuilder()
                .setContent(`Found **${accessiblePlaylists.length}** playlist${accessiblePlaylists.length !== 1 ? 's' : ''} from your linked Spotify account.`);
            container.addTextDisplayComponents(info);

            container.addSeparatorComponents(new SeparatorBuilder());

            const playlistList = accessiblePlaylists.slice(0, 10).map((pl, i) => 
                `${i + 1}. **${pl.name}** (${pl.tracks.total} tracks)`
            ).join('\n');

            const playlistText = new TextDisplayBuilder()
                .setContent(playlistList);
            container.addTextDisplayComponents(playlistText);

            container.addSeparatorComponents(new SeparatorBuilder());

            const instruction = new TextDisplayBuilder()
                .setContent(`💡 **Select a playlist from the dropdown below to play it!**`);
            container.addTextDisplayComponents(instruction);

            container.addSeparatorComponents(new SeparatorBuilder());

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('spotify_playlist_select')
                .setPlaceholder('Select a playlist to play')
                .addOptions(
                    accessiblePlaylists.slice(0, 25).map(pl => ({
                        label: pl.name.substring(0, 100),
                        description: `${pl.tracks.total} tracks`,
                        value: pl.id,
                        emoji: '🎵'
                    }))
                );

            const dropdownRow = new ActionRowBuilder().addComponents(selectMenu);
            container.addActionRowComponents(dropdownRow);

            const reply = isSlash ? 
                await message.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }) :
                await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });

            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 300000
            });

            collector.on('collect', async (selectInteraction) => {
                const commandUserId = message.author?.id || message.user.id;
                
                if (selectInteraction.user.id !== commandUserId) {
                    return selectInteraction.reply({
                        content: '❌ Only the command user can select playlists!',
                        ephemeral: true
                    });
                }

                if (!selectInteraction.member.voice.channel) {
                    return selectInteraction.reply({
                        ...embedBuilder.errorEmbed('Not in Voice', '❌ You need to be in a voice channel to play music!'),
                        ephemeral: true
                    });
                }

                await selectInteraction.deferUpdate();

                const playlistId = selectInteraction.values[0];
                const selectedPlaylist = accessiblePlaylists.find(pl => pl.id === playlistId);

                try {
                    let player = client.lavalink.getPlayer(message.guild.id);

                    if (!player) {
                        player = client.lavalink.createPlayer({
                            guildId: message.guild.id,
                            voiceChannelId: selectInteraction.member.voice.channel.id,
                            textChannelId: message.channel.id,
                            selfDeaf: true,
                            selfMute: false
                        });
                        await player.connect();
                    }

                    const spotifyUrl = `https://open.spotify.com/playlist/${playlistId}`;
                    
                    const searchResult = await client.lavalink.search(spotifyUrl, selectInteraction.user.id);

                    // Enhanced debug logging
                    console.log(`[SPOTIFY MYPLAYLIST] ===== SEARCH REQUEST =====`);
                    console.log(`[SPOTIFY MYPLAYLIST] URL: ${spotifyUrl}`);
                    console.log(`[SPOTIFY MYPLAYLIST] LoadType: ${searchResult?.loadType}`);
                    console.log(`[SPOTIFY MYPLAYLIST] Data type: ${Array.isArray(searchResult?.data) ? 'array' : typeof searchResult?.data}`);
                    
                    if (searchResult?.loadType === 'error' || searchResult?.loadType === 'empty') {
                        console.log(`[SPOTIFY MYPLAYLIST] Full Response:`, JSON.stringify(searchResult, null, 2));
                    }

                    if (!searchResult || searchResult.loadType === 'error') {
                        const errorMessage = searchResult?.data?.message || searchResult?.data?.error || 'Unknown error occurred';
                        console.error(`[SPOTIFY MYPLAYLIST ERROR] ${errorMessage}`);
                        const errorContainer = new ContainerBuilder()
                            .setAccentColor(parseInt('FFC0CB', 16));
                        const errorText = new TextDisplayBuilder()
                            .setContent(`## ❌ Failed to Load\n\n${errorMessage}\n\nMake sure the playlist is public.`);
                        errorContainer.addTextDisplayComponents(errorText);

                        return selectInteraction.editReply({
                            components: [errorContainer],
                            flags: MessageFlags.IsComponentsV2
                        });
                    }

                    if (searchResult.loadType === 'empty') {
                        console.error(`[SPOTIFY MYPLAYLIST] No results for: ${spotifyUrl}`);
                        const errorContainer = new ContainerBuilder()
                            .setAccentColor(parseInt('FFC0CB', 16));
                        const errorText = new TextDisplayBuilder()
                            .setContent(`## ❌ Playlist Not Found\n\nCould not load the Spotify playlist. Make sure the playlist is public.`);
                        errorContainer.addTextDisplayComponents(errorText);

                        return selectInteraction.editReply({
                            components: [errorContainer],
                            flags: MessageFlags.IsComponentsV2
                        });
                    }

                    // Handle different response types (same as play.js)
                    let tracks = [];
                    
                    if (searchResult.loadType === 'track') {
                        tracks = Array.isArray(searchResult.data) ? searchResult.data : [searchResult.data];
                    } else if (searchResult.loadType === 'playlist') {
                        if (Array.isArray(searchResult.data)) {
                            tracks = searchResult.data;
                        } else if (searchResult.data && 'tracks' in searchResult.data) {
                            tracks = searchResult.data.tracks || [];
                        }
                    } else if (searchResult.loadType === 'search') {
                        tracks = Array.isArray(searchResult.data)
                            ? searchResult.data
                            : searchResult.data && 'tracks' in searchResult.data
                            ? searchResult.data.tracks
                            : [];
                    }

                    console.log(`[SPOTIFY MYPLAYLIST] Tracks found: ${tracks.length}`);

                    if (tracks.length === 0) {
                        const errorContainer = new ContainerBuilder()
                            .setAccentColor(parseInt('FFC0CB', 16));
                        const errorText = new TextDisplayBuilder()
                            .setContent(`## ❌ Playlist Empty\n\nNo tracks found in the playlist.`);
                        errorContainer.addTextDisplayComponents(errorText);

                        return selectInteraction.editReply({
                            components: [errorContainer],
                            flags: MessageFlags.IsComponentsV2
                        });
                    }

                    for (const track of tracks) {
                        await player.queue.add(track);
                    }

                    if (!player.playing && !player.paused) {
                        await player.play();
                    }

                    const successContainer = new ContainerBuilder()
                        .setAccentColor(parseInt('FFC0CB', 16));
                    
                    const successHeader = new TextDisplayBuilder()
                        .setContent(`## ✅ Playlist Loaded`);
                    successContainer.addTextDisplayComponents(successHeader);
                    
                    successContainer.addSeparatorComponents(new SeparatorBuilder());
                    
                    const successInfo = new TextDisplayBuilder()
                        .setContent(`Successfully loaded **${selectedPlaylist.name}**\n\nAdded **${tracks.length}** tracks to the queue!\n\n**Status:** ${player.playing ? '▶️ Playing' : '⏸️ Queued'}`);
                    successContainer.addTextDisplayComponents(successInfo);

                    await selectInteraction.editReply({
                        components: [successContainer],
                        flags: MessageFlags.IsComponentsV2
                    });

                } catch (error) {
                    console.error('Spotify playlist load error:', error);
                    
                    const errorContainer = new ContainerBuilder()
                        .setAccentColor(parseInt('FFC0CB', 16));
                    const errorText = new TextDisplayBuilder()
                        .setContent(`## ❌ Failed to Load Playlist\n\nAn error occurred while loading the playlist. Please try again.`);
                    errorContainer.addTextDisplayComponents(errorText);

                    return selectInteraction.editReply({
                        components: [errorContainer],
                        flags: MessageFlags.IsComponentsV2
                    });
                }
            });

            collector.on('end', () => {
                if (isSlash) {
                    message.editReply({ components: [] }).catch(() => {});
                } else {
                    reply.edit({ components: [] }).catch(() => {});
                }
            });

        } catch (error) {
            console.error('Spotify myplaylist error:', error.response?.data || error.message);
            const result = embedBuilder.errorEmbed('Fetch Failed', '❌ Failed to fetch playlists. Try `!spotify-login` again to refresh your connection.');
            return isSlash ? message.editReply(result) : message.reply(result);
        }
    }
};
