const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ThumbnailBuilder,
    SectionBuilder
} = require('discord.js');
const config = require('../../config.json');

function formatDuration(ms) {
    const duration = ms ?? 0;
    if (!duration || duration === 0) return '00:00';
    const seconds = Math.floor(duration / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

class EmbedBuilder {
    constructor() {
        this.color = config.color ? parseInt(config.color.replace('#', ''), 16) : 0xFF00FF;
    }

    createContainer(options = {}) {
        const container = new ContainerBuilder();
        return container;
    }

    formatDuration(ms) {
        return formatDuration(ms);
    }

    errorEmbed(title, message) {
        const container = this.createContainer({ color: '#FF0000' });

        const header = new TextDisplayBuilder()
            .setContent(`## ${title}`);
        container.addTextDisplayComponents(header);

        container.addSeparatorComponents(new SeparatorBuilder());

        const errorText = new TextDisplayBuilder()
            .setContent(`> ${message}`);
        container.addTextDisplayComponents(errorText);

        return { 
            components: [container], 
            flags: MessageFlags.IsComponentsV2 
        };
    }

    successEmbed(title, message) {
        const container = this.createContainer({ color: '#00FF00' });

        const header = new TextDisplayBuilder()
            .setContent(`## ${title}`);
        container.addTextDisplayComponents(header);

        container.addSeparatorComponents(new SeparatorBuilder());

        const successText = new TextDisplayBuilder()
            .setContent(`> ${message}`);
        container.addTextDisplayComponents(successText);

        return { 
            components: [container], 
            flags: MessageFlags.IsComponentsV2 
        };
    }

    infoEmbed(title, description) {
        const container = this.createContainer();

        const header = new TextDisplayBuilder()
            .setContent(`## ${title}`);
        container.addTextDisplayComponents(header);

        container.addSeparatorComponents(new SeparatorBuilder());

        const infoText = new TextDisplayBuilder()
            .setContent(`> ${description}`);
        container.addTextDisplayComponents(infoText);

        return { 
            components: [container], 
            flags: MessageFlags.IsComponentsV2 
        };
    }

    musicEmbed(title, description, thumbnailUrl = null, buttons = null) {
        const container = this.createContainer();

        const titleText = new TextDisplayBuilder()
            .setContent(`## ${title}`);
        container.addTextDisplayComponents(titleText);

        if (description) {
            container.addSeparatorComponents(new SeparatorBuilder());

            const descText = new TextDisplayBuilder()
                .setContent(description);

            const section = new SectionBuilder()
                .addTextDisplayComponents(descText);

            if (thumbnailUrl) {
                const thumbnail = new ThumbnailBuilder({ 
                    media: { url: thumbnailUrl } 
                });
                section.setThumbnailAccessory(thumbnail);
            }

            container.addSectionComponents(section);
        }

        if (buttons && Array.isArray(buttons)) {
            container.addSeparatorComponents(new SeparatorBuilder());
            buttons.forEach(buttonRow => {
                container.addActionRowComponents(buttonRow);
            });
        }

        return { 
            components: [container], 
            flags: MessageFlags.IsComponentsV2 
        };
    }

    trackEnqueuedEmbed(track, position, requester) {
        const container = this.createContainer();

        const header = new TextDisplayBuilder()
            .setContent('## Track Enqueued');
        container.addTextDisplayComponents(header);

        const trackInfo = new TextDisplayBuilder()
            .setContent(`• [${track.info.title}](${track.info.uri})\n• ${requester}\n• Duration: **${this.formatDuration(track.info.duration)}**\n• Position: **${position}**`);

        const section = new SectionBuilder()
            .addTextDisplayComponents(trackInfo);

        container.addSectionComponents(section);

        return { 
            components: [container], 
            flags: MessageFlags.IsComponentsV2 
        };
    }

    nowPlayingEmbed(track, player, requester, requesterId = null) {
        const container = this.createContainer();

        const header = new TextDisplayBuilder()
            .setContent('## Now Playing');
        container.addTextDisplayComponents(header);

        const duration = track.info.duration ?? track.info.length ?? 0;
        const trackInfo = new TextDisplayBuilder()
            .setContent(`• [${track.info.title}](${track.info.uri})\n• ${requester}\n• Duration: **${this.formatDuration(duration)}**`);

        const section = new SectionBuilder()
            .addTextDisplayComponents(trackInfo);

        const artworkUrl = track.info.artworkUrl || track.info.thumbnail;
        if (artworkUrl) {
            const thumbnail = new ThumbnailBuilder({ 
                media: { url: artworkUrl } 
            });
            section.setThumbnailAccessory(thumbnail);
        }

        container.addSectionComponents(section);

        container.addSeparatorComponents(new SeparatorBuilder());

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏮️'),
                new ButtonBuilder()
                    .setCustomId('music_pauseresume')
                    .setLabel(player.paused ? 'Resume' : 'Pause')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji(player.paused ? '▶️' : '⏸️'),
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setLabel('Skip')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏭️'),
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setLabel('Stop')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⏹️'),
                new ButtonBuilder()
                    .setCustomId('music_like')
                    .setEmoji('👍')
                    .setStyle(ButtonStyle.Success)
            );

        container.addActionRowComponents(row);

        return { 
            components: [container], 
            flags: MessageFlags.IsComponentsV2 
        };
    }

    queueEmbed(queue, player, currentPage = 1, itemsPerPage = 10) {
        const container = this.createContainer();

        const header = new TextDisplayBuilder()
            .setContent('## Music Queue');
        container.addTextDisplayComponents(header);

        if (queue.tracks.length > 0) {
            const totalPages = Math.ceil(queue.tracks.length / itemsPerPage);
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const tracks = queue.tracks.slice(start, end);

            let queueText = tracks.map((track, index) => {
                const position = start + index + 1;
                return `${position}. [${track.info.title}](${track.info.uri})`;
            }).join('\n');

            queueText += `\n\n> Total: **${queue.tracks.length}** tracks`;

            const queueContent = new TextDisplayBuilder()
                .setContent(queueText);

            const section = new SectionBuilder()
                .addTextDisplayComponents(queueContent);

            container.addSectionComponents(section);

            if (totalPages > 1) {
                const navButtons = new ActionRowBuilder();

                if (currentPage > 1) {
                    navButtons.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queue_prev_${currentPage - 1}`)
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('⬅️')
                    );
                }

                navButtons.addComponents(
                    new ButtonBuilder()
                        .setCustomId('queue_refresh')
                        .setLabel(`Page ${currentPage}/${totalPages}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

                if (currentPage < totalPages) {
                    navButtons.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queue_next_${currentPage + 1}`)
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('➡️')
                    );
                }

                container.addActionRowComponents(navButtons);
            }
        } else {
            const empty = new TextDisplayBuilder()
                .setContent('Queue is empty. Add some songs!');

            const section = new SectionBuilder()
                .addTextDisplayComponents(empty);

            container.addSectionComponents(section);
        }

        return { 
            components: [container], 
            flags: MessageFlags.IsComponentsV2 
        };
    }

    helpEmbed(commands, categories, selectedCategory = 'home', prefix = '!', botAvatarUrl = null, totalCommands = null) {
        const { 
            ContainerBuilder, 
            TextDisplayBuilder, 
            SectionBuilder, 
            SeparatorBuilder,
            ActionRowBuilder,
            StringSelectMenuBuilder,
            StringSelectMenuOptionBuilder,
            ThumbnailBuilder
        } = require('discord.js');

        const container = this.createContainer();

        if (selectedCategory === 'home') {
            let categoryList = '';
            Object.entries(categories).forEach(([cat]) => {
                const cmdList = commands[cat] || [];
                categoryList += `> - **${cat}:** ${cmdList.length} commands\n`;
            });

            // Use provided total or calculate from prefix commands only
            if (!totalCommands) {
                totalCommands = Object.values(commands).reduce((acc, cmdList) => acc + cmdList.length, 0);
            }

            const mainContent = new TextDisplayBuilder()
                .setContent(`## Ayira Music Bot - Help Menu\n\n> Welcome to the help menu! Select a category below to view commands.\n> **Prefix:** \`${prefix}\`\n> **Total Commands:** \`${totalCommands}\`\n\n**Features:**\n> - Ultra-high-quality audio with Lavalink v4\n> - Multi-platform support (YouTube, Spotify, SoundCloud, Apple Music)\n> - Advanced queue management with autoplay\n> - Audio filters (bass boost, nightcore, vaporwave, 8D)\n> - Loop modes & volume control (0-200%)\n> - Custom playlists & server settings\n\n**Categories:**\n${categoryList}\n> Powered by Aliana Client`);

            const section = new SectionBuilder()
                .addTextDisplayComponents(mainContent);

            if (botAvatarUrl) {
                const thumbnail = new ThumbnailBuilder({ 
                    media: { url: botAvatarUrl } 
                });
                section.setThumbnailAccessory(thumbnail);
            }

            container.addSectionComponents(section);

        } else {
            const categoryName = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
            const cmdList = commands[categoryName] || [];

            let commandsContent = `## ${categoryName} Commands\n\n> Use \`${prefix}<command>\` to use a command\n\n`;

            if (cmdList.length > 0) {
                cmdList.forEach((cmd) => {
                    commandsContent += `**${prefix}${cmd.name}**\n> ${cmd.description || 'No description'}`;

                    if (cmd.aliases && cmd.aliases.length > 0) {
                        commandsContent += `\n> **Aliases:** \`${cmd.aliases.join(', ')}\``;
                    }

                    if (cmd.usage) {
                        commandsContent += `\n> **Usage:** \`${cmd.usage}\``;
                    }

                    commandsContent += '\n\n';
                });
            } else {
                commandsContent += '> No commands found in this category.';
            }

            const cmdText = new TextDisplayBuilder()
                .setContent(commandsContent.trim());

            const section = new SectionBuilder()
                .addTextDisplayComponents(cmdText);

            if (botAvatarUrl) {
                const thumbnail = new ThumbnailBuilder({ 
                    media: { url: botAvatarUrl } 
                });
                section.setThumbnailAccessory(thumbnail);
            }

            container.addSectionComponents(section);
        }

        container.addSeparatorComponents(new SeparatorBuilder());

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_select')
            .setPlaceholder('Select a category')
            .addOptions([
                {
                    label: 'Home',
                    description: 'Go back to main menu',
                    value: 'home'
                },
                ...Object.keys(categories).map(cat => ({
                    label: cat,
                    description: `View ${cat.toLowerCase()} commands`,
                    value: cat.toLowerCase()
                }))
            ]);

        const selectRow = new ActionRowBuilder()
            .addComponents(selectMenu);

        container.addActionRowComponents(selectRow);

        return { 
            components: [container], 
            flags: MessageFlags.IsComponentsV2 
        };
    }

    getCategoryEmoji(category) {
        const emojiMap = {
            'Music': '🎵',
            'Filters': '🎛️',
            'Playlist': '📝',
            'Spotify': '🎧',
            'Settings': '⚙️',
            'Utility': '🛠️',
            'Owner': '👑',
            'Moderation': '🔨',
            'Fun': '🎮',
            'Info': 'ℹ️'
        };
        return emojiMap[category] || '📁';
    }
}

const embedBuilder = new EmbedBuilder();

module.exports = embedBuilder;