const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { LavalinkManager } = require('aliana-client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const config = require('../config.json');
const database = require('./handlers/database');
const Guild = require('./models/Guild');
const User = require('./models/User');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
};

const log = {
    info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    command: (msg) => console.log(`${colors.magenta}[CMD]${colors.reset} ${msg}`),
    event: (msg) => console.log(`${colors.blue}[EVENT]${colors.reset} ${msg}`),
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.commands = new Collection();
client.prefix = config.prefix || process.env.PREFIX || '!';

client.lavalink = new LavalinkManager({
    nodes: config.lavalink.nodes,
    sendPayload: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
    },
});

console.log('\n' + colors.cyan + colors.bright);
console.log('  ╔═══════════════════════════════════════════════════════════╗');
console.log('  ║                                                           ║');
console.log('  ║     █████╗ ██╗   ██╗██╗██████╗  █████╗                   ║');
console.log('  ║    ██╔══██╗╚██╗ ██╔╝██║██╔══██╗██╔══██╗                  ║');
console.log('  ║    ███████║ ╚████╔╝ ██║██████╔╝███████║                  ║');
console.log('  ║    ██╔══██║  ╚██╔╝  ██║██╔══██╗██╔══██║                  ║');
console.log('  ║    ██║  ██║   ██║   ██║██║  ██║██║  ██║                  ║');
console.log('  ║    ╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                  ║');
console.log('  ║                                                           ║');
console.log('  ║            DISCORD MUSIC BOT                             ║');
console.log('  ║        Powered by Aliana-Client & Lavalink              ║');
console.log('  ║                                                           ║');
console.log('  ╚═══════════════════════════════════════════════════════════╝');
console.log(colors.reset + '\n');

log.info('Initializing bot...');

const commandsPath = path.join(__dirname, 'commands');
let commandCount = 0;
if (fs.existsSync(commandsPath)) {
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(path.join(folderPath, file));
                if (command.name) {
                    client.commands.set(command.name, command);
                    commandCount++;
                    if (command.aliases) {
                        command.aliases.forEach(alias => client.commands.set(alias, command));
                    }
                    log.success(`Loaded command: ${command.name} ${command.aliases ? `(${command.aliases.join(', ')})` : ''}`);
                }
            }
        }
    }
}
log.info(`Total commands loaded: ${commandCount}`);

log.info('Connecting to MongoDB...');
database.connect().catch(err => {
    log.error('Failed to connect to database: ' + err.message);
    process.exit(1);
});

client.on('raw', (packet) => {
    if (packet.t === 'VOICE_STATE_UPDATE') {
        client.lavalink.updateVoiceState(packet.d);
    } else if (packet.t === 'VOICE_SERVER_UPDATE') {
        client.lavalink.updateVoiceServer(packet.d);
    }
});

