const { EmbedBuilder } = require('discord.js');

function formatDuration(ms) {
    if (!ms || ms === 0) return '00:00';
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function createProgressBar(current, total, length = 20) {
    const progress = Math.floor((current / total) * length);
    let bar = '';
    for (let i = 0; i < length; i++) {
        bar += i === progress ? '🔘' : '▬';
    }
    return bar;
}

function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

function createMusicEmbed(title, description) {
    const embed = new EmbedBuilder()
        .setColor(0xFF00FF)
        .setTitle(`🎵 ${title}`)
        .setTimestamp();
    if (description) embed.setDescription(description);
    return embed;
}

module.exports = {
    formatDuration,
    createProgressBar,
    createSuccessEmbed,
    createErrorEmbed,
    createMusicEmbed
};
