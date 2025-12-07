import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { signInWithGoogle, signInWithApple, signOut } from '../lib/supabase';
import type { WoWClass } from '../game/types';
import AllianceLogo from '../assets/AllianceLogo.png';
import HordeLogo from '../assets/HordeLogo.png';
import './LandingPage.css';

type Faction = 'alliance' | 'horde';
type HealerClass = 'paladin' | 'priest' | 'druid' | 'shaman';

export interface CharacterConfig {
  id?: string;  // Character ID (generated for new, from save for continuing)
  faction: Faction;
  playerClass: WoWClass;
  playerName: string;
  raidSize: 20 | 40;  // Raid size chosen at character creation
  isContinuing?: boolean;  // True when continuing existing save, false for new character
  isRaidLeaderMode?: boolean;  // True when playing as Raid Leader instead of healer
}

export interface SavedCharacter {
  id: string;  // Unique character ID used as cloud save slot
  playerName: string;
  faction: Faction;
  playerClass: WoWClass;
  gearScore?: number;
  raidSize?: 20 | 40;  // Raid size (defaults to 40 for legacy saves)
  isRaidLeaderMode?: boolean;  // True if this is a Raid Leader Mode character
}

interface LandingPageProps {
  onStartGame: (config: CharacterConfig) => void;
  savedCharacters: SavedCharacter[];  // List of all saved characters
  currentUser: User | null;
  authLoading: boolean;
  onShowPatchNotes: () => void;
  hasNewPatchNotes: boolean;
  onDeleteCharacter?: (characterId: string) => Promise<boolean>;
}

// Class colors for styling
const CLASS_COLORS: Record<HealerClass, string> = {
  paladin: '#F58CBA',
  priest: '#FFFFFF',
  druid: '#FF7D0A',
  shaman: '#0070DE',
};

// Available classes per faction
const FACTION_CLASSES: Record<Faction, HealerClass[]> = {
  alliance: ['paladin', 'priest', 'druid'],
  horde: ['shaman', 'priest', 'druid'],
};

// Classes that are currently playable
const PLAYABLE_CLASSES: HealerClass[] = ['paladin', 'shaman', 'priest', 'druid'];

// Class icons from Wowhead CDN
const ICON_BASE = '/icons';
const CLASS_ICONS: Record<HealerClass, string> = {
  paladin: `${ICON_BASE}/classicon_paladin.jpg`,
  priest: `${ICON_BASE}/classicon_priest.jpg`,
  druid: `${ICON_BASE}/classicon_druid.jpg`,
  shaman: `${ICON_BASE}/classicon_shaman.jpg`,
};

// Raid Leader Mode icon
const RAID_LEADER_ICON = `${ICON_BASE}/classic_temp.jpg`;

