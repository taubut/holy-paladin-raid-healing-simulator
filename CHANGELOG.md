# Changelog

All notable changes to the Holy Paladin Raid Healing Simulator will be documented in this file.

## [0.32.0] - 2025-12-06

### Added
- **Playable Holy Priest**: Full spell kit including Flash Heal, Greater Heal, Renew, Power Word: Shield, Prayer of Healing, Dispel Magic
- **Power Word: Shield**: Absorb incoming damage with visible absorb bars on raid frames
- **Weakened Soul Indicator**: 15-second debuff prevents re-shielding with visible indicator on raid frames
- **Renew HoT**: Heal over Time spell with visible HoT icon on raid frames
- **Power Infusion**: Boost a healer's spell haste and reduce mana costs (added for fun - it's technically a Disc spell!)
- **Multiplayer Cross-Class Sync**: Priest spells (Renew, PW:S, Weakened Soul) now sync properly between host and client
- **Faction Matching**: Players must be same faction to join multiplayer rooms
- **Auto-Share Raid**: Host's raid composition automatically shares when client joins

### Changed
- **Streamlined Multiplayer Lobby**: Class selection removed - uses your save file class automatically

### Fixed
- **Player Name Not Saving**: Fixed bug where custom character names were being overwritten by default class names
- **Priest Class Display**: Player frame now correctly shows "Holy Priest" instead of "Holy Paladin"

## [0.31.0] - 2025-12-05

### Added
- **Druid AI Overhaul**: Authentic spell values from classicdb.ch, Nature's Swiftness (3 min CD), Swiftmend (15s CD), Innervate support
- **Request Innervate Button**: Players can now click to request Innervate from a Druid - no more begging in raid chat!
- **Priest AI Overhaul**: Authentic spell values, Inner Focus (3 min CD, free spell + 25% crit), smart spell selection
- **Priest Downranking**: AI intelligently uses Heal R3 for light damage, Greater Heal R1 when low on mana
- **Multiplayer HoT Sync**: Rejuvenation, Regrowth, and Renew icons now visible on all clients' raid frames
- **Multiplayer Shield Sync**: Power Word: Shield absorb bars display correctly for all players
- **Multiplayer Debuff Sync**: Boss debuffs and Weakened Soul now properly sync to all clients
- **Magmadar Hunter Requirement**: Frenzy now requires a Hunter in the raid for Tranquilizing Shot

### Fixed
- **HoT Icon Display**: HoT indicators now show actual spell icons instead of always showing Rejuvenation
- **Multiple HoTs Visible**: Can now see all active HoTs on a target (Rejuv + Regrowth, Renew, etc.)
- **Greater Heal R3 Mana Cost**: Fixed from 445 to authentic 545 mana
- **Flash Heal Downrank**: Changed from R5 to R4 for better mana efficiency

### Changed
- **Heal R3 Added**: Most mana-efficient Priest heal for light damage periods (255 mana, 566-643 healing)

## [0.30.0] - 2025-12-04

### Added
- **Spectator Host Mode**: Hosts can check "Spectate Only" in multiplayer lobby to watch the raid without playing
- **AI Healer Fills Host Slot**: When spectating, an AI healer automatically takes your place
- **Spectating Indicator**: Clear on-screen indicator shows when you're in spectator mode

### Fixed
- **Spectator Healing Meter**: When spectating, healing meter correctly shows your AI healer's stats under your name
- **No Duplicate Meter Entries**: Fixed duplicate "player" entries appearing in healing meter when spectating

### Changed
- **Removed Duplicate Patch Notes Modal**: Cleaned up unused duplicate patch notes modal from end of App.tsx

## [0.29.0] - 2025-12-04

### Added
- **Raid Gear Screen**: New "Gear" tab in Manage Raid to view all raiders' equipment
- **Raider List Panel**: Left panel shows all raid members with class colors and gear scores
- **Equipment Details Panel**: Click any raider to see all 17 equipment slots with item details
- **Ragnaros RP Image Transitions**: RP scene now transitions between 3 images with fade effects synced to dialogue
- **Consolidated Totem Buffs**: All active totem buffs now show as single icon with hover tooltip on raid frames

### Fixed
- **Horde Raid Leader Name**: Fixed bug where Horde Raid Leader mode would overwrite player name with "Chainheal"

## [0.28.0] - 2025-12-03

### Added
- **Ragnaros RP Intro Event**: Cinematic dialogue sequence before the Ragnaros fight
- **Voiced Dialogue**: 5 lines with Majordomo Executus and Ragnaros audio
- **Rag_Domo.png Artwork**: Iconic image displayed during the RP sequence
- **65-Second Countdown**: Progress bar showing time until fight starts
- **Skip Button**: Bypass the RP and start the fight immediately

