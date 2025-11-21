const User = require('../../models/User');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'playlists',
    aliases: ['pllist', 'pls'],
    description: 'View all your playlists',
    usage: '!playlists',
    category: 'Playlist',
    
    async execute(message, args, client) {
        try {
            const userData = await User.findOne({ userId: message.author.id });
            
            if (!userData || userData.playlists.length === 0) {
                return message.reply(embedBuilder.errorEmbed('No Playlists', 'You don\'t have any playlists yet.\n\n> Create one with `!plcreate <name>`'));
            }

            const playlistList = userData.playlists.map((pl, index) => {
                const totalDuration = pl.tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
                const formatDuration = (ms) => {
                    const seconds = Math.floor((ms / 1000) % 60);
                    const minutes = Math.floor((ms / (1000 * 60)) % 60);
                    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
                    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`;
                };
                
                return `> ${index + 1}. ${pl.name} - ${pl.tracks.length} tracks - ${formatDuration(totalDuration)}`;
            }).join('\n');

            message.reply(embedBuilder.infoEmbed(
                `${message.author.username}'s Playlists`,
                `${playlistList || 'No playlists'}\n\nTotal Playlists: ${userData.playlists.length}/10`
            ));

        } catch (error) {
            console.error('Playlists list error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while fetching your playlists.'));
        }
    }
};
