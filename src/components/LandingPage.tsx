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
  faction: Faction;
  playerClass: WoWClass;
  playerName: string;
}

export interface SavedCharacter {
  playerName: string;
  faction: Faction;
  playerClass: WoWClass;
  gearScore?: number;
}

interface LandingPageProps {
  onStartGame: (config: CharacterConfig) => void;
  existingSave?: SavedCharacter | null;
  currentUser: User | null;
  authLoading: boolean;
  onShowPatchNotes: () => void;
  hasNewPatchNotes: boolean;
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
const PLAYABLE_CLASSES: HealerClass[] = ['paladin', 'shaman'];

// Class icons from Wowhead CDN
const ICON_BASE = 'https://wow.zamimg.com/images/wow/icons/large';
const CLASS_ICONS: Record<HealerClass, string> = {
  paladin: `${ICON_BASE}/classicon_paladin.jpg`,
  priest: `${ICON_BASE}/classicon_priest.jpg`,
  druid: `${ICON_BASE}/classicon_druid.jpg`,
  shaman: `${ICON_BASE}/classicon_shaman.jpg`,
};

export function LandingPage({
  onStartGame,
  existingSave,
  currentUser,
  authLoading,
  onShowPatchNotes,
  hasNewPatchNotes,
}: LandingPageProps) {
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(() => {
    if (existingSave?.faction) return existingSave.faction;
    const saved = localStorage.getItem('preferredFaction');
    return (saved === 'alliance' || saved === 'horde') ? saved : null;
  });
  const [selectedClass, setSelectedClass] = useState<HealerClass | null>(() => {
    if (existingSave?.playerClass) return existingSave.playerClass as HealerClass;
    // Auto-select class based on saved faction preference
    const savedFaction = localStorage.getItem('preferredFaction');
    if (savedFaction === 'alliance') return 'paladin';
    if (savedFaction === 'horde') return 'shaman';
    return null;
  });
  const [playerName, setPlayerName] = useState(existingSave?.playerName || '');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isEnteringGame, setIsEnteringGame] = useState(false);

  // Update state when existingSave changes (e.g., after login loads cloud save)
  useEffect(() => {
    if (existingSave) {
      setSelectedFaction(existingSave.faction);
      setSelectedClass(existingSave.playerClass as HealerClass);
      setPlayerName(existingSave.playerName);
    }
  }, [existingSave]);

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
    }
  };

  const handleStartGame = () => {
    if (selectedFaction && selectedClass && playerName.trim()) {
      setIsEnteringGame(true);
      // Save faction preference for next time
      localStorage.setItem('preferredFaction', selectedFaction);
      setTimeout(() => {
        onStartGame({
          faction: selectedFaction,
          playerClass: selectedClass,
          playerName: playerName.trim(),
        });
      }, 1500);
    }
  };

  const handleContinue = () => {
    if (existingSave) {
      setIsEnteringGame(true);
      setTimeout(() => {
        onStartGame({
          faction: existingSave.faction,
          playerClass: existingSave.playerClass,
          playerName: existingSave.playerName,
        });
      }, 1500);
    }
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

  const canStartGame = selectedFaction && selectedClass && playerName.trim().length > 0;
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
            <div className="auth-buttons">
              <button
                className="auth-btn google-btn"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                className="auth-btn apple-btn"
                onClick={handleAppleLogin}
                disabled={isLoggingIn}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>
            </div>
          )}
          <button
            className={`patch-notes-btn ${hasNewPatchNotes ? 'has-new' : ''}`}
            onClick={onShowPatchNotes}
          >
            {hasNewPatchNotes ? 'NEW PATCH NOTES!' : 'Patch Notes'}
          </button>
        </div>

        {/* Continue button for returning users */}
        {existingSave && (
          <div className="continue-section">
            <button className="continue-btn" onClick={handleContinue}>
              Continue as <span className="character-name" style={{ color: CLASS_COLORS[existingSave.playerClass as HealerClass] }}>
                {existingSave.playerName}
              </span>
              <span className="character-info">
                {existingSave.playerClass.charAt(0).toUpperCase() + existingSave.playerClass.slice(1)}
                {existingSave.gearScore ? ` • GS ${existingSave.gearScore}` : ''}
              </span>
            </button>
            <div className="or-divider">
              <span>or create a new character</span>
            </div>
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
                const isSelected = selectedClass === wowClass;
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
          </div>
        )}

        {/* Character Name */}
        {selectedClass && (
          <div className="name-section">
            <h2>Name Your Character</h2>
            <input
              type="text"
              className="name-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0, 12))}
              placeholder="Enter name..."
              maxLength={12}
              style={{
                borderColor: CLASS_COLORS[selectedClass],
              }}
            />
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

        {/* Footer */}
        <div className="landing-footer">
          <p>A raiding simulator for World of Warcraft Classic</p>
          <p className="version">v0.18.0</p>
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
    </div>
  );
}
