const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'clear',
    description: 'Clear all tracks from the queue',
    usage: '!clear',
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
            return message.reply(embedBuilder.errorEmbed('Queue Empty', 'The queue is already empty!'));
        }

        const count = player.queue.tracks.length;
        await player.queue.clear();
        message.reply(embedBuilder.successEmbed('Queue Cleared', `Cleared **${count}** tracks from the queue`));
    }
};
