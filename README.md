# Classic WoW Raid Healing Simulator 
(NOW INCLUDES OTHER HEALERS NOT JUST PALADINS)

A browser-based Classic WoW (Vanilla) Holy Paladin raid healing simulator. Experience the nostalgia of healing Molten Core and Onyxia's Lair with authentic spell mechanics, boss abilities, and raid management systems.

![Game Screenshot](screenshots/screenshot.png)

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)

# CLICK THIS LINK TO PLAY WITHOUT DOWNLOADING!
https://taubut.github.io/holy-paladin-raid-healing-simulator/

## Features

### Authentic Holy Paladin Gameplay
- **9 Spells on your action bar** - Holy Light (Rank 9 & 6), Flash of Light (Rank 6 & 4), Holy Shock, Lay on Hands, Divine Favor, Cleanse, and Blessing of Light
- **Downranking support** - Mana-efficient healing with lower rank spells, just like in Vanilla
- **Spell power coefficients** - Accurate spell scaling based on Classic WoW formulas
- **Divine Favor + Holy Light combos** - Guaranteed crit for emergency tank saves
- **Dispelling** - Cleanse magic, poison, and disease debuffs from raid members

### Raid Content
- **Molten Core** - All 10 bosses with authentic abilities
  - Lucifron, Magmadar, Gehennas, Garr, Shazzrah, Baron Geddon, Sulfuron Harbinger, Golemagg, Majordomo Executus, and Ragnaros
- **Onyxia's Lair** - 3-phase dragon encounter
  - Ground phase with Cleave, Tail Sweep, and Flame Breath
  - Air phase with Deep Breath, Fireballs, and Whelp swarms
  - Chaos phase with Bellowing Roar fear and Lava Eruptions
- **Training Dummy** - Practice your healing rotation without pressure

### Boss Mechanics
- Tank damage, raid-wide AoE, and random target abilities
- Dispellable debuffs (Magic, Poison, Disease, Curse indicators)
- Phase transitions (Onyxia)
- Enrage timers
- Encounter Journal with boss abilities and healer tips

### Raid Management
- **20-man or 40-man raids** - Adjustable raid size
- **8 WoW classes** represented with authentic class colors
- **Role system** - Tanks, Healers, and DPS with appropriate health pools
- **Other healers toggle** - Enable/disable AI healing from other raid healers
- **Raid buff system** - Paladin Blessings, class buffs (Arcane Intellect, Mark of the Wild, etc.)

### Progression Systems
- **DKP (Dragon Kill Points)** - Earn points for boss kills, spend on loot
- **Loot drops** - Epic gear with stats (Intellect, Spell Power, Healing Power, MP5, Crit)
- **Equipment system** - 9 gear slots per character
- **Gear Score** - Track your raid's power level
- **Bad Luck Protection** - Guaranteed Paladin loot after consecutive unlucky drops

### Legendary Crafting
- **Sulfuras, Hand of Ragnaros** - Collect Eye of Sulfuras from Ragnaros
- **Thunderfury, Blessed Blade of the Windseeker** - Collect both Bindings from Garr and Baron Geddon

### Consumables & World Buffs
- **Consumables** - Mana potions, Flask of Distilled Wisdom, Mageblood Elixir, and more
- **World Buffs** - Rallying Cry of the Dragonslayer (unlocked by defeating Onyxia)

### Quality of Life
- **Save/Load system** - Multiple save slots with import/export to file
- **Admin Panel** - Manage loot, DKP, progression, and raid composition
- **Combat Log** - Real-time logging of heals, damage, and events
- **Keyboard shortcuts** - Number keys 1-9 for spells, M for mana potion, B for bags, ESC to cancel

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/taubut/holy-paladin-raid-healing-simulator.git
cd holy-paladin-raid-healing-simulator

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## How to Play

