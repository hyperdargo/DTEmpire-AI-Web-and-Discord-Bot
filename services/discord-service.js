const { WebhookClient } = require('discord.js');

class DiscordService {
    constructor() {
        this.webhookClient = process.env.DISCORD_WEBHOOK_URL 
            ? new WebhookClient({ url: process.env.DISCORD_WEBHOOK_URL })
            : null;
    }

    // Send notification to Discord
    async sendNotification(message, embed = null) {
        if (!this.webhookClient) {
            console.log('Discord webhook not configured');
            return;
        }

        try {
            const payload = { content: message };
            if (embed) {
                payload.embeds = [embed];
            }
            
            await this.webhookClient.send(payload);
            return true;
        } catch (error) {
            console.error('Discord notification error:', error);
            return false;
        }
    }

    // Send stats to Discord
    async sendStats(stats) {
        const embed = {
            color: 0x0099ff,
            title: '📊 DTempire AI Statistics',
            fields: [
                { name: 'Total Requests', value: stats.totalRequests.toString(), inline: true },
                { name: 'Successful', value: stats.successful.toString(), inline: true },
                { name: 'Failed', value: stats.failed.toString(), inline: true },
                { name: 'Active Users', value: stats.activeUsers.toString(), inline: true },
                { name: 'Uptime', value: stats.uptime, inline: true }
            ],
            timestamp: new Date().toISOString()
        };

        return this.sendNotification(null, embed);
    }
}

module.exports = new DiscordService();