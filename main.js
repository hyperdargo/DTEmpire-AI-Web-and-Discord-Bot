require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting DTempire AI System...');
console.log('================================');

// Check required environment variables
if (!process.env.DISCORD_BOT_TOKEN) {
    console.log('⚠️  Warning: DISCORD_BOT_TOKEN not set in .env');
    console.log('   Discord bot will not start');
    console.log('   Website will still work');
}

// Create logs directory
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Function to start a process with logging
function startProcess(name, script, logFile) {
    console.log(`▶️  Starting ${name}...`);
    
    const child = spawn('node', [script], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env
    });
    
    // Log stdout to file and console
    const logStream = fs.createWriteStream(`logs/${logFile}`, { flags: 'a' });
    
    child.stdout.on('data', (data) => {
        const message = `[${name}] ${data.toString().trim()}`;
        logStream.write(message + '\n');
        console.log(message);
    });
    
    child.stderr.on('data', (data) => {
        const message = `[${name} ERROR] ${data.toString().trim()}`;
        logStream.write(message + '\n');
        console.error(message);
    });
    
    child.on('close', (code) => {
        const message = `[${name}] Process exited with code ${code}`;
        logStream.write(message + '\n');
        console.log(message);
        
        // Auto-restart after 5 seconds if not intentional shutdown
        if (!global.isShuttingDown) {
            console.log(`[${name}] Restarting in 5 seconds...`);
            setTimeout(() => startProcess(name, script, logFile), 5000);
        }
    });
    
    return child;
}

// Start website server
const webServer = startProcess('Web Server', 'server.js', 'web-server.log');

// Start Discord bot if token is set
let discordBot = null;
if (process.env.DISCORD_BOT_TOKEN) {
    discordBot = startProcess('Discord Bot', 'discord-bot.js', 'discord-bot.log');
} else {
    console.log('⏸️  Discord Bot: Skipped (no token)');
}

// Graceful shutdown handler
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
    console.log('\n🛑 Shutting down DTempire AI System...');
    global.isShuttingDown = true;
    
    if (discordBot) {
        discordBot.kill('SIGTERM');
        console.log('✅ Discord Bot stopped');
    }
    
    webServer.kill('SIGTERM');
    console.log('✅ Web Server stopped');
    
    setTimeout(() => {
        console.log('👋 Goodbye!');
        process.exit(0);
    }, 2000);
}

// Monitor memory usage
setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    console.log(`📊 Memory: ${memoryMB}MB / ${totalMB}MB`);
}, 60000); // Every minute

console.log('================================');
console.log('✅ DTempire AI System Started');
console.log('📁 Logs saved in: logs/ directory');
console.log('🛑 Press Ctrl+C to stop');
console.log('================================');