const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'loop',
    aliases: ['repeat'],
    description: 'Loop the current track or queue',
    usage: '!loop [track|queue|off]',
    category: 'Music',
    
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply(embedBuilder.errorEmbed('Voice Channel Required', 'You need to be in a voice channel to use this command!'));
        }

        const player = client.lavalink.getPlayer(message.guild.id);
        
        if (!player) {
            return message.reply(embedBuilder.errorEmbed('No Player', 'There is no active music player in this server!'));
        }

        if (player.voiceChannelId !== voiceChannel.id) {
            return message.reply(embedBuilder.errorEmbed('Wrong Voice Channel', 'You need to be in the same voice channel as me!'));
        }

        if (!player.queue.current) {
            return message.reply(embedBuilder.errorEmbed('Nothing Playing', 'There is no track currently playing!'));
        }

        const mode = args[0]?.toLowerCase() || 'track';

        if (mode === 'track') {
            await player.setRepeatMode('track');
            message.reply(embedBuilder.successEmbed('Loop Mode', 'Enabled track loop'));
        } else if (mode === 'queue') {
            await player.setRepeatMode('queue');
            message.reply(embedBuilder.successEmbed('Loop Mode', 'Enabled queue loop'));
        } else if (mode === 'off') {
            await player.setRepeatMode('off');
            message.reply(embedBuilder.successEmbed('Loop Mode', 'Disabled loop'));
        } else {
            message.reply(embedBuilder.errorEmbed('Invalid Mode', 'Usage: `!loop [track|queue|off]`'));
        }
    }
};
