const embedBuilder = require('../../utils/embedBuilder');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'invite',
    aliases: ['inv', 'add'],
    description: 'Get the bot invite link',
    usage: '!invite',
    category: 'Info',
    
    async execute(message, args, client) {
        const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(inviteUrl)
                    .setEmoji('🤖'),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/your-support-server')
                    .setEmoji('💬')
            );

        const description = [
            '**Thank you for using our bot!**',
            '',
            'Click the button below to invite the bot to your server.',
            '',
            '**Features:**',
            '> 🎵 High-Quality Music Playback',
            '> 🎚️ Advanced Audio Filters',
            '> 📝 Custom Playlists',
            '> ⚡ Fast & Reliable',
            '> 🌐 Multi-Platform Support',
            '',
            '**Permissions Needed:**',
            '> Administrator (for full functionality)'
        ].join('\n');

        message.reply({
            ...embedBuilder.musicEmbed('Invite Me!', description),
            components: [row]
        });
    }
};
