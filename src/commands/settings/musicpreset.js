const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    name: 'musicpreset',
    aliases: ['musiccard', 'nowplayingstyle', 'npstyle'],
    description: 'Set the music now-playing display style',
    usage: '!musicpreset <classic|musicard-dynamic|musicard-classic|musicard-custom>',
    category: 'Settings',
    
    async execute(message, args, client) {
        // This command only works in guilds, not DMs
        if (!message.guild) {
            return message.reply(embedBuilder.errorEmbed('Guild Only', 'This command can only be used in servers, not in DMs!'));
        }

        // Check if user has manage server permission
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply(embedBuilder.errorEmbed('Permission Denied', 'You need **Manage Server** permission to change music preset!'));
        }

        // Voice channel validation if player exists
        const player = client.lavalink.getPlayer(message.guild.id);
        
        if (player) {
            const voiceChannel = message.member.voice.channel;
            
            if (!voiceChannel) {
                return message.reply(embedBuilder.errorEmbed('Not in Voice Channel', 'You need to be in a voice channel when music is playing!'));
            }

            if (player.voiceChannelId !== voiceChannel.id) {
                return message.reply(embedBuilder.errorEmbed('Different Voice Channel', `I'm playing music in <#${player.voiceChannelId}>! Join that channel to change music settings.`));
            }
        }

        if (!args.length) {
            // Show current preset and available options
            let guildData = await Guild.findOne({ guildId: message.guild.id });
            if (!guildData) {
                guildData = new Guild({ guildId: message.guild.id });
                await guildData.save();
            }

            const currentPreset = guildData.musicPreset || 'classic';
            
            const presetInfo = `**Current Preset:** \`${currentPreset}\`\n\n` +
                `**Available Presets:**\n\n` +
                `> **classic** - Traditional Discord embeds (default)\n` +
                `> **musicard-dynamic** - Beautiful music card with dynamic colors from artwork\n` +
                `> **musicard-classic** - Classic dark theme music card with vibrant accents\n` +
                `> **musicard-custom** - Customizable theme music card\n\n` +
                `**Usage:** \`${this.usage}\`\n\n` +
                `**Examples:**\n` +
                `> \`!musicpreset classic\` - Use classic embeds\n` +
                `> \`!musicpreset musicard-dynamic\` - Use dynamic music cards`;

            return message.reply(embedBuilder.infoEmbed('Music Preset Settings', presetInfo));
        }

        const preset = args[0].toLowerCase();
        const validPresets = ['classic', 'musicard-dynamic', 'musicard-classic', 'musicard-custom'];

        if (!validPresets.includes(preset)) {
            return message.reply(embedBuilder.errorEmbed(
                'Invalid Preset', 
                `Invalid preset! Choose from: \`${validPresets.join('`, `')}\`\n\nUse \`!musicpreset\` to see all options.`
            ));
        }

        let guildData = await Guild.findOne({ guildId: message.guild.id });
        if (!guildData) {
            guildData = new Guild({ guildId: message.guild.id });
        }

        guildData.musicPreset = preset;
        await guildData.save();

        const presetDescriptions = {
            'classic': 'Traditional Discord embeds',
            'musicard-dynamic': 'Dynamic music cards with auto-detected colors',
            'musicard-classic': 'Classic dark theme music cards',
            'musicard-custom': 'Customizable theme music cards'
        };

        return message.reply(embedBuilder.successEmbed(
            'Music Preset Updated',
            `✅ Now-playing style changed to **${preset}**\n\n` +
            `${presetDescriptions[preset]}\n\n` +
            `Play a song to see the new style!`
        ));
    }
};
