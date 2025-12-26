import { useState, useMemo } from 'react';
import type { LFGRecruit } from '../../game/franchiseTypes';
import type { WoWClass, WoWSpec } from '../../game/types';
import { CLASS_COLORS } from '../../game/types';
import { PersonalityBadgeRow } from './PersonalityBadge';
import { MoraleIndicator } from './MoraleBar';
import { RecruitInspection } from './RecruitInspection';
import './LFGBoard.css';

// Spec icon mapping - maps WoWSpec IDs to icon paths
const SPEC_ICONS: Record<WoWSpec, string> = {
  // Warrior
  arms: '/icons/spec_warrior_arms.png',
  fury: '/icons/spec_warrior_fury.png',
  fury_prot: '/icons/spec_warrior_protection.png',
  protection_warrior: '/icons/spec_warrior_protection.png',
  // Paladin
  holy_paladin: '/icons/spec_paladin_holy.png',
  protection_paladin: '/icons/spec_paladin_protection.png',
  retribution: '/icons/spec_paladin_retribution.png',
  // Hunter
  beast_mastery: '/icons/spec_hunter_beastmastery.png',
  marksmanship: '/icons/spec_hunter_marksmanship.png',
  survival: '/icons/spec_hunter_survival.png',
  // Rogue
  assassination: '/icons/spec_rogue_assassination.png',
  combat: '/icons/spec_rogue_combat.png',
  subtlety: '/icons/spec_rogue_subtlety.png',
  // Priest
  discipline: '/icons/spec_priest_discipline.png',
  holy_priest: '/icons/spec_priest_holy.png',
  shadow: '/icons/spec_priest_shadow.png',
  // Shaman
  elemental: '/icons/spec_shaman_elemental.png',
  enhancement: '/icons/spec_shaman_enhancement.png',
  restoration_shaman: '/icons/spec_shaman_restoration.png',
  // Mage
  arcane: '/icons/spec_mage_arcane.png',
  fire_mage: '/icons/spec_mage_fire.png',
  frost_mage: '/icons/spec_mage_frost.png',
  // Warlock
  affliction: '/icons/spec_warlock_affliction.png',
  demonology: '/icons/spec_warlock_demonology.png',
  destruction: '/icons/spec_warlock_destruction.png',
  // Druid
  balance: '/icons/spec_druid_balance.png',
  feral_tank: '/icons/spec_druid_guardian.png',
  feral_dps: '/icons/spec_druid_feral.png',
  restoration: '/icons/spec_druid_restoration.png',
};

// Get spec icon with fallback
function getSpecIcon(spec: WoWSpec): string {
  return SPEC_ICONS[spec] || '/icons/inv_misc_questionmark.jpg';
}

interface LFGBoardProps {
  recruits: LFGRecruit[];
  guildReputation: number;
  guildReputationTier: 'unknown' | 'rising' | 'established' | 'famous' | 'legendary';
  guildRenown: number;
  onRecruit: (recruitId: string) => void;
  onClose: () => void;
}

const CLASS_OPTIONS: { value: WoWClass | 'all'; label: string }[] = [
  { value: 'all', label: 'All Classes' },
  { value: 'warrior', label: 'Warrior' },
  { value: 'paladin', label: 'Paladin' },
  { value: 'hunter', label: 'Hunter' },
  { value: 'rogue', label: 'Rogue' },
  { value: 'priest', label: 'Priest' },
  { value: 'shaman', label: 'Shaman' },
  { value: 'mage', label: 'Mage' },
  { value: 'warlock', label: 'Warlock' },
  { value: 'druid', label: 'Druid' },
];

const ROLE_OPTIONS: { value: 'tank' | 'healer' | 'dps' | 'all'; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'tank', label: 'Tanks' },
  { value: 'healer', label: 'Healers' },
  { value: 'dps', label: 'DPS' },
];

