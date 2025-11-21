const embedBuilder = require('../../utils/embedBuilder');
const sessionManager = require('../../utils/musicSessionManager');

module.exports = {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Display the interactive help menu',
    usage: '!help',
    category: 'Info',
    
    async execute(message, args, client) {
        const categories = {
            'Music': '',
            'Filters': '',
            'Playlist': '',
            'Spotify': '',
            'Settings': '',
            'Info': '',
            'Owner': ''
        };

        const commands = {};
        client.commands.forEach(cmd => {
            if (cmd.name && !cmd.aliases?.includes(cmd.name)) {
                if (!commands[cmd.category]) commands[cmd.category] = [];
                const existing = commands[cmd.category].find(c => c.name === cmd.name);
                if (!existing) commands[cmd.category].push(cmd);
            }
        });

        // Ensure all Spotify commands are shown (they're registered as both prefix and slash)
        // Spotify commands: spotify-login, spotify-logout, spotify-profile, spotify-myplaylist, spotify-globalplaylist
        
        // Get total commands including slash commands
        const { slashCommands } = require('../../handlers/slashCommands');
        const totalSlashCommands = slashCommands.size;
        const totalPrefixCommands = Object.values(commands).reduce((acc, cmdList) => acc + cmdList.length, 0);
        const totalCommands = totalPrefixCommands + totalSlashCommands;

        const botAvatarUrl = client.user.displayAvatarURL({ size: 256 });

        // Track who requested the help menu (only in guilds, not DMs)
        if (message.guild) {
            sessionManager.setHelpRequester(message.guild.id, message.author.id);
        }

        const msg = await message.reply(
            embedBuilder.helpEmbed(commands, categories, 'home', client.prefix, botAvatarUrl, totalCommands)
        );

        const collector = msg.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ 
                    ...embedBuilder.errorEmbed('Error', 'This menu is not for you!'),
                    ephemeral: true 
                });
            }

            let category = 'home';
            
            if (interaction.isButton()) {
                category = interaction.customId.replace('help_', '');
            } else if (interaction.isStringSelectMenu()) {
                category = interaction.values[0];
            }

            await interaction.update(
                embedBuilder.helpEmbed(commands, categories, category, client.prefix, botAvatarUrl, totalCommands)
            );
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
            // Clear help requester when collector ends (only in guilds)
            if (message.guild) {
                sessionManager.setHelpRequester(message.guild.id, null);
            }
        });
    }
};
