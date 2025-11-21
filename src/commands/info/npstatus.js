const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'npstatus',
    aliases: ['nowplayingstatus', 'nps'],
    description: 'Check the status of the current song across all servers',
    usage: '!npstatus',
    category: 'Info',
    
    async execute(message, args, client) {
        try {
            const players = [];
            
            for (const player of client.lavalink.players.values()) {
                if (player && player.playing && player.queue && player.queue.current) {
                    const guild = client.guilds.cache.get(player.guildId);
                    if (guild) {
                        const voiceChannel = guild.members.cache.get(client.user.id)?.voice?.channel;
                        const listeners = voiceChannel ? voiceChannel.members.size - 1 : 0;
                        
                        players.push({
                            guild: guild.name,
                            track: player.queue.current.info.title,
                            author: player.queue.current.info.author,
                            listeners: listeners
                        });
                    }
                }
            }

            if (players.length === 0) {
                return message.reply(embedBuilder.errorEmbed('No Active Players', 'There are no songs currently playing in any server!'));
            }

            const description = players.map((p, i) => 
                `**${i + 1}.** ${p.guild}\n> 🎵 ${p.track}\n> 👤 ${p.author}\n> 👥 ${p.listeners} listener(s)`
            ).join('\n\n');

            message.reply(embedBuilder.musicEmbed(
                `Now Playing - ${players.length} Server(s)`,
                description
            ));
        } catch (error) {
            console.error('npstatus error:', error);
            return message.reply(embedBuilder.errorEmbed('Error', 'Failed to fetch player status!'));
        }
    }
};