1. **Select a raid** from the dropdown (Molten Core or Onyxia's Lair)
2. **Apply buffs** - Use "Buff All" to apply raid buffs, assign Paladin Blessings
3. **Use consumables** - Click "Use All" in the Consumables section
4. **Start an encounter** - Click on a boss name to begin
5. **Heal your raid!**
   - Click on raid frames to select targets
   - Use number keys 1-9 to cast spells
   - Watch for debuffs (colored borders) and dispel them
   - Keep tanks alive - they take the most damage
   - Manage your mana with downranked spells

### Healing Tips
- Use **Holy Light** for tank healing and big damage
- Use **Flash of Light** for efficient sustain healing
- Keep **Blessing of Light** on tanks for +400 Holy Light healing
- Save **Divine Favor + Holy Light** for emergency tank saves
- **Cleanse** magic debuffs quickly - some explode if not dispelled!
- Use **Lay on Hands** as a last resort (drains all mana)

## Controls

| Key | Action |
|-----|--------|
| 1-9 | Cast spell from action bar |
| M | Use Major Mana Potion |
| B | Open Bags/Inventory |
| ESC | Cancel cast / Stop encounter |

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS** - Custom styling with WoW-inspired UI

## Project Structure

```
src/
├── App.tsx              # Main game UI
├── App.css              # Styling
├── game/
│   ├── GameEngine.ts    # Core game logic
│   ├── spells.ts        # Holy Paladin spells
│   ├── encounters.ts    # Boss definitions & abilities
│   ├── raids.ts         # Raid registry
│   ├── items.ts         # Equipment & loot
│   ├── lootTables.ts    # Drop tables & DKP costs
│   └── types.ts         # TypeScript interfaces
└── components/          # UI components
```

## Acknowledgments

- Inspired by the Classic WoW healing experience
- Spell icons from [Wowhead](https://www.wowhead.com/)
- Boss mechanics referenced from vanilla WoW documentation

## License

This project is for educational and entertainment purposes. World of Warcraft and all related imagery are trademarks of Blizzard Entertainment.

---

*"Did someone say [Thunderfury, Blessed Blade of the Windseeker]?"*

---

## Detailed Installation Guide for Beginners

If you've never used GitHub or Node.js before, follow these step-by-step instructions for your operating system.

### Step 1: Install Node.js

Node.js is required to run this game. Download and install it first.

#### Windows
1. Go to [https://nodejs.org](https://nodejs.org)
2. Click the **LTS** (Long Term Support) button to download the installer
3. Run the downloaded `.msi` file
4. Click "Next" through the installer, accepting the defaults
5. Make sure "Add to PATH" is checked
6. Click "Install" and wait for it to finish
7. Restart your computer

To verify it installed correctly, open **Command Prompt** (search for "cmd" in the Start menu) and type:
```
node --version
```
You should see a version number like `v20.x.x`

#### macOS
**Option A: Download from website**
1. Go to [https://nodejs.org](https://nodejs.org)
2. Click the **LTS** button to download the `.pkg` installer
3. Run the installer and follow the prompts

**Option B: Using Homebrew (if you have it)**
```bash
brew install node
```

To verify, open **Terminal** (search for "Terminal" in Spotlight) and type:
```
node --version
```

#### Linux (Ubuntu/Debian)
Open a terminal and run:
```bash
sudo apt update
sudo apt install nodejs npm
```

For other Linux distributions, visit [https://nodejs.org/en/download/package-manager](https://nodejs.org/en/download/package-manager)

To verify:
```
node --version
```

### Step 2: Download the Game

You have two options: download as a ZIP file (easiest) or use Git.

#### Option A: Download as ZIP (Easiest)
1. Go to the GitHub repository page
2. Click the green **"Code"** button near the top right
3. Click **"Download ZIP"**
4. Extract the ZIP file to a folder on your computer (right-click → "Extract All" on Windows, or double-click on Mac)
5. Remember where you extracted it!

#### Option B: Using Git (for more advanced users)

First, install Git if you don't have it:

**Windows:** Download from [https://git-scm.com/download/win](https://git-scm.com/download/win) and run the installer

**macOS:** Git comes pre-installed, or install via Homebrew: `brew install git`

**Linux:** `sudo apt install git`

Then clone the repository:
```bash
git clone https://github.com/taubut/holy-paladin-raid-healing-simulator.git
```

### Step 3: Install Dependencies and Run

#### Windows
1. Open **Command Prompt** or **PowerShell**
2. Navigate to the game folder. If you extracted to your Downloads folder, type:
   ```
   cd Downloads\holy-paladin-raid-healing-simulator-main
   ```
   (The folder name might be slightly different depending on how you downloaded it)
3. Install the required packages:
   ```
   npm install
   ```
   Wait for this to finish (it may take a minute)
4. Start the game:
   ```
   npm run dev
   ```
5. Open your web browser and go to: **http://localhost:5173**

#### macOS
1. Open **Terminal** (press Cmd+Space, type "Terminal", press Enter)
2. Navigate to the game folder:
   ```bash
   cd ~/Downloads/holy-paladin-raid-healing-simulator-main
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the game:
   ```bash
   npm run dev
   ```
5. Open your web browser and go to: **http://localhost:5173**

#### Linux
1. Open a terminal
2. Navigate to the game folder:
   ```bash
   cd ~/Downloads/holy-paladin-raid-healing-simulator-main
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the game:
   ```bash
   npm run dev
   ```
5. Open your web browser and go to: **http://localhost:5173**

### Troubleshooting

**"npm is not recognized" or "command not found: npm"**
- Node.js wasn't installed correctly or isn't in your PATH
- Try restarting your computer after installing Node.js
- Reinstall Node.js and make sure to check "Add to PATH" during installation

**"EACCES permission denied" (Mac/Linux)**
- Don't use `sudo` with npm
- See [npm's guide on fixing permissions](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)

**Port 5173 is already in use**
- Another application is using that port
- Close other development servers, or the game will try to use the next available port (5174, etc.)

**The page won't load**
- Make sure `npm run dev` is still running in your terminal
- Try refreshing the page
- Check that you're going to the correct URL shown in the terminal

### Stopping the Game

To stop the game server, go to the terminal where it's running and press **Ctrl+C** (or Cmd+C on Mac).
