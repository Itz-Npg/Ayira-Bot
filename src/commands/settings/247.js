const { PermissionsBitField } = require('discord.js');
const Guild = require('../../models/Guild');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: '247',
    aliases: ['24/7', 'alwayson'],
    description: 'Toggle 24/7 mode to keep the bot in voice channel',
    usage: '!247 <on|off>',
    category: 'Settings',
    permissions: ['ManageGuild'],
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply(embedBuilder.errorEmbed('Permission Denied', 'You need Manage Server permission to use this command!'));
        }

        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply(embedBuilder.errorEmbed('Not in Voice Channel', 'You need to be in a voice channel to setup 24/7 mode!'));
        }

        const player = client.lavalink.getPlayer(message.guild.id);
        
        if (player && player.voiceChannelId !== voiceChannel.id) {
            return message.reply(embedBuilder.errorEmbed('Different Voice Channel', `I'm playing music in <#${player.voiceChannelId}>! Join that channel to configure 24/7 mode.`));
        }

        const action = args[0]?.toLowerCase();
        
        if (!action || !['on', 'off', 'enable', 'disable'].includes(action)) {
            return message.reply(embedBuilder.errorEmbed('Invalid Usage', 'Usage: `!247 <on|off>`'));
        }

        const guildData = await Guild.findOne({ guildId: message.guild.id }) || new Guild({ guildId: message.guild.id });

        if (['on', 'enable'].includes(action)) {
            guildData['247'].enabled = true;
            guildData['247'].voiceChannel = voiceChannel.id;
            guildData['247'].textChannel = message.channel.id;
            await guildData.save();

            let player = client.lavalink.getPlayer(message.guild.id);
            if (!player) {
                const permissions = voiceChannel.permissionsFor(message.guild.members.me);
                
                if (!permissions.has(PermissionsBitField.Flags.Connect)) {
                    return message.reply(embedBuilder.errorEmbed('Error', 'I don\'t have permission to join your voice channel!'));
                }

                player = client.lavalink.createPlayer({
                    guildId: message.guild.id,
                    voiceChannelId: voiceChannel.id,
                    textChannelId: message.channel.id,
                    selfDeaf: true,
                    selfMute: false,
                    volume: 100,
                });

                await player.connect();
            }

            return message.reply(embedBuilder.successEmbed('24/7 Mode Enabled', `I will stay in ${voiceChannel} 24/7 and won't leave even when the queue is empty!`));
        } else {
            guildData['247'].enabled = false;
            guildData['247'].voiceChannel = null;
            guildData['247'].textChannel = null;
            await guildData.save();

            return message.reply(embedBuilder.successEmbed('24/7 Mode Disabled', 'I will leave the voice channel when the queue is empty.'));
        }
    }
};
