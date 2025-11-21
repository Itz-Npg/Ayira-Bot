const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'stop',
    aliases: [],
    description: 'Stop playback and leave voice channel',
    usage: '!stop',
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

        await player.destroy();
        message.reply(embedBuilder.successEmbed('Stopped', 'Stopped playback and left the voice channel'));
    }
};
