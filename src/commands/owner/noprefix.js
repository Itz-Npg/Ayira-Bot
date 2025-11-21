const User = require('../../models/User');
const embedBuilder = require('../../utils/embedBuilder');
const webhookLogger = require('../../utils/webhookLogger');

module.exports = {
    name: 'noprefix',
    aliases: ['np'],
    description: 'Give or remove no-prefix permission for a user',
    usage: '!noprefix <add/remove> <user>',
    category: 'Owner',
    owner: true,

    async execute(message, args, client) {
        if (message.author.id !== '1052620216443601076') {
            return message.reply(embedBuilder.errorEmbed('Owner Only', 'This command is restricted to the bot owner only.'));
        }

        const action = args[0]?.toLowerCase();
        const userId = args[1]?.replace(/[<@!>]/g, '');

        if (!action || !['add', 'remove'].includes(action)) {
            return message.reply(embedBuilder.errorEmbed('Invalid Usage', 'Usage: `!noprefix <add/remove> <user>`'));
        }

        if (!userId) {
            return message.reply(embedBuilder.errorEmbed('Missing User', 'Please provide a valid user ID or mention.'));
        }

        try {
            const targetUser = await client.users.fetch(userId).catch(() => null);
            if (!targetUser) {
                return message.reply(embedBuilder.errorEmbed('User Not Found', 'Could not find that user.'));
            }

            let userData = await User.findOne({ userId });
            if (!userData) {
                userData = new User({ userId });
            }

            if (action === 'add') {
                if (userData.noPrefix) {
                    return message.reply(embedBuilder.errorEmbed('Already Has Permission', `${targetUser.tag} already has no-prefix permission.`));
                }

                userData.noPrefix = true;
                await userData.save();

                webhookLogger.logNoPrefix({
                    action: 'Granted',
                    targetUsername: targetUser.tag,
                    targetUserId: targetUser.id,
                    byUsername: message.author.tag,
                    byUserId: message.author.id
                }).catch(() => {});

                const response = embedBuilder.successEmbed(
                    'No-Prefix Enabled',
                    `**${targetUser.tag}** can now use commands without a prefix.\n\n> User ID: ${userId}\n> Granted By: ${message.author.tag}`
                );

                message.reply(response);
                targetUser.send(response).catch(() => {});

            } else if (action === 'remove') {
                if (!userData.noPrefix) {
                    return message.reply(embedBuilder.errorEmbed('No Permission', `${targetUser.tag} doesn't have no-prefix permission.`));
                }

                userData.noPrefix = false;
                await userData.save();

                webhookLogger.logNoPrefix({
                    action: 'Removed',
                    targetUsername: targetUser.tag,
                    targetUserId: targetUser.id,
                    byUsername: message.author.tag,
                    byUserId: message.author.id
                }).catch(() => {});

                message.reply(embedBuilder.errorEmbed(
                    'No-Prefix Removed',
                    `**${targetUser.tag}** must now use the prefix for commands.\n\n> User ID: ${userId}\n> Removed By: ${message.author.tag}`
                ));
            }
        } catch (error) {
            console.error('No-prefix error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while updating no-prefix permission.'));
        }
    }
};
