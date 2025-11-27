import { useEffect, useRef, useState } from 'react';
import { GameEngine, CONSUMABLES, WORLD_BUFFS } from './game/GameEngine';
import { CLASS_COLORS, CLASS_SPECS, getSpecById } from './game/types';
import type { WoWClass, BuffEffect } from './game/types';
import type { EquipmentSlot } from './game/items';
import { RARITY_COLORS } from './game/items';
import { ENCOUNTERS, DEBUFFS } from './game/encounters';
import { RAIDS } from './game/raids';
import { calculateDKPCost, BOSS_LOOT_TABLES } from './game/lootTables';
import { ALL_ITEMS, LEGENDARY_MATERIALS } from './game/items';
import { SPELL_TOOLTIPS } from './game/spells';
import type { Spell } from './game/types';
import { PARTY_AURAS, getPaladinAuras, memberProvidesAura } from './game/auras';
import { TOTEMS_BY_ELEMENT, getTotemById } from './game/totems';
import type { TotemElement } from './game/types';
import './App.css';


function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const [, forceUpdate] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveSlotName, setSaveSlotName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [importExportStatus, setImportExportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [exportFileName, setExportFileName] = useState('');
  const [hoveredSpell, setHoveredSpell] = useState<Spell | null>(null);
  const [showEncounterJournal, setShowEncounterJournal] = useState(false);
  const [selectedJournalBoss, setSelectedJournalBoss] = useState<string | null>(null);
  // Admin Panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState<'loot' | 'dkp' | 'progression' | 'raid'>('loot');
  const [selectedAdminMemberId, setSelectedAdminMemberId] = useState<string | null>(null);
  const [adminProgressionRaid, setAdminProgressionRaid] = useState<string>('molten_core');
  // Inventory state
  const [showInventory, setShowInventory] = useState(false);
  const [selectedLegendaryCraftTarget, setSelectedLegendaryCraftTarget] = useState<string | null>(null);
  const [adminItemSlotFilter, setAdminItemSlotFilter] = useState<string>('all');
  const [adminItemSearch, setAdminItemSearch] = useState('');
  const [adminDkpInput, setAdminDkpInput] = useState('');
  const [adminNewMemberName, setAdminNewMemberName] = useState('');
  const [adminNewMemberClass, setAdminNewMemberClass] = useState<WoWClass>('warrior');
  const [adminNewMemberRole, setAdminNewMemberRole] = useState<'tank' | 'healer' | 'dps'>('dps');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  // Phase transition alert
  const [phaseAlert, setPhaseAlert] = useState<string | null>(null);
  const lastPhaseRef = useRef<number>(1);
  // Raid management state
  const [showRaidGroupManager, setShowRaidGroupManager] = useState(false);
  const [selectedPaladinForAura, setSelectedPaladinForAura] = useState<string | null>(null);
  const [selectedShamanForTotems, setSelectedShamanForTotems] = useState<string | null>(null);
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [hoveredAura, setHoveredAura] = useState<{ aura: typeof PARTY_AURAS[string], providerName: string } | null>(null);
  const [selectedMemberForClassSpec, setSelectedMemberForClassSpec] = useState<string | null>(null);
  // Mobile UI mode
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [mobileTab, setMobileTab] = useState<'raid' | 'buffs' | 'log'>('raid');

  // Initialize engine once
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  const engine = engineRef.current;

  // Subscribe to engine updates
  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      forceUpdate(n => n + 1);
    });
    return unsubscribe;
  }, [engine]);

  // Phase transition detection
  const state = engine.getState();
  useEffect(() => {
    const currentPhase = state.boss?.currentPhase || 1;
    if (currentPhase !== lastPhaseRef.current && state.isRunning) {
      // Find the phase transition message
      const transition = state.boss?.phaseTransitions?.find(t => t.phase === currentPhase);
      if (transition) {
        setPhaseAlert(transition.message);
        // Clear the alert after 3 seconds
        const timer = setTimeout(() => setPhaseAlert(null), 3000);
        return () => clearTimeout(timer);
      }
    }
    lastPhaseRef.current = currentPhase;
  }, [state.boss?.currentPhase, state.isRunning, state.boss?.phaseTransitions]);

  // Reset phase tracking when encounter ends
  useEffect(() => {
    if (!state.isRunning) {
      lastPhaseRef.current = 1;
      setPhaseAlert(null);
    }
  }, [state.isRunning]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showInventory) {
          setShowInventory(false);
          return;
        }
        if (engine.getState().isCasting) {
          engine.cancelCast();
        } else if (engine.getState().isRunning) {
          engine.stopEncounter();
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        engine.useManaPotion();
      }
      // B key opens bags (only when not in encounter)
      if ((e.key === 'b' || e.key === 'B') && !engine.getState().isRunning) {
        setShowInventory(prev => !prev);
      }
      // Number keys for spells
      const actionBar = engine.getActionBar();
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && actionBar[num - 1]) {
        engine.castSpell(actionBar[num - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, showInventory]);

  const actionBar = engine.getActionBar();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get boss abilities for the encounter journal
  const getBossAbilities = (bossId: string) => {
    // Search in current raid encounters first, then fall back to all encounters
    let boss = engine.getCurrentRaidEncounters().find(e => e.id === bossId);
    if (!boss) {
      boss = ENCOUNTERS.find(e => e.id === bossId);
    }
    if (!boss) return [];

    const abilities: Array<{
      name: string;
      type: string;
      description: string;
      icon?: string;
      damage?: number;
      interval: number;
    }> = [];

    boss.damageEvents.forEach(event => {
      if (event.type === 'debuff' && event.debuffId) {
        const debuff = DEBUFFS[event.debuffId];
        if (debuff) {
          abilities.push({
            name: debuff.name,
            type: debuff.type,
            description: getDebuffDescription(debuff),
            icon: debuff.icon,
            damage: debuff.damagePerTick,
            interval: event.interval,
          });
        }
      } else if (event.type === 'tank_damage') {
        abilities.push({
          name: event.damage > 1000 ? 'Heavy Strike' : 'Melee Attack',
          type: 'physical',
          description: `Deals ${event.damage} damage to the tank.`,
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'raid_damage') {
        abilities.push({
          name: 'Raid Damage',
          type: 'fire',
          description: `Deals ${event.damage} damage to ${event.targetCount || 5} random raid members.`,
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'random_target') {
        abilities.push({
          name: 'Random Target',
          type: 'fire',
          description: `Deals ${event.damage} damage to a random raid member.`,
          damage: event.damage,
          interval: event.interval,
        });
      }
    });

    return abilities;
  };

  const getDebuffDescription = (debuff: typeof DEBUFFS[string]) => {
    let desc = '';
    if (debuff.damagePerTick && debuff.tickInterval) {
      desc = `Deals ${debuff.damagePerTick} ${debuff.type} damage every ${debuff.tickInterval} seconds for ${debuff.maxDuration} seconds.`;
    } else if (debuff.damagePerTick && debuff.maxDuration === debuff.tickInterval) {
      desc = `Explodes for ${debuff.damagePerTick} damage after ${debuff.maxDuration} seconds if not dispelled.`;
    } else {
      desc = `Lasts ${debuff.maxDuration} seconds. ${debuff.type === 'curse' ? 'Requires Decurse to remove.' : 'Can be Cleansed.'}`;
    }
    return desc;
  };

  // Format aura effect for display
  const formatAuraEffect = (effect: BuffEffect): string => {
    const parts: string[] = [];
    // Stat bonuses
    if (effect.armorBonus) parts.push(`+${effect.armorBonus} Armor`);
    if (effect.strengthBonus) parts.push(`+${effect.strengthBonus} Strength`);
    if (effect.agilityBonus) parts.push(`+${effect.agilityBonus} Agility`);
    if (effect.staminaBonus) parts.push(`+${effect.staminaBonus} Stamina`);
    if (effect.intellectBonus) parts.push(`+${effect.intellectBonus} Intellect`);
    if (effect.spiritBonus) parts.push(`+${effect.spiritBonus} Spirit`);
    // Resistances
    if (effect.fireResistance) parts.push(`+${effect.fireResistance} Fire Resist`);
    if (effect.frostResistance) parts.push(`+${effect.frostResistance} Frost Resist`);
    if (effect.shadowResistance) parts.push(`+${effect.shadowResistance} Shadow Resist`);
    if (effect.natureResistance) parts.push(`+${effect.natureResistance} Nature Resist`);
    if (effect.arcaneResistance) parts.push(`+${effect.arcaneResistance} Arcane Resist`);
    // Combat bonuses
    if (effect.spellCritBonus) parts.push(`+${effect.spellCritBonus}% Spell Crit`);
    if (effect.meleeCritBonus) parts.push(`+${effect.meleeCritBonus}% Melee Crit`);
    if (effect.attackPowerBonus) parts.push(`+${effect.attackPowerBonus} Attack Power`);
    if (effect.healingPower) parts.push(`+${effect.healingPower} Healing`);
    // Mana/healing regen
    if (effect.manaRegenBonus) parts.push(`+${effect.manaRegenBonus} Mana per tick`);
    if (effect.healingReceivedBonus) parts.push(`+${effect.healingReceivedBonus} HP per tick`);
    // Threat
    if (effect.threatReduction) parts.push(`-${effect.threatReduction}% Threat`);
    // Immunities and cleansing
    if (effect.fearImmunity) parts.push('Removes Fear/Charm/Sleep');
    if (effect.cleansesPoison) parts.push('Removes Poison');
    if (effect.cleansesDisease) parts.push('Removes Disease');
    return parts.join(', ') || 'Party buff';
  };

  return (
    <div className="app">
      <div className="background-overlay" />

      <header className="app-header">
        <h1>Classic WoW Raid Healing Simulator</h1>
        <span className="subtitle">Classic Era - Vanilla Only</span>
        <button
          className={`mobile-toggle-btn ${isMobileMode ? 'active' : ''}`}
          onClick={() => setIsMobileMode(!isMobileMode)}
          title={isMobileMode ? 'Switch to Desktop UI' : 'Switch to Phone UI'}
        >
          {isMobileMode ? '🖥️ Desktop' : '📱 Phone'}
        </button>
      </header>

      {/* DESKTOP UI */}
      {!isMobileMode && (
      <>
      <main className="app-main">
        {/* Left Panel - Player, Boss, Raid */}
        <div className="left-panel">
          {/* Player Frame */}
          <div className={`player-frame ${(state.playerMana / state.maxMana) < 0.20 ? 'low-mana' : ''}`}>
            <div className="player-portrait">
              <img
                src={state.playerClass === 'shaman'
                  ? "https://wow.zamimg.com/images/wow/icons/large/spell_nature_magicimmunity.jpg"
                  : "https://wow.zamimg.com/images/wow/icons/large/spell_holy_holybolt.jpg"}
                alt={state.playerClass === 'shaman' ? "Restoration Shaman" : "Holy Paladin"}
                className="player-class-icon"
              />
            </div>
            <div className="player-info">
              <div className="player-title">
                {isEditingName ? (
                  <input
                    type="text"
                    className="player-name-input"
                    value={editingNameValue}
                    onChange={e => setEditingNameValue(e.target.value)}
                    onBlur={() => {
                      if (editingNameValue.trim()) {
                        engine.setPlayerName(editingNameValue.trim());
                      }
                      setIsEditingName(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (editingNameValue.trim()) {
                          engine.setPlayerName(editingNameValue.trim());
                        }
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                    maxLength={12}
                  />
                ) : (
                  <span
                    className="player-name-editable"
                    onClick={() => {
                      if (!state.isRunning) {
                        setEditingNameValue(state.playerName);
                        setIsEditingName(true);
                      }
                    }}
                    title={!state.isRunning ? "Click to rename" : ""}
                    style={{ color: CLASS_COLORS[state.playerClass] }}
                  >
                    {state.playerName}
                  </span>
                )}
                <span className="player-class" style={{ color: CLASS_COLORS[state.playerClass] }}>
                  {state.playerClass === 'shaman' ? 'Restoration Shaman' : 'Holy Paladin'}
                </span>
                {state.playerClass === 'paladin' && state.divineFavorActive && <span className="divine-favor-active">Divine Favor!</span>}
                {state.playerClass === 'shaman' && state.naturesSwiftnessActive && <span className="divine-favor-active">Nature&apos;s Swiftness!</span>}
              </div>
              <div className="mana-bar-container">
                <div
                  className={`mana-bar ${
                    (state.playerMana / state.maxMana) < 0.15 ? 'critical' :
                    (state.playerMana / state.maxMana) < 0.30 ? 'warning' : ''
                  }`}
                  style={{ width: `${(state.playerMana / state.maxMana) * 100}%` }}
                />
                <div className="mana-text">
                  {Math.floor(state.playerMana)} / {state.maxMana}
                </div>
              </div>
              <div className="player-stats">
                <span>+{state.spellPower} SP</span>
                <span>{state.critChance.toFixed(1)}% Crit</span>
                <span>{Math.floor(engine.computePlayerStats().totalMp5)} MP5</span>
              </div>
              <div className="player-dkp">
                <span className="dkp-label">DKP:</span>
                <span className="dkp-value">{state.playerDKP.points}</span>
              </div>
            </div>
            {!state.isRunning && (
              <div className="save-load-buttons">
                <button className="save-btn" onClick={() => {
                  setSaveSlotName(state.playerName);
                  setShowSaveModal(true);
                }}>Save</button>
                <button className="load-btn" onClick={() => setShowLoadModal(true)}>Load</button>
                <button className="admin-btn" onClick={() => {
                  setSelectedAdminMemberId(state.playerId);
                  setShowAdminPanel(true);
                }}>Admin</button>
              </div>
            )}
          </div>

          {/* Phase Transition Alert */}
          {phaseAlert && (
            <div className="phase-alert">
              {phaseAlert}
            </div>
          )}

          {/* Boss Frame */}
          {state.boss && (
            <div className="boss-frame">
              <div className="boss-info">
                <div className="boss-name">
                  {state.boss.name}
                  {state.boss.currentPhase && state.boss.currentPhase > 1 && (
                    <span className="phase-indicator"> - Phase {state.boss.currentPhase}</span>
                  )}
                </div>
                <div className="boss-health-container">
                  <div
                    className="boss-health-bar"
                    style={{ width: `${(state.boss.currentHealth / state.boss.maxHealth) * 100}%` }}
                  />
                  <div className="boss-health-text">
                    {Math.floor((state.boss.currentHealth / state.boss.maxHealth) * 100)}%
                  </div>
                </div>
                <div className="boss-timer">
                  Time: {formatTime(state.elapsedTime)} | Enrage: {formatTime(state.boss.enrageTimer - state.elapsedTime)}
                </div>
              </div>
            </div>
          )}

          {/* Raid Grid - Organized by groups */}
          <div className="raid-grid-grouped">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(groupNum => {
                const groupMembers = state.raid.filter(m => m.group === groupNum);
                if (groupMembers.length === 0) return null;

                return (
                  <div key={groupNum} className="raid-grid-group">
                    <div className="raid-group-label">G{groupNum}</div>
                    <div className="raid-group-members">
                      {groupMembers.map(member => {
                        const healthPercent = (member.currentHealth / member.maxHealth) * 100;
                        const hasDispellable = member.debuffs.some(
                          d => d.type === 'magic' || d.type === 'poison' || d.type === 'disease'
                        );
                        const classColor = CLASS_COLORS[member.class];
                        const isPlayer = member.id === state.playerId;
                        const recentCritHeal = member.lastCritHealTime && (Date.now() - member.lastCritHealTime) < 500;

                        // Chain Heal bounce preview - show glow on targets that will receive bounces
                        const isChainHealBounceTarget = state.isCasting &&
                          state.castingSpell?.id.includes('chain_heal') &&
                          state.selectedTargetId &&
                          engine.getChainHealBounceTargets(state.selectedTargetId, state.castingSpell?.maxBounces || 2).includes(member.id);

                        return (
                          <div
                            key={member.id}
                            className={`raid-frame ${state.selectedTargetId === member.id ? 'selected' : ''} ${!member.isAlive ? 'dead' : ''} ${hasDispellable ? 'has-dispellable' : ''} ${isPlayer ? 'is-player' : ''} ${recentCritHeal ? 'crit-heal' : ''} ${isChainHealBounceTarget ? 'chain-heal-bounce' : ''}`}
                            onClick={() => {
                              if (state.isRunning) {
                                engine.selectTarget(member.id);
                              } else {
                                engine.inspectMember(member.id);
                              }
                            }}
                          >
                            <div className="class-indicator" style={{ backgroundColor: classColor }} />
                            <div className="member-name" style={{ color: classColor }}>
                              {member.name}
                              {isPlayer && <span className="you-indicator">YOU</span>}
                            </div>
                            <div className="health-bar-container">
                              <div
                                className="health-bar"
                                style={{
                                  width: `${healthPercent}%`,
                                  backgroundColor: healthPercent > 50 ? '#00cc00' : healthPercent > 25 ? '#cccc00' : '#cc0000',
                                }}
                              />
                              <div className="health-text">
                                {member.isAlive ? (
                                  <>
                                    <span>{Math.floor(member.currentHealth)}</span>
                                    {member.maxHealth - member.currentHealth > 0 && (
                                      <span className="missing-health">-{Math.floor(member.maxHealth - member.currentHealth)}</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="dead-text">DEAD</span>
                                )}
                              </div>
                            </div>
                            <div className="role-indicator">
                              {member.role === 'tank' && '🛡️'}
                              {member.role === 'healer' && '💚'}
                              {member.role === 'dps' && '⚔️'}
                            </div>
                            {member.debuffs.length > 0 && (
                              <div className="debuff-container">
                                {member.debuffs.slice(0, 3).map((debuff, idx) => (
                                  <div key={idx} className={`debuff-icon debuff-${debuff.type}`} title={debuff.name}>
                                    {Math.ceil(debuff.duration)}
                                  </div>
                                ))}
                              </div>
                            )}
                            {member.buffs.length > 0 && (
                              <div className="buff-container">
                                {member.buffs.filter(b => b.id.startsWith('aura_') || b.id.startsWith('shaman_totem_') || b.id.startsWith('totem_')).slice(0, 5).map((buff, idx) => (
                                  <img key={idx} src={buff.icon} alt={buff.name} className="aura-buff-icon" title={buff.name} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Manage Groups Button - Only show when not in encounter */}
            {!state.isRunning && (
              <button
                className="raid-management-btn"
                onClick={() => setShowRaidGroupManager(true)}
                title="Arrange raid members between groups to optimize party auras"
              >
                Manage Raid Groups
              </button>
            )}
        </div>

        {/* Center Panel */}
        <div className="center-panel">
          {/* Encounter Controls */}
          {!state.isRunning ? (
            <div className="encounter-select">
              <div className="encounter-header">
                {/* Raid Selector Dropdown */}
                <div className="raid-selector-container">
                  <select
                    className="raid-selector"
                    value={state.selectedRaidId}
                    onChange={(e) => engine.selectRaid(e.target.value)}
                  >
                    {RAIDS.map(raid => {
                      const defeatedCount = state.defeatedBossesByRaid[raid.id]?.length || 0;
                      const totalBosses = raid.encounters.length;
                      const progressText = defeatedCount > 0 ? ` (${defeatedCount}/${totalBosses})` : '';
                      return (
                        <option
                          key={raid.id}
                          value={raid.id}
                          disabled={!raid.available}
                        >
                          {raid.name}{progressText} {!raid.available && '(Coming Soon)'}
                        </option>
                      );
                    })}
                  </select>
                  <span className="raid-description">{engine.getCurrentRaid()?.description}</span>
                </div>
                <button
                  className="encounter-journal-btn"
                  onClick={() => {
                    const currentEncounters = engine.getCurrentRaidEncounters();
                    if (currentEncounters.length > 0) {
                      setSelectedJournalBoss(currentEncounters[0].id);
                      setShowEncounterJournal(true);
                    }
                  }}
                  title="View boss abilities"
                >
                  📖 Encounter Journal
                </button>
              </div>
              <div className="raid-progress">
                <span className="progress-label">Progress: {engine.getDefeatedBossesForCurrentRaid().length}/{engine.getCurrentRaidEncounters().length} bosses</span>
                {engine.getDefeatedBossesForCurrentRaid().length === engine.getCurrentRaidEncounters().length && engine.getCurrentRaidEncounters().length > 0 && (
                  <span className="raid-cleared">RAID CLEARED!</span>
                )}
              </div>
              <div className="encounter-buttons">
                <button
                  className="encounter-button training"
                  onClick={() => engine.startEncounter('training')}
                >
                  Training Dummy
                </button>
                {engine.getCurrentRaidEncounters().map((enc, idx) => {
                  const defeatedBosses = engine.getDefeatedBossesForCurrentRaid();
                  const raidEncounters = engine.getCurrentRaidEncounters();
                  const isDefeated = defeatedBosses.includes(enc.id);
                  const isNext = engine.getNextBoss() === enc.id;
                  // Check if previous boss is defeated (or this is the first boss)
                  const previousBossDefeated = idx === 0 || defeatedBosses.includes(raidEncounters[idx - 1].id);
                  const isLocked = !isDefeated && !previousBossDefeated;
                  return (
                    <button
                      key={enc.id}
                      className={`encounter-button ${isDefeated ? 'defeated' : ''} ${isNext ? 'next-boss' : ''} ${isLocked ? 'locked' : ''}`}
                      onClick={() => engine.startEncounter(enc.id)}
                      disabled={isDefeated || isLocked}
                      title={isDefeated ? 'Already defeated - reset raid to fight again' : isLocked ? `Must defeat ${raidEncounters[idx - 1].name} first` : ''}
                    >
                      <span className="boss-number">{idx + 1}.</span> {enc.name}
                      {isDefeated && <span className="defeated-marker">✓</span>}
                      {isLocked && <span className="locked-marker">🔒</span>}
                    </button>
                  );
                })}
              </div>
              <div className="raid-controls">
                {/* Faction Toggle */}
                <div className="faction-toggle">
                  <button
                    className={`faction-btn ${state.faction === 'alliance' ? 'active alliance' : ''}`}
                    onClick={() => engine.switchFaction('alliance')}
                    disabled={state.isRunning}
                    title="Play as Alliance Holy Paladin"
                  >
                    Alliance
                  </button>
                  <button
                    className={`faction-btn ${state.faction === 'horde' ? 'active horde' : ''}`}
                    onClick={() => engine.switchFaction('horde')}
                    disabled={state.isRunning}
                    title="Play as Horde Restoration Shaman"
                  >
                    Horde
                  </button>
                </div>
                <div className="raid-size-buttons">
                  <button
                    onClick={() => engine.resetRaid(20)}
                    disabled={state.defeatedBosses.length > 0}
                    title={state.defeatedBosses.length > 0 ? 'Cannot change raid size mid-lockout' : ''}
                  >
                    20-Man Raid
                  </button>
                  <button
                    onClick={() => engine.resetRaid(40)}
                    disabled={state.defeatedBosses.length > 0}
                    title={state.defeatedBosses.length > 0 ? 'Cannot change raid size mid-lockout' : ''}
                  >
                    40-Man Raid
                  </button>
                </div>
                <div className="raid-utility-buttons">
                  <button
                    className="restore-raid-btn"
                    onClick={() => engine.restoreRaid()}
                    title="Restore all raid members to full health and mana"
                  >
                    Restore Raid (Drink/Eat)
                  </button>
                  {state.defeatedBosses.length > 0 && (
                    <button
                      className="reset-lockout-btn"
                      onClick={() => engine.resetRaidLockout()}
                    >
                      Reset Raid (New Lockout)
                    </button>
                  )}
                </div>
              </div>
              <div className="healer-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={state.otherHealersEnabled}
                    onChange={() => engine.toggleOtherHealers()}
                  />
                  Other Healers Active
                </label>
                <span className="healer-count">
                  ({state.raid.filter(m => m.role === 'healer').length} healers in raid)
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="encounter-controls">
                <button className="stop-button" onClick={() => engine.stopEncounter()}>
                  Stop Encounter (ESC)
                </button>
              </div>
              <div className="scoreboard">
                <div className="score-item">
                  <span className="score-label">Your Healing</span>
                  <span className="score-value heal">{Math.floor(state.healingDone).toLocaleString()}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Overhealing</span>
                  <span className="score-value overheal">{Math.floor(state.overhealing).toLocaleString()}</span>
                </div>
                {state.otherHealersEnabled && (
                  <div className="score-item">
                    <span className="score-label">Other Healers</span>
                    <span className="score-value other-heal">{Math.floor(state.otherHealersHealing).toLocaleString()}</span>
                  </div>
                )}
                <div className="score-item">
                  <span className="score-label">Alive</span>
                  <span className="score-value">{state.raid.filter(m => m.isAlive).length} / {state.raid.length}</span>
                </div>
              </div>
            </>
          )}

          {/* Cast Bar */}
          {state.isCasting && state.castingSpell && (
            <div className="cast-bar-wrapper">
              <div className="cast-bar">
                <div className="cast-bar-fill" style={{ width: `${state.castProgress * 100}%` }} />
                <div className="cast-bar-text">
                  {state.castingSpell.name} - {((1 - state.castProgress) * state.castingSpell.castTime).toFixed(1)}s
                </div>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="action-bar-row">
            <div className="action-bar">
              {actionBar.map((spell, idx) => {
                const isOnCooldown = spell.currentCooldown > 0;
                const isOnGCD = state.globalCooldown > 0 && spell.isOnGlobalCooldown;
                const notEnoughMana = state.playerMana < spell.manaCost;
                const isDisabled = isOnCooldown || isOnGCD || notEnoughMana || state.isCasting;

                return (
                  <div
                    key={spell.id}
                    className={`spell-button ${isDisabled ? 'disabled' : ''} ${spell.id === 'divine_favor' && state.divineFavorActive ? 'active' : ''}`}
                    onClick={() => !isDisabled && engine.castSpell(spell)}
                    onMouseEnter={() => !state.isRunning && setHoveredSpell(spell)}
                    onMouseLeave={() => setHoveredSpell(null)}
                  >
                    <img src={spell.icon} alt={spell.name} />
                    <div className="spell-keybind">{idx + 1}</div>
                    {isOnCooldown && (
                      <div className="cooldown-overlay">
                        <span>{Math.ceil(spell.currentCooldown)}</span>
                      </div>
                    )}
                    {notEnoughMana && !isOnCooldown && (
                      <div className="no-mana-overlay" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mana Potion */}
            <div
              className={`spell-button mana-potion ${state.manaPotionCooldown > 0 ? 'disabled' : ''}`}
              onClick={() => engine.useManaPotion()}
              title="Major Mana Potion (M)"
            >
              <img src="https://wow.zamimg.com/images/wow/icons/large/inv_potion_76.jpg" alt="Mana Potion" />
              <div className="spell-keybind">M</div>
              {state.manaPotionCooldown > 0 && (
                <div className="cooldown-overlay">
                  <span>{Math.ceil(state.manaPotionCooldown)}</span>
                </div>
              )}
            </div>

            {/* Bag/Inventory Button */}
            {!state.isRunning && (
              <div
                className={`spell-button bag-button ${state.legendaryMaterials.length > 0 ? 'has-items' : ''}`}
                onClick={() => setShowInventory(true)}
                title="Open Bags (B)"
              >
                <img src="https://wow.zamimg.com/images/wow/icons/large/inv_misc_bag_07_green.jpg" alt="Bags" />
                <div className="spell-keybind">B</div>
                {state.legendaryMaterials.length > 0 && (
                  <div className="bag-item-count">{state.legendaryMaterials.length}</div>
                )}
              </div>
            )}
          </div>

          {/* Totem Bar - Only shown for Shaman */}
          {state.playerClass === 'shaman' && (
            <div className="totem-bar">
              {(['earth', 'fire', 'water', 'air'] as TotemElement[]).map(element => {
                const activeTotem = state.activeTotems.find(t => t.element === element);
                const availableTotems = TOTEMS_BY_ELEMENT[element];

                return (
                  <div key={element} className={`totem-element-group ${element}`}>
                    <div className="totem-element-label">{element.charAt(0).toUpperCase() + element.slice(1)}</div>
                    <div className="totem-buttons">
                      {availableTotems.map(totem => {
                        const isActive = activeTotem?.id === totem.id;
                        const cooldown = state.totemCooldowns.find(tc => tc.totemId === totem.id);
                        const isOnCooldown = cooldown && cooldown.remainingCooldown > 0;
                        const notEnoughMana = state.playerMana < totem.manaCost;
                        const isOnGCD = state.globalCooldown > 0;
                        const isDisabled = isOnCooldown || notEnoughMana || isOnGCD || state.isCasting;

                        return (
                          <div
                            key={totem.id}
                            className={`totem-button ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => !isDisabled && engine.dropTotem(totem.id)}
                            title={`${totem.name} - ${totem.manaCost} mana${totem.cooldown > 0 ? ` (${totem.cooldown}s CD)` : ''}`}
                          >
                            <img src={totem.icon} alt={totem.name} />
                            {isActive && activeTotem && (
                              <div className="totem-duration">{Math.ceil(activeTotem.remainingDuration)}s</div>
                            )}
                            {isOnCooldown && cooldown && (
                              <div className="cooldown-overlay">
                                <span>{Math.ceil(cooldown.remainingCooldown)}</span>
                              </div>
                            )}
                            {notEnoughMana && !isOnCooldown && (
                              <div className="no-mana-overlay" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Spell Tooltip - Shows when hovering over action bar spells (out of encounter) */}
          {hoveredSpell && !state.isRunning && (
            <div className="spell-tooltip">
              <div className="spell-tooltip-header">
                <img src={hoveredSpell.icon} alt={hoveredSpell.name} className="spell-tooltip-icon" />
                <div className="spell-tooltip-title">
                  <span className="spell-tooltip-name">{hoveredSpell.name}</span>
                  {hoveredSpell.rank && <span className="spell-tooltip-rank">Rank {hoveredSpell.rank}</span>}
                </div>
              </div>
              <div className="spell-tooltip-stats">
                {hoveredSpell.manaCost > 0 && (
                  <div className="spell-stat">
                    <span className="stat-value mana">{hoveredSpell.manaCost}</span> Mana
                  </div>
                )}
                {hoveredSpell.range && hoveredSpell.range > 0 && (
                  <div className="spell-stat">
                    <span className="stat-value">{hoveredSpell.range}</span> yd range
                  </div>
                )}
                <div className="spell-stat">
                  {hoveredSpell.castTime > 0 ? (
                    <><span className="stat-value">{hoveredSpell.castTime}</span> sec cast</>
                  ) : (
                    <span className="stat-value instant">Instant</span>
                  )}
                </div>
                {hoveredSpell.cooldown > 0 && (
                  <div className="spell-stat">
                    <span className="stat-value cooldown">{hoveredSpell.cooldown}</span> sec cooldown
                  </div>
                )}
              </div>
              <div className="spell-tooltip-description">
                {SPELL_TOOLTIPS[hoveredSpell.id]?.description || 'No description available.'}
              </div>
              {hoveredSpell.healAmount.min > 0 && (
                <div className="spell-tooltip-healing">
                  Base Healing: <span className="heal-value">{hoveredSpell.healAmount.min} - {hoveredSpell.healAmount.max}</span>
                  <br />
                  <span className="coefficient">+{(hoveredSpell.spellPowerCoefficient * 100).toFixed(0)}% of Spell Power</span>
                </div>
              )}
              {SPELL_TOOLTIPS[hoveredSpell.id]?.additionalInfo && (
                <div className="spell-tooltip-info">
                  {SPELL_TOOLTIPS[hoveredSpell.id].additionalInfo}
                </div>
              )}
            </div>
          )}

          {/* Player Buffs Panel - Only show when not in encounter */}
          {!state.isRunning && (
            <div className="player-buffs-panel">
              <div className="buffs-header">
                <span>Raid Buffs</span>
                <div className="buff-actions">
                  <button className="buff-all-btn" onClick={() => engine.applyAllRaidBuffs()}>
                    Buff All
                  </button>
                  <button className="clear-buffs-btn" onClick={() => engine.clearAllRaidBuffs()}>
                    Clear
                  </button>
                </div>
              </div>

              {/* Paladin Blessings Section - Only show for Alliance (Horde has no Paladins) */}
              {state.faction === 'alliance' && (
                <div className="paladin-blessings-section">
                  <div className="blessings-header">
                    <span>Paladin Blessings</span>
                    <span className="blessing-slots">
                      ({state.activePaladinBlessings.length}/{state.maxPaladinBlessings} slots)
                    </span>
                  </div>
                  <div className="blessings-grid">
                    {engine.getPaladinBlessings().map(({ buff, isAssigned, isApplied }) => (
                      <div
                        key={buff.id}
                        className={`blessing-slot ${isAssigned ? 'assigned' : ''} ${isApplied ? 'applied' : ''}`}
                        onClick={() => engine.togglePaladinBlessing(buff.id)}
                        title={`${buff.name}${isAssigned ? ' (Assigned)' : ' (Click to assign)'}`}
                      >
                        <img src={buff.icon} alt={buff.name} />
                        <span className="blessing-name">{buff.name.replace('Greater Blessing of ', '')}</span>
                        {isAssigned && <div className="blessing-assigned-check">✓</div>}
                        {isApplied && <div className="blessing-applied-indicator" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Raid Buffs */}
              <div className="other-buffs-section">
                <span className="other-buffs-header">Other Raid Buffs</span>
                <div className="buffs-grid">
                  {engine.getAvailableBuffs().map(({ buff, available, hasBuff }) => (
                    <div
                      key={buff.id}
                      className={`buff-slot ${hasBuff ? 'active' : ''} ${!available ? 'unavailable' : ''}`}
                      onClick={() => {
                        if (available) {
                          if (hasBuff) {
                            engine.removeRaidBuff(buff.id);
                          } else {
                            engine.applyRaidBuff(buff.id);
                          }
                        }
                      }}
                      title={`${buff.name}${!available ? ' (No caster in raid)' : ''}`}
                    >
                      <img src={buff.icon} alt={buff.name} />
                      {hasBuff && <div className="buff-active-indicator" />}
                      {!available && <div className="buff-unavailable-overlay" />}
                    </div>
                  ))}
                </div>
              </div>

              {state.playerBuffs.length > 0 && (
                <div className="active-buffs-display">
                  <span className="active-buffs-label">Active ({state.playerBuffs.length}):</span>
                  {state.playerBuffs.map(buff => (
                    <div key={buff.id} className="active-buff-icon" title={buff.name}>
                      <img src={buff.icon} alt={buff.name} />
                    </div>
                  ))}
                </div>
              )}

              {/* Consumables Section */}
              <div className="consumables-section">
                <div className="consumables-header">
                  <span>Consumables</span>
                  <div className="consumables-actions">
                    <button
                      className={`consumables-btn ${engine.hasActiveConsumables() ? 'active' : ''}`}
                      onClick={() => engine.applyConsumables()}
                    >
                      Use All
                    </button>
                    <button
                      className="consumables-clear-btn"
                      onClick={() => engine.clearConsumables()}
                      disabled={!engine.hasActiveConsumables()}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="consumables-grid">
                  {Object.values(CONSUMABLES)
                    .filter(c => c.role === 'healer')
                    .map(consume => {
                      const isActive = state.activeConsumables.includes(consume.id);
                      return (
                        <div
                          key={consume.id}
                          className={`consumable-slot ${isActive ? 'active' : ''}`}
                          title={consume.name}
                        >
                          <img src={consume.icon} alt={consume.name} />
                          {isActive && <div className="consumable-active-indicator" />}
                        </div>
                      );
                    })}
                </div>
                <div className="consumables-note">
                  Using consumables auto-buffs raid with role-appropriate consumes
                </div>
              </div>

              {/* World Buffs Section */}
              <div className="world-buffs-section">
                <div className="world-buffs-header">
                  <span>World Buffs</span>
                  <button
                    className="world-buffs-clear-btn"
                    onClick={() => engine.clearWorldBuffs()}
                    disabled={state.activeWorldBuffs.length === 0}
                  >
                    Clear
                  </button>
                </div>
                <div className="world-buffs-grid">
                  {engine.getWorldBuffStatus().map(({ buff, isAvailable, isActive, isComingSoon }) => (
                    <div
                      key={buff.id}
                      className={`world-buff-slot ${isComingSoon ? 'coming-soon' : ''} ${isActive ? 'active' : ''} ${!isAvailable && !isComingSoon ? 'locked' : ''}`}
                      onClick={() => {
                        if (!isComingSoon && isAvailable) {
                          if (isActive) {
                            engine.clearWorldBuffs();
                          } else {
                            engine.applyWorldBuff(buff.id);
                          }
                        }
                      }}
                      title={buff.name}
                    >
                      <img src={buff.icon} alt={buff.name} />
                      <span className="world-buff-name">{buff.name.replace(' of the Dragonslayer', '').replace("Warchief's ", 'WC ')}</span>
                      {isActive && <div className="world-buff-active-indicator" />}
                      {isComingSoon && (
                        <div className="coming-soon-overlay">
                          <span className="coming-soon-text">Coming Soon</span>
                          <span className="raid-name">{buff.unlockRaid}</span>
                        </div>
                      )}
                      {!isComingSoon && !isAvailable && (
                        <div className="locked-overlay">
                          <span className="locked-icon">🔒</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Combat Log */}
        <div className="right-panel">
          <div className="combat-log">
            <div className="combat-log-header">Combat Log</div>
            <div className="combat-log-entries">
              {state.combatLog.map((entry, idx) => (
                <div key={idx} className={`log-entry log-${entry.type}`}>
                  <span className="log-time">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                  <span className={`log-message ${entry.isCrit ? 'crit' : ''}`}>{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="tips">
          <span className="tip">Use Holy Light for tank healing, Flash of Light for efficiency</span>
          <span className="tip">Apply Blessing of Light before big damage phases</span>
          <span className="tip">Save Divine Favor + Holy Light for emergency tank saves</span>
        </div>
      </footer>
      </>
      )}

      {/* MOBILE UI */}
      {isMobileMode && (
        <div className="mobile-ui">
          {/* Mobile Header with Player Info */}
          <div className="mobile-player-header">
            <div className="mobile-player-info">
              <img
                src={state.playerClass === 'shaman'
                  ? "https://wow.zamimg.com/images/wow/icons/large/spell_nature_magicimmunity.jpg"
                  : "https://wow.zamimg.com/images/wow/icons/large/spell_holy_holybolt.jpg"}
                alt={state.playerClass === 'shaman' ? "Shaman" : "Paladin"}
                className="mobile-class-icon"
              />
              <div className="mobile-player-details">
                <span className="mobile-player-name" style={{ color: CLASS_COLORS[state.playerClass] }}>
                  {state.playerName}
                </span>
                <span className="mobile-player-class">
                  {state.playerClass === 'shaman' ? 'Resto Shaman' : 'Holy Paladin'}
                </span>
              </div>
              <div className="mobile-dkp">
                <span className="dkp-value">{state.playerDKP.points}</span>
                <span className="dkp-label">DKP</span>
              </div>
            </div>
            <div className="mobile-mana-bar">
              <div
                className={`mobile-mana-fill ${
                  (state.playerMana / state.maxMana) < 0.15 ? 'critical' :
                  (state.playerMana / state.maxMana) < 0.30 ? 'warning' : ''
                }`}
                style={{ width: `${(state.playerMana / state.maxMana) * 100}%` }}
              />
              <span className="mobile-mana-text">{Math.floor(state.playerMana)} / {state.maxMana}</span>
            </div>
            <div className="mobile-player-stats">
              <span>+{state.spellPower} SP</span>
              <span>{state.critChance.toFixed(1)}% Crit</span>
              <span>{Math.floor(engine.computePlayerStats().totalMp5)} MP5</span>
            </div>
          </div>

          {/* Phase Alert */}
          {phaseAlert && (
            <div className="mobile-phase-alert">{phaseAlert}</div>
          )}

          {/* Boss Frame (when in encounter) */}
          {state.boss && (
            <div className="mobile-boss-frame">
              <div className="mobile-boss-name">
                {state.boss.name}
                {state.boss.currentPhase && state.boss.currentPhase > 1 && (
                  <span className="phase-indicator"> P{state.boss.currentPhase}</span>
                )}
              </div>
              <div className="mobile-boss-health-bar">
                <div
                  className="mobile-boss-health-fill"
                  style={{ width: `${(state.boss.currentHealth / state.boss.maxHealth) * 100}%` }}
                />
                <span className="mobile-boss-health-text">
                  {Math.floor((state.boss.currentHealth / state.boss.maxHealth) * 100)}%
                </span>
              </div>
              <div className="mobile-boss-timer">
                {formatTime(state.elapsedTime)} | Enrage: {formatTime(state.boss.enrageTimer - state.elapsedTime)}
              </div>
            </div>
          )}

          {/* Cast Bar */}
          {state.isCasting && state.castingSpell && (
            <div className="mobile-cast-bar">
              <div className="mobile-cast-fill" style={{ width: `${state.castProgress * 100}%` }} />
              <span className="mobile-cast-text">
                {state.castingSpell.name} - {((1 - state.castProgress) * state.castingSpell.castTime).toFixed(1)}s
              </span>
            </div>
          )}

          {/* Mobile Tab Navigation */}
          <div className="mobile-tabs">
            <button
              className={`mobile-tab ${mobileTab === 'raid' ? 'active' : ''}`}
              onClick={() => setMobileTab('raid')}
            >
              Raid
            </button>
            <button
              className={`mobile-tab ${mobileTab === 'buffs' ? 'active' : ''}`}
              onClick={() => setMobileTab('buffs')}
              disabled={state.isRunning}
            >
              Buffs
            </button>
            <button
              className={`mobile-tab ${mobileTab === 'log' ? 'active' : ''}`}
              onClick={() => setMobileTab('log')}
            >
              Log
            </button>
          </div>

          {/* Mobile Content Area */}
          <div className="mobile-content">
            {/* Raid Tab - Raid Frames */}
            {mobileTab === 'raid' && (
              <div className="mobile-raid-container">
                {/* Encounter Controls (when not running) */}
                {!state.isRunning && (
                  <div className="mobile-encounter-controls">
                    <div className="mobile-raid-selector">
                      <select
                        value={state.selectedRaidId}
                        onChange={(e) => engine.selectRaid(e.target.value)}
                      >
                        {RAIDS.map(raid => {
                          const defeatedCount = state.defeatedBossesByRaid[raid.id]?.length || 0;
                          const totalBosses = raid.encounters.length;
                          return (
                            <option key={raid.id} value={raid.id} disabled={!raid.available}>
                              {raid.name} ({defeatedCount}/{totalBosses})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="mobile-boss-buttons">
                      <button
                        className="mobile-boss-btn training"
                        onClick={() => engine.startEncounter('training')}
                      >
                        Training
                      </button>
                      {engine.getCurrentRaidEncounters().map((enc, idx) => {
                        const defeatedBosses = engine.getDefeatedBossesForCurrentRaid();
                        const raidEncounters = engine.getCurrentRaidEncounters();
                        const isDefeated = defeatedBosses.includes(enc.id);
                        const previousBossDefeated = idx === 0 || defeatedBosses.includes(raidEncounters[idx - 1].id);
                        const isLocked = !isDefeated && !previousBossDefeated;
                        return (
                          <button
                            key={enc.id}
                            className={`mobile-boss-btn ${isDefeated ? 'defeated' : ''} ${isLocked ? 'locked' : ''}`}
                            onClick={() => engine.startEncounter(enc.id)}
                            disabled={isDefeated || isLocked}
                          >
                            {idx + 1}. {enc.name.split(' ')[0]}
                            {isDefeated && ' ✓'}
                            {isLocked && ' 🔒'}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mobile-raid-controls">
                      <div className="mobile-faction-toggle">
                        <button
                          className={`mobile-faction-btn ${state.faction === 'alliance' ? 'active' : ''}`}
                          onClick={() => engine.switchFaction('alliance')}
                        >
                          Alliance
                        </button>
                        <button
                          className={`mobile-faction-btn ${state.faction === 'horde' ? 'active' : ''}`}
                          onClick={() => engine.switchFaction('horde')}
                        >
                          Horde
                        </button>
                      </div>
                      <div className="mobile-utility-buttons">
                        <button onClick={() => engine.restoreRaid()}>Restore</button>
                        <button onClick={() => setShowRaidGroupManager(true)}>Groups</button>
                        <button onClick={() => setShowSaveModal(true)}>Save</button>
                        <button onClick={() => setShowLoadModal(true)}>Load</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Running Encounter Stats */}
                {state.isRunning && (
                  <div className="mobile-encounter-stats">
                    <div className="mobile-stat">
                      <span className="stat-label">Healing</span>
                      <span className="stat-value heal">{Math.floor(state.healingDone).toLocaleString()}</span>
                    </div>
                    <div className="mobile-stat">
                      <span className="stat-label">Overheal</span>
                      <span className="stat-value overheal">{Math.floor(state.overhealing).toLocaleString()}</span>
                    </div>
                    <div className="mobile-stat">
                      <span className="stat-label">Alive</span>
                      <span className="stat-value">{state.raid.filter(m => m.isAlive).length}/{state.raid.length}</span>
                    </div>
                    <button className="mobile-stop-btn" onClick={() => engine.stopEncounter()}>
                      Stop
                    </button>
                  </div>
                )}

                {/* Mobile Raid Frames - Compact Grid */}
                <div className="mobile-raid-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(groupNum => {
                    const groupMembers = state.raid.filter(m => m.group === groupNum);
                    if (groupMembers.length === 0) return null;

                    return (
                      <div key={groupNum} className="mobile-raid-group">
                        <div className="mobile-group-label">G{groupNum}</div>
                        <div className="mobile-group-members">
                          {groupMembers.map(member => {
                            const healthPercent = (member.currentHealth / member.maxHealth) * 100;
                            const hasDispellable = member.debuffs.some(
                              d => d.type === 'magic' || d.type === 'poison' || d.type === 'disease'
                            );
                            const isPlayer = member.id === state.playerId;
                            const isChainHealBounce = state.isCasting &&
                              state.castingSpell?.id.includes('chain_heal') &&
                              state.selectedTargetId &&
                              engine.getChainHealBounceTargets(state.selectedTargetId, state.castingSpell?.maxBounces || 2).includes(member.id);

                            return (
                              <div
                                key={member.id}
                                className={`mobile-raid-frame ${state.selectedTargetId === member.id ? 'selected' : ''} ${!member.isAlive ? 'dead' : ''} ${hasDispellable ? 'dispellable' : ''} ${isPlayer ? 'is-player' : ''} ${isChainHealBounce ? 'chain-bounce' : ''}`}
                                onClick={() => {
                                  if (state.isRunning) {
                                    engine.selectTarget(member.id);
                                  } else {
                                    engine.inspectMember(member.id);
                                  }
                                }}
                              >
                                <div
                                  className="mobile-frame-health"
                                  style={{
                                    width: `${healthPercent}%`,
                                    backgroundColor: healthPercent > 50 ? '#00cc00' : healthPercent > 25 ? '#cccc00' : '#cc0000',
                                  }}
                                />
                                <div className="mobile-frame-content">
                                  <span
                                    className="mobile-frame-name"
                                    style={{ color: CLASS_COLORS[member.class] }}
                                  >
                                    {member.name.substring(0, 6)}
                                    {isPlayer && <span className="you-tag">★</span>}
                                  </span>
                                  <span className="mobile-frame-hp">
                                    {member.isAlive ? Math.floor(member.currentHealth) : 'DEAD'}
                                  </span>
                                </div>
                                {member.debuffs.length > 0 && (
                                  <div className="mobile-debuff-indicator" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Action Bar - Right under raid frames */}
                <div className="mobile-action-bar-inline">
                  {actionBar.slice(0, 6).map((spell) => {
                    const isOnCooldown = spell.currentCooldown > 0;
                    const isOnGCD = state.globalCooldown > 0 && spell.isOnGlobalCooldown;
                    const notEnoughMana = state.playerMana < spell.manaCost;
                    const isDisabled = isOnCooldown || isOnGCD || notEnoughMana || state.isCasting;

                    return (
                      <div
                        key={spell.id}
                        className={`mobile-spell ${isDisabled ? 'disabled' : ''}`}
                        onClick={() => !isDisabled && engine.castSpell(spell)}
                      >
                        <img src={spell.icon} alt={spell.name} />
                        {isOnCooldown && (
                          <div className="mobile-cooldown">{Math.ceil(spell.currentCooldown)}</div>
                        )}
                        {notEnoughMana && !isOnCooldown && (
                          <div className="mobile-no-mana" />
                        )}
                      </div>
                    );
                  })}
                  {/* Mana Potion */}
                  <div
                    className={`mobile-spell ${state.manaPotionCooldown > 0 ? 'disabled' : ''}`}
                    onClick={() => engine.useManaPotion()}
                  >
                    <img src="https://wow.zamimg.com/images/wow/icons/large/inv_potion_76.jpg" alt="Mana Potion" />
                    {state.manaPotionCooldown > 0 && (
                      <div className="mobile-cooldown">{Math.ceil(state.manaPotionCooldown)}</div>
                    )}
                  </div>
                </div>

                {/* Mobile Totem Bar - Right under action bar (Shaman only) */}
                {state.playerClass === 'shaman' && (
                  <div className="mobile-totem-bar-inline">
                    {(['earth', 'fire', 'water', 'air'] as TotemElement[]).map(element => {
                      const activeTotem = state.activeTotems.find(t => t.element === element);
                      const availableTotems = TOTEMS_BY_ELEMENT[element];
                      const elementColors: Record<TotemElement, string> = {
                        earth: '#8B4513',
                        fire: '#FF4500',
                        water: '#1E90FF',
                        air: '#87CEEB'
                      };

                      return (
                        <div key={element} className="mobile-totem-element-inline" style={{ borderColor: elementColors[element] }}>
                          <div className="mobile-totem-label-inline" style={{ color: elementColors[element] }}>
                            {element.charAt(0).toUpperCase()}
                          </div>
                          <div className="mobile-totem-buttons-inline">
                            {availableTotems.slice(0, 3).map(totem => {
                              const isActive = activeTotem?.id === totem.id;
                              const cooldown = state.totemCooldowns.find(tc => tc.totemId === totem.id);
                              const isOnCooldown = cooldown && cooldown.remainingCooldown > 0;
                              const notEnoughMana = state.playerMana < totem.manaCost;
                              const isDisabled = isOnCooldown || notEnoughMana || state.globalCooldown > 0 || state.isCasting;

                              return (
                                <div
                                  key={totem.id}
                                  className={`mobile-totem-inline ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                                  onClick={() => !isDisabled && engine.dropTotem(totem.id)}
                                >
                                  <img src={totem.icon} alt={totem.name} />
                                  {isActive && activeTotem && (
                                    <div className="mobile-totem-timer-inline">{Math.ceil(activeTotem.remainingDuration)}</div>
                                  )}
                                  {isOnCooldown && cooldown && (
                                    <div className="mobile-cooldown">{Math.ceil(cooldown.remainingCooldown)}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Buffs Tab */}
            {mobileTab === 'buffs' && !state.isRunning && (
              <div className="mobile-buffs-container">
                {/* Paladin Blessings (Alliance only) */}
                {state.faction === 'alliance' && (
                  <div className="mobile-section">
                    <div className="mobile-section-header">
                      Blessings ({state.activePaladinBlessings.length}/{state.maxPaladinBlessings})
                    </div>
                    <div className="mobile-blessings-grid">
                      {engine.getPaladinBlessings().map(({ buff, isAssigned }) => (
                        <div
                          key={buff.id}
                          className={`mobile-blessing ${isAssigned ? 'active' : ''}`}
                          onClick={() => engine.togglePaladinBlessing(buff.id)}
                        >
                          <img src={buff.icon} alt={buff.name} />
                          {isAssigned && <div className="mobile-check">✓</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raid Buffs */}
                <div className="mobile-section">
                  <div className="mobile-section-header">
                    Raid Buffs
                    <button className="mobile-buff-all" onClick={() => engine.applyAllRaidBuffs()}>All</button>
                  </div>
                  <div className="mobile-buffs-grid">
                    {engine.getAvailableBuffs().map(({ buff, available, hasBuff }) => (
                      <div
                        key={buff.id}
                        className={`mobile-buff ${hasBuff ? 'active' : ''} ${!available ? 'unavailable' : ''}`}
                        onClick={() => {
                          if (available) {
                            if (hasBuff) engine.removeRaidBuff(buff.id);
                            else engine.applyRaidBuff(buff.id);
                          }
                        }}
                      >
                        <img src={buff.icon} alt={buff.name} />
                        {hasBuff && <div className="mobile-check">✓</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consumables */}
                <div className="mobile-section">
                  <div className="mobile-section-header">
                    Consumables
                    <button className="mobile-buff-all" onClick={() => engine.applyConsumables()}>All</button>
                  </div>
                  <div className="mobile-buffs-grid">
                    {Object.values(CONSUMABLES)
                      .filter(c => c.role === 'healer')
                      .map(consume => {
                        const isActive = state.activeConsumables.includes(consume.id);
                        return (
                          <div
                            key={consume.id}
                            className={`mobile-buff ${isActive ? 'active' : ''}`}
                          >
                            <img src={consume.icon} alt={consume.name} />
                            {isActive && <div className="mobile-check">✓</div>}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* World Buffs */}
                <div className="mobile-section">
                  <div className="mobile-section-header">World Buffs</div>
                  <div className="mobile-buffs-grid">
                    {engine.getWorldBuffStatus().map(({ buff, isAvailable, isActive, isComingSoon }) => (
                      <div
                        key={buff.id}
                        className={`mobile-buff ${isActive ? 'active' : ''} ${!isAvailable || isComingSoon ? 'unavailable' : ''}`}
                        onClick={() => {
                          if (!isComingSoon && isAvailable) {
                            if (isActive) engine.clearWorldBuffs();
                            else engine.applyWorldBuff(buff.id);
                          }
                        }}
                      >
                        <img src={buff.icon} alt={buff.name} />
                        {isActive && <div className="mobile-check">✓</div>}
                        {isComingSoon && <div className="mobile-lock">🔒</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Log Tab */}
            {mobileTab === 'log' && (
              <div className="mobile-log-container">
                {state.combatLog.slice(-50).map((entry, idx) => (
                  <div key={idx} className={`mobile-log-entry log-${entry.type}`}>
                    <span className="mobile-log-time">
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`mobile-log-msg ${entry.isCrit ? 'crit' : ''}`}>{entry.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loot Modal */}
      {state.showLootModal && (
        <div className="modal-overlay">
          <div className="loot-modal">
            <div className="loot-modal-header">
              <h2>Loot Dropped!</h2>
              <span className="dkp-display">Your DKP: {state.playerDKP.points}</span>
            </div>
            <div className="loot-items">
              {state.pendingLoot.map(item => {
                const cost = calculateDKPCost(item);
                const canAfford = state.playerDKP.points >= cost;
                const playerClass = state.faction === 'alliance' ? 'paladin' : 'shaman';
                const canEquip = item.classes.includes(playerClass) || item.classes.includes('all');

                return (
                  <div key={item.id} className="loot-item">
                    <div className="loot-item-icon">
                      <img src={item.icon} alt={item.name} />
                    </div>
                    <div className="loot-item-info">
                      <div className="loot-item-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                        {item.name}
                      </div>
                      <div className="loot-item-slot">{item.slot} - iLvl {item.itemLevel}</div>
                      <div className="loot-item-stats">
                        {item.stats.intellect && <span>+{item.stats.intellect} Int</span>}
                        {item.stats.stamina && <span>+{item.stats.stamina} Sta</span>}
                        {item.stats.spellPower && <span>+{item.stats.spellPower} SP</span>}
                        {item.stats.healingPower && <span>+{item.stats.healingPower} Healing</span>}
                        {item.stats.mp5 && <span>+{item.stats.mp5} MP5</span>}
                        {item.stats.critChance && <span>+{item.stats.critChance}% Crit</span>}
                      </div>
                      {!canEquip && <div className="loot-item-warning">Cannot equip ({playerClass === 'paladin' ? 'Paladin' : 'Shaman'} cannot use)</div>}
                    </div>
                    <div className="loot-item-actions">
                      <div className="loot-item-cost">{cost} DKP</div>
                      <button
                        className="claim-btn"
                        disabled={!canAfford || !canEquip}
                        onClick={() => engine.claimLoot(item.id)}
                      >
                        Claim
                      </button>
                      <button
                        className="pass-btn"
                        onClick={() => engine.passLoot(item.id)}
                      >
                        Pass
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="loot-modal-footer">
              <button className="close-btn" onClick={() => engine.closeLootModal()}>
                Close (Pass All)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Panel */}
      {state.inspectedMember && (
        <div className="modal-overlay" onClick={() => engine.closeInspection()}>
          <div className="inspection-panel" onClick={e => e.stopPropagation()}>
            <div className="inspection-header">
              <h2 style={{ color: CLASS_COLORS[state.inspectedMember.class] }}>
                {state.inspectedMember.name}
              </h2>
              <span className="inspection-class">{state.inspectedMember.class.charAt(0).toUpperCase() + state.inspectedMember.class.slice(1)}</span>
              <span className="inspection-role">{state.inspectedMember.role}</span>
              <button className="close-inspection" onClick={() => engine.closeInspection()}>X</button>
            </div>
            <div className="inspection-gear-score">
              Gear Score: {state.inspectedMember.gearScore}
            </div>
            <div className="inspection-equipment">
              {(['head', 'shoulders', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'weapon'] as EquipmentSlot[]).map(slot => {
                const item = state.inspectedMember!.equipment[slot];
                return (
                  <div key={slot} className="equipment-slot">
                    <span className="slot-name">{slot.charAt(0).toUpperCase() + slot.slice(1)}:</span>
                    {item ? (
                      <span className="slot-item" style={{ color: RARITY_COLORS[item.rarity] }}>
                        {item.name}
                      </span>
                    ) : (
                      <span className="slot-empty">Empty</span>
                    )}
                  </div>
                );
              })}
            </div>
            {state.inspectedMember.role === 'healer' && (
              <div className="inspection-stats">
                <h3>Healer Stats</h3>
                <div className="stat-row">
                  <span>Bonus HPS from Gear:</span>
                  <span>+{(state.inspectedMember.gearScore * 0.5).toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="save-modal" onClick={e => e.stopPropagation()}>
            <div className="save-modal-header">
              <h2>Save Game</h2>
              <button className="close-inspection" onClick={() => setShowSaveModal(false)}>X</button>
            </div>
            <div className="save-modal-content">
              <label className="save-name-label">
                Save Name:
                <input
                  type="text"
                  className="save-name-input"
                  value={saveSlotName}
                  onChange={e => setSaveSlotName(e.target.value)}
                  placeholder="Enter save name..."
                  maxLength={20}
                  autoFocus
                />
              </label>
              <div className="save-modal-actions">
                <button
                  className="save-confirm-btn"
                  disabled={!saveSlotName.trim()}
                  onClick={() => {
                    if (saveSlotName.trim()) {
                      engine.saveGame(saveSlotName.trim());
                      setShowSaveModal(false);
                      setSaveSlotName('');
                    }
                  }}
                >
                  Save
                </button>
                <button className="save-cancel-btn" onClick={() => setShowSaveModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
            {engine.listSaves().length > 0 && (
              <div className="existing-saves">
                <h3>Existing Saves</h3>
                <div className="saves-list">
                  {engine.listSaves().map(saveName => {
                    const info = engine.getSaveInfo(saveName);
                    return (
                      <div
                        key={saveName}
                        className="save-slot-item"
                        onClick={() => setSaveSlotName(saveName)}
                      >
                        <span className="save-slot-name">{saveName}</span>
                        {info && (
                          <span className="save-slot-info">
                            {info.playerName} - {new Date(info.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Export to File Section */}
            <div className="export-section">
              <h3>Export to File</h3>
              <p className="export-description">Export all saves to a backup file you can share or import later.</p>
              {importExportStatus && (
                <div className={`import-export-status ${importExportStatus.type}`}>
                  {importExportStatus.type === 'success' ? '✓' : '✗'} {importExportStatus.message}
                </div>
              )}
              <label className="export-name-label">
                File Name (optional):
                <input
                  type="text"
                  className="export-name-input"
                  value={exportFileName}
                  onChange={e => setExportFileName(e.target.value)}
                  placeholder={`wow-healer-saves-${new Date().toISOString().split('T')[0]}`}
                  maxLength={50}
                />
              </label>
              <button
                className="export-btn"
                onClick={() => {
                  const count = engine.listSaves().length;
                  engine.exportSavesToFile(exportFileName || undefined);
                  setImportExportStatus({ message: `Exported ${count} save(s) to file!`, type: 'success' });
                  setExportFileName('');
                  setTimeout(() => setImportExportStatus(null), 4000);
                }}
                disabled={engine.listSaves().length === 0}
              >
                Export All Saves
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="load-modal" onClick={e => e.stopPropagation()}>
            <div className="load-modal-header">
              <h2>Load Game</h2>
              <button className="close-inspection" onClick={() => setShowLoadModal(false)}>X</button>
            </div>
            <div className="load-modal-content">
              {engine.listSaves().length === 0 ? (
                <div className="no-saves-message">No saved games found.</div>
              ) : (
                <div className="saves-list">
                  {engine.listSaves().map(saveName => {
                    const info = engine.getSaveInfo(saveName);
                    return (
                      <div key={saveName} className="load-slot-item">
                        <div className="load-slot-info">
                          <span className="load-slot-name">{saveName}</span>
                          {info && (
                            <span className="load-slot-details">
                              Character: {info.playerName} | Saved: {new Date(info.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="load-slot-actions">
                          <button
                            className="load-slot-btn"
                            onClick={() => {
                              engine.loadGame(saveName);
                              setShowLoadModal(false);
                            }}
                          >
                            Load
                          </button>
                          <button
                            className="delete-slot-btn"
                            onClick={() => {
                              if (confirm(`Delete save "${saveName}"?`)) {
                                engine.deleteSave(saveName);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="load-modal-footer">
              {importExportStatus && (
                <div className={`import-export-status ${importExportStatus.type}`}>
                  {importExportStatus.type === 'success' ? '✓' : '✗'} {importExportStatus.message}
                </div>
              )}
              <div className="import-section">
                <label className="import-btn">
                  Import Saves from File
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const count = await engine.importSavesFromFile(file);
                          setImportExportStatus({ message: `Successfully imported ${count} save(s)!`, type: 'success' });
                        } catch (err) {
                          setImportExportStatus({ message: err instanceof Error ? err.message : 'Import failed', type: 'error' });
                        }
                        setTimeout(() => setImportExportStatus(null), 4000);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
              <button className="load-cancel-btn" onClick={() => {
                setShowLoadModal(false);
                setImportExportStatus(null);
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raid Group Manager Modal */}
      {showRaidGroupManager && (
        <div className="modal-overlay" onClick={() => { setShowRaidGroupManager(false); setSelectedPaladinForAura(null); setDraggedMemberId(null); setSelectedMemberForClassSpec(null); }}>
          <div className="raid-group-manager-modal" onClick={e => e.stopPropagation()}>
            <div className="rgm-header">
              <h2>Raid Group Manager</h2>
              <p className="rgm-subtitle">Drag players between groups • Click paladins for auras • Right-click to change class/spec</p>
              <button className="close-inspection" onClick={() => { setShowRaidGroupManager(false); setSelectedPaladinForAura(null); setDraggedMemberId(null); setSelectedMemberForClassSpec(null); }}>X</button>
            </div>
            <div className="rgm-content">
              {/* Groups Grid */}
              <div className="rgm-groups">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(groupNum => {
                  const groupMembers = state.raid.filter(m => m.group === groupNum);
                  if (groupMembers.length === 0 && groupNum > Math.ceil(state.raid.length / 5)) return null;

                  // Get active party auras in this group (using spec-aware check)
                  const groupAuras = new Set<string>();
                  groupMembers.forEach(member => {
                    Object.values(PARTY_AURAS).forEach(aura => {
                      if (aura.isAutomatic && aura.scope === 'party' && memberProvidesAura(member, aura)) {
                        groupAuras.add(aura.id);
                      }
                    });
                  });

                  return (
                    <div
                      key={groupNum}
                      className={`rgm-group ${draggedMemberId ? 'drop-target' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('drag-over');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('drag-over');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('drag-over');
                        const memberId = e.dataTransfer.getData('memberId');
                        if (memberId) {
                          engine.moveMemberToGroup(memberId, groupNum);
                          setDraggedMemberId(null);
                        }
                      }}
                    >
                      <div className="rgm-group-header">
                        <span className="rgm-group-number">Group {groupNum}</span>
                        <div className="rgm-group-auras">
                          {Array.from(groupAuras).map(auraId => {
                            const aura = PARTY_AURAS[auraId];
                            const provider = groupMembers.find(m => memberProvidesAura(m, aura));
                            return (
                              <img
                                key={auraId}
                                src={aura.icon}
                                alt={aura.name}
                                className="rgm-group-aura-icon"
                                onMouseEnter={() => setHoveredAura({ aura, providerName: provider?.name || 'Unknown' })}
                                onMouseLeave={() => setHoveredAura(null)}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="rgm-group-members">
                        {groupMembers.map(member => {
                          const classColor = CLASS_COLORS[member.class];
                          const isPlayer = member.id === state.playerId;
                          // Paladins only exist in Alliance raids - Horde has Shamans instead
                          const isPaladin = member.class === 'paladin' && state.faction === 'alliance';
                          // NPC Shamans in Horde raids can have totems assigned (player shaman uses active totems)
                          const isNpcShaman = member.class === 'shaman' && state.faction === 'horde' && !isPlayer;
                          const paladinAuraId = isPaladin ? engine.getPaladinAura(member.id) : null;
                          const paladinAura = paladinAuraId ? PARTY_AURAS[paladinAuraId] : null;
                          // Get shaman totem assignments for NPC shamans
                          const shamanTotems = isNpcShaman ? engine.getShamanTotems(member.id) : null;
                          const specDef = member.spec ? getSpecById(member.spec) : null;
                          const specName = specDef?.name || member.class;

                          // Get auras this member provides
                          const memberAuras = Object.values(PARTY_AURAS).filter(aura =>
                            memberProvidesAura(member, aura)
                          );

                          return (
                            <div
                              key={member.id}
                              className={`rgm-member ${isPlayer ? 'is-player' : ''} ${isPaladin ? 'is-paladin' : ''} ${isNpcShaman ? 'is-shaman' : ''} ${selectedPaladinForAura === member.id ? 'selected-for-aura' : ''} ${selectedShamanForTotems === member.id ? 'selected-for-totems' : ''} ${selectedMemberForClassSpec === member.id ? 'selected-for-class-spec' : ''} ${draggedMemberId === member.id ? 'dragging' : ''} ${draggedMemberId && draggedMemberId !== member.id ? 'swap-target' : ''}`}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('memberId', member.id);
                                setDraggedMemberId(member.id);
                              }}
                              onDragEnd={() => setDraggedMemberId(null)}
                              onDragOver={(e) => {
                                if (draggedMemberId && draggedMemberId !== member.id) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.currentTarget.classList.add('swap-hover');
                                }
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.classList.remove('swap-hover');
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.currentTarget.classList.remove('swap-hover');
                                const sourceMemberId = e.dataTransfer.getData('memberId');
                                if (sourceMemberId && sourceMemberId !== member.id) {
                                  engine.swapMembers(sourceMemberId, member.id);
                                  setDraggedMemberId(null);
                                }
                              }}
                              onClick={() => {
                                if (isPaladin && !draggedMemberId) {
                                  setSelectedPaladinForAura(selectedPaladinForAura === member.id ? null : member.id);
                                  setSelectedShamanForTotems(null);
                                  setSelectedMemberForClassSpec(null);
                                } else if (isNpcShaman && !draggedMemberId) {
                                  setSelectedShamanForTotems(selectedShamanForTotems === member.id ? null : member.id);
                                  setSelectedPaladinForAura(null);
                                  setSelectedMemberForClassSpec(null);
                                }
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if (!isPlayer && !draggedMemberId) {
                                  setSelectedMemberForClassSpec(selectedMemberForClassSpec === member.id ? null : member.id);
                                  setSelectedPaladinForAura(null);
                                  setSelectedShamanForTotems(null);
                                }
                              }}
                            >
                              <div className="rgm-class-bar" style={{ backgroundColor: classColor }} />
                              <div className="rgm-member-info">
                                <span className="rgm-member-name" style={{ color: classColor }}>
                                  {member.name}
                                  {isPlayer && <span className="rgm-you-tag">YOU</span>}
                                </span>
                                <span className="rgm-spec">{specName}</span>
                              </div>
                              {/* Right side: auras + role tag aligned */}
                              <div className="rgm-member-right">
                                <div className="rgm-member-auras">
                                  {memberAuras.filter(a => a.isAutomatic).map(aura => (
                                    <img
                                      key={aura.id}
                                      src={aura.icon}
                                      alt={aura.name}
                                      className="rgm-member-aura-icon"
                                      onMouseEnter={() => setHoveredAura({ aura, providerName: member.name })}
                                      onMouseLeave={() => setHoveredAura(null)}
                                    />
                                  ))}
                                  {isPaladin && paladinAura && (
                                    <img
                                      src={paladinAura.icon}
                                      alt={paladinAura.name}
                                      className="rgm-member-aura-icon paladin-aura"
                                      onMouseEnter={() => setHoveredAura({ aura: paladinAura, providerName: member.name })}
                                      onMouseLeave={() => setHoveredAura(null)}
                                    />
                                  )}
                                  {/* Show NPC Shaman totem assignments */}
                                  {isNpcShaman && shamanTotems && (
                                    <>
                                      {shamanTotems.earthTotemId && getTotemById(shamanTotems.earthTotemId) && (
                                        <img
                                          src={getTotemById(shamanTotems.earthTotemId)!.icon}
                                          alt={getTotemById(shamanTotems.earthTotemId)!.name}
                                          className="rgm-member-aura-icon shaman-totem"
                                          title={getTotemById(shamanTotems.earthTotemId)!.name}
                                        />
                                      )}
                                      {shamanTotems.fireTotemId && getTotemById(shamanTotems.fireTotemId) && (
                                        <img
                                          src={getTotemById(shamanTotems.fireTotemId)!.icon}
                                          alt={getTotemById(shamanTotems.fireTotemId)!.name}
                                          className="rgm-member-aura-icon shaman-totem"
                                          title={getTotemById(shamanTotems.fireTotemId)!.name}
                                        />
                                      )}
                                      {shamanTotems.waterTotemId && getTotemById(shamanTotems.waterTotemId) && (
                                        <img
                                          src={getTotemById(shamanTotems.waterTotemId)!.icon}
                                          alt={getTotemById(shamanTotems.waterTotemId)!.name}
                                          className="rgm-member-aura-icon shaman-totem"
                                          title={getTotemById(shamanTotems.waterTotemId)!.name}
                                        />
                                      )}
                                      {shamanTotems.airTotemId && getTotemById(shamanTotems.airTotemId) && (
                                        <img
                                          src={getTotemById(shamanTotems.airTotemId)!.icon}
                                          alt={getTotemById(shamanTotems.airTotemId)!.name}
                                          className="rgm-member-aura-icon shaman-totem"
                                          title={getTotemById(shamanTotems.airTotemId)!.name}
                                        />
                                      )}
                                    </>
                                  )}
                                </div>
                                <span className={`rgm-role-tag ${member.role}`}>
                                  {member.role === 'tank' && 'Tank'}
                                  {member.role === 'healer' && 'Healer'}
                                  {member.role === 'dps' && 'DPS'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {groupMembers.length === 0 && (
                          <div className="rgm-empty-slot">Drop here</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Aura Hover Tooltip */}
              {hoveredAura && (
                <div className="rgm-aura-tooltip">
                  <div className="rgm-aura-tooltip-header">
                    <img src={hoveredAura.aura.icon} alt={hoveredAura.aura.name} className="rgm-aura-tooltip-icon" />
                    <span className="rgm-aura-tooltip-name">{hoveredAura.aura.name}</span>
                  </div>
                  <div className="rgm-aura-tooltip-effect">{formatAuraEffect(hoveredAura.aura.effect)}</div>
                  <div className="rgm-aura-tooltip-scope">
                    {hoveredAura.aura.scope === 'raid' ? 'Affects entire raid' : 'Affects party members only'}
                  </div>
                  <div className="rgm-aura-tooltip-provider">
                    Provided by: {hoveredAura.providerName}
                  </div>
                </div>
              )}

              {/* Paladin Aura Selection Panel - Alliance only */}
              {selectedPaladinForAura && state.faction === 'alliance' && (
                <div className="rgm-aura-panel">
                  <div className="rgm-aura-header">
                    <h3>Select Aura for {state.raid.find(m => m.id === selectedPaladinForAura)?.name}</h3>
                    <button className="close-panel-btn" onClick={() => setSelectedPaladinForAura(null)}>×</button>
                  </div>
                  <div className="rgm-aura-options">
                    {getPaladinAuras().map(aura => {
                      const isSelected = engine.getPaladinAura(selectedPaladinForAura) === aura.id;
                      return (
                        <button
                          key={aura.id}
                          className={`rgm-aura-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            engine.setPaladinAura(selectedPaladinForAura, isSelected ? null : aura.id);
                          }}
                        >
                          <img src={aura.icon} alt={aura.name} className="rgm-aura-btn-icon" />
                          <div className="rgm-aura-info">
                            <span className="rgm-aura-name">{aura.name}</span>
                            <span className="rgm-aura-effect">{formatAuraEffect(aura.effect)}</span>
                          </div>
                          {isSelected && <span className="rgm-selected-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shaman Totem Selection Panel - Horde only */}
              {selectedShamanForTotems && state.faction === 'horde' && (() => {
                const shamanTotems = engine.getShamanTotems(selectedShamanForTotems);
                const selectedShaman = state.raid.find(m => m.id === selectedShamanForTotems);
                const elementColors: Record<TotemElement, string> = {
                  earth: '#8B4513',
                  fire: '#FF4500',
                  water: '#4169E1',
                  air: '#87CEEB',
                };

                return (
                  <div className="rgm-aura-panel rgm-totem-panel">
                    <div className="rgm-aura-header">
                      <h3>Assign Totems for {selectedShaman?.name}</h3>
                      <button className="close-panel-btn" onClick={() => setSelectedShamanForTotems(null)}>×</button>
                    </div>
                    <div className="rgm-totem-elements-horizontal">
                      {(['earth', 'fire', 'water', 'air'] as TotemElement[]).map(element => {
                        const elementTotems = TOTEMS_BY_ELEMENT[element];
                        const currentTotemId = shamanTotems?.[`${element}TotemId` as keyof typeof shamanTotems] as string | null;

                        return (
                          <div key={element} className="rgm-totem-element-column">
                            <div className="rgm-totem-element-header-h" style={{ backgroundColor: elementColors[element] }}>
                              {element.charAt(0).toUpperCase() + element.slice(1)}
                            </div>
                            <div className="rgm-totem-options-vertical">
                              {elementTotems.map(totem => {
                                const isSelected = currentTotemId === totem.id;
                                // Get short name (remove "Totem" suffix)
                                const shortName = totem.name.replace(' Totem', '');
                                return (
                                  <div
                                    key={totem.id}
                                    className={`rgm-totem-row ${isSelected ? 'selected' : ''}`}
                                    onClick={() => {
                                      engine.setShamanTotem(selectedShamanForTotems, element, isSelected ? null : totem.id);
                                    }}
                                  >
                                    <img src={totem.icon} alt={totem.name} className="rgm-totem-row-icon" />
                                    <span className="rgm-totem-row-name">{shortName}</span>
                                    {isSelected && <span className="totem-check">✓</span>}
                                    <div className="rgm-totem-tooltip">
                                      <div className="rgm-totem-tooltip-name">{totem.name}</div>
                                      <div className="rgm-totem-tooltip-effect">{formatAuraEffect(totem.effect)}</div>
                                      <div className="rgm-totem-tooltip-duration">Duration: {totem.duration}s</div>
                                      {totem.tickRate && <div className="rgm-totem-tooltip-tick">Pulses every {totem.tickRate}s</div>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Class/Spec Selection Panel */}
              {selectedMemberForClassSpec && (
                <div className="rgm-class-spec-panel">
                  <div className="rgm-class-spec-header">
                    <h3>Change Class/Spec for {state.raid.find(m => m.id === selectedMemberForClassSpec)?.name}</h3>
                    <button className="close-panel-btn" onClick={() => setSelectedMemberForClassSpec(null)}>×</button>
                  </div>
                  <div className="rgm-class-spec-content">
                    {(Object.keys(CLASS_SPECS) as WoWClass[]).map(wowClass => {
                      const specs = CLASS_SPECS[wowClass];
                      const classColor = CLASS_COLORS[wowClass];
                      const currentMember = state.raid.find(m => m.id === selectedMemberForClassSpec);
                      const isCurrentClass = currentMember?.class === wowClass;

                      return (
                        <div key={wowClass} className={`rgm-class-section ${isCurrentClass ? 'current-class' : ''}`}>
                          <div className="rgm-class-name" style={{ color: classColor }}>
                            {wowClass.charAt(0).toUpperCase() + wowClass.slice(1)}
                          </div>
                          <div className="rgm-spec-options">
                            {specs.map(spec => {
                              const isCurrentSpec = currentMember?.spec === spec.id;
                              return (
                                <button
                                  key={spec.id}
                                  className={`rgm-spec-option ${isCurrentSpec ? 'selected' : ''}`}
                                  onClick={() => {
                                    engine.changeMemberClassAndSpec(selectedMemberForClassSpec, wowClass, spec.id);
                                  }}
                                >
                                  <img src={spec.icon} alt={spec.name} className="rgm-spec-icon" />
                                  <div className="rgm-spec-info">
                                    <span className="rgm-spec-name">{spec.name}</span>
                                    <span className={`rgm-spec-role ${spec.role}`}>
                                      {spec.role === 'tank' && 'Tank'}
                                      {spec.role === 'healer' && 'Healer'}
                                      {spec.role === 'dps' && 'DPS'}
                                    </span>
                                  </div>
                                  {isCurrentSpec && <span className="rgm-selected-check">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="rgm-footer">
              <button className="rgm-done-btn" onClick={() => { setShowRaidGroupManager(false); setSelectedPaladinForAura(null); setSelectedMemberForClassSpec(null); }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encounter Journal Modal */}
      {showEncounterJournal && (
        <div className="modal-overlay" onClick={() => setShowEncounterJournal(false)}>
          <div className="encounter-journal-modal" onClick={e => e.stopPropagation()}>
            <div className="journal-header">
              <h2>📖 Encounter Journal - {engine.getCurrentRaid()?.name || 'Raid'}</h2>
              <button className="close-inspection" onClick={() => setShowEncounterJournal(false)}>X</button>
            </div>
            <div className="journal-content">
              {/* Boss List Sidebar */}
              <div className="journal-boss-list">
                {engine.getCurrentRaidEncounters().map((enc, idx) => (
                  <div
                    key={enc.id}
                    className={`journal-boss-item ${selectedJournalBoss === enc.id ? 'selected' : ''}`}
                    onClick={() => setSelectedJournalBoss(enc.id)}
                  >
                    <span className="journal-boss-number">{idx + 1}.</span>
                    <span className="journal-boss-name">{enc.name}</span>
                  </div>
                ))}
              </div>

              {/* Boss Details */}
              <div className="journal-boss-details">
                {selectedJournalBoss && (() => {
                  const boss = engine.getCurrentRaidEncounters().find(e => e.id === selectedJournalBoss);
                  if (!boss) return null;
                  const abilities = getBossAbilities(selectedJournalBoss);

                  return (
                    <>
                      <div className="journal-boss-header">
                        <h3>{boss.name}</h3>
                        <div className="journal-boss-stats">
                          <span>Health: {(boss.maxHealth / 1000000).toFixed(1)}M</span>
                          <span>Enrage: {formatTime(boss.enrageTimer)}</span>
                        </div>
                      </div>

                      <div className="journal-details-columns">
                        {/* Left Column - Abilities & Strategy */}
                        <div className="journal-left-column">
                          <div className="journal-abilities">
                            <h4>Abilities</h4>
                            {abilities.map((ability, idx) => (
                              <div key={idx} className={`journal-ability ability-${ability.type}`}>
                                <div className="ability-header">
                                  {ability.icon && (
                                    <img src={ability.icon} alt={ability.name} className="ability-icon" />
                                  )}
                                  <div className="ability-title">
                                    <span className="ability-name">{ability.name}</span>
                                    <span className={`ability-type type-${ability.type}`}>
                                      {ability.type.charAt(0).toUpperCase() + ability.type.slice(1)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ability-description">{ability.description}</div>
                                <div className="ability-timing">
                                  Cast every {ability.interval} seconds
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="journal-strategy">
                            <h4>Healer Tips</h4>
                            <ul>
                              {boss.damageEvents.some(e => e.type === 'debuff' && e.debuffId && DEBUFFS[e.debuffId]?.type === 'magic') && (
                                <li>⚡ <strong>Dispel priority:</strong> Watch for magic debuffs and Cleanse them quickly!</li>
                              )}
                              {boss.damageEvents.some(e => e.type === 'debuff' && e.debuffId && DEBUFFS[e.debuffId]?.type === 'curse') && (
                                <li>💀 <strong>Curse alert:</strong> Coordinate with Mages/Druids to decurse raid members.</li>
                              )}
                              {boss.damageEvents.some(e => e.type === 'tank_damage' && e.damage > 1000) && (
                                <li>🛡️ <strong>Tank buster:</strong> Keep Blessing of Light on tanks and be ready with Holy Light!</li>
                              )}
                              {boss.damageEvents.some(e => e.type === 'raid_damage' && (e.targetCount || 5) > 8) && (
                                <li>👥 <strong>Heavy raid damage:</strong> Expect significant AoE damage. Flash of Light spam recommended.</li>
                              )}
                              <li>💧 Keep an eye on your mana. Use potions during high damage phases.</li>
                            </ul>
                          </div>
                        </div>

                        {/* Right Column - Loot */}
                        <div className="journal-right-column">
                          <div className="journal-loot">
                            <h4>Loot</h4>
                            {(() => {
                              const lootTable = BOSS_LOOT_TABLES[selectedJournalBoss];
                              if (!lootTable) return <div className="no-loot">No loot data available</div>;

                              const items = lootTable.items
                                .map(itemId => ALL_ITEMS[itemId])
                                .filter(item => item != null)
                                .sort((a, b) => {
                                  // Sort by rarity (legendary > epic > rare > uncommon)
                                  const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3 };
                                  return rarityOrder[a.rarity] - rarityOrder[b.rarity];
                                });

                              // Get legendary material if this boss drops one
                              const legendaryMat = lootTable.legendaryMaterial
                                ? LEGENDARY_MATERIALS[lootTable.legendaryMaterial]
                                : null;

                              return (
                                <div className="loot-items">
                                  {/* Show legendary material first if exists */}
                                  {legendaryMat && (
                                    <div className="loot-item legendary-material">
                                      <img
                                        src={legendaryMat.icon}
                                        alt={legendaryMat.name}
                                        className="loot-item-icon"
                                        style={{ borderColor: RARITY_COLORS.legendary }}
                                      />
                                      <div className="loot-item-info">
                                        <span
                                          className="loot-item-name"
                                          style={{ color: RARITY_COLORS.legendary }}
                                        >
                                          {legendaryMat.name}
                                        </span>
                                        <span className="loot-item-slot">
                                          Legendary Material • {Math.round(legendaryMat.dropChance * 100)}% drop
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {items.map((item, idx) => (
                                    <div key={idx} className="loot-item">
                                      <img
                                        src={item.icon}
                                        alt={item.name}
                                        className="loot-item-icon"
                                        style={{ borderColor: RARITY_COLORS[item.rarity] }}
                                      />
                                      <div className="loot-item-info">
                                        <span
                                          className="loot-item-name"
                                          style={{ color: RARITY_COLORS[item.rarity] }}
                                        >
                                          {item.name}
                                        </span>
                                        <span className="loot-item-slot">
                                          {item.slot.charAt(0).toUpperCase() + item.slot.slice(1)} • {item.classes.join(', ')}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="modal-overlay" onClick={() => setShowAdminPanel(false)}>
          <div className="admin-panel-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-header">
              <h2>Admin Panel</h2>
              <button className="close-inspection" onClick={() => setShowAdminPanel(false)}>X</button>
            </div>

            {/* Tab Navigation */}
            <div className="admin-tabs">
              <button
                className={`admin-tab ${adminTab === 'loot' ? 'active' : ''}`}
                onClick={() => setAdminTab('loot')}
              >
                Loot
              </button>
              <button
                className={`admin-tab ${adminTab === 'dkp' ? 'active' : ''}`}
                onClick={() => setAdminTab('dkp')}
              >
                DKP
              </button>
              <button
                className={`admin-tab ${adminTab === 'progression' ? 'active' : ''}`}
                onClick={() => setAdminTab('progression')}
              >
                Progression
              </button>
              <button
                className={`admin-tab ${adminTab === 'raid' ? 'active' : ''}`}
                onClick={() => setAdminTab('raid')}
              >
                Raid Members
              </button>
            </div>

            {/* Tab Content */}
            <div className="admin-tab-content">
              {/* LOOT TAB */}
              {adminTab === 'loot' && (() => {
                const selectedMember = selectedAdminMemberId
                  ? engine.adminGetMemberById(selectedAdminMemberId)
                  : null;
                const equipItems = selectedMember
                  ? engine.getEquippableItemsForClass(selectedMember.class)
                  : [];

                // Filter items
                let filteredItems = equipItems;
                if (adminItemSlotFilter !== 'all') {
                  filteredItems = filteredItems.filter(i => i.slot === adminItemSlotFilter);
                }
                if (adminItemSearch) {
                  const search = adminItemSearch.toLowerCase();
                  filteredItems = filteredItems.filter(i =>
                    i.name.toLowerCase().includes(search)
                  );
                }

                return (
                  <div className="admin-loot-tab">
                    {/* Member Selector */}
                    <div className="admin-section">
                      <label className="admin-section-header">Select Raid Member:</label>
                      <select
                        className="admin-member-select"
                        value={selectedAdminMemberId || ''}
                        onChange={e => setSelectedAdminMemberId(e.target.value)}
                      >
                        {state.raid.map(m => (
                          <option key={m.id} value={m.id} style={{ color: CLASS_COLORS[m.class] }}>
                            {m.name} ({m.class}) - GS: {m.gearScore}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedMember && (
                      <div className="admin-loot-content">
                        {/* Current Equipment */}
                        <div className="admin-equipment-section">
                          <div className="admin-section-header">
                            Current Equipment - {selectedMember.name}
                            <span className="gear-score-display">GS: {selectedMember.gearScore}</span>
                          </div>
                          <div className="admin-equipment-grid">
                            {(['head', 'shoulders', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'weapon'] as EquipmentSlot[]).map(slot => {
                              const item = selectedMember.equipment[slot];
                              return (
                                <div key={slot} className="admin-equipment-slot">
                                  <span className="slot-label">{slot}:</span>
                                  {item ? (
                                    <div className="equipped-item">
                                      <span style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</span>
                                      <button
                                        className="remove-item-btn"
                                        onClick={() => engine.adminRemoveItemFromMember(selectedMember.id, slot)}
                                        title="Remove item"
                                      >
                                        X
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="empty-slot">Empty</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Item Browser */}
                        <div className="admin-item-browser">
                          <div className="admin-section-header">
                            Available Items for {selectedMember.class}
                          </div>
                          <div className="admin-item-filters">
                            <select
                              value={adminItemSlotFilter}
                              onChange={e => setAdminItemSlotFilter(e.target.value)}
                              className="admin-slot-filter"
                            >
                              <option value="all">All Slots</option>
                              <option value="head">Head</option>
                              <option value="shoulders">Shoulders</option>
                              <option value="chest">Chest</option>
                              <option value="wrist">Wrist</option>
                              <option value="hands">Hands</option>
                              <option value="waist">Waist</option>
                              <option value="legs">Legs</option>
                              <option value="feet">Feet</option>
                              <option value="weapon">Weapon</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Search items..."
                              value={adminItemSearch}
                              onChange={e => setAdminItemSearch(e.target.value)}
                              className="admin-item-search"
                            />
                          </div>
                          <div className="admin-item-list">
                            {filteredItems.map(item => (
                              <div key={item.id} className="admin-item-row">
                                <img src={item.icon} alt={item.name} className="admin-item-icon" />
                                <div className="admin-item-info">
                                  <span className="admin-item-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                                    {item.name}
                                  </span>
                                  <span className="admin-item-slot">{item.slot} - iLvl {item.itemLevel}</span>
                                </div>
                                <div className="admin-item-buttons">
                                  <button
                                    className="admin-equip-btn"
                                    onClick={() => engine.adminEquipItemOnMember(selectedMember.id, item)}
                                  >
                                    Equip
                                  </button>
                                  {selectedMember.id === engine.getPlayerMember()?.id && (
                                    <button
                                      className="admin-to-bag-btn"
                                      onClick={() => engine.adminAddItemToBag(item)}
                                      disabled={state.playerBag.length >= 16}
                                      title={state.playerBag.length >= 16 ? 'Bag is full' : 'Add to bag'}
                                    >
                                      To Bag
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {filteredItems.length === 0 && (
                              <div className="no-items-found">No items found</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* DKP TAB */}
              {adminTab === 'dkp' && (
                <div className="admin-dkp-tab">
                  <div className="admin-section">
                    <div className="admin-section-header">Player DKP</div>
                    <div className="admin-dkp-display">
                      <span className="dkp-value-large">{state.playerDKP.points}</span>
                      <span className="dkp-label">Dragon Kill Points</span>
                    </div>

                    <div className="admin-dkp-controls">
                      <div className="dkp-input-row">
                        <input
                          type="number"
                          value={adminDkpInput}
                          onChange={e => setAdminDkpInput(e.target.value)}
                          placeholder="Amount"
                          className="admin-dkp-input"
                        />
                        <button
                          className="dkp-add-btn"
                          onClick={() => {
                            const val = parseInt(adminDkpInput);
                            if (!isNaN(val)) {
                              engine.adminModifyPlayerDKP(val);
                              setAdminDkpInput('');
                            }
                          }}
                        >
                          Add
                        </button>
                        <button
                          className="dkp-subtract-btn"
                          onClick={() => {
                            const val = parseInt(adminDkpInput);
                            if (!isNaN(val)) {
                              engine.adminModifyPlayerDKP(-val);
                              setAdminDkpInput('');
                            }
                          }}
                        >
                          Subtract
                        </button>
                        <button
                          className="dkp-set-btn"
                          onClick={() => {
                            const val = parseInt(adminDkpInput);
                            if (!isNaN(val)) {
                              engine.adminSetPlayerDKP(val);
                              setAdminDkpInput('');
                            }
                          }}
                        >
                          Set To
                        </button>
                      </div>

                      <div className="dkp-presets">
                        <span className="preset-label">Quick Add:</span>
                        <button onClick={() => engine.adminModifyPlayerDKP(50)}>+50</button>
                        <button onClick={() => engine.adminModifyPlayerDKP(100)}>+100</button>
                        <button onClick={() => engine.adminModifyPlayerDKP(500)}>+500</button>
                        <button onClick={() => engine.adminModifyPlayerDKP(-50)}>-50</button>
                        <button onClick={() => engine.adminSetPlayerDKP(50)}>Reset to 50</button>
                      </div>
                    </div>

                    <div className="dkp-info">
                      <div className="dkp-stat">
                        <span>Earned this raid:</span>
                        <span>{state.playerDKP.earnedThisRaid}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PROGRESSION TAB */}
              {adminTab === 'progression' && (
                <div className="admin-progression-tab">
                  {/* Boss Progress */}
                  <div className="admin-section">
                    <div className="admin-section-header">Boss Progression</div>
                    <div className="admin-raid-selector">
                      <label>Raid: </label>
                      <select
                        value={adminProgressionRaid}
                        onChange={(e) => setAdminProgressionRaid(e.target.value)}
                      >
                        {RAIDS.filter(r => r.available).map(raid => (
                          <option key={raid.id} value={raid.id}>
                            {raid.name} ({raid.encounters.length} bosses)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-boss-list">
                      {engine.adminGetAllEncounters(adminProgressionRaid).map((enc, idx) => (
                        <div
                          key={enc.id}
                          className={`admin-boss-item ${enc.isDefeated ? 'defeated' : ''}`}
                          onClick={() => engine.adminToggleBossDefeated(enc.id, adminProgressionRaid)}
                        >
                          <span className="boss-number">{idx + 1}.</span>
                          <span className="boss-name">{enc.name}</span>
                          <span className={`boss-status ${enc.isDefeated ? 'defeated' : 'available'}`}>
                            {enc.isDefeated ? 'Defeated' : 'Available'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="admin-progression-actions">
                      <button
                        className="defeat-all-btn"
                        onClick={() => {
                          ENCOUNTERS.forEach(e => {
                            if (!state.defeatedBosses.includes(e.id)) {
                              engine.adminToggleBossDefeated(e.id);
                            }
                          });
                        }}
                      >
                        Defeat All Bosses
                      </button>
                      <button
                        className="clear-progress-btn"
                        onClick={() => engine.adminClearAllProgression()}
                      >
                        Clear All Progress
                      </button>
                    </div>
                  </div>

                  {/* World Buffs */}
                  <div className="admin-section">
                    <div className="admin-section-header">World Buff Unlocks</div>
                    <div className="admin-world-buffs">
                      {Object.values(WORLD_BUFFS).map(buff => {
                        const isUnlocked = state.unlockedWorldBuffs.includes(buff.id);
                        return (
                          <div
                            key={buff.id}
                            className={`admin-world-buff-item ${isUnlocked ? 'unlocked' : ''} ${buff.comingSoon ? 'coming-soon' : ''}`}
                            onClick={() => {
                              if (!buff.comingSoon) {
                                engine.adminToggleWorldBuffUnlocked(buff.id);
                              }
                            }}
                          >
                            <img src={buff.icon} alt={buff.name} className="world-buff-icon" />
                            <span className="world-buff-name">{buff.name}</span>
                            <span className={`world-buff-status ${isUnlocked ? 'unlocked' : 'locked'}`}>
                              {buff.comingSoon ? 'Coming Soon' : isUnlocked ? 'Unlocked' : 'Locked'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legendary Materials */}
                  <div className="admin-section">
                    <div className="admin-section-header">Legendary Materials</div>
                    <div className="admin-legendary-materials">
                      {Object.values(LEGENDARY_MATERIALS).map(mat => {
                        const hasIt = engine.adminHasLegendaryMaterial(mat.id);
                        return (
                          <div
                            key={mat.id}
                            className={`admin-legendary-item ${hasIt ? 'owned' : ''}`}
                            onClick={() => engine.adminToggleLegendaryMaterial(mat.id)}
                          >
                            <img src={mat.icon} alt={mat.name} className="legendary-icon" />
                            <div className="legendary-info">
                              <span className="legendary-name" style={{ color: RARITY_COLORS.legendary }}>{mat.name}</span>
                              <span className="legendary-desc">{mat.description}</span>
                            </div>
                            <span className={`legendary-status ${hasIt ? 'owned' : 'missing'}`}>
                              {hasIt ? 'Owned' : 'Not Owned'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="legendary-crafting-status">
                      <span>Can craft Thunderfury: {engine.canCraftThunderfury() ? 'Yes' : 'No'}</span>
                      <span>Can craft Sulfuras: {engine.canCraftSulfuras() ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  {/* Bad Luck Protection */}
                  <div className="admin-section">
                    <div className="admin-section-header">Bad Luck Protection</div>
                    <div className="bad-luck-display">
                      <span>Boss kills without Paladin loot: </span>
                      <span className="bad-luck-count">{state.bossKillsWithoutPaladinLoot}</span>
                      <span className="bad-luck-note">(Guaranteed at 3+)</span>
                    </div>
                    <div className="bad-luck-controls">
                      <button onClick={() => engine.adminResetBadLuckProtection()}>
                        Reset Counter
                      </button>
                      <button onClick={() => engine.adminSetBadLuckProtection(3)}>
                        Set to 3 (Force Protection)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* RAID MANAGEMENT TAB */}
              {adminTab === 'raid' && (
                <div className="admin-raid-tab">
                  {/* Raid Size */}
                  <div className="admin-section">
                    <div className="admin-section-header">Raid Size</div>
                    <div className="raid-size-controls">
                      <span>Current: {state.raid.length} members</span>
                      <button
                        className={state.raid.length === 20 ? 'active' : ''}
                        onClick={() => engine.adminResizeRaid(20)}
                      >
                        20-Man
                      </button>
                      <button
                        className={state.raid.length === 40 ? 'active' : ''}
                        onClick={() => engine.adminResizeRaid(40)}
                      >
                        40-Man
                      </button>
                    </div>
                  </div>

                  {/* Member Table */}
                  <div className="admin-section">
                    <div className="admin-section-header">Raid Members</div>
                    <div className="admin-member-table">
                      <div className="admin-member-header">
                        <span className="col-index">#</span>
                        <span className="col-name">Name</span>
                        <span className="col-class">Class</span>
                        <span className="col-role">Role</span>
                        <span className="col-gs">GS</span>
                        <span className="col-actions">Actions</span>
                      </div>
                      <div className="admin-member-list">
                        {state.raid.map((member, idx) => {
                          const isPlayer = member.id === state.playerId;
                          const isEditing = editingMemberId === member.id;

                          return (
                            <div
                              key={member.id}
                              className={`admin-member-row ${isPlayer ? 'is-player' : ''}`}
                            >
                              <span className="col-index">{idx + 1}</span>
                              <span className="col-name">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingMemberName}
                                    onChange={e => setEditingMemberName(e.target.value)}
                                    onBlur={() => {
                                      if (editingMemberName.trim()) {
                                        engine.adminRenameMember(member.id, editingMemberName);
                                      }
                                      setEditingMemberId(null);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        if (editingMemberName.trim()) {
                                          engine.adminRenameMember(member.id, editingMemberName);
                                        }
                                        setEditingMemberId(null);
                                      }
                                    }}
                                    autoFocus
                                    className="admin-name-input"
                                  />
                                ) : (
                                  <span
                                    style={{ color: CLASS_COLORS[member.class], cursor: 'pointer' }}
                                    onClick={() => {
                                      setEditingMemberId(member.id);
                                      setEditingMemberName(member.name);
                                    }}
                                    title="Click to rename"
                                  >
                                    {member.name}
                                    {isPlayer && <span className="player-tag"> (YOU)</span>}
                                  </span>
                                )}
                              </span>
                              <span className="col-class">
                                <select
                                  value={member.class}
                                  onChange={e => engine.adminChangeMemberClass(member.id, e.target.value as WoWClass)}
                                  className="admin-class-select"
                                  style={{ color: CLASS_COLORS[member.class] }}
                                >
                                  <option value="warrior">Warrior</option>
                                  {state.faction === 'alliance' && <option value="paladin">Paladin</option>}
                                  {state.faction === 'horde' && <option value="shaman">Shaman</option>}
                                  <option value="hunter">Hunter</option>
                                  <option value="rogue">Rogue</option>
                                  <option value="priest">Priest</option>
                                  <option value="mage">Mage</option>
                                  <option value="warlock">Warlock</option>
                                  <option value="druid">Druid</option>
                                </select>
                              </span>
                              <span className="col-role">{member.role}</span>
                              <span className="col-gs">{member.gearScore}</span>
                              <span className="col-actions">
                                <button
                                  className="admin-view-btn"
                                  onClick={() => {
                                    setSelectedAdminMemberId(member.id);
                                    setAdminTab('loot');
                                  }}
                                  title="View/Edit Equipment"
                                >
                                  Gear
                                </button>
                                {!isPlayer && (
                                  <button
                                    className="admin-delete-btn"
                                    onClick={() => engine.adminDeleteMember(member.id)}
                                    title="Remove from raid"
                                  >
                                    X
                                  </button>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Add New Member */}
                  <div className="admin-section">
                    <div className="admin-section-header">Add New Member</div>
                    <div className="add-member-form">
                      <input
                        type="text"
                        placeholder="Name"
                        value={adminNewMemberName}
                        onChange={e => setAdminNewMemberName(e.target.value)}
                        className="add-member-name"
                      />
                      <select
                        value={adminNewMemberClass}
                        onChange={e => setAdminNewMemberClass(e.target.value as WoWClass)}
                        className="add-member-class"
                      >
                        <option value="warrior">Warrior</option>
                        {state.faction === 'alliance' && <option value="paladin">Paladin</option>}
                        {state.faction === 'horde' && <option value="shaman">Shaman</option>}
                        <option value="hunter">Hunter</option>
                        <option value="rogue">Rogue</option>
                        <option value="priest">Priest</option>
                        <option value="mage">Mage</option>
                        <option value="warlock">Warlock</option>
                        <option value="druid">Druid</option>
                      </select>
                      <select
                        value={adminNewMemberRole}
                        onChange={e => setAdminNewMemberRole(e.target.value as 'tank' | 'healer' | 'dps')}
                        className="add-member-role"
                      >
                        <option value="tank">Tank</option>
                        <option value="healer">Healer</option>
                        <option value="dps">DPS</option>
                      </select>
                      <button
                        className="add-member-btn"
                        onClick={() => {
                          engine.adminAddMember(adminNewMemberName || 'NewMember', adminNewMemberClass, adminNewMemberRole);
                          setAdminNewMemberName('');
                        }}
                      >
                        Add Member
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <div className="modal-overlay" onClick={() => setShowInventory(false)}>
          <div className="inventory-modal" onClick={e => e.stopPropagation()}>
            <div className="inventory-header">
              <div className="inventory-title">
                <img
                  src="https://wow.zamimg.com/images/wow/icons/large/inv_misc_bag_07_green.jpg"
                  alt="Bag"
                  className="inventory-title-icon"
                />
                <h2>{state.playerName}'s Bags</h2>
              </div>
              <button className="close-inspection" onClick={() => setShowInventory(false)}>X</button>
            </div>

            <div className="inventory-content">
              {/* Equipment Bag - Extra gear items */}
              <div className="bag-section">
                <div className="bag-header">
                  <span className="bag-name">Equipment Bag</span>
                  <span className="bag-slots">{state.playerBag.length} / 16</span>
                </div>
                <div className="bag-grid">
                  {/* Filled slots with gear items */}
                  {state.playerBag.map((item, index) => (
                    <div
                      key={`gear-${item.id}-${index}`}
                      className={`bag-slot filled gear rarity-${item.rarity}`}
                      onClick={() => engine.equipFromBag(index)}
                      title={`Click to equip ${item.name}`}
                    >
                      <img src={item.icon} alt={item.name} />
                      <div className="slot-tooltip">
                        <div className="tooltip-name" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</div>
                        <div className="tooltip-slot">{item.slot.charAt(0).toUpperCase() + item.slot.slice(1)} - iLvl {item.itemLevel}</div>
                        <div className="tooltip-stats">
                          {item.stats.intellect && <div>+{item.stats.intellect} Intellect</div>}
                          {item.stats.stamina && <div>+{item.stats.stamina} Stamina</div>}
                          {item.stats.spellPower && <div>+{item.stats.spellPower} Spell Power</div>}
                          {item.stats.healingPower && <div>+{item.stats.healingPower} Healing</div>}
                          {item.stats.mp5 && <div>+{item.stats.mp5} MP5</div>}
                          {item.stats.critChance && <div>+{item.stats.critChance}% Crit</div>}
                        </div>
                        <div className="tooltip-action">Click to equip</div>
                      </div>
                    </div>
                  ))}
                  {/* Empty slots to fill the grid */}
                  {Array.from({ length: Math.max(0, 16 - state.playerBag.length) }).map((_, idx) => (
                    <div key={`gear-empty-${idx}`} className="bag-slot empty" />
                  ))}
                </div>
                {state.playerBag.length === 0 && (
                  <div className="bag-empty-hint">
                    <p>When you equip new gear, your old equipment will be stored here.</p>
                  </div>
                )}
              </div>

              {/* Bag Grid - WoW style slots */}
              <div className="bag-section">
                <div className="bag-header">
                  <span className="bag-name">Legendary Materials</span>
                  <span className="bag-slots">{state.legendaryMaterials.length} / 16</span>
                </div>
                <div className="bag-grid">
                  {/* Filled slots with legendary materials */}
                  {engine.getLegendaryMaterials().map(material => (
                    <div
                      key={material.id}
                      className="bag-slot filled legendary"
                      title={`${material.name}\n${material.description}`}
                    >
                      <img src={material.icon} alt={material.name} />
                      <div className="slot-tooltip">
                        <div className="tooltip-name legendary-text">{material.name}</div>
                        <div className="tooltip-desc">{material.description}</div>
                        <div className="tooltip-source">
                          Drops from: {
                            material.dropsFrom === 'garr' ? 'Garr' :
                            material.dropsFrom === 'baron_geddon' ? 'Baron Geddon' :
                            material.dropsFrom === 'ragnaros' ? 'Ragnaros' : material.dropsFrom
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Empty slots to fill the grid */}
                  {Array.from({ length: 16 - state.legendaryMaterials.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="bag-slot empty" />
                  ))}
                </div>
              </div>

              {/* Drop hints when empty */}
              {state.legendaryMaterials.length === 0 && (
                <div className="bag-empty-message">
                  <p>Your bags are empty!</p>
                  <p className="hint">Defeat raid bosses for a chance at legendary materials:</p>
                  <ul className="drop-hints-list">
                    <li>Left Binding of the Windseeker - Garr (3%)</li>
                    <li>Right Binding of the Windseeker - Baron Geddon (3%)</li>
                    <li>Eye of Sulfuras - Ragnaros (2%)</li>
                  </ul>
                </div>
              )}

              {/* Crafting Section */}
              <div className="crafting-section">
                <div className="crafting-header">
                  <span>Legendary Crafting</span>
                </div>

                {/* Sulfuras Crafting Card */}
                <div className={`craft-card ${engine.canCraftSulfuras() ? 'available' : 'unavailable'}`}>
                  <div className="craft-card-header">
                    <img
                      src="https://wow.zamimg.com/images/wow/icons/large/inv_hammer_unique_sulfuras.jpg"
                      alt="Sulfuras"
                      className="craft-card-icon"
                    />
                    <div className="craft-card-info">
                      <span className="craft-card-name legendary-text">Sulfuras, Hand of Ragnaros</span>
                      <span className="craft-card-type">Two-Hand Mace</span>
                    </div>
                  </div>
                  <div className="craft-card-reqs">
                    <div className={`req ${state.legendaryMaterials.includes('eye_of_sulfuras') ? 'met' : 'unmet'}`}>
                      {state.legendaryMaterials.includes('eye_of_sulfuras') ? '✓' : '○'} Eye of Sulfuras
                    </div>
                  </div>
                  {engine.canCraftSulfuras() && (
                    <div className="craft-card-action">
                      <select
                        className="craft-recipient-select"
                        value={selectedLegendaryCraftTarget || ''}
                        onChange={e => setSelectedLegendaryCraftTarget(e.target.value)}
                      >
                        <option value="">Select recipient...</option>
                        {state.raid
                          .filter(m => m.class === 'warrior' || m.class === 'paladin')
                          .map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.class})
                            </option>
                          ))}
                      </select>
                      <button
                        className="craft-button sulfuras"
                        disabled={!selectedLegendaryCraftTarget}
                        onClick={() => {
                          if (selectedLegendaryCraftTarget) {
                            engine.craftSulfuras(selectedLegendaryCraftTarget);
                            setSelectedLegendaryCraftTarget(null);
                          }
                        }}
                      >
                        Forge
                      </button>
                    </div>
                  )}
                </div>

                {/* Thunderfury Crafting Card */}
                <div className={`craft-card ${engine.canCraftThunderfury() ? 'available' : engine.hasThunderfuryMaterialsButNeedsFiremaw() ? 'needs-boss' : 'unavailable'}`}>
                  <div className="craft-card-header">
                    <img
                      src="https://wow.zamimg.com/images/wow/icons/large/inv_sword_39.jpg"
                      alt="Thunderfury"
                      className="craft-card-icon"
                    />
                    <div className="craft-card-info">
                      <span className="craft-card-name legendary-text">Thunderfury, Blessed Blade of the Windseeker</span>
                      <span className="craft-card-type">One-Hand Sword</span>
                    </div>
                  </div>
                  <div className="craft-card-reqs">
                    <div className={`req ${state.legendaryMaterials.includes('bindings_of_the_windseeker_left') ? 'met' : 'unmet'}`}>
                      {state.legendaryMaterials.includes('bindings_of_the_windseeker_left') ? '✓' : '○'} Left Binding
                    </div>
                    <div className={`req ${state.legendaryMaterials.includes('bindings_of_the_windseeker_right') ? 'met' : 'unmet'}`}>
                      {state.legendaryMaterials.includes('bindings_of_the_windseeker_right') ? '✓' : '○'} Right Binding
                    </div>
                    <div className={`req ${state.defeatedBosses.includes('firemaw') ? 'met' : 'unmet'}`}>
                      {state.defeatedBosses.includes('firemaw') ? '✓' : '○'} Defeat Firemaw
                      {!state.defeatedBosses.includes('firemaw') && <span className="coming-soon">(BWL - Coming Soon)</span>}
                    </div>
                  </div>
                  {engine.hasThunderfuryMaterialsButNeedsFiremaw() && (
                    <div className="craft-card-blocked">
                      You have both bindings! Defeat Firemaw in BWL to summon Prince Thunderaan.
                    </div>
                  )}
                  {engine.canCraftThunderfury() && (
                    <div className="craft-card-action">
                      <select
                        className="craft-recipient-select"
                        value={selectedLegendaryCraftTarget || ''}
                        onChange={e => setSelectedLegendaryCraftTarget(e.target.value)}
                      >
                        <option value="">Select recipient...</option>
                        {state.raid
                          .filter(m => ['warrior', 'rogue', 'paladin', 'hunter'].includes(m.class))
                          .map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.class})
                            </option>
                          ))}
                      </select>
                      <button
                        className="craft-button thunderfury"
                        disabled={!selectedLegendaryCraftTarget}
                        onClick={() => {
                          if (selectedLegendaryCraftTarget) {
                            engine.craftThunderfury(selectedLegendaryCraftTarget);
                            setSelectedLegendaryCraftTarget(null);
                          }
                        }}
                      >
                        Forge
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
