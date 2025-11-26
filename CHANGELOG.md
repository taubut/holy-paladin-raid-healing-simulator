# Changelog

All notable changes to the Holy Paladin Raid Healing Simulator will be documented in this file.

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
