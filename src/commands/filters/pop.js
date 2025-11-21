const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'pop',
    aliases: ['radio'],
    description: 'Apply pop/radio-style filter',
    usage: '!pop',
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
            { band: 0, gain: -0.05 },
            { band: 1, gain: -0.05 },
            { band: 2, gain: 0 },
            { band: 3, gain: 0.1 },
            { band: 4, gain: 0.15 },
            { band: 5, gain: 0.15 },
            { band: 6, gain: 0.1 },
            { band: 7, gain: 0 },
            { band: 8, gain: -0.05 },
            { band: 9, gain: -0.05 },
            { band: 10, gain: -0.1 },
            { band: 11, gain: -0.1 },
            { band: 12, gain: -0.1 },
            { band: 13, gain: -0.1 }
        ];

        await player.filters.setEqualizer(eqBands);

        message.reply(embedBuilder.successEmbed('Pop/Radio Filter', 'Turned on: Pop/Radio'));
    }
};
