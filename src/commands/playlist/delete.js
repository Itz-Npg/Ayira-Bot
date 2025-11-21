const User = require('../../models/User');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'pldelete',
    aliases: ['playlistdelete', 'pldel'],
    description: 'Delete a playlist',
    usage: '!pldelete <playlist name>',
    category: 'Playlist',
    
    async execute(message, args, client) {
        const playlistName = args.join(' ');
        
        if (!playlistName) {
            return message.reply(embedBuilder.errorEmbed('Missing Name', 'Please provide a playlist name.\n\n> Usage: `!pldelete <playlist name>`'));
        }

        try {
            const userData = await User.findOne({ userId: message.author.id });
            
            if (!userData || userData.playlists.length === 0) {
                return message.reply(embedBuilder.errorEmbed('No Playlists', 'You don\'t have any playlists.'));
            }

            const playlistIndex = userData.playlists.findIndex(
                pl => pl.name.toLowerCase() === playlistName.toLowerCase()
            );

            if (playlistIndex === -1) {
                return message.reply(embedBuilder.errorEmbed('Playlist Not Found', `Could not find a playlist named **${playlistName}**.`));
            }

            const deletedPlaylist = userData.playlists[playlistIndex];
            userData.playlists.splice(playlistIndex, 1);
            await userData.save();

            message.reply(embedBuilder.errorEmbed(
                'Playlist Deleted',
                `Successfully deleted playlist **${deletedPlaylist.name}**\n\n> Tracks Removed: ${deletedPlaylist.tracks.length}\n> Deleted By: ${message.author.tag}`
            ));

        } catch (error) {
            console.error('Playlist delete error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while deleting the playlist.'));
        }
    }
};
