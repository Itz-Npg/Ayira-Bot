const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'restart',
    aliases: ['reboot'],
    description: 'Restart the bot',
    usage: '!restart',
    category: 'Owner',
    owner: true,
    
    async execute(message, args, client) {
        if (message.author.id !== '1052620216443601076') {
            return message.reply(embedBuilder.errorEmbed('Owner Only', 'This command is restricted to the bot owner only.'));
        }

        await message.reply(embedBuilder.infoEmbed(
            'Restarting Bot',
            'The bot is restarting... This may take a few seconds.'
        ));

        console.log('Bot restart initiated by:', message.author.tag);
        
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    }
};
