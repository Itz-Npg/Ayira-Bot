
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'partner',
    aliases: ['partners'],
    description: 'View bot partnership information',
    usage: '!partner',
    category: 'Info',
    
    async execute(message, args, client) {
        const description = [
            '**Partnership Program**',
            '',
            '> Want to partner with us? We offer:',
            '> • Bot promotion in partner servers',
            '> • Premium features for partners',
            '> • Dedicated support',
            '> • Custom integrations',
            '',
            '**Requirements:**',
            '> • At least 500+ members',
            '> • Active community',
            '> • Professional server setup',
            '',
            '**Contact:**',
            '> DM the bot owner for partnership inquiries'
        ].join('\n');

        message.reply(embedBuilder.infoEmbed('🤝 Partnership Information', description));
    }
};
