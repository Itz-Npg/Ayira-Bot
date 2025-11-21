const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'bassboost',
    aliases: ['bass'],
    description: 'Apply bass boost filter (0-1)',
    usage: '!bassboost [0-1]',
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

        const level = args[0] ? parseFloat(args[0]) : 0.5;
        
        if (isNaN(level) || level < 0 || level > 1) {
            return message.reply(embedBuilder.errorEmbed('Invalid Level', 'Bass boost level must be between 0 and 1!'));
        }

        await player.filterManager.setBassBoost(level);
        message.reply(embedBuilder.successEmbed('Bass Boost', `Bass boost set to **${level.toFixed(2)}**`));
    }
};
