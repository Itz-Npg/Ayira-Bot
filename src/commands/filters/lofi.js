const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'lofi',
    aliases: ['lo-fi', 'chill'],
    description: 'Apply smooth lo-fi filter',
    usage: '!lofi',
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

        const eqBands = [
            { band: 0, gain: -0.1 },
            { band: 1, gain: -0.1 },
            { band: 2, gain: -0.15 },
            { band: 3, gain: -0.2 },
            { band: 4, gain: -0.3 },
            { band: 5, gain: -0.35 },
            { band: 6, gain: -0.4 },
            { band: 7, gain: -0.5 },
            { band: 8, gain: -0.6 },
            { band: 9, gain: -0.7 },
            { band: 10, gain: -0.8 },
            { band: 11, gain: -0.9 },
            { band: 12, gain: -1.0 },
            { band: 13, gain: -1.1 }
        ];

        await player.filters.setEqualizer(eqBands);
        await player.filters.setTimescale({ speed: 0.95, pitch: 0.9, rate: 0.95 });

        message.reply(embedBuilder.successEmbed('Lo-Fi Filter', 'Turned on: Lo-Fi'));
    }
};
