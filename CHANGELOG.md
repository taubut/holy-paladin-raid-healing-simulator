# Changelog

All notable changes to the Holy Paladin Raid Healing Simulator will be documented in this file.

## [0.10.0] - 2025-11-27

### Added
- **Encounter Journal Loot Display**: Boss loot now shown in encounter journal
  - Two-column layout with abilities on left, loot on right
  - Items sorted by rarity (legendary first)
  - Item icons with rarity-colored borders and names
  - Slot type and class restrictions displayed
  - Legendary materials shown at top with drop chance percentage
- **Admin Panel Legendary Materials Section**: Test legendary crafting easily
  - Toggle Bindings of the Windseeker (Left/Right) and Eye of Sulfuras
  - Shows crafting status for Thunderfury and Sulfuras
- **Legendary Materials Save/Load**: Materials now persist across game saves

### Fixed
- **Ragnaros Loot Table**: Removed incorrect drops (Azuresong Mageblade, Aurastone Hammer, Staff of Dominance)
  - Ragnaros now correctly drops only Perdition's Blade and Bonereaver's Edge
- **Majordomo Loot Table**: Removed Aurastone Hammer (not an authentic drop)
- **Legendary Material Icons**: Updated to correct WoW icons
  - Bindings of the Windseeker: `spell_ice_lament`
  - Eye of Sulfuras: `inv_misc_gem_pearl_05`
- **Legendary Materials Persistence**: Fixed bug where materials were lost on save/load (save version 7)

### Changed
- Encounter journal modal widened to accommodate loot column (1000-1200px)
- Loot tables sanitized for authentic Vanilla WoW drops

## [0.9.0] - 2025-11-26

### Added
- **Mobile/Phone UI Mode**: Toggle between Desktop and Phone UI with a single button click
  - Complete mobile-optimized interface built from the ground up (not responsive, a separate UI)
  - Mobile player header with class icon, mana bar, and stats
  - Mobile boss frame with health bar and enrage timer
  - Mobile cast bar
  - Tab navigation (Raid, Buffs, Log) for easy switching
  - Compact 4-column raid grid layout to fit all 40 raid members on screen
  - Inline action bar positioned directly under raid frames for easy access
  - Inline totem bar for Shaman players (right under action bar)
  - Mobile-optimized buff/consumable/world buff management
  - Mobile combat log with scrollable history
  - All encounter controls accessible on mobile (boss selection, faction toggle, save/load)
- **Phone UI Toggle Button**: Located in the header - switch between Desktop and Phone modes instantly

### Changed
- Mobile raid frames now show truncated names (6 characters) with health values
- Mobile spell buttons sized for touch interaction (38x38px)
- Mobile totem buttons compact for screen space (26x26px)

## [0.8.0] - 2025-11-26

### Added
- **Complete Shaman Totem System**: All 14 Vanilla WoW Restoration Shaman totems now functional
  - Water Totems: Mana Spring, Mana Tide, Healing Stream, Poison Cleansing, Disease Cleansing
  - Earth Totems: Strength of Earth, Stoneskin, Tremor
  - Air Totems: Grace of Air, Windfury, Tranquil Air
  - Fire Totems: Fire Resistance, Frost Resistance, Nature Resistance
- **NPC Shaman Totem Assignments**: Click on NPC Shamans in Raid Group Manager to assign their totems (like Paladin auras)
- **Totem Effects Actually Work**: NPC Shaman totems provide real benefits to party members
  - Mana Spring/Mana Tide regenerate mana for the player
  - Healing Stream heals party members over time
  - Cleansing totems remove poison/disease debuffs
  - Stat totems provide buffs visible on raid frames
- **Chain Heal Bounce Preview**: Visual indicator shows which targets Chain Heal will bounce to (spell icon on raid frames)
- **Totem Buff Display**: Totem buffs now appear on raid frames for affected party members
- **Duplicate Totem Prevention**: Cannot drop a totem that an NPC Shaman in your group already has active

### Fixed
- **Loot System Class Detection**: Shaman items now correctly show as equippable when playing as Horde (was hardcoded to Paladin)
- Loot warning message now shows correct class name based on faction

## [0.7.0] - 2025-11-26

### Added
- **Horde Restoration Shaman**: Switch between Alliance (Holy Paladin) and Horde (Restoration Shaman) factions
- Complete Shaman spell kit: Healing Wave, Lesser Healing Wave, Chain Heal
- Shaman totem system with 4 element slots (Earth, Fire, Water, Air)
- Faction-appropriate raid compositions with Shaman/Paladin class distribution

