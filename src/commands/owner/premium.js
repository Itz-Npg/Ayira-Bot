const User = require('../../models/User');
const Guild = require('../../models/Guild');
const embedBuilder = require('../../utils/embedBuilder');
const webhookLogger = require('../../utils/webhookLogger');

module.exports = {
    name: 'premium',
    aliases: ['prem'],
    description: 'Manage premium for users and servers',
    usage: '!premium <add/remove> <user/server> <id> [days]',
    category: 'Owner',
    owner: true,

    async execute(message, args, client) {
        if (message.author.id !== '1052620216443601076') {
            return message.reply(embedBuilder.errorEmbed('Owner Only', 'This command is restricted to the bot owner only.'));
        }

        const action = args[0]?.toLowerCase();
        const type = args[1]?.toLowerCase();
        const id = args[2];
        const days = parseInt(args[3]) || 30;

        if (!action || !['add', 'remove'].includes(action)) {
            return message.reply(embedBuilder.errorEmbed('Invalid Usage', 'Usage: `!premium <add/remove> <user/server> <id> [days]`'));
        }

        if (!type || !['user', 'server'].includes(type)) {
            return message.reply(embedBuilder.errorEmbed('Invalid Type', 'Type must be either `user` or `server`'));
        }

        if (!id) {
            return message.reply(embedBuilder.errorEmbed('Missing ID', 'Please provide a valid ID.'));
        }

        try {
            if (type === 'user') {
                let userData = await User.findOne({ userId: id });
                if (!userData) {
                    userData = new User({ userId: id });
                }

                if (action === 'add') {
                    const expiresAt = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
                    userData.premium.enabled = true;
                    userData.premium.activatedAt = new Date();
                    userData.premium.expiresAt = expiresAt;
                    await userData.save();

                    const user = await client.users.fetch(id).catch(() => null);
                    const response = embedBuilder.successEmbed(
                        'Premium Activated - User',
                        `Premium has been granted to ${user ? user.tag : id}\n\n> User ID: ${id}\n> Duration: ${days} days\n> Expires At: <t:${Math.floor(expiresAt.getTime() / 1000)}:F>`
                    );

                    message.reply(response);

                    if (user) {
                        user.send(response).catch(() => {});
                        webhookLogger.logPremium({
                            action: 'Activated',
                            username: user.tag,
                            userId: user.id,
                            target: 'User',
                            duration: `${days} days`,
                            expiresAt: expiresAt
                        }).catch(() => {});
                    }

                } else {
                    userData.premium.enabled = false;
                    userData.premium.expiresAt = null;
                    userData.premium.servers = [];
                    await userData.save();

                    const user = await client.users.fetch(id).catch(() => null);
                    message.reply(embedBuilder.successEmbed('Premium Removed', `Premium removed from ${user ? user.tag : id}`));
                }

            } else if (type === 'server') {
                let guildData = await Guild.findOne({ guildId: id });
                if (!guildData) {
                    guildData = new Guild({ guildId: id });
                }

                if (action === 'add') {
                    const expiresAt = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
                    guildData.premium.enabled = true;
                    guildData.premium.activatedBy = message.author.id;
                    guildData.premium.activatedAt = new Date();
                    guildData.premium.expiresAt = expiresAt;
                    await guildData.save();

                    const guild = client.guilds.cache.get(id);
                    message.reply(embedBuilder.successEmbed(
                        'Premium Activated - Server',
                        `Premium has been granted to ${guild ? guild.name : id}\n\n> Server ID: ${id}\n> Duration: ${days} days\n> Expires At: <t:${Math.floor(expiresAt.getTime() / 1000)}:F>`
                    ));

                } else {
                    guildData.premium.enabled = false;
                    guildData.premium.expiresAt = null;
                    await guildData.save();

                    const guild = client.guilds.cache.get(id);
                    message.reply(embedBuilder.successEmbed('Premium Removed', `Premium removed from ${guild ? guild.name : id}`));
                }
            }
        } catch (error) {
            console.error('Premium error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while managing premium.'));
        }
    }
};
