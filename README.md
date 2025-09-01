## create-bmd

Quickly scaffold a Bot Maker for Discord (BMD) mod from the command line.

### What it does

- Prompts for mod details (name, description, author, donation link)
- Supports mod types: Action, Event, Automation, Theme, Translation
- Generates files into your BMD installation directory using built-in templates
- Remembers your author and donation defaults across runs

### Prerequisites

- Node.js 18+ (ESM-only dependencies)
- Bot Maker for Discord installed (Steam)

### Install and use

You can run directly with npx:

```bash
npx create-bmd@latest
```

Follow the prompts:

- Mod name and type
- Description, author, donation link
- For Action mods, you’ll also choose a Category (default: Message)

### Finding your BMD install

create-bmd auto-detects common Steam install paths on Windows:

- `C:\Program Files (x86)\Steam\steamapps\common\Bot Maker For Discord`
- `C:\Program Files\Steam\steamapps\common\Bot Maker For Discord`

If BMD isn’t found, the CLI will show an error. You can set the path manually in the config file:

Config file location by OS:

- Windows: `%APPDATA%\create-bmd\config.json`
- macOS: `~/Library/Application Support/create-bmd/config.json`
- Linux: `~/.config/create-bmd/config.json`

Example config.json:

```json
{
	"bmdPath": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Bot Maker For Discord",
	"author": "Your Name",
	"donation": "https://your.donate/link"
}
```

Notes:

- author and donation are saved automatically after a successful run and reused as defaults.

### Templates

Built-in templates live in `bin/templates/` and are applied with simple placeholder substitution.

### Troubleshooting

- “Bot Maker for Discord installation not found” → Ensure BMD is installed via Steam or set `bmdPath` in the config file above.
- Permission errors writing files → Run your shell as Administrator or ensure you have write access to the BMD folder.

### License

MIT