## [0.6.0] - 2025-11-26

### Added
- **Full Class/Spec System**: All 8 classes now have authentic Vanilla WoW specs (24 total specs)
  - Warriors: Arms, Fury, Protection
  - Rogues: Assassination, Combat, Subtlety
  - Hunters: Beast Mastery, Marksmanship, Survival
  - Mages: Arcane, Fire, Frost
  - Warlocks: Affliction, Demonology, Destruction
  - Priests: Discipline, Holy, Shadow
  - Druids: Balance, Feral (Tank), Feral (DPS), Restoration
  - Paladins: Holy, Protection, Retribution
- Class/Spec swap modal in Raid Group Manager - click any player to change their class and spec
- Spec-aware automatic auras: Moonkin Aura only from Balance druids, Leader of the Pack only from Feral druids, Trueshot Aura only from Marksmanship hunters
- Spec icons displayed next to player names in Raid Group Manager
- Save system now persists specs and paladin aura assignments (save version 6)

### Changed
- Blessing of Light icon corrected to `spell_holy_prayerofhealing02`
- Blessing of Light removed from action bar (it's a buff, not an action)
- Improved Raid Group Manager layout with role tags aligned on the right
- Aura tooltips now show provider name

### Fixed
- Raid composition properly persists across boss fights, raids, and JSON exports
- Old saves (v5 and earlier) automatically upgrade with default specs based on role
- CSS class mismatch for group header aura icons

## [0.5.0] - 2025-11-26

### Added
- Fullscreen Raid Group Manager modal with improved UI
- Instant aura tooltips showing effect, scope, and provider
- DPS role tags now displayed for all raid members
- All class auras (Leader of the Pack, Moonkin Aura, Trueshot Aura, Blood Pact) visible at top of each group
- Aura icons displayed on individual class members who provide them

### Changed
- Role tags (Tank/Heal/DPS) moved to right side of member rows for cleaner layout
- Manage Raid Groups button relocated under raid frames (removed duplicate from encounter area)

### Fixed
- Automatic class auras now deduplicated at group headers (auras don't stack with multiple of same class)
- Aura icons now use actual WoW icons instead of emojis

## [0.4.0] - 2025-11-26

### Added
- Damage types for all boss abilities (fire, shadow, arcane, frost, nature, physical)
- Resistance auras now properly reduce elemental damage
- README screenshot for GitHub repository

### Fixed
- Fire Resistance Aura, Shadow Resistance Aura, etc. now actually reduce damage from matching ability types
- Molten Core bosses deal appropriate fire/shadow/arcane damage
- Onyxia's fire abilities (Deep Breath, Fireballs, Whelps) now deal fire damage
- Ragnaros deals fire damage with all abilities (as the Firelord should!)

## [0.3.0] - 2025-11-26

### Added
- Raid management mode for organizing players into groups
- Drag-and-drop player swapping between groups
- Party auras system (Paladin auras, Moonkin Aura, Leader of the Pack, Trueshot Aura, Blood Pact)
- Paladin aura selection UI for configuring each paladin's active aura
- Group labels (G1, G2, etc.) visible in normal raid view

### Fixed
- Group assignments now correctly assign exactly 5 members per group

## [0.2.0] - 2025-11-26

### Added
- Five-Second Rule (FSR) mana regeneration system
- Illumination talent (60% mana refund on crit heals)
- Boss phase transition alerts with visual and audio feedback
- Critical heal visual feedback on raid frames
- Mana bar color states (normal/warning/critical)
- Low mana warning pulse on player frame

## [0.1.1] - 2025-11-26

### Added
- Custom filename option for save exports
- Moved export functionality to Save modal for better UX

## [0.1.0] - 2025-11-26

### Added
- Initial release of Holy Paladin Raid Healing Simulator
- Core healing gameplay with Holy Light, Flash of Light, and Holy Shock
- 20-man raid composition with tanks, healers, and DPS
- Multiple boss encounters with unique damage patterns
- Raid buff system (Fortitude, Arcane Intellect, Mark of the Wild, etc.)
- Paladin blessing system with limited slots based on paladin count
- Consumables and World Buffs
- Gear and loot system with DKP
- Save/Load game progress
- Combat log with healing statistics
