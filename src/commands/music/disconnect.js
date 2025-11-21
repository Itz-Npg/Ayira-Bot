const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'disconnect',
    aliases: ['dc', 'leave'],
    description: 'Disconnect the bot from voice channel',
    usage: '!disconnect',
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

        player.destroy();

        message.reply(embedBuilder.successEmbed('Disconnected', 'Disconnected from voice channel and cleared the queue'));
    }
};
