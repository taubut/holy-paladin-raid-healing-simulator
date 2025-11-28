# CLAUDE.md - AI Assistant Guide

This document provides essential context for AI assistants working on the Classic WoW Raid Healing Simulator codebase.

## Project Overview

A browser-based Classic World of Warcraft (Vanilla) raid healing simulator supporting Holy Paladin (Alliance) and Restoration Shaman (Horde). Features authentic spell mechanics, boss encounters, raid management, DKP/loot systems, and legendary crafting.

**Live Demo:** https://taubut.github.io/holy-paladin-raid-healing-simulator/

**Current Version:** 0.12.0 (Blackwing Lair, Prince Thunderaan, Warchief's Blessing)

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7.2 | Build tool & dev server |
| CSS | Custom | WoW-themed styling (no framework) |
| ESLint | 9.39 | Code linting |

## Quick Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Type check + production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── App.tsx                  # Main component (~3400 lines) - state management & UI
├── App.css                  # Primary styling (~129KB)
├── main.tsx                 # React entry point
├── components/              # UI components
│   ├── ActionBar.tsx        # Spell casting buttons
│   ├── RaidFrame.tsx        # Individual raid member frames
│   ├── PlayerFrame.tsx      # Player healer stats
│   ├── BossFrame.tsx        # Boss health & mechanics
│   ├── RaidGrid.tsx         # 2D raid layout
│   ├── CastBar.tsx          # Cast progress bar
│   ├── CombatLog.tsx        # Event logging
│   ├── ManaPotion.tsx       # Consumable UI
│   ├── EncounterSelect.tsx  # Boss selection
│   └── ScoreBoard.tsx       # Stats display
├── game/                    # Core game logic
│   ├── GameEngine.ts        # Main simulation engine (~4500 lines)
│   ├── types.ts             # Core type definitions
│   ├── encounters.ts        # Boss data & mechanics
│   ├── items.ts             # Gear & loot items
│   ├── spells.ts            # Paladin spell definitions
│   ├── shamanSpells.ts      # Shaman spell definitions
│   ├── lootTables.ts        # Drop tables & DKP costs
│   ├── raids.ts             # Raid registry
│   ├── auras.ts             # Buff/aura system
│   └── totems.ts            # Shaman totem system
├── types/                   # Additional type definitions
│   └── game.ts              # Class/spec types
└── data/                    # Legacy data (deprecated, use game/ instead)
```

## Architecture

### State Management Pattern
- **No Redux/Context** - Uses ref-based singleton pattern
- `useRef<GameEngine>` in App.tsx maintains single GameEngine instance
- `useState(0)` with `engine.subscribe()` triggers UI updates
- LocalStorage for persistence (save version 7 with migrations)

### Component Communication
- Props-based data flow (parent → child)
- Callbacks for events (child → parent)
- Direct engine access via `engine.getState()` on subscription
- Keyboard events captured at App level

### Game Loop
- Tick-driven simulation with `deltaTime`
- Encounter states: `isRunning`, `isPaused`, `isCasting`
- DPS simulation via HPS (healing per second) calculations

## Key Files to Understand

| File | Purpose | When to Modify |
|------|---------|----------------|
| `src/game/GameEngine.ts` | Core simulation logic | Adding game mechanics, spells, combat logic |
| `src/game/types.ts` | Type definitions | Adding new entity types or properties |
| `src/game/encounters.ts` | Boss definitions | Adding/modifying boss encounters |
| `src/game/items.ts` | Gear items | Adding loot items |
| `src/game/lootTables.ts` | Drop tables | Modifying loot distribution |
| `src/App.tsx` | Main UI & state | UI features, modals, state management |

## Naming Conventions

```typescript
// Components: PascalCase
RaidFrame.tsx, ActionBar.tsx

// Functions: camelCase
castSpell(), getDefaultSpec()

// Constants: UPPER_SNAKE_CASE
MANA_POTION_COOLDOWN, PLAYER_ID

// Types/Interfaces: PascalCase
RaidMember, Buff, GameState

// IDs (in data): lowercase_snake_case
holy_light, molten_core, lucifron
```

## Common Development Tasks

### Adding a New Boss
1. Define `Boss` object in `src/game/encounters.ts`
2. Add damage events (tank damage, AoE, debuffs)
3. Define debuffs in `DEBUFFS` registry
4. Add to raid encounters in `src/game/raids.ts`
5. Configure loot table in `src/game/lootTables.ts`

### Adding a New Spell
1. Define `Spell` object in `src/game/spells.ts` or `shamanSpells.ts`
2. Export from `DEFAULT_ACTION_BAR` array
3. Add tooltip to `SPELL_TOOLTIPS`
4. Implement casting logic in `GameEngine.castSpell()` if needed
5. Add spell power coefficient validation

### Adding Loot Items
1. Define `GearItem` in `src/game/items.ts`
2. Set rarity, slot, class restrictions, stats
3. Add to loot table in `src/game/lootTables.ts`
4. Set `itemCategory` for spec-aware filtering

### Styling Components
1. Create `ComponentName.css` alongside `.tsx`
2. Import in component: `import './ComponentName.css'`
3. Use BEM naming: `.component-name__element`
4. Dark theme colors: `#0a0a12` background, `#ffffff` text

## Core Systems

### Spell Casting Flow
1. Validate mana cost, cooldown, GCD, not casting
2. Begin cast: Set `isCasting = true`
3. On tick: Decrement cast progress
4. On complete: Apply heal, trigger cooldowns, log
5. On interrupt: Clear cast state

### Encounter Tick Flow
1. Calculate damage based on damage events
2. Apply/tick debuffs
3. Update buff durations
4. AI healers calculate healing
5. Process player healing
6. Regenerate mana
7. Check phase transitions
8. Check enrage/wipe

### Save System
- 5 named slots in localStorage
- JSON export/import support
- Automatic version migration (v1-v7)
- Key: `saveGame_[slotName]`

## Important Types

```typescript
// Core entity
interface RaidMember {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  class: WoWClass;
  spec: WoWSpec;
  role: 'tank' | 'healer' | 'dps';
  buffs: Buff[];
  debuffs: Debuff[];
  group: number;
}

// Spell definition
interface Spell {
  id: string;
  name: string;
  manaCost: number;
  castTime: number;
  cooldown: number;
  healMin: number;
  healMax: number;
  spellPowerCoefficient: number;
}

// Boss definition
interface Boss {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  damageEvents: DamageEvent[];
  phases?: Phase[];
  enrageTimer?: number;
}
```

## Deployment

- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)
- **Hosting:** GitHub Pages
- **Trigger:** Push to `main` branch
- **Base path:** `/holy-paladin-raid-healing-simulator/`

