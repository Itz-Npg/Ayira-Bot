const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'ping',
    description: 'Check bot latency',
    usage: '!ping',
    category: 'Info',
    
    async execute(message, args, client) {
        const sent = await message.reply('Pinging...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
        sent.edit({ 
            content: null,
            ...embedBuilder.successEmbed('Pong!', `Latency: **${latency}ms**\nAPI Latency: **${apiLatency}ms**`) 
        });
    }
};
