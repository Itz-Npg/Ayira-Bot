
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, SectionBuilder, ThumbnailBuilder } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const axios = require('axios');
const config = require('../../../config.json');
const { saveSpotifyAuth, getSpotifyAuth } = require('../../handlers/database');

module.exports = {
    name: 'spotify-profile',
    aliases: ['spotifyprofile', 'spprofile'],
    description: 'View your linked Spotify profile',
    usage: '!spotify-profile',
    category: 'Spotify',
    
    async execute(message, args, client) {
        const isSlash = message.replied !== undefined || message.deferred !== undefined;
        
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

            const response = await axios.get(`https://api.spotify.com/v1/users/${auth.userId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            const profile = response.data;
            
            const displayName = profile.display_name || auth.displayName || 'N/A';
            const followers = profile.followers?.total || 0;
            const profileType = profile.type || 'user';
            const profileUrl = profile.external_urls?.spotify || `https://open.spotify.com/user/${auth.userId}`;
            
            // Use saved profile image from database, or default Spotify icon
            const profileImage = auth.profileImage || 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/200px-Spotify_logo_without_text.svg.png';
            
            console.log('[SPOTIFY PROFILE] Using image:', profileImage);
            
            const container = new ContainerBuilder()
                .setAccentColor(parseInt('FFC0CB', 16));

            const header = new TextDisplayBuilder()
                .setContent(`## 🎵 Linked Spotify Profile`);
            container.addTextDisplayComponents(header);

            container.addSeparatorComponents(new SeparatorBuilder());

            const profileInfo = new TextDisplayBuilder()
                .setContent(`**Name:** ${displayName}\n**Followers:** ${followers}\n**Profile Type:** ${profileType}\n\n**Profile URL:** ${profileUrl}`);

            // Always show thumbnail (either user's image or default)
            const section = new SectionBuilder()
                .addTextDisplayComponents(profileInfo);
            
            const thumbnail = new ThumbnailBuilder({ 
                media: { url: profileImage } 
            });
            section.setThumbnailAccessory(thumbnail);
            
            container.addSectionComponents(section);

            const result = { 
                components: [container], 
                flags: MessageFlags.IsComponentsV2 
            };
            
            return isSlash ? message.editReply(result) : message.reply(result);
        } catch (error) {
            console.error('Spotify profile error:', error.response?.data || error.message);
            const result = embedBuilder.errorEmbed('Fetch Failed', '❌ Failed to fetch profile. Try `!spotify-login` again to refresh your connection.');
            return isSlash ? message.editReply(result) : message.reply(result);
        }
    }
};
