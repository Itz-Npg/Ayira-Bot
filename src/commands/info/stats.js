const embedBuilder = require('../../utils/embedBuilder');
const os = require('os');

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
}

module.exports = {
    name: 'stats',
    aliases: ['statistics', 'botinfo', 'bi'],
    description: 'View bot statistics',
    usage: '!stats',
    category: 'Info',
    
    async execute(message, args, client) {
        const totalMemory = os.totalmem();
        const usedMemory = process.memoryUsage().heapUsed;
        const memoryUsage = (usedMemory / 1024 / 1024).toFixed(2);
        const totalMemoryGB = (totalMemory / 1024 / 1024 / 1024).toFixed(2);
        
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalChannels = client.channels.cache.size;
        
        let activePlayers = 0;
        let queuedTracks = 0;
        
        client.lavalink.players.forEach(player => {
            if (player.playing || player.paused) {
                activePlayers++;
                queuedTracks += player.queue.tracks.length;
            }
        });

        const description = [
            '**Bot Statistics**',
            '',
            '**General:**',
            `> Servers: **${client.guilds.cache.size}**`,
            `> Users: **${totalUsers.toLocaleString()}**`,
            `> Channels: **${totalChannels}**`,
            `> Commands: **${client.commands.size}**`,
            '',
            '**Music:**',
            `> Active Players: **${activePlayers}**`,
            `> Queued Tracks: **${queuedTracks}**`,
            `> Lavalink Nodes: **${client.lavalink.nodes.size}**`,
            '',
            '**System:**',
            `> Memory: **${memoryUsage} MB** / ${totalMemoryGB} GB`,
            `> Uptime: **${formatUptime(client.uptime)}**`,
            `> Ping: **${client.ws.ping}ms**`,
            `> Node.js: **${process.version}**`,
            '',
            '**Library:**',
            `> Discord.js: **v${require('discord.js').version}**`,
            `> Aliana-Client: **Latest**`
        ].join('\n');

        message.reply(embedBuilder.musicEmbed(
            '📊 Bot Statistics',
            description,
            client.user.displayAvatarURL({ size: 256 })
        ));
    }
};
