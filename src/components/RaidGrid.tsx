import React from 'react';
import type { RaidMember } from '../types/game';
import { RaidFrame } from './RaidFrame';
import './RaidGrid.css';

interface RaidGridProps {
  raid: RaidMember[];
  selectedTargetId: string | null;
  mouseoverTargetId: string | null;
  onSelectTarget: (id: string) => void;
  onMouseoverTarget: (id: string | null) => void;
  inCombat: boolean;
}

export const RaidGrid: React.FC<RaidGridProps> = ({
  raid,
  selectedTargetId,
  mouseoverTargetId,
  onSelectTarget,
  onMouseoverTarget,
  inCombat,
}) => {
  // Group raid members by group number (1-8)
  const groups: Record<number, RaidMember[]> = {};
  raid.forEach(member => {
    if (!groups[member.group]) {
      groups[member.group] = [];
    }
    groups[member.group].push(member);
  });

  return (
    <div className={`raid-grid ${inCombat ? 'in-combat' : ''}`}>
      {Object.entries(groups).map(([groupNum, members]) => (
        <div key={groupNum} className="raid-group">
          <div className="group-header">Group {groupNum}</div>
          <div className="group-members">
            {members.map(member => (
              <RaidFrame
                key={member.id}
                member={member}
                isSelected={member.id === selectedTargetId}
                isMouseoverTarget={member.id === mouseoverTargetId}
                onClick={() => onSelectTarget(member.id)}
                onMouseEnter={() => onMouseoverTarget(member.id)}
                onMouseLeave={() => onMouseoverTarget(null)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
