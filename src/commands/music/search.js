const embedBuilder = require('../../utils/embedBuilder');
const { ActionRowBuilder, StringSelectMenuBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'search',
    aliases: ['find'],
    description: 'Search for songs and choose which one to play',
    usage: '!search <song name>',
    category: 'Music',
    
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply(embedBuilder.errorEmbed('Error', 'You need to be in a voice channel to use this command!'));
        }

        const query = args.join(' ');
        
        if (!query) {
            return message.reply(embedBuilder.errorEmbed('No Query', `Please provide a song name to search for.\nUsage: \`${this.usage}\``));
        }

        await message.channel.sendTyping();

        try {
            const result = await client.lavalink.search(query, message.author.id);

            if (result.loadType === 'error' || result.loadType === 'empty') {
                return message.reply(embedBuilder.errorEmbed('No Results', `No results found for **${query}**`));
            }

            const tracks = Array.isArray(result.data) ? result.data : result.data.tracks || [];
            
            if (tracks.length === 0) {
                return message.reply(embedBuilder.errorEmbed('No Results', `No results found for **${query}**`));
            }

            const topTracks = tracks.slice(0, 10);

            const options = topTracks.map((track, index) => ({
                label: track.info.title.substring(0, 100),
                description: `By: ${track.info.author.substring(0, 100)}`,
                value: index.toString(),
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('search-select')
                .setPlaceholder('Choose a song to play')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const trackList = topTracks.map((track, i) => 
                `> ${i + 1}. ${track.info.title} - ${track.info.author}`
            ).join('\n');

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## Search Results')
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(trackList)
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('> Select a song from the menu below')
                );

            const searchMessage = await message.reply({ 
                components: [container, row],
                flags: MessageFlags.IsComponentsV2
            });

            const collector = searchMessage.createMessageComponentCollector({
                filter: (i) => i.user.id === message.author.id && i.customId === 'search-select',
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                try {
                    await interaction.deferReply();

                    const selectedIndex = parseInt(interaction.values[0], 10);
                    const selectedTrack = topTracks[selectedIndex];

                    let player = client.lavalink.getPlayer(message.guild.id);

                    if (!player) {
                        player = client.lavalink.createPlayer({
                            guildId: message.guild.id,
                            voiceChannelId: voiceChannel.id,
                            textChannelId: message.channel.id,
                            selfDeaf: true,
                            selfMute: false,
                            volume: 100,
                        });

                        await player.connect();
                    }

                    // Set requester on track
                    selectedTrack.requester = message.author.id;
                    await player.queue.add(selectedTrack);

                    if (!player.playing && !player.paused) {
                        await player.play();
                    }

                    await interaction.editReply(embedBuilder.successEmbed('Track Added', `**${selectedTrack.info.title}**\n> Author: ${selectedTrack.info.author}\n> Position: ${player.queue.tracks.length}`));
                    await searchMessage.edit({ components: [] });

                } catch (error) {
                    console.error('Search select error:', error);
                    await interaction.editReply(embedBuilder.errorEmbed('Error', 'An error occurred while processing your selection.')).catch(() => {});
                }
            });

            collector.on('end', (collected) => {
                if (!collected.size) {
                    searchMessage.edit({ 
                        content: '⏱️ Search selection timed out.', 
                        components: [] 
                    }).catch(() => {});
                }
            });

        } catch (error) {
            console.error('Search error:', error);
            message.reply(embedBuilder.errorEmbed('Search Error', 'An error occurred while searching for songs.'));
        }
    }
};
