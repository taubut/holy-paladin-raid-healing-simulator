import React, { useState, useMemo } from 'react';
import type { AttendanceCheck, LFGRecruit } from '../../game/franchiseTypes';
import type { BenchPlayer, WoWClass } from '../../game/types';
import { CLASS_COLORS } from '../../game/types';
import { ENCOUNTERS } from '../../game/encounters';
import './RaidPrepScreen.css';

// Get class icon for display
function getClassIcon(className: string): string {
  const classIcons: Record<string, string> = {
    warrior: '/icons/classicon_warrior.jpg',
    paladin: '/icons/classicon_paladin.jpg',
    hunter: '/icons/classicon_hunter.jpg',
    rogue: '/icons/classicon_rogue.jpg',
    priest: '/icons/classicon_priest.jpg',
    shaman: '/icons/classicon_shaman.jpg',
    mage: '/icons/classicon_mage.jpg',
    warlock: '/icons/classicon_warlock.jpg',
    druid: '/icons/classicon_druid.jpg',
  };
  return classIcons[className.toLowerCase()] || '/icons/inv_misc_questionmark.jpg';
}

// Role icons
const ROLE_ICONS: Record<string, string> = {
  tank: '/icons/ability_warrior_defensivestance.jpg',
  healer: '/icons/spell_holy_flashheal.jpg',
  dps: '/icons/ability_backstab.jpg',
};

interface RaidPrepScreenProps {
  attendanceCheck: AttendanceCheck;
  benchPlayers: BenchPlayer[];
  lfgPool: LFGRecruit[];
  pendingEncounterId: string;
  raidWeek: number;
  renown: number;
  onStartRaid: () => void;
  onCancelRaid: () => void;
  onFillVacancy: (noShowId: string, replacementId: string, type: 'bench' | 'lfg') => boolean;
  onUnfillVacancy: (noShowId: string) => void;
  getPlayerInfo: (playerId: string) => { class: WoWClass; role: 'tank' | 'healer' | 'dps' } | undefined;
}

interface Replacement {
  noShowId: string;
  replacementId: string;
  type: 'bench' | 'lfg';
  // Store player info at time of fill (since they get moved out of bench/lfg)
  name: string;
  class: WoWClass;
  gearScore: number;
}

