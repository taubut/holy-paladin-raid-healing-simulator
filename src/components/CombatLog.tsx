import { useRef, useEffect } from 'react';
import type { CombatLogEntry } from '../types/game';
import './CombatLog.css';

interface CombatLogProps {
  entries: CombatLogEntry[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ entries }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [entries]);

  const getEntryClass = (entry: CombatLogEntry): string => {
    let className = `log-entry log-${entry.type}`;
    if (entry.isCrit) className += ' crit';
    return className;
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="combat-log" ref={logRef}>
      <div className="combat-log-header">Combat Log</div>
      <div className="combat-log-entries">
        {entries.map((entry, index) => (
          <div key={index} className={getEntryClass(entry)}>
            <span className="log-time">[{formatTime(entry.timestamp)}]</span>
            <span className="log-message">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