### Changed
- **Tank Assignment First**: Tank assignment modal now appears before the RP sequence

## [0.27.0] - 2025-12-03

### Added
- **Raid Leader Mode**: Manage your entire 40-man raid's gear progression with loot council simulation
- **Armor Type Proficiency**: Classes can now equip items based on what armor types they can physically wear (plate wearers can use plate, mail, leather, cloth)
- **Tier Set Class Lock**: Tier set items are now locked to their designated class only
- **Weapon Slot Choice Modal**: When assigning 1H weapons to dual-wielders, choose which slot (Main Hand or Off Hand) to replace

### Changed
- **231 Items Updated**: All armor items now have proper armor types assigned
- **Smart Loot Distribution**: Healers can roll on and receive leather/cloth healing gear if their class can wear it

## [0.26.0] - 2025-12-03

### Added
- **Bench System**: Swap raiders for bench players to customize your raid composition for specific encounters
- **Persistent Bench Gear**: Bench players keep their own gear between swaps
- **5/10 Bench Slots**: 5 slots for 20-man raids, 10 slots for 40-man raids

### Changed
- **Bench Tab Redesign**: Two-panel layout with compact raid groups on left, dedicated bench area on right
- **Drag & Drop**: Precise targeting with green highlight showing swap destination
- **Click-to-Swap**: Works both directions - bench→raid or raid→bench
- **Empty Slot Support**: Add bench players directly to empty group slots

## [0.25.0] - 2025-12-03

### Added
- **Ragnaros Overhaul**: 2-tank swap mechanic, Elemental Fire DoT, Lava Burst splash, Submerge phase with Sons of Flame
- **Majordomo Executus**: 5-tank add fight with Magic Reflection, Teleport, Blast Wave, and healing adds
- **Sulfuron Harbinger**: 4 Flamewaker Priest adds with Inspire, Dark Mending, and Shadow Word: Pain
- **Golemagg the Incinerator**: 3-tank fight with Magma Splash stacking debuff and Core Ragers
- **Shazzrah Updates**: Arcane Explosion, Blink, Magic Grounding
- **Baron Geddon**: Living Bomb mechanic with Safe Zone drag system
- **Garr Updates**: 8 Firesworn adds that explode on death
- **Gehennas Updates**: Rain of Fire and Gehennas' Curse (75% healing reduction)
- **Tank Assignment Modals**: Assign specific tanks before boss encounters
- **Tank Swap Alerts**: On-screen warnings when tank swaps are needed

### Fixed
- Combat log numbers now display as clean integers (no decimals)

## [0.24.0] - 2025-12-02

### Added
- **Pre-Raid BiS Starting Gear**: New characters start with full pre-raid Best in Slot gear
- **Missing Molten Core Loot**: Deep Earth Spaulders, Wristguards of True Flight, Core Forged Greaves, Helm of the Lifegiver, Shard of the Flame
- **Missing BWL Loot**: Draconic Avenger, Draconic Maul, Doom's Edge, Band of Dark Dominion

### Changed
- **Styled Confirmation Dialogs**: Native browser popups replaced with WoW-themed dialogs
- **Warning Highlights**: Destructive actions show clear yellow warning boxes

## [0.23.0] - 2025-12-01

### Added
- **Enchanting System**: Buy enchants with Nexus Crystals from disenchanting
- **Quest Rewards**: Boss quest items (Head of Onyxia, etc.) now usable for rewards
- **Gear Inspection Redesign**: Two-column layout with clickable items and full stat breakdown
- **Enchant Display**: Enchants show full stats in green text
- **Accurate Bonus HPS**: Calculates healing power from gear + enchants

### Changed
- **100+ Icon Updates**: All items now use authentic WoW Classic icons

## [0.22.0] - 2025-12-01

### Added
- **Disenchant All Button**: Disenchant all bag items at once
- **Right-Click Disenchant**: Disenchant individual items
- **Materials Bag Tab**: View enchanting materials like Nexus Crystals
- **Smart Loot**: AI raid members only equip actual upgrades
- **Pass to Player**: Unwanted items go to your bag instead of being lost

### Fixed
- **Quest Reward Limits**: AI raid members can't claim same reward twice
- **Loot Table Overhaul**: Authentic Classic drops with correct item levels

### Changed
- Cloud saves trigger on quest turn-ins, legendary crafting, loot, and disenchanting

## [0.21.0] - 2025-12-01

### Changed
- **Buff All Button**: Now applies raid buffs, consumables, AND world buffs

### Fixed
- **Paladin Auras**: Now correctly affect only your party (authentic Classic behavior)
- **Cloud Save Duplicates**: Fixed saves creating duplicates

