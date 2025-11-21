const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'volume',
    aliases: ['vol'],
    description: 'Set or check the volume (0-200)',
    usage: '!volume [0-200]',
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

        if (!args.length) {
            return message.reply(embedBuilder.infoEmbed('Current Volume', `Current volume: **${player.volume}%**`));
        }

        const volume = parseInt(args[0]);
        
        if (isNaN(volume) || volume < 0 || volume > 200) {
            return message.reply(embedBuilder.errorEmbed('Invalid Volume', 'Volume must be between 0 and 200!'));
        }

        await player.setVolume(volume);
        message.reply(embedBuilder.successEmbed('Volume Set', `Volume set to **${volume}%**`));
    }
};
