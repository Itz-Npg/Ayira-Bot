const Guild = require('../../models/Guild');
const embedBuilder = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
    name: 'setprefix',
    aliases: ['prefix'],
    description: 'Change the server prefix',
    usage: '!setprefix <new prefix>',
    category: 'Settings',
    permissions: [PermissionFlagsBits.Administrator],
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply(embedBuilder.errorEmbed('Permission Denied', 'You need Administrator permission to use this command.'));
        }

        const newPrefix = args[0];

        if (!newPrefix) {
            let guildData = await Guild.findOne({ guildId: message.guild.id });
            const currentPrefix = guildData?.prefix || config.prefix || '!';
            return message.reply(embedBuilder.infoEmbed('Current Prefix', `Current prefix: \`${currentPrefix}\`\n\n> Usage: \`${currentPrefix}setprefix <new prefix>\``));
        }

        if (newPrefix.length > 5) {
            return message.reply(embedBuilder.errorEmbed('Prefix Too Long', 'Prefix must be 5 characters or less.'));
        }

        try {
            let guildData = await Guild.findOne({ guildId: message.guild.id });
            if (!guildData) {
                guildData = new Guild({ guildId: message.guild.id });
            }

            guildData.prefix = newPrefix;
            await guildData.save();

            message.reply(embedBuilder.successEmbed(
                'Prefix Updated',
                `Server prefix has been changed to \`${newPrefix}\`\n\n> Example: \`${newPrefix}play\`, \`${newPrefix}help\``
            ));

        } catch (error) {
            console.error('Prefix error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while updating the prefix.'));
        }
    }
};
