const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'darthvader',
    aliases: ['vader', 'deepvoice'],
    description: 'Apply Darth Vader deep voice effect',
    usage: '!darthvader',
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

        await player.filters.setTimescale({ speed: 0.975, pitch: 0.5, rate: 0.8 });

        message.reply(embedBuilder.successEmbed('Darth Vader Effect', 'Turned on: Darth Vader'));
    }
};
