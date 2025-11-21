const User = require('../../models/User');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'plcreate',
    aliases: ['playlistcreate', 'plc'],
    description: 'Create a new playlist',
    usage: '!plcreate <playlist name>',
    category: 'Playlist',
    
    async execute(message, args, client) {
        const playlistName = args.join(' ');
        
        if (!playlistName) {
            return message.reply(embedBuilder.errorEmbed('Missing Name', 'Please provide a playlist name.\n\n> Usage: `!plcreate <playlist name>`'));
        }

        if (playlistName.length > 30) {
            return message.reply(embedBuilder.errorEmbed('Name Too Long', 'Playlist name must be 30 characters or less.'));
        }

        try {
            let userData = await User.findOne({ userId: message.author.id });
            if (!userData) {
                userData = new User({ userId: message.author.id });
            }

            const existingPlaylist = userData.playlists.find(
                pl => pl.name.toLowerCase() === playlistName.toLowerCase()
            );

            if (existingPlaylist) {
                return message.reply(embedBuilder.errorEmbed('Playlist Exists', `You already have a playlist named **${playlistName}**.`));
            }

            if (userData.playlists.length >= 10) {
                return message.reply(embedBuilder.errorEmbed('Limit Reached', 'You can only have up to 10 playlists. Delete one to create a new one.'));
            }

            userData.playlists.push({
                name: playlistName,
                tracks: [],
                createdAt: new Date()
            });

            await userData.save();

            message.reply(embedBuilder.successEmbed(
                'Playlist Created',
                `Successfully created playlist **${playlistName}**\n\n> Tracks: 0\n> Created By: ${message.author.tag}`
            ));

        } catch (error) {
            console.error('Playlist create error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while creating the playlist.'));
        }
    }
};
