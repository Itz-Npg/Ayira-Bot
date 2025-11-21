const Guild = require('../../models/Guild');
const embedBuilder = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ignore',
    aliases: ['ig'],
    description: 'Ignore channels or roles from using bot commands',
    usage: '!ignore <add/remove> <channel/role> <#channel/@role>',
    category: 'Settings',
    permissions: [PermissionFlagsBits.Administrator],
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply(embedBuilder.errorEmbed('Permission Denied', 'You need Administrator permission to use this command.'));
        }

        const action = args[0]?.toLowerCase();
        const type = args[1]?.toLowerCase();
        const target = args[2];

        if (!action || !['add', 'remove'].includes(action)) {
            return message.reply(embedBuilder.errorEmbed('Invalid Usage', 'Usage: `!ignore <add/remove> <channel/role> <#channel/@role>`'));
        }

        if (!type || !['channel', 'role'].includes(type)) {
            return message.reply(embedBuilder.errorEmbed('Invalid Type', 'Type must be either `channel` or `role`'));
        }

        if (!target) {
            return message.reply(embedBuilder.errorEmbed('Missing Target', 'Please provide a channel or role.'));
        }

        try {
            let guildData = await Guild.findOne({ guildId: message.guild.id });
            if (!guildData) {
                guildData = new Guild({ guildId: message.guild.id });
            }

            if (type === 'channel') {
                const channelId = target.replace(/[<#>]/g, '');
                const channel = message.guild.channels.cache.get(channelId);

                if (!channel) {
                    return message.reply(embedBuilder.errorEmbed('Channel Not Found', 'Could not find that channel.'));
                }

                if (action === 'add') {
                    if (guildData.ignoreChannels.includes(channelId)) {
                        return message.reply(embedBuilder.errorEmbed('Already Ignored', `${channel} is already being ignored.`));
                    }

                    guildData.ignoreChannels.push(channelId);
                    await guildData.save();

                    message.reply(embedBuilder.successEmbed('Channel Ignored', `Commands will no longer work in ${channel}`));

                } else {
                    const index = guildData.ignoreChannels.indexOf(channelId);
                    if (index === -1) {
                        return message.reply(embedBuilder.errorEmbed('Not Ignored', `${channel} is not being ignored.`));
                    }

                    guildData.ignoreChannels.splice(index, 1);
                    await guildData.save();

                    message.reply(embedBuilder.successEmbed('Channel Unignored', `Commands will now work in ${channel}`));
                }

            } else if (type === 'role') {
                const roleId = target.replace(/[<@&>]/g, '');
                const role = message.guild.roles.cache.get(roleId);

                if (!role) {
                    return message.reply(embedBuilder.errorEmbed('Role Not Found', 'Could not find that role.'));
                }

                if (action === 'add') {
                    if (guildData.ignoreRoles.includes(roleId)) {
                        return message.reply(embedBuilder.errorEmbed('Already Added', `${role} is already added to bypass list.`));
                    }

                    guildData.ignoreRoles.push(roleId);
                    await guildData.save();

                    message.reply(embedBuilder.successEmbed('Role Added', `Users with ${role} can now bypass ignored channels`));

                } else {
                    const index = guildData.ignoreRoles.indexOf(roleId);
                    if (index === -1) {
                        return message.reply(embedBuilder.errorEmbed('Not Found', `${role} is not in the bypass list.`));
                    }

                    guildData.ignoreRoles.splice(index, 1);
                    await guildData.save();

                    message.reply(embedBuilder.successEmbed('Role Removed', `${role} no longer has bypass privilege`));
                }
            }

        } catch (error) {
            console.error('Ignore error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while updating ignore settings.'));
        }
    }
};
