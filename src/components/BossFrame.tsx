import type { BossEncounter } from '../types/game';
import './BossFrame.css';

// Boss portrait icons - using local images in public/boss-icons
const BOSS_PORTRAITS: Record<string, string> = {
  // Molten Core
  lucifron: '/boss-icons/Lucifron.jpg',
  magmadar: '/boss-icons/Magmadar.jpg',
  gehennas: '/boss-icons/Gehennas.jpg',
  garr: '/boss-icons/Garr.jpg',
  baron_geddon: '/boss-icons/BaronGeddon.jpg',
  shazzrah: '/boss-icons/Shazzrah.jpg',
  sulfuron: '/boss-icons/SulfuronHarbinger.jpg',
  golemagg: '/boss-icons/GolemaggtheIncinerator.jpg',
  majordomo: '/boss-icons/MajordomoExecutus.jpg',
  ragnaros: '/boss-icons/Ragnaros.jpg',
  // Onyxia
  onyxia: '/boss-icons/Onyxia.jpg',
  // Training
  training: '/boss-icons/TrainingDummy.jpg',
};

interface BossFrameProps {
  boss: BossEncounter;
  elapsedTime: number;
}

export const BossFrame: React.FC<BossFrameProps> = ({ boss, elapsedTime }) => {
  const remainingTime = Math.max(0, boss.enrageTimer - elapsedTime);
  const enragePercent = (elapsedTime / boss.enrageTimer) * 100;
  const isEnraging = remainingTime < 30;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const portraitUrl = BOSS_PORTRAITS[boss.id] || '/icons/spell_fire_incinerate.jpg';

  return (
    <div className={`boss-frame ${isEnraging ? 'enraging' : ''}`}>
      <div className="boss-portrait-container">
        <div className="boss-portrait">
          <img
            src={portraitUrl}
            alt={boss.name}
            className="boss-icon"
          />
        </div>
        <img
          src="/dragon-frame.png"
          alt=""
          className="dragon-frame-overlay"
        />
      </div>
      <div className="boss-info">
        <div className="boss-name">{boss.name}</div>

        {/* Boss Health Bar */}
        <div className="boss-health-container">
          <div
            className="boss-health-bar"
            style={{ width: `${(boss.currentHealth / boss.maxHealth) * 100}%` }}
          />
          <span className="boss-health-text">
            {Math.ceil(boss.currentHealth).toLocaleString()} / {boss.maxHealth.toLocaleString()} ({(boss.currentHealth / boss.maxHealth * 100).toFixed(1)}%)
          </span>
        </div>

        <div className="enrage-bar-container">
          <div
            className={`enrage-bar ${isEnraging ? 'danger' : ''}`}
            style={{ width: `${Math.min(100, enragePercent)}%` }}
          />
          <span className="enrage-text">
            Enrage: {formatTime(remainingTime)}
          </span>
        </div>
        <div className="boss-stats">
          <span>Phase {boss.phase}</span>
          <span>Time: {formatTime(elapsedTime)}</span>
        </div>
      </div>
    </div>
  );
};
