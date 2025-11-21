const embedBuilder = require('../../utils/embedBuilder');
const User = require('../../models/User');
const { SectionBuilder, TextDisplayBuilder, ThumbnailBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

function formatDuration(ms) {
    if (!ms || ms === 0) return '00:00';
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
    name: 'liked',
    aliases: ['favourites', 'favorites', 'likedsongs'],
    description: 'View and play your liked songs',
    usage: '!liked [play]',
    category: 'Music',
    cooldown: 5000,
    
    async execute(message, args, client) {
        try {
            let userData = await User.findOne({ userId: message.author.id });
            
            if (!userData || !userData.likedSongs || userData.likedSongs.length === 0) {
                return message.reply(embedBuilder.errorEmbed('No Liked Songs', 'You haven\'t liked any songs yet!'));
            }

            const action = args[0]?.toLowerCase();

            if (action === 'play') {
                const voiceChannel = message.member.voice.channel;
                
                if (!voiceChannel) {
                    return message.reply(embedBuilder.errorEmbed('Not in Voice Channel', 'You need to be in a voice channel to play liked songs!'));
                }

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

                let added = 0;
                for (const song of userData.likedSongs) {
                    try {
                        const res = await client.lavalink.search({ query: song.uri }, message.author);
                        if (res.tracks && res.tracks.length > 0) {
                            // Set requester on track
                            res.tracks[0].requester = message.author.id;
                            await player.queue.add(res.tracks[0]);
                            added++;
                        }
                    } catch (err) {
                        console.error('Failed to add liked song:', err);
                    }
                }

                if (!player.playing && !player.paused) {
                    await player.play();
                }

                return message.reply(embedBuilder.successEmbed('Playing Liked Songs', `Added **${added}** liked songs to the queue!`));
            }

            const likedSongs = userData.likedSongs
                .slice(0, 10)
                .map((song, index) => `${index + 1}. [${song.title}](${song.uri}) - ${song.author}`)
                .join('\n');

            const totalSongs = userData.likedSongs.length;
            const moreText = totalSongs > 10 ? `\n\n> ... and ${totalSongs - 10} more songs` : '';

            const playButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('liked_play')
                    .setLabel('Play All')
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Success)
            );

            const response = embedBuilder.musicEmbed(
                '💖 Liked Songs',
                likedSongs + moreText + `\n\n> Total: **${totalSongs}** songs\n> Use \`!liked play\` to play all`,
                null,
                [playButton]
            );

            await message.reply(response);

        } catch (error) {
            console.error('Liked songs error:', error);
            message.reply(embedBuilder.errorEmbed('Error', 'Failed to fetch liked songs!'));
        }
    }
};
