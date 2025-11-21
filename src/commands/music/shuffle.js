const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'shuffle',
    description: 'Shuffle the queue',
    usage: '!shuffle',
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

        if (player.queue.tracks.length === 0) {
            return message.reply(embedBuilder.errorEmbed('Queue Empty', 'The queue is empty!'));
        }

        await player.queue.shuffle();
        message.reply(embedBuilder.successEmbed('Shuffled', `Shuffled **${player.queue.tracks.length}** tracks`));
    }
};