## Testing

**Current Status:** No testing framework configured

**Recommended additions:**
- Vitest for unit tests
- @testing-library/react for component tests

**Priority test areas:**
- GameEngine spell casting logic
- Damage calculation and debuff application
- Mana regeneration ticks
- Save/load persistence

## Code Quality Guidelines

1. **Read before modifying** - Always understand existing code before changes
2. **Type safety** - Use explicit types, avoid `any`
3. **No side effects in renders** - Use `useEffect` for subscriptions
4. **Immutable updates** - Create new objects for state changes
5. **Validate inputs** - Check mana, cooldowns before operations

## Known Patterns

### Subscription Pattern
```typescript
useEffect(() => {
  const unsubscribe = engine.subscribe(() => {
    forceUpdate(n => n + 1);
  });
  return unsubscribe;
}, []);
```

### Engine Method Calls
```typescript
const handleCastSpell = (spell: Spell) => {
  engineRef.current?.castSpell(spell);
};
```

### State Access
```typescript
const state = engineRef.current?.getState();
if (!state) return null;
```

## External Resources

- **Spell icons:** `https://wow.zamimg.com/images/wow/icons/large/`
- **Data sources:** ClassicDB.ch, Wowhead (Vanilla WoW data)
- **No external APIs** - Fully client-side simulation

## Changelog

See `CHANGELOG.md` for version history. Key releases:
- **v0.12.0:** Blackwing Lair, Prince Thunderaan, Warchief's Blessing
- **v0.11.0:** Dual Wield System, Spec-Aware Loot
- **v0.10.0:** Encounter Journal Loot Display
- **v0.9.0:** Mobile/Phone UI Mode
- **v0.8.0:** Complete Shaman Totem System
- **v0.7.0:** Horde Restoration Shaman support

## Tips for AI Assistants

1. **GameEngine.ts is the core** - Most game logic lives here
2. **App.tsx handles all UI state** - Modals, selections, rendering
3. **Data files are declarative** - encounters.ts, items.ts, spells.ts define content
4. **No CSS framework** - All custom CSS for authentic WoW aesthetic
5. **Vanilla WoW authenticity matters** - Spell coefficients, mechanics should match original
6. **Check CHANGELOG.md** - Understand recent changes before modifying features
7. **Save version matters** - Increment save version when changing persisted data structure