client.once('ready', async () => {
    console.log('\n' + colors.green + colors.bright);
    console.log('  ╔═══════════════════════════════════════════════════════════╗');
    console.log('  ║                    BOT STATUS: ONLINE                     ║');
    console.log('  ╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    log.success(`Bot logged in as: ${colors.bright}${client.user.tag}${colors.reset}`);
    log.info(`Servers: ${colors.bright}${client.guilds.cache.size}${colors.reset}`);
    log.info(`Users: ${colors.bright}${client.users.cache.size}${colors.reset}`);
    log.info(`Prefix: ${colors.bright}${client.prefix}${colors.reset}`);
    log.info(`Commands: ${colors.bright}${client.commands.size}${colors.reset}`);

    console.log('\n' + colors.cyan);
    console.log('  ┌───────────────────────────────────────────────────────┐');
    console.log('  │          Initializing Lavalink Manager...            │');
    console.log('  └───────────────────────────────────────────────────────┘');
    console.log(colors.reset);

    client.lavalink.init(client.user.id);

    const { registerSlashCommands } = require('./handlers/slashCommands');
    await registerSlashCommands(client.user.id);

    let statusIndex = 0;
    const updateStatus = () => {
        const activePlayers = Array.from(client.lavalink.players.values()).filter(p => p.queue.current).length;
        const statuses = [
            { name: `${client.guilds.cache.size} servers`, type: 3 },
            { name: `${client.users.cache.size} users`, type: 3 },
            { name: `music in ${activePlayers} servers`, type: 0 },
            { name: `${client.prefix}help | High-Quality Music`, type: 2 },
        ];

        const status = statuses[statusIndex];
        client.user.setActivity(status.name, { type: status.type });
        statusIndex = (statusIndex + 1) % statuses.length;
    };

    updateStatus();
    setInterval(updateStatus, 15000);

    console.log('\n' + colors.green);
    console.log('  ┌───────────────────────────────────────────────────────┐');
    console.log('  │             Bot is fully operational!                │');
    console.log('  │        Ready to play high-quality music!             │');
    console.log('  └───────────────────────────────────────────────────────┘');
    console.log(colors.reset + '\n');

    setTimeout(async () => {
        try {
            const guilds = await Guild.find({ '247.enabled': true });
            log.info(`Found ${guilds.length} guilds with 24/7 mode enabled`);

            for (const guildData of guilds) {
                try {
                    const guild = client.guilds.cache.get(guildData.guildId);
                    if (!guild) continue;

                    const voiceChannel = guild.channels.cache.get(guildData['247'].voiceChannel);
                    if (!voiceChannel) continue;

                    let player = client.lavalink.getPlayer(guild.id);
                    if (!player) {
                        player = client.lavalink.createPlayer({
                            guildId: guild.id,
                            voiceChannelId: voiceChannel.id,
                            textChannelId: guildData['247'].textChannel,
                            selfDeaf: true,
                            selfMute: false,
                            volume: 100,
                        });

                        await player.connect();
                        log.success(`Reconnected to 24/7 voice channel in ${guild.name}`);
                    }
                } catch (err) {
                    log.error(`Failed to reconnect 24/7 in guild ${guildData.guildId}: ${err.message}`);
                }
            }
        } catch (err) {
            log.error(`Error restoring 24/7 connections: ${err.message}`);
        }
    }, 5000);
});

const eventsPath = path.join(__dirname, 'events');
let eventCount = 0;
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        require(path.join(eventsPath, file))(client);
        eventCount++;
        log.success(`Loaded event file: ${file}`);
    }
}
log.info(`Total event files loaded: ${eventCount}`);

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    try {
        const CommandLog = require('./models/CommandLog');

        let userData = await User.findOne({ userId: message.author.id });
        let guildData = await Guild.findOne({ guildId: message.guild.id });

        if (!guildData) {
            guildData = new Guild({ guildId: message.guild.id });
            await guildData.save();
        }

        if (userData && userData.blacklisted && message.author.id !== config.owner.id) {
            return;
        }

        if (userData && userData.premium.enabled && userData.premium.expiresAt) {
            if (new Date() >= new Date(userData.premium.expiresAt)) {
                userData.premium.enabled = false;
                userData.premium.expiresAt = null;
                userData.premium.servers = [];
                await userData.save();

                const embedBuilder = require('./utils/embedBuilder');
                message.author.send(embedBuilder.errorEmbed('Premium Expired', 'Your premium subscription has expired.')).catch(() => {});
            }
        }

        if (guildData.premium.enabled && guildData.premium.expiresAt) {
            if (new Date() >= new Date(guildData.premium.expiresAt)) {
                guildData.premium.enabled = false;
                guildData.premium.expiresAt = null;
                await guildData.save();

                const embedBuilder = require('./utils/embedBuilder');
                const owner = await message.guild.fetchOwner();
                owner.send(embedBuilder.errorEmbed('Premium Expired', `Premium has expired in ${message.guild.name}`)).catch(() => {});
            }
        }

        const prefix = guildData.prefix || config.prefix || '!';
        const isOwner = message.author.id === config.owner.id;
        const hasNoPrefix = userData?.noPrefix || isOwner;

        if (message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) {
            const { 
                ContainerBuilder, 
                TextDisplayBuilder, 
                SeparatorBuilder,
                MessageFlags,
                ActionRowBuilder, 
                ButtonBuilder, 
                ButtonStyle,
                ThumbnailBuilder,
                SectionBuilder
            } = require('discord.js');

            const container = new ContainerBuilder();

            const header = new TextDisplayBuilder()
                .setContent(`## Ayira - Music Bot`);
            container.addTextDisplayComponents(header);

            container.addSeparatorComponents(new SeparatorBuilder());

            const infoContent = new TextDisplayBuilder()
                .setContent(`Hey ${message.author}! I'm a high-quality music bot.\n\n**Bot Information:**\n• Prefix: \`${prefix}\` or mention me \`@${client.user.username}\`\n• Server: ${message.guild.name}\n• Premium: ${guildData.premium.enabled ? 'Active' : 'Inactive'}\n\n**Quick Start:**\n• \`${prefix}help\` or \`@${client.user.username} help\`\n• \`${prefix}play <song>\` - Play a song\n• \`${prefix}queue\` - View queue`);

            const section = new SectionBuilder()
                .addTextDisplayComponents(infoContent);

            const thumbnail = new ThumbnailBuilder({ 
                media: { url: client.user.displayAvatarURL({ extension: 'png', size: 256 }) } 
            });
            section.setThumbnailAccessory(thumbnail);

            container.addSectionComponents(section);

            container.addSeparatorComponents(new SeparatorBuilder());

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Invite Me')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`),
                    new ButtonBuilder()
                        .setLabel('Support Server')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.gg/your-support-server')
                );

            container.addActionRowComponents(row);

            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsComponentsV2 
            });
        }

        if (guildData.ignoreChannels.includes(message.channel.id)) {
            const hasIgnoreRole = message.member.roles.cache.some(role => 
                guildData.ignoreRoles.includes(role.id)
            );

            if (!hasIgnoreRole && !isOwner) {
                return;
            }
        }

        let content = message.content;
        let usedPrefix = prefix;
        let isMentionCommand = false;

        // Check if message starts with bot mention
        const botMention = `<@${client.user.id}>`;
        const botMentionNick = `<@!${client.user.id}>`;
        
        if (message.content.startsWith(botMention) || message.content.startsWith(botMentionNick)) {
            // Bot was mentioned, use mention as prefix
            const mentionUsed = message.content.startsWith(botMention) ? botMention : botMentionNick;
            content = message.content.slice(mentionUsed.length).trim();
            usedPrefix = '';
            isMentionCommand = true;
        } else if (hasNoPrefix && !message.content.startsWith(prefix)) {
            // No prefix mode
            usedPrefix = '';
        } else if (!message.content.startsWith(prefix)) {
            // Not a command
            return;
        } else {
            // Regular prefix command
            content = content.slice(usedPrefix.length).trim();
        }

        const args = content.split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) return;

        if (command.owner && !isOwner) {
            const embedBuilder = require('./utils/embedBuilder');
            return message.reply(embedBuilder.errorEmbed('Access Denied', 'This command is restricted to the bot owner only.'));
        }

        if (command.permissions && !message.member.permissions.has(command.permissions)) {
            const embedBuilder = require('./utils/embedBuilder');
            return message.reply(embedBuilder.errorEmbed('Missing Permissions', `You need the following permissions: ${command.permissions.join(', ')}`));
        }

        // Spam detection (skip for owner)
        if (!isOwner) {
            const { checkSpam } = require('./utils/spamDetection');
            const spamCheck = checkSpam(message.author.id, commandName);

            if (spamCheck.isBlacklisted) {
                const embedBuilder = require('./utils/embedBuilder');
                return message.reply(
                    embedBuilder.errorEmbed(
                        '🚫 Auto-Blacklisted',
                        `You have been temporarily blacklisted for spamming commands.\n\n**Reason:** ${spamCheck.reason}\n**Time remaining:** ${spamCheck.timeLeft}s\n\nPlease wait before using commands again.`
                    )
                ).then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 10000);
                });
            }

            if (spamCheck.warning) {
                const embedBuilder = require('./utils/embedBuilder');
                message.reply(
                    embedBuilder.errorEmbed(
                        '⚠️ Spam Warning',
                        `Slow down! You have **${spamCheck.remaining}** commands left before auto-blacklist.\n(${spamCheck.commandCount}/${require('./utils/spamDetection').SPAM_CONFIG.MAX_COMMANDS} commands in 1 minute)`
                    )
                ).then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 5000);
                });
            }
        }

        const { checkCooldown } = require('./utils/cooldowns');
        const cooldownCheck = checkCooldown(message.author.id, commandName, command, isOwner);

        if (cooldownCheck.onCooldown) {
            const embedBuilder = require('./utils/embedBuilder');
            return message.reply(
                embedBuilder.errorEmbed('Cooldown', `Please wait **${cooldownCheck.timeLeft}s** before using this command again.`)
            ).then(m => {
                setTimeout(() => m.delete().catch(() => {}), 5000);
            });
        }

        log.command(`${message.author.tag} in ${message.guild.name} → ${usedPrefix}${commandName} ${args.join(' ')}`);

        const commandLogData = {
            userId: message.author.id,
            username: message.author.tag,
            guildId: message.guild.id,
            guildName: message.guild.name,
            channelId: message.channel.id,
            channelName: message.channel.name,
            command: commandName,
            args: args
        };

        await new CommandLog(commandLogData).save();

        // Send webhook log
        const webhookLogger = require('./utils/webhookLogger');
        webhookLogger.logCommand(commandLogData).catch(() => {});

        await command.execute(message, args, client);
        log.success(`Command executed: ${commandName}`);

    } catch (error) {
        log.error(`Error in messageCreate: ${error.message}`);
        console.error(error.stack);
        
        const webhookLogger = require('./utils/webhookLogger');
        webhookLogger.logError({
            error: error,
            context: 'Message Command Execution',
            guildId: message.guild?.id,
            guildName: message.guild?.name,
            userId: message.author.id,
            username: message.author.tag,
            command: commandName
        }).catch(() => {});
        
        const embedBuilder = require('./utils/embedBuilder');
        message.reply(embedBuilder.errorEmbed('Error', 'An error occurred while processing your command.')).catch(console.error);
    }
});

// Global error handlers
process.on('unhandledRejection', (error) => {
    log.error(`Unhandled Promise Rejection: ${error.message}`);
    console.error(error.stack);
    
    const webhookLogger = require('./utils/webhookLogger');
    webhookLogger.logError({
        error: error,
        context: 'Unhandled Promise Rejection'
    }).catch(() => {});
});

process.on('uncaughtException', (error) => {
    log.error(`Uncaught Exception: ${error.message}`);
    console.error(error.stack);
    
    const webhookLogger = require('./utils/webhookLogger');
    webhookLogger.logError({
        error: error,
        context: 'Uncaught Exception'
    }).catch(() => {});
});

client.on('error', (error) => {
    log.error(`Discord Client Error: ${error.message}`);
    console.error(error.stack);
    
    const webhookLogger = require('./utils/webhookLogger');
    webhookLogger.logError({
        error: error,
        context: 'Discord Client Error'
    }).catch(() => {});
});

client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('❌ Failed to login:', err.message);
    process.exit(1);
});
