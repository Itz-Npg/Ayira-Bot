const embedBuilder = require('../utils/embedBuilder');

module.exports = (client) => {
    client.on('interactionCreate', async (interaction) => {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const commandName = interaction.commandName;
            let prefixCommand = client.commands.get(commandName);

            // Check if it's a Spotify command
            if (!prefixCommand && commandName.startsWith('spotify-')) {
                prefixCommand = client.commands.get(commandName);
            }

            if (!prefixCommand) {
                return interaction.reply({
                    ...embedBuilder.errorEmbed('Command Not Found', 'This command is not available!'),
                    ephemeral: true
                });
            }

            try {
                // Convert slash command options to args array
                const args = [];
                const options = interaction.options;

                // Collect all option values as args
                if (options) {
                    for (const [key, value] of options._hoistedOptions || []) {
                        if (value.value !== undefined) {
                            args.push(String(value.value));
                        }
                    }
                }

                // Handle user mentions for voice channel joining
                let targetUser = options?.getUser?.('user');
                if (targetUser && ['join', 'play'].includes(commandName)) {
                    const member = interaction.guild.members.cache.get(targetUser.id);
                    if (member && member.voice.channel) {
                        // Override the interaction member's voice channel
                        interaction.member.voice = member.voice;
                    }
                }

                // Build args array from options
                if (options._hoistedOptions) {
                    options._hoistedOptions.forEach(opt => {
                        if (opt.name !== 'user') { // Skip user option as it's already handled
                            args.push(opt.value?.toString() || '');
                        }
                    });
                }

                // Check cooldown
                const config = require('../../config.json');
                const isOwner = interaction.user.id === config.owner.id;
                const { checkCooldown } = require('../utils/cooldowns');
                const cooldownCheck = checkCooldown(interaction.user.id, commandName, prefixCommand, isOwner);
                
                if (cooldownCheck.onCooldown) {
                    return interaction.reply({
                        ...embedBuilder.errorEmbed('Cooldown', `Please wait **${cooldownCheck.timeLeft}s** before using this command again.`),
                        ephemeral: true
                    });
                }

                // Create a message-like object for compatibility
                const fakeMessage = {
                    guild: interaction.guild,
                    member: interaction.member,
                    channel: interaction.channel,
                    author: interaction.user,
                    reply: async (content) => {
                        if (interaction.replied || interaction.deferred) {
                            return interaction.followUp(content);
                        }
                        return interaction.reply(content);
                    }
                };

                // Execute the command
                await prefixCommand.execute(fakeMessage, args, client);

            } catch (error) {
                console.error(`Error executing slash command ${commandName}:`, error);
                
                const errorResponse = embedBuilder.errorEmbed('Error', 'An error occurred while executing this command!');
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ ...errorResponse, ephemeral: true });
                } else {
                    await interaction.reply({ ...errorResponse, ephemeral: true });
                }
            }
            return;
        }
        
        // Handle button interactions
        if (!interaction.isButton()) return;

        if (!interaction.customId.startsWith('music_')) return;

        const sessionManager = require('../utils/musicSessionManager');

        // Check if user has permission to use music controls
        if (!sessionManager.canUseControls(interaction.guild.id, interaction.user.id)) {
            return interaction.reply({ 
                ...embedBuilder.errorEmbed('Permission Denied', 'Only the person who requested this song can use these controls!'),
                ephemeral: true 
            });
        }

        if (!interaction.member.voice.channel) {
            return interaction.reply({ 
                ...embedBuilder.errorEmbed('Error', 'You need to be in a voice channel to use music controls!'),
                ephemeral: true 
            });
        }

        const player = client.lavalink.getPlayer(interaction.guild.id);
        
        if (!player) {
            return interaction.reply({ 
                ...embedBuilder.errorEmbed('Error', 'No music player found!'),
                ephemeral: true 
            });
        }

        if (interaction.member.voice.channel.id !== player.voiceChannelId) {
            return interaction.reply({ 
                ...embedBuilder.errorEmbed('Error', 'You need to be in the same voice channel as the bot!'),
                ephemeral: true 
            });
        }

        try {
            switch (interaction.customId) {
                case 'music_pauseresume':
                    // Check if music is actually playing or paused
                    if (!player.queue.current) {
                        return interaction.reply({ 
                            ...embedBuilder.errorEmbed('Error', 'No music is currently playing!'),
                            ephemeral: true 
                        });
                    }

                    await player.pause(!player.paused);
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Music Control', player.paused ? '⏸️ Music paused' : '▶️ Music resumed'),
                        ephemeral: true 
                    });
                    break;

                case 'music_skip':
                    if (!player.queue.current) {
                        return interaction.reply({ 
                            ...embedBuilder.errorEmbed('Error', 'No music is currently playing!'),
                            ephemeral: true 
                        });
                    }

                    if (player.queue.tracks.length === 0 && !player.autoPlay) {
                        return interaction.reply({ 
                            ...embedBuilder.errorEmbed('Error', 'No more tracks in the queue!'),
                            ephemeral: true 
                        });
                    }

                    const currentTrackTitle = player.queue.current.info.title;
                    await player.skip();
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Skipped', `⏭️ Skipped: **${currentTrackTitle}**`),
                        ephemeral: true 
                    });
                    break;

                case 'music_stop':
                    player.destroy();
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Stopped', 'Music stopped and disconnected from voice channel!'),
                        ephemeral: true 
                    });
                    break;

                case 'music_shuffle':
                    if (player.queue.tracks.length < 2) {
                        return interaction.reply({ 
                            ...embedBuilder.errorEmbed('Error', 'Not enough tracks in the queue to shuffle!'),
                            ephemeral: true 
                        });
                    }
                    player.queue.shuffle();
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Shuffled', 'Queue shuffled!'),
                        ephemeral: true 
                    });
                    break;

                case 'music_volup':
                    const newVolUp = Math.min(player.volume + 10, 100);
                    player.setVolume(newVolUp);
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Volume', `Volume increased to ${newVolUp}%`),
                        ephemeral: true 
                    });
                    break;

                case 'music_voldown':
                    const newVolDown = Math.max(player.volume - 10, 0);
                    player.setVolume(newVolDown);
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Volume', `Volume decreased to ${newVolDown}%`),
                        ephemeral: true 
                    });
                    break;

                case 'music_loop':
                    if (!player.loop) {
                        player.setLoop('track');
                        await interaction.reply({ 
                            ...embedBuilder.successEmbed('Loop', 'Now looping the current track'),
                            ephemeral: true 
                        });
                    } else if (player.loop === 'track') {
                        player.setLoop('queue');
                        await interaction.reply({ 
                            ...embedBuilder.successEmbed('Loop', 'Now looping the entire queue'),
                            ephemeral: true 
                        });
                    } else {
                        player.setLoop(false);
                        await interaction.reply({ 
                            ...embedBuilder.successEmbed('Loop', 'Loop disabled'),
                            ephemeral: true 
                        });
                    }
                    break;

                case 'music_autoplay':
                    player.setAutoPlay(!player.autoPlay);
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Autoplay', player.autoPlay ? 'Autoplay enabled' : 'Autoplay disabled'),
                        ephemeral: true 
                    });
                    break;

                case 'music_queue':
                    if (player.queue.tracks.length === 0) {
                        return interaction.reply({ 
                            ...embedBuilder.errorEmbed('Error', 'The queue is empty!'),
                            ephemeral: true 
                        });
                    }

                    const queueList = player.queue.tracks
                        .slice(0, 10)
                        .map((track, index) => `> ${index + 1}. ${track.info.title} - ${track.info.author}`)
                        .join('\n');

                    const totalTracks = player.queue.tracks.length;
                    const moreText = totalTracks > 10 ? `\n\n> ... and ${totalTracks - 10} more tracks` : '';

                    await interaction.reply({ 
                        ...embedBuilder.musicEmbed('Music Queue', queueList + moreText + `\n\n> Total tracks: ${totalTracks}`),
                        ephemeral: true 
                    });
                    break;

                case 'music_previous':
                    if (!player.queue.previous || player.queue.previous.length === 0) {
                        return interaction.reply({ 
                            ...embedBuilder.errorEmbed('Error', 'No previous tracks available!'),
                            ephemeral: true 
                        });
                    }
                    
                    const prevTrack = player.queue.previous[player.queue.previous.length - 1];
                    await player.queue.add(prevTrack, 0);
                    player.skip();
                    
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Previous', 'Playing the previous track!'),
                        ephemeral: true 
                    });
                    break;

                case 'music_backward':
                    const newPositionBack = Math.max(player.position - 10000, 0);
                    await player.seek(newPositionBack);
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Rewound', 'Rewound 10 seconds!'),
                        ephemeral: true 
                    });
                    break;

                case 'music_forward':
                    const newPositionForward = Math.min(player.position + 10000, player.queue.current.info.duration);
                    await player.seek(newPositionForward);
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Fast-forwarded', 'Fast-forwarded 10 seconds!'),
                        ephemeral: true 
                    });
                    break;

                case 'music_replay':
                    await player.seek(0);
                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Replay', 'Replaying from the beginning!'),
                        ephemeral: true 
                    });
                    break;

                case 'music_like':
                    const User = require('../models/User');
                    const currentTrack = player.queue.current;
                    
                    if (!currentTrack) {
                        return interaction.reply({ 
                            ...embedBuilder.errorEmbed('Error', 'No track is currently playing!'),
                            ephemeral: true 
                        });
                    }

                    let userData = await User.findOne({ userId: interaction.user.id });
                    if (!userData) {
                        userData = new User({ userId: interaction.user.id });
                    }

                    const alreadyLiked = userData.likedSongs.some(song => song.uri === currentTrack.info.uri);
                    
                    if (alreadyLiked) {
                        userData.likedSongs = userData.likedSongs.filter(song => song.uri !== currentTrack.info.uri);
                        await userData.save();
                        
                        await interaction.reply({ 
                            ...embedBuilder.successEmbed('Removed from Liked Songs', `**${currentTrack.info.title}** has been removed from your liked songs!`),
                            ephemeral: true 
                        });
                    } else {
                        userData.likedSongs.push({
                            title: currentTrack.info.title,
                            author: currentTrack.info.author,
                            uri: currentTrack.info.uri,
                            artworkUrl: currentTrack.info.artworkUrl,
                            duration: currentTrack.info.duration
                        });
                        await userData.save();
                        
                        await interaction.reply({ 
                            ...embedBuilder.successEmbed('Added to Liked Songs', `**${currentTrack.info.title}** has been added to your liked songs!`),
                            ephemeral: true 
                        });
                    }
                    break;

                case 'liked_play':
                    const voiceChannel = interaction.member.voice.channel;
                    
                    if (!voiceChannel) {
                        return interaction.reply({ 
                            ...embedBuilder.errorEmbed('Not in Voice Channel', 'You need to be in a voice channel!'),
                            ephemeral: true 
                        });
                    }

                    const likedUserData = await User.findOne({ userId: interaction.user.id });
                    
                    if (!likedUserData || !likedUserData.likedSongs || likedUserData.likedSongs.length === 0) {
                        return interaction.reply({ 
                            ...embedBuilder.errorEmbed('No Liked Songs', 'You haven\'t liked any songs yet!'),
                            ephemeral: true 
                        });
                    }

                    let likedPlayer = client.lavalink.getPlayer(interaction.guildId);

                    if (!likedPlayer) {
                        likedPlayer = client.lavalink.createPlayer({
                            guildId: interaction.guildId,
                            voiceChannelId: voiceChannel.id,
                            textChannelId: interaction.channelId,
                            selfDeaf: true,
                            selfMute: false,
                            volume: 100,
                        });

                        await likedPlayer.connect();
                    }

                    let addedCount = 0;
                    for (const song of likedUserData.likedSongs) {
                        try {
                            const res = await client.lavalink.search({ query: song.uri }, interaction.user);
                            if (res.tracks && res.tracks.length > 0) {
                                await likedPlayer.queue.add(res.tracks[0]);
                                addedCount++;
                            }
                        } catch (err) {
                            console.error('Failed to add liked song:', err);
                        }
                    }

                    if (!likedPlayer.playing && !likedPlayer.paused) {
                        await likedPlayer.play();
                    }

                    await interaction.reply({ 
                        ...embedBuilder.successEmbed('Playing Liked Songs', `Added **${addedCount}** liked songs to the queue!`),
                        ephemeral: true 
                    });
                    break;

                default:
                    await interaction.reply({ 
                        ...embedBuilder.errorEmbed('Error', 'Unknown button action!'),
                        ephemeral: true 
                    });
            }
        } catch (error) {
            console.error('Music button interaction error:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    ...embedBuilder.errorEmbed('Error', 'An error occurred while processing your request!'),
                    ephemeral: true 
                }).catch(() => {});
            }
        }
    });
};
