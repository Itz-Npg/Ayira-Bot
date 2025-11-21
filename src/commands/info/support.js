const embedBuilder = require('../../utils/embedBuilder');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'support',
    aliases: ['help-server', 'discord'],
    description: 'Get support server invite link',
    usage: '!support',
    category: 'Info',
    
    async execute(message, args, client) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/your-support-server')
                    .setEmoji('💬'),
                new ButtonBuilder()
                    .setLabel('Documentation')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://docs.yourbot.com')
                    .setEmoji('📚')
            );

        const description = [
            '**Need Help?**',
            '',
            'Join our support server for:',
            '',
            '> 💬 24/7 Support',
            '> 🐛 Bug Reports',
            '> 💡 Feature Requests',
            '> 📢 Bot Updates',
            '> 🎉 Community Events',
            '',
            '**Quick Links:**',
            '> Support Server: https://discord.gg/your-support-server',
            '> Documentation: https://docs.yourbot.com',
            '',
            'Click the buttons below to get started!'
        ].join('\n');

        message.reply({
            ...embedBuilder.musicEmbed('🆘 Support', description),
            components: [row]
        });
    }
};
