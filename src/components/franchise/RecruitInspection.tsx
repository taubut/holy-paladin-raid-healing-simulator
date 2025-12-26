import type { LFGRecruit } from '../../game/franchiseTypes';
import type { Equipment, WoWSpec } from '../../game/types';
import type { GearItem } from '../../game/items';
import { CLASS_COLORS } from '../../game/types';
import { RARITY_COLORS } from '../../game/items';
import { PersonalityBadgeRow } from './PersonalityBadge';
import { MoraleIndicator } from './MoraleBar';
import './RecruitInspection.css';

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

interface RecruitInspectionProps {
  recruit: LFGRecruit;
  guildReputation: number;
  guildRenown: number;
  onRecruit: (recruitId: string) => void;
  onClose: () => void;
}

// Equipment slot display order
const EQUIPMENT_SLOTS: { key: keyof Equipment; label: string }[] = [
  { key: 'head', label: 'Head' },
  { key: 'neck', label: 'Neck' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'back', label: 'Back' },
  { key: 'chest', label: 'Chest' },
  { key: 'wrist', label: 'Wrist' },
  { key: 'hands', label: 'Hands' },
  { key: 'waist', label: 'Waist' },
  { key: 'legs', label: 'Legs' },
  { key: 'feet', label: 'Feet' },
  { key: 'ring1', label: 'Ring 1' },
  { key: 'ring2', label: 'Ring 2' },
  { key: 'trinket1', label: 'Trinket 1' },
  { key: 'trinket2', label: 'Trinket 2' },
  { key: 'weapon', label: 'Weapon' },
  { key: 'offhand', label: 'Off Hand' },
  { key: 'ranged', label: 'Ranged' },
];

export function RecruitInspection({ recruit, guildReputation, guildRenown, onRecruit, onClose }: RecruitInspectionProps) {
  const hasEnoughReputation = guildReputation >= recruit.minReputationRequired;
  const hasEnoughRenown = guildRenown >= recruit.renownCost;
  const canRecruit = hasEnoughReputation && hasEnoughRenown;
  const classColor = CLASS_COLORS[recruit.class];

  // Spec icon (shows actual spec like Holy, Protection, Frost, etc.)
  const specIcon = getSpecIcon(recruit.spec);

  return (
    <div className="recruit-inspection-overlay" onClick={onClose}>
      <div className="recruit-inspection-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ri-header">
          <div className="ri-header-left">
            <img src={specIcon} alt={recruit.spec} className="ri-spec-icon" />
            <div className="ri-header-info">
              <span className="ri-name" style={{ color: classColor }}>{recruit.name}</span>
              <span className="ri-class" style={{ color: classColor }}>
                {formatSpec(recruit.spec)} {formatClass(recruit.class)}
              </span>
            </div>
          </div>
          <div className="ri-header-right">
            <span className="ri-gs">GS {recruit.gearScore}</span>
            {recruit.gearTier && <span className="ri-tier">{recruit.gearTier}</span>}
            <span className={`ri-cost ${!hasEnoughRenown ? 'expensive' : ''}`} title="Renown cost">
              {recruit.renownCost} Renown
            </span>
            <button className="ri-close-btn" onClick={onClose}>X</button>
          </div>
        </div>

        {/* Content */}
        <div className="ri-content">
          {/* Left: Equipment */}
          <div className="ri-equipment-section">
            <h3 className="ri-section-title">Equipment</h3>
            <div className="ri-equipment-grid">
              {EQUIPMENT_SLOTS.map(({ key, label }) => {
                const item = recruit.equipment[key];
                return (
                  <div key={key} className="ri-equipment-slot">
                    <span className="ri-slot-label">{label}</span>
                    {item ? (
                      <div className="ri-item" title={formatItemTooltip(item)}>
                        <img
                          src={item.icon || '/icons/inv_misc_questionmark.jpg'}
                          alt={item.name}
                          className="ri-item-icon"
                          style={{ borderColor: RARITY_COLORS[item.rarity] }}
                        />
                        <div className="ri-item-info">
                          <span className="ri-item-name" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</span>
                          <span className="ri-item-ilvl">ilvl {item.itemLevel}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="ri-item empty">
                        <img
                          src="/icons/inv_misc_questionmark.jpg"
                          alt="Empty"
                          className="ri-item-icon"
                        />
                        <span className="ri-item-name empty">Empty</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Personality & Info */}
          <div className="ri-info-section">
            <h3 className="ri-section-title">Personality</h3>
            <div className="ri-personality">
              <PersonalityBadgeRow
                traits={recruit.visibleTraits}
                maxVisible={3}
                size="medium"
                showHoverInfo={true}
              />
              {recruit.hiddenTraits.length > 0 && (
                <div className="ri-hidden-traits">
                  <span className="ri-hidden-label">+ {recruit.hiddenTraits.length} hidden trait(s)</span>
                  <span className="ri-hidden-hint">Revealed after recruiting</span>
                </div>
              )}
            </div>

            <h3 className="ri-section-title">Morale</h3>
            <div className="ri-morale">
              {recruit.morale && <MoraleIndicator morale={recruit.morale} />}
            </div>

            <h3 className="ri-section-title">Availability</h3>
            <div className="ri-availability">
              <span className={`ri-timer ${recruit.weeksUntilGone <= 1 ? 'urgent' : ''}`}>
                {recruit.weeksUntilGone === 0
                  ? 'One raid only!'
                  : `${recruit.weeksUntilGone} week${recruit.weeksUntilGone > 1 ? 's' : ''} until another guild snaps them up`
                }
              </span>
            </div>

            {recruit.recruitReason && (
              <>
                <h3 className="ri-section-title">Looking Because</h3>
                <div className="ri-reason">
                  <span>"{recruit.recruitReason}"</span>
                </div>
              </>
            )}

            {recruit.previousGuild && (
              <>
                <h3 className="ri-section-title">Previous Guild</h3>
                <div className="ri-previous-guild">
                  <span>&lt;{recruit.previousGuild}&gt;</span>
                </div>
              </>
            )}

            {recruit.isEmergencyFill && (
              <div className="ri-emergency-warning">
                <span>TEMPORARY - Will leave after one raid</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="ri-footer">
          <div className="ri-footer-info">
            <span className="ri-your-renown">Your Renown: {guildRenown}</span>
          </div>
          {!canRecruit && (
            <div className="ri-locked-message">
              {!hasEnoughReputation
                ? `Requires ${recruit.minReputationRequired} guild reputation to recruit`
                : `Need ${recruit.renownCost - guildRenown} more renown`
              }
            </div>
          )}
          <button
            className="ri-recruit-btn"
            onClick={() => onRecruit(recruit.id)}
            disabled={!canRecruit}
          >
            {canRecruit
              ? `Recruit to Guild (${recruit.renownCost} Renown)`
              : !hasEnoughReputation
                ? 'Reputation Too Low'
                : 'Not Enough Renown'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper formatters
function formatClass(wowClass: string): string {
  return wowClass.charAt(0).toUpperCase() + wowClass.slice(1);
}

function formatSpec(spec: string): string {
  return spec
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatItemTooltip(item: GearItem): string {
  let tooltip = `${item.name}\nItem Level ${item.itemLevel}`;
  if (item.stats) {
    const entries = Object.entries(item.stats) as [string, number | undefined][];
    entries.forEach(([stat, value]) => {
      if (value !== undefined && value > 0) {
        const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
        tooltip += `\n+${value} ${statName}`;
      }
    });
  }
  return tooltip;
}
