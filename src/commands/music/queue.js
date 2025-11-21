const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    description: 'Display the current music queue',
    usage: '!queue',
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
            return message.reply(embedBuilder.errorEmbed('Queue Empty', 'There is nothing in the queue!'));
        }

        message.reply(embedBuilder.queueEmbed(player.queue, player, 1, 10));
    }
};
