
const embedBuilder = require('../../utils/embedBuilder');
const axios = require('axios');
const config = require('../../../config.json');
const { saveSpotifyAuth, getSpotifyAuth } = require('../../handlers/database');

module.exports = {
    name: 'spotify-login',
    aliases: ['spotifylogin', 'splogin'],
    description: 'Link your Spotify account',
    usage: '!spotify-login <profile_url>',
    category: 'Spotify',
    
    async execute(message, args, client) {
        const isSlash = message.replied !== undefined || message.deferred !== undefined;
        
        if (isSlash) {
            await message.deferReply({ ephemeral: true });
        }

        const profileUrl = isSlash ? message.options?.getString('profile_url') : args.join(' ');
        
        if (!profileUrl) {
            const response = embedBuilder.errorEmbed('Error', '❌ Please provide your Spotify profile URL!\n\n**Usage:** `!spotify-login <profile_url>`\n**Example:** `!spotify-login https://open.spotify.com/user/YOUR_ID`');
            return isSlash ? message.editReply(response) : message.reply(response);
        }
        
        const urlMatch = profileUrl.match(/user[\/:]([a-zA-Z0-9_-]+)/);
        if (!urlMatch) {
            const response = embedBuilder.errorEmbed('Invalid URL', '❌ Invalid Spotify profile URL! Please use format: https://open.spotify.com/user/YOUR_ID');
            return isSlash ? message.editReply(response) : message.reply(response);
        }

        const spotifyUserId = urlMatch[1];

        try {
            if (!config.spotify.clientId || !config.spotify.clientSecret) {
                const response = embedBuilder.errorEmbed('Not Configured', '❌ Spotify integration is not configured. Please contact the bot owner.');
                return isSlash ? message.editReply(response) : message.reply(response);
            }

            const authResponse = await axios.post('https://accounts.spotify.com/api/token', 
                'grant_type=client_credentials', {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(config.spotify.clientId + ':' + config.spotify.clientSecret).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const accessToken = authResponse.data.access_token;

            try {
                const userResponse = await axios.get(`https://api.spotify.com/v1/users/${spotifyUserId}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                const userData = userResponse.data;
                
                // Debug: Log the full user data to see what Spotify returns
                console.log('[SPOTIFY LOGIN] Full user data:', JSON.stringify(userData, null, 2));
                
                // Extract profile image if available
                const profileImage = userData.images && userData.images.length > 0 
                    ? userData.images[0].url 
                    : null;
                
                console.log('[SPOTIFY LOGIN] Profile image found:', profileImage);
                console.log('[SPOTIFY LOGIN] Images array:', userData.images);
                
                const playlistsResponse = await axios.get(`https://api.spotify.com/v1/users/${spotifyUserId}/playlists?limit=50`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                const playlists = playlistsResponse.data.items || [];
                const accessiblePlaylists = playlists.filter(pl => pl.public !== false);

                await saveSpotifyAuth(
                    message.author?.id || message.user.id, 
                    spotifyUserId, 
                    userData.display_name || spotifyUserId,
                    profileImage
                );

                const response = embedBuilder.successEmbed(
                    'Spotify Linked',
                    `✅ Successfully linked to Spotify profile: **${userData.display_name || spotifyUserId}**\n\n` +
                    `📊 Found **${accessiblePlaylists.length}** playlist${accessiblePlaylists.length !== 1 ? 's' : ''}.\n` +
                    `Use \`!spotify-myplaylist\` or \`/spotify-myplaylist\` to view and play them!`
                );
                
                return isSlash ? message.editReply(response) : message.reply(response);
            } catch (userError) {
                if (userError.response?.status === 404) {
                    const response = embedBuilder.errorEmbed('Not Found', '❌ Spotify user not found. Please check your profile URL.');
                    return isSlash ? message.editReply(response) : message.reply(response);
                }
                throw userError;
            }
        } catch (error) {
            console.error('Spotify login error:', error.response?.data || error.message);
            const response = embedBuilder.errorEmbed('Connection Failed', '❌ Failed to connect to Spotify. Please check your profile URL and try again.');
            return isSlash ? message.editReply(response) : message.reply(response);
        }
    }
};
