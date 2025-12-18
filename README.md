# 🚀 DTEmpire AI Terminal 

**Advanced Multi-AI Interface System with Discord Integration**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.x-5865F2.svg)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A sophisticated AI terminal interface supporting multiple AI models with real-time chat, system monitoring, and Discord bot integration.
## 🌐 Live Site
[ai.ankitgupta.com.np](https://ai.ankitgupta.com.np/)
## ✨ Features

### 🖥️ Web Interface
- **Multi-AI Support**: DTEmpire AI, DeepSeek, GPT-5, Grok, PopCat, Claude, and more
- **Real-time Chat**: Interactive chat interface with typing indicators
- **System Monitoring**: Live API status, response times, and uptime tracking
- **API Testing**: Built-in API endpoint tester with copy functionality
- **Image Generation**: Integrated image generation API support
- **Hacker Terminal Theme**: Green-on-black matrix-style interface

### 🤖 Discord Bot
- **AI Chat Commands**: `?ai <message>` for manual AI interactions
- **Auto-Reply Channels**: Set channels for automatic AI responses
- **Admin Controls**: Easy channel management with permissions
- **Embed Responses**: Beautiful formatted embeds for AI responses
- **Multi-Server Support**: Scales across multiple Discord servers

### 🔧 Technical Features
- **Express.js Backend**: Robust API server with health monitoring
- **Multi-Model Support**: Integration with multiple AI providers
- **Real-time Updates**: Live system status and response tracking
- **Session Management**: Persistent channel settings
- **Error Handling**: Comprehensive error handling and logging

## 📋 Prerequisites

- **Node.js** 18+ and **npm**
- **Discord Bot Token** ([Get one here](https://discord.com/developers/applications))
- **Internet Connection** (for external API calls)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/dtempire-ai-terminal.git
cd dtempire-ai-terminal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy the example environment file and fill in your Discord token:
```bash
cp .example.env .env
```
Edit `.env` file:
```env
DISCORD_BOT_TOKEN=your_discord_bot_token_here
PORT=25586
```

### 4. Start the Application
```bash
# Start both web server and Discord bot
npm start

# Or start in development mode with auto-restart
npm run dev

# Start only the web server
node server.js

# Start only the Discord bot
node discord-bot.js
```

## 🌐 Web Interface

Access the web interface at: `http://localhost:25586`

### Key Features:
- **AI Selection**: Choose from 12+ AI models
- **Real-time Chat**: Interactive conversation with AI
- **System Status**: Monitor API health and performance
- **API Testing**: Test endpoints directly from the interface
- **Image Generation**: Create images using AI prompts

## 🤖 Discord Bot Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `?help` | Show all available commands | All users |
| `?ai <message>` | Chat with AI | All users |
| `?setchannel-ai` | Enable auto-AI replies in current channel | Admin only |
| `?removechannel-ai` | Disable auto-AI replies in current channel | Admin only |
| `?ai-channels` | List all auto-AI channels | Admin only |
| `?ai-help` | Show AI-specific help | All users |
| `?hello` | Greet the bot | All users |

### Auto-Reply Feature
- Once enabled with `?setchannel-ai`, the bot automatically replies to all messages
- No prefix or mention needed in auto-channels
- Commands still work (messages starting with `?`)
- Replies only to messages longer than 2 characters

## 📁 Project Structure

```
dtempire-ai-terminal/
├── public/                 # Web interface files
│   ├── index.html         # Main HTML interface
│   ├── style.css          # Terminal styling
│   ├── script.js          # Frontend JavaScript
│   └── image/             # Favicons and images
├── routes/                # API routes
│   └── api.js            # API endpoint handlers
├── services/             # Business logic
│   ├── ai-service.js     # AI integration service
│   └── discord-service.js # Discord utilities
├── discord-bot.js        # Discord bot main file
├── server.js            # Express web server
├── main.js              # Application entry point
├── package.json         # Dependencies and scripts
├── .env.example         # Environment template
└── requirements.txt     # Python requirements (legacy)
```

## 🔧 Configuration

### Environment Variables
```env
# Required
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Optional
PORT=25586                           # Web server port
NODE_ENV=production                  # Environment
LOG_LEVEL=info                       # Logging level
```

### Discord Bot Setup
1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Navigate to "Bot" section → "Add Bot"
4. Copy the bot token
5. Enable **Message Content Intent** in Privileged Gateway Intents
6. Invite bot to your server using OAuth2 URL generator

### AI Model Configuration
Default models are configured in `server.js`. You can modify:
- **DTEmpire AI**: Primary model endpoint
- **RaqKid API**: Secondary model provider
- **Image Generation**: Integration with image APIs

## 🚀 Deployment

### Heroku Deployment
```bash
# Create Heroku app
heroku create dtempire-ai-terminal

# Set environment variables
heroku config:set DISCORD_BOT_TOKEN=your_token_here

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "main.js"]
```

Build and run:
```bash
docker build -t dtempire-ai .
docker run -p 25586:25586 --env-file .env dtempire-ai
```

## 📊 API Endpoints

### Web API
- `GET /` - Web interface
- `GET /ai?prompt=<text>&model=<model>` - AI chat endpoint
- `GET /health` - Health check
- `GET /api/models` - List available models
- `POST /ai` - AI chat (JSON payload)

### External APIs Integrated
- **DTEmpire AI**: `http://158.69.214.8:9853/dtempire-ai`
- **RaqKid API**: `https://raqkidapiendpoint.vercel.app`
- **Image Generation**: `https://imggen-api.ankitgupta.com.np/api/ai-text`

## 🔒 Security Notes

1. **Keep tokens secure**: Never commit `.env` files
2. **Limit permissions**: Use appropriate Discord bot permissions
3. **API rate limiting**: Implement if using heavily
4. **Input validation**: Sanitize all user inputs
5. **Regular updates**: Keep dependencies updated

## 🐛 Troubleshooting

### Common Issues

**Discord bot not starting:**
```bash
# Check token format
echo $DISCORD_BOT_TOKEN

# Verify token is in .env file
cat .env | grep DISCORD

# Check Discord Developer Portal for correct token
```

**Web interface not loading:**
```bash
# Check if server is running
curl http://localhost:25586/health

# Check port conflicts
netstat -an | grep 25586

# Check logs
tail -f discord-bot.js.log
```

**AI not responding:**
```bash
# Check external API connectivity
curl "http://158.69.214.8:9853/dtempire-ai?prompt=test"

# Check model availability
curl http://localhost:25586/api/models

# Check logs for specific errors
grep -i "error\|failed\|timeout" server.log
```

### Logs Location
- Application logs: Console output
- Error logs: `error.log` (if configured)
- Discord logs: Console and Discord Developer Portal

## 📈 Monitoring

### Built-in Monitoring
- Web interface shows real-time API status
- Response time tracking
- Uptime monitoring
- Active channel count (Discord)

### External Monitoring (Optional)
- **Uptime Robot**: HTTP monitoring
- **LogDNA**: Log aggregation
- **Datadog**: Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Setup
```bash
# Clone and install
git clone https://github.com/yourusername/dtempire-ai-terminal.git
cd dtempire-ai-terminal
npm install

# Start development server
npm run dev

# Run tests (when implemented)
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **DTEmpire Team**: For the AI infrastructure
- **Discord.js**: For the excellent Discord API library
- **Express.js**: For the web framework
- **All AI Providers**: For their amazing models

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/yourusername/dtempire-ai-terminal/issues)
- **Discord**: Join our support server (link in bot status)
- **Email**: contact@dtempire.com

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=hyperdargo/DTEmpire-AI-Web-and-Discord-Bot&type=Date)](https://star-history.com/#hyperdaro/DTEmpire-AI-Web-and-Discord-Bot&Date)

---

**Made with ❤️ by the DTEmpire Team**

*Empowering the future of AI interfaces*
