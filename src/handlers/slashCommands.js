const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const slashCommands = new Map();

// Music Commands
const musicCommands = [
    {
        name: 'play',
        description: 'Play a song or playlist',
        options: [
            { name: 'query', description: 'Song name or URL', type: 3, required: true },
            { name: 'user', description: 'Play for a specific user', type: 6, required: false }
        ]
    },
    {
        name: 'pause',
        description: 'Pause the current track'
    },
    {
        name: 'resume',
        description: 'Resume the paused track'
    },
    {
        name: 'skip',
        description: 'Skip the current track',
        options: [
            { name: 'amount', description: 'Number of tracks to skip', type: 4, required: false }
        ]
    },
    {
        name: 'stop',
        description: 'Stop playback and clear queue'
    },
    {
        name: 'join',
        description: 'Join your voice channel',
        options: [
            { name: 'user', description: 'Join the voice channel of a specific user', type: 6, required: false }
        ]
    },
    {
        name: 'leave',
        description: 'Leave the voice channel'
    },
    {
        name: 'nowplaying',
        description: 'Show the currently playing track'
    },
    {
        name: 'queue',
        description: 'Display the music queue',
        options: [
            { name: 'page', description: 'Page number', type: 4, required: false }
        ]
    },
    {
        name: 'shuffle',
        description: 'Shuffle the queue'
    },
    {
        name: 'loop',
        description: 'Toggle loop mode',
        options: [
            { name: 'mode', description: 'Loop mode', type: 3, required: false, choices: [
                { name: 'Off', value: 'off' },
                { name: 'Track', value: 'track' },
                { name: 'Queue', value: 'queue' }
            ]}
        ]
    },
    {
        name: 'volume',
        description: 'Set or check volume',
        options: [
            { name: 'level', description: 'Volume level (0-200)', type: 4, required: false, min_value: 0, max_value: 200 }
        ]
    },
    {
        name: 'seek',
        description: 'Seek to a position in the track',
        options: [
            { name: 'time', description: 'Time in seconds or MM:SS format', type: 3, required: true }
        ]
    },
    {
        name: 'clear',
        description: 'Clear the queue'
    },
    {
        name: 'remove',
        description: 'Remove a track from queue',
        options: [
            { name: 'position', description: 'Track position in queue', type: 4, required: true, min_value: 1 }
        ]
    },
    {
        name: 'replay',
        description: 'Replay the current track'
    },
    {
        name: 'autoplay',
        description: 'Toggle autoplay mode'
    },
    {
        name: 'search',
        description: 'Search for a song',
        options: [
            { name: 'query', description: 'Song to search for', type: 3, required: true },
            { name: 'platform', description: 'Search platform', type: 3, required: false, choices: [
                { name: 'YouTube', value: 'youtube' },
                { name: 'YouTube Music', value: 'ytmusic' },
                { name: 'Spotify', value: 'spotify' },
                { name: 'SoundCloud', value: 'soundcloud' }
            ]}
        ]
    },
    {
        name: 'lyrics',
        description: 'Get lyrics for current or specified song',
        options: [
            { name: 'song', description: 'Song name (optional, uses current track if not specified)', type: 3, required: false }
        ]
    },
    {
        name: 'previous',
        description: 'Play the previous track'
    },
    {
        name: 'spotify-login',
        description: 'Link your Spotify account',
        options: [
            { name: 'profile_url', description: 'Your Spotify profile URL', type: 3, required: true }
        ]
    },
    {
        name: 'spotify-profile',
        description: 'View your linked Spotify profile'
    },
    {
        name: 'spotify-myplaylist',
        description: 'View and play your linked Spotify public playlists'
    },
    {
        name: 'spotify-globalplaylist',
        description: 'Load a Spotify playlist and add all tracks to the queue',
        options: [
            { name: 'url', description: 'Spotify playlist URL or ID', type: 3, required: true }
        ]
    },
    {
        name: 'spotify-logout',
        description: 'Unlink your Spotify account'
    },
    {
        name: 'skipto',
        description: 'Skip to a specific track in queue',
        options: [
            { name: 'position', description: 'Track position', type: 4, required: true, min_value: 1 }
        ]
    },
    {
        name: 'move',
        description: 'Move a track to a different position',
        options: [
            { name: 'from', description: 'Current position', type: 4, required: true, min_value: 1 },
            { name: 'to', description: 'New position', type: 4, required: true, min_value: 1 }
        ]
    },
    {
        name: 'bassboost',
        description: 'Apply bass boost filter',
        options: [
            { name: 'level', description: 'Bass level (low/medium/high/extreme/off)', type: 3, required: false, choices: [
                { name: 'Low', value: 'low' },
                { name: 'Medium', value: 'medium' },
                { name: 'High', value: 'high' },
                { name: 'Extreme', value: 'extreme' },
                { name: 'Off', value: 'off' }
            ]}
        ]
    },
    {
        name: 'nightcore',
        description: 'Apply nightcore filter'
    },
    {
        name: 'vaporwave',
        description: 'Apply vaporwave filter'
    },
    {
        name: '8d',
        description: 'Apply 8D audio filter'
    },
    {
        name: 'karaoke',
        description: 'Apply karaoke filter'
    },
    {
        name: 'tremolo',
        description: 'Apply tremolo filter'
    },
    {
        name: 'vibrato',
        description: 'Apply vibrato filter'
    },
    {
        name: 'soft',
        description: 'Apply soft filter'
    },
    {
        name: 'pop',
        description: 'Apply pop filter'
    },
    {
        name: 'distortion',
        description: 'Apply distortion filter'
    },
    {
        name: 'electronic',
        description: 'Apply electronic filter'
    },
    {
        name: 'lofi',
        description: 'Apply lo-fi filter'
    },
    {
        name: 'party',
        description: 'Apply party filter'
    },
    {
        name: 'chipmunk',
        description: 'Apply chipmunk voice filter'
    },
    {
        name: 'darthvader',
        description: 'Apply Darth Vader voice filter'
    },
    {
        name: 'daycore',
        description: 'Apply daycore filter (slowed)'
    },
    {
        name: 'doubletime',
        description: 'Apply double time filter'
    },
    {
        name: 'lowpass',
        description: 'Apply low pass filter'
    },
    {
        name: 'resetfilters',
        description: 'Reset all audio filters'
    },
    {
        name: '247',
        description: 'Toggle 24/7 mode',
        options: [
            { name: 'mode', description: 'Enable or disable', type: 3, required: true, choices: [
                { name: 'On', value: 'on' },
                { name: 'Off', value: 'off' }
            ]}
        ]
    },
    {
        name: 'filters',
        description: 'View active filters'
    },
    {
        name: 'grab',
        description: 'Save the current track to your DMs'
    },
    {
        name: 'playnext',
        description: 'Add a song to play next in queue',
        options: [
            { name: 'query', description: 'Song name or URL', type: 3, required: true }
        ]
    },
    {
        name: 'playtop',
        description: 'Add a song to the top of queue',
        options: [
            { name: 'query', description: 'Song name or URL', type: 3, required: true }
        ]
    },
    {
        name: 'forward',
        description: 'Forward the track by 10 seconds',
        options: [
            { name: 'seconds', description: 'Seconds to forward (default: 10)', type: 4, required: false, min_value: 1 }
        ]
    },
    {
        name: 'rewind',
        description: 'Rewind the track by 10 seconds',
        options: [
            { name: 'seconds', description: 'Seconds to rewind (default: 10)', type: 4, required: false, min_value: 1 }
        ]
    },
    {
        name: 'speed',
        description: 'Change playback speed',
        options: [
            { name: 'rate', description: 'Speed rate (0.5-2.0)', type: 10, required: true, min_value: 0.5, max_value: 2.0 }
        ]
    },
    {
        name: 'pitch',
        description: 'Change pitch',
        options: [
            { name: 'level', description: 'Pitch level (0.5-2.0)', type: 10, required: true, min_value: 0.5, max_value: 2.0 }
        ]
    },
    {
        name: 'rate',
        description: 'Change playback rate',
        options: [
            { name: 'level', description: 'Rate level (0.5-2.0)', type: 10, required: true, min_value: 0.5, max_value: 2.0 }
        ]
    }
];

