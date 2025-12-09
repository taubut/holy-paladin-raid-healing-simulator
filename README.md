# Classic WoW Raid Simulator

#ALL HEALER CLASSES NOW PLAYABLE!

A browser-based Classic WoW (Vanilla) raid healing simulator. Experience the nostalgia of healing through Molten Core, Blackwing Lair, and Onyxia's Lair with authentic boss mechanics, multiplayer co-op, and full raid management.

![Game Screenshot](screenshots/screenshot.png)

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)

## Play Now

**https://classicwowraidsim.com**

No download required - play directly in your browser!

## Key Features

### 19 Raid Bosses with Authentic Mechanics
- **Molten Core** - All 10 bosses including Ragnaros with voiced cinematic RP intro
- **Blackwing Lair** - 8 bosses from Razorgore to Nefarian with Tier 2 loot
- **Onyxia's Lair** - 3-phase dragon encounter with Deep Breath and whelps
- **Prince Thunderaan** - Secret boss unlocked with both Bindings of the Windseeker
- Tank swap mechanics, add management, phase transitions, Living Bomb safe zones, and more

### Multiplayer Co-op (Up to 4 Healers)
- Create or join rooms with room codes
- Real-time healing meter showing all players' HPS
- DKP loot bidding with roll tie-breakers
- Host-authoritative sync at 20Hz via Supabase Realtime

### Raid Leader Mode
- Manage your entire 40-man raid's gear progression
- Loot council simulation - assign drops to any raid member
- Bench system to swap raiders in and out for specific encounters
- Tank assignment modals for multi-tank fights

### Cloud Saves & Mobile Support
- Google & Apple Sign-In to sync progress across devices
- Automatic cloud save on boss kills and loot
- Full mobile-optimized UI (dedicated mobile interface, not just responsive)
- Touch-friendly action bars and raid frames

### Progression & Loot Systems
- **Legendary Crafting** - Thunderfury, Blessed Blade of the Windseeker and Sulfuras, Hand of Ragnaros
- **Enchanting** - Disenchant epics for Nexus Crystals, purchase enchants for your gear
- **DKP System** - Earn Dragon Kill Points for boss kills, bid on loot drops
- **200+ Items** - Authentic Classic loot with correct stats, icons, and item levels
- **Tier Sets** - Complete Tier 1 and Tier 2 armor sets for all 8 classes

### Authentic Healing Gameplay
- Multiple healer classes: Holy Paladin (Alliance), Restoration Shaman (Horde), more coming
- Five-Second Rule mana regeneration and Illumination talent
- Mouseover healing mode (like real WoW healing addons)
- AI healers with mana management, smart spell selection, and dispelling
- Complete Paladin aura and Shaman totem systems

### Quality of Life
- Encounter Journal with boss abilities, mechanics, and loot tables
- Combat log with real-time HPS meters and dispel tracking
- Save/Load system with multiple slots and JSON import/export
- Admin Panel for testing progression, loot, and raid composition
- 20-man or 40-man raid sizes

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
- **Vite** - Build tool
- **Supabase** - Auth, database, and realtime multiplayer

## Acknowledgments

- Inspired by the Classic WoW healing experience
- Spell icons from [Wowhead](https://www.wowhead.com/)
- Boss mechanics referenced from vanilla WoW documentation

## License

This project is for educational and entertainment purposes. World of Warcraft and all related imagery are trademarks of Blizzard Entertainment.

---

*"Did someone say [Thunderfury, Blessed Blade of the Windseeker]?"*
