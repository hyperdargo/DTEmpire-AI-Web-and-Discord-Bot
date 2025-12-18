require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = '?';

// Store AI channels in memory (in production, use a database)
let aiChannels = new Set();

// Load saved channels from file
function loadChannels() {
    try {
        if (fs.existsSync('ai-channels.json')) {
            const data = fs.readFileSync('ai-channels.json', 'utf8');
            const saved = JSON.parse(data);
            aiChannels = new Set(saved);
            console.log(`📁 Loaded ${aiChannels.size} AI channels from file`);
        }
    } catch (error) {
        console.error('Error loading channels:', error);
    }
}

// Save channels to file
function saveChannels() {
    try {
        const data = JSON.stringify(Array.from(aiChannels));
        fs.writeFileSync('ai-channels.json', data);
        console.log(`💾 Saved ${aiChannels.size} AI channels to file`);
    } catch (error) {
        console.error('Error saving channels:', error);
    }
}

// Bot ready event
client.on('ready', () => {
    console.log(`✅ Discord Bot logged in as ${client.user.tag}`);
    console.log(`🤖 Serving ${client.guilds.cache.size} servers`);
    console.log(`🔧 Prefix: ${PREFIX}`);
    console.log(`📊 AI Channels: ${aiChannels.size}`);
    
    // Load saved channels
    loadChannels();
    
    // Set bot status
    client.user.setActivity(`${PREFIX}ai help`, { type: 'LISTENING' });
});

