const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'resume',
    description: 'Resume the paused track',
    usage: '!resume',
    category: 'Music',
    
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply(embedBuilder.errorEmbed('Not in Voice Channel', 'You need to be in a voice channel!'));
        }

        const player = client.lavalink.getPlayer(message.guild.id);
        
        if (!player) {
            return message.reply(embedBuilder.errorEmbed('No Player', 'There is no music player active!'));
        }

        if (player.voiceChannelId !== voiceChannel.id) {
            return message.reply(embedBuilder.errorEmbed('Different Voice Channel', `I'm playing music in <#${player.voiceChannelId}>! Join that channel to control the music.`));
        }

        if (!player.queue.current) {
            return message.reply(embedBuilder.errorEmbed('Nothing Playing', 'No music is currently playing!'));
        }

        if (!player.paused) {
            return message.reply(embedBuilder.errorEmbed('Not Paused', 'The music is not paused! Use `!pause` to pause it.'));
        }

        await player.pause(false);
        message.reply(embedBuilder.successEmbed('Resumed', '▶️ Music resumed'));
    }
};
