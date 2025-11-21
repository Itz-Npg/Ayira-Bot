const User = require('../../models/User');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'plload',
    aliases: ['playlistload', 'pll'],
    description: 'Load and play a playlist',
    usage: '!plload <playlist name>',
    category: 'Playlist',
    
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply(embedBuilder.errorEmbed('Voice Channel Required', 'You need to be in a voice channel to load a playlist.'));
        }

        const playlistName = args.join(' ');
        
        if (!playlistName) {
            return message.reply(embedBuilder.errorEmbed('Missing Name', 'Please provide a playlist name.\n\n> Usage: `!plload <playlist name>`'));
        }

        try {
            const userData = await User.findOne({ userId: message.author.id });
            
            if (!userData || userData.playlists.length === 0) {
                return message.reply(embedBuilder.errorEmbed('No Playlists', 'You don\'t have any playlists.'));
            }

            const playlist = userData.playlists.find(
                pl => pl.name.toLowerCase() === playlistName.toLowerCase()
            );

            if (!playlist) {
                return message.reply(embedBuilder.errorEmbed('Playlist Not Found', `Could not find a playlist named **${playlistName}**.`));
            }

            if (playlist.tracks.length === 0) {
                return message.reply(embedBuilder.errorEmbed('Empty Playlist', `Playlist **${playlistName}** is empty.`));
            }

            let player = client.lavalink.getPlayer(message.guild.id);

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

            for (const track of playlist.tracks) {
                await player.queue.add(track);
            }

            const totalDuration = playlist.tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
            const formatDuration = (ms) => {
                const seconds = Math.floor((ms / 1000) % 60);
                const minutes = Math.floor((ms / (1000 * 60)) % 60);
                const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
                return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
            };

            message.reply(embedBuilder.musicEmbed(
                'Playlist Loaded',
                `Loaded **${playlist.tracks.length}** tracks from **${playlist.name}**\n\n> Queue Size: ${player.queue.tracks.length} tracks\n> Duration: ${formatDuration(totalDuration)}`
            ));

            if (!player.playing && !player.paused) {
                await player.play();
            }

        } catch (error) {
            console.error('Playlist load error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while loading the playlist.'));
        }
    }
};
