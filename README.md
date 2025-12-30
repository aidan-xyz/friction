# Friction

A browser extension that adds intentional friction to break mindless browsing habits.

## How It Works

Friction doesn't block sites - it makes you conscious of your choices through escalating pattern interrupts. Each time you visit a blocked site in a day, the friction increases:

1. **Visit 1**: 10-second loading screen
2. **Visit 2**: 20-second loading screen  
3. **Visit 3**: Type a short philosophical quote
4. **Visit 4**: Type a longer philosophical quote
5. **Visit 5**: Solve a basic visual puzzle
6. **Visit 6**: Solve a harder visual puzzle
7. **Visit 7**: Site locked for 5 minutes
8. **Visit 8**: Site locked for 10 minutes
9. **Visit 9+**: Exponentially increasing lockout times

All friction resets at midnight each day.

Every interrupt screen shows you the total time you've spent on blocked sites today.

## Installation

### Chrome/Edge/Brave

1. Download or clone this repository
2. Open your browser and navigate to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `friction-extension` folder
6. The extension is now installed!

### Firefox

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file from the extension folder
4. Note: In Firefox, the extension will be removed when you close the browser (temporary installation)

For permanent Firefox installation, you'll need to sign the extension through Mozilla.

## Usage

1. Click the Friction icon in your browser toolbar
2. Add sites you want to add friction to (e.g., `twitter.com`, `youtube.com`, `reddit.com`)
3. The extension will now intercept visits to these sites with pattern interrupts
4. View your stats in the popup to see time reclaimed

## Features

- **Escalating friction**: Gets progressively harder each visit
- **Time tracking**: See total time spent on blocked sites
- **Clean interface**: Minimal black and white design
- **No hard blocks**: You can always access sites - you just have to be intentional
- **Daily reset**: Fresh start every day

## Philosophy

Most productivity tools either block sites entirely (which you'll just disable when you really want them) or rely on willpower (which is finite). 

Friction takes a different approach: it doesn't stop you, it makes you **conscious**. Each interrupt is a moment to ask yourself "do I actually want this, or am I on autopilot?"

The friction makes the dopamine hit cost something. Your brain does the math: "is this worth 30 seconds of effort?" Often the answer is no, and you close the tab. When the answer is yes, at least it was intentional.

## Privacy

Friction:
- Stores all data locally in your browser
- Does not send any data to external servers
- Does not track your browsing outside of blocked sites
- Is completely free and open source

## License

MIT License - feel free to modify and distribute.

## Contributing

This extension is released free to help people escape exploitative systems. If you want to improve it, submit a PR!

## Roadmap

Potential future features:
- Custom quotes
- Customizable friction levels per site
- Productivity mode (blocks sites entirely during work hours)
- Weekly/monthly stats
- Export data
- Sync settings across devices

Built with the intention of helping people reclaim their attention and build better relationships with technology.