// Build slash commands
musicCommands.forEach(cmd => {
    const slashCommand = new SlashCommandBuilder()
        .setName(cmd.name)
        .setDescription(cmd.description)
        .setDMPermission(false);

    if (cmd.options) {
        cmd.options.forEach(opt => {
            if (opt.type === 3) { // String
                slashCommand.addStringOption(option => {
                    option.setName(opt.name)
                        .setDescription(opt.description)
                        .setRequired(opt.required || false);
                    if (opt.choices) {
                        option.addChoices(...opt.choices);
                    }
                    return option;
                });
            } else if (opt.type === 4) { // Integer
                slashCommand.addIntegerOption(option => {
                    option.setName(opt.name)
                        .setDescription(opt.description)
                        .setRequired(opt.required || false);
                    if (opt.min_value) option.setMinValue(opt.min_value);
                    if (opt.max_value) option.setMaxValue(opt.max_value);
                    return option;
                });
            } else if (opt.type === 6) { // User
                slashCommand.addUserOption(option =>
                    option.setName(opt.name)
                        .setDescription(opt.description)
                        .setRequired(opt.required || false)
                );
            } else if (opt.type === 10) { // Number
                slashCommand.addNumberOption(option => {
                    option.setName(opt.name)
                        .setDescription(opt.description)
                        .setRequired(opt.required || false);
                    if (opt.min_value) option.setMinValue(opt.min_value);
                    if (opt.max_value) option.setMaxValue(opt.max_value);
                    return option;
                });
            }
        });
    }

    commands.push(slashCommand.toJSON());
    slashCommands.set(cmd.name, cmd);
});

async function registerSlashCommands(clientId) {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
}

module.exports = {
    registerSlashCommands,
    slashCommands
};