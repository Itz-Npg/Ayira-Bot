const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'tremolo',
    aliases: ['trem'],
    description: 'Apply tremolo effect (volume oscillation)',
    usage: '!tremolo',
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

        await player.filters.setTremolo(4.0, 0.5);

        message.reply(embedBuilder.successEmbed('Tremolo Effect', 'Turned on: Tremolo'));
    }
};