// Helper function to call your AI
async function getAIResponse(prompt) {
    try {
        const response = await axios.get(
            `http://158.69.214.8:9853/dtempire-ai?prompt=${encodeURIComponent(prompt)}`,
            { timeout: 15000 }
        );
        
        // Extract text from response
        let aiResponse = response.data;
        if (aiResponse && typeof aiResponse === 'object') {
            if (aiResponse.result && Array.isArray(aiResponse.result) && aiResponse.result[0]) {
                aiResponse = aiResponse.result[0].response;
            } else if (aiResponse.response) {
                aiResponse = aiResponse.response;
            }
        }
        
        return {
            success: true,
            response: aiResponse || "No response received"
        };
    } catch (error) {
        console.error('AI Error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Message handler
client.on('messageCreate', async (message) => {
    // Ignore bot messages and DMs
    if (message.author.bot || !message.guild) return;
    
    const channelId = message.channel.id;
    
    // Check if this is an AI channel and auto-reply
    if (aiChannels.has(channelId)) {
        // Don't auto-reply to bot commands (starts with prefix)
        if (message.content.startsWith(PREFIX)) return;
        
        // Don't auto-reply to very short messages (like "ok", "lol", etc.)
        if (message.content.trim().length < 3) return;
        
        try {
            // Show typing indicator
            message.channel.sendTyping();
            
            // Get AI response
            const result = await getAIResponse(message.content);
            
            if (!result.success) {
                return; // Don't reply if error in auto-mode
            }
            
            // Auto-reply with simple response (no embed in auto-mode)
            await message.reply(result.response);
            
        } catch (error) {
            console.error('Auto-reply Error:', error);
            // Don't send error message in auto-mode
        }
        
        return; // Don't process further commands in AI channels
    }
    
    // Handle ?help command
    if (message.content === `${PREFIX}help`) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🤖 DTempire AI Bot Help')
            .setDescription('Here are all available commands:')
            .addFields(
                {
                    name: `${PREFIX}ai <message>`,
                    value: 'Chat with AI',
                    inline: true
                },
                {
                    name: `${PREFIX}setchannel-ai`,
                    value: 'Enable auto-AI replies in this channel (Admin only)',
                    inline: true
                },
                {
                    name: `${PREFIX}removechannel-ai`,
                    value: 'Disable auto-AI replies in this channel (Admin only)',
                    inline: true
                },
                {
                    name: `${PREFIX}ai-channels`,
                    value: 'List auto-AI channels (Admin only)',
                    inline: true
                },
                {
                    name: `${PREFIX}ai-help`,
                    value: 'Show this help message',
                    inline: true
                },
                {
                    name: `${PREFIX}help`,
                    value: 'Show this help message',
                    inline: true
                }
            )
            .setFooter({ text: 'DTempire AI Bot | Prefix: ?' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
    
    // Handle ?ai command
    if (message.content.startsWith(`${PREFIX}ai `)) {
        const prompt = message.content.slice(`${PREFIX}ai `.length).trim();
        
        if (!prompt) {
            return message.reply(`Please provide a prompt. Usage: \`${PREFIX}ai <your message>\``);
        }
        
        try {
            // Show typing indicator
            message.channel.sendTyping();
            
            // Get AI response
            const result = await getAIResponse(prompt);
            
            if (!result.success) {
                return message.reply(`❌ Error: ${result.error}`);
            }
            
            // Create embed for better formatting
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🤖 DTempire AI Response')
                .addFields(
                    { name: '📝 Your Prompt', value: prompt.length > 256 ? prompt.substring(0, 253) + '...' : prompt },
                    { name: '💬 Response', value: result.response.length > 1024 ? result.response.substring(0, 1021) + '...' : result.response }
                )
                .setFooter({ text: 'Powered by DTempire AI' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('AI Command Error:', error);
            return message.reply('❌ An error occurred while processing your request.');
        }
    }
    
    // Handle ?setchannel-ai command
    if (message.content === `${PREFIX}setchannel-ai`) {
        // Check if user has admin permissions
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You need administrator permissions to use this command.');
        }
        
        const channelId = message.channel.id;
        
        if (aiChannels.has(channelId)) {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('⚠️ Channel Already Set')
                .setDescription(`This channel (#${message.channel.name}) is already an AI channel.`)
                .addFields(
                    { name: 'Current Status', value: '✅ Auto-replies are ENABLED' },
                    { name: 'To disable', value: `Use \`${PREFIX}removechannel-ai\`` }
                )
                .setFooter({ text: 'DTempire AI Bot' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Add channel to AI channels
        aiChannels.add(channelId);
        saveChannels();
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ AI Channel Enabled')
            .setDescription(`Auto-AI replies have been ENABLED in #${message.channel.name}`)
            .addFields(
                { name: 'How it works', value: 'I will now automatically reply to ALL messages in this channel (except commands)' },
                { name: 'Commands still work', value: `• \`${PREFIX}ai <message>\` - Manual AI chat\n• \`${PREFIX}removechannel-ai\` - Disable auto-replies` },
                { name: 'Auto-reply rules', value: '• Replies to messages > 2 characters\n• Ignores commands starting with ?\n• No typing indicator for very short messages' }
            )
            .setFooter({ text: 'DTempire AI Bot | Type any message to test!' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
    
    // Handle ?removechannel-ai command
    if (message.content === `${PREFIX}removechannel-ai`) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You need administrator permissions to use this command.');
        }
        
        const channelId = message.channel.id;
        
        if (!aiChannels.has(channelId)) {
            return message.reply(`❌ This channel (#${message.channel.name}) is not an AI channel. Use \`${PREFIX}setchannel-ai\` to enable it.`);
        }
        
        // Remove channel from AI channels
        aiChannels.delete(channelId);
        saveChannels();
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ AI Channel Disabled')
            .setDescription(`Auto-AI replies have been DISABLED in #${message.channel.name}`)
            .addFields(
                { name: 'Manual AI still works', value: `Use \`${PREFIX}ai <message>\` to chat with me` },
                { name: 'To re-enable', value: `Use \`${PREFIX}setchannel-ai\`` }
            )
            .setFooter({ text: 'DTempire AI Bot' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
    
    // Handle ?ai-channels command
    if (message.content === `${PREFIX}ai-channels`) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You need administrator permissions to use this command.');
        }
        
        if (aiChannels.size === 0) {
            return message.reply('No channels have auto-AI replies enabled. Use `?setchannel-ai` to add one.');
        }
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🤖 Auto-AI Channels')
            .setDescription(`Total: ${aiChannels.size} channel(s) with auto-replies enabled`)
            .setFooter({ text: 'DTempire AI Bot' })
            .setTimestamp();
        
        // Add each channel as a field
        const fields = [];
        for (const channelId of aiChannels) {
            try {
                const channel = await message.guild.channels.fetch(channelId);
                if (channel) {
                    fields.push({
                        name: `#${channel.name}`,
                        value: `ID: ${channelId}`,
                        inline: true
                    });
                } else {
                    // Channel might not exist anymore
                    aiChannels.delete(channelId);
                }
            } catch (error) {
                // Channel might not exist
                aiChannels.delete(channelId);
            }
        }
        
        if (fields.length === 0) {
            embed.setDescription('No active auto-AI channels found.');
        } else {
            embed.addFields(...fields);
        }
        
        saveChannels(); // Save after cleaning up
        return message.reply({ embeds: [embed] });
    }
    
    // Handle ?ai-help command (same as ?help)
    if (message.content === `${PREFIX}ai-help`) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🤖 DTempire AI Bot Help')
            .addFields(
                { name: `${PREFIX}ai <message>`, value: 'Chat with AI' },
                { name: `${PREFIX}setchannel-ai`, value: 'Enable auto-replies in this channel (Admin)' },
                { name: `${PREFIX}removechannel-ai`, value: 'Disable auto-replies in this channel (Admin)' },
                { name: `${PREFIX}ai-channels`, value: 'List auto-reply channels (Admin)' },
                { name: `${PREFIX}ai-help`, value: 'Show this help message' }
            )
            .setFooter({ text: 'DTempire AI Bot | Prefix: ?' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
    
    // Handle ?hello command
    if (message.content === `${PREFIX}hello`) {
        return message.reply(`Hello ${message.author.username}! I'm DTempire AI Bot. Use \`${PREFIX}help\` to see available commands.`);
    }
    
    // Handle bot mentions (optional) - only in non-AI channels
    if (message.mentions.has(client.user) && !message.mentions.everyone) {
        const content = message.content.replace(`<@${client.user.id}>`, '').trim();
        
        if (!content) {
            return message.reply(`Hello! I'm DTempire AI Bot. Use \`${PREFIX}ai <message>\` to chat with me!`);
        }
        
        try {
            message.channel.sendTyping();
            
            const result = await getAIResponse(content);
            
            if (result.success) {
                // Split long messages
                if (result.response.length > 2000) {
                    const chunks = result.response.match(/.{1,2000}/g);
                    for (let i = 0; i < chunks.length; i++) {
                        if (i === 0) {
                            await message.reply(chunks[i]);
                        } else {
                            await message.channel.send(chunks[i]);
                        }
                    }
                } else {
                    await message.reply(result.response);
                }
            } else {
                await message.reply(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            await message.reply('❌ Sorry, I encountered an error.');
        }
    }
});

// Error handling
client.on('error', console.error);
process.on('unhandledRejection', console.error);

// Login to Discord
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_TOKEN) {
    console.error('❌ ERROR: DISCORD_BOT_TOKEN is not set in .env file');
    console.log('To get a Discord bot token:');
    console.log('1. Go to https://discord.com/developers/applications');
    console.log('2. Create a new application');
    console.log('3. Go to Bot section → Add Bot');
    console.log('4. Copy the token and add to .env file:');
    console.log('   DISCORD_BOT_TOKEN=your_token_here');
    console.log('5. Enable "MESSAGE CONTENT INTENT" in Bot settings');
    process.exit(1);
}

client.login(DISCORD_TOKEN)
    .then(() => {
        console.log('🚀 Discord bot started successfully!');
        console.log('📋 Available commands:');
        console.log(`   ${PREFIX}help / ${PREFIX}ai-help - Show help`);
        console.log(`   ${PREFIX}ai <message> - Manual AI chat`);
        console.log(`   ${PREFIX}setchannel-ai - Enable auto-replies in channel (Admin)`);
        console.log(`   ${PREFIX}removechannel-ai - Disable auto-replies in channel (Admin)`);
        console.log(`   ${PREFIX}ai-channels - List auto-reply channels (Admin)`);
        console.log(`   ${PREFIX}hello - Say hello`);
        console.log('\n🔧 Auto-reply feature:');
        console.log('   • Once enabled with ?setchannel-ai, bot replies to ALL messages');
        console.log('   • No prefix or mention needed in auto-channels');
        console.log('   • Commands still work in auto-channels (starts with ?)');
    })
    .catch(error => {
        console.error('❌ Failed to login to Discord:', error);
        process.exit(1);
    });