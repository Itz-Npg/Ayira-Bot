const embedBuilder = require('../../utils/embedBuilder');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'vote',
    aliases: ['voting', 'v'],
    description: 'Vote for the bot and get rewards',
    usage: '!vote',
    category: 'Info',
    
    async execute(message, args, client) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Vote on Top.gg')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://top.gg/bot/${client.user.id}/vote`)
                    .setEmoji('🗳️'),
                new ButtonBuilder()
                    .setLabel('Vote on Discords.com')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discords.com/bots/bot/${client.user.id}/vote`)
                    .setEmoji('⬆️')
            );

        const description = [
            '**Vote for Us!**',
            '',
            'Support the bot by voting on bot lists!',
            '',
            '**Voting Rewards:**',
            '> 🎁 Premium Features (12 hours)',
            '> ⭐ Special Role in Support Server',
            '> 🎵 Priority Queue',
            '> ✨ Exclusive Commands',
            '',
            '**You can vote every 12 hours!**',
            '',
            'Click the buttons below to vote:',
            '> 🗳️ Top.gg',
            '> ⬆️ Discords.com',
            '',
            'Thank you for your support!'
        ].join('\n');

        message.reply({
            ...embedBuilder.musicEmbed('🗳️ Vote for Us', description),
            components: [row]
        });
    }
};
