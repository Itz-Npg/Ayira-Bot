const User = require('../../models/User');
const embedBuilder = require('../../utils/embedBuilder');
const webhookLogger = require('../../utils/webhookLogger');

module.exports = {
    name: 'blacklist',
    aliases: ['bl'],
    description: 'Blacklist or unblacklist a user from using the bot',
    usage: '!blacklist <add/remove> <user> [reason]',
    category: 'Owner',
    owner: true,

    async execute(message, args, client) {
        if (message.author.id !== '1052620216443601076') {
            return message.reply(embedBuilder.errorEmbed('Owner Only', 'This command is restricted to the bot owner only.'));
        }

        const action = args[0]?.toLowerCase();
        const userId = args[1]?.replace(/[<@!>]/g, '');

        if (!action || !['add', 'remove'].includes(action)) {
            return message.reply(embedBuilder.errorEmbed('Invalid Usage', 'Usage: `!blacklist <add/remove> <user> [reason]`'));
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
                if (userData.blacklisted) {
                    return message.reply(embedBuilder.errorEmbed('Already Blacklisted', `${targetUser.tag} is already blacklisted.`));
                }

                const reason = args.slice(2).join(' ') || 'No reason provided';
                userData.blacklisted = true;
                userData.blacklistReason = reason;
                await userData.save();

                webhookLogger.logBlacklist({
                    action: 'Blacklisted',
                    targetUsername: targetUser.tag,
                    targetUserId: targetUser.id,
                    byUsername: message.author.tag,
                    byUserId: message.author.id,
                    reason: reason
                }).catch(() => {});

                message.reply(embedBuilder.successEmbed(
                    'User Blacklisted',
                    `**${targetUser.tag}** has been blacklisted from using the bot.\n\n> User ID: ${userId}\n> Reason: ${reason}\n> Blacklisted By: ${message.author.tag}`
                ));

            } else if (action === 'remove') {
                if (!userData.blacklisted) {
                    return message.reply(embedBuilder.errorEmbed('Not Blacklisted', `${targetUser.tag} is not blacklisted.`));
                }

                userData.blacklisted = false;
                userData.blacklistReason = null;
                await userData.save();

                webhookLogger.logBlacklist({
                    action: 'Unblacklisted',
                    targetUsername: targetUser.tag,
                    targetUserId: targetUser.id,
                    byUsername: message.author.tag,
                    byUserId: message.author.id,
                    reason: 'Removed from blacklist'
                }).catch(() => {});

                message.reply(embedBuilder.successEmbed(
                    'User Unblacklisted',
                    `**${targetUser.tag}** has been removed from the blacklist.\n\n> User ID: ${userId}\n> Unblacklisted By: ${message.author.tag}`
                ));
            }
        } catch (error) {
            console.error('Blacklist error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while updating the blacklist.'));
        }
    }
};
