const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'lowpass',
    aliases: ['muffled', 'underwater'],
    description: 'Apply low-pass filter (muffled/underwater effect)',
    usage: '!lowpass',
    category: 'Filters',
    
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

        await player.filters.setLowPass(1.0);

        message.reply(embedBuilder.successEmbed('Low-Pass Filter', 'Turned on: Low-Pass Filter (Underwater)'));
    }
};
