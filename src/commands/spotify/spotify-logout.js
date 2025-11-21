
const embedBuilder = require('../../utils/embedBuilder');
const { saveSpotifyAuth, getSpotifyAuth, removeSpotifyAuth } = require('../../handlers/database');
const axios = require('axios');
const config = require('../../../config.json');

module.exports = {
    name: 'spotify-logout',
    aliases: ['spotifylogout', 'splogout', 'unlink-spotify'],
    description: 'Unlink your Spotify account',
    usage: '!spotify-logout',
    category: 'Spotify',
    
    async execute(message, args, client) {
        const isSlash = message.replied !== undefined || message.deferred !== undefined;
        
        if (isSlash) {
            await message.deferReply({ ephemeral: true });
        }

        const userId = isSlash ? message.user.id : message.author.id;
        const auth = await getSpotifyAuth(userId);
        
        if (!auth) {
            const response = embedBuilder.errorEmbed('Not Linked', '❌ You don\'t have a Spotify account linked!');
            return isSlash ? message.editReply(response) : message.reply(response);
        }

        try {
            // Remove Spotify auth from database
            await removeSpotifyAuth(userId);

            const response = embedBuilder.successEmbed(
                'Spotify Unlinked',
                `✅ Successfully unlinked your Spotify account: **${auth.displayName}**\n\nYou can link again anytime using \`!spotify-login\` or \`/spotify-login\``
            );
            
            return isSlash ? message.editReply(response) : message.reply(response);
        } catch (error) {
            console.error('Spotify logout error:', error.message);
            const response = embedBuilder.errorEmbed('Logout Failed', '❌ Failed to unlink your Spotify account. Please try again.');
            return isSlash ? message.editReply(response) : message.reply(response);
        }
    }
};
