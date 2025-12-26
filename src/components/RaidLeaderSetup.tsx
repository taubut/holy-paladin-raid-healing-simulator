import { useState } from 'react';
import type { GameState, WoWClass, WoWSpec, Faction } from '../game/types';
import { CLASS_COLORS, CLASS_SPECS, getSpecById } from '../game/types';
import { PARTY_AURAS, memberProvidesAura } from '../game/auras';
import type { GameEngine } from '../game/GameEngine';
import { LFGBoard } from './franchise/LFGBoard';
import { PersonalityBadgeRow } from './franchise/PersonalityBadge';
import { MoraleIndicator } from './franchise/MoraleBar';
import './RaidLeaderSetup.css';

interface RaidLeaderSetupProps {
  isOpen: boolean;
  onStartRaid: () => void;
  engine: GameEngine;
  state: GameState;
  faction: Faction;
  raidSize: 20 | 40;
}

export function RaidLeaderSetup({
  isOpen,
  onStartRaid,
  engine,
  state,
  faction,
  raidSize,
}: RaidLeaderSetupProps) {
  // Local state for the setup UI
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<WoWClass | null>(null);
  const [selectedBenchPlayer, setSelectedBenchPlayer] = useState<string | null>(null);
  const [draggedBenchPlayer, setDraggedBenchPlayer] = useState<string | null>(null);
  const [hoveredAura, setHoveredAura] = useState<{ aura: typeof PARTY_AURAS[string], providerName: string } | null>(null);
  const [showLFGBoard, setShowLFGBoard] = useState(false);

  if (!isOpen) return null;

  // Get counts based on selected raid size (20-man or 40-man)
  const totalRaidMembers = state.raid.length;
  const maxRaidSize = raidSize;
  const maxBenchSize = raidSize === 40 ? 10 : 5;
  const currentBenchSize = state.benchPlayers.length;
  const numGroups = raidSize === 40 ? 8 : 4;

  // Handle adding a new player with selected class and spec
  const handleAddPlayer = (wowClass: WoWClass, spec: WoWSpec) => {
    engine.createBenchPlayer(wowClass, spec);
    setShowAddPlayerModal(false);
    setSelectedClass(null);
  };

  // Handle dropping a bench player into a group
  const handleDropToGroup = (benchPlayerId: string, groupNumber: number) => {
    engine.moveBenchPlayerToRaid(benchPlayerId, groupNumber);
    setDraggedBenchPlayer(null);
    setSelectedBenchPlayer(null);
  };

  // Handle clicking an empty slot when a bench player is selected
  const handleEmptySlotClick = (groupNumber: number) => {
    if (selectedBenchPlayer) {
      engine.moveBenchPlayerToRaid(selectedBenchPlayer, groupNumber);
      setSelectedBenchPlayer(null);
    }
  };

  // Handle removing a player from the raid back to staging
  const handleRemoveFromRaid = (memberId: string) => {
    engine.moveRaidMemberToBench(memberId);
  };

  // Handle recruiting from LFG (Franchise mode)
  const handleRecruitFromLFG = (recruitId: string) => {
    // Check bench capacity first (engine does too, but we want to show alert)
    if (currentBenchSize >= maxBenchSize) {
      alert('Bench is full! Remove a player first.');
      return;
    }

    // Use engine method for proper state management
    const success = engine.recruitFromLFG(recruitId);
    if (success) {
      // Close LFG board on successful recruit
      setShowLFGBoard(false);
    }
  };

  // Open LFG Board (initializes pool if needed)
  const handleOpenLFG = () => {
    engine.initializeFranchiseMode();
    setShowLFGBoard(true);
  };

  // Render raid groups (4 for 20-man, 8 for 40-man)
  const renderGroups = () => {
    const groupNumbers = Array.from({ length: numGroups }, (_, i) => i + 1);
    return groupNumbers.map(groupNum => {
      const groupMembers = state.raid.filter(m => m.group === groupNum);

      // Get active party auras in this group
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
          className={`rls-group ${draggedBenchPlayer ? 'drop-target' : ''}`}
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
            const benchPlayerId = e.dataTransfer.getData('benchPlayerId');
            if (benchPlayerId) {
              handleDropToGroup(benchPlayerId, groupNum);
            }
          }}
        >
          <div className="rls-group-header">
            <span className="rls-group-number">Group {groupNum}</span>
            <div className="rls-group-auras">
              {Array.from(groupAuras).map(auraId => {
                const aura = PARTY_AURAS[auraId];
                const provider = groupMembers.find(m => memberProvidesAura(m, aura));
                return (
                  <img
                    key={auraId}
                    src={aura.icon}
                    alt={aura.name}
                    className="rls-group-aura-icon"
                    title={`${aura.name} from ${provider?.name || 'Unknown'}`}
                    onMouseEnter={() => setHoveredAura({ aura, providerName: provider?.name || 'Unknown' })}
                    onMouseLeave={() => setHoveredAura(null)}
                  />
                );
              })}
            </div>
          </div>
          <div className="rls-group-members">
            {/* Existing members */}
            {groupMembers.map(member => {
              const classColor = CLASS_COLORS[member.class];
              const specDef = getSpecById(member.spec);
              const memberAuras = Object.values(PARTY_AURAS).filter(a => a.isAutomatic && memberProvidesAura(member, a));

              return (
                <div
                  key={member.id}
                  className={`rls-member ${member.personality ? 'franchise-mode' : ''}`}
                  style={{ borderLeftColor: classColor }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleRemoveFromRaid(member.id);
                  }}
                  title="Right-click to remove from raid"
                >
                  <div className="rls-member-info">
                    <span className="rls-member-name" style={{ color: classColor }}>
                      {member.name}
                    </span>
                    <span className="rls-member-spec">{specDef?.name || member.class}</span>
                    {/* Franchise Mode: Show personality traits and morale */}
                    {member.personality && member.personality.length > 0 && (
                      <div className="rls-member-franchise-info">
                        <PersonalityBadgeRow
                          traits={member.personality}
                          size="small"
                          maxVisible={2}
                        />
                        {member.morale && <MoraleIndicator morale={member.morale} leaveWarnings={member.leaveWarnings} />}
                      </div>
                    )}
                  </div>
                  <div className="rls-member-right">
                    <div className="rls-member-auras">
                      {memberAuras.filter(a => a.isAutomatic).map(aura => (
                        <img
                          key={aura.id}
                          src={aura.icon}
                          alt={aura.name}
                          className="rls-member-aura-icon"
                          title={aura.name}
                        />
                      ))}
                    </div>
                    <span className={`rls-role-tag ${member.role}`}>
                      {member.role === 'tank' ? 'Tank' : member.role === 'healer' ? 'Healer' : 'DPS'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: 5 - groupMembers.length }, (_, i) => (
              <div
                key={`empty-${groupNum}-${i}`}
                className={`rls-empty-slot ${selectedBenchPlayer ? 'can-add' : ''} ${draggedBenchPlayer ? 'drop-target' : ''}`}
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
                  const benchPlayerId = e.dataTransfer.getData('benchPlayerId');
                  if (benchPlayerId) {
                    handleDropToGroup(benchPlayerId, groupNum);
                  }
                }}
                onClick={() => handleEmptySlotClick(groupNum)}
              >
                <span className="rls-empty-text">
                  {selectedBenchPlayer ? '+ Add Here' : 'Empty'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="rls-overlay">
      <div className="rls-modal">
        <div className="rls-header">
          <h2>Build Your Raid ({raidSize}-Man)</h2>
          <div className="rls-header-counts">
            <span className="rls-count">{totalRaidMembers}/{maxRaidSize} raid</span>
            <span className="rls-count-divider">•</span>
            <span className="rls-count">{currentBenchSize}/{maxBenchSize} bench</span>
          </div>
        </div>

        {/* Guild Status Bar */}
        <div className="rls-franchise-header">
          <div className="rls-franchise-stat reputation">
            <span className="rls-franchise-label">Reputation:</span>
            <span className="rls-franchise-value">{state.franchiseReputation}</span>
            <span className="rls-franchise-tier">({state.franchiseReputationTier})</span>
          </div>
          <div className="rls-franchise-stat renown">
            <span className="rls-franchise-label">Renown:</span>
            <span className="rls-franchise-value">{state.franchiseRenown ?? 0}</span>
          </div>
        </div>

        <p className="rls-instructions">
          Add players using the button below, then drag them to groups. Right-click to remove from raid.
        </p>

        <div className="rls-content">
          {/* Left: Raid Groups */}
          <div className="rls-groups-section">
            <div className={`rls-groups-grid ${raidSize === 20 ? 'raid-20' : 'raid-40'}`}>
              {renderGroups()}
            </div>
          </div>

          {/* Right: Player Pool & Bench */}
          <div className="rls-staging-section">
            <h3 className="rls-staging-title">
              Player Pool ({state.benchPlayers.length})
            </h3>
            <p className="rls-staging-hint">
              Drag to groups to add to raid. Players left here become your <strong>Bench</strong>.
            </p>

            <div className="rls-staging-players">
              {state.benchPlayers.length === 0 ? (
                <div className="rls-staging-empty">
                  <p>No players yet</p>
                  <p className="rls-staging-empty-hint">Click the button below to add players</p>
                </div>
              ) : (
                state.benchPlayers.map(player => {
                  const classColor = CLASS_COLORS[player.class];
                  const specDef = getSpecById(player.spec);
                  const isSelected = selectedBenchPlayer === player.id;

                  return (
                    <div
                      key={player.id}
                      className={`rls-staging-player ${isSelected ? 'selected' : ''} franchise-mode`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('benchPlayerId', player.id);
                        setDraggedBenchPlayer(player.id);
                      }}
                      onDragEnd={() => setDraggedBenchPlayer(null)}
                      onClick={() => setSelectedBenchPlayer(isSelected ? null : player.id)}
                    >
                      <div className="rls-staging-class-bar" style={{ backgroundColor: classColor }} />
                      <div className="rls-staging-info">
                        <span className="rls-staging-name" style={{ color: classColor }}>
                          {player.name}
                        </span>
                        <span className="rls-staging-spec">{specDef?.name || player.class}</span>
                        {/* Franchise Mode: Show personality traits and morale */}
                        {player.personality && player.personality.length > 0 && (
                          <div className="rls-staging-franchise-info">
                            <PersonalityBadgeRow
                              traits={player.personality}
                              size="small"
                              maxVisible={3}
                            />
                            {player.morale && <MoraleIndicator morale={player.morale} leaveWarnings={player.leaveWarnings} />}
                          </div>
                        )}
                      </div>
                      <span className={`rls-staging-role ${player.role}`}>
                        {player.role === 'tank' ? 'Tank' : player.role === 'healer' ? 'Healer' : 'DPS'}
                      </span>
                      <button
                        className="rls-staging-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          engine.removeBenchPlayer(player.id);
                        }}
                        title="Remove player"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button
              className="rls-add-player-btn"
              onClick={() => setShowAddPlayerModal(true)}
            >
              + Add New Player
            </button>

            <button
              className="rls-add-player-btn rls-lfg-btn"
              onClick={handleOpenLFG}
            >
              Browse LFG
            </button>

            {selectedBenchPlayer && (
              <div className="rls-selection-hint">
                Click an empty group slot to place {state.benchPlayers.find(p => p.id === selectedBenchPlayer)?.name}
                <button className="rls-cancel-selection" onClick={() => setSelectedBenchPlayer(null)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Player Modal */}
        {showAddPlayerModal && (
          <div className="rls-add-modal">
            <div className="rls-add-modal-header">
              <h3>{selectedClass ? 'Select Spec' : 'Select Class'}</h3>
              <button
                className="rls-add-modal-close"
                onClick={() => { setShowAddPlayerModal(false); setSelectedClass(null); }}
              >
                ×
              </button>
            </div>

            {!selectedClass ? (
              <div className="rls-class-grid">
                {(Object.keys(CLASS_SPECS) as WoWClass[])
                  .filter(wowClass => {
                    // Filter based on faction
                    if (faction === 'alliance' && wowClass === 'shaman') return false;
                    if (faction === 'horde' && wowClass === 'paladin') return false;
                    return true;
                  })
                  .map(wowClass => {
                    const classColor = CLASS_COLORS[wowClass];
                    return (
                      <button
                        key={wowClass}
                        className="rls-class-btn"
                        style={{ borderColor: classColor }}
                        onClick={() => setSelectedClass(wowClass)}
                      >
                        <span style={{ color: classColor }}>
                          {wowClass.charAt(0).toUpperCase() + wowClass.slice(1)}
                        </span>
                      </button>
                    );
                  })}
              </div>
            ) : (
              <>
                <div className="rls-spec-grid">
                  {CLASS_SPECS[selectedClass].map(specDef => (
                    <button
                      key={specDef.id}
                      className="rls-spec-btn"
                      style={{ borderColor: CLASS_COLORS[selectedClass] }}
                      onClick={() => handleAddPlayer(selectedClass, specDef.id)}
                    >
                      <img src={specDef.icon} alt={specDef.name} className="rls-spec-icon" />
                      <div className="rls-spec-info">
                        <span className="rls-spec-name" style={{ color: CLASS_COLORS[selectedClass] }}>
                          {specDef.name}
                        </span>
                        <span className="rls-spec-role">
                          {specDef.role === 'tank' ? 'Tank' : specDef.role === 'healer' ? 'Healer' : 'DPS'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <button className="rls-back-btn" onClick={() => setSelectedClass(null)}>
                  ← Back to Classes
                </button>
              </>
            )}
          </div>
        )}

        {/* Aura Tooltip */}
        {hoveredAura && (
          <div className="rls-aura-tooltip">
            <img src={hoveredAura.aura.icon} alt={hoveredAura.aura.name} className="rls-tooltip-icon" />
            <div className="rls-tooltip-content">
              <span className="rls-tooltip-name">{hoveredAura.aura.name}</span>
              <span className="rls-tooltip-provider">From: {hoveredAura.providerName}</span>
            </div>
          </div>
        )}

        {/* LFG Board Modal (Franchise Mode) */}
        {showLFGBoard && (
          <LFGBoard
            recruits={state.franchiseLFGPool}
            guildReputation={state.franchiseReputation ?? 0}
            guildReputationTier={state.franchiseReputationTier ?? 'unknown'}
            guildRenown={state.franchiseRenown ?? 0}
            onRecruit={handleRecruitFromLFG}
            onClose={() => setShowLFGBoard(false)}
          />
        )}

        <div className="rls-footer">
          <div className="rls-footer-info">
            <div className="rls-footer-stats">
              <span className="rls-stat">
                <strong>{totalRaidMembers}</strong> in raid
              </span>
              <span className="rls-stat-divider">•</span>
              <span className="rls-stat">
                <strong>{state.benchPlayers.length}</strong> on bench
              </span>
            </div>
            <span className="rls-tip">Tip: Bench players can be swapped in during raids for different encounters</span>
          </div>
          <button
            className="rls-start-btn"
            onClick={onStartRaid}
            disabled={totalRaidMembers === 0}
          >
            {totalRaidMembers === 0 ? 'Add Players to Start' : 'Start Raid'}
          </button>
        </div>
      </div>
    </div>
  );
}
