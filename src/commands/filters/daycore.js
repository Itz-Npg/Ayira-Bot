const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'daycore',
    aliases: ['slowed'],
    description: 'Apply daycore filter (slowed and pitch lowered)',
    usage: '!daycore',
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

        await player.filters.setTimescale({ pitch: 0.63, rate: 1.05 });
        
        const eqBands = [];
        for (let i = 0; i < 8; i++) {
            eqBands.push({ band: i, gain: 0 });
        }
        for (let i = 8; i < 14; i++) {
            eqBands.push({ band: i, gain: -0.25 });
        }
        await player.filters.setEqualizer(eqBands);

        message.reply(embedBuilder.successEmbed('Daycore Filter', 'Turned on: Daycore'));
    }
};