## [0.20.0] - 2025-11-30

### Added
- **Cooldown Sweep Animation**: WoW-style clockwise sweep on spell icons
- **GCD Visual Feedback**: Sweep animation on all GCD-affected spells
- **Save on Creation**: New characters saved to cloud immediately

### Fixed
- **GCD Timing**: Now starts when casting begins (authentic WoW behavior)
- **Multiple Characters**: Character selection shows all saved characters

## [0.19.0] - 2025-11-30

### Added
- **Mouseover Healing Mode**: Toggle in Settings → Keybinds
- **Hover to Heal**: Spells target whoever mouse is over (no clicking)
- **Visual Indicator**: Cyan glow shows mouseover target
- **AI Dispel Priority**: AI healers wait 2.5s before dispelling (player priority)
- **AI Dispel Tracking**: AI healer dispels appear in Dispels meter

### Fixed
- **Auto-Save**: Game saves to cloud after boss defeat and loot close
- **Character Name**: Now loads correctly from cloud saves

## [0.18.0] - 2025-11-30

### Added
- **Landing Page**: Character creation with faction, class, and name selection
- **Continue Button**: Returning players can jump back in with one click

## [0.17.0] - 2025-11-29

### Added
- **Living Bomb Safe Zone**: Drag bombed raid members to Safe Zone to prevent splash damage
- **Raid Warning**: Large on-screen warning with airhorn sound
- **Auto Return**: Bombed players return to position after explosion

### Changed
- Living Bomb is now undispellable - must use Safe Zone

## [0.16.0] - 2025-11-29

### Added
- **Google & Apple Sign-In**: Log in to sync progress across devices
- **Automatic Cloud Sync**: Save/Load uses cloud storage when logged in
- **PostHog Analytics**: Track player engagement to improve the game

## [0.15.0] - 2025-11-29

### Added
- **AI Healer Mana System**: Class-specific mana pools and MP5 regeneration
- **Smart Spell Selection**: Efficient heals for top-offs, big heals for emergencies
- **OOM Behavior**: AI healers pause when low mana (except tank emergencies)
- **Healer Mana Bars**: All healers show mana bars on raid frames
- **AI Healer Dispelling**: Class-specific dispels with priority targeting

### Changed
- Mobile: Full action bar (was limited to 6 spells)
- Mobile: Bag and LFG buttons now visible
- Patch notes X button moved to top right corner

## [0.14.0] - 2025-11-29

### Added
- **Encounter UI Redesign**: Visual progress bar for boss encounters
- **Training Dummy**: Separated into practice section
- **LFG Button**: Added to raid config strip
- **Auto Mobile Detection**: With manual toggle in Admin Panel

### Fixed
- Keybinds no longer trigger while typing in input fields
- Modal close buttons positioned inside panels

## [0.13.0] - 2025-11-28

### Added
- **Multiplayer Co-op**: Room codes for up to 4 healers
- **Real-time Healing Meter**: Shows all players' HPS
- **DKP Loot Bidding**: With roll tie-breakers
- **Host-Authoritative Sync**: 20Hz via Supabase Realtime
- **Gear Score Display**: With host gear sharing feature

### Changed
- Priest and Druid greyed out in multiplayer (unavailable)

## [0.12.0] - 2025-11-28

### Added
- **Blackwing Lair**: 8 new bosses (Razorgore, Vaelastrasz, Broodlord, Firemaw, Ebonroc, Flamegor, Chromaggus, Nefarian)
- **Tier 2 Armor Sets**: Complete sets for all 8 classes
- **BWL Non-Set Loot**: Ashkandi, Chromatically Tempered Sword, Lokamir, and more
- **Prince Thunderaan**: Secret boss unlocks with both Bindings + Firemaw defeat
- **Thunderfury Quest Chain**: Defeat Thunderaan to unlock crafting
- **Warchief's Blessing**: Unlocks after defeating Nefarian (+300 HP, +15% attack speed, +10 mp5)

### Fixed
- Dead players can no longer cast spells
- BWL loot: Removed trinkets/rings/necks with invalid slots
- Admin panel: Toggling boss defeats triggers special unlocks

## [0.11.0] - 2025-11-27

### Added
- **Dual Wield System**: Offhand slot for Warriors and Rogues
- **Ranged Weapon Slot**: For Hunters
- **Spec-Aware Loot**: Caster gear goes to caster specs, melee to melee
- **Animated Patch Notes Button**: Blizzard blue pulse animation in header
- **Patch Notes Modal**: Release history overlay

### Changed
- Protection Warriors can dual wield (Fury/Prot style)
- Patch notes button auto-hides after viewing

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