export const RaidPrepScreen: React.FC<RaidPrepScreenProps> = ({
  attendanceCheck,
  benchPlayers,
  lfgPool,
  pendingEncounterId,
  raidWeek,
  renown,
  onStartRaid,
  onCancelRaid,
  onFillVacancy,
  onUnfillVacancy,
  getPlayerInfo,
}) => {
  // Track which no-shows have been filled
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  // Track selected replacement for click-to-fill
  const [selectedReplacement, setSelectedReplacement] = useState<{ id: string; type: 'bench' | 'lfg' } | null>(null);

  // Get boss name from encounter ID
  const encounter = ENCOUNTERS.find(e => e.id === pendingEncounterId);
  const bossName = encounter?.name || 'Unknown Boss';

  // Get no-shows from attendance records
  const noShows = attendanceCheck.records.filter(r => r.status === 'no_show');
  const presentCount = attendanceCheck.records.filter(r => r.status === 'present').length;

  // Calculate which replacements are already used
  const usedReplacementIds = new Set(replacements.map(r => r.replacementId));

  // Filter bench players by needed roles and exclude already used
  const availableBench = useMemo(() => {
    const neededRoles = new Set(noShows.map(ns => {
      const info = getPlayerInfo(ns.playerId);
      return info?.role;
    }).filter(Boolean));

    return benchPlayers.filter(bp =>
      !usedReplacementIds.has(bp.id) && neededRoles.has(bp.role)
    );
  }, [benchPlayers, noShows, usedReplacementIds, getPlayerInfo]);

  // Filter LFG by needed roles and exclude already used
  const availableLFG = useMemo(() => {
    const neededRoles = new Set(noShows.map(ns => {
      const info = getPlayerInfo(ns.playerId);
      return info?.role;
    }).filter(Boolean));

    return lfgPool.filter(recruit =>
      !usedReplacementIds.has(recruit.id) && neededRoles.has(recruit.role)
    );
  }, [lfgPool, noShows, usedReplacementIds, getPlayerInfo]);

  // Check if a no-show slot is filled - returns stored info from when fill happened
  const getFilledReplacement = (noShowId: string) => {
    const replacement = replacements.find(r => r.noShowId === noShowId);
    if (!replacement) return null;

    return {
      name: replacement.name,
      class: replacement.class,
      gearScore: replacement.gearScore,
      type: replacement.type,
    };
  };

  // Handle clicking on a vacancy slot
  const handleVacancyClick = (noShowId: string) => {
    if (selectedReplacement) {
      // Get player info BEFORE the fill (they'll be moved after)
      let playerInfo: { name: string; class: WoWClass; gearScore: number } | null = null;
      if (selectedReplacement.type === 'bench') {
        const bp = benchPlayers.find(b => b.id === selectedReplacement.id);
        if (bp) playerInfo = { name: bp.name, class: bp.class, gearScore: bp.gearScore };
      } else {
        const recruit = lfgPool.find(r => r.id === selectedReplacement.id);
        if (recruit) playerInfo = { name: recruit.name, class: recruit.class, gearScore: recruit.gearScore };
      }

      // Try to fill the vacancy - only update local state if successful
      const success = onFillVacancy(noShowId, selectedReplacement.id, selectedReplacement.type);
      if (success && playerInfo) {
        const newReplacement: Replacement = {
          noShowId,
          replacementId: selectedReplacement.id,
          type: selectedReplacement.type,
          name: playerInfo.name,
          class: playerInfo.class,
          gearScore: playerInfo.gearScore,
        };
        setReplacements([...replacements, newReplacement]);
      }
      setSelectedReplacement(null);
    }
  };

  // Handle clicking on a replacement card
  const handleReplacementClick = (id: string, type: 'bench' | 'lfg') => {
    if (selectedReplacement?.id === id) {
      setSelectedReplacement(null);
    } else {
      setSelectedReplacement({ id, type });
    }
  };

  // Handle clearing a filled vacancy
  const handleClearVacancy = (noShowId: string) => {
    setReplacements(replacements.filter(r => r.noShowId !== noShowId));
    onUnfillVacancy(noShowId);
  };

  // Calculate role counts for footer
  const getRoleCounts = () => {
    const noShowsByRole = { tank: 0, healer: 0, dps: 0 };
    const filledByRole = { tank: 0, healer: 0, dps: 0 };

    noShows.forEach(ns => {
      const info = getPlayerInfo(ns.playerId);
      if (info?.role) {
        noShowsByRole[info.role]++;
        const filled = getFilledReplacement(ns.playerId);
        if (filled) {
          filledByRole[info.role]++;
        }
      }
    });

    return { noShowsByRole, filledByRole };
  };

  const { filledByRole } = getRoleCounts();

  // Can start raid? Need at least 1 tank and 2 healers total (present + filled)
  const tanksFilled = filledByRole.tank;
  const healersFilled = filledByRole.healer;
  const tanksNeeded = attendanceCheck.tanksMissing;
  const healersNeeded = attendanceCheck.healersMissing;

  // Check if we have enough after filling
  const canStart = (tanksNeeded - tanksFilled <= 0 || tanksNeeded === 0) &&
                   (healersNeeded - healersFilled <= 1 || healersNeeded <= 1);

  return (
    <div className="raid-prep-overlay">
      <div className="raid-prep-container">
        {/* Header */}
        <div className="raid-prep-header">
          <div className="raid-prep-header-left">
            <span className="raid-prep-icon">📋</span>
            <div>
              <h1>Raid Preparation</h1>
              <span className="raid-prep-boss">Preparing for: {bossName}</span>
            </div>
          </div>
          <div className="raid-prep-header-right">
            <span className="raid-prep-renown">Renown: {renown}</span>
            <span className="raid-prep-week">Week {raidWeek}</span>
          </div>
        </div>

        {/* Main Content - 3 columns */}
        <div className="raid-prep-content">
          {/* Left: No-Shows */}
          <div className="raid-prep-column no-shows-column">
            <h2 className="column-header">
              <span className="column-icon">❌</span>
              No-Shows ({noShows.length})
            </h2>
            <div className="no-shows-list">
              {noShows.map(noShow => {
                const info = getPlayerInfo(noShow.playerId);
                const playerClass = info?.class || 'warrior';
                const classColor = CLASS_COLORS[playerClass] || '#ffffff';

                return (
                  <div key={noShow.playerId} className="no-show-card">
                    <img
                      src={getClassIcon(playerClass)}
                      alt={noShow.playerName}
                      className="no-show-icon"
                      style={{ borderColor: classColor }}
                    />
                    <div className="no-show-info">
                      <span className="no-show-name" style={{ color: classColor }}>
                        {noShow.playerName}
                      </span>
                      <span className="no-show-role">{info?.role}</span>
                      <span className="no-show-excuse">"{noShow.excuse}"</span>
                    </div>
                    {noShow.roleStress === 'critical' && (
                      <span className="stress-badge critical">CRITICAL</span>
                    )}
                    {noShow.roleStress === 'high' && (
                      <span className="stress-badge high">HIGH</span>
                    )}
                    {noShow.roleStress === 'medium' && (
                      <span className="stress-badge medium">MEDIUM</span>
                    )}
                  </div>
                );
              })}
              {noShows.length === 0 && (
                <div className="no-shows-empty">
                  Everyone showed up! 🎉
                </div>
              )}
            </div>
          </div>

          {/* Center: Vacancies */}
          <div className="raid-prep-column vacancies-column">
            <h2 className="column-header">
              <span className="column-icon">👥</span>
              Fill Vacancies
            </h2>
            <div className="vacancies-grid">
              {noShows.map(noShow => {
                const info = getPlayerInfo(noShow.playerId);
                const role = info?.role || 'dps';
                const filled = getFilledReplacement(noShow.playerId);

                if (filled) {
                  // Filled slot - show the replacement's info
                  const filledColor = CLASS_COLORS[filled.class] || '#ffffff';
                  return (
                    <div
                      key={noShow.playerId}
                      className={`vacancy-slot filled ${role}`}
                      onClick={() => handleClearVacancy(noShow.playerId)}
                    >
                      <img
                        src={getClassIcon(filled.class)}
                        alt={filled.name}
                        className="vacancy-filled-icon"
                        style={{ borderColor: filledColor }}
                      />
                      <span className="vacancy-filled-name" style={{ color: filledColor }}>
                        {filled.name}
                      </span>
                      <span className="vacancy-filled-gs">GS: {filled.gearScore}</span>
                      <span className="vacancy-filled-type">
                        {filled.type === 'bench' ? '(Bench)' : '(LFG)'}
                      </span>
                      <span className="vacancy-clear-hint">Click to remove</span>
                    </div>
                  );
                }

                // Empty slot
                return (
                  <div
                    key={noShow.playerId}
                    className={`vacancy-slot empty ${role} ${selectedReplacement ? 'can-fill' : ''}`}
                    onClick={() => selectedReplacement && handleVacancyClick(noShow.playerId)}
                  >
                    <img
                      src={ROLE_ICONS[role]}
                      alt={role}
                      className="vacancy-role-icon"
                    />
                    <span className="vacancy-needed">
                      {role === 'tank' ? 'Tank' : role === 'healer' ? 'Healer' : 'DPS'} Needed
                    </span>
                    <span className="vacancy-replacing">
                      Replacing: {noShow.playerName}
                    </span>
                    {selectedReplacement && (
                      <span className="vacancy-click-hint">Click to assign</span>
                    )}
                  </div>
                );
              })}
              {noShows.length === 0 && (
                <div className="vacancies-empty">
                  No vacancies to fill!
                </div>
              )}
            </div>
          </div>

          {/* Right: Replacements */}
          <div className="raid-prep-column replacements-column">
            {/* Bench Section */}
            <div className="replacements-section bench-section">
              <h2 className="column-header">
                <span className="column-icon">🪑</span>
                Your Bench ({availableBench.length})
              </h2>
              <div className="replacements-list">
                {availableBench.map(bp => {
                  const classColor = CLASS_COLORS[bp.class] || '#ffffff';
                  const isSelected = selectedReplacement?.id === bp.id;

                  return (
                    <div
                      key={bp.id}
                      className={`replacement-card bench ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleReplacementClick(bp.id, 'bench')}
                    >
                      <img
                        src={getClassIcon(bp.class)}
                        alt={bp.name}
                        className="replacement-icon"
                        style={{ borderColor: classColor }}
                      />
                      <div className="replacement-info">
                        <span className="replacement-name" style={{ color: classColor }}>
                          {bp.name}
                        </span>
                        <span className="replacement-spec">{bp.role}</span>
                        <span className="replacement-gs">GS: {bp.gearScore}</span>
                      </div>
                      {isSelected && <span className="selected-badge">Selected</span>}
                    </div>
                  );
                })}
                {availableBench.length === 0 && (
                  <div className="replacements-empty">
                    No bench players for needed roles
                  </div>
                )}
              </div>
            </div>

            {/* LFG Section */}
            <div className="replacements-section lfg-section">
              <h2 className="column-header">
                <span className="column-icon">📢</span>
                Looking For Group ({availableLFG.length})
              </h2>
              <div className="replacements-list">
                {availableLFG.map(recruit => {
                  const classColor = CLASS_COLORS[recruit.class] || '#ffffff';
                  const isSelected = selectedReplacement?.id === recruit.id;
                  const canAfford = renown >= recruit.renownCost;

                  return (
                    <div
                      key={recruit.id}
                      className={`replacement-card lfg ${isSelected ? 'selected' : ''} ${recruit.isEmergencyFill ? 'emergency' : ''} ${!canAfford ? 'cant-afford' : ''}`}
                      onClick={() => canAfford && handleReplacementClick(recruit.id, 'lfg')}
                      style={{ cursor: canAfford ? 'pointer' : 'not-allowed' }}
                    >
                      <img
                        src={getClassIcon(recruit.class)}
                        alt={recruit.name}
                        className="replacement-icon"
                        style={{ borderColor: classColor, opacity: canAfford ? 1 : 0.5 }}
                      />
                      <div className="replacement-info">
                        <span className="replacement-name" style={{ color: canAfford ? classColor : '#666' }}>
                          {recruit.name}
                        </span>
                        <span className="replacement-spec">{recruit.role}</span>
                        <span className="replacement-gs">GS: {recruit.gearScore}</span>
                        {recruit.isEmergencyFill && (
                          <span className="emergency-badge">1 Raid Only</span>
                        )}
                        <span className={`replacement-cost ${!canAfford ? 'too-expensive' : ''}`}>
                          {recruit.renownCost} Renown {!canAfford && '(Can\'t afford)'}
                        </span>
                      </div>
                      {isSelected && <span className="selected-badge">Selected</span>}
                    </div>
                  );
                })}
                {availableLFG.length === 0 && (
                  <div className="replacements-empty">
                    No LFG recruits for needed roles
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="raid-prep-footer">
          <div className="raid-prep-status">
            <span className={`status-role ${tanksNeeded - tanksFilled <= 0 ? 'ok' : 'missing'}`}>
              Tanks: {tanksFilled}/{tanksNeeded} filled
              {tanksNeeded - tanksFilled <= 0 ? ' ✓' : ' ⚠'}
            </span>
            <span className={`status-role ${healersNeeded - healersFilled <= 1 ? 'ok' : 'missing'}`}>
              Healers: {healersFilled}/{healersNeeded} filled
              {healersNeeded - healersFilled <= 1 ? ' ✓' : ' ⚠'}
            </span>
            <span className="status-role">
              Present: {presentCount} raiders
            </span>
          </div>
          <div className="raid-prep-actions">
            <button
              className={`raid-prep-btn start ${canStart ? '' : 'disabled'}`}
              onClick={onStartRaid}
              disabled={!canStart}
            >
              {canStart ? '✅ Start Raid' : '⛔ Missing Critical Roles'}
            </button>
            <button className="raid-prep-btn cancel" onClick={onCancelRaid}>
              ❌ Cancel Raid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
