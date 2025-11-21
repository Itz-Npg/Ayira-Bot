# 🎵 Ayira Discord Music Bot

An advanced, high-quality Discord music bot powered by **Aliana Client** and **Lavalink v4**. Supports YouTube, Spotify, SoundCloud, Apple Music, and more!

## ✨ Features

- 🔊 **Ultra-High-Quality Audio** - Powered by Lavalink v4
- 🎵 **Multi-Platform Support** - YouTube, Spotify, SoundCloud, Apple Music
- 🎛️ **Advanced Audio Filters** - Bass boost, Nightcore, Vaporwave, 8D Audio
- 📝 **Queue Management** - Add, remove, shuffle, loop tracks
- 🎨 **Music Cards** - Beautiful visualization cards (musicard integration)
- ⚡ **10x Faster Loading** - Intelligent track caching
- 🎭 **Autoplay Feature** - Automatic related track playback
- 📊 **Interactive Help Menu** - Easy to navigate command system

## 📦 Installation

### Prerequisites
- Node.js v18 or higher
- A Discord Bot Token
- Lavalink v4 Server

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment Variables
Copy `.env.example` to `.env` and fill in your details:
```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_bot_client_id
PREFIX=!

# Lavalink Configuration
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
```

### Step 3: Setup Lavalink Server

#### Option 1: Download Lavalink JAR
1. Download Lavalink v4 from: https://github.com/lavalink-devs/Lavalink/releases
2. Create `application.yml` with this configuration:

```yaml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  server:
    password: "youshallnotpass"
    sources:
      youtube: true
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      http: true
      local: false
    bufferDurationMs: 400
    youtubePlaylistLoadLimit: 100
    gc-warnings: true
```

3. Run Lavalink:
```bash
java -jar Lavalink.jar
```

#### Option 2: Use Public Lavalink (Not Recommended for Production)
Update your `.env` with a public Lavalink server.

### Step 4: Run the Bot
```bash
npm start
```

## 🎮 Commands

### Music Commands
- `!play <song>` - Play a song from any platform
- `!pause` - Pause the current track
- `!resume` - Resume playback
- `!skip` - Skip the current track
- `!stop` - Stop playback and leave voice channel
- `!queue` - Display the queue
- `!nowplaying` - Show current track info
- `!volume [0-200]` - Set or check volume
- `!loop [track|queue|off]` - Set loop mode
- `!shuffle` - Shuffle the queue
- `!clear` - Clear the queue
- `!remove <number>` - Remove a track from queue
- `!autoplay` - Toggle autoplay mode

### Filter Commands
- `!bassboost [0-1]` - Apply bass boost
- `!nightcore` - Apply nightcore filter
- `!vaporwave` - Apply vaporwave filter
- `!8d` - Apply 8D audio effect
- `!reset` - Remove all filters

### Utility Commands
- `!help` - Show interactive help menu
- `!ping` - Check bot latency

## 🔧 Configuration

Edit `src/index.js` to modify:
- Volume decimenter (line 29)
- Default search platform (line 28)
- Auto-skip behavior (line 21)
- Queue size limits (line 37)

## 📁 Project Structure

```
src/
├── commands/
│   ├── music/          # Music playback commands
│   ├── filters/        # Audio filter commands
│   └── utility/        # Utility commands
├── events/             # Lavalink event handlers
├── utils/              # Helper functions and embeds
└── index.js            # Main bot file
```

## 🎨 Ultra-Quality Sound Settings

The bot is pre-configured with optimal settings:
- `volumeDecrementer: 1.0` - Maximum volume quality
- `clientBasedPositionUpdateInterval: 50` - Precise playback tracking
- `bufferDurationMs: 400` - Minimal latency
- Automatic volume normalization
- Smart track caching for fast loading

## 🚀 Features in Detail

### Autoplay
When the queue ends, the bot automatically finds and plays related tracks. Toggle with `!autoplay`.

### Loop Modes
- **Track Loop** (`!loop track`) - Repeat current song
- **Queue Loop** (`!loop queue`) - Repeat entire queue
- **Off** (`!loop off`) - Disable looping

### Multi-Platform Support
- YouTube (direct URLs, search, playlists)
- Spotify (tracks, albums, playlists)
- SoundCloud
- Apple Music
- Direct HTTP streams

## 📝 License

MIT License - Feel free to use and modify!

## 🆘 Support

If you encounter issues:
1. Make sure Lavalink server is running
2. Check your `.env` configuration
3. Verify bot has proper Discord permissions (Connect, Speak, Send Messages)
4. Check console logs for errors

## 🌟 Credits

- Built with [Aliana Client](https://itz-npg.github.io/aliana-client/)
- Powered by [Lavalink v4](https://github.com/lavalink-devs/Lavalink)
- Uses [discord.js](https://discord.js.org/)
- Made by [Npg](https://github.com/Itz-Npg)
- Youtube [Here](https://youtube.com/@itznpg)