export function LFGBoard({ recruits, guildReputation, guildReputationTier, guildRenown, onRecruit, onClose }: LFGBoardProps) {
  const [classFilter, setClassFilter] = useState<WoWClass | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<'tank' | 'healer' | 'dps' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'gearScore' | 'name' | 'weeksLeft'>('gearScore');
  const [inspectedRecruit, setInspectedRecruit] = useState<LFGRecruit | null>(null);
  const [showRepInfo, setShowRepInfo] = useState(false);
  const [showRenownInfo, setShowRenownInfo] = useState(false);

  // Handle recruiting from inspection panel
  const handleRecruitFromInspection = (recruitId: string) => {
    onRecruit(recruitId);
    setInspectedRecruit(null);
  };

  // Filter and sort recruits
  const filteredRecruits = useMemo(() => {
    let result = [...recruits];

    // Apply class filter
    if (classFilter !== 'all') {
      result = result.filter(r => r.class === classFilter);
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(r => r.role === roleFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'gearScore':
          return b.gearScore - a.gearScore;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'weeksLeft':
          return a.weeksUntilGone - b.weeksUntilGone;
        default:
          return 0;
      }
    });

    return result;
  }, [recruits, classFilter, roleFilter, sortBy]);

  // Count by role for stats
  const roleCounts = useMemo(() => {
    const counts = { tank: 0, healer: 0, dps: 0 };
    recruits.forEach(r => counts[r.role]++);
    return counts;
  }, [recruits]);

  return (
    <div className="lfg-board-overlay" onClick={onClose}>
      <div className="lfg-board-modal" onClick={e => e.stopPropagation()}>
        <div className="lfg-board-header">
          <h2>Looking For Group</h2>
          <div className="lfg-board-stats">
            <button
              className="lfg-stat reputation clickable"
              onClick={(e) => { e.stopPropagation(); setShowRepInfo(true); }}
              title="Click for reputation info"
            >
              Rep: {guildReputation} ({guildReputationTier})
            </button>
            <button
              className="lfg-stat renown clickable"
              onClick={(e) => { e.stopPropagation(); setShowRenownInfo(true); }}
              title="Click for renown info"
            >
              Renown: {guildRenown}
            </button>
            <span className="lfg-stat tank">Tanks: {roleCounts.tank}</span>
            <span className="lfg-stat healer">Healers: {roleCounts.healer}</span>
            <span className="lfg-stat dps">DPS: {roleCounts.dps}</span>
          </div>
          <button className="lfg-close-btn" onClick={onClose}>X</button>
        </div>

        <div className="lfg-board-filters">
          <div className="lfg-filter-group">
            <label>Class:</label>
            <select value={classFilter} onChange={e => setClassFilter(e.target.value as WoWClass | 'all')}>
              {CLASS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="lfg-filter-group">
            <label>Role:</label>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as 'tank' | 'healer' | 'dps' | 'all')}>
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="lfg-filter-group">
            <label>Sort:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'gearScore' | 'name' | 'weeksLeft')}>
              <option value="gearScore">Gear Score</option>
              <option value="name">Name</option>
              <option value="weeksLeft">Time Left</option>
            </select>
          </div>
        </div>

        <div className="lfg-board-content">
          {filteredRecruits.length === 0 ? (
            <div className="lfg-no-results">
              No recruits match your filters
            </div>
          ) : (
            <div className="lfg-recruit-grid">
              {filteredRecruits.map(recruit => (
                <RecruitCard
                  key={recruit.id}
                  recruit={recruit}
                  guildReputation={guildReputation}
                  guildRenown={guildRenown}
                  onRecruit={onRecruit}
                  onInspect={setInspectedRecruit}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lfg-board-footer">
          <span className="lfg-footer-hint">
            Click a recruit to view full details. Higher guild reputation unlocks better recruits.
          </span>
          <span className="lfg-total-count">
            Showing {filteredRecruits.length} of {recruits.length} recruits
          </span>
        </div>
      </div>

      {/* Recruit Inspection Panel */}
      {inspectedRecruit && (
        <RecruitInspection
          recruit={inspectedRecruit}
          guildReputation={guildReputation}
          guildRenown={guildRenown}
          onRecruit={handleRecruitFromInspection}
          onClose={() => setInspectedRecruit(null)}
        />
      )}

      {/* Reputation Info Modal */}
      {showRepInfo && (
        <div className="rep-info-overlay" onClick={() => setShowRepInfo(false)}>
          <div className="rep-info-modal" onClick={e => e.stopPropagation()}>
            <div className="rep-info-header">
              <h3>Guild Reputation</h3>
              <button className="rep-info-close" onClick={() => setShowRepInfo(false)}>×</button>
            </div>
            <div className="rep-info-content">
              <div className="rep-info-current">
                <span className="rep-info-value">{guildReputation}</span>
                <span className="rep-info-tier">{guildReputationTier}</span>
              </div>

              <div className="rep-info-section">
                <h4>How to Earn Reputation</h4>
                <ul>
                  <li><strong>Kill Bosses:</strong> Each boss kill grants reputation</li>
                  <li><strong>Molten Core / Onyxia:</strong> +1-2 rep per boss</li>
                  <li><strong>Blackwing Lair:</strong> +2-3 rep per boss</li>
                  <li><strong>Silithus:</strong> +3-4 rep per boss</li>
                  <li><strong>First Kill Bonus:</strong> +2 extra rep for new bosses!</li>
                </ul>
              </div>

              <div className="rep-info-section rep-info-negative">
                <h4>How to Lose Reputation</h4>
                <ul>
                  <li><strong>Player Leaves/Kicked:</strong> -2 to -3 rep (guild instability)</li>
                  <li><strong>Inactive Week:</strong> -2 to -3 rep if no boss kills</li>
                  <li><strong>Bad Drama Choices:</strong> -5 rep for unfair decisions</li>
                </ul>
              </div>

              <div className="rep-info-section">
                <h4>Reputation Tiers</h4>
                <div className="rep-tier-list">
                  <div className={`rep-tier ${guildReputationTier === 'unknown' ? 'current' : ''}`}>
                    <span className="tier-name">Unknown</span>
                    <span className="tier-range">0-20</span>
                    <span className="tier-desc">Basic recruits only</span>
                  </div>
                  <div className={`rep-tier ${guildReputationTier === 'rising' ? 'current' : ''}`}>
                    <span className="tier-name">Rising</span>
                    <span className="tier-range">21-40</span>
                    <span className="tier-desc">Some geared recruits</span>
                  </div>
                  <div className={`rep-tier ${guildReputationTier === 'established' ? 'current' : ''}`}>
                    <span className="tier-name">Established</span>
                    <span className="tier-range">41-60</span>
                    <span className="tier-desc">Good recruit pool</span>
                  </div>
                  <div className={`rep-tier ${guildReputationTier === 'famous' ? 'current' : ''}`}>
                    <span className="tier-name">Famous</span>
                    <span className="tier-range">61-80</span>
                    <span className="tier-desc">Great recruits available</span>
                  </div>
                  <div className={`rep-tier ${guildReputationTier === 'legendary' ? 'current' : ''}`}>
                    <span className="tier-name">Legendary</span>
                    <span className="tier-range">81-100</span>
                    <span className="tier-desc">Best recruits in the realm</span>
                  </div>
                </div>
              </div>

              <div className="rep-info-section">
                <h4>Why Reputation Matters</h4>
                <p>Higher reputation attracts better-geared players to your LFG pool. Some elite recruits require minimum reputation to even consider joining your guild!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renown Info Modal */}
      {showRenownInfo && (
        <div className="rep-info-overlay" onClick={() => setShowRenownInfo(false)}>
          <div className="rep-info-modal renown-info-modal" onClick={e => e.stopPropagation()}>
            <div className="rep-info-header renown-header">
              <h3>Guild Renown</h3>
              <button className="rep-info-close" onClick={() => setShowRenownInfo(false)}>×</button>
            </div>
            <div className="rep-info-content">
              <div className="rep-info-current renown-current">
                <span className="rep-info-value renown-value">{guildRenown}</span>
                <span className="rep-info-tier">Spendable Currency</span>
              </div>

              <div className="rep-info-section">
                <h4>How to Earn Renown</h4>
                <ul>
                  <li><strong>Kill Bosses:</strong> Each boss kill grants renown</li>
                  <li><strong>Molten Core / Onyxia:</strong> +5-10 renown per boss</li>
                  <li><strong>Blackwing Lair:</strong> +8-13 renown per boss</li>
                  <li><strong>Silithus:</strong> +12-17 renown per boss</li>
                  <li><strong>First Kill Bonus:</strong> +10 extra renown for new bosses!</li>
                </ul>
              </div>

              <div className="rep-info-section rep-info-negative">
                <h4>How Renown is Spent</h4>
                <ul>
                  <li><strong>Recruiting:</strong> Spend renown to recruit players from LFG</li>
                  <li><strong>Better Gear = Higher Cost:</strong> Well-geared recruits cost more</li>
                  <li><strong>Undergeared:</strong> 5-10 renown</li>
                  <li><strong>Pre-Raid BiS:</strong> 10-20 renown</li>
                  <li><strong>MC Geared:</strong> 35-50 renown</li>
                  <li><strong>BWL Ready:</strong> 75-100 renown</li>
                </ul>
              </div>

              <div className="rep-info-section">
                <h4>Renown vs Reputation</h4>
                <p><strong>Reputation</strong> is your guild's prestige - it determines what quality of recruits appear in your LFG pool. It's not spent.</p>
                <p><strong>Renown</strong> is currency you spend to actually recruit those players. Kill bosses to earn it!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual recruit card
interface RecruitCardProps {
  recruit: LFGRecruit;
  guildReputation: number;
  guildRenown: number;
  onRecruit: (recruitId: string) => void;
  onInspect: (recruit: LFGRecruit) => void;
}

function RecruitCard({ recruit, guildReputation, guildRenown, onRecruit, onInspect }: RecruitCardProps) {
  const hasEnoughReputation = guildReputation >= recruit.minReputationRequired;
  // Calculate renown cost if not present (for legacy recruits from older saves)
  const renownCost = recruit.renownCost ?? Math.max(5, Math.round((recruit.gearScore - 400) / 10));
  const hasEnoughRenown = guildRenown >= renownCost;
  const canRecruit = hasEnoughReputation && hasEnoughRenown;
  const classColor = CLASS_COLORS[recruit.class];

  // Spec icon (shows actual spec like Holy, Protection, Frost, etc.)
  const specIcon = getSpecIcon(recruit.spec);

  // Check if recruit has any legendary items
  const hasLegendary = recruit.equipment && Object.values(recruit.equipment).some(
    item => item && item.rarity === 'legendary'
  );

  return (
    <div
      className={`lfg-recruit-card ${!canRecruit ? 'locked' : ''} ${recruit.isEmergencyFill ? 'emergency' : ''} ${hasLegendary ? 'has-legendary' : ''}`}
      onClick={() => onInspect(recruit)}
    >
      <div className="recruit-card-header">
        <img src={specIcon} alt={recruit.spec} className="recruit-spec-icon" />
        <span className="recruit-name" style={{ color: classColor }}>
          {recruit.name}
        </span>
        <span className="recruit-gs">GS {recruit.gearScore}</span>
        <span className={`recruit-cost ${!hasEnoughRenown ? 'expensive' : ''}`} title="Renown cost to recruit">
          {renownCost}
        </span>
      </div>

      <div className="recruit-card-info">
        <span className="recruit-class" style={{ color: classColor }}>
          {formatSpec(recruit.spec)} {formatClass(recruit.class)}
        </span>
      </div>

      <div className="recruit-card-traits">
        <PersonalityBadgeRow
          traits={recruit.visibleTraits}
          maxVisible={2}
          size="small"
        />
        {recruit.hiddenTraits.length > 0 && (
          <span className="hidden-trait-indicator" title="More traits revealed after recruiting">
            +{recruit.hiddenTraits.length} hidden
          </span>
        )}
      </div>

      <div className="recruit-card-meta">
        {recruit.morale && <MoraleIndicator morale={recruit.morale} />}
        <span className={`recruit-timer ${recruit.weeksUntilGone <= 1 ? 'urgent' : ''}`}>
          {recruit.weeksUntilGone === 0 ? '1 raid only' : `${recruit.weeksUntilGone}w left`}
        </span>
      </div>

      {recruit.recruitReason && (
        <div className="recruit-reason" title={recruit.recruitReason}>
          "{recruit.recruitReason.substring(0, 25)}..."
        </div>
      )}

      {!canRecruit && (
        <div className="recruit-locked-overlay">
          {!hasEnoughReputation ? (
            <span>Requires {recruit.minReputationRequired} reputation</span>
          ) : !hasEnoughRenown ? (
            <span>Need {renownCost - guildRenown} more renown</span>
          ) : null}
        </div>
      )}

      <button
        className="recruit-btn"
        onClick={e => {
          e.stopPropagation();
          if (canRecruit) onRecruit(recruit.id);
        }}
        disabled={!canRecruit}
      >
        {canRecruit ? `Recruit (${renownCost})` : !hasEnoughReputation ? 'Low Rep' : 'Too Expensive'}
      </button>
    </div>
  );
}

// Helper formatters
function formatClass(wowClass: WoWClass): string {
  return wowClass.charAt(0).toUpperCase() + wowClass.slice(1);
}

function formatSpec(spec: string): string {
  return spec
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Inline version for use as a tab (no overlay/modal)
interface LFGBoardInlineProps {
  recruits: LFGRecruit[];
  guildReputation: number;
  guildReputationTier: 'unknown' | 'rising' | 'established' | 'famous' | 'legendary';
  guildRenown: number;
  onRecruit: (recruitId: string) => void;
  onRefreshPool?: () => { success: boolean; message: string };
  refreshCost?: number;
}

export function LFGBoardInline({ recruits, guildReputation, guildReputationTier, guildRenown, onRecruit, onRefreshPool, refreshCost = 50 }: LFGBoardInlineProps) {
  const [classFilter, setClassFilter] = useState<WoWClass | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<'tank' | 'healer' | 'dps' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'gearScore' | 'name' | 'weeksLeft'>('gearScore');
  const [inspectedRecruit, setInspectedRecruit] = useState<LFGRecruit | null>(null);
  const [showRepInfo, setShowRepInfo] = useState(false);
  const [showRenownInfo, setShowRenownInfo] = useState(false);

  // Handle recruiting from inspection panel
  const handleRecruitFromInspection = (recruitId: string) => {
    onRecruit(recruitId);
    setInspectedRecruit(null);
  };

  // Filter and sort recruits
  const filteredRecruits = useMemo(() => {
    let result = [...recruits];

    // Apply class filter
    if (classFilter !== 'all') {
      result = result.filter(r => r.class === classFilter);
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(r => r.role === roleFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'gearScore':
          return b.gearScore - a.gearScore;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'weeksLeft':
          return a.weeksUntilGone - b.weeksUntilGone;
        default:
          return 0;
      }
    });

    return result;
  }, [recruits, classFilter, roleFilter, sortBy]);

  // Count by role for stats
  const roleCounts = useMemo(() => {
    const counts = { tank: 0, healer: 0, dps: 0 };
    recruits.forEach(r => counts[r.role]++);
    return counts;
  }, [recruits]);

  return (
    <div className="lfg-board-inline">
      <div className="lfg-board-header-inline">
        <h3>Looking For Group</h3>
        <div className="lfg-board-stats">
          <button
            className="lfg-stat reputation clickable"
            onClick={() => setShowRepInfo(true)}
            title="Click for reputation info"
          >
            Rep: {guildReputation} ({guildReputationTier})
          </button>
          <button
            className="lfg-stat renown clickable"
            onClick={() => setShowRenownInfo(true)}
            title="Click for renown info"
          >
            Renown: {guildRenown}
          </button>
          <span className="lfg-stat tank">Tanks: {roleCounts.tank}</span>
          <span className="lfg-stat healer">Healers: {roleCounts.healer}</span>
          <span className="lfg-stat dps">DPS: {roleCounts.dps}</span>
        </div>
      </div>

      <div className="lfg-board-filters">
        <div className="lfg-filter-group">
          <label>Class:</label>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value as WoWClass | 'all')}>
            {CLASS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="lfg-filter-group">
          <label>Role:</label>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as 'tank' | 'healer' | 'dps' | 'all')}>
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="lfg-filter-group">
          <label>Sort:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'gearScore' | 'name' | 'weeksLeft')}>
            <option value="gearScore">Gear Score</option>
            <option value="name">Name</option>
            <option value="weeksLeft">Time Left</option>
          </select>
        </div>

        {onRefreshPool && (
          <button
            className={`lfg-refresh-btn ${guildRenown < refreshCost ? 'disabled' : ''}`}
            onClick={() => {
              if (guildRenown >= refreshCost) {
                onRefreshPool();
              }
            }}
            disabled={guildRenown < refreshCost}
            title={guildRenown < refreshCost
              ? `Need ${refreshCost} renown (have ${guildRenown})`
              : `Refresh pool for ${refreshCost} renown`}
          >
            <span className="refresh-icon">🔄</span>
            <span className="refresh-text">Refresh Pool</span>
            <span className="refresh-cost">({refreshCost})</span>
          </button>
        )}
      </div>

      <div className="lfg-board-content-inline">
        {filteredRecruits.length === 0 ? (
          <div className="lfg-no-results">
            No recruits match your filters
          </div>
        ) : (
          <div className="lfg-recruit-grid">
            {filteredRecruits.map(recruit => (
              <RecruitCard
                key={recruit.id}
                recruit={recruit}
                guildReputation={guildReputation}
                guildRenown={guildRenown}
                onRecruit={onRecruit}
                onInspect={setInspectedRecruit}
              />
            ))}
          </div>
        )}
      </div>

      <div className="lfg-board-footer-inline">
        <span className="lfg-footer-hint">
          Click a recruit to view full details. Higher guild reputation unlocks better recruits.
        </span>
        <span className="lfg-total-count">
          Showing {filteredRecruits.length} of {recruits.length} recruits
        </span>
      </div>

      {/* Recruit Inspection Panel */}
      {inspectedRecruit && (
        <RecruitInspection
          recruit={inspectedRecruit}
          guildReputation={guildReputation}
          guildRenown={guildRenown}
          onRecruit={handleRecruitFromInspection}
          onClose={() => setInspectedRecruit(null)}
        />
      )}

      {/* Reputation Info Modal */}
      {showRepInfo && (
        <div className="rep-info-overlay" onClick={() => setShowRepInfo(false)}>
          <div className="rep-info-modal" onClick={e => e.stopPropagation()}>
            <div className="rep-info-header">
              <h3>Guild Reputation</h3>
              <button className="rep-info-close" onClick={() => setShowRepInfo(false)}>×</button>
            </div>
            <div className="rep-info-content">
              <div className="rep-info-current">
                <span className="rep-info-value">{guildReputation}</span>
                <span className="rep-info-tier">{guildReputationTier}</span>
              </div>

              <div className="rep-info-section">
                <h4>How to Earn Reputation</h4>
                <ul>
                  <li><strong>Kill Bosses:</strong> Each boss kill grants reputation</li>
                  <li><strong>Molten Core / Onyxia:</strong> +1-2 rep per boss</li>
                  <li><strong>Blackwing Lair:</strong> +2-3 rep per boss</li>
                  <li><strong>Silithus:</strong> +3-4 rep per boss</li>
                  <li><strong>First Kill Bonus:</strong> +2 extra rep for new bosses!</li>
                </ul>
              </div>

              <div className="rep-info-section rep-info-negative">
                <h4>How to Lose Reputation</h4>
                <ul>
                  <li><strong>Player Leaves/Kicked:</strong> -2 to -3 rep (guild instability)</li>
                  <li><strong>Inactive Week:</strong> -2 to -3 rep if no boss kills</li>
                  <li><strong>Bad Drama Choices:</strong> -5 rep for unfair decisions</li>
                </ul>
              </div>

              <div className="rep-info-section">
                <h4>Reputation Tiers</h4>
                <div className="rep-tier-list">
                  <div className={`rep-tier ${guildReputationTier === 'unknown' ? 'current' : ''}`}>
                    <span className="tier-name">Unknown</span>
                    <span className="tier-range">0-20</span>
                    <span className="tier-desc">Basic recruits only</span>
                  </div>
                  <div className={`rep-tier ${guildReputationTier === 'rising' ? 'current' : ''}`}>
                    <span className="tier-name">Rising</span>
                    <span className="tier-range">21-40</span>
                    <span className="tier-desc">Some geared recruits</span>
                  </div>
                  <div className={`rep-tier ${guildReputationTier === 'established' ? 'current' : ''}`}>
                    <span className="tier-name">Established</span>
                    <span className="tier-range">41-60</span>
                    <span className="tier-desc">Good recruit pool</span>
                  </div>
                  <div className={`rep-tier ${guildReputationTier === 'famous' ? 'current' : ''}`}>
                    <span className="tier-name">Famous</span>
                    <span className="tier-range">61-80</span>
                    <span className="tier-desc">Great recruits available</span>
                  </div>
                  <div className={`rep-tier ${guildReputationTier === 'legendary' ? 'current' : ''}`}>
                    <span className="tier-name">Legendary</span>
                    <span className="tier-range">81-100</span>
                    <span className="tier-desc">Best recruits in the realm</span>
                  </div>
                </div>
              </div>

              <div className="rep-info-section">
                <h4>Why Reputation Matters</h4>
                <p>Higher reputation attracts better-geared players to your LFG pool. Some elite recruits require minimum reputation to even consider joining your guild!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renown Info Modal */}
      {showRenownInfo && (
        <div className="rep-info-overlay" onClick={() => setShowRenownInfo(false)}>
          <div className="rep-info-modal renown-info-modal" onClick={e => e.stopPropagation()}>
            <div className="rep-info-header renown-header">
              <h3>Guild Renown</h3>
              <button className="rep-info-close" onClick={() => setShowRenownInfo(false)}>×</button>
            </div>
            <div className="rep-info-content">
              <div className="rep-info-current renown-current">
                <span className="rep-info-value renown-value">{guildRenown}</span>
                <span className="rep-info-tier">Spendable Currency</span>
              </div>

              <div className="rep-info-section">
                <h4>How to Earn Renown</h4>
                <ul>
                  <li><strong>Kill Bosses:</strong> Each boss kill grants renown</li>
                  <li><strong>Molten Core / Onyxia:</strong> +5-10 renown per boss</li>
                  <li><strong>Blackwing Lair:</strong> +8-13 renown per boss</li>
                  <li><strong>Silithus:</strong> +12-17 renown per boss</li>
                  <li><strong>First Kill Bonus:</strong> +10 extra renown for new bosses!</li>
                </ul>
              </div>

              <div className="rep-info-section rep-info-negative">
                <h4>How Renown is Spent</h4>
                <ul>
                  <li><strong>Recruiting:</strong> Spend renown to recruit players from LFG</li>
                  <li><strong>Better Gear = Higher Cost:</strong> Well-geared recruits cost more</li>
                  <li><strong>Undergeared:</strong> 5-10 renown</li>
                  <li><strong>Pre-Raid BiS:</strong> 10-20 renown</li>
                  <li><strong>MC Geared:</strong> 35-50 renown</li>
                  <li><strong>BWL Ready:</strong> 75-100 renown</li>
                </ul>
              </div>

              <div className="rep-info-section">
                <h4>Renown vs Reputation</h4>
                <p><strong>Reputation</strong> is your guild's prestige - it determines what quality of recruits appear in your LFG pool. It's not spent.</p>
                <p><strong>Renown</strong> is currency you spend to actually recruit those players. Kill bosses to earn it!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
