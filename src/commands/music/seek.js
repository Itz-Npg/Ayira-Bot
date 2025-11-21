const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'seek',
    aliases: ['trim', 'forward'],
    description: 'Seek to a specific time in the current track',
    usage: '!seek <time> (e.g., 1:30, 0:45, 2:15)',
    category: 'Music',
    
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply(embedBuilder.errorEmbed('Error', 'You need to be in a voice channel to use this command!'));
        }

        const player = client.lavalink.getPlayer(message.guild.id);
        
        if (!player) {
            return message.reply(embedBuilder.errorEmbed('Error', 'There is no active music player in this server!'));
        }

        if (player.voiceChannelId !== voiceChannel.id) {
            return message.reply(embedBuilder.errorEmbed('Error', 'You need to be in the same voice channel as me!'));
        }

        if (!player.queue.current) {
            return message.reply(embedBuilder.errorEmbed('Error', 'There is no track currently playing!'));
        }

        if (!args[0]) {
            return message.reply(embedBuilder.errorEmbed('Error', 'Please provide a duration to seek to.\nExample: `!seek 1:30`'));
        }

        if (!player.queue.current.info.isSeekable) {
            return message.reply(embedBuilder.errorEmbed('Error', 'This track is not seekable (live stream or unsupported source).'));
        }

        if (!/^[0-5]?[0-9](:[0-5][0-9]){1,2}$/.test(args[0])) {
            return message.reply(embedBuilder.errorEmbed('Error', 'Invalid duration format. Please use format like `1:30` or `0:45`'));
        }

        const ms = args[0]
            .split(':')
            .map(Number)
            .reduce((a, b) => a * 60 + b, 0) * 1000;

        if (ms > player.queue.current.info.duration) {
            return message.reply(embedBuilder.errorEmbed('Error', 'The duration you provided exceeds the duration of the current track!'));
        }

        player.seek(ms);

        message.reply(embedBuilder.successEmbed('Seeked', `Seeked to **${embedBuilder.formatDuration(ms)}** in the current track`));
    }
};
