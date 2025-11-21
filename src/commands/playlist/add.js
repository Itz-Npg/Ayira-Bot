const User = require('../../models/User');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'pladd',
    aliases: ['playlistadd', 'pla'],
    description: 'Add current track or search result to a playlist',
    usage: '!pladd <playlist name> [song name/URL]',
    category: 'Playlist',
    
    async execute(message, args, client) {
        if (args.length === 0) {
            return message.reply(embedBuilder.errorEmbed('Missing Name', 'Please provide a playlist name.\n\n> Usage: `!pladd <playlist name> [song name/URL]`'));
        }

        const playlistName = args[0];
        const query = args.slice(1).join(' ');

        // Voice channel validation when searching or using current track
        if (query || !args.slice(1).length) {
            const voiceChannel = message.member.voice.channel;
            
            if (!voiceChannel && !query) {
                return message.reply(embedBuilder.errorEmbed('Not in Voice Channel', 'You need to be in a voice channel to add the current playing track!'));
            }

            const player = client.lavalink.getPlayer(message.guild.id);
            
            if (player && player.voiceChannelId && voiceChannel && player.voiceChannelId !== voiceChannel.id) {
                return message.reply(embedBuilder.errorEmbed('Different Voice Channel', `I'm playing music in <#${player.voiceChannelId}>! Join that channel to add the current track.`));
            }
        }

        try {
            let userData = await User.findOne({ userId: message.author.id });
            
            if (!userData || userData.playlists.length === 0) {
                return message.reply(embedBuilder.errorEmbed('No Playlists', 'You don\'t have any playlists. Create one with `!plcreate <name>`'));
            }

            const playlist = userData.playlists.find(
                pl => pl.name.toLowerCase() === playlistName.toLowerCase()
            );

            if (!playlist) {
                return message.reply(embedBuilder.errorEmbed('Playlist Not Found', `Could not find a playlist named **${playlistName}**.`));
            }

            let trackToAdd;

            if (query) {
                const result = await client.lavalink.search(query, message.author.id);
                
                if (result.loadType === 'error' || result.loadType === 'empty') {
                    return message.reply(embedBuilder.errorEmbed('No Results', 'No tracks found for your query.'));
                }

                const tracks = Array.isArray(result.data) ? result.data : result.data.tracks || [];
                
                if (tracks.length === 0) {
                    return message.reply(embedBuilder.errorEmbed('No Results', 'No tracks found for your query.'));
                }

                trackToAdd = {
                    title: tracks[0].info.title,
                    author: tracks[0].info.author,
                    uri: tracks[0].info.uri,
                    duration: tracks[0].info.duration || 0
                };
            } else {
                const player = client.lavalink.getPlayer(message.guild.id);
                
                if (!player || !player.queue.current) {
                    return message.reply(embedBuilder.errorEmbed('Nothing Playing', 'No track is currently playing. Please provide a song name or URL.'));
                }

                const current = player.queue.current;
                trackToAdd = {
                    title: current.info.title,
                    author: current.info.author,
                    uri: current.info.uri,
                    duration: current.info.duration || 0
                };
            }

            if (playlist.tracks.length >= 100) {
                return message.reply(embedBuilder.errorEmbed('Playlist Full', 'This playlist is full (maximum 100 tracks).'));
            }

            const alreadyExists = playlist.tracks.some(t => t.uri === trackToAdd.uri);
            if (alreadyExists) {
                return message.reply(embedBuilder.errorEmbed('Already Exists', `**${trackToAdd.title}** is already in the playlist.`));
            }

            playlist.tracks.push(trackToAdd);
            await userData.save();

            message.reply(embedBuilder.successEmbed(
                'Track Added to Playlist',
                `Added **${trackToAdd.title}** to **${playlist.name}**\n\n> Artist: ${trackToAdd.author}\n> Playlist Size: ${playlist.tracks.length}/100`
            ));

        } catch (error) {
            console.error('Playlist add error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while adding the track to the playlist.'));
        }
    }
};
