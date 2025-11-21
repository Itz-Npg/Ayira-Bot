const { Collection } = require('discord.js');

const cooldowns = new Collection();

const defaultCooldowns = {
    music: 3000,
    filters: 2000,
    owner: 0,
    playlist: 5000,
    settings: 5000,
    utility: 3000
};

function getCooldown(command) {
    if (command.cooldown) return command.cooldown;
    return defaultCooldowns[command.category?.toLowerCase()] || 3000;
}

function checkCooldown(userId, commandName, command, isOwner = false) {
    if (isOwner) return { onCooldown: false };

    if (!cooldowns.has(commandName)) {
        cooldowns.set(commandName, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(commandName);
    const cooldownAmount = getCooldown(command);

    if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
            return {
                onCooldown: true,
                timeLeft: timeLeft
            };
        }
    }

    timestamps.set(userId, now);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);

    return { onCooldown: false };
}

module.exports = { checkCooldown };
