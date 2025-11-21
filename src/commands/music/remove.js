const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'remove',
    aliases: ['rm'],
    description: 'Remove a specific track from the queue',
    usage: '!remove <track number>',
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

        if (!args.length) {
            return message.reply(embedBuilder.errorEmbed('Invalid Usage', `Usage: ${this.usage}`));
        }

        const index = parseInt(args[0]) - 1;
        
        if (isNaN(index) || index < 0 || index >= player.queue.tracks.length) {
            return message.reply(embedBuilder.errorEmbed('Invalid Number', 'Please provide a valid track number!'));
        }

        const removed = await player.queue.remove(index);
        message.reply(embedBuilder.successEmbed('Track Removed', `Removed: **${removed.info.title}**`));
    }
};