export function LandingPage({
  onStartGame,
  savedCharacters,
  currentUser,
  authLoading,
  onShowPatchNotes,
  hasNewPatchNotes,
  onDeleteCharacter,
}: LandingPageProps) {
  // Use the most recently used character as default (first in list)
  const mostRecentCharacter = savedCharacters[0] || null;

  // State for delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(() => {
    if (mostRecentCharacter?.faction) return mostRecentCharacter.faction;
    const saved = localStorage.getItem('preferredFaction');
    return (saved === 'alliance' || saved === 'horde') ? saved : null;
  });
  const [selectedClass, setSelectedClass] = useState<HealerClass | null>(() => {
    if (mostRecentCharacter?.playerClass) return mostRecentCharacter.playerClass as HealerClass;
    // Auto-select class based on saved faction preference
    const savedFaction = localStorage.getItem('preferredFaction');
    if (savedFaction === 'alliance') return 'paladin';
    if (savedFaction === 'horde') return 'shaman';
    return null;
  });
  const [playerName, setPlayerName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isEnteringGame, setIsEnteringGame] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRaidLeaderMode, setIsRaidLeaderMode] = useState(false);
  const [showRaidLeaderInfo, setShowRaidLeaderInfo] = useState(false);
  const [selectedRaidSize, setSelectedRaidSize] = useState<20 | 40>(40);

  // Update state when savedCharacters changes (e.g., after login loads cloud saves)
  useEffect(() => {
    if (savedCharacters.length > 0) {
      const recent = savedCharacters[0];
      setSelectedFaction(recent.faction);
      setSelectedClass(recent.playerClass as HealerClass);
      // Don't auto-fill name - let user type a new one for new characters
    }
  }, [savedCharacters]);

  const handleFactionSelect = (faction: Faction) => {
    setSelectedFaction(faction);
    // Reset class if switching factions and current class isn't available
    if (selectedClass && !FACTION_CLASSES[faction].includes(selectedClass as HealerClass)) {
      setSelectedClass(null);
    }
    // Auto-select the main class for that faction
    if (faction === 'alliance') {
      setSelectedClass('paladin');
    } else {
      setSelectedClass('shaman');
    }
  };

  const handleClassSelect = (healerClass: HealerClass) => {
    if (PLAYABLE_CLASSES.includes(healerClass)) {
      setSelectedClass(healerClass);
      setIsRaidLeaderMode(false);  // Deselect raid leader mode when selecting a class
    }
  };

  const handleRaidLeaderSelect = () => {
    setIsRaidLeaderMode(true);
    setSelectedClass(null);  // Deselect healer class
  };

  const handleStartGame = () => {
    const canStart = selectedFaction && (selectedClass || isRaidLeaderMode) && playerName.trim();
    if (canStart) {
      setIsEnteringGame(true);
      // Save faction preference for next time
      localStorage.setItem('preferredFaction', selectedFaction);
      // Generate unique character ID
      const characterId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setTimeout(() => {
        onStartGame({
          id: characterId,
          faction: selectedFaction,
          // For raid leader mode, use a default class (paladin for alliance, shaman for horde)
          playerClass: isRaidLeaderMode
            ? (selectedFaction === 'alliance' ? 'paladin' : 'shaman')
            : selectedClass!,
          playerName: playerName.trim(),
          raidSize: selectedRaidSize,
          isContinuing: false,  // New character - don't load cloud save
          isRaidLeaderMode: isRaidLeaderMode,
        });
      }, 1500);
    }
  };

  const handleContinue = (character: SavedCharacter) => {
    setIsEnteringGame(true);
    setTimeout(() => {
      onStartGame({
        id: character.id,
        faction: character.faction,
        playerClass: character.playerClass,
        playerName: character.playerName,
        raidSize: character.raidSize || 40,  // Default to 40 for legacy saves
        isContinuing: true,  // Continuing - load cloud save
        isRaidLeaderMode: character.isRaidLeaderMode || false,
      });
    }, 1500);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithApple();
    } catch (error) {
      console.error('Apple login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Handle character deletion with confirmation
  const handleDeleteClick = (e: React.MouseEvent, characterId: string) => {
    e.stopPropagation(); // Prevent triggering continue
    setDeleteConfirmId(characterId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId || !onDeleteCharacter) return;

    setIsDeleting(true);
    try {
      await onDeleteCharacter(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch {
      // Error handled in parent
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const canStartGame = selectedFaction && (selectedClass || isRaidLeaderMode) && playerName.trim().length > 0;
  const availableClasses = selectedFaction ? FACTION_CLASSES[selectedFaction] : [];

  // Handle Enter key to start game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canStartGame && !isEnteringGame) {
        handleStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canStartGame, isEnteringGame, selectedFaction, selectedClass, playerName]);

  return (
    <div className="landing-page">
      {/* Loading Overlay */}
      {isEnteringGame && (
        <div className="entering-game-overlay">
          <div className="entering-game-content">
            <h2>Entering Azeroth...</h2>
            <div className="loading-bar">
              <div className="loading-bar-fill"></div>
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout when characters exist */}
      <div className={`landing-layout ${savedCharacters.length > 0 ? 'has-characters' : ''}`}>
        {/* Left side: Character Creation */}
        <div className="landing-content">
          {/* Title */}
          <h1 className="game-title">Classic WoW Raid Simulator</h1>

          {/* Top bar: Login + Patch Notes */}
          <div className="landing-top-bar">
            {authLoading ? (
              <div className="auth-loading">Loading...</div>
            ) : currentUser ? (
              <div className="user-info">
                <span className="user-email">{currentUser.email}</span>
                <button className="auth-btn sign-out-btn" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="auth-btn login-btn"
                onClick={() => setShowLoginModal(true)}
              >
                Login
              </button>
            )}
            <button
              className={`patch-notes-btn ${hasNewPatchNotes ? 'has-new' : ''}`}
              onClick={onShowPatchNotes}
            >
              {hasNewPatchNotes ? 'NEW PATCH NOTES!' : 'Patch Notes'}
            </button>
          </div>

          {/* Character Creation Section Header (only show when characters exist) */}
          {savedCharacters.length > 0 && (
            <div className="character-creation-header">
              <h2>Create New Character</h2>
            </div>
          )}

          {/* Faction Selection */}
          <div className="faction-selection">
            <h2>Choose Your Faction</h2>
          <div className="faction-buttons">
            <button
              className={`faction-btn alliance ${selectedFaction === 'alliance' ? 'selected' : ''}`}
              onClick={() => handleFactionSelect('alliance')}
            >
              <div className="faction-crest">
                <img src={AllianceLogo} alt="Alliance" className="faction-icon" />
              </div>
              <span className="faction-name">Alliance</span>
            </button>
            <button
              className={`faction-btn horde ${selectedFaction === 'horde' ? 'selected' : ''}`}
              onClick={() => handleFactionSelect('horde')}
            >
              <div className="faction-crest">
                <img src={HordeLogo} alt="Horde" className="faction-icon" />
              </div>
              <span className="faction-name">Horde</span>
            </button>
          </div>
        </div>

        {/* Class Selection */}
        {selectedFaction && (
          <div className="class-selection">
            <h2>Choose Your Class</h2>
            <div className="class-buttons">
              {availableClasses.map((wowClass) => {
                const isPlayable = PLAYABLE_CLASSES.includes(wowClass);
                const isSelected = selectedClass === wowClass && !isRaidLeaderMode;
                return (
                  <button
                    key={wowClass}
                    className={`class-btn ${wowClass} ${isSelected ? 'selected' : ''} ${!isPlayable ? 'disabled' : ''}`}
                    onClick={() => handleClassSelect(wowClass)}
                    disabled={!isPlayable}
                    style={{
                      '--class-color': CLASS_COLORS[wowClass],
                    } as React.CSSProperties}
                  >
                    <img
                      src={CLASS_ICONS[wowClass]}
                      alt={wowClass}
                      className="class-icon"
                    />
                    <span className="class-name">
                      {wowClass.charAt(0).toUpperCase() + wowClass.slice(1)}
                    </span>
                    {!isPlayable && <span className="coming-soon">Coming Soon</span>}
                  </button>
                );
              })}
            </div>

            {/* Raid Leader Mode Option */}
            <div className="raid-leader-section">
              <div className="or-divider">OR</div>
              <div className="raid-leader-option">
                <button
                  className={`class-btn raid-leader ${isRaidLeaderMode ? 'selected' : ''}`}
                  onClick={handleRaidLeaderSelect}
                  style={{
                    '--class-color': '#ffd700',
                  } as React.CSSProperties}
                >
                  <img
                    src={RAID_LEADER_ICON}
                    alt="Raid Leader"
                    className="class-icon"
                  />
                  <span className="class-name">Raid Leader</span>
                </button>
                <button
                  className="raid-leader-info-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRaidLeaderInfo(true);
                  }}
                  title="What is Raid Leader Mode?"
                >
                  ?
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Character Name */}
        {(selectedClass || isRaidLeaderMode) && (
          <div className="name-section">
            <h2>{isRaidLeaderMode ? 'Name Your Raid Leader' : 'Name Your Character'}</h2>
            <input
              type="text"
              className="name-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0, 12))}
              placeholder="Enter name..."
              maxLength={12}
              style={{
                borderColor: isRaidLeaderMode ? '#ffd700' : CLASS_COLORS[selectedClass!],
              }}
            />
          </div>
        )}

        {/* Raid Size Selection */}
        {(selectedClass || isRaidLeaderMode) && (
          <div className="raid-size-section">
            <h2>Raid Size</h2>
            <div className="raid-size-toggle">
              <button
                className={`raid-size-btn ${selectedRaidSize === 20 ? 'selected' : ''}`}
                onClick={() => setSelectedRaidSize(20)}
              >
                20 Man
              </button>
              <button
                className={`raid-size-btn ${selectedRaidSize === 40 ? 'selected' : ''}`}
                onClick={() => setSelectedRaidSize(40)}
              >
                40 Man
              </button>
            </div>
          </div>
        )}

          {/* Play Button */}
          <button
            className={`play-btn ${canStartGame ? 'ready' : ''}`}
            onClick={handleStartGame}
            disabled={!canStartGame}
          >
            Enter Azeroth
          </button>

          {/* Cloud Save Hint */}
          {!currentUser && !authLoading && (
            <p className="cloud-save-hint" onClick={() => setShowLoginModal(true)}>
              Login to enable cloud saves
            </p>
          )}

          {/* Footer */}
          <div className="landing-footer">
            <p>A raiding simulator for World of Warcraft Classic</p>
            <p className="version">v0.34.0</p>
            <a
              href="https://github.com/taubut/holy-paladin-raid-healing-simulator"
              target="_blank"
              rel="noopener noreferrer"
              className="credits-link"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Right side: WoW-style Character Selection Panel */}
        {savedCharacters.length > 0 && (
          <div className="character-panel">
            <div className="character-panel-header">
              <h2>Characters</h2>
            </div>
            <div className="character-panel-list">
              {savedCharacters.map((char, index) => (
                <div
                  key={char.id}
                  className={`character-panel-item ${index === 0 ? 'selected' : ''} ${char.isRaidLeaderMode ? 'raid-leader' : ''}`}
                  onClick={() => handleContinue(char)}
                >
                  <div className="character-panel-icon">
                    <img
                      src={char.isRaidLeaderMode ? RAID_LEADER_ICON : CLASS_ICONS[char.playerClass as HealerClass]}
                      alt={char.isRaidLeaderMode ? 'Raid Leader' : char.playerClass}
                    />
                  </div>
                  <div className="character-panel-info">
                    <span className="character-panel-name" style={{ color: char.isRaidLeaderMode ? '#ffd700' : CLASS_COLORS[char.playerClass as HealerClass] }}>
                      {char.playerName}
                    </span>
                    <span className="character-panel-details">
                      {char.isRaidLeaderMode ? 'Raid Leader' : char.playerClass.charAt(0).toUpperCase() + char.playerClass.slice(1)}
                      {!char.isRaidLeaderMode && char.gearScore ? ` • GS ${char.gearScore}` : ''}
                      {` • ${char.raidSize || 40}m`}
                    </span>
                  </div>
                  {currentUser && onDeleteCharacter && (
                    <button
                      className="character-panel-delete"
                      onClick={(e) => handleDeleteClick(e, char.id)}
                      title="Delete character"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="character-panel-footer">
              <span className="character-count">{savedCharacters.length} Character{savedCharacters.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="delete-confirm-overlay" onClick={handleCancelDelete}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Character?</h3>
            <p>
              Are you sure you want to delete{' '}
              <strong>
                {savedCharacters.find(c => c.id === deleteConfirmId)?.playerName || 'this character'}
              </strong>
              ?
            </p>
            <p className="delete-warning">
              This action cannot be undone. All progress for this character will be permanently lost.
            </p>
            <div className="delete-confirm-buttons">
              <button
                className="delete-cancel-btn"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="login-modal-close" onClick={() => setShowLoginModal(false)}>
              X
            </button>
            <h2>Sign In</h2>
            <p className="login-subtitle">Sign in to enable cloud saves and sync progress across devices</p>
            <div className="login-modal-buttons">
              <button
                className="login-provider-btn google-provider-btn"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button
                className="login-provider-btn apple-provider-btn"
                onClick={handleAppleLogin}
                disabled={isLoggingIn}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raid Leader Info Modal */}
      {showRaidLeaderInfo && (
        <div className="login-modal-overlay" onClick={() => setShowRaidLeaderInfo(false)}>
          <div className="raid-leader-info-modal" onClick={(e) => e.stopPropagation()}>
            <button className="login-modal-close" onClick={() => setShowRaidLeaderInfo(false)}>
              X
            </button>
            <h2>Raid Leader Mode</h2>
            <div className="raid-leader-info-content">
              <p className="raid-leader-intro">
                In Raid Leader Mode, you manage the raid instead of healing. All healing is done by AI.
              </p>

              <div className="raid-leader-feature">
                <h3>Build Your Raid</h3>
                <p>Choose all 20 or 40 raid members - their classes, specs, and assignments. Set up paladin auras and shaman totems before you start.</p>
              </div>

              <div className="raid-leader-feature">
                <h3>Lead the Fight</h3>
                <p>Start boss encounters and watch your AI raiders work. Handle mechanics like dragging bombed players to safety in the Baron Geddon fight.</p>
              </div>

              <div className="raid-leader-feature">
                <h3>Master Looter</h3>
                <p>When bosses die, you assign loot to raiders or disenchant items. Legendary materials still go to your bags for crafting.</p>
              </div>

              <div className="raid-leader-feature">
                <h3>Manage Buffs</h3>
                <p>Control raid buffs, consumables, and world buffs just like in healer mode.</p>
              </div>
            </div>
            <button className="raid-leader-info-close-btn" onClick={() => setShowRaidLeaderInfo(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
