
const { EmbedBuilder, WebhookClient } = require('discord.js');
const config = require('../../config.json');

class WebhookLogger {
    constructor() {
        this.webhooks = {
            commandLog: config.webhooks.commandLog ? new WebhookClient({ url: config.webhooks.commandLog }) : null,
            premiumLog: config.webhooks.premiumLog ? new WebhookClient({ url: config.webhooks.premiumLog }) : null,
            blacklistLog: config.webhooks.blacklistLog ? new WebhookClient({ url: config.webhooks.blacklistLog }) : null,
            noPrefixLog: config.webhooks.noPrefixLog ? new WebhookClient({ url: config.webhooks.noPrefixLog }) : null,
        };
    }

    async logCommand(data) {
        if (!this.webhooks.commandLog) return;

        const embed = new EmbedBuilder()
            .setTitle('📝 Command Executed')
            .setColor('#3498db')
            .addFields(
                { name: '👤 User', value: `${data.username} (\`${data.userId}\`)`, inline: true },
                { name: '🏠 Server', value: `${data.guildName} (\`${data.guildId}\`)`, inline: true },
                { name: '📺 Channel', value: `${data.channelName} (\`${data.channelId}\`)`, inline: true },
                { name: '⚙️ Command', value: `\`${data.command} ${data.args.join(' ')}\``, inline: false }
            )
            .setTimestamp();

        try {
            await this.webhooks.commandLog.send({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send command log webhook:', error.message);
        }
    }

    async logPremium(data) {
        if (!this.webhooks.premiumLog) return;

        const embed = new EmbedBuilder()
            .setTitle(`✨ Premium ${data.action}`)
            .setColor(data.action === 'Activated' ? '#2ecc71' : data.action === 'Expired' ? '#e74c3c' : '#f39c12')
            .addFields(
                { name: '👤 User', value: `${data.username} (\`${data.userId}\`)`, inline: true },
                { name: '🎯 Target', value: data.target, inline: true },
                { name: '⏰ Duration', value: data.duration || 'N/A', inline: true }
            )
            .setTimestamp();

        if (data.expiresAt) {
            embed.addFields({ name: '📅 Expires At', value: new Date(data.expiresAt).toLocaleString(), inline: false });
        }

        try {
            await this.webhooks.premiumLog.send({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send premium log webhook:', error.message);
        }
    }

    async logBlacklist(data) {
        if (!this.webhooks.blacklistLog) return;

        const embed = new EmbedBuilder()
            .setTitle(`🚫 User ${data.action}`)
            .setColor(data.action === 'Blacklisted' ? '#e74c3c' : '#2ecc71')
            .addFields(
                { name: '👤 Target User', value: `${data.targetUsername} (\`${data.targetUserId}\`)`, inline: true },
                { name: '👮 By', value: `${data.byUsername} (\`${data.byUserId}\`)`, inline: true },
                { name: '📝 Reason', value: data.reason || 'No reason provided', inline: false }
            )
            .setTimestamp();

        try {
            await this.webhooks.blacklistLog.send({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send blacklist log webhook:', error.message);
        }
    }

    async logNoPrefix(data) {
        if (!this.webhooks.noPrefixLog) return;

        const embed = new EmbedBuilder()
            .setTitle(`🔓 No-Prefix ${data.action}`)
            .setColor(data.action === 'Granted' ? '#2ecc71' : '#e74c3c')
            .addFields(
                { name: '👤 Target User', value: `${data.targetUsername} (\`${data.targetUserId}\`)`, inline: true },
                { name: '👮 By', value: `${data.byUsername} (\`${data.byUserId}\`)`, inline: true }
            )
            .setTimestamp();

        try {
            await this.webhooks.noPrefixLog.send({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send no-prefix log webhook:', error.message);
        }
    }
}

module.exports = new WebhookLogger();
