const embedBuilder = require('../../utils/embedBuilder');
const User = require('../../models/User');

module.exports = {
    name: 'profile',
    aliases: ['userinfo', 'prof'],
    description: 'View your or another user\'s profile',
    usage: '!profile [@user]',
    category: 'Info',
    
    async execute(message, args, client) {
        try {
            const targetUser = message.mentions.users.first() || message.author;
            const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
            
            if (!member) {
                return message.reply(embedBuilder.errorEmbed('User Not Found', 'Could not find that user in this server!'));
            }

            const userData = await User.findOne({ userId: targetUser.id }).catch(err => {
                console.error('Profile DB error:', err);
                return null;
            });
            
            const premiumStatus = userData?.premium?.enabled ? '✅ Premium' : '❌ No Premium';
            const premiumExpiry = userData?.premium?.expiresAt 
                ? `<t:${Math.floor(userData.premium.expiresAt.getTime() / 1000)}:R>` 
                : 'N/A';
            
            const playlistCount = userData?.playlists?.length || 0;
            const likedSongs = userData?.likedSongs?.length || 0;
            const blacklistStatus = userData?.blacklisted ? '🚫 Blacklisted' : '✅ Active';
            const noPrefixStatus = userData?.noPrefix ? '✅ Enabled' : '❌ Disabled';

            const description = [
                `**User:** ${targetUser.tag}`,
                `**ID:** ${targetUser.id}`,
                `**Account Created:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
                `**Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                '',
                '**Bot Profile:**',
                `> Premium: ${premiumStatus}`,
                userData?.premium?.enabled ? `> Expires: ${premiumExpiry}` : '',
                `> Playlists: ${playlistCount}`,
                `> Liked Songs: ${likedSongs}`,
                `> Status: ${blacklistStatus}`,
                `> No Prefix: ${noPrefixStatus}`
            ].filter(line => line !== '').join('\n');

            message.reply(embedBuilder.musicEmbed(
                '👤 User Profile',
                description,
                targetUser.displayAvatarURL({ size: 256 })
            ));
        } catch (error) {
            console.error('Profile command error:', error);
            return message.reply(embedBuilder.errorEmbed('Error', 'Failed to load user profile!'));
        }
    }
};
