const { PermissionsBitField } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'join',
    aliases: ['j', 'connect'],
    description: 'Join your voice channel',
    usage: '!join',
    category: 'Music',
    
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply(embedBuilder.errorEmbed('Error', 'You need to be in a voice channel first!'));
        }

        const permissions = voiceChannel.permissionsFor(message.guild.members.me);
        
        if (!permissions.has(PermissionsBitField.Flags.ViewChannel)) {
            return message.reply(embedBuilder.errorEmbed('Error', 'I don\'t have permission to view your voice channel!'));
        }

        if (!permissions.has(PermissionsBitField.Flags.Connect)) {
            return message.reply(embedBuilder.errorEmbed('Error', 'I don\'t have permission to join your voice channel!'));
        }

        if (!permissions.has(PermissionsBitField.Flags.Speak)) {
            return message.reply(embedBuilder.errorEmbed('Error', 'I don\'t have permission to speak in your voice channel!'));
        }

        let player = client.lavalink.getPlayer(message.guild.id);

        if (player) {
            if (player.voiceChannelId === voiceChannel.id) {
                return message.reply(embedBuilder.infoEmbed('Already Connected', `I'm already in your voice channel!`));
            } else {
                return message.reply(embedBuilder.errorEmbed('Error', `I'm already connected to <#${player.voiceChannelId}>!`));
            }
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

        message.reply(embedBuilder.successEmbed('Connected', `Successfully joined ${voiceChannel}`));
    }
};
