const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'replay',
    aliases: ['restart'],
    description: 'Replay the current song from the beginning',
    usage: '!replay',
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

        player.seek(0);

        message.reply(embedBuilder.successEmbed('Track Replayed', `Replaying **${player.queue.current.info.title}** from the beginning`));
    }
};
