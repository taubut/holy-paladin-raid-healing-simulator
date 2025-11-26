import type { GameState } from '../types/game';
import './ScoreBoard.css';

interface ScoreBoardProps {
  gameState: GameState;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ gameState }) => {
  const { healingDone, overhealing, score, raid } = gameState;
  const aliveCount = raid.filter(m => m.isAlive).length;
  const totalCount = raid.length;
  const overhealPercent = healingDone > 0
    ? ((overhealing / (healingDone + overhealing)) * 100).toFixed(1)
    : '0.0';

  const hps = gameState.elapsedTime > 0
    ? Math.floor(healingDone / gameState.elapsedTime)
    : 0;

  return (
    <div className="score-board">
      <div className="score-header">Performance</div>
      <div className="score-stats">
        <div className="stat-row">
          <span className="stat-label">Score</span>
          <span className="stat-value score">{score.toLocaleString()}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">HPS</span>
          <span className="stat-value">{hps.toLocaleString()}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Total Healing</span>
          <span className="stat-value heal">{healingDone.toLocaleString()}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Overhealing</span>
          <span className="stat-value overheal">{overhealing.toLocaleString()} ({overhealPercent}%)</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Raid Alive</span>
          <span className={`stat-value ${aliveCount < totalCount ? 'warning' : ''}`}>
            {aliveCount} / {totalCount}
          </span>
        </div>
      </div>
    </div>
  );
};
