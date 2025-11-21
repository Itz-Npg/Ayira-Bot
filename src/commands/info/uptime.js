
const embedBuilder = require('../../utils/embedBuilder');
const os = require('os');

module.exports = {
    name: 'uptime',
    aliases: ['up'],
    description: 'Shows bot uptime and system information',
    usage: '!uptime',
    category: 'Info',
    
    async execute(message, args, client) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const memUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        const memoryPercent = ((usedMemory / totalMemory) * 100).toFixed(2);

        const activePlayers = Array.from(client.lavalink.players.values()).filter(p => p.queue.current).length;

        const stats = `**Bot Uptime:**\n> ${uptimeString}\n\n` +
                     `**System Stats:**\n` +
                     `> CPU: ${os.cpus()[0].model}\n` +
                     `> Cores: ${os.cpus().length}\n` +
                     `> Memory: ${(usedMemory / 1024 / 1024 / 1024).toFixed(2)}GB / ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB (${memoryPercent}%)\n` +
                     `> Platform: ${os.platform()}\n\n` +
                     `**Bot Stats:**\n` +
                     `> Servers: ${client.guilds.cache.size}\n` +
                     `> Users: ${client.users.cache.size}\n` +
                     `> Active Players: ${activePlayers}`;

        message.reply(embedBuilder.infoEmbed('Bot Uptime & Stats', stats));
    }
};
