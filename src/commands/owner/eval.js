const embedBuilder = require('../../utils/embedBuilder');
const util = require('util');

module.exports = {
    name: 'eval',
    aliases: ['ev'],
    description: 'Evaluate JavaScript code',
    usage: '!eval <code>',
    category: 'Owner',
    owner: true,
    
    async execute(message, args, client) {
        if (message.author.id !== '1052620216443601076') {
            return message.reply(embedBuilder.errorEmbed('Owner Only', 'This command is restricted to the bot owner only.'));
        }

        const code = args.join(' ');
        if (!code) {
            return message.reply(embedBuilder.errorEmbed('Missing Code', 'Please provide code to evaluate.'));
        }

        try {
            let evaled = eval(code);

            if (typeof evaled !== 'string') {
                evaled = util.inspect(evaled, { depth: 0 });
            }

            if (evaled.length > 1900) {
                evaled = evaled.substring(0, 1900) + '...';
            }

            message.reply(embedBuilder.successEmbed(
                'Eval Success',
                `**Input:**\n\`\`\`js\n${code}\n\`\`\`\n**Output:**\n\`\`\`js\n${evaled}\n\`\`\`\n\nEvaluated by ${message.author.tag}`
            ));

        } catch (error) {
            message.reply(embedBuilder.errorEmbed(
                'Eval Error',
                `**Input:**\n\`\`\`js\n${code}\n\`\`\`\n**Error:**\n\`\`\`js\n${error}\n\`\`\`\n\nEvaluated by ${message.author.tag}`
            ));
        }
    }
};
