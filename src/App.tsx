import { useEffect, useRef, useState } from 'react';
import { GameEngine, CONSUMABLES, WORLD_BUFFS } from './game/GameEngine';
import { CLASS_COLORS, CLASS_SPECS, getSpecById, getGearCompatibleSpecs } from './game/types';
import type { WoWClass, BuffEffect, Equipment } from './game/types';
import type { EquipmentSlot } from './game/items';
import { RARITY_COLORS } from './game/items';
import { ENCOUNTERS, DEBUFFS } from './game/encounters';
import { RAIDS } from './game/raids';
import { calculateDKPCost, BOSS_LOOT_TABLES } from './game/lootTables';
import { ALL_ITEMS, LEGENDARY_MATERIALS, QUEST_MATERIALS, ALL_QUEST_REWARDS, ENCHANTING_MATERIALS, ENCHANTS, getEnchantsForSlot } from './game/items';
import type { QuestMaterialId, QuestRewardId, EnchantSlot, EnchantId } from './game/items';
import { SPELL_TOOLTIPS } from './game/spells';
import type { Spell } from './game/types';
import { PARTY_AURAS, getPaladinAuras, memberProvidesAura } from './game/auras';
import { TOTEMS_BY_ELEMENT, getTotemById } from './game/totems';
import type { TotemElement } from './game/types';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { RaidMeter } from './components/RaidMeter';
import { RaidSetupModal } from './components/RaidSetupModal';
import { RaidLeaderSetup } from './components/RaidLeaderSetup';
import { LandingPage } from './components/LandingPage';
import type { CharacterConfig, SavedCharacter } from './components/LandingPage';
import type { GameSession, SessionPlayer } from './lib/supabase';
import { supabase, signInWithGoogle, signInWithApple, signOut, getCurrentUser, onAuthStateChange, saveToCloud, loadFromCloud, deleteCloudSave, listCloudSaves } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import posthog from 'posthog-js';
import './App.css';
import RagDomoImage from './assets/Rag_Domo.png';
import Majordomo1Audio from './assets/Majordomo_1.ogg';
import Majordomo2Audio from './assets/Majordomo_2.ogg';
import Ragnaros1Audio from './assets/Ragnaros_1.ogg';
import Ragnaros2Audio from './assets/Ragnaros_2.ogg';
import Ragnaros3Audio from './assets/Ragnaros_3.ogg';

// Ragnaros RP Dialogue Data with audio and durations
const RAGNAROS_RP_DIALOGUE = [
  { speaker: 'Majordomo Executus', text: 'Behold Ragnaros, the Firelord! He who was ancient when this world was young! Bow before him, mortals! Bow before your ending!', audio: Majordomo1Audio, duration: 13 },
  { speaker: 'Ragnaros', text: 'TOO SOON! YOU HAVE AWAKENED ME TOO SOON, EXECUTUS! What is the meaning of this intrusion?', audio: Ragnaros1Audio, duration: 13 },
  { speaker: 'Majordomo Executus', text: 'These mortal infidels, my lord! They have invaded your sanctum, and seek to steal your secrets!', audio: Majordomo2Audio, duration: 7 },
  { speaker: 'Ragnaros', text: 'FOOL! You allowed these insects to run rampant through the hallowed core? You have failed me, Executus! Justice shall be met indeed!', audio: Ragnaros2Audio, duration: 20 },
  { speaker: 'Ragnaros', text: 'Now for you, insects. Boldly you sought the power of Ragnaros. Now you shall see it firsthand!', audio: Ragnaros3Audio, duration: 12 },
];
const RP_DURATION = 13 + 13 + 7 + 20 + 12; // 65 seconds total

function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const [, forceUpdate] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [importExportStatus, setImportExportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [hoveredSpell, setHoveredSpell] = useState<Spell | null>(null);
  const [showEncounterJournal, setShowEncounterJournal] = useState(false);
  const [selectedJournalBoss, setSelectedJournalBoss] = useState<string | null>(null);
  // Admin Panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState<'loot' | 'dkp' | 'progression' | 'raid'>('loot');
  const [selectedAdminMemberId, setSelectedAdminMemberId] = useState<string | null>(null);
  const [adminProgressionRaid, setAdminProgressionRaid] = useState<string>('molten_core');
  // Inventory state
  const [showInventory, setShowInventory] = useState(false);
  const [selectedLegendaryCraftTarget, setSelectedLegendaryCraftTarget] = useState<string | null>(null);
  const [activeBagTab, setActiveBagTab] = useState<'equipment' | 'materials'>('equipment');
  const [bagContextMenu, setBagContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  // Auction House state
  const [ahSelectedMember, setAhSelectedMember] = useState<string | null>(null);  // null = player, otherwise memberId
  const [ahSelectedSlot, setAhSelectedSlot] = useState<EquipmentSlot | null>(null);
  // Inspection panel state
  const [selectedInspectSlot, setSelectedInspectSlot] = useState<EquipmentSlot | null>(null);
  // Quest turn-in state (dragon heads)
  const [selectedQuestMaterial, setSelectedQuestMaterial] = useState<QuestMaterialId | null>(null);
  const [selectedQuestReward, setSelectedQuestReward] = useState<QuestRewardId | null>(null);
  const [selectedQuestRecipient, setSelectedQuestRecipient] = useState<string | null>(null);
  const [adminItemSlotFilter, setAdminItemSlotFilter] = useState<string>('all');
  const [adminItemSearch, setAdminItemSearch] = useState('');
  const [adminDkpInput, setAdminDkpInput] = useState('');
  const [adminNewMemberName, setAdminNewMemberName] = useState('');
  const [adminNewMemberClass, setAdminNewMemberClass] = useState<WoWClass>('warrior');
  const [adminNewMemberRole, setAdminNewMemberRole] = useState<'tank' | 'healer' | 'dps'>('dps');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  // Phase transition alert
  const [phaseAlert, setPhaseAlert] = useState<string | null>(null);
  const lastPhaseRef = useRef<number>(1);
  // Special alert (legendary unlocks, secret boss summons)
  const [specialAlert, setSpecialAlert] = useState<string | null>(null);
  // Living Bomb raid warning
  const [livingBombWarning, setLivingBombWarning] = useState<string | null>(null);
  // Inferno raid warning (Baron Geddon - no airhorn)
  const [infernoWarning, setInfernoWarning] = useState<string | null>(null);
  // Mind Control warning (Lucifron - Dominate Mind)
  const [mindControlWarning, setMindControlWarning] = useState<{ mcPlayer: string; attackingPlayer: string } | null>(null);
  // Lava Bomb warning (Magmadar)
  const [lavaBombWarning, setLavaBombWarning] = useState<string | null>(null);
  // Custom confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    warningText?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  } | null>(null);
  const previousLivingBombTargetsRef = useRef<Set<string>>(new Set());
  const airhornRef = useRef<HTMLAudioElement | null>(null);
  const ragnarosRPAudioRef = useRef<HTMLAudioElement | null>(null);
  // Raid management state
  const [showRaidGroupManager, setShowRaidGroupManager] = useState(false);
  const [selectedPaladinForAura, setSelectedPaladinForAura] = useState<string | null>(null);
  const [selectedShamanForTotems, setSelectedShamanForTotems] = useState<string | null>(null);
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [hoveredAura, setHoveredAura] = useState<{ aura: typeof PARTY_AURAS[string], providerName: string } | null>(null);
  const [selectedMemberForClassSpec, setSelectedMemberForClassSpec] = useState<string | null>(null);
  // Bench player state
  const [raidManagerTab, setRaidManagerTab] = useState<'active' | 'bench'>('active');
  const [selectedBenchPlayerForSwap, setSelectedBenchPlayerForSwap] = useState<string | null>(null);
  const [selectedRaidMemberForSwap, setSelectedRaidMemberForSwap] = useState<string | null>(null);
  const [showAddToBenchModal, setShowAddToBenchModal] = useState(false);
  const [addToBenchSelectedClass, setAddToBenchSelectedClass] = useState<WoWClass | null>(null);
  const [kickConfirmMember, setKickConfirmMember] = useState<{ id: string; name: string } | null>(null);
  const [removeBenchConfirm, setRemoveBenchConfirm] = useState<{ id: string; name: string } | null>(null);
  // Mobile UI mode - auto-detect on load
  const [isMobileMode, setIsMobileMode] = useState(() => {
    // Check if device is mobile/tablet based on screen width and touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    return isTouchDevice && isSmallScreen;
  });
  const [mobileTab, setMobileTab] = useState<'raid' | 'buffs' | 'log'>('raid');
  // Patch notes modal - track if user has seen current version
  const CURRENT_PATCH_VERSION = '0.28.0';
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [hasSeenPatchNotes, setHasSeenPatchNotes] = useState(() => {
    const seenVersion = localStorage.getItem('seenPatchNotesVersion');
    return seenVersion === CURRENT_PATCH_VERSION;
  });
  // Raid Setup Modal state
  const [showRaidSetup, setShowRaidSetup] = useState(false);
  // Raid Leader Mode: show raid composition setup before starting
  const [showRaidLeaderSetup, setShowRaidLeaderSetup] = useState(false);
  // Track the selected raid size for Raid Leader Mode (20 or 40)
  const [raidLeaderRaidSize, setRaidLeaderRaidSize] = useState<20 | 40>(40);
  // Collapsible buffs panel state (persisted to localStorage)
  const [buffsExpanded, setBuffsExpanded] = useState(() => {
    const saved = localStorage.getItem('ui_buffs_expanded');
    return saved ? JSON.parse(saved) : false;
  });
  // Multiplayer state
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  const [multiplayerSession, setMultiplayerSession] = useState<GameSession | null>(null);
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<SessionPlayer[]>([]);
  const [localPlayer, setLocalPlayer] = useState<SessionPlayer | null>(null);
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);
  // Track all players' healing stats for the meter (host aggregates, clients receive)
  const [multiplayerHealingStats, setMultiplayerHealingStats] = useState<Record<string, { name: string; class: string; healingDone: number; dispelsDone: number }>>({});
  const multiplayerHealingStatsRef = useRef<Record<string, { name: string; class: string; healingDone: number; dispelsDone: number }>>({});

  // Living Bomb Safe Zone state
  const [evacuatedMembers, setEvacuatedMembers] = useState<Set<string>>(new Set());
  const [safeZoneDragOver, setSafeZoneDragOver] = useState(false);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'keybinds' | 'interface'>('keybinds');
  const [recordingKeybind, setRecordingKeybind] = useState<string | null>(null);

  // Auth state for cloud saves
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'saved' | 'loaded' | 'syncing' | 'error' | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Landing page state
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);
  const [gameInitialized, setGameInitialized] = useState(false);

  // Golemagg tank assignment modal
  const [showGolemaggTankModal, setShowGolemaggTankModal] = useState(false);
  const [golemaggTank1, setGolemaggTank1] = useState<string>('');
  const [golemaggTank2, setGolemaggTank2] = useState<string>('');
  const [coreRagerTank, setCoreRagerTank] = useState<string>('');

  // Majordomo tank assignment modal (5 tanks: 1 for Majordomo, 4 for adds)
  const [showMajordomoTankModal, setShowMajordomoTankModal] = useState(false);
  const [majordomoTank, setMajordomoTank] = useState<string>(''); // Majordomo himself
  const [majordomoAddTank1, setMajordomoAddTank1] = useState<string>(''); // Adds 1 & 2
  const [majordomoAddTank2, setMajordomoAddTank2] = useState<string>(''); // Adds 3 & 4
  const [majordomoAddTank3, setMajordomoAddTank3] = useState<string>(''); // Adds 5 & 6
  const [majordomoAddTank4, setMajordomoAddTank4] = useState<string>(''); // Adds 7 & 8

  // Ragnaros tank assignment modal (2 tanks for tank swap)
  const [showRagnarosTankModal, setShowRagnarosTankModal] = useState(false);
  const [ragnarosTank1, setRagnarosTank1] = useState<string>(''); // Main tank
  const [ragnarosTank2, setRagnarosTank2] = useState<string>(''); // Off-tank (swap on Wrath)

  // Ragnaros RP intro state
  const [showRagnarosRP, setShowRagnarosRP] = useState(false);
  const [ragnarosRPDialogueIndex, setRagnarosRPDialogueIndex] = useState(0);
  const [ragnarosRPTimeRemaining, setRagnarosRPTimeRemaining] = useState(RP_DURATION);

  // Default keybinds
  const DEFAULT_KEYBINDS = {
    actionBar: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    manaPotion: 'm',
  };

  // Keybinds state (persisted to localStorage)
  const [keybinds, setKeybinds] = useState<{ actionBar: string[]; manaPotion: string }>(() => {
    const saved = localStorage.getItem('keybinds');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_KEYBINDS;
      }
    }
    return DEFAULT_KEYBINDS;
  });

  // Persist keybinds to localStorage
  useEffect(() => {
    localStorage.setItem('keybinds', JSON.stringify(keybinds));
  }, [keybinds]);

  // Mouseover healing mode (persisted to localStorage)
  const [mouseoverHealingEnabled, setMouseoverHealingEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('mouseoverHealingEnabled');
    return saved === 'true';
  });

  // Persist mouseover healing setting to localStorage
  useEffect(() => {
    localStorage.setItem('mouseoverHealingEnabled', mouseoverHealingEnabled.toString());
  }, [mouseoverHealingEnabled]);

  // Check for saved characters in localStorage or cloud
  const checkForSavedCharacters = async (user: User | null) => {
    const characters: SavedCharacter[] = [];

    // If logged in, load all cloud saves
    if (user) {
      try {
        const cloudSaves = await listCloudSaves();
        for (const save of cloudSaves) {
          // Cloud save structure has player data nested under 'player' key
          const cloudData = save.save_data as {
            player?: { name?: string };
            faction?: 'alliance' | 'horde';
            playerClass?: WoWClass;
            gearScore?: number;
            raidSize?: 20 | 40;
            isRaidLeaderMode?: boolean;
          } | null;

          if (cloudData && Object.keys(cloudData).length > 0) {
            characters.push({
              id: save.slot_name,  // Use the slot name as the character ID
              playerName: cloudData.player?.name || 'Unknown',
              faction: cloudData.faction || 'alliance',
              playerClass: cloudData.playerClass || 'paladin',
              gearScore: cloudData.gearScore,
              raidSize: cloudData.raidSize || 40,  // Default to 40 for legacy saves
              isRaidLeaderMode: cloudData.isRaidLeaderMode || false,
            });
          }
        }

        setSavedCharacters(characters);
        return;
      } catch {
        // Cloud load failed
      }
    }

    // No cloud saves or not logged in - no saved characters to show
    setSavedCharacters([]);
  };

  // Delete a character (cloud save only)
  const handleDeleteCharacter = async (characterId: string): Promise<boolean> => {
    try {
      // Only logged-in users can delete (cloud saves only)
      if (currentUser) {
        const success = await deleteCloudSave(characterId);
        if (success) {
          // Refresh the character list
          await checkForSavedCharacters(currentUser);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  // Initialize auth state and subscribe to changes
  useEffect(() => {
    // Check for existing session
    getCurrentUser().then(user => {
      setCurrentUser(user);
      setAuthLoading(false);
      checkForSavedCharacters(user);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        // Identify user in PostHog for cross-session tracking
        posthog.identify(user.id, {
          email: user.email,
          provider: user.app_metadata?.provider
        });
        // Check for saved characters
        checkForSavedCharacters(user);
      } else {
        // User logged out - clear saved characters
        setSavedCharacters([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cloud save function - syncs current game state to cloud
  const handleCloudSave = async () => {
    if (!currentUser || !engineRef.current || !currentCharacterId) return;

    setCloudSyncStatus('syncing');
    try {
      const saveData = engineRef.current.exportSaveData();
      // Use character ID as slot name so each character has their own save
      const success = await saveToCloud(currentCharacterId, saveData);
      setCloudSyncStatus(success ? 'saved' : 'error');

      // Reset status after a few seconds
      setTimeout(() => setCloudSyncStatus(null), 3000);
    } catch {
      setCloudSyncStatus('error');
    }
  };

  // Cloud load function - loads save from cloud
  const handleCloudLoad = async () => {
    if (!currentUser || !engineRef.current) return;

    setCloudSyncStatus('syncing');
    try {
      const cloudData = await loadFromCloud('autosave');
      if (cloudData) {
        engineRef.current.importSaveData(cloudData);
        setCloudSyncStatus('loaded');
        forceUpdate(n => n + 1);
      } else {
        setCloudSyncStatus(null);
      }
      setTimeout(() => setCloudSyncStatus(null), 3000);
    } catch {
      setCloudSyncStatus('error');
    }
  };

  // Auto-save to cloud after boss kill and loot completion
  const handleLootComplete = (action: 'closeLoot' | 'clearResults') => {
    if (!engineRef.current) return;

    if (action === 'closeLoot') {
      engineRef.current.closeLootModal();
    } else {
      engineRef.current.clearLootResults();
    }

    // Auto cloud save if user is logged in
    if (currentUser) {
      // Small delay to ensure game state is updated after loot changes
      setTimeout(() => {
        handleCloudSave();
      }, 100);
    }
  };

  // Handle keybind recording
  useEffect(() => {
    if (!recordingKeybind) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Don't allow Escape as a keybind (it's reserved for closing modals)
      if (e.key === 'Escape') {
        setRecordingKeybind(null);
        return;
      }

      const newKey = e.key.toLowerCase();

      // Check for conflicts
      const isActionBarSlot = recordingKeybind.startsWith('actionBar_');
      const slotIndex = isActionBarSlot ? parseInt(recordingKeybind.split('_')[1]) : -1;

      if (isActionBarSlot) {
        // Check if key is already used in another action bar slot
        const conflictIndex = keybinds.actionBar.findIndex((k, i) => k === newKey && i !== slotIndex);
        if (conflictIndex !== -1) {
          // Swap the keybinds
          const newActionBar = [...keybinds.actionBar];
          newActionBar[conflictIndex] = keybinds.actionBar[slotIndex];
          newActionBar[slotIndex] = newKey;
          setKeybinds({ ...keybinds, actionBar: newActionBar });
        } else if (newKey === keybinds.manaPotion) {
          // Swap with mana potion
          const oldKey = keybinds.actionBar[slotIndex];
          const newActionBar = [...keybinds.actionBar];
          newActionBar[slotIndex] = newKey;
          setKeybinds({ actionBar: newActionBar, manaPotion: oldKey });
        } else {
          const newActionBar = [...keybinds.actionBar];
          newActionBar[slotIndex] = newKey;
          setKeybinds({ ...keybinds, actionBar: newActionBar });
        }
      } else if (recordingKeybind === 'manaPotion') {
        // Check if key is already used in action bar
        const conflictIndex = keybinds.actionBar.findIndex(k => k === newKey);
        if (conflictIndex !== -1) {
          // Swap with action bar slot
          const oldKey = keybinds.manaPotion;
          const newActionBar = [...keybinds.actionBar];
          newActionBar[conflictIndex] = oldKey;
          setKeybinds({ actionBar: newActionBar, manaPotion: newKey });
        } else {
          setKeybinds({ ...keybinds, manaPotion: newKey });
        }
      }

      setRecordingKeybind(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingKeybind, keybinds]);

  // These will be used for state sync - log them to satisfy the linter for now
  if (multiplayerSession && multiplayerPlayers.length > 0 && localPlayer) {
    console.debug('Multiplayer active:', multiplayerSession.room_code);
  }

  const handleOpenPatchNotes = () => {
    setShowPatchNotes(true);
    setHasSeenPatchNotes(true);
    localStorage.setItem('seenPatchNotesVersion', CURRENT_PATCH_VERSION);
  };

  // Handle multiplayer game start
  const handleMultiplayerStart = (session: GameSession, players: SessionPlayer[], player: SessionPlayer) => {
    setMultiplayerSession(session);
    setMultiplayerPlayers(players);
    setLocalPlayer(player);
    setIsMultiplayerMode(true);
    setShowMultiplayerLobby(false);

    // Set up multiplayer healers in the raid
    // Filter out the local player (they're already the main player) and add others as raid healers
    const otherPlayers = players.filter(p => p.id !== player.id);
    if (otherPlayers.length > 0) {
      engine.setupMultiplayerHealers(
        otherPlayers.map(p => ({
          id: p.id,
          name: p.player_name,
          playerClass: p.player_class,
        }))
      );
    }

    // Set the local player's name
    engine.setPlayerName(player.player_name);

    console.log('Multiplayer game started!', { session, players, player });
  };

  // Handle leaving multiplayer mode / going back to solo
  const handleLeaveMultiplayer = () => {
    setShowMultiplayerLobby(false);
    setIsMultiplayerMode(false);
    setMultiplayerSession(null);
    setMultiplayerPlayers([]);
    setLocalPlayer(null);
    setMultiplayerHealingStats({});
    multiplayerHealingStatsRef.current = {};
    // Stop any running encounter
    if (state.isRunning) {
      engine.stopEncounter();
    }
  };

  // Handle encounter selection - intercept for special cases like Golemagg
  const handleEncounterSelect = (encounterId: string) => {
    const engine = engineRef.current;
    if (!engine) return;

    // Check if this encounter requires tank assignment
    const encounter = ENCOUNTERS.find(e => e.id === encounterId);

    if (encounter?.requiresTankAssignment && encounterId === 'golemagg') {
      // Get available tanks (warriors with tank role)
      const state = engine.getState();
      const tanks = state.raid.filter(m => m.role === 'tank' && m.isAlive);
      const warriors = state.raid.filter(m => m.class === 'warrior' && m.isAlive);

      // Pre-select defaults if available
      if (tanks.length >= 2) {
        setGolemaggTank1(tanks[0].id);
        setGolemaggTank2(tanks[1].id);
      }
      // Core Rager tank can be any warrior (including DPS)
      const availableForDogs = warriors.find(w => w.id !== tanks[0]?.id && w.id !== tanks[1]?.id);
      if (availableForDogs) {
        setCoreRagerTank(availableForDogs.id);
      } else if (tanks.length >= 3) {
        setCoreRagerTank(tanks[2].id);
      }

      setShowGolemaggTankModal(true);
      return;
    }

    if (encounter?.requiresTankAssignment && encounterId === 'majordomo') {
      // Majordomo requires 5 tanks: 1 for Majordomo, 4 for adds
      const state = engine.getState();
      const tanks = state.raid.filter(m => m.role === 'tank' && m.isAlive);
      // Warriors and feral druids can be temporary tanks for adds
      const eligibleTanks = state.raid.filter(m =>
        m.isAlive && (m.class === 'warrior' || (m.class === 'druid' && (m.spec === 'feral_tank' || m.spec === 'feral_dps')))
      );

      // Pre-select defaults if available
      if (tanks.length >= 1) setMajordomoTank(tanks[0].id);

      // Assign add tanks from remaining eligible tanks
      const usedIds = new Set([tanks[0]?.id]);
      const remainingTanks = eligibleTanks.filter(t => !usedIds.has(t.id));

      if (remainingTanks.length >= 1) { setMajordomoAddTank1(remainingTanks[0].id); usedIds.add(remainingTanks[0].id); }
      if (remainingTanks.length >= 2) { setMajordomoAddTank2(remainingTanks[1].id); usedIds.add(remainingTanks[1].id); }
      if (remainingTanks.length >= 3) { setMajordomoAddTank3(remainingTanks[2].id); usedIds.add(remainingTanks[2].id); }
      if (remainingTanks.length >= 4) { setMajordomoAddTank4(remainingTanks[3].id); }

      setShowMajordomoTankModal(true);
      return;
    }

    if (encounter?.requiresTankAssignment && encounterId === 'ragnaros') {
      // Ragnaros requires 2 tanks for tank swap on Wrath of Ragnaros
      // Show tank assignment first, then RP, then fight starts
      const state = engine.getState();
      const tanks = state.raid.filter(m => m.role === 'tank' && m.isAlive);

      // Pre-select defaults if available
      if (tanks.length >= 1) setRagnarosTank1(tanks[0].id);
      if (tanks.length >= 2) setRagnarosTank2(tanks[1].id);

      setShowRagnarosTankModal(true);
      return;
    }

    // Normal encounter start
    engine.startEncounter(encounterId);
  };

  // Start Golemagg with assigned tanks
  const startGolemaggWithTanks = () => {
    const engine = engineRef.current;
    if (!engine) return;

    if (!golemaggTank1 || !golemaggTank2 || !coreRagerTank) {
      alert('Please assign all three tanks before starting the fight.');
      return;
    }

    if (golemaggTank1 === golemaggTank2 || golemaggTank1 === coreRagerTank || golemaggTank2 === coreRagerTank) {
      alert('Each tank role must be assigned to a different raid member.');
      return;
    }

    // Close modal and start the encounter with tank assignments
    setShowGolemaggTankModal(false);
    engine.startEncounter('golemagg', {
      golemaggTanks: {
        tank1Id: golemaggTank1,
        tank2Id: golemaggTank2,
        coreRagerTankId: coreRagerTank,
        currentMainTank: 1,
        tank1Stacks: 0,
        tank2Stacks: 0,
        lastSwapTime: 0,
        nextSwapThreshold: 5, // First swap at 5 stacks, then 10, 15, etc.
        ragersLoose: false, // Dogs are contained until tank dies
        ragerTarget1: null,
        ragerTarget2: null,
      }
    });
  };

  // Start Majordomo with assigned tanks
  const startMajordomoWithTanks = () => {
    const engine = engineRef.current;
    if (!engine) return;

    const allTanks = [majordomoTank, majordomoAddTank1, majordomoAddTank2, majordomoAddTank3, majordomoAddTank4];

    if (allTanks.some(t => !t)) {
      alert('Please assign all five tanks before starting the fight.');
      return;
    }

    // Check for duplicates
    const uniqueTanks = new Set(allTanks);
    if (uniqueTanks.size !== 5) {
      alert('Each tank role must be assigned to a different raid member.');
      return;
    }

    // Close modal and start the encounter with tank assignments
    setShowMajordomoTankModal(false);
    engine.startEncounter('majordomo', {
      majordomoTanks: {
        majordomoTankId: majordomoTank,
        addTank1Id: majordomoAddTank1,
        addTank2Id: majordomoAddTank2,
        addTank3Id: majordomoAddTank3,
        addTank4Id: majordomoAddTank4,
        magicReflectionActive: false,
        magicReflectionEndTime: 0,
        dpsStoppedTime: 0,
        looseAdds1: false,
        looseAdds2: false,
        looseAdds3: false,
        looseAdds4: false,
        looseTarget1a: null,
        looseTarget1b: null,
        looseTarget2a: null,
        looseTarget2b: null,
        looseTarget3a: null,
        looseTarget3b: null,
        looseTarget4a: null,
        looseTarget4b: null,
      }
    });
  };

  // Ragnaros RP complete handler - start the fight with saved tank assignments
  const handleRagnarosRPComplete = () => {
    setShowRagnarosRP(false);
    // Start the encounter with the tank assignments saved earlier
    const engine = engineRef.current;
    if (engine && ragnarosTank1 && ragnarosTank2) {
      engine.startEncounter('ragnaros', {
        ragnarosTanks: {
          tank1Id: ragnarosTank1,
          tank2Id: ragnarosTank2,
          currentMainTank: 1,
          wrathKnockbackUntil: 0,
          submergeTime: 180, // 3 minutes until submerge
          sonsTimer: -1, // Not active until submerge
          sonsKilled: 0,
          hasSubmerged: false,
          healthBeforeSubmerge: 0,
        }
      });
    }
  };

  // Ragnaros RP skip handler
  const handleRagnarosRPSkip = () => {
    // Stop audio when skipping
    if (ragnarosRPAudioRef.current) {
      ragnarosRPAudioRef.current.pause();
      ragnarosRPAudioRef.current = null;
    }
    handleRagnarosRPComplete();
  };

  // Start Ragnaros with assigned tanks - shows RP first, then fight starts
  const startRagnarosWithTanks = () => {
    if (!ragnarosTank1 || !ragnarosTank2) {
      alert('Please assign both tanks before starting the fight.');
      return;
    }

    if (ragnarosTank1 === ragnarosTank2) {
      alert('Each tank role must be assigned to a different raid member.');
      return;
    }

    // Close tank modal and show RP sequence
    // Tank assignments are saved in state and will be used when RP completes
    setShowRagnarosTankModal(false);
    setShowRagnarosRP(true);
    setRagnarosRPDialogueIndex(0);
    setRagnarosRPTimeRemaining(RP_DURATION);
  };

  // Handle starting the game from landing page
  const handleStartGame = async (config: CharacterConfig) => {
    // Save character config to localStorage
    localStorage.setItem('characterConfig', JSON.stringify(config));

    // Track the current character ID for cloud saves
    const characterId = config.id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentCharacterId(characterId);

    // Initialize or reconfigure engine
    if (!engineRef.current) {
      engineRef.current = new GameEngine();
    }

    const engine = engineRef.current;

    // Apply character config
    engine.setPlayerName(config.playerName);
    engine.switchFaction(config.faction);

    // Set raid leader mode if selected
    if (config.isRaidLeaderMode) {
      engine.setRaidLeaderMode(true);
      // For new raid leader characters, clear the raid completely (no player character)
      if (!config.isContinuing) {
        engine.clearRaidForRaidLeader();
        // Track the selected raid size for the setup UI
        if (config.raidSize) {
          setRaidLeaderRaidSize(config.raidSize);
        }
      }
    }

    // Set raid size from character config (for new characters, non-raid-leader only)
    // Continuing characters will have this overwritten by importSaveData
    // Raid leader mode doesn't use this since they build their own raid
    if (!config.isContinuing && config.raidSize && !config.isRaidLeaderMode) {
      engine.adminResizeRaid(config.raidSize);
    }

    // Only load cloud save if continuing an existing character
    if (config.isContinuing && currentUser && config.id) {
      try {
        const cloudData = await loadFromCloud(config.id);
        if (cloudData) {
          engine.importSaveData(cloudData);
          // Make sure name matches what user chose (in case cloud save had different name)
          engine.setPlayerName(config.playerName);
        }
      } catch {
        // Cloud load failed, start fresh
      }
    }

    // Auto cloud save NEW characters immediately if logged in
    if (!config.isContinuing && currentUser) {
      try {
        const saveData = engine.exportSaveData();
        await saveToCloud(characterId, saveData);
        console.log('New character saved to cloud:', characterId);
      } catch (err) {
        console.error('Failed to save new character to cloud:', err);
      }
    }

    // Update PostHog with character info for better user profiles
    if (currentUser) {
      posthog.identify(currentUser.id, {
        email: currentUser.email,
        provider: currentUser.app_metadata?.provider,
        character_name: config.playerName,
        character_class: config.faction === 'alliance' ? 'paladin' : 'shaman',
        faction: config.faction
      });
    }

    setGameInitialized(true);
    setShowLandingPage(false);

    // For new Raid Leader Mode characters, show the raid composition setup
    if (config.isRaidLeaderMode && !config.isContinuing) {
      setShowRaidLeaderSetup(true);
    }

    forceUpdate(n => n + 1);
  };

  // Initialize engine once (only after landing page)
  if (!engineRef.current && gameInitialized) {
    engineRef.current = new GameEngine();
  }

  // Use a dummy engine for type safety when on landing page
  const engine = engineRef.current || new GameEngine();

  // Subscribe to engine updates
  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      forceUpdate(n => n + 1);
    });
    return unsubscribe;
  }, [engine]);

  // Sync mouseover healing mode with engine (runs when setting changes or engine initializes)
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMouseoverHealingEnabled(mouseoverHealingEnabled);
      // Clear selected target when switching to mouseover mode
      if (mouseoverHealingEnabled) {
        engineRef.current.selectTarget('');
      }
    }
  }, [mouseoverHealingEnabled, gameInitialized]);

  // Persist buffs panel expanded state
  useEffect(() => {
    localStorage.setItem('ui_buffs_expanded', JSON.stringify(buffsExpanded));
  }, [buffsExpanded]);

  // Multiplayer real-time game state sync
  useEffect(() => {
    if (!isMultiplayerMode || !multiplayerSession || !localPlayer) return;

    const roomCode = multiplayerSession.room_code;
    const isHost = localPlayer.is_host;

    // Create realtime channel for game state
    const channel = supabase.channel(`game:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    if (isHost) {
      // HOST: Broadcast game state to all clients
      let broadcastInterval: number | null = null;

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Broadcast state 20 times per second
          broadcastInterval = window.setInterval(() => {
            const gameState = engine.getState();

            // If encounter just started (healing is 0), reset all multiplayer stats
            if (gameState.healingDone === 0 && gameState.isRunning) {
              multiplayerHealingStatsRef.current = {};
            }

            // Update host's own healing stats in the ref
            multiplayerHealingStatsRef.current[localPlayer?.id || 'host'] = {
              name: gameState.playerName,
              class: gameState.playerClass,
              healingDone: gameState.healingDone,
              dispelsDone: gameState.dispelsDone,
            };

            // Update state so RaidMeter re-renders with current stats
            setMultiplayerHealingStats({ ...multiplayerHealingStatsRef.current });

            channel.send({
              type: 'broadcast',
              event: 'game_state',
              payload: {
                // Send full raid state with names, debuffs, buffs for sync
                raid: gameState.raid.map((m, index) => ({
                  index,
                  id: m.id,
                  name: m.name,
                  class: m.class,
                  role: m.role,
                  hp: m.currentHealth,
                  maxHp: m.maxHealth,
                  alive: m.isAlive,
                  debuffs: m.debuffs, // Sync debuffs!
                  buffs: m.buffs,     // Sync buffs too
                })),
                // Send full boss data so client can start any boss
                boss: gameState.boss ? {
                  id: gameState.boss.id,
                  name: gameState.boss.name,
                  hp: gameState.boss.currentHealth,
                  maxHp: gameState.boss.maxHealth,
                  phase: gameState.boss.currentPhase,
                  enrageTimer: gameState.boss.enrageTimer,
                } : null,
                isRunning: gameState.isRunning,
                elapsedTime: gameState.elapsedTime,
                bossEnraged: gameState.bossEnraged,
                // Include all players' healing stats for the meter
                healingStats: multiplayerHealingStatsRef.current,
                // Sync loot drops to all clients
                showLootModal: gameState.showLootModal,
                pendingLoot: gameState.pendingLoot,
                // Sync multiplayer loot bidding
                lootBids: gameState.lootBids,
                lootBidTimer: gameState.lootBidTimer,
                lootResults: gameState.lootResults,
                // Sync boss kill progress
                defeatedBossesByRaid: gameState.defeatedBossesByRaid,
                // Sync encounter result for summary display
                lastEncounterResult: gameState.lastEncounterResult,
                // Sync Living Bomb safe zone members
                membersInSafeZone: Array.from(gameState.membersInSafeZone),
              },
            });
          }, 50);
        }
      });

      // HOST also listens on the :actions channel for player actions from clients
      const actionsChannel = supabase.channel(`game:${roomCode}:actions`, {
        config: { broadcast: { self: false } },
      });

      actionsChannel.on('broadcast', { event: 'player_action' }, (payload) => {
        const data = payload.payload as {
          type: string;
          targetIndex?: number;
          healAmount?: number;
          debuffId?: string;
          playerName: string;
          spellName?: string;
          playerId?: string;
          playerClass?: string;
          // Loot bid fields
          itemId?: string;
          dkp?: number;
          // Safe zone evacuation
          memberId?: string;
        };
        const gameState = engine.getState();

        if (data.type === 'loot_bid' && data.itemId && data.playerId && data.playerClass && data.dkp !== undefined) {
          // Handle loot bid from client
          engine.addLootBid(
            data.itemId,
            data.playerId,
            data.playerName,
            data.playerClass as WoWClass,
            data.dkp
          );
        } else if (data.type === 'loot_pass' && data.itemId && data.playerId) {
          // Handle loot pass from client
          engine.removeLootBid(data.itemId, data.playerId);
        } else if (data.type === 'heal' && data.healAmount !== undefined && data.targetIndex !== undefined) {
          // Apply the heal from remote player
          const target = gameState.raid[data.targetIndex];
          if (target && target.isAlive) {
            const actualHeal = Math.min(data.healAmount, target.maxHealth - target.currentHealth);
            target.currentHealth = Math.min(target.maxHealth, target.currentHealth + data.healAmount);
            engine.addCombatLogEntry({
              message: `${data.playerName}'s ${data.spellName} heals ${target.name} for ${actualHeal}`,
              type: 'heal',
            });

            // Track this player's healing for the meter
            if (data.playerId) {
              const existing = multiplayerHealingStatsRef.current[data.playerId] || {
                name: data.playerName,
                class: data.playerClass || 'paladin',
                healingDone: 0,
                dispelsDone: 0,
              };
              existing.healingDone += actualHeal;
              multiplayerHealingStatsRef.current[data.playerId] = existing;
            }
          }
        } else if (data.type === 'dispel' && data.debuffId && data.targetIndex !== undefined) {
          // Apply the dispel from remote player
          const target = gameState.raid[data.targetIndex];
          if (target && target.isAlive) {
            const debuff = target.debuffs.find(d => d.id === data.debuffId);
            if (debuff) {
              target.debuffs = target.debuffs.filter(d => d.id !== data.debuffId);
              engine.addCombatLogEntry({
                message: `${data.playerName}'s ${data.spellName} dispels ${debuff.name} from ${target.name}`,
                type: 'buff',
              });

              // Track this player's dispels for the meter
              if (data.playerId) {
                const existing = multiplayerHealingStatsRef.current[data.playerId] || {
                  name: data.playerName,
                  class: data.playerClass || 'paladin',
                  healingDone: 0,
                  dispelsDone: 0,
                };
                existing.dispelsDone += 1;
                multiplayerHealingStatsRef.current[data.playerId] = existing;
              }
            }
          }
        } else if (data.type === 'evacuate_safe_zone' && data.memberId) {
          // Apply safe zone evacuation from remote player
          engine.setMemberInSafeZone(data.memberId, true);
          setEvacuatedMembers(prev => new Set([...prev, data.memberId!]));
        }
      });

      actionsChannel.subscribe();

      return () => {
        if (broadcastInterval) clearInterval(broadcastInterval);
        supabase.removeChannel(channel);
        supabase.removeChannel(actionsChannel);
      };
    } else {
      // CLIENT: Receive game state from host
      channel.on('broadcast', { event: 'game_state' }, (payload) => {
        const data = payload.payload;
        if (!data) return;

        const gameState = engine.getState();

        // Sync raid members by INDEX (host's raid is authoritative)
        if (data.raid && Array.isArray(data.raid)) {
          data.raid.forEach((memberData: {
            index: number;
            id: string;
            name: string;
            class: string;
            role: string;
            hp: number;
            maxHp: number;
            alive: boolean;
            debuffs?: Array<{ id: string; name: string; icon: string; duration: number; maxDuration: number; type?: string }>;
            buffs?: Array<{ id: string; name: string; icon: string; duration: number; maxDuration: number }>;
          }) => {
            if (memberData.index < gameState.raid.length) {
              const member = gameState.raid[memberData.index];
              // Sync all the important state
              member.id = memberData.id;
              member.name = memberData.name;
              member.currentHealth = memberData.hp;
              member.maxHealth = memberData.maxHp;
              member.isAlive = memberData.alive;
              // Sync debuffs and buffs (cast to proper types)
              if (memberData.debuffs) {
                member.debuffs = memberData.debuffs as typeof member.debuffs;
              }
              if (memberData.buffs) {
                member.buffs = memberData.buffs as typeof member.buffs;
              }
            }
          });
        }

        // Update boss state
        if (data.boss) {
          // If host started an encounter and we haven't, start it
          if (data.isRunning && !gameState.isRunning) {
            const bossId = data.boss.id as string;
            // Try to start the encounter - if boss doesn't exist locally, create a placeholder
            engine.startEncounter(bossId);
          }

          // Sync boss state (even if we couldn't find the exact boss)
          if (gameState.boss) {
            gameState.boss.currentHealth = data.boss.hp;
            gameState.boss.maxHealth = data.boss.maxHp;
            gameState.boss.currentPhase = data.boss.phase;
            // Also sync the boss name in case client has different raid
            if (data.boss.name) {
              gameState.boss.name = data.boss.name;
            }
          } else if (data.isRunning) {
            // Boss doesn't exist locally but host is running - create a minimal boss object
            gameState.boss = {
              id: data.boss.id,
              name: data.boss.name || 'Unknown Boss',
              currentHealth: data.boss.hp,
              maxHealth: data.boss.maxHp,
              currentPhase: data.boss.phase || 1,
              enrageTimer: data.boss.enrageTimer || 300,
              damageEvents: [],
            };
            gameState.isRunning = true;
          }
        }

        // If host stopped encounter, stop ours too
        if (!data.isRunning && gameState.isRunning) {
          engine.stopEncounter();
        }

        // Sync timing
        gameState.elapsedTime = data.elapsedTime;
        gameState.bossEnraged = data.bossEnraged;

        // Sync healing stats from host for the meter
        if (data.healingStats) {
          setMultiplayerHealingStats(data.healingStats);
        }

        // Sync loot modal from host
        if (data.showLootModal !== undefined) {
          gameState.showLootModal = data.showLootModal;
          if (data.pendingLoot) {
            gameState.pendingLoot = data.pendingLoot;
          }
        }

        // Sync multiplayer loot bidding from host
        if (data.lootBids !== undefined) {
          gameState.lootBids = data.lootBids;
        }
        if (data.lootBidTimer !== undefined) {
          gameState.lootBidTimer = data.lootBidTimer;
        }
        if (data.lootResults !== undefined) {
          gameState.lootResults = data.lootResults;
        }

        // Sync boss kill progress from host
        if (data.defeatedBossesByRaid) {
          gameState.defeatedBossesByRaid = data.defeatedBossesByRaid;
        }

        // Sync encounter result for summary display
        if (data.lastEncounterResult !== undefined) {
          gameState.lastEncounterResult = data.lastEncounterResult;
        }

        // Sync Living Bomb safe zone members from host
        if (data.membersInSafeZone) {
          setEvacuatedMembers(new Set(data.membersInSafeZone));
        }

        // Force UI update
        forceUpdate(n => n + 1);
      });

      channel.subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isMultiplayerMode, multiplayerSession, localPlayer, engine]);

  // Store channel ref for sending actions from client
  const mpChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Set up multiplayer client mode - clients send heals to host instead of applying locally
  useEffect(() => {
    if (!isMultiplayerMode || !multiplayerSession || !localPlayer) return;

    const isClient = !localPlayer.is_host;
    const roomCode = multiplayerSession.room_code;

    // Set the engine to client mode if not host
    engine.setMultiplayerClientMode(isClient);

    if (isClient) {
      // Create a channel for sending player actions
      const actionChannel = supabase.channel(`game:${roomCode}:actions`, {
        config: { broadcast: { self: false } },
      });

      actionChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          mpChannelRef.current = actionChannel;
        }
      });

      // Set up the heal callback - send heals to host
      engine.setOnHealApplied((data) => {
        if (mpChannelRef.current) {
          mpChannelRef.current.send({
            type: 'broadcast',
            event: 'player_action',
            payload: {
              type: 'heal',
              targetIndex: data.targetIndex,
              healAmount: data.healAmount,
              playerName: data.playerName,
              spellName: data.spellName,
              playerId: localPlayer.id,
              playerClass: localPlayer.player_class,
            },
          });
        }
      });

      // Set up dispel callback - send dispels to host
      engine.setOnDispelApplied((data) => {
        if (mpChannelRef.current) {
          mpChannelRef.current.send({
            type: 'broadcast',
            event: 'player_action',
            payload: {
              type: 'dispel',
              targetIndex: data.targetIndex,
              debuffId: data.debuffId,
              playerName: data.playerName,
              spellName: data.spellName,
              playerId: localPlayer.id,
              playerClass: localPlayer.player_class,
            },
          });
        }
      });

      return () => {
        engine.setMultiplayerClientMode(false);
        engine.setOnHealApplied(null);
        engine.setOnDispelApplied(null);
        supabase.removeChannel(actionChannel);
        mpChannelRef.current = null;
      };
    }

    return () => {
      engine.setMultiplayerClientMode(false);
    };
  }, [isMultiplayerMode, multiplayerSession, localPlayer, engine]);

  // Set up special alert callback (for Thunderaan summon, etc.)
  useEffect(() => {
    engine.setSpecialAlertCallback((message: string) => {
      setSpecialAlert(message);
      // Auto-dismiss after 5 seconds
      setTimeout(() => setSpecialAlert(null), 5000);
    });
  }, [engine]);

  // Set up Inferno warning callback (Baron Geddon - no airhorn)
  useEffect(() => {
    engine.onInfernoWarning = (targetNames: string[]) => {
      const warningText = targetNames.length === 1
        ? `INFERNO! ${targetNames[0]} forgot to move!`
        : `INFERNO! ${targetNames.join(', ')} forgot to move!`;
      setInfernoWarning(warningText);
      // Auto-dismiss after 4 seconds (duration of the warning)
      setTimeout(() => setInfernoWarning(null), 4000);
    };
    return () => {
      engine.onInfernoWarning = null;
    };
  }, [engine]);

  // Set up Mind Control warning callback (Lucifron - Dominate Mind)
  useEffect(() => {
    engine.onMindControlWarning = (mcPlayerName: string, attackingName: string) => {
      setMindControlWarning({ mcPlayer: mcPlayerName, attackingPlayer: attackingName });
      // Play airhorn for MC warning
      if (airhornRef.current) {
        airhornRef.current.currentTime = 0;
        airhornRef.current.play().catch(() => {});
      }
      // Auto-dismiss after 5 seconds
      setTimeout(() => setMindControlWarning(null), 5000);
    };
    return () => {
      engine.onMindControlWarning = null;
    };
  }, [engine]);

  // Set up Lava Bomb warning callback (Magmadar)
  useEffect(() => {
    engine.onLavaBombWarning = (targetName: string) => {
      setLavaBombWarning(`LAVA BOMB! ${targetName} didn't move!`);
      // Play airhorn for Lava Bomb warning
      if (airhornRef.current) {
        airhornRef.current.currentTime = 0;
        airhornRef.current.play().catch(() => {});
      }
      // Auto-dismiss after 4 seconds
      setTimeout(() => setLavaBombWarning(null), 4000);
    };
    return () => {
      engine.onLavaBombWarning = null;
    };
  }, [engine]);

  // Phase transition detection
  const state = engine.getState();
  useEffect(() => {
    const currentPhase = state.boss?.currentPhase || 1;
    if (currentPhase !== lastPhaseRef.current && state.isRunning) {
      // Find the phase transition message
      const transition = state.boss?.phaseTransitions?.find(t => t.phase === currentPhase);
      if (transition) {
        setPhaseAlert(transition.message);
        // Clear the alert after 3 seconds
        const timer = setTimeout(() => setPhaseAlert(null), 3000);
        return () => clearTimeout(timer);
      }
    }
    lastPhaseRef.current = currentPhase;
  }, [state.boss?.currentPhase, state.isRunning, state.boss?.phaseTransitions]);

  // Reset phase tracking when encounter ends
  useEffect(() => {
    if (!state.isRunning) {
      lastPhaseRef.current = 1;
      setPhaseAlert(null);
    }
  }, [state.isRunning]);

  // Watch for pending cloud save flag (triggered by quest turn-ins, legendary crafting, etc.)
  useEffect(() => {
    if (!engineRef.current || !currentUser || !state.pendingCloudSave) return;

    // Clear the flag immediately to prevent multiple saves
    engineRef.current.clearPendingCloudSave();

    // Trigger the cloud save
    handleCloudSave();
  }, [state.pendingCloudSave, currentUser]);

  // Living Bomb Safe Zone - auto-return members when their debuff expires
  // Use elapsedTime as dependency since state.raid reference doesn't change when debuffs update
  // Note: We don't call setMemberInSafeZone(false) here - the GameEngine handles cleanup
  // after explosion in handleLivingBombExplosion. We just update React state to re-show the frame.
  useEffect(() => {
    if (evacuatedMembers.size === 0) return;

    // Check if any evacuated member no longer has living_bomb
    const stillBombed = new Set<string>();
    evacuatedMembers.forEach(memberId => {
      const member = state.raid.find(m => m.id === memberId);
      if (member && member.debuffs.some(d => d.id === 'living_bomb')) {
        stillBombed.add(memberId);
      }
      // Don't call setMemberInSafeZone(false) - GameEngine already did this in handleLivingBombExplosion
    });

    // If set changed, update state to show member back in raid
    if (stillBombed.size !== evacuatedMembers.size) {
      setEvacuatedMembers(stillBombed);
    }
  }, [state.elapsedTime, evacuatedMembers]);

  // Ragnaros RP timer - countdown and dialogue progression with audio
  useEffect(() => {
    if (!showRagnarosRP) return;

    // Calculate cumulative start times for each dialogue
    const dialogueStartTimes: number[] = [];
    let cumulative = 0;
    for (const d of RAGNAROS_RP_DIALOGUE) {
      dialogueStartTimes.push(cumulative);
      cumulative += d.duration;
    }

    // Play first audio immediately
    const firstAudio = new Audio(RAGNAROS_RP_DIALOGUE[0].audio);
    ragnarosRPAudioRef.current = firstAudio;
    firstAudio.play().catch(() => {}); // Ignore autoplay restrictions

    let lastDialogueIndex = 0;

    const timer = setInterval(() => {
      setRagnarosRPTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (ragnarosRPAudioRef.current) {
            ragnarosRPAudioRef.current.pause();
            ragnarosRPAudioRef.current = null;
          }
          handleRagnarosRPComplete();
          return 0;
        }

        // Calculate elapsed time and find current dialogue index
        const elapsed = RP_DURATION - prev + 1;
        let newIndex = 0;
        for (let i = 0; i < dialogueStartTimes.length; i++) {
          if (elapsed >= dialogueStartTimes[i]) {
            newIndex = i;
          }
        }
        newIndex = Math.min(newIndex, RAGNAROS_RP_DIALOGUE.length - 1);

        // If dialogue changed, play new audio
        if (newIndex !== lastDialogueIndex) {
          lastDialogueIndex = newIndex;
          setRagnarosRPDialogueIndex(newIndex);

          // Stop previous audio and play new one
          if (ragnarosRPAudioRef.current) {
            ragnarosRPAudioRef.current.pause();
          }
          const newAudio = new Audio(RAGNAROS_RP_DIALOGUE[newIndex].audio);
          ragnarosRPAudioRef.current = newAudio;
          newAudio.play().catch(() => {});
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (ragnarosRPAudioRef.current) {
        ragnarosRPAudioRef.current.pause();
        ragnarosRPAudioRef.current = null;
      }
    };
  }, [showRagnarosRP]);

  // Clear evacuated members when encounter ends
  useEffect(() => {
    if (!state.isRunning) {
      setEvacuatedMembers(new Set());
      previousLivingBombTargetsRef.current = new Set();
    }
  }, [state.isRunning]);

  // Living Bomb detection - show raid warning and play airhorn
  useEffect(() => {
    if (!state.isRunning) return;

    // Find all members currently with Living Bomb that are NOT in safe zone
    const currentBombTargets = new Set<string>();
    const newBombTargets: string[] = [];

    state.raid.forEach(member => {
      if (member.isAlive && member.debuffs.some(d => d.id === 'living_bomb')) {
        // Only count as active threat if NOT evacuated to safe zone
        if (!evacuatedMembers.has(member.id)) {
          currentBombTargets.add(member.id);
          // Check if this is a NEW Living Bomb (wasn't there before)
          if (!previousLivingBombTargetsRef.current.has(member.id)) {
            newBombTargets.push(member.name);
          }
        }
      }
    });

    // Always update the tracked targets first
    previousLivingBombTargetsRef.current = currentBombTargets;

    // If there are new Living Bomb targets, show warning and play sound
    if (newBombTargets.length > 0) {
      const warningText = newBombTargets.length === 1
        ? `LIVING BOMB on ${newBombTargets[0]}!`
        : `LIVING BOMB on ${newBombTargets.join(', ')}!`;

      setLivingBombWarning(warningText);

      // Play airhorn sound
      if (airhornRef.current) {
        airhornRef.current.currentTime = 0;
        airhornRef.current.play().catch(() => {});
      }
    }

    // Clear warning if no active bombs remain (moved to safe zone or exploded)
    if (currentBombTargets.size === 0 && livingBombWarning) {
      setLivingBombWarning(null);
    }
  }, [state.raid, state.isRunning, state.elapsedTime, livingBombWarning, evacuatedMembers]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable (except Escape)
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Escape always works (to close modals/cancel)
      if (e.key === 'Escape') {
        if (showInventory) {
          setShowInventory(false);
          return;
        }
        if (engine.getState().isCasting) {
          engine.cancelCast();
        } else if (engine.getState().isRunning) {
          engine.stopEncounter();
        }
        return;
      }

      // Skip other keybindings if user is typing
      if (isTyping) return;

      const key = e.key.toLowerCase();

      // Mana potion keybind
      if (key === keybinds.manaPotion.toLowerCase()) {
        engine.useManaPotion();
      }
      // B key opens bags (only when not in encounter)
      if (key === 'b' && !engine.getState().isRunning) {
        setShowInventory(prev => !prev);
      }
      // Action bar keybinds
      const actionBar = engine.getActionBar();
      const actionBarIndex = keybinds.actionBar.findIndex(k => k.toLowerCase() === key);
      if (actionBarIndex !== -1 && actionBar[actionBarIndex]) {
        engine.castSpell(actionBar[actionBarIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, showInventory, keybinds]);

  // Track when loot modal opens to start bidding in multiplayer
  const prevShowLootModalRef = useRef(false);
  const isHost = localPlayer?.is_host ?? false;
  useEffect(() => {
    // If loot modal just opened and we're the multiplayer host
    if (state.showLootModal && !prevShowLootModalRef.current && isMultiplayerMode && isHost) {
      // Start the bidding window (15 seconds)
      engine.startLootBidding(15);
    }
    prevShowLootModalRef.current = state.showLootModal;
  }, [state.showLootModal, isMultiplayerMode, isHost, engine]);

  // Tick the loot bid timer and resolve when it expires (host only)
  useEffect(() => {
    if (!isMultiplayerMode || !isHost || state.lootBidTimer <= 0) return;

    const timer = setInterval(() => {
      engine.tickLootBidTimer();
      const currentTimer = engine.getState().lootBidTimer;

      if (currentTimer <= 0) {
        // Timer expired, resolve all bids
        const results = engine.resolveLootBids();

        // Apply loot to winners - need to equip items for each winner
        for (const result of results) {
          // The host needs to apply the loot result
          // Find the item from the loot results
          engine.applyLootResult(result);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isMultiplayerMode, isHost, state.lootBidTimer, engine]);

  const actionBar = engine.getActionBar();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper: Check if a raid member is the local player (works in solo and multiplayer)
  const isLocalPlayer = (memberId: string): boolean => {
    if (isMultiplayerMode && localPlayer) {
      // In multiplayer:
      // - Host: their raid member has id 'player'
      // - Client: their raid member has id 'mp_<localPlayer.id>'
      return localPlayer.is_host
        ? memberId === state.playerId
        : memberId === `mp_${localPlayer.id}`;
    }
    // In solo mode: check against state.playerId
    return memberId === state.playerId;
  };

  // Get boss abilities for the encounter journal
  const getBossAbilities = (bossId: string) => {
    // Search in current raid encounters first, then fall back to all encounters
    let boss = engine.getCurrentRaidEncounters().find(e => e.id === bossId);
    if (!boss) {
      boss = ENCOUNTERS.find(e => e.id === bossId);
    }
    if (!boss) return [];

    const abilities: Array<{
      name: string;
      type: string;
      description: string;
      icon?: string;
      damage?: number;
      interval: number;
    }> = [];

    boss.damageEvents.forEach(event => {
      if (event.type === 'debuff' && event.debuffId) {
        const debuff = DEBUFFS[event.debuffId];
        if (debuff) {
          abilities.push({
            name: debuff.name,
            type: debuff.type,
            description: getDebuffDescription(debuff),
            icon: debuff.icon,
            damage: debuff.damagePerTick,
            interval: event.interval,
          });
        }
      } else if (event.type === 'tank_damage') {
        abilities.push({
          name: event.damage > 1000 ? 'Heavy Strike' : 'Melee Attack',
          type: 'physical',
          description: `Deals ${event.damage} damage to the tank.`,
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'raid_damage') {
        abilities.push({
          name: 'Raid Damage',
          type: 'fire',
          description: `Deals ${event.damage} damage to ${event.targetCount || 5} random raid members.`,
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'random_target') {
        // Check damage type to determine ability name and icon
        const isShadow = event.damageType === 'shadow';
        const shadowBoltDebuff = DEBUFFS['shadow_bolt'];
        abilities.push({
          name: isShadow ? 'Shadow Bolt' : 'Random Target',
          type: event.damageType || 'fire',
          description: isShadow
            ? `Hurls a Shadow Bolt at a random raid member, dealing ${event.damage} shadow damage.`
            : `Deals ${event.damage} damage to a random raid member.`,
          icon: isShadow ? shadowBoltDebuff?.icon : undefined,
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'inferno') {
        const debuff = DEBUFFS['inferno'];
        abilities.push({
          name: 'Inferno',
          type: 'fire',
          description: `Baron Geddon erupts in flames. 1-3 melee players who forget to move take ${debuff?.damagePerTick || 1000} fire damage per second for ${debuff?.maxDuration || 8} seconds. Cannot be dispelled!`,
          icon: debuff?.icon,
          damage: debuff?.damagePerTick,
          interval: event.interval,
        });
      } else if (event.type === 'lava_bomb') {
        const debuff = DEBUFFS['lava_bomb'];
        abilities.push({
          name: 'Lava Bomb',
          type: 'fire',
          description: `Targets a random raid member. 20% chance the player doesn't move in time and takes ${debuff?.damagePerTick || 400} fire damage per second for ${debuff?.maxDuration || 8} seconds. Cannot be dispelled!`,
          icon: debuff?.icon,
          damage: debuff?.damagePerTick,
          interval: event.interval,
        });
      } else if (event.type === 'frenzy') {
        const debuff = DEBUFFS['frenzy'];
        abilities.push({
          name: 'Frenzy',
          type: 'enrage',
          description: `Magmadar goes into a Frenzy, increasing tank damage significantly. Hunters must use Tranquilizing Shot to remove it.`,
          icon: debuff?.icon,
          interval: event.interval,
        });
      } else if (event.type === 'rain_of_fire') {
        const debuff = DEBUFFS['rain_of_fire'];
        abilities.push({
          name: 'Rain of Fire',
          type: 'fire',
          description: `Targets 5 random raid members with fire. All targets take 700 fire damage. 25% chance each target doesn't move and takes ${debuff?.damagePerTick || 700} additional fire damage every 2 seconds for 4 more seconds. Cannot be dispelled!`,
          icon: debuff?.icon,
          interval: event.interval,
        });
      } else if (event.type === 'antimagic_pulse') {
        const debuff = DEBUFFS['antimagic_pulse'];
        abilities.push({
          name: 'Antimagic Pulse',
          type: 'arcane',
          description: `Dispels 1 buff from all raid members every ${event.interval} seconds. Rebuff as needed or conserve mana by fighting without buffs.`,
          icon: debuff?.icon,
          interval: event.interval,
        });
      } else if (event.type === 'shazzrah_curse') {
        const debuff = DEBUFFS['shazzrahs_curse'];
        abilities.push({
          name: "Shazzrah's Curse",
          type: 'curse',
          description: `Curses the entire raid every ${event.interval} seconds, doubling magic damage taken for 5 minutes. Only Mages and Druids can decurse - they must work through the raid one by one!`,
          icon: debuff?.icon,
          interval: event.interval,
        });
      } else if (event.type === 'shazzrah_blink') {
        const blinkDebuff = DEBUFFS['arcane_explosion'];
        abilities.push({
          name: 'Blink',
          type: 'arcane',
          description: `Shazzrah teleports to a random raid member every ${event.interval} seconds and immediately casts Arcane Explosion.`,
          icon: '/icons/spell_arcane_blink.jpg',
          interval: event.interval,
        });
        abilities.push({
          name: 'Arcane Explosion',
          type: 'arcane',
          description: `Hits the ENTIRE RAID for ${event.damage} arcane damage (${event.damage * 2} if cursed!). Decurse is critical to survival!`,
          icon: blinkDebuff?.icon,
          interval: event.interval,
          damage: event.damage,
        });
      } else if (event.type === 'deaden_magic') {
        const debuff = DEBUFFS['deaden_magic'];
        abilities.push({
          name: 'Deaden Magic',
          type: 'magic',
          description: `Shazzrah gains a buff that reduces all magic damage taken by 50% for 30 seconds. A Priest must Dispel Magic or a Shaman must Purge this off the boss immediately!`,
          icon: debuff?.icon,
          interval: event.interval,
        });
      } else if (event.type === 'hand_of_ragnaros') {
        const debuff = DEBUFFS['hand_of_ragnaros'];
        abilities.push({
          name: 'Hand of Ragnaros',
          type: 'fire',
          description: `Sulfuron slams the ground, dealing ${event.damage} fire damage to all tanks and melee DPS (Warriors, Rogues, Feral Druids, Ret Paladins, Enh Shamans) and stunning them for 2 seconds. Stunned players deal no damage!`,
          icon: debuff?.icon,
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'inspire') {
        abilities.push({
          name: 'Inspire',
          type: 'enrage',
          description: `Sulfuron rallies the Flamewaker Priests, increasing their damage by 25% for 10 seconds. Tanks will take significantly more damage during this window!`,
          icon: '/icons/ability_warrior_battleshout.jpg',
          interval: event.interval,
        });
      } else if (event.type === 'dark_mending') {
        abilities.push({
          name: 'Dark Mending',
          type: 'shadow',
          description: `A Flamewaker Priest attempts to heal another priest for 15% of their health. AI DPS have a 70% chance to interrupt. If the heal goes through, the fight lasts longer!`,
          icon: '/icons/spell_shadow_chilltouch.jpg',
          interval: event.interval,
        });
      } else if (event.type === 'sulfuron_immolate') {
        const debuff = DEBUFFS['immolate'];
        abilities.push({
          name: 'Immolate',
          type: 'fire',
          description: `A Flamewaker Priest hurls fire at a random raid member, dealing 750-850 fire damage instantly and an additional 380-420 fire damage over 3 seconds. The DoT is dispellable.`,
          icon: debuff?.icon,
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'golemagg_magma_splash') {
        const debuff = DEBUFFS['magma_splash'];
        abilities.push({
          name: 'Magma Splash',
          type: 'fire',
          description: `Applies a stacking fire DoT on the current Golemagg tank. Each stack deals 150 fire damage every 2 seconds. Tanks should swap at 4-5 stacks, but sometimes forget and swap at 7 stacks instead! NOT dispellable.`,
          icon: debuff?.icon,
          interval: event.interval,
        });
      } else if (event.type === 'golemagg_pyroblast') {
        const debuff = DEBUFFS['golemagg_pyroblast'];
        abilities.push({
          name: 'Pyroblast',
          type: 'fire',
          description: `Hurls a massive fireball at a random raid member, dealing 1388-1612 fire damage instantly and applying a DoT that deals 200 fire damage every 3 seconds for 12 seconds. The DoT is dispellable!`,
          icon: debuff?.icon,
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'golemagg_earthquake') {
        abilities.push({
          name: 'Earthquake',
          type: 'physical',
          description: `At 10% health, Golemagg causes Earthquakes that hit all melee players (tanks, Warriors, Rogues, Feral/Ret/Enh) for 1388-1612 damage every 3 seconds. Intense healing phase!`,
          icon: '/icons/spell_nature_earthquake.jpg',
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'core_rager_mangle') {
        const debuff = DEBUFFS['mangle'];
        abilities.push({
          name: 'Mangle',
          type: 'physical',
          description: `The Core Ragers savage the dog tank with Mangle, dealing 300 physical damage every 2 seconds for 20 seconds. NOT dispellable - constant pressure on the dog tank!`,
          icon: debuff?.icon,
          interval: event.interval,
        });
      } else if (event.type === 'core_rager_melee') {
        abilities.push({
          name: 'Core Rager Melee',
          type: 'physical',
          description: `Two Core Ragers attack the dog tank simultaneously, dealing ${event.damage * 2} total physical damage every 2 seconds.`,
          damage: event.damage * 2,
          interval: event.interval,
        });
      } else if (event.type === 'majordomo_teleport') {
        const debuff = DEBUFFS['majordomo_teleport'];
        abilities.push({
          name: 'Teleport',
          type: 'fire',
          description: `Majordomo teleports his tank to the fire pit, dealing ${debuff?.damagePerTick || 500} fire damage per second until they escape. The tank must move out quickly!`,
          icon: debuff?.icon,
          interval: event.interval,
        });
      } else if (event.type === 'majordomo_elite_melee') {
        abilities.push({
          name: 'Elite Melee',
          type: 'physical',
          description: `4 Flamewaker Elites pummel their assigned tanks. Each tank handles 2 adds and takes ${event.damage * 2} physical damage every ${event.interval} seconds.`,
          damage: event.damage * 2,
          interval: event.interval,
        });
      } else if (event.type === 'majordomo_fire_blast') {
        const debuff = DEBUFFS['majordomo_fire_blast'];
        abilities.push({
          name: 'Fire Blast',
          type: 'fire',
          description: `Flamewaker Elites fire blast the raid, dealing 700-800 fire damage to 3-5 random targets. The burn effect ticks for 300 fire damage over time.`,
          icon: debuff?.icon,
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'majordomo_shadow_shock') {
        const debuff = DEBUFFS['majordomo_shadow_shock'];
        abilities.push({
          name: 'Shadow Shock',
          type: 'shadow',
          description: `Flamewaker Healers shock random raid members with shadow damage, dealing 950-1050 shadow damage to 2-4 targets.`,
          icon: debuff?.icon,
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'majordomo_shadow_bolt') {
        abilities.push({
          name: 'Shadow Bolt',
          type: 'shadow',
          description: `Flamewaker Healers hurl shadow bolts at random raid members, dealing 1100-1200 shadow damage.`,
          icon: '/icons/spell_shadow_shadowbolt.jpg',
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'majordomo_fireball') {
        abilities.push({
          name: 'Fireball',
          type: 'fire',
          description: `Flamewaker Elites cast fireballs at random raid members, dealing 950-1050 fire damage.`,
          icon: '/icons/spell_fire_flamebolt.jpg',
          damage: event.damage,
          interval: event.interval,
        });
      } else if (event.type === 'majordomo_dark_mending') {
        abilities.push({
          name: 'Dark Mending',
          type: 'shadow',
          description: `A Flamewaker Healer attempts to heal an add for 15% of their health. AI DPS have a 70% chance to interrupt. If the heal goes through, the fight lasts longer!`,
          icon: '/icons/spell_shadow_chilltouch.jpg',
          interval: event.interval,
        });
      } else if (event.type === 'majordomo_magic_reflection') {
        abilities.push({
          name: 'Magic Reflection',
          type: 'arcane',
          description: `All 8 adds gain a Magic Reflection shield for 10 seconds. DPS must STOP attacking or take reflected damage! Health bars turn blue during this phase. 1-2 DPS always forget and hurt themselves.`,
          icon: '/icons/spell_frost_frostshock.jpg',
          interval: event.interval,
        });
      }
    });

    // Add Eruption ability for Garr (triggered by phase transitions, not damage events)
    if (boss.id === 'garr') {
      const eruptionDebuff = DEBUFFS['eruption'];
      abilities.push({
        name: 'Eruption',
        type: 'fire',
        description: 'Each Firesworn add explodes when killed, dealing 500-800 fire damage to the entire raid. Kill all 8 adds before focusing Garr.',
        icon: eruptionDebuff?.icon,
        interval: 0, // Not interval-based, triggered on add death
      });
    }

    // Add Core Ragers and Tank Swap info for Golemagg
    if (boss.id === 'golemagg') {
      abilities.unshift({
        name: '3-Tank Fight',
        type: 'physical',
        description: 'This fight requires 3 tanks! Before the fight starts, assign 2 tanks for Golemagg (who will swap) and 1 tank for the Core Ragers (2 dogs). A DPS Warrior can serve as the dog tank.',
        icon: '/icons/ability_warrior_defensivestance.jpg',
        interval: 0,
      });
    }

    // Add Flamewaker Priests info for Sulfuron
    if (boss.id === 'sulfuron') {
      // Add a special "Phase" ability to explain the fight structure
      abilities.unshift({
        name: 'Flamewaker Priests',
        type: 'physical',
        description: '4 Flamewaker Priests accompany Sulfuron. All priests must be killed before Sulfuron becomes attackable. DPS cleaves all priests simultaneously.',
        icon: '/icons/spell_holy_prayerofhealing.jpg',
        interval: 0,
      });
    }

    // Add Majordomo fight structure info
    if (boss.id === 'majordomo') {
      abilities.unshift({
        name: '5-Tank Add Fight',
        type: 'physical',
        description: 'Majordomo is immune to damage! Kill all 8 adds (4 Elites, 4 Healers) to win. Assign 1 tank for Majordomo, and 4 tanks for adds (each tanks 2 adds). Warriors and Feral Druids can serve as add tanks.',
        icon: '/icons/ability_warrior_defensivestance.jpg',
        interval: 0,
      });
    }

    // Add Ragnaros fight structure info
    if (boss.id === 'ragnaros') {
      abilities.unshift({
        name: '2-Tank Swap Fight',
        type: 'physical',
        description: 'Ragnaros requires 2 tanks that swap when Wrath of Ragnaros is cast. After 3 minutes, Ragnaros submerges and 8 Sons of Flame spawn. Kill all Sons within 90 seconds or Ragnaros re-emerges with Sons still alive!',
        icon: '/icons/ability_warrior_defensivestance.jpg',
        interval: 0,
      });
      abilities.push({
        name: 'Wrath of Ragnaros',
        type: 'fire',
        description: 'Knocks back the current tank and applies a debuff. Forces an immediate tank swap. The off-tank must taunt immediately!',
        icon: '/icons/spell_fire_soulburn.jpg',
        interval: 25,
      });
      abilities.push({
        name: 'Elemental Fire',
        type: 'fire',
        description: 'Applies a fire DoT to the current tank dealing 300 fire damage per second for 8 seconds. Keep tanks topped off!',
        icon: '/icons/spell_fire_flametounge.jpg',
        interval: 10,
      });
      abilities.push({
        name: 'Lava Burst',
        type: 'fire',
        description: 'Hits a random ranged player for 800 fire damage and splashes nearby players in the same group for 50% damage. Applies a burning DoT.',
        icon: '/icons/spell_fire_volcano.jpg',
        interval: 12,
      });
      abilities.push({
        name: 'Magma Blast',
        type: 'fire',
        description: 'WIPE MECHANIC! If both tanks are dead, Ragnaros casts Magma Blast on the entire raid for 4000 fire damage every 3 seconds!',
        icon: '/icons/spell_fire_flameshock.jpg',
        interval: 3,
      });
      abilities.push({
        name: 'Submerge Phase',
        type: 'physical',
        description: 'At 3 minutes, Ragnaros submerges and 8 Sons of Flame spawn. They attack random raid members. Kill all Sons within 90 seconds or face Ragnaros + remaining Sons!',
        icon: '/icons/spell_fire_elemental_totem.jpg',
        interval: 180,
      });
    }

    return abilities;
  };

  const getDebuffDescription = (debuff: typeof DEBUFFS[string]) => {
    let desc = '';
    // Check for special effects first
    if (debuff.healingReduction) {
      desc = `Reduces ALL healing received by ${Math.round(debuff.healingReduction * 100)}% for ${debuff.maxDuration} seconds. Must be decursed!`;
    } else if (debuff.damagePerTick && debuff.tickInterval) {
      desc = `Deals ${debuff.damagePerTick} ${debuff.type} damage every ${debuff.tickInterval} seconds for ${debuff.maxDuration} seconds.`;
    } else if (debuff.damagePerTick && debuff.maxDuration === debuff.tickInterval) {
      desc = `Explodes for ${debuff.damagePerTick} damage after ${debuff.maxDuration} seconds if not dispelled.`;
    } else {
      desc = `Lasts ${debuff.maxDuration} seconds. ${debuff.type === 'curse' ? 'Requires Decurse to remove.' : 'Can be Cleansed.'}`;
    }
    return desc;
  };

  // Format aura effect for display
  const formatAuraEffect = (effect: BuffEffect): string => {
    const parts: string[] = [];
    // Stat bonuses
    if (effect.armorBonus) parts.push(`+${effect.armorBonus} Armor`);
    if (effect.strengthBonus) parts.push(`+${effect.strengthBonus} Strength`);
    if (effect.agilityBonus) parts.push(`+${effect.agilityBonus} Agility`);
    if (effect.staminaBonus) parts.push(`+${effect.staminaBonus} Stamina`);
    if (effect.intellectBonus) parts.push(`+${effect.intellectBonus} Intellect`);
    if (effect.spiritBonus) parts.push(`+${effect.spiritBonus} Spirit`);
    // Resistances
    if (effect.fireResistance) parts.push(`+${effect.fireResistance} Fire Resist`);
    if (effect.frostResistance) parts.push(`+${effect.frostResistance} Frost Resist`);
    if (effect.shadowResistance) parts.push(`+${effect.shadowResistance} Shadow Resist`);
    if (effect.natureResistance) parts.push(`+${effect.natureResistance} Nature Resist`);
    if (effect.arcaneResistance) parts.push(`+${effect.arcaneResistance} Arcane Resist`);
    // Combat bonuses
    if (effect.spellCritBonus) parts.push(`+${effect.spellCritBonus}% Spell Crit`);
    if (effect.meleeCritBonus) parts.push(`+${effect.meleeCritBonus}% Melee Crit`);
    if (effect.attackPowerBonus) parts.push(`+${effect.attackPowerBonus} Attack Power`);
    if (effect.healingPower) parts.push(`+${effect.healingPower} Healing`);
    // Mana/healing regen
    if (effect.manaRegenBonus) parts.push(`+${effect.manaRegenBonus} Mana per tick`);
    if (effect.healingReceivedBonus) parts.push(`+${effect.healingReceivedBonus} HP per tick`);
    // Threat
    if (effect.threatReduction) parts.push(`-${effect.threatReduction}% Threat`);
    // Immunities and cleansing
    if (effect.fearImmunity) parts.push('Removes Fear/Charm/Sleep');
    if (effect.cleansesPoison) parts.push('Removes Poison');
    if (effect.cleansesDisease) parts.push('Removes Disease');
    return parts.join(', ') || 'Party buff';
  };

  // Show landing page if not yet started game
  if (showLandingPage) {
    return (
      <>
        <LandingPage
          onStartGame={handleStartGame}
          savedCharacters={savedCharacters}
          currentUser={currentUser}
          authLoading={authLoading}
          onShowPatchNotes={handleOpenPatchNotes}
          hasNewPatchNotes={!hasSeenPatchNotes}
          onDeleteCharacter={handleDeleteCharacter}
        />
        {/* Patch Notes Modal - also accessible from landing page */}
        {showPatchNotes && (
          <div className="modal-overlay" onClick={() => setShowPatchNotes(false)}>
            <div className="patch-notes-modal" onClick={e => e.stopPropagation()}>
              <button className="close-inspection" onClick={() => setShowPatchNotes(false)}>X</button>
              <div className="patch-notes-header">
                <h2>Patch Notes</h2>
              </div>
              <div className="patch-notes-content">
                <div className="patch-version">
                  <h3>Version 0.28.0 - Ragnaros Pre-Fight RP</h3>
                  <span className="patch-date">December 3, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Ragnaros Pre-Fight RP</h4>
                  <ul>
                    <li><strong>Cinematic Intro</strong>: Experience the iconic Majordomo Executus and Ragnaros dialogue before the fight begins</li>
                    <li><strong>Voice Acting</strong>: Full voice lines synced with subtitles for an immersive experience</li>
                    <li><strong>Skippable</strong>: Press "Skip RP" if you want to jump straight into the action</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.27.0 - Raid Leader Mode</h3>
                  <span className="patch-date">December 3, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Raid Leader Mode</h4>
                  <ul>
                    <li><strong>You ARE the Raid Leader</strong>: Manage your entire 40-man raid's gear progression, not just your own character</li>
                    <li><strong>Loot Council Simulation</strong>: Assign loot drops to any raid member based on need, performance, or attendance</li>
                    <li><strong>Full Raid Gearing</strong>: Every AI raid member has their own persistent gear that you control</li>
                    <li><strong>Strategic Decisions</strong>: Balance gearing your healers, tanks, and DPS to optimize raid performance</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Armor Type Proficiency</h4>
                  <ul>
                    <li><strong>Class-Based Restrictions</strong>: Items now respect armor type proficiency - plate wearers can equip plate, mail, leather, and cloth</li>
                    <li><strong>Proper Loot Distribution</strong>: Healers can now roll on and receive leather/cloth healing gear if their class can wear it</li>
                    <li><strong>231 Items Updated</strong>: All armor items now have proper armor types assigned</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Tier Set Class Lock</h4>
                  <ul>
                    <li><strong>Class-Specific Tier</strong>: Tier set items are now locked to their designated class only</li>
                    <li><strong>No Cross-Class Tier</strong>: Warlock tier can't go to mages, priest tier can't go to warlocks, etc.</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Weapon Slot Choice</h4>
                  <ul>
                    <li><strong>Dual-Wield Support</strong>: When assigning a 1H weapon to a dual-wielder, choose which slot to replace</li>
                    <li><strong>Visual Preview</strong>: See your current Main Hand and Off Hand items before deciding</li>
                    <li><strong>Works for All Dual-Wielders</strong>: Warriors, rogues, and enhancement shamans all supported</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.26.0 - Bench System Added</h3>
                  <span className="patch-date">December 3, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Bench System</h4>
                  <ul>
                    <li><strong>Swap Raiders for Bench Players</strong>: Add new classes or specs to your raid for boss encounters that require specific compositions</li>
                    <li><strong>Persistent Gear</strong>: Bench players keep their own gear that persists between swaps</li>
                    <li><strong>5/10 Bench Slots</strong>: 5 bench slots for 20-man raids, 10 for 40-man raids</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Bench Tab Layout</h4>
                  <ul>
                    <li><strong>Two-Panel Design</strong>: Compact raid groups on the left, dedicated bench area on the right</li>
                    <li><strong>Vertical Groups</strong>: All 8 groups visible at once (4 columns x 2 rows for 40-man raids)</li>
                    <li><strong>Clean View</strong>: Shows just names and specs for easy roster management</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Drag & Drop</h4>
                  <ul>
                    <li><strong>Precise Targeting</strong>: Drag bench players directly onto specific raid members to swap</li>
                    <li><strong>Empty Slot Support</strong>: Drag bench players to empty group slots to add without swapping</li>
                    <li><strong>Visual Feedback</strong>: Green highlight shows exactly who you're about to swap with</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Click-to-Swap</h4>
                  <ul>
                    <li><strong>Both Directions</strong>: Click a bench player then a raider, OR click a raider then a bench player</li>
                    <li><strong>Color-Coded Selection</strong>: Blue for selected bench players, orange for selected raiders</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.25.0 - Molten Core Boss Overhaul</h3>
                  <span className="patch-date">December 3, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Ragnaros - The Firelord</h4>
                  <ul>
                    <li><strong>2-Tank Swap Mechanic</strong>: Wrath of Ragnaros knocks back the current tank, forcing a tank swap</li>
                    <li><strong>Elemental Fire</strong>: Fire DoT on the tank dealing 300 damage per second</li>
                    <li><strong>Lava Burst</strong>: Random ranged target takes splash damage that hits nearby players</li>
                    <li><strong>Magma Blast</strong>: If both tanks die, Ragnaros wipes the raid</li>
                    <li><strong>Submerge Phase</strong>: At 3 minutes, Ragnaros submerges and spawns 8 Sons of Flame</li>
                    <li><strong>Sons of Flame</strong>: Must be killed within 90 seconds or Ragnaros re-emerges with them still alive</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Majordomo Executus</h4>
                  <ul>
                    <li><strong>5-Tank Add Fight</strong>: Majordomo is immune - kill all 8 adds (4 Flamewaker Healers + 4 Elites) to win</li>
                    <li><strong>Magic Reflection</strong>: Adds periodically reflect spells - stop DPS or take massive damage!</li>
                    <li><strong>Teleport</strong>: Main tank gets teleported into the fire pit and takes DoT damage</li>
                    <li><strong>Blast Wave</strong>: Healers channel AoE that damages nearby raid members</li>
                    <li><strong>Dark Mending</strong>: Healer adds heal themselves and each other</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Sulfuron Harbinger</h4>
                  <ul>
                    <li><strong>Flamewaker Priests</strong>: 4 priest adds that must die first before Sulfuron becomes vulnerable</li>
                    <li><strong>Inspire</strong>: Priests buff Sulfuron with increased damage while alive</li>
                    <li><strong>Dark Mending</strong>: Priests heal each other, making kill order important</li>
                    <li><strong>Shadow Word: Pain</strong>: DoT on random raid members</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Golemagg the Incinerator</h4>
                  <ul>
                    <li><strong>3-Tank Fight</strong>: 2 tanks swap on Golemagg, 1 tank handles both Core Ragers</li>
                    <li><strong>Magma Splash</strong>: Stacking debuff on tank - must swap at high stacks</li>
                    <li><strong>Core Ragers</strong>: Enrage at low health and heal if not killed quickly</li>
                    <li><strong>Pyroblast</strong>: Random raid damage when Golemagg reaches low health</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Other Boss Updates</h4>
                  <ul>
                    <li><strong>Shazzrah</strong>: Arcane Explosion, Blink, Magic Grounding (absorbs spells)</li>
                    <li><strong>Baron Geddon</strong>: Living Bomb mechanic - drag bombed players to Safe Zone!</li>
                    <li><strong>Garr</strong>: 8 Firesworn adds that explode on death</li>
                    <li><strong>Gehennas</strong>: Rain of Fire and Gehennas' Curse (75% healing reduction)</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Quality of Life</h4>
                  <ul>
                    <li><strong>Tank Assignment Modals</strong>: Assign specific tanks to each role before boss fights</li>
                    <li><strong>Tank Swap Alerts</strong>: On-screen warnings when tank swaps are needed</li>
                    <li><strong>Encounter Journal</strong>: View boss abilities and mechanics before pulling</li>
                    <li><strong>Combat Log Polish</strong>: All numbers now display as clean integers (no decimals)</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.24.0 - Loot & UI Polish</h3>
                  <span className="patch-date">December 2, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Pre-Raid BiS Starting Gear</h4>
                  <ul>
                    <li><strong>New Characters</strong>: Players now start with full pre-raid Best in Slot gear for their class/spec</li>
                    <li><strong>Ready to Raid</strong>: Jump straight into Molten Core without grinding dungeons first</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Loot Table Updates</h4>
                  <ul>
                    <li><strong>Molten Core</strong>: Added 5 missing items (Deep Earth Spaulders, Wristguards of True Flight, Core Forged Greaves, Helm of the Lifegiver, Shard of the Flame)</li>
                    <li><strong>Blackwing Lair</strong>: Added 4 missing items (Draconic Avenger, Draconic Maul, Doom's Edge, Band of Dark Dominion)</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>UI Improvements</h4>
                  <ul>
                    <li><strong>Styled Confirmation Dialogs</strong>: Native browser popups replaced with WoW-themed confirmation dialogs</li>
                    <li><strong>Warning Highlights</strong>: Destructive actions now show clear yellow warning boxes</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.23.0 - Enchanting & Gear Inspection</h3>
                  <span className="patch-date">December 1, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Enchanting System</h4>
                  <ul>
                    <li><strong>Buy Enchants</strong>: New Auction House to purchase enchants for your gear</li>
                    <li><strong>Nexus Crystal Currency</strong>: Use Nexus Crystals from disenchanting to buy enchants</li>
                    <li><strong>Apply to Gear</strong>: Enchant your weapons, chest, gloves, and more for bonus stats</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Quest Rewards</h4>
                  <ul>
                    <li><strong>Boss Quest Items</strong>: Defeat bosses to receive quest items like the Head of Onyxia</li>
                    <li><strong>Turn In for Rewards</strong>: Exchange quest items for powerful gear rewards</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Gear Inspection Redesign</h4>
                  <ul>
                    <li><strong>Two-Column Layout</strong>: Wider inspection panel with equipment list and item details side-by-side</li>
                    <li><strong>Clickable Items</strong>: Click any equipment slot to see full stat breakdown</li>
                    <li><strong>Enchant Display</strong>: Enchants now show their full stats in green text</li>
                    <li><strong>Accurate Bonus HPS</strong>: Now calculates actual healing power from gear + enchants instead of just gear score</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Authentic WoW Classic Icons</h4>
                  <ul>
                    <li><strong>100+ Icon Updates</strong>: All item icons now use their correct authentic WoW Classic icons</li>
                    <li><strong>Tier Sets</strong>: T1 and T2 armor sets now display proper icons</li>
                    <li><strong>Raid Loot</strong>: MC, Onyxia, and BWL weapons, armor, and accessories corrected</li>
                    <li><strong>Relics & Trinkets</strong>: Librams, Totems, Idols, and class trinkets fixed</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.22.0 - Disenchanting & Smart Loot</h3>
                  <span className="patch-date">December 1, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Disenchanting System</h4>
                  <ul>
                    <li><strong>Disenchant All</strong>: New button in your Equipment Bag to disenchant all items at once</li>
                    <li><strong>Right-Click Disenchant</strong>: Right-click individual items to disenchant them into Nexus Crystals</li>
                    <li><strong>Materials Bag</strong>: New tab in your bags to view enchanting materials like Nexus Crystals</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Smart Loot Distribution</h4>
                  <ul>
                    <li><strong>Upgrade Checks</strong>: AI raid members only equip items that are actual upgrades (higher item level)</li>
                    <li><strong>Pass to Player</strong>: Items no AI player needs now go to your bag instead of being lost</li>
                    <li><strong>Quest Reward Limits</strong>: AI raid members can no longer claim the same quest reward multiple times</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Loot Table Overhaul</h4>
                  <ul>
                    <li><strong>Accurate Boss Loot</strong>: All Molten Core and Onyxia loot tables sanitized to match authentic Classic drops</li>
                    <li><strong>Correct Item Levels</strong>: Fixed item levels across all raid gear to reflect proper tier progression</li>
                    <li><strong>Class-Appropriate Stats</strong>: Removed incorrect stats from items (e.g., spell power on warrior gear)</li>
                    <li><strong>Missing Items Added</strong>: Added missing tier pieces and boss-specific drops</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Cloud Save Improvements</h4>
                  <ul>
                    <li><strong>More Frequent Saves</strong>: Cloud saves now trigger on quest turn-ins, legendary crafting, loot distribution, and disenchanting</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.21.0 - Quality of Life & Fixes</h3>
                  <span className="patch-date">December 1, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Buff All Button</h4>
                  <ul>
                    <li><strong>One-Click Buffs</strong>: Buff All now applies raid buffs, consumables, AND world buffs</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Bug Fixes</h4>
                  <ul>
                    <li><strong>Paladin Auras</strong>: Auras now correctly affect only your party, not the entire raid (authentic Classic behavior)</li>
                    <li><strong>Cloud Save Duplicates</strong>: Fixed saves creating duplicates when using Save button</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.20.0 - GCD Animation & Polish</h3>
                  <span className="patch-date">November 30, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Action Bar Improvements</h4>
                  <ul>
                    <li><strong>Cooldown Sweep Animation</strong>: WoW-style clockwise sweep animation on spell icons during cooldowns</li>
                    <li><strong>GCD Visual Feedback</strong>: Global Cooldown now shows a sweep animation on all affected spells</li>
                    <li><strong>GCD Timing Fix</strong>: Global Cooldown now starts when you begin casting, not when the cast finishes (authentic WoW behavior)</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Cloud Saves</h4>
                  <ul>
                    <li><strong>Save on Creation</strong>: New characters are now saved to the cloud immediately when logged in</li>
                    <li><strong>Multiple Characters</strong>: Character selection now properly shows all your saved characters</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Code Cleanup</h4>
                  <ul>
                    <li>Removed unused duplicate code files for improved maintainability</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.19.0 - Mouseover Healing & Cloud Saves</h3>
                  <span className="patch-date">November 30, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Mouseover Healing</h4>
                  <ul>
                    <li><strong>Mouseover Mode</strong>: Toggle between click-target and mouseover healing in Settings → Keybinds</li>
                    <li><strong>Hover to Heal</strong>: In mouseover mode, spells target whoever your mouse is over - no clicking required</li>
                    <li><strong>Visual Indicator</strong>: Cyan glow shows your current mouseover target</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>AI Healer Improvements</h4>
                  <ul>
                    <li><strong>Dispel Priority</strong>: AI healers now wait 2.5 seconds before dispelling, giving you time to react first</li>
                    <li><strong>Dispel Tracking</strong>: AI healer dispels now show up in the Dispels meter</li>
                  </ul>
                </div>

                <div className="patch-section">
                  <h4>Cloud Save Improvements</h4>
                  <ul>
                    <li><strong>Auto-Save</strong>: Game automatically saves to cloud after defeating a boss and closing loot</li>
                    <li><strong>Character Name Fix</strong>: Your character name now loads correctly from cloud saves</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.18.0 - Landing Page Update</h3>
                  <span className="patch-date">November 30, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>New Landing Page</h4>
                  <ul>
                    <li><strong>Character Creation</strong>: Choose your faction, class, and name your character before entering the game</li>
                    <li><strong>Continue Button</strong>: Returning players can jump right back in with one click</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.17.0 - Living Bomb Mechanic Update</h3>
                  <span className="patch-date">November 29, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Living Bomb Safe Zone</h4>
                  <ul>
                    <li><strong>Drag to Safety</strong>: When a raid member gets Living Bomb, drag them to the Safe Zone to prevent splash damage</li>
                    <li><strong>Raid Warning</strong>: Large on-screen warning with airhorn sound when Living Bomb is applied</li>
                    <li><strong>Auto Return</strong>: Bombed players automatically return to their position after the bomb explodes</li>
                  </ul>
                </div>

                <div className="patch-version previous">
                  <h3>Version 0.16.0 - Cloud Saves Update</h3>
                  <span className="patch-date">November 29, 2025</span>
                </div>

                <div className="patch-section">
                  <h4>Cloud Saves</h4>
                  <ul>
                    <li><strong>Google & Apple Sign-In</strong>: Log in to sync progress across devices</li>
                    <li><strong>Automatic Cloud Sync</strong>: Save/Load automatically uses cloud storage when logged in</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="app">
      <div className="background-overlay" />

      <header className="app-header">
        <div className="title-container">
          <h1>Classic WoW Raid Simulator</h1>
        </div>
        <span className="subtitle">Classic Era - Vanilla Only</span>
      </header>

      {/* Multiplayer Lobby Modal */}
      {showMultiplayerLobby && (
        <MultiplayerLobby
          onStartGame={handleMultiplayerStart}
          onCancel={handleLeaveMultiplayer}
          initialPlayerName={state.playerName}
          hostEquipment={state.playerEquipment}
        />
      )}

      {/* Raid Setup Modal */}
      <RaidSetupModal
        isOpen={showRaidSetup}
        onClose={() => setShowRaidSetup(false)}
        faction={state.faction}
        onFactionChange={(newFaction) => engine.switchFaction(newFaction)}
        raidSize={state.raid.length}
        onRaidSizeChange={(size) => engine.resetRaid(size as 20 | 40)}
        canChangeRaidSize={state.defeatedBosses.length === 0}
        aiHealersEnabled={state.otherHealersEnabled}
        aiHealerCount={state.raid.filter(m => m.role === 'healer').length}
        onAiHealersToggle={() => engine.toggleOtherHealers()}
        onResetLockout={() => engine.resetRaidLockout()}
        canResetLockout={state.defeatedBosses.length > 0}
        isEncounterRunning={state.isRunning}
      />

      {/* DESKTOP UI */}
      {!isMobileMode && (
      <>
      <main className="app-main">
        {/* Left Panel - Player, Boss, Raid */}
        <div className="left-panel">
          {/* Player Frame - Different for Raid Leader Mode */}
          {state.isRaidLeaderMode ? (
            <div className="player-frame raid-leader-frame">
              <div className="player-portrait">
                <img
                  src="/icons/classic_temp.jpg"
                  alt="Raid Leader"
                  className="player-class-icon"
                />
              </div>
              <div className="player-info">
                <div className="player-title">
                  <span className="player-name-editable" style={{ color: '#ffd700' }}>
                    {state.playerName}
                  </span>
                  <span className="player-class" style={{ color: '#ffd700' }}>
                    Raid Leader
                  </span>
                </div>
                <div className="raid-leader-status">
                  <span className="raid-leader-badge">Raid Leader Mode</span>
                </div>
              </div>
              {/* Utility buttons for Raid Leader Mode */}
              {!state.isRunning && (
                <div className="player-utility-icons raid-leader-utility">
                  <div
                    className={`utility-mini-btn has-tooltip ${state.legendaryMaterials.length > 0 ? 'has-items' : ''}`}
                    onClick={() => setShowInventory(true)}
                  >
                    <span className="icon-tooltip">Bags (B)</span>
                    <img src="/icons/inv_misc_bag_08.jpg" alt="Bags" />
                    <span className="keybind-text">B</span>
                    {state.legendaryMaterials.length > 0 && (
                      <span className="mini-badge">{state.legendaryMaterials.length}</span>
                    )}
                  </div>
                  <div
                    className={`utility-mini-btn has-tooltip ${state.materialsBag.nexus_crystal > 0 ? 'has-crystals' : ''}`}
                    onClick={() => engine.openAuctionHouse()}
                  >
                    <span className="icon-tooltip">Auction House</span>
                    <img src="/icons/inv_misc_coin_01.jpg" alt="Enchants" />
                    {state.materialsBag.nexus_crystal > 0 && (
                      <span className="mini-badge crystal">{state.materialsBag.nexus_crystal}</span>
                    )}
                  </div>
                  <div
                    className="utility-mini-btn has-tooltip"
                    onClick={() => setShowRaidGroupManager(true)}
                  >
                    <span className="icon-tooltip">Manage Raid</span>
                    <img src="/icons/achievement_guildperk_everybodysfriend.jpg" alt="Raid" />
                  </div>
                  <div className="utility-icon-separator" />
                  <div
                    className="utility-mini-btn has-tooltip"
                    onClick={() => setShowSaveModal(true)}
                  >
                    <span className="icon-tooltip">Save</span>
                    <img src="/icons/inv_misc_note_01.jpg" alt="Save" />
                  </div>
                  <div
                    className="utility-mini-btn has-tooltip"
                    onClick={() => setShowLoadModal(true)}
                  >
                    <span className="icon-tooltip">Load</span>
                    <img src="/icons/inv_misc_book_09.jpg" alt="Load" />
                  </div>
                  <div
                    className="utility-mini-btn has-tooltip"
                    onClick={() => setShowSettings(true)}
                  >
                    <span className="icon-tooltip">Settings</span>
                    <img src="/icons/trade_engineering.jpg" alt="Settings" />
                  </div>
                  <div
                    className="utility-mini-btn has-tooltip"
                    onClick={() => {
                      setSelectedAdminMemberId(state.playerId);
                      setShowAdminPanel(true);
                    }}
                  >
                    <span className="icon-tooltip">Admin</span>
                    <img src="/icons/inv_misc_key_03.jpg" alt="Admin" />
                  </div>
                  <div
                    className={`utility-mini-btn has-tooltip ${currentUser ? 'logged-in' : ''}`}
                    onClick={() => setShowAuthModal(true)}
                  >
                    <span className="icon-tooltip">{currentUser ? currentUser.email?.split('@')[0] || 'Account' : 'Sign In'}</span>
                    <img src="/icons/inv_misc_head_human_01.jpg" alt="Account" />
                    {currentUser && <span className="logged-in-indicator">✓</span>}
                  </div>
                </div>
              )}
            </div>
          ) : (
          <div className={`player-frame ${(state.playerMana / state.maxMana) < 0.20 ? 'low-mana' : ''}`}>
            <div className="player-portrait">
              <img
                src={state.playerClass === 'shaman'
                  ? "/icons/spell_nature_magicimmunity.jpg"
                  : "/icons/spell_holy_holybolt.jpg"}
                alt={state.playerClass === 'shaman' ? "Restoration Shaman" : "Holy Paladin"}
                className="player-class-icon"
              />
            </div>
            <div className="player-info">
              <div className="player-title">
                {isEditingName ? (
                  <input
                    type="text"
                    className="player-name-input"
                    value={editingNameValue}
                    onChange={e => setEditingNameValue(e.target.value)}
                    onBlur={() => {
                      if (editingNameValue.trim()) {
                        engine.setPlayerName(editingNameValue.trim());
                      }
                      setIsEditingName(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (editingNameValue.trim()) {
                          engine.setPlayerName(editingNameValue.trim());
                        }
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                    maxLength={12}
                  />
                ) : (
                  <span
                    className="player-name-editable"
                    onClick={() => {
                      if (!state.isRunning) {
                        setEditingNameValue(state.playerName);
                        setIsEditingName(true);
                      }
                    }}
                    title={!state.isRunning ? "Click to rename" : ""}
                    style={{ color: CLASS_COLORS[state.playerClass] }}
                  >
                    {state.playerName}
                  </span>
                )}
                <span className="player-class" style={{ color: CLASS_COLORS[state.playerClass] }}>
                  {state.playerClass === 'shaman' ? 'Restoration Shaman' : 'Holy Paladin'}
                </span>
                {state.playerClass === 'paladin' && state.divineFavorActive && <span className="divine-favor-active">Divine Favor!</span>}
                {state.playerClass === 'shaman' && state.naturesSwiftnessActive && <span className="divine-favor-active">Nature&apos;s Swiftness!</span>}
              </div>
              <div className="mana-bar-container">
                <div
                  className={`mana-bar ${
                    (state.playerMana / state.maxMana) < 0.15 ? 'critical' :
                    (state.playerMana / state.maxMana) < 0.30 ? 'warning' : ''
                  }`}
                  style={{ width: `${(state.playerMana / state.maxMana) * 100}%` }}
                />
                <div className="mana-text">
                  {Math.floor(state.playerMana)} / {state.maxMana}
                </div>
              </div>
              <div className="player-stats">
                <span>+{state.spellPower} SP</span>
                <span>{state.critChance.toFixed(1)}% Crit</span>
                <span>{Math.floor(engine.computePlayerStats().totalMp5)} MP5</span>
              </div>
              <div className="player-dkp-row">
                <div className="player-dkp">
                  <span className="dkp-label">DKP:</span>
                  <span className="dkp-value">{state.playerDKP.points}</span>
                </div>
                {!state.isRunning && (
                  <div className="player-utility-icons">
                    <div
                      className={`utility-mini-btn has-tooltip ${state.legendaryMaterials.length > 0 ? 'has-items' : ''}`}
                      onClick={() => setShowInventory(true)}
                    >
                      <span className="icon-tooltip">Bags (B)</span>
                      <img src="/icons/inv_misc_bag_08.jpg" alt="Bags" />
                      <span className="keybind-text">B</span>
                      {state.legendaryMaterials.length > 0 && (
                        <span className="mini-badge">{state.legendaryMaterials.length}</span>
                      )}
                    </div>
                    <div
                      className={`utility-mini-btn has-tooltip ${state.materialsBag.nexus_crystal > 0 ? 'has-crystals' : ''}`}
                      onClick={() => engine.openAuctionHouse()}
                    >
                      <span className="icon-tooltip">Auction House</span>
                      <img src="/icons/inv_misc_coin_01.jpg" alt="Enchants" />
                      {state.materialsBag.nexus_crystal > 0 && (
                        <span className="mini-badge crystal">{state.materialsBag.nexus_crystal}</span>
                      )}
                    </div>
                    <div
                      className="utility-mini-btn has-tooltip"
                      onClick={() => setShowRaidGroupManager(true)}
                    >
                      <span className="icon-tooltip">Manage Raid</span>
                      <img src="/icons/achievement_guildperk_everybodysfriend.jpg" alt="Raid" />
                    </div>
                    <div className="utility-icon-separator" />
                    <div
                      className="utility-mini-btn has-tooltip"
                      onClick={() => setShowSaveModal(true)}
                    >
                      <span className="icon-tooltip">Save</span>
                      <img src="/icons/inv_misc_note_01.jpg" alt="Save" />
                    </div>
                    <div
                      className="utility-mini-btn has-tooltip"
                      onClick={() => setShowLoadModal(true)}
                    >
                      <span className="icon-tooltip">Load</span>
                      <img src="/icons/inv_misc_book_09.jpg" alt="Load" />
                    </div>
                    <div
                      className="utility-mini-btn has-tooltip"
                      onClick={() => setShowSettings(true)}
                    >
                      <span className="icon-tooltip">Settings</span>
                      <img src="/icons/trade_engineering.jpg" alt="Settings" />
                    </div>
                    <div
                      className="utility-mini-btn has-tooltip"
                      onClick={() => {
                        setSelectedAdminMemberId(state.playerId);
                        setShowAdminPanel(true);
                      }}
                    >
                      <span className="icon-tooltip">Admin</span>
                      <img src="/icons/inv_misc_key_03.jpg" alt="Admin" />
                    </div>
                    <div
                      className={`utility-mini-btn has-tooltip ${currentUser ? 'logged-in' : ''}`}
                      onClick={() => setShowAuthModal(true)}
                    >
                      <span className="icon-tooltip">{currentUser ? currentUser.email?.split('@')[0] || 'Account' : 'Sign In'}</span>
                      <img src="/icons/inv_misc_head_human_01.jpg" alt="Account" />
                      {currentUser && <span className="logged-in-indicator">✓</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Cloud sync indicator */}
            {currentUser && cloudSyncStatus && (
              <div className={`cloud-sync-indicator ${cloudSyncStatus === 'saved' || cloudSyncStatus === 'loaded' ? 'synced' : cloudSyncStatus}`}>
                {cloudSyncStatus === 'syncing' && '☁️ Syncing...'}
                {cloudSyncStatus === 'saved' && '☁️ Saved'}
                {cloudSyncStatus === 'loaded' && '☁️ Loaded'}
                {cloudSyncStatus === 'error' && '☁️ Sync failed'}
              </div>
            )}

          </div>
          )}

          {/* Phase Transition Alert */}
          {phaseAlert && (
            <div className="phase-alert">
              {phaseAlert}
            </div>
          )}

          {/* Special Alert (Legendary unlocks, secret boss summons) */}
          {specialAlert && (
            <div className="special-alert">
              {specialAlert}
            </div>
          )}

          {/* Living Bomb Raid Warning */}
          {livingBombWarning && (
            <div className="living-bomb-warning">
              {livingBombWarning}
            </div>
          )}

          {/* Inferno Raid Warning (Baron Geddon - no airhorn) */}
          {infernoWarning && (
            <div className="inferno-warning">
              <div className="inferno-warning-text">{infernoWarning}</div>
            </div>
          )}

          {/* Mind Control Raid Warning (Lucifron - Dominate Mind) */}
          {mindControlWarning && (
            <div className="mind-control-warning">
              <div className="mind-control-warning-text">{mindControlWarning.mcPlayer} IS MIND CONTROLLED!</div>
              <div className="mind-control-warning-sub">Attacking {mindControlWarning.attackingPlayer}</div>
            </div>
          )}

          {/* Lava Bomb Raid Warning (Magmadar) */}
          {lavaBombWarning && (
            <div className="lava-bomb-warning">
              <div className="lava-bomb-warning-text">{lavaBombWarning}</div>
            </div>
          )}

          {/* Tank Swap Warning (Golemagg) */}
          {state.tankSwapWarning && (
            <div className={`tank-swap-warning tank-swap-${state.tankSwapWarning.type}`}>
              <div className="tank-swap-warning-text">{state.tankSwapWarning.message}</div>
            </div>
          )}

          {/* Airhorn sound for Living Bomb */}
          <audio ref={airhornRef} src="/airhorn.mp3" preload="auto" />

          {/* Boss Frame */}
          {state.boss && (
            <div className={`boss-frame ${state.boss.isFrenzied || state.boss.hasDeadenMagic || state.boss.isInspired ? 'frenzied' : ''}`}>
              <div className="boss-info">
                <div className="boss-name">
                  {state.boss.name}
                  {state.boss.isFrenzied && <span className="frenzy-indicator"> FRENZY!</span>}
                  {state.boss.hasDeadenMagic && <span className="frenzy-indicator"> DEADEN MAGIC!</span>}
                  {state.boss.isInspired && <span className="frenzy-indicator"> INSPIRED!</span>}
                  {state.boss.currentPhase && state.boss.currentPhase > 1 && state.boss.id !== 'sulfuron' && (
                    <span className="phase-indicator"> - Phase {state.boss.currentPhase}</span>
                  )}
                </div>

                {/* Sulfuron Multi-Add Health Bars */}
                {state.boss.id === 'sulfuron' && state.boss.adds && (
                  <div className="sulfuron-adds-container">
                    {/* Show all 4 priests */}
                    {state.boss.adds.map((add, index) => (
                      <div
                        key={add.id}
                        className={`add-health-bar ${!add.isAlive ? 'dead' : ''}`}
                      >
                        <span className="add-name">Priest {index + 1}</span>
                        <div className="add-health-bg">
                          <div
                            className="add-health-fill"
                            style={{ width: `${(add.currentHealth / add.maxHealth) * 100}%` }}
                          />
                        </div>
                        <span className="add-health-text">
                          {add.isAlive ? `${Math.round(add.currentHealth / 1000)}k` : 'DEAD'}
                        </span>
                      </div>
                    ))}

                    {/* Sulfuron's health bar - grayed out until priests dead */}
                    <div className={`sulfuron-main-health-bar ${state.boss.currentPhase === 1 ? 'inactive' : ''}`}>
                      <span className="add-name">Sulfuron</span>
                      <div className="add-health-bg">
                        <div
                          className="add-health-fill sulfuron-fill"
                          style={{ width: `${(state.boss.currentHealth / state.boss.maxHealth) * 100}%` }}
                        />
                      </div>
                      <span className="add-health-text">
                        {state.boss.currentPhase === 1 ? 'IMMUNE' : `${Math.round(state.boss.currentHealth / 1000)}k`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Majordomo Multi-Add Health Bars (8 adds) */}
                {state.boss.id === 'majordomo' && state.boss.adds && (
                  <div className="majordomo-adds-container">
                    {/* Show all 8 adds - 4 Elites then 4 Healers */}
                    {state.boss.adds.map((add) => {
                      const isElite = add.id.startsWith('elite');
                      const addNumber = parseInt(add.id.replace(/\D/g, ''));
                      const displayName = isElite ? `Elite ${addNumber}` : `Healer ${addNumber}`;
                      const isMagicReflectionActive = state.boss?.majordomoTanks?.magicReflectionActive;

                      return (
                        <div
                          key={add.id}
                          className={`add-health-bar ${!add.isAlive ? 'dead' : ''} ${isMagicReflectionActive && add.isAlive ? 'magic-reflection' : ''}`}
                        >
                          <span className="add-name">{displayName}</span>
                          <div className="add-health-bg">
                            <div
                              className={`add-health-fill ${isMagicReflectionActive && add.isAlive ? 'magic-reflection-fill' : ''}`}
                              style={{ width: `${(add.currentHealth / add.maxHealth) * 100}%` }}
                            />
                          </div>
                          <span className="add-health-text">
                            {add.isAlive ? `${Math.round(add.currentHealth / 1000)}k` : 'DEAD'}
                          </span>
                        </div>
                      );
                    })}

                    {/* Majordomo's health bar - always at 100%, IMMUNE */}
                    <div className="sulfuron-main-health-bar inactive">
                      <span className="add-name">Majordomo</span>
                      <div className="add-health-bg">
                        <div
                          className="add-health-fill sulfuron-fill"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <span className="add-health-text">IMMUNE</span>
                    </div>
                  </div>
                )}

                {/* Standard boss health bar for non-Sulfuron/Majordomo/Ragnaros-phase-2 bosses */}
                {state.boss.id !== 'sulfuron' && state.boss.id !== 'majordomo' && !(state.boss.id === 'ragnaros' && state.boss.currentPhase === 2) && (
                  <div className="boss-health-container">
                    <div
                      className="boss-health-bar"
                      style={{ width: `${(state.boss.currentHealth / state.boss.maxHealth) * 100}%` }}
                    />
                    <div className="boss-health-text">
                      {Math.floor((state.boss.currentHealth / state.boss.maxHealth) * 100)}%
                    </div>
                  </div>
                )}

                {/* Ragnaros submerge timer (Phase 1 - countdown to submerge) */}
                {state.boss.id === 'ragnaros' && state.boss.currentPhase === 1 && state.boss.ragnarosTanks && !state.boss.ragnarosTanks.hasSubmerged && (
                  <div className="submerge-timer-container">
                    <div className="submerge-timer-label">Submerge in:</div>
                    <div className="submerge-timer-bar-bg">
                      <div
                        className="submerge-timer-bar-fill"
                        style={{ width: `${Math.max(0, ((state.boss.ragnarosTanks.submergeTime - state.elapsedTime) / 180) * 100)}%` }}
                      />
                    </div>
                    <div className="submerge-timer-text">
                      {formatTime(Math.max(0, state.boss.ragnarosTanks.submergeTime - state.elapsedTime))}
                    </div>
                  </div>
                )}

                {/* Ragnaros Sons of Flame phase (Phase 2) */}
                {state.boss.id === 'ragnaros' && state.boss.currentPhase === 2 && state.boss.adds && (
                  <div className="sons-of-flame-container">
                    <div className="sons-header">
                      <span className="sons-title">Sons of Flame</span>
                      <span className="sons-timer-text">
                        Time left: {state.boss.ragnarosTanks && formatTime(Math.max(0, state.boss.ragnarosTanks.sonsTimer))}
                      </span>
                    </div>
                    <div className="sons-timer-bar-bg">
                      <div
                        className="sons-timer-bar-fill"
                        style={{ width: `${state.boss.ragnarosTanks ? Math.max(0, (state.boss.ragnarosTanks.sonsTimer / 90) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="sons-health-grid">
                      {state.boss.adds.map((son, index) => (
                        <div
                          key={son.id}
                          className={`son-health-bar ${!son.isAlive ? 'dead' : ''}`}
                        >
                          <span className="son-name">Son {index + 1}</span>
                          <div className="son-health-bg">
                            <div
                              className="son-health-fill"
                              style={{ width: `${(son.currentHealth / son.maxHealth) * 100}%` }}
                            />
                          </div>
                          <span className="son-health-text">
                            {son.isAlive ? `${Math.round(son.currentHealth / 1000)}k` : 'DEAD'}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Ragnaros health reminder (submerged) */}
                    <div className="ragnaros-submerged-health">
                      <span>Ragnaros: {state.boss.ragnarosTanks ? Math.floor((state.boss.ragnarosTanks.healthBeforeSubmerge / state.boss.maxHealth) * 100) : 0}% (Submerged)</span>
                    </div>
                  </div>
                )}

                <div className="boss-timer">
                  Time: {formatTime(state.elapsedTime)} | Enrage: {formatTime(state.boss.enrageTimer - state.elapsedTime)}
                </div>
              </div>
            </div>
          )}

          {/* Raid Grid - Organized by groups */}
          <div className="raid-grid-grouped">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(groupNum => {
                const groupMembers = state.raid.filter(m => m.group === groupNum);
                if (groupMembers.length === 0) return null;

                return (
                  <div key={groupNum} className="raid-grid-group">
                    <div className="raid-group-label">G{groupNum}</div>
                    <div className="raid-group-members">
                      {groupMembers.map(member => {
                        const healthPercent = (member.currentHealth / member.maxHealth) * 100;
                        const hasDispellable = member.debuffs.some(
                          d => d.type === 'magic' || d.type === 'poison' || d.type === 'disease'
                        );
                        const classColor = CLASS_COLORS[member.class];
                        const isPlayer = isLocalPlayer(member.id);
                        const recentCritHeal = member.lastCritHealTime && (Date.now() - member.lastCritHealTime) < 500;

                        // Chain Heal bounce preview - show glow on targets that will receive bounces
                        // Use mouseover target when mouseover healing is enabled, otherwise use selected target
                        const chainHealPrimaryTarget = mouseoverHealingEnabled && state.mouseoverTargetId
                          ? state.mouseoverTargetId
                          : state.selectedTargetId;
                        const isChainHealBounceTarget = state.isCasting &&
                          state.castingSpell?.id.includes('chain_heal') &&
                          chainHealPrimaryTarget &&
                          engine.getChainHealBounceTargets(chainHealPrimaryTarget, state.castingSpell?.maxBounces || 2).includes(member.id);

                        // Healer mana - for player it's state.playerMana, for AI it's aiHealerStats
                        const isHealer = member.role === 'healer';
                        const healerMana = isPlayer
                          ? { current: state.playerMana, max: state.maxMana }
                          : state.aiHealerStats[member.id]
                            ? { current: state.aiHealerStats[member.id].currentMana, max: state.aiHealerStats[member.id].maxMana }
                            : null;
                        const manaPercent = healerMana ? (healerMana.current / healerMana.max) * 100 : 0;

                        // Living Bomb mechanic - check if member has the debuff
                        const livingBombDebuff = member.debuffs.find(d => d.id === 'living_bomb');
                        const hasLivingBomb = !!livingBombDebuff;
                        const livingBombUrgency = livingBombDebuff
                          ? livingBombDebuff.duration <= 3 ? 'critical' : livingBombDebuff.duration <= 5 ? 'urgent' : ''
                          : '';

                        // Inferno mechanic - check if member has the debuff (red glow)
                        const hasInferno = member.debuffs.some(d => d.id === 'inferno');

                        // Mind Control mechanic - check if member has the debuff (purple glow)
                        const hasMindControl = member.debuffs.some(d => d.isMindControl);

                        // Lava Bomb mechanic - check if member has the debuff (orange glow)
                        const hasLavaBomb = member.debuffs.some(d => d.id === 'lava_bomb');

                        // Skip rendering in normal grid if evacuated to safe zone
                        if (evacuatedMembers.has(member.id)) return null;

                        return (
                          <div
                            key={member.id}
                            className={`raid-frame ${state.selectedTargetId === member.id ? 'selected' : ''} ${mouseoverHealingEnabled && state.mouseoverTargetId === member.id ? 'mouseover-target' : ''} ${!member.isAlive ? 'dead' : ''} ${hasDispellable ? 'has-dispellable' : ''} ${isPlayer ? 'is-player' : ''} ${recentCritHeal ? 'crit-heal' : ''} ${isChainHealBounceTarget ? 'chain-heal-bounce' : ''} ${hasLivingBomb ? `has-living-bomb ${livingBombUrgency}` : ''} ${hasInferno ? 'has-inferno' : ''} ${hasMindControl ? 'has-mind-control' : ''} ${hasLavaBomb ? 'has-lava-bomb' : ''}`}
                            draggable={hasLivingBomb}
                            onDragStart={(e) => {
                              if (hasLivingBomb) {
                                e.dataTransfer.setData('memberId', member.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }
                            }}
                            onClick={() => {
                              if (state.isRunning) {
                                // In mouseover mode, don't select target on click
                                if (!mouseoverHealingEnabled) {
                                  engine.selectTarget(member.id);
                                }
                              } else {
                                engine.inspectMember(member.id);
                              }
                            }}
                            onMouseEnter={() => mouseoverHealingEnabled && engine.setMouseoverTarget(member.id)}
                            onMouseLeave={() => mouseoverHealingEnabled && engine.setMouseoverTarget(null)}
                          >
                            <div className="class-indicator" style={{ backgroundColor: classColor }} />
                            <div className="member-name" style={{ color: classColor }}>
                              {member.name}
                              {isPlayer && <span className="you-indicator">YOU</span>}
                            </div>
                            <div className="health-bar-container">
                              <div
                                className="health-bar"
                                style={{
                                  width: `${healthPercent}%`,
                                  backgroundColor: healthPercent > 50 ? '#00cc00' : healthPercent > 25 ? '#cccc00' : '#cc0000',
                                }}
                              />
                              <div className="health-text">
                                {member.isAlive ? (
                                  <>
                                    <span>{Math.floor(member.currentHealth)}</span>
                                    {member.maxHealth - member.currentHealth > 0 && (
                                      <span className="missing-health">-{Math.floor(member.maxHealth - member.currentHealth)}</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="dead-text">DEAD</span>
                                )}
                              </div>
                            </div>
                            {/* Healer mana bar */}
                            {isHealer && healerMana && (
                              <div className="healer-mana-bar-container">
                                <div
                                  className="healer-mana-bar"
                                  style={{ width: `${manaPercent}%` }}
                                />
                              </div>
                            )}
                            <div className="role-indicator">
                              {member.role === 'tank' && '🛡️'}
                              {member.role === 'healer' && '💚'}
                              {member.role === 'dps' && '⚔️'}
                            </div>
                            {member.debuffs.length > 0 && (
                              <div className="debuff-container">
                                {member.debuffs.slice(0, 3).map((debuff, idx) => (
                                  <div key={idx} className={`debuff-icon debuff-${debuff.type} ${debuff.stacks && debuff.stacks > 1 ? 'has-stacks' : ''}`} title={`${debuff.name}${debuff.stacks ? ` (${debuff.stacks} stacks)` : ''}`}>
                                    {debuff.stacks && debuff.stacks > 1 ? (
                                      <span className="debuff-stacks">{debuff.stacks}</span>
                                    ) : (
                                      Math.ceil(debuff.duration)
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {member.buffs.length > 0 && (
                              <div className="buff-container">
                                {member.buffs.filter(b => b.id.startsWith('aura_') || b.id.startsWith('shaman_totem_') || b.id.startsWith('totem_')).slice(0, 5).map((buff, idx) => (
                                  <img key={idx} src={buff.icon} alt={buff.name} className="aura-buff-icon" title={buff.name} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Living Bomb Safe Zone - visible during Baron Geddon */}
            {state.boss?.id === 'baron_geddon' && (
              <div
                className={`safe-zone ${safeZoneDragOver ? 'drag-over' : ''} ${evacuatedMembers.size > 0 ? 'has-members' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setSafeZoneDragOver(true);
                }}
                onDragLeave={() => setSafeZoneDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setSafeZoneDragOver(false);
                  const memberId = e.dataTransfer.getData('memberId');
                  if (memberId) {
                    // In multiplayer mode, send action to host
                    if (isMultiplayerMode && mpChannelRef.current) {
                      mpChannelRef.current.send({
                        type: 'broadcast',
                        event: 'player_action',
                        payload: { type: 'evacuate_safe_zone', memberId },
                      });
                      // If we're the host, also apply locally
                      if (isHost) {
                        setEvacuatedMembers(prev => new Set([...prev, memberId]));
                        engine.setMemberInSafeZone(memberId, true);
                      }
                    } else {
                      // Single-player: apply directly
                      setEvacuatedMembers(prev => new Set([...prev, memberId]));
                      engine.setMemberInSafeZone(memberId, true);
                    }
                  }
                }}
              >
                <div className="safe-zone-label">
                  {evacuatedMembers.size > 0 ? 'SAFE ZONE - Protected!' : 'SAFE ZONE - Drag Living Bomb here!'}
                </div>
                <div className="safe-zone-members">
                  {Array.from(evacuatedMembers).map(memberId => {
                    const member = state.raid.find(m => m.id === memberId);
                    if (!member) return null;
                    const healthPercent = (member.currentHealth / member.maxHealth) * 100;
                    const classColor = CLASS_COLORS[member.class];
                    const livingBombDebuff = member.debuffs.find(d => d.id === 'living_bomb');

                    return (
                      <div
                        key={memberId}
                        className={`evacuated-member ${state.selectedTargetId === member.id ? 'selected' : ''} ${mouseoverHealingEnabled && state.mouseoverTargetId === member.id ? 'mouseover-target' : ''}`}
                        onClick={() => !mouseoverHealingEnabled && engine.selectTarget(member.id)}
                        onMouseEnter={() => mouseoverHealingEnabled && engine.setMouseoverTarget(member.id)}
                        onMouseLeave={() => mouseoverHealingEnabled && engine.setMouseoverTarget(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="class-indicator" style={{ backgroundColor: classColor }} />
                        <div className="member-name" style={{ color: classColor }}>{member.name}</div>
                        <div className="health-bar-container">
                          <div
                            className="health-bar"
                            style={{
                              width: `${healthPercent}%`,
                              backgroundColor: healthPercent > 50 ? '#00cc00' : healthPercent > 25 ? '#cccc00' : '#cc0000',
                            }}
                          />
                        </div>
                        {livingBombDebuff && (
                          <div className="living-bomb-countdown">{Math.ceil(livingBombDebuff.duration)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

        </div>

        {/* Center Panel */}
        <div className="center-panel">
          {/* Encounter Controls */}
          {!state.isRunning ? (
            <div className="encounter-select">
              <div className="encounter-header">
                {/* Raid Selector Dropdown */}
                <div className="raid-selector-container">
                  <select
                    className="raid-selector"
                    value={state.selectedRaidId}
                    onChange={(e) => engine.selectRaid(e.target.value)}
                  >
                    {RAIDS.filter(raid => {
                      // Filter out hidden raids unless they're unlocked
                      if (!raid.hidden) return true;
                      if (raid.id === 'silithus' && state.silithusUnlocked) return true;
                      return false;
                    }).map(raid => {
                      const defeatedCount = state.defeatedBossesByRaid[raid.id]?.length || 0;
                      const totalBosses = raid.encounters.length;
                      const progressText = defeatedCount > 0 ? ` (${defeatedCount}/${totalBosses})` : '';
                      return (
                        <option
                          key={raid.id}
                          value={raid.id}
                          disabled={!raid.available}
                        >
                          {raid.name}{progressText} {!raid.available && '(Coming Soon)'}
                        </option>
                      );
                    })}
                  </select>
                  <span className="raid-description">{engine.getCurrentRaid()?.description}</span>
                </div>
                <button
                  className="encounter-journal-btn"
                  onClick={() => {
                    const currentEncounters = engine.getCurrentRaidEncounters();
                    if (currentEncounters.length > 0) {
                      setSelectedJournalBoss(currentEncounters[0].id);
                      setShowEncounterJournal(true);
                    }
                  }}
                  title="View boss abilities"
                >
                  📖 Encounter Journal
                </button>
              </div>
              {/* Training Dummy - Separate Section */}
              <div className="training-section">
                <div className="training-section-label">Practice</div>
                <button
                  className="encounter-button training"
                  onClick={() => engine.startEncounter('training')}
                >
                  Training Dummy
                </button>
              </div>

              {/* Visual Progress Bar */}
              {(() => {
                const defeatedCount = engine.getDefeatedBossesForCurrentRaid().length;
                const totalBosses = engine.getCurrentRaidEncounters().length;
                const defeatedBosses = engine.getDefeatedBossesForCurrentRaid();
                const raidEncounters = engine.getCurrentRaidEncounters();
                const isRaidCleared = defeatedCount === totalBosses && totalBosses > 0;

                return (
                  <div className="encounter-progress">
                    <div className="encounter-progress-header">
                      <span className="progress-label">Progress</span>
                      <span className="progress-count">{defeatedCount}/{totalBosses} bosses</span>
                    </div>
                    <div className="encounter-progress-bar">
                      <div className="encounter-progress-segments">
                        {raidEncounters.map((enc, idx) => {
                          const isDefeated = defeatedBosses.includes(enc.id);
                          const isNext = engine.getNextBoss() === enc.id;
                          return (
                            <div
                              key={enc.id}
                              className={`progress-segment ${isDefeated ? 'defeated' : ''} ${isNext ? 'current' : ''}`}
                              title={`${idx + 1}. ${enc.name}${isDefeated ? ' (Defeated)' : ''}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                    {isRaidCleared && (
                      <div className="raid-cleared-badge">
                        <span className="raid-cleared">RAID CLEARED!</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Boss Buttons - 5 Column Grid */}
              <div className="encounter-buttons">
                {engine.getCurrentRaidEncounters().map((enc, idx) => {
                  const defeatedBosses = engine.getDefeatedBossesForCurrentRaid();
                  const raidEncounters = engine.getCurrentRaidEncounters();
                  const isDefeated = defeatedBosses.includes(enc.id);
                  const isNext = engine.getNextBoss() === enc.id;
                  // Check if previous boss is defeated (or this is the first boss)
                  const previousBossDefeated = idx === 0 || defeatedBosses.includes(raidEncounters[idx - 1].id);
                  const isLocked = !isDefeated && !previousBossDefeated;
                  return (
                    <button
                      key={enc.id}
                      className={`encounter-button ${isDefeated ? 'defeated' : ''} ${isNext ? 'next-boss' : ''} ${isLocked ? 'locked' : ''}`}
                      onClick={() => handleEncounterSelect(enc.id)}
                      disabled={isDefeated || isLocked}
                      title={isDefeated ? 'Already defeated - reset raid to fight again' : isLocked ? `Must defeat ${raidEncounters[idx - 1].name} first` : ''}
                    >
                      <span className="boss-number">{idx + 1}.</span>
                      <span className="boss-name">{enc.name}</span>
                      {isDefeated && <span className="defeated-marker">✓</span>}
                      {isLocked && <span className="locked-marker">🔒</span>}
                    </button>
                  );
                })}
              </div>
              {/* Raid Config Summary Strip */}
              <div className="raid-config-strip">
                <div className="config-summary">
                  <span className={`faction-indicator ${state.faction}`}>
                    {state.faction === 'alliance' ? 'Alliance' : 'Horde'}
                  </span>
                  <span className="separator">·</span>
                  <span>{state.raid.length}m</span>
                  <span className="separator">·</span>
                  <span>{state.otherHealersEnabled ? 'AI Healers' : 'Solo'}</span>
                </div>
                <button
                  className={`multiplayer-config-btn ${isMultiplayerMode ? 'active' : ''}`}
                  onClick={() => setShowMultiplayerLobby(true)}
                  title="Looking for Group - Play with friends!"
                >
                  {isMultiplayerMode ? 'In Group' : 'LFG'}
                </button>
              </div>
              {/* Keep Restore Raid button easily accessible */}
              <div className="raid-utility-buttons">
                <button
                  className="restore-raid-btn"
                  onClick={() => engine.restoreRaid()}
                  title="Restore all raid members to full health and mana"
                >
                  Restore Raid (Drink/Eat)
                </button>
                {Object.values(state.defeatedBossesByRaid).some(bosses => bosses.length > 0) && (
                  <button
                    className="reset-lockout-btn"
                    onClick={() => {
                      setConfirmDialog({
                        title: 'Reset Raid Lockouts',
                        message: 'All boss progress will be cleared and you can re-run the raids.',
                        warningText: 'This will reset all defeated bosses!',
                        confirmLabel: 'Reset',
                        onConfirm: () => engine.resetRaidLockout()
                      });
                    }}
                    title="Reset all raid lockouts - clear all defeated bosses"
                  >
                    Reset Lockouts
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="encounter-controls">
                <button className="stop-button" onClick={() => engine.stopEncounter()}>
                  Stop Encounter (ESC)
                </button>
              </div>
              <div className="scoreboard">
                <div className="score-item">
                  <span className="score-label">Your Healing</span>
                  <span className="score-value heal">{Math.floor(state.healingDone).toLocaleString()}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Overhealing</span>
                  <span className="score-value overheal">{Math.floor(state.overhealing).toLocaleString()}</span>
                </div>
                {state.otherHealersEnabled && (
                  <div className="score-item">
                    <span className="score-label">Other Healers</span>
                    <span className="score-value other-heal">{Math.floor(state.otherHealersHealing).toLocaleString()}</span>
                  </div>
                )}
                <div className="score-item">
                  <span className="score-label">Alive</span>
                  <span className="score-value">{state.raid.filter(m => m.isAlive).length} / {state.raid.length}</span>
                </div>
              </div>

              {/* Healing Meter */}
              <RaidMeter
                playerHealing={state.healingDone}
                playerDispels={state.dispelsDone}
                playerSpellBreakdown={state.spellHealing}
                playerName={state.playerName}
                playerClass={state.playerClass}
                aiHealerStats={state.aiHealerStats}
                showAiHealers={state.otherHealersEnabled}
                isMultiplayer={isMultiplayerMode}
                hidePlayer={state.isRaidLeaderMode}
                multiplayerHealers={Object.entries(multiplayerHealingStats)
                  .filter(([id]) => id !== (localPlayer?.id || 'host')) // Exclude self - already shown as "You"
                  .map(([id, stats]) => ({
                    id,
                    name: stats.name,
                    healingDone: stats.healingDone,
                    dispelsDone: stats.dispelsDone,
                    class: stats.class as 'paladin' | 'shaman' | 'priest' | 'druid',
                    isPlayer: false,
                  }))}
              />
            </>
          )}

          {/* Encounter Summary - Shows healing meter after boss kill or wipe */}
          {!state.isRunning && state.lastEncounterResult && (
            <div className="encounter-summary">
              <div className="encounter-summary-header">
                <span className={`encounter-result ${state.lastEncounterResult}`}>
                  {state.lastEncounterResult === 'victory' ? 'VICTORY!' : 'WIPE'}
                </span>
                <button
                  className="dismiss-summary-btn"
                  onClick={() => engine.clearEncounterResult()}
                >
                  ×
                </button>
              </div>
              <RaidMeter
                playerHealing={state.healingDone}
                playerDispels={state.dispelsDone}
                playerSpellBreakdown={state.spellHealing}
                playerName={state.playerName}
                playerClass={state.playerClass}
                aiHealerStats={state.aiHealerStats}
                showAiHealers={state.otherHealersEnabled}
                isMultiplayer={isMultiplayerMode}
                hidePlayer={state.isRaidLeaderMode}
                multiplayerHealers={Object.entries(multiplayerHealingStats)
                  .filter(([id]) => id !== (localPlayer?.id || 'host'))
                  .map(([id, stats]) => ({
                    id,
                    name: stats.name,
                    healingDone: stats.healingDone,
                    dispelsDone: stats.dispelsDone,
                    class: stats.class as 'paladin' | 'shaman' | 'priest' | 'druid',
                    isPlayer: false,
                  }))}
              />
            </div>
          )}

          {/* Cast Bar - Hidden in Raid Leader Mode */}
          {!state.isRaidLeaderMode && state.isCasting && state.castingSpell && (
            <div className="cast-bar-wrapper">
              <div className="cast-bar">
                <div className="cast-bar-fill" style={{ width: `${state.castProgress * 100}%` }} />
                <div className="cast-bar-text">
                  {state.castingSpell.name} - {((1 - state.castProgress) * state.castingSpell.castTime).toFixed(1)}s
                </div>
              </div>
            </div>
          )}

          {/* Action Bar - Hidden in Raid Leader Mode */}
          {!state.isRaidLeaderMode && (
          <>
          <div className="action-bar-row">
            <div className="action-bar">
              {actionBar.map((spell, idx) => {
                const isOnCooldown = spell.currentCooldown > 0;
                const isOnGCD = state.globalCooldown > 0 && spell.isOnGlobalCooldown;
                const notEnoughMana = state.playerMana < spell.manaCost;
                const isDisabled = isOnCooldown || isOnGCD || notEnoughMana || state.isCasting;

                return (
                  <div
                    key={spell.id}
                    className={`spell-button ${isDisabled ? 'disabled' : ''} ${spell.id === 'divine_favor' && state.divineFavorActive ? 'active' : ''}`}
                    onClick={() => !isDisabled && engine.castSpell(spell)}
                    onMouseEnter={() => !state.isRunning && setHoveredSpell(spell)}
                    onMouseLeave={() => setHoveredSpell(null)}
                  >
                    <img src={spell.icon} alt={spell.name} />
                    <div className="spell-keybind">{keybinds.actionBar[idx]?.toUpperCase() || (idx + 1)}</div>
                    {/* WoW-style clockwise sweep for spell cooldowns */}
                    {isOnCooldown && (
                      <>
                        <div
                          className="cooldown-sweep"
                          style={{
                            '--sweep-progress': `${(1 - spell.currentCooldown / spell.cooldown) * 360}deg`,
                          } as React.CSSProperties}
                        />
                        <div className="cooldown-text">{Math.ceil(spell.currentCooldown)}</div>
                      </>
                    )}
                    {/* WoW-style clockwise sweep for GCD */}
                    {isOnGCD && !isOnCooldown && (
                      <div
                        className="gcd-sweep"
                        style={{
                          '--sweep-progress': `${(1 - state.globalCooldown / 1.5) * 360}deg`,
                        } as React.CSSProperties}
                      />
                    )}
                    {notEnoughMana && !isOnCooldown && !isOnGCD && (
                      <div className="no-mana-overlay" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mana Potion */}
            <div
              className={`spell-button mana-potion ${state.manaPotionCooldown > 0 ? 'disabled' : ''}`}
              onClick={() => engine.useManaPotion()}
              title={`Major Mana Potion (${keybinds.manaPotion.toUpperCase()})`}
            >
              <img src="/icons/inv_potion_76.jpg" alt="Mana Potion" />
              <div className="spell-keybind">{keybinds.manaPotion.toUpperCase()}</div>
              {state.manaPotionCooldown > 0 && (
                <div className="cooldown-overlay">
                  <span>{Math.ceil(state.manaPotionCooldown)}</span>
                </div>
              )}
            </div>

          </div>

          {/* Totem Bar - Only shown for Shaman */}
          {state.playerClass === 'shaman' && (
            <div className="totem-bar">
              {(['earth', 'fire', 'water', 'air'] as TotemElement[]).map(element => {
                const activeTotem = state.activeTotems.find(t => t.element === element);
                const availableTotems = TOTEMS_BY_ELEMENT[element];

                return (
                  <div key={element} className={`totem-element-group ${element}`}>
                    <div className="totem-element-label">{element.charAt(0).toUpperCase() + element.slice(1)}</div>
                    <div className="totem-buttons">
                      {availableTotems.map(totem => {
                        const isActive = activeTotem?.id === totem.id;
                        const cooldown = state.totemCooldowns.find(tc => tc.totemId === totem.id);
                        const isOnCooldown = cooldown && cooldown.remainingCooldown > 0;
                        const notEnoughMana = state.playerMana < totem.manaCost;
                        const isOnGCD = state.globalCooldown > 0;
                        const isDisabled = isOnCooldown || notEnoughMana || isOnGCD || state.isCasting;

                        return (
                          <div
                            key={totem.id}
                            className={`totem-button ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => !isDisabled && engine.dropTotem(totem.id)}
                            title={`${totem.name} - ${totem.manaCost} mana${totem.cooldown > 0 ? ` (${totem.cooldown}s CD)` : ''}`}
                          >
                            <img src={totem.icon} alt={totem.name} />
                            {isActive && activeTotem && (
                              <div className="totem-duration">{Math.ceil(activeTotem.remainingDuration)}s</div>
                            )}
                            {isOnCooldown && cooldown && (
                              <div className="cooldown-overlay">
                                <span>{Math.ceil(cooldown.remainingCooldown)}</span>
                              </div>
                            )}
                            {notEnoughMana && !isOnCooldown && (
                              <div className="no-mana-overlay" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </>
          )}

          {/* Spell Tooltip - Shows when hovering over action bar spells (out of encounter) - Hidden in Raid Leader Mode */}
          {!state.isRaidLeaderMode && hoveredSpell && !state.isRunning && (
            <div className="spell-tooltip">
              <div className="spell-tooltip-header">
                <img src={hoveredSpell.icon} alt={hoveredSpell.name} className="spell-tooltip-icon" />
                <div className="spell-tooltip-title">
                  <span className="spell-tooltip-name">{hoveredSpell.name}</span>
                  {hoveredSpell.rank && <span className="spell-tooltip-rank">Rank {hoveredSpell.rank}</span>}
                </div>
              </div>
              <div className="spell-tooltip-stats">
                {hoveredSpell.manaCost > 0 && (
                  <div className="spell-stat">
                    <span className="stat-value mana">{hoveredSpell.manaCost}</span> Mana
                  </div>
                )}
                {hoveredSpell.range && hoveredSpell.range > 0 && (
                  <div className="spell-stat">
                    <span className="stat-value">{hoveredSpell.range}</span> yd range
                  </div>
                )}
                <div className="spell-stat">
                  {hoveredSpell.castTime > 0 ? (
                    <><span className="stat-value">{hoveredSpell.castTime}</span> sec cast</>
                  ) : (
                    <span className="stat-value instant">Instant</span>
                  )}
                </div>
                {hoveredSpell.cooldown > 0 && (
                  <div className="spell-stat">
                    <span className="stat-value cooldown">{hoveredSpell.cooldown}</span> sec cooldown
                  </div>
                )}
              </div>
              <div className="spell-tooltip-description">
                {SPELL_TOOLTIPS[hoveredSpell.id]?.description || 'No description available.'}
              </div>
              {hoveredSpell.healAmount.min > 0 && (
                <div className="spell-tooltip-healing">
                  Base Healing: <span className="heal-value">{hoveredSpell.healAmount.min} - {hoveredSpell.healAmount.max}</span>
                  <br />
                  <span className="coefficient">+{(hoveredSpell.spellPowerCoefficient * 100).toFixed(0)}% of Spell Power</span>
                </div>
              )}
              {SPELL_TOOLTIPS[hoveredSpell.id]?.additionalInfo && (
                <div className="spell-tooltip-info">
                  {SPELL_TOOLTIPS[hoveredSpell.id].additionalInfo}
                </div>
              )}
            </div>
          )}

          {/* Collapsible Buffs Panel - Only show when not in encounter */}
          {!state.isRunning && (
            <div className="player-buffs-panel">
              {/* Collapsible Header */}
              <div
                className={`buffs-panel-header ${buffsExpanded ? 'expanded' : ''}`}
                onClick={() => setBuffsExpanded(!buffsExpanded)}
              >
                <div className="buffs-panel-title">
                  <span className="collapse-arrow">{buffsExpanded ? '▲' : '▼'}</span>
                  <span>Raid Buffs</span>
                </div>
                <span className="buffs-panel-count">
                  {state.playerBuffs.length + state.activeConsumables.length + state.activeWorldBuffs.length} active
                </span>
                <div className="buffs-panel-actions">
                  <button
                    onClick={(e) => { e.stopPropagation(); engine.applyAllBuffs(); }}
                  >
                    Buff All
                  </button>
                  <button
                    className="clear-btn"
                    onClick={(e) => { e.stopPropagation(); engine.clearAllRaidBuffs(); }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              <div className={`buffs-panel-content ${buffsExpanded ? 'expanded' : ''}`}>
                {/* Paladin Blessings Section - Only show for Alliance (Horde has no Paladins) */}
                {state.faction === 'alliance' && (
                  <div className="paladin-blessings-section">
                    <div className="blessings-header">
                      <span>Paladin Blessings</span>
                      <span className="blessing-slots">
                        ({state.activePaladinBlessings.length}/{state.maxPaladinBlessings} slots)
                      </span>
                    </div>
                    <div className="blessings-grid">
                      {engine.getPaladinBlessings().map(({ buff, isAssigned, isApplied }) => (
                        <div
                          key={buff.id}
                          className={`blessing-slot ${isAssigned ? 'assigned' : ''} ${isApplied ? 'applied' : ''}`}
                          onClick={() => engine.togglePaladinBlessing(buff.id)}
                          title={`${buff.name}${isAssigned ? ' (Assigned)' : ' (Click to assign)'}`}
                        >
                          <img src={buff.icon} alt={buff.name} />
                          <span className="blessing-name">{buff.name.replace('Greater Blessing of ', '')}</span>
                          {isAssigned && <div className="blessing-assigned-check">✓</div>}
                          {isApplied && <div className="blessing-applied-indicator" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Raid Buffs */}
                <div className="other-buffs-section">
                  <span className="other-buffs-header">Other Raid Buffs</span>
                  <div className="buffs-grid">
                    {engine.getAvailableBuffs().map(({ buff, available, hasBuff }) => (
                      <div
                        key={buff.id}
                        className={`buff-slot ${hasBuff ? 'active' : ''} ${!available ? 'unavailable' : ''}`}
                        onClick={() => {
                          if (available) {
                            if (hasBuff) {
                              engine.removeRaidBuff(buff.id);
                            } else {
                              engine.applyRaidBuff(buff.id);
                            }
                          }
                        }}
                        title={`${buff.name}${!available ? ' (No caster in raid)' : ''}`}
                      >
                        <img src={buff.icon} alt={buff.name} />
                        {hasBuff && <div className="buff-active-indicator" />}
                        {!available && <div className="buff-unavailable-overlay" />}
                      </div>
                    ))}
                  </div>
                </div>

                {state.playerBuffs.length > 0 && (
                  <div className="active-buffs-display">
                    <span className="active-buffs-label">Active ({state.playerBuffs.length}):</span>
                    {state.playerBuffs.map(buff => (
                      <div key={buff.id} className="active-buff-icon" title={buff.name}>
                        <img src={buff.icon} alt={buff.name} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Consumables Section */}
                <div className="consumables-section">
                  <div className="consumables-header">
                    <span>Consumables</span>
                    <div className="consumables-actions">
                      <button
                        className={`consumables-btn ${engine.hasActiveConsumables() ? 'active' : ''}`}
                        onClick={() => engine.applyConsumables()}
                      >
                        Use All
                      </button>
                      <button
                        className="consumables-clear-btn"
                        onClick={() => engine.clearConsumables()}
                        disabled={!engine.hasActiveConsumables()}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="consumables-grid">
                    {Object.values(CONSUMABLES)
                      .filter(c => c.role === 'healer')
                      .map(consume => {
                        const isActive = state.activeConsumables.includes(consume.id);
                        return (
                          <div
                            key={consume.id}
                            className={`consumable-slot ${isActive ? 'active' : ''}`}
                            title={consume.name}
                          >
                            <img src={consume.icon} alt={consume.name} />
                            {isActive && <div className="consumable-active-indicator" />}
                          </div>
                        );
                      })}
                  </div>
                  <div className="consumables-note">
                    Using consumables auto-buffs raid with role-appropriate consumes
                  </div>
                </div>

                {/* World Buffs Section */}
                <div className="world-buffs-section">
                  <div className="world-buffs-header">
                    <span>World Buffs</span>
                    <button
                      className="world-buffs-clear-btn"
                      onClick={() => engine.clearWorldBuffs()}
                      disabled={state.activeWorldBuffs.length === 0}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="world-buffs-grid">
                    {engine.getWorldBuffStatus().map(({ buff, isAvailable, isActive, isComingSoon }) => (
                      <div
                        key={buff.id}
                        className={`world-buff-slot ${isComingSoon ? 'coming-soon' : ''} ${isActive ? 'active' : ''} ${!isAvailable && !isComingSoon ? 'locked' : ''}`}
                        onClick={() => {
                          if (!isComingSoon && isAvailable) {
                            if (isActive) {
                              engine.clearWorldBuffs();
                            } else {
                              engine.applyWorldBuff(buff.id);
                            }
                          }
                        }}
                        title={buff.name}
                      >
                        <img src={buff.icon} alt={buff.name} />
                        <span className="world-buff-name">{buff.name.replace(' of the Dragonslayer', '').replace("Warchief's ", 'WC ')}</span>
                        {isActive && <div className="world-buff-active-indicator" />}
                        {isComingSoon && (
                          <div className="coming-soon-overlay">
                            <span className="coming-soon-text">Coming Soon</span>
                            <span className="raid-name">{buff.unlockRaid}</span>
                          </div>
                        )}
                        {!isComingSoon && !isAvailable && (
                          <div className="locked-overlay">
                            <span className="locked-icon">🔒</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Combat Log */}
        <div className="right-panel">
          <div className="combat-log">
            <div className="combat-log-header">Combat Log</div>
            <div className="combat-log-entries">
              {state.combatLog.map((entry, idx) => (
                <div key={idx} className={`log-entry log-${entry.type}`}>
                  <span className="log-time">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                  <span className={`log-message ${entry.isCrit ? 'crit' : ''}`}>{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="tips">
          <span className="tip">Press 1-5 to cast spells, ESC to cancel casting</span>
          <span className="tip">Press B or click the Bag icon to open your inventory and equip loot</span>
          <span className="tip">Sign in with Google or Apple to save your progress to the cloud</span>
        </div>
      </footer>
      </>
      )}

      {/* MOBILE UI */}
      {isMobileMode && (
        <div className="mobile-ui">
          {/* Mobile Header with Player Info */}
          <div className="mobile-player-header">
            <div className="mobile-player-info">
              <img
                src={state.playerClass === 'shaman'
                  ? "/icons/spell_nature_magicimmunity.jpg"
                  : "/icons/spell_holy_holybolt.jpg"}
                alt={state.playerClass === 'shaman' ? "Shaman" : "Paladin"}
                className="mobile-class-icon"
              />
              <div className="mobile-player-details">
                <span className="mobile-player-name" style={{ color: CLASS_COLORS[state.playerClass] }}>
                  {state.playerName}
                </span>
                <span className="mobile-player-class">
                  {state.playerClass === 'shaman' ? 'Resto Shaman' : 'Holy Paladin'}
                </span>
              </div>
              <div className="mobile-dkp">
                <span className="dkp-value">{state.playerDKP.points}</span>
                <span className="dkp-label">DKP</span>
              </div>
            </div>
            <div className="mobile-mana-bar">
              <div
                className={`mobile-mana-fill ${
                  (state.playerMana / state.maxMana) < 0.15 ? 'critical' :
                  (state.playerMana / state.maxMana) < 0.30 ? 'warning' : ''
                }`}
                style={{ width: `${(state.playerMana / state.maxMana) * 100}%` }}
              />
              <span className="mobile-mana-text">{Math.floor(state.playerMana)} / {state.maxMana}</span>
            </div>
            <div className="mobile-player-stats">
              <span>+{state.spellPower} SP</span>
              <span>{state.critChance.toFixed(1)}% Crit</span>
              <span>{Math.floor(engine.computePlayerStats().totalMp5)} MP5</span>
            </div>
          </div>

          {/* Phase Alert */}
          {phaseAlert && (
            <div className="mobile-phase-alert">{phaseAlert}</div>
          )}

          {/* Special Alert (Legendary unlocks, secret boss summons) */}
          {specialAlert && (
            <div className="special-alert">
              {specialAlert}
            </div>
          )}

          {/* Living Bomb Raid Warning */}
          {livingBombWarning && (
            <div className="living-bomb-warning">
              {livingBombWarning}
            </div>
          )}

          {/* Inferno Raid Warning (Baron Geddon - no airhorn) */}
          {infernoWarning && (
            <div className="inferno-warning">
              <div className="inferno-warning-text">{infernoWarning}</div>
            </div>
          )}

          {/* Mind Control Raid Warning (Lucifron - Dominate Mind) */}
          {mindControlWarning && (
            <div className="mind-control-warning">
              <div className="mind-control-warning-text">{mindControlWarning.mcPlayer} IS MIND CONTROLLED!</div>
              <div className="mind-control-warning-sub">Attacking {mindControlWarning.attackingPlayer}</div>
            </div>
          )}

          {/* Boss Frame (when in encounter) */}
          {state.boss && (
            <div className={`mobile-boss-frame ${state.boss.isFrenzied || state.boss.hasDeadenMagic ? 'frenzied' : ''}`}>
              <div className="mobile-boss-name">
                {state.boss.name}
                {state.boss.isFrenzied && <span className="frenzy-indicator"> FRENZY!</span>}
                {state.boss.hasDeadenMagic && <span className="frenzy-indicator"> DEADEN MAGIC!</span>}
                {state.boss.currentPhase && state.boss.currentPhase > 1 && (
                  <span className="phase-indicator"> P{state.boss.currentPhase}</span>
                )}
              </div>
              <div className="mobile-boss-health-bar">
                <div
                  className="mobile-boss-health-fill"
                  style={{ width: `${(state.boss.currentHealth / state.boss.maxHealth) * 100}%` }}
                />
                <span className="mobile-boss-health-text">
                  {Math.floor((state.boss.currentHealth / state.boss.maxHealth) * 100)}%
                </span>
              </div>
              <div className="mobile-boss-timer">
                {formatTime(state.elapsedTime)} | Enrage: {formatTime(state.boss.enrageTimer - state.elapsedTime)}
              </div>
            </div>
          )}

          {/* Cast Bar */}
          {state.isCasting && state.castingSpell && (
            <div className="mobile-cast-bar">
              <div className="mobile-cast-fill" style={{ width: `${state.castProgress * 100}%` }} />
              <span className="mobile-cast-text">
                {state.castingSpell.name} - {((1 - state.castProgress) * state.castingSpell.castTime).toFixed(1)}s
              </span>
            </div>
          )}

          {/* Mobile Tab Navigation */}
          <div className="mobile-tabs">
            <button
              className={`mobile-tab ${mobileTab === 'raid' ? 'active' : ''}`}
              onClick={() => setMobileTab('raid')}
            >
              Raid
            </button>
            <button
              className={`mobile-tab ${mobileTab === 'buffs' ? 'active' : ''}`}
              onClick={() => setMobileTab('buffs')}
              disabled={state.isRunning}
            >
              Buffs
            </button>
            <button
              className={`mobile-tab ${mobileTab === 'log' ? 'active' : ''}`}
              onClick={() => setMobileTab('log')}
            >
              Log
            </button>
          </div>

          {/* Mobile Content Area */}
          <div className="mobile-content">
            {/* Raid Tab - Raid Frames */}
            {mobileTab === 'raid' && (
              <div className="mobile-raid-container">
                {/* Encounter Controls (when not running) */}
                {!state.isRunning && (
                  <div className="mobile-encounter-controls">
                    <div className="mobile-raid-selector">
                      <select
                        value={state.selectedRaidId}
                        onChange={(e) => engine.selectRaid(e.target.value)}
                      >
                        {RAIDS.map(raid => {
                          const defeatedCount = state.defeatedBossesByRaid[raid.id]?.length || 0;
                          const totalBosses = raid.encounters.length;
                          return (
                            <option key={raid.id} value={raid.id} disabled={!raid.available}>
                              {raid.name} ({defeatedCount}/{totalBosses})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="mobile-boss-buttons">
                      <button
                        className="mobile-boss-btn training"
                        onClick={() => engine.startEncounter('training')}
                      >
                        Training
                      </button>
                      {engine.getCurrentRaidEncounters().map((enc, idx) => {
                        const defeatedBosses = engine.getDefeatedBossesForCurrentRaid();
                        const raidEncounters = engine.getCurrentRaidEncounters();
                        const isDefeated = defeatedBosses.includes(enc.id);
                        const previousBossDefeated = idx === 0 || defeatedBosses.includes(raidEncounters[idx - 1].id);
                        const isLocked = !isDefeated && !previousBossDefeated;
                        return (
                          <button
                            key={enc.id}
                            className={`mobile-boss-btn ${isDefeated ? 'defeated' : ''} ${isLocked ? 'locked' : ''}`}
                            onClick={() => handleEncounterSelect(enc.id)}
                            disabled={isDefeated || isLocked}
                          >
                            {idx + 1}. {enc.name.split(' ')[0]}
                            {isDefeated && ' ✓'}
                            {isLocked && ' 🔒'}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mobile-raid-controls">
                      <div className="mobile-faction-toggle">
                        <button
                          className={`mobile-faction-btn ${state.faction === 'alliance' ? 'active' : ''}`}
                          onClick={() => engine.switchFaction('alliance')}
                        >
                          Alliance
                        </button>
                        <button
                          className={`mobile-faction-btn ${state.faction === 'horde' ? 'active' : ''}`}
                          onClick={() => engine.switchFaction('horde')}
                        >
                          Horde
                        </button>
                      </div>
                      <div className="mobile-utility-buttons">
                        <button onClick={() => engine.restoreRaid()}>Restore</button>
                        <button onClick={() => setShowRaidGroupManager(true)}>Groups</button>
                        <button onClick={() => setShowSaveModal(true)}>Save</button>
                        <button onClick={() => setShowLoadModal(true)}>Load</button>
                        <button
                          className={`mobile-lfg-btn ${isMultiplayerMode ? 'active' : ''}`}
                          onClick={() => setShowMultiplayerLobby(true)}
                        >
                          {isMultiplayerMode ? 'Group' : 'LFG'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Running Encounter Stats */}
                {state.isRunning && (
                  <div className="mobile-encounter-stats">
                    <div className="mobile-stat">
                      <span className="stat-label">Healing</span>
                      <span className="stat-value heal">{Math.floor(state.healingDone).toLocaleString()}</span>
                    </div>
                    <div className="mobile-stat">
                      <span className="stat-label">Overheal</span>
                      <span className="stat-value overheal">{Math.floor(state.overhealing).toLocaleString()}</span>
                    </div>
                    <div className="mobile-stat">
                      <span className="stat-label">Alive</span>
                      <span className="stat-value">{state.raid.filter(m => m.isAlive).length}/{state.raid.length}</span>
                    </div>
                    <button className="mobile-stop-btn" onClick={() => engine.stopEncounter()}>
                      Stop
                    </button>
                  </div>
                )}

                {/* Mobile Raid Frames - Compact Grid */}
                <div className="mobile-raid-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(groupNum => {
                    const groupMembers = state.raid.filter(m => m.group === groupNum);
                    if (groupMembers.length === 0) return null;

                    return (
                      <div key={groupNum} className="mobile-raid-group">
                        <div className="mobile-group-label">G{groupNum}</div>
                        <div className="mobile-group-members">
                          {groupMembers.map(member => {
                            const healthPercent = (member.currentHealth / member.maxHealth) * 100;
                            const hasDispellable = member.debuffs.some(
                              d => d.type === 'magic' || d.type === 'poison' || d.type === 'disease'
                            );
                            const isPlayer = isLocalPlayer(member.id);
                            // Chain Heal bounce preview - use mouseover target when enabled
                            const mobileChainHealTarget = mouseoverHealingEnabled && state.mouseoverTargetId
                              ? state.mouseoverTargetId
                              : state.selectedTargetId;
                            const isChainHealBounce = state.isCasting &&
                              state.castingSpell?.id.includes('chain_heal') &&
                              mobileChainHealTarget &&
                              engine.getChainHealBounceTargets(mobileChainHealTarget, state.castingSpell?.maxBounces || 2).includes(member.id);

                            // Mobile healer mana
                            const isHealer = member.role === 'healer';
                            const healerMana = isPlayer
                              ? { current: state.playerMana, max: state.maxMana }
                              : state.aiHealerStats[member.id]
                                ? { current: state.aiHealerStats[member.id].currentMana, max: state.aiHealerStats[member.id].maxMana }
                                : null;
                            const manaPercent = healerMana ? (healerMana.current / healerMana.max) * 100 : 0;

                            // Living Bomb detection for mobile
                            const livingBombDebuff = member.debuffs.find(d => d.id === 'living_bomb');
                            const hasLivingBomb = !!livingBombDebuff && !evacuatedMembers.has(member.id);
                            const livingBombUrgency = livingBombDebuff
                              ? livingBombDebuff.duration <= 3 ? 'critical' : livingBombDebuff.duration <= 5 ? 'urgent' : ''
                              : '';

                            // Inferno detection for mobile (red glow)
                            const hasInferno = member.debuffs.some(d => d.id === 'inferno');

                            // Mind Control detection for mobile (purple glow)
                            const hasMindControl = member.debuffs.some(d => d.isMindControl);

                            // Lava Bomb detection for mobile (orange glow)
                            const hasLavaBomb = member.debuffs.some(d => d.id === 'lava_bomb');

                            // Skip if evacuated on mobile too
                            if (evacuatedMembers.has(member.id)) return null;

                            return (
                              <div
                                key={member.id}
                                className={`mobile-raid-frame ${state.selectedTargetId === member.id ? 'selected' : ''} ${mouseoverHealingEnabled && state.mouseoverTargetId === member.id ? 'mouseover-target' : ''} ${!member.isAlive ? 'dead' : ''} ${hasDispellable ? 'dispellable' : ''} ${isPlayer ? 'is-player' : ''} ${isChainHealBounce ? 'chain-bounce' : ''} ${hasLivingBomb ? `has-living-bomb ${livingBombUrgency}` : ''} ${hasInferno ? 'has-inferno' : ''} ${hasMindControl ? 'has-mind-control' : ''} ${hasLavaBomb ? 'has-lava-bomb' : ''}`}
                                onClick={() => {
                                  if (state.isRunning) {
                                    // In mouseover mode, don't select target on click
                                    if (!mouseoverHealingEnabled) {
                                      engine.selectTarget(member.id);
                                    }
                                  } else {
                                    engine.inspectMember(member.id);
                                  }
                                }}
                                onMouseEnter={() => mouseoverHealingEnabled && engine.setMouseoverTarget(member.id)}
                                onMouseLeave={() => mouseoverHealingEnabled && engine.setMouseoverTarget(null)}
                              >
                                <div
                                  className="mobile-frame-health"
                                  style={{
                                    width: `${healthPercent}%`,
                                    backgroundColor: healthPercent > 50 ? '#00cc00' : healthPercent > 25 ? '#cccc00' : '#cc0000',
                                  }}
                                />
                                {/* Mobile healer mana bar */}
                                {isHealer && healerMana && (
                                  <div
                                    className="mobile-frame-mana"
                                    style={{ width: `${manaPercent}%` }}
                                  />
                                )}
                                <div className="mobile-frame-content">
                                  <span
                                    className="mobile-frame-name"
                                    style={{ color: CLASS_COLORS[member.class] }}
                                  >
                                    {member.name.substring(0, 6)}
                                    {isPlayer && <span className="you-tag">★</span>}
                                  </span>
                                  <span className="mobile-frame-hp">
                                    {member.isAlive ? Math.floor(member.currentHealth) : 'DEAD'}
                                  </span>
                                </div>
                                {member.debuffs.length > 0 && (
                                  <div className="mobile-debuff-indicator" />
                                )}
                                {/* Living Bomb - tap to move to safe zone */}
                                {hasLivingBomb && (
                                  <button
                                    className="mobile-living-bomb-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEvacuatedMembers(prev => new Set([...prev, member.id]));
                                      engine.setMemberInSafeZone(member.id, true);
                                    }}
                                  >
                                    MOVE! {Math.ceil(livingBombDebuff?.duration || 0)}s
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Safe Zone for Living Bomb */}
                {state.boss?.id === 'baron_geddon' && evacuatedMembers.size > 0 && (
                  <div className="mobile-safe-zone">
                    <div className="safe-zone-label">SAFE ZONE</div>
                    <div className="safe-zone-members">
                      {Array.from(evacuatedMembers).map(memberId => {
                        const member = state.raid.find(m => m.id === memberId);
                        if (!member) return null;
                        const livingBombDebuff = member.debuffs.find(d => d.id === 'living_bomb');

                        return (
                          <div key={memberId} className="mobile-evacuated-member">
                            <span style={{ color: CLASS_COLORS[member.class] }}>{member.name.substring(0, 6)}</span>
                            {livingBombDebuff && <span className="countdown">{Math.ceil(livingBombDebuff.duration)}s</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mobile Action Bar - Right under raid frames */}
                <div className="mobile-action-bar-inline">
                  {actionBar.map((spell) => {
                    const isOnCooldown = spell.currentCooldown > 0;
                    const isOnGCD = state.globalCooldown > 0 && spell.isOnGlobalCooldown;
                    const notEnoughMana = state.playerMana < spell.manaCost;
                    const isDisabled = isOnCooldown || isOnGCD || notEnoughMana || state.isCasting;

                    return (
                      <div
                        key={spell.id}
                        className={`mobile-spell ${isDisabled ? 'disabled' : ''}`}
                        onClick={() => !isDisabled && engine.castSpell(spell)}
                      >
                        <img src={spell.icon} alt={spell.name} />
                        {isOnCooldown && (
                          <div className="mobile-cooldown">{Math.ceil(spell.currentCooldown)}</div>
                        )}
                        {notEnoughMana && !isOnCooldown && (
                          <div className="mobile-no-mana" />
                        )}
                      </div>
                    );
                  })}
                  {/* Mana Potion */}
                  <div
                    className={`mobile-spell ${state.manaPotionCooldown > 0 ? 'disabled' : ''}`}
                    onClick={() => engine.useManaPotion()}
                  >
                    <img src="/icons/inv_potion_76.jpg" alt="Mana Potion" />
                    {state.manaPotionCooldown > 0 && (
                      <div className="mobile-cooldown">{Math.ceil(state.manaPotionCooldown)}</div>
                    )}
                  </div>
                  {/* Bag Button - only when not in encounter */}
                  {!state.isRunning && (
                    <div
                      className={`mobile-spell mobile-bag-btn ${state.legendaryMaterials.length > 0 ? 'has-items' : ''}`}
                      onClick={() => setShowInventory(true)}
                    >
                      <img src="/icons/inv_misc_bag_08.jpg" alt="Bags" />
                      {state.legendaryMaterials.length > 0 && (
                        <div className="mobile-bag-count">{state.legendaryMaterials.length}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile Totem Bar - Right under action bar (Shaman only) */}
                {state.playerClass === 'shaman' && (
                  <div className="mobile-totem-bar-inline">
                    {(['earth', 'fire', 'water', 'air'] as TotemElement[]).map(element => {
                      const activeTotem = state.activeTotems.find(t => t.element === element);
                      const availableTotems = TOTEMS_BY_ELEMENT[element];
                      const elementColors: Record<TotemElement, string> = {
                        earth: '#8B4513',
                        fire: '#FF4500',
                        water: '#1E90FF',
                        air: '#87CEEB'
                      };

                      return (
                        <div key={element} className="mobile-totem-element-inline" style={{ borderColor: elementColors[element] }}>
                          <div className="mobile-totem-label-inline" style={{ color: elementColors[element] }}>
                            {element.charAt(0).toUpperCase()}
                          </div>
                          <div className="mobile-totem-buttons-inline">
                            {availableTotems.slice(0, 3).map(totem => {
                              const isActive = activeTotem?.id === totem.id;
                              const cooldown = state.totemCooldowns.find(tc => tc.totemId === totem.id);
                              const isOnCooldown = cooldown && cooldown.remainingCooldown > 0;
                              const notEnoughMana = state.playerMana < totem.manaCost;
                              const isDisabled = isOnCooldown || notEnoughMana || state.globalCooldown > 0 || state.isCasting;

                              return (
                                <div
                                  key={totem.id}
                                  className={`mobile-totem-inline ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                                  onClick={() => !isDisabled && engine.dropTotem(totem.id)}
                                >
                                  <img src={totem.icon} alt={totem.name} />
                                  {isActive && activeTotem && (
                                    <div className="mobile-totem-timer-inline">{Math.ceil(activeTotem.remainingDuration)}</div>
                                  )}
                                  {isOnCooldown && cooldown && (
                                    <div className="mobile-cooldown">{Math.ceil(cooldown.remainingCooldown)}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Mobile Healing Meter - Show during encounters */}
                {state.isRunning && (
                  <div className="mobile-raid-meter">
                    <RaidMeter
                      playerHealing={state.healingDone}
                      playerDispels={state.dispelsDone}
                      playerSpellBreakdown={state.spellHealing}
                      playerName={state.playerName}
                      playerClass={state.playerClass}
                      aiHealerStats={state.aiHealerStats}
                      showAiHealers={state.otherHealersEnabled}
                      isMultiplayer={isMultiplayerMode}
                      hidePlayer={state.isRaidLeaderMode}
                      multiplayerHealers={Object.entries(multiplayerHealingStats)
                        .filter(([id]) => id !== (localPlayer?.id || 'host'))
                        .map(([id, stats]) => ({
                          id,
                          name: stats.name,
                          healingDone: stats.healingDone,
                          dispelsDone: stats.dispelsDone,
                          class: stats.class as 'paladin' | 'shaman' | 'priest' | 'druid',
                          isPlayer: false,
                        }))}
                    />
                  </div>
                )}

                {/* Mobile Encounter Summary - Show after boss kill or wipe */}
                {!state.isRunning && state.lastEncounterResult && (
                  <div className="mobile-encounter-summary">
                    <div className="encounter-summary-header">
                      <span className={`encounter-result ${state.lastEncounterResult}`}>
                        {state.lastEncounterResult === 'victory' ? 'VICTORY!' : 'WIPE'}
                      </span>
                      <button
                        className="dismiss-summary-btn"
                        onClick={() => engine.clearEncounterResult()}
                      >
                        ×
                      </button>
                    </div>
                    <div className="mobile-raid-meter">
                      <RaidMeter
                        playerHealing={state.healingDone}
                        playerDispels={state.dispelsDone}
                        playerSpellBreakdown={state.spellHealing}
                        playerName={state.playerName}
                        playerClass={state.playerClass}
                        aiHealerStats={state.aiHealerStats}
                        showAiHealers={state.otherHealersEnabled}
                        isMultiplayer={isMultiplayerMode}
                        hidePlayer={state.isRaidLeaderMode}
                        multiplayerHealers={Object.entries(multiplayerHealingStats)
                          .filter(([id]) => id !== (localPlayer?.id || 'host'))
                          .map(([id, stats]) => ({
                            id,
                            name: stats.name,
                            healingDone: stats.healingDone,
                            dispelsDone: stats.dispelsDone,
                            class: stats.class as 'paladin' | 'shaman' | 'priest' | 'druid',
                            isPlayer: false,
                          }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buffs Tab */}
            {mobileTab === 'buffs' && !state.isRunning && (
              <div className="mobile-buffs-container">
                {/* Paladin Blessings (Alliance only) */}
                {state.faction === 'alliance' && (
                  <div className="mobile-section">
                    <div className="mobile-section-header">
                      Blessings ({state.activePaladinBlessings.length}/{state.maxPaladinBlessings})
                    </div>
                    <div className="mobile-blessings-grid">
                      {engine.getPaladinBlessings().map(({ buff, isAssigned }) => (
                        <div
                          key={buff.id}
                          className={`mobile-blessing ${isAssigned ? 'active' : ''}`}
                          onClick={() => engine.togglePaladinBlessing(buff.id)}
                        >
                          <img src={buff.icon} alt={buff.name} />
                          {isAssigned && <div className="mobile-check">✓</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raid Buffs */}
                <div className="mobile-section">
                  <div className="mobile-section-header">
                    Raid Buffs
                    <button className="mobile-buff-all" onClick={() => engine.applyAllRaidBuffs()}>All</button>
                  </div>
                  <div className="mobile-buffs-grid">
                    {engine.getAvailableBuffs().map(({ buff, available, hasBuff }) => (
                      <div
                        key={buff.id}
                        className={`mobile-buff ${hasBuff ? 'active' : ''} ${!available ? 'unavailable' : ''}`}
                        onClick={() => {
                          if (available) {
                            if (hasBuff) engine.removeRaidBuff(buff.id);
                            else engine.applyRaidBuff(buff.id);
                          }
                        }}
                      >
                        <img src={buff.icon} alt={buff.name} />
                        {hasBuff && <div className="mobile-check">✓</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consumables */}
                <div className="mobile-section">
                  <div className="mobile-section-header">
                    Consumables
                    <button className="mobile-buff-all" onClick={() => engine.applyConsumables()}>All</button>
                  </div>
                  <div className="mobile-buffs-grid">
                    {Object.values(CONSUMABLES)
                      .filter(c => c.role === 'healer')
                      .map(consume => {
                        const isActive = state.activeConsumables.includes(consume.id);
                        return (
                          <div
                            key={consume.id}
                            className={`mobile-buff ${isActive ? 'active' : ''}`}
                          >
                            <img src={consume.icon} alt={consume.name} />
                            {isActive && <div className="mobile-check">✓</div>}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* World Buffs */}
                <div className="mobile-section">
                  <div className="mobile-section-header">World Buffs</div>
                  <div className="mobile-buffs-grid">
                    {engine.getWorldBuffStatus().map(({ buff, isAvailable, isActive, isComingSoon }) => (
                      <div
                        key={buff.id}
                        className={`mobile-buff ${isActive ? 'active' : ''} ${!isAvailable || isComingSoon ? 'unavailable' : ''}`}
                        onClick={() => {
                          if (!isComingSoon && isAvailable) {
                            if (isActive) engine.clearWorldBuffs();
                            else engine.applyWorldBuff(buff.id);
                          }
                        }}
                      >
                        <img src={buff.icon} alt={buff.name} />
                        {isActive && <div className="mobile-check">✓</div>}
                        {isComingSoon && <div className="mobile-lock">🔒</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Log Tab */}
            {mobileTab === 'log' && (
              <div className="mobile-log-container">
                {state.combatLog.slice(-50).map((entry, idx) => (
                  <div key={idx} className={`mobile-log-entry log-${entry.type}`}>
                    <span className="mobile-log-time">
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`mobile-log-msg ${entry.isCrit ? 'crit' : ''}`}>{entry.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loot Modal */}
      {state.showLootModal && (
        <div className="modal-overlay">
          <div className="loot-modal">
            <div className="loot-modal-header">
              <h2>Loot Dropped!</h2>
              {state.isRaidLeaderMode ? (
                <span className="master-looter-badge">Master Looter</span>
              ) : (
                <span className="dkp-display">Your DKP: {state.playerDKP.points}</span>
              )}
              {/* Show bidding timer in multiplayer */}
              {isMultiplayerMode && state.lootBidTimer > 0 && (
                <span className="loot-bid-timer">
                  Bidding: {state.lootBidTimer}s
                </span>
              )}
            </div>
            {/* Legendary material notification - EPIC MOMENT! */}
            {state.lastObtainedLegendaryMaterial && (
              <div className="legendary-item-obtained">
                <img
                  src={LEGENDARY_MATERIALS[state.lastObtainedLegendaryMaterial].icon}
                  alt={LEGENDARY_MATERIALS[state.lastObtainedLegendaryMaterial].name}
                  className="legendary-item-icon"
                />
                <div className="legendary-item-info">
                  <span className="legendary-item-label">LEGENDARY!</span>
                  <span className="legendary-item-name legendary-text">
                    {LEGENDARY_MATERIALS[state.lastObtainedLegendaryMaterial].name}
                  </span>
                  <span className="legendary-item-desc">
                    {LEGENDARY_MATERIALS[state.lastObtainedLegendaryMaterial].description}
                  </span>
                </div>
                <button
                  className="legendary-send-to-bag-btn"
                  onClick={() => {
                    engine.clearLastObtainedLegendaryMaterial();
                  }}
                >
                  Send to Bag
                </button>
              </div>
            )}
            {/* Quest item notification - dragon heads sent to bag */}
            {state.lastObtainedQuestMaterial && (
              <div className="quest-item-obtained">
                <img
                  src={QUEST_MATERIALS[state.lastObtainedQuestMaterial].icon}
                  alt={QUEST_MATERIALS[state.lastObtainedQuestMaterial].name}
                  className="quest-item-icon"
                />
                <div className="quest-item-info">
                  <span className="quest-item-name epic-text">
                    {QUEST_MATERIALS[state.lastObtainedQuestMaterial].name}
                  </span>
                  <span className="quest-item-sent">Sent to your bag! Open inventory to turn in.</span>
                </div>
              </div>
            )}
            <div className="loot-items">
              {state.pendingLoot.map(item => {
                const cost = calculateDKPCost(item);
                const canAfford = state.playerDKP.points >= cost;
                const playerClass = state.faction === 'alliance' ? 'paladin' : 'shaman';
                // Use engine's canEquip which allows healers to wear any healer-category gear
                const canEquip = engine.canEquip(playerClass, item);
                const itemBids = state.lootBids[item.id] || [];
                const myPlayerId = localPlayer?.id || 'player';
                const hasPlayerBid = itemBids.some(b => b.playerId === myPlayerId);

                return (
                  <div key={item.id} className="loot-item">
                    <div className="loot-item-icon">
                      <img src={item.icon} alt={item.name} />
                    </div>
                    <div className="loot-item-info">
                      <div className="loot-item-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                        {item.name}
                      </div>
                      <div className="loot-item-slot">{item.slot} - iLvl {item.itemLevel}</div>
                      <div className="loot-item-stats">
                        {item.stats.intellect && <span>+{item.stats.intellect} Int</span>}
                        {item.stats.stamina && <span>+{item.stats.stamina} Sta</span>}
                        {item.stats.spellPower && <span>+{item.stats.spellPower} SP</span>}
                        {item.stats.healingPower && <span>+{item.stats.healingPower} Healing</span>}
                        {item.stats.mp5 && <span>+{item.stats.mp5} MP5</span>}
                        {item.stats.critChance && <span>+{item.stats.critChance}% Crit</span>}
                      </div>
                      {!canEquip && !state.isRaidLeaderMode && <div className="loot-item-warning">Cannot equip ({playerClass === 'paladin' ? 'Paladin' : 'Shaman'} cannot use)</div>}
                      {/* Show current bids in multiplayer */}
                      {isMultiplayerMode && itemBids.length > 0 && (
                        <div className="loot-item-bids">
                          <span className="bid-count">{itemBids.length} bid{itemBids.length > 1 ? 's' : ''}</span>
                          {hasPlayerBid && <span className="your-bid">(You bid)</span>}
                        </div>
                      )}
                    </div>
                    <div className="loot-item-actions">
                      {!state.isRaidLeaderMode && <div className="loot-item-cost">{cost} DKP</div>}
                      {state.isRaidLeaderMode ? (
                        // Raid Leader Mode: Master Looter dropdown
                        (() => {
                          const eligibleMembers = engine.getEligibleMembersForItem(item);
                          return (
                            <div className="master-looter-controls">
                              <select
                                className="master-looter-select"
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    engine.awardLootToMember(item.id, e.target.value);
                                  }
                                }}
                              >
                                <option value="" disabled>Assign to...</option>
                                {eligibleMembers.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.class}){m.isUpgrade ? ' ★' : ''}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="disenchant-btn"
                                onClick={() => engine.disenchantLoot(item.id)}
                                title="Disenchant into Nexus Crystal"
                              >
                                DE
                              </button>
                            </div>
                          );
                        })()
                      ) : isMultiplayerMode ? (
                        // Multiplayer: Need/Pass buttons that send to host
                        <>
                          <button
                            className={`need-btn ${hasPlayerBid ? 'active' : ''}`}
                            disabled={!canAfford || !canEquip || state.lootBidTimer <= 0}
                            onClick={() => {
                              if (!hasPlayerBid) {
                                // Send bid to host
                                if (mpChannelRef.current) {
                                  mpChannelRef.current.send({
                                    type: 'broadcast',
                                    event: 'action',
                                    payload: {
                                      type: 'loot_bid',
                                      itemId: item.id,
                                      playerId: myPlayerId,
                                      playerName: localPlayer?.player_name || state.playerName,
                                      playerClass: playerClass,
                                      dkp: state.playerDKP.points,
                                    }
                                  });
                                }
                                // If we're the host, also add locally
                                if (localPlayer?.is_host) {
                                  engine.addLootBid(item.id, myPlayerId, localPlayer?.player_name || state.playerName, playerClass, state.playerDKP.points);
                                }
                              }
                            }}
                          >
                            {hasPlayerBid ? 'Bidding' : 'Need'}
                          </button>
                          <button
                            className="pass-btn"
                            disabled={state.lootBidTimer <= 0}
                            onClick={() => {
                              // Send pass to host
                              if (mpChannelRef.current) {
                                mpChannelRef.current.send({
                                  type: 'broadcast',
                                  event: 'action',
                                  payload: {
                                    type: 'loot_pass',
                                    itemId: item.id,
                                    playerId: myPlayerId,
                                  }
                                });
                              }
                              // If we're the host, also remove locally
                              if (localPlayer?.is_host) {
                                engine.removeLootBid(item.id, myPlayerId);
                              }
                            }}
                          >
                            Pass
                          </button>
                        </>
                      ) : (
                        // Solo mode: direct claim/pass
                        <>
                          <button
                            className="claim-btn"
                            disabled={!canAfford || !canEquip}
                            onClick={() => engine.claimLoot(item.id)}
                          >
                            Claim
                          </button>
                          <button
                            className="pass-btn"
                            onClick={() => engine.passLoot(item.id)}
                          >
                            Pass
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="loot-modal-footer">
              {isMultiplayerMode && state.lootBidTimer > 0 ? (
                <span className="loot-bidding-info">Waiting for all players to bid...</span>
              ) : (
                <button className="close-btn" onClick={() => handleLootComplete('closeLoot')}>
                  Close (Pass All)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loot Results Modal (shown after bidding resolves in multiplayer) */}
      {state.lootResults.length > 0 && (
        <div className="modal-overlay">
          <div className="loot-results-modal">
            <div className="loot-results-header">
              <h2>Loot Awarded!</h2>
            </div>
            <div className="loot-results-list">
              {state.lootResults.map(result => (
                <div key={result.itemId} className="loot-result-item">
                  <span className="item-name" style={{ color: '#a335ee' }}>{result.itemName}</span>
                  <div className="winner-info">
                    <span className="winner-name" style={{ color: CLASS_COLORS[result.winnerClass] }}>
                      {result.winnerName}
                      {result.winnerId === (localPlayer?.id || 'player') && ' (You)'}
                    </span>
                    <div className="win-info">
                      {result.dkpSpent} DKP
                      {result.roll && <span className="roll-info"> (Roll: {result.roll})</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="loot-results-footer">
              <button className="close-btn" onClick={() => handleLootComplete('clearResults')}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weapon Slot Choice Modal (for dual-wielders) */}
      {state.pendingWeaponAssignment && (
        <div className="modal-overlay">
          <div className="weapon-slot-modal">
            <div className="weapon-slot-header">
              <h2>Choose Weapon Slot</h2>
              <p>Which weapon should <strong>{state.pendingWeaponAssignment.memberName}</strong> replace?</p>
            </div>
            <div className="weapon-slot-new-item">
              <span className="weapon-slot-label">New Item:</span>
              <div className="weapon-slot-item" style={{ borderColor: state.pendingWeaponAssignment.item.rarity === 'epic' ? '#a335ee' : '#0070dd' }}>
                <img src={state.pendingWeaponAssignment.item.icon} alt={state.pendingWeaponAssignment.item.name} className="weapon-slot-icon" />
                <span className="weapon-slot-name" style={{ color: state.pendingWeaponAssignment.item.rarity === 'epic' ? '#a335ee' : '#0070dd' }}>
                  {state.pendingWeaponAssignment.item.name}
                </span>
                <span className="weapon-slot-ilvl">iLvl {state.pendingWeaponAssignment.item.itemLevel}</span>
              </div>
            </div>
            <div className="weapon-slot-choices">
              <button
                className="weapon-slot-choice"
                onClick={() => engine.completeWeaponAssignment('weapon')}
              >
                <span className="slot-label">Main Hand</span>
                {state.pendingWeaponAssignment.mainHandItem ? (
                  <div className="weapon-slot-current">
                    <img src={state.pendingWeaponAssignment.mainHandItem.icon} alt={state.pendingWeaponAssignment.mainHandItem.name} className="weapon-slot-icon" />
                    <div className="weapon-slot-info">
                      <span className="weapon-slot-name" style={{ color: state.pendingWeaponAssignment.mainHandItem.rarity === 'epic' ? '#a335ee' : state.pendingWeaponAssignment.mainHandItem.rarity === 'rare' ? '#0070dd' : '#1eff00' }}>
                        {state.pendingWeaponAssignment.mainHandItem.name}
                      </span>
                      <span className="weapon-slot-ilvl">iLvl {state.pendingWeaponAssignment.mainHandItem.itemLevel}</span>
                    </div>
                  </div>
                ) : (
                  <span className="weapon-slot-empty">Empty</span>
                )}
              </button>
              <button
                className="weapon-slot-choice"
                onClick={() => engine.completeWeaponAssignment('offhand')}
              >
                <span className="slot-label">Off Hand</span>
                {state.pendingWeaponAssignment.offHandItem ? (
                  <div className="weapon-slot-current">
                    <img src={state.pendingWeaponAssignment.offHandItem.icon} alt={state.pendingWeaponAssignment.offHandItem.name} className="weapon-slot-icon" />
                    <div className="weapon-slot-info">
                      <span className="weapon-slot-name" style={{ color: state.pendingWeaponAssignment.offHandItem.rarity === 'epic' ? '#a335ee' : state.pendingWeaponAssignment.offHandItem.rarity === 'rare' ? '#0070dd' : '#1eff00' }}>
                        {state.pendingWeaponAssignment.offHandItem.name}
                      </span>
                      <span className="weapon-slot-ilvl">iLvl {state.pendingWeaponAssignment.offHandItem.itemLevel}</span>
                    </div>
                  </div>
                ) : (
                  <span className="weapon-slot-empty">Empty</span>
                )}
              </button>
            </div>
            <div className="weapon-slot-footer">
              <button className="cancel-btn" onClick={() => engine.cancelWeaponAssignment()}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Downgrade Confirmation Modal */}
      {state.pendingDowngradeConfirmation && (
        <div className="modal-overlay">
          <div className="weapon-slot-modal downgrade-confirm-modal">
            <div className="weapon-slot-header">
              <h2>Replace Better Item?</h2>
              <p><strong>{state.pendingDowngradeConfirmation.memberName}</strong> already has a better or equal item equipped.</p>
            </div>
            <div className="downgrade-comparison">
              <div className="downgrade-item current">
                <span className="downgrade-label">Currently Equipped:</span>
                <div className="weapon-slot-item" style={{ borderColor: state.pendingDowngradeConfirmation.currentItem.rarity === 'epic' ? '#a335ee' : state.pendingDowngradeConfirmation.currentItem.rarity === 'rare' ? '#0070dd' : '#1eff00' }}>
                  <img src={state.pendingDowngradeConfirmation.currentItem.icon} alt={state.pendingDowngradeConfirmation.currentItem.name} className="weapon-slot-icon" />
                  <div className="weapon-slot-info">
                    <span className="weapon-slot-name" style={{ color: state.pendingDowngradeConfirmation.currentItem.rarity === 'epic' ? '#a335ee' : state.pendingDowngradeConfirmation.currentItem.rarity === 'rare' ? '#0070dd' : '#1eff00' }}>
                      {state.pendingDowngradeConfirmation.currentItem.name}
                    </span>
                    <span className="weapon-slot-ilvl">iLvl {state.pendingDowngradeConfirmation.currentItem.itemLevel}</span>
                  </div>
                </div>
              </div>
              <div className="downgrade-arrow">→</div>
              <div className="downgrade-item new">
                <span className="downgrade-label">New Item:</span>
                <div className="weapon-slot-item" style={{ borderColor: state.pendingDowngradeConfirmation.item.rarity === 'epic' ? '#a335ee' : state.pendingDowngradeConfirmation.item.rarity === 'rare' ? '#0070dd' : '#1eff00' }}>
                  <img src={state.pendingDowngradeConfirmation.item.icon} alt={state.pendingDowngradeConfirmation.item.name} className="weapon-slot-icon" />
                  <div className="weapon-slot-info">
                    <span className="weapon-slot-name" style={{ color: state.pendingDowngradeConfirmation.item.rarity === 'epic' ? '#a335ee' : state.pendingDowngradeConfirmation.item.rarity === 'rare' ? '#0070dd' : '#1eff00' }}>
                      {state.pendingDowngradeConfirmation.item.name}
                    </span>
                    <span className="weapon-slot-ilvl">iLvl {state.pendingDowngradeConfirmation.item.itemLevel}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="downgrade-warning">
              {state.pendingDowngradeConfirmation.currentItem.itemLevel > state.pendingDowngradeConfirmation.item.itemLevel
                ? `This is a DOWNGRADE (iLvl ${state.pendingDowngradeConfirmation.currentItem.itemLevel} → ${state.pendingDowngradeConfirmation.item.itemLevel})`
                : `Same item level (iLvl ${state.pendingDowngradeConfirmation.item.itemLevel})`
              }
            </div>
            <div className="weapon-slot-footer">
              <button className="cancel-btn" onClick={() => engine.cancelDowngradeConfirmation()}>
                Cancel
              </button>
              <button className="confirm-btn danger" onClick={() => engine.confirmDowngradeAssignment()}>
                Replace Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Panel */}
      {state.inspectedMember && (() => {
        // Build dynamic slot list based on class
        const memberClass = state.inspectedMember.class;
        const armorSlots: EquipmentSlot[] = ['head', 'neck', 'shoulders', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet'];
        const accessorySlots: EquipmentSlot[] = ['ring1', 'ring2', 'trinket1', 'trinket2'];
        const weaponSlots: EquipmentSlot[] = ['weapon'];
        if (['warrior', 'rogue', 'paladin', 'shaman', 'priest', 'mage', 'warlock', 'druid'].includes(memberClass)) {
          weaponSlots.push('offhand');
        }
        weaponSlots.push('ranged');
        const allSlots = [...armorSlots, ...accessorySlots, ...weaponSlots];

        const formatSlotName = (slot: string) => {
          if (slot === 'ring1') return 'Ring 1';
          if (slot === 'ring2') return 'Ring 2';
          if (slot === 'trinket1') return 'Trinket 1';
          if (slot === 'trinket2') return 'Trinket 2';
          return slot.charAt(0).toUpperCase() + slot.slice(1);
        };

        // Calculate actual healing power from gear + enchants
        const calculateMemberHealingPower = (equipment: Equipment): number => {
          let healingPower = 0;
          Object.values(equipment).forEach(item => {
            if (item) {
              healingPower += (item.stats.healingPower || 0) + (item.stats.spellPower || 0);
              if (item.enchantId) {
                const enchant = ENCHANTS[item.enchantId as EnchantId];
                if (enchant?.stats) {
                  healingPower += (enchant.stats.healingPower || 0) + (enchant.stats.spellPower || 0);
                }
              }
            }
          });
          return healingPower;
        };

        const selectedItem = selectedInspectSlot ? state.inspectedMember.equipment[selectedInspectSlot] : null;
        const selectedEnchant = selectedItem?.enchantId ? ENCHANTS[selectedItem.enchantId as EnchantId] : null;

        return (
          <div className="modal-overlay" onClick={() => { engine.closeInspection(); setSelectedInspectSlot(null); }}>
            <div className="inspection-panel" onClick={e => e.stopPropagation()}>
              <div className="inspection-header">
                <h2 style={{ color: CLASS_COLORS[state.inspectedMember.class] }}>
                  {state.inspectedMember.name}
                </h2>
                <span className="inspection-class">{state.inspectedMember.class.charAt(0).toUpperCase() + state.inspectedMember.class.slice(1)}</span>
                <span className="inspection-role">{state.inspectedMember.role}</span>
                <button className="close-inspection" onClick={() => { engine.closeInspection(); setSelectedInspectSlot(null); }}>X</button>
              </div>
              <div className="inspection-gear-score">
                Gear Score: {state.inspectedMember.gearScore}
              </div>

              <div className="inspection-content">
                {/* Left: Equipment List */}
                <div className="equipment-list">
                  {allSlots.map(slot => {
                    const item = state.inspectedMember!.equipment[slot];
                    const hasEnchant = item?.enchantId;
                    return (
                      <div
                        key={slot}
                        className={`equipment-slot clickable ${selectedInspectSlot === slot ? 'selected' : ''}`}
                        onClick={() => setSelectedInspectSlot(slot)}
                      >
                        {item ? (
                          <img src={item.icon} className={`slot-icon ${item.isPreRaidBis ? 'pre-raid-bis' : ''}`} alt="" />
                        ) : (
                          <div className="slot-icon empty" />
                        )}
                        <span className="slot-name">{formatSlotName(slot)}:</span>
                        <span className="slot-item" style={{ color: item ? RARITY_COLORS[item.rarity] : '#666' }}>
                          {item?.name || 'Empty'}
                        </span>
                        {hasEnchant && <span className="enchant-indicator">✦</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Right: Item Details */}
                <div className="item-detail-panel">
                  {selectedItem ? (
                    <>
                      <div className="detail-header">
                        <img src={selectedItem.icon} className="detail-icon" alt="" />
                        <div>
                          <div className="detail-name" style={{ color: RARITY_COLORS[selectedItem.rarity] }}>
                            {selectedItem.name}
                          </div>
                          <div className="detail-meta">
                            {selectedItem.rarity.charAt(0).toUpperCase() + selectedItem.rarity.slice(1)} - Item Level {selectedItem.itemLevel}
                          </div>
                          <div className="detail-slot">{formatSlotName(selectedInspectSlot!)}</div>
                        </div>
                      </div>

                      <div className="detail-stats">
                        {selectedItem.stats.armor && <div>+{selectedItem.stats.armor} Armor</div>}
                        {selectedItem.stats.stamina && <div>+{selectedItem.stats.stamina} Stamina</div>}
                        {selectedItem.stats.intellect && <div>+{selectedItem.stats.intellect} Intellect</div>}
                        {selectedItem.stats.spirit && <div>+{selectedItem.stats.spirit} Spirit</div>}
                        {selectedItem.stats.strength && <div>+{selectedItem.stats.strength} Strength</div>}
                        {selectedItem.stats.agility && <div>+{selectedItem.stats.agility} Agility</div>}
                        {selectedItem.stats.healingPower && <div className="stat-healing">+{selectedItem.stats.healingPower} Healing</div>}
                        {selectedItem.stats.spellPower && <div className="stat-healing">+{selectedItem.stats.spellPower} Spell Power</div>}
                        {selectedItem.stats.attackPower && <div className="stat-attack">+{selectedItem.stats.attackPower} Attack Power</div>}
                        {selectedItem.stats.mp5 && <div className="stat-mana">+{selectedItem.stats.mp5} MP5</div>}
                        {selectedItem.stats.critChance && <div className="stat-crit">+{selectedItem.stats.critChance}% Crit</div>}
                        {selectedItem.stats.hitChance && <div className="stat-hit">+{selectedItem.stats.hitChance}% Hit</div>}
                        {selectedItem.stats.defense && <div className="stat-defense">+{selectedItem.stats.defense} Defense</div>}
                        {selectedItem.stats.dodge && <div className="stat-dodge">+{selectedItem.stats.dodge}% Dodge</div>}
                        {selectedItem.stats.fireResistance && <div className="stat-fire">+{selectedItem.stats.fireResistance} Fire Resistance</div>}
                        {selectedItem.stats.frostResistance && <div className="stat-frost">+{selectedItem.stats.frostResistance} Frost Resistance</div>}
                        {selectedItem.stats.shadowResistance && <div className="stat-shadow">+{selectedItem.stats.shadowResistance} Shadow Resistance</div>}
                        {selectedItem.stats.natureResistance && <div className="stat-nature">+{selectedItem.stats.natureResistance} Nature Resistance</div>}
                        {selectedItem.stats.arcaneResistance && <div className="stat-arcane">+{selectedItem.stats.arcaneResistance} Arcane Resistance</div>}
                        {selectedItem.stats.allResistance && <div className="stat-resist-all">+{selectedItem.stats.allResistance} All Resistances</div>}
                      </div>

                      {selectedEnchant && (
                        <div className="detail-enchant">
                          <div className="enchant-divider" />
                          <div className="enchant-label">Enchanted:</div>
                          <div className="enchant-name">{selectedEnchant.name}</div>
                          <div className="enchant-stats">
                            {selectedEnchant.stats.healingPower && <div>+{selectedEnchant.stats.healingPower} Healing</div>}
                            {selectedEnchant.stats.spellPower && <div>+{selectedEnchant.stats.spellPower} Spell Power</div>}
                            {selectedEnchant.stats.intellect && <div>+{selectedEnchant.stats.intellect} Intellect</div>}
                            {selectedEnchant.stats.stamina && <div>+{selectedEnchant.stats.stamina} Stamina</div>}
                            {selectedEnchant.stats.mp5 && <div>+{selectedEnchant.stats.mp5} MP5</div>}
                            {selectedEnchant.stats.critChance && <div>+{selectedEnchant.stats.critChance}% Crit</div>}
                            {selectedEnchant.stats.agility && <div>+{selectedEnchant.stats.agility} Agility</div>}
                            {selectedEnchant.stats.strength && <div>+{selectedEnchant.stats.strength} Strength</div>}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-selection">Select an item to view details</div>
                  )}
                </div>
              </div>

              {state.inspectedMember.role === 'healer' && (
                <div className="inspection-stats">
                  <h3>Healer Stats</h3>
                  <div className="stat-row">
                    <span>Bonus Healing from Gear:</span>
                    <span className="stat-value">+{calculateMemberHealingPower(state.inspectedMember.equipment)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="save-modal" onClick={e => e.stopPropagation()}>
            <div className="save-modal-header">
              <h2>Save Game</h2>
              <button className="close-inspection" onClick={() => setShowSaveModal(false)}>X</button>
            </div>
            <div className="save-modal-content">
              {!currentUser ? (
                <p className="save-login-hint">Login to save your progress to the cloud</p>
              ) : (
                <p className="save-description">Save your current progress to the cloud</p>
              )}
              <div className="save-modal-actions">
                <button
                  className="save-confirm-btn"
                  disabled={!currentUser || !currentCharacterId}
                  onClick={async () => {
                    if (currentUser && currentCharacterId) {
                      setCloudSyncStatus('syncing');
                      const saveData = engine.exportSaveData();
                      const success = await saveToCloud(currentCharacterId, saveData);
                      setCloudSyncStatus(success ? 'saved' : 'error');
                      setTimeout(() => setCloudSyncStatus(null), 3000);
                      setShowSaveModal(false);
                    }
                  }}
                >
                  {currentUser ? 'Save to Cloud' : 'Login Required'}
                </button>
                <button className="save-cancel-btn" onClick={() => setShowSaveModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
            {/* Export to File Section */}
            <div className="export-section">
              <h3>Export to File</h3>
              <p className="export-description">Download your current save as a file to backup or share.</p>
              {importExportStatus && (
                <div className={`import-export-status ${importExportStatus.type}`}>
                  {importExportStatus.type === 'success' ? '✓' : '✗'} {importExportStatus.message}
                </div>
              )}
              <button
                className="export-btn"
                onClick={() => {
                  engine.exportCurrentGameToFile();
                  setImportExportStatus({ message: `Exported save to file!`, type: 'success' });
                  setTimeout(() => setImportExportStatus(null), 4000);
                }}
              >
                Export Save to File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="load-modal" onClick={e => e.stopPropagation()}>
            <div className="load-modal-header">
              <h2>Load Game</h2>
              <button className="close-inspection" onClick={() => setShowLoadModal(false)}>X</button>
            </div>
            <div className="load-modal-content">
              <p className="load-description">Import a save file to load your progress.</p>
              {importExportStatus && (
                <div className={`import-export-status ${importExportStatus.type}`}>
                  {importExportStatus.type === 'success' ? '✓' : '✗'} {importExportStatus.message}
                </div>
              )}
              <div className="import-section">
                <label className="import-btn">
                  Import Save from File
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          await engine.importGameFromFile(file);
                          setImportExportStatus({ message: `Save imported successfully!`, type: 'success' });
                          setShowLoadModal(false);
                        } catch (err) {
                          setImportExportStatus({ message: err instanceof Error ? err.message : 'Import failed', type: 'error' });
                        }
                        setTimeout(() => setImportExportStatus(null), 4000);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="load-modal-footer">
              <button className="load-cancel-btn" onClick={() => {
                setShowLoadModal(false);
                setImportExportStatus(null);
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-dialog-header">
              <h2>{confirmDialog.title}</h2>
              <button className="close-inspection" onClick={() => setConfirmDialog(null)}>X</button>
            </div>
            <div className="confirm-dialog-content">
              {confirmDialog.warningText && (
                <p className="confirm-warning">{confirmDialog.warningText}</p>
              )}
              <p className="confirm-message">{confirmDialog.message}</p>
            </div>
            <div className="confirm-dialog-actions">
              <button
                className="confirm-btn-cancel"
                onClick={() => setConfirmDialog(null)}
              >
                {confirmDialog.cancelLabel || 'Cancel'}
              </button>
              <button
                className="confirm-btn-confirm"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kick Raid Member Confirmation Modal */}
      {kickConfirmMember && (
        <div className="modal-overlay" onClick={() => setKickConfirmMember(null)}>
          <div className="confirm-dialog kick-confirm" onClick={e => e.stopPropagation()}>
            <div className="confirm-dialog-header">
              <h2>Kick {kickConfirmMember.name}?</h2>
              <button className="close-inspection" onClick={() => setKickConfirmMember(null)}>X</button>
            </div>
            <div className="confirm-dialog-content">
              <p className="confirm-warning kick-warning">⚠️ WARNING: This action cannot be undone!</p>
              <p className="confirm-message">
                Kicking {kickConfirmMember.name} will permanently remove them from your raid team.
                <strong> All their gear will be lost forever.</strong>
              </p>
              <p className="confirm-hint">
                Consider swapping them to the bench instead if you want to keep their gear.
              </p>
            </div>
            <div className="confirm-dialog-actions">
              <button
                className="confirm-btn-cancel"
                onClick={() => setKickConfirmMember(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn-confirm kick-confirm-btn"
                onClick={() => {
                  engine.kickRaidMember(kickConfirmMember.id);
                  setKickConfirmMember(null);
                }}
              >
                Kick Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Bench Player Confirmation Modal */}
      {removeBenchConfirm && (
        <div className="modal-overlay" onClick={() => setRemoveBenchConfirm(null)}>
          <div className="confirm-dialog kick-confirm" onClick={e => e.stopPropagation()}>
            <div className="confirm-dialog-header">
              <h2>Remove {removeBenchConfirm.name} from Bench?</h2>
              <button className="close-inspection" onClick={() => setRemoveBenchConfirm(null)}>X</button>
            </div>
            <div className="confirm-dialog-content">
              <p className="confirm-warning kick-warning">⚠️ WARNING: This action cannot be undone!</p>
              <p className="confirm-message">
                Removing {removeBenchConfirm.name} from the bench will permanently delete them.
                <strong> All their gear will be lost forever.</strong>
              </p>
            </div>
            <div className="confirm-dialog-actions">
              <button
                className="confirm-btn-cancel"
                onClick={() => setRemoveBenchConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn-confirm kick-confirm-btn"
                onClick={() => {
                  engine.removeBenchPlayer(removeBenchConfirm.id);
                  setRemoveBenchConfirm(null);
                }}
              >
                Remove Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Golemagg Tank Assignment Modal */}
      {showGolemaggTankModal && (
        <div className="modal-overlay" onClick={() => setShowGolemaggTankModal(false)}>
          <div className="tank-assignment-modal" onClick={e => e.stopPropagation()}>
            <div className="tank-modal-header">
              <h2>Golemagg Tank Assignment</h2>
              <button className="close-inspection" onClick={() => setShowGolemaggTankModal(false)}>X</button>
            </div>
            <div className="tank-modal-content">
              <p className="tank-modal-description">
                This fight requires <strong>3 tanks</strong>. Two tanks will swap on Golemagg when Magma Splash stacks too high,
                while one tank handles both Core Ragers.
              </p>

              <div className="tank-assignment-row">
                <label>
                  <span className="tank-role-icon">🛡️</span>
                  Golemagg Tank 1 (Main):
                </label>
                <select
                  value={golemaggTank1}
                  onChange={e => {
                    const newValue = e.target.value;
                    if (newValue === golemaggTank2) {
                      setGolemaggTank2(golemaggTank1);
                    } else if (newValue === coreRagerTank) {
                      setCoreRagerTank(golemaggTank1);
                    }
                    setGolemaggTank1(newValue);
                  }}
                >
                  <option value="">-- Select Tank --</option>
                  {state.raid
                    .filter(m => m.role === 'tank' && m.isAlive)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.class})
                      </option>
                    ))}
                </select>
              </div>

              <div className="tank-assignment-row">
                <label>
                  <span className="tank-role-icon">🔄</span>
                  Golemagg Tank 2 (Swap):
                </label>
                <select
                  value={golemaggTank2}
                  onChange={e => {
                    const newValue = e.target.value;
                    if (newValue === golemaggTank1) {
                      setGolemaggTank1(golemaggTank2);
                    } else if (newValue === coreRagerTank) {
                      setCoreRagerTank(golemaggTank2);
                    }
                    setGolemaggTank2(newValue);
                  }}
                >
                  <option value="">-- Select Tank --</option>
                  {state.raid
                    .filter(m => m.role === 'tank' && m.isAlive)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.class})
                      </option>
                    ))}
                </select>
              </div>

              <div className="tank-assignment-row">
                <label>
                  <span className="tank-role-icon">🐕</span>
                  Core Rager Tank (Dogs):
                </label>
                <select
                  value={coreRagerTank}
                  onChange={e => {
                    const newValue = e.target.value;
                    if (newValue === golemaggTank1) {
                      setGolemaggTank1(coreRagerTank);
                    } else if (newValue === golemaggTank2) {
                      setGolemaggTank2(coreRagerTank);
                    }
                    setCoreRagerTank(newValue);
                  }}
                >
                  <option value="">-- Select Warrior --</option>
                  {state.raid
                    .filter(m => m.class === 'warrior' && m.isAlive)
                    .map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.role === 'tank' ? 'Tank' : 'DPS'})
                      </option>
                    ))}
                </select>
                <p className="tank-role-hint">Can be a DPS Warrior temporarily assigned as off-tank</p>
              </div>
            </div>
            <div className="tank-modal-actions">
              <button
                className="tank-modal-cancel"
                onClick={() => setShowGolemaggTankModal(false)}
              >
                Cancel
              </button>
              <button
                className="tank-modal-start"
                onClick={startGolemaggWithTanks}
                disabled={!golemaggTank1 || !golemaggTank2 || !coreRagerTank}
              >
                Start Fight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Majordomo Tank Assignment Modal */}
      {showMajordomoTankModal && (
        <div className="modal-overlay" onClick={() => setShowMajordomoTankModal(false)}>
          <div className="tank-assignment-modal majordomo-tank-modal" onClick={e => e.stopPropagation()}>
            <div className="tank-modal-header">
              <h2>Majordomo Tank Assignment</h2>
              <button className="close-inspection" onClick={() => setShowMajordomoTankModal(false)}>X</button>
            </div>
            <div className="tank-modal-content">
              <p className="tank-modal-description">
                This fight requires <strong>5 tanks</strong>. Majordomo himself cannot be attacked - kill all 8 adds to win.
                Each add tank will handle 2 adds. Warriors and Feral Druids can serve as temporary tanks.
              </p>

              <div className="tank-assignment-row">
                <label>
                  <span className="tank-role-icon">👑</span>
                  Majordomo Tank (Teleport):
                </label>
                <select
                  value={majordomoTank}
                  onChange={e => {
                    const newValue = e.target.value;
                    const oldValue = majordomoTank;
                    if (newValue === majordomoAddTank1) setMajordomoAddTank1(oldValue);
                    else if (newValue === majordomoAddTank2) setMajordomoAddTank2(oldValue);
                    else if (newValue === majordomoAddTank3) setMajordomoAddTank3(oldValue);
                    else if (newValue === majordomoAddTank4) setMajordomoAddTank4(oldValue);
                    setMajordomoTank(newValue);
                  }}
                >
                  <option value="">-- Select Tank --</option>
                  {state.raid
                    .filter(m => m.role === 'tank' && m.isAlive)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.class})
                      </option>
                    ))}
                </select>
                <p className="tank-role-hint">Gets Teleported into fire pit periodically</p>
              </div>

              <div className="tank-assignment-row">
                <label>
                  <span className="tank-role-icon">⚔️</span>
                  Add Tank 1 (Adds 1 & 2):
                </label>
                <select
                  value={majordomoAddTank1}
                  onChange={e => {
                    const newValue = e.target.value;
                    const oldValue = majordomoAddTank1;
                    if (newValue === majordomoTank) setMajordomoTank(oldValue);
                    else if (newValue === majordomoAddTank2) setMajordomoAddTank2(oldValue);
                    else if (newValue === majordomoAddTank3) setMajordomoAddTank3(oldValue);
                    else if (newValue === majordomoAddTank4) setMajordomoAddTank4(oldValue);
                    setMajordomoAddTank1(newValue);
                  }}
                >
                  <option value="">-- Select Tank --</option>
                  {state.raid
                    .filter(m => m.isAlive && (m.class === 'warrior' || (m.class === 'druid' && (m.spec === 'feral_tank' || m.spec === 'feral_dps'))))
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.class} - {t.role === 'tank' ? 'Tank' : t.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="tank-assignment-row">
                <label>
                  <span className="tank-role-icon">⚔️</span>
                  Add Tank 2 (Adds 3 & 4):
                </label>
                <select
                  value={majordomoAddTank2}
                  onChange={e => {
                    const newValue = e.target.value;
                    const oldValue = majordomoAddTank2;
                    if (newValue === majordomoTank) setMajordomoTank(oldValue);
                    else if (newValue === majordomoAddTank1) setMajordomoAddTank1(oldValue);
                    else if (newValue === majordomoAddTank3) setMajordomoAddTank3(oldValue);
                    else if (newValue === majordomoAddTank4) setMajordomoAddTank4(oldValue);
                    setMajordomoAddTank2(newValue);
                  }}
                >
                  <option value="">-- Select Tank --</option>
                  {state.raid
                    .filter(m => m.isAlive && (m.class === 'warrior' || (m.class === 'druid' && (m.spec === 'feral_tank' || m.spec === 'feral_dps'))))
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.class} - {t.role === 'tank' ? 'Tank' : t.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="tank-assignment-row">
                <label>
                  <span className="tank-role-icon">⚔️</span>
                  Add Tank 3 (Adds 5 & 6):
                </label>
                <select
                  value={majordomoAddTank3}
                  onChange={e => {
                    const newValue = e.target.value;
                    const oldValue = majordomoAddTank3;
                    if (newValue === majordomoTank) setMajordomoTank(oldValue);
                    else if (newValue === majordomoAddTank1) setMajordomoAddTank1(oldValue);
                    else if (newValue === majordomoAddTank2) setMajordomoAddTank2(oldValue);
                    else if (newValue === majordomoAddTank4) setMajordomoAddTank4(oldValue);
                    setMajordomoAddTank3(newValue);
                  }}
                >
                  <option value="">-- Select Tank --</option>
                  {state.raid
                    .filter(m => m.isAlive && (m.class === 'warrior' || (m.class === 'druid' && (m.spec === 'feral_tank' || m.spec === 'feral_dps'))))
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.class} - {t.role === 'tank' ? 'Tank' : t.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="tank-assignment-row">
                <label>
                  <span className="tank-role-icon">⚔️</span>
                  Add Tank 4 (Adds 7 & 8):
                </label>
                <select
                  value={majordomoAddTank4}
                  onChange={e => {
                    const newValue = e.target.value;
                    const oldValue = majordomoAddTank4;
                    if (newValue === majordomoTank) setMajordomoTank(oldValue);
                    else if (newValue === majordomoAddTank1) setMajordomoAddTank1(oldValue);
                    else if (newValue === majordomoAddTank2) setMajordomoAddTank2(oldValue);
                    else if (newValue === majordomoAddTank3) setMajordomoAddTank3(oldValue);
                    setMajordomoAddTank4(newValue);
                  }}
                >
                  <option value="">-- Select Tank --</option>
                  {state.raid
                    .filter(m => m.isAlive && (m.class === 'warrior' || (m.class === 'druid' && (m.spec === 'feral_tank' || m.spec === 'feral_dps'))))
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.class} - {t.role === 'tank' ? 'Tank' : t.role})
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="tank-modal-actions">
              <button
                className="tank-modal-cancel"
                onClick={() => setShowMajordomoTankModal(false)}
              >
                Cancel
              </button>
              <button
                className="tank-modal-start"
                onClick={startMajordomoWithTanks}
                disabled={!majordomoTank || !majordomoAddTank1 || !majordomoAddTank2 || !majordomoAddTank3 || !majordomoAddTank4}
              >
                Start Fight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ragnaros RP Intro Modal */}
      {showRagnarosRP && (
        <div className="ragnaros-rp-overlay">
          <div className="ragnaros-rp-container">
            <img
              src={RagDomoImage}
              alt="Ragnaros and Majordomo Executus"
              className="ragnaros-rp-image"
            />

            {/* Subtitle */}
            <div className="ragnaros-rp-subtitle" key={ragnarosRPDialogueIndex}>
              <span className={`rp-speaker ${RAGNAROS_RP_DIALOGUE[ragnarosRPDialogueIndex].speaker === 'Ragnaros' ? 'ragnaros' : 'majordomo'}`}>
                {RAGNAROS_RP_DIALOGUE[ragnarosRPDialogueIndex].speaker} yells:
              </span>
              <span className="rp-text">
                "{RAGNAROS_RP_DIALOGUE[ragnarosRPDialogueIndex].text}"
              </span>
            </div>

            {/* Countdown Bar */}
            <div className="ragnaros-rp-countdown">
              <div className="countdown-label">Ragnaros engages in {ragnarosRPTimeRemaining}s</div>
              <div className="countdown-bar">
                <div
                  className="countdown-fill"
                  style={{ width: `${((RP_DURATION - ragnarosRPTimeRemaining) / RP_DURATION) * 100}%` }}
                />
              </div>
            </div>

            {/* Skip Button */}
            <button className="ragnaros-rp-skip" onClick={handleRagnarosRPSkip}>
              Skip RP
            </button>
          </div>
        </div>
      )}

      {/* Ragnaros Tank Assignment Modal */}
      {showRagnarosTankModal && (
        <div className="modal-overlay" onClick={() => setShowRagnarosTankModal(false)}>
          <div className="tank-assignment-modal" onClick={e => e.stopPropagation()}>
            <div className="tank-modal-header">
              <h2>Ragnaros Tank Assignment</h2>
              <button className="close-inspection" onClick={() => setShowRagnarosTankModal(false)}>X</button>
            </div>
            <div className="tank-modal-content">
              <p className="tank-modal-description">
                This fight requires <strong>2 tanks</strong> that swap on Wrath of Ragnaros.
                After 3 minutes, Ragnaros submerges and 8 Sons of Flame spawn. Kill them within 90 seconds!
              </p>

              <div className="tank-assignment-row">
                <label>
                  <span className="tank-role-icon">🛡️</span>
                  Main Tank:
                </label>
                <select
                  value={ragnarosTank1}
                  onChange={e => {
                    const newValue = e.target.value;
                    if (newValue === ragnarosTank2) {
                      setRagnarosTank2(ragnarosTank1);
                    }
                    setRagnarosTank1(newValue);
                  }}
                >
                  <option value="">-- Select Tank --</option>
                  {state.raid
                    .filter(m => m.role === 'tank' && m.isAlive)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.class})
                      </option>
                    ))}
                </select>
                <p className="tank-role-hint">Primary tank - starts the fight</p>
              </div>

              <div className="tank-assignment-row">
                <label>
                  <span className="tank-role-icon">🔄</span>
                  Off-Tank (Wrath Swap):
                </label>
                <select
                  value={ragnarosTank2}
                  onChange={e => {
                    const newValue = e.target.value;
                    if (newValue === ragnarosTank1) {
                      setRagnarosTank1(ragnarosTank2);
                    }
                    setRagnarosTank2(newValue);
                  }}
                >
                  <option value="">-- Select Tank --</option>
                  {state.raid
                    .filter(m => m.role === 'tank' && m.isAlive)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.class})
                      </option>
                    ))}
                </select>
                <p className="tank-role-hint">Taunts when Main Tank gets Wrath of Ragnaros</p>
              </div>
            </div>
            <div className="tank-modal-actions">
              <button
                className="tank-modal-cancel"
                onClick={() => setShowRagnarosTankModal(false)}
              >
                Cancel
              </button>
              <button
                className="tank-modal-start"
                onClick={startRagnarosWithTanks}
                disabled={!ragnarosTank1 || !ragnarosTank2}
              >
                Start Fight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raid Group Manager Modal (also used for Raid Leader Setup) */}
      {/* Raid Leader Setup - Dedicated Component */}
      <RaidLeaderSetup
        isOpen={showRaidLeaderSetup}
        onStartRaid={() => {
          engine.recalculateAuras();
          // Trigger cloud save to persist the raid configuration and bench
          if (currentUser) {
            handleCloudSave();
          }
          setShowRaidLeaderSetup(false);
        }}
        engine={engine}
        state={state}
        faction={state.faction}
        raidSize={raidLeaderRaidSize}
      />

      {/* Regular Raid Group Manager (not for initial raid leader setup) */}
      {showRaidGroupManager && (
        <div className="modal-overlay" onClick={() => {
            setShowRaidGroupManager(false);
            setSelectedPaladinForAura(null);
            setDraggedMemberId(null);
            setSelectedMemberForClassSpec(null);
            setSelectedBenchPlayerForSwap(null);
            setShowAddToBenchModal(false);
        }}>
          <div className="raid-group-manager-modal" onClick={e => e.stopPropagation()}>
            <div className="rgm-header">
              <h2>Raid Group Manager</h2>
              <div className="rgm-tabs">
                <button
                  className={`rgm-tab ${raidManagerTab === 'active' ? 'active' : ''}`}
                  onClick={() => { setRaidManagerTab('active'); setSelectedBenchPlayerForSwap(null); setShowAddToBenchModal(false); }}
                >
                  Active Raid
                </button>
                <button
                  className={`rgm-tab ${raidManagerTab === 'bench' ? 'active' : ''}`}
                  onClick={() => { setRaidManagerTab('bench'); setSelectedPaladinForAura(null); setSelectedShamanForTotems(null); setSelectedMemberForClassSpec(null); }}
                >
                  Bench ({state.benchPlayers.length}/{engine.getMaxBenchSize()})
                </button>
              </div>
              <button className="close-inspection" onClick={() => { setShowRaidGroupManager(false); setSelectedPaladinForAura(null); setDraggedMemberId(null); setSelectedMemberForClassSpec(null); setSelectedBenchPlayerForSwap(null); setShowAddToBenchModal(false); }}>X</button>
            </div>
            <div className="rgm-content">
              {/* Tab content */}
              {raidManagerTab === 'active' && (
                <>
                  <p className="rgm-subtitle">Drag players between groups • Click paladins for auras • Right-click to change class/spec</p>
              {/* Groups Grid */}
              <div className="rgm-groups">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(groupNum => {
                  const groupMembers = state.raid.filter(m => m.group === groupNum);
                  if (groupMembers.length === 0 && groupNum > Math.ceil(state.raid.length / 5)) return null;

                  // Get active party auras in this group (using spec-aware check)
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
                      className={`rgm-group ${draggedMemberId ? 'drop-target' : ''}`}
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
                        const memberId = e.dataTransfer.getData('memberId');
                        if (memberId) {
                          engine.moveMemberToGroup(memberId, groupNum);
                          setDraggedMemberId(null);
                        }
                      }}
                    >
                      <div className="rgm-group-header">
                        <span className="rgm-group-number">Group {groupNum}</span>
                        <div className="rgm-group-auras">
                          {Array.from(groupAuras).map(auraId => {
                            const aura = PARTY_AURAS[auraId];
                            const provider = groupMembers.find(m => memberProvidesAura(m, aura));
                            return (
                              <img
                                key={auraId}
                                src={aura.icon}
                                alt={aura.name}
                                className="rgm-group-aura-icon"
                                onMouseEnter={() => setHoveredAura({ aura, providerName: provider?.name || 'Unknown' })}
                                onMouseLeave={() => setHoveredAura(null)}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="rgm-group-members">
                        {groupMembers.map(member => {
                          const classColor = CLASS_COLORS[member.class];
                          const isPlayer = isLocalPlayer(member.id);
                          // Paladins only exist in Alliance raids - Horde has Shamans instead
                          const isPaladin = member.class === 'paladin' && state.faction === 'alliance';
                          // NPC Shamans in Horde raids can have totems assigned (player shaman uses active totems)
                          const isNpcShaman = member.class === 'shaman' && state.faction === 'horde' && !isPlayer;
                          const paladinAuraId = isPaladin ? engine.getPaladinAura(member.id) : null;
                          const paladinAura = paladinAuraId ? PARTY_AURAS[paladinAuraId] : null;
                          // Get shaman totem assignments for NPC shamans
                          const shamanTotems = isNpcShaman ? engine.getShamanTotems(member.id) : null;
                          const specDef = member.spec ? getSpecById(member.spec) : null;
                          const specName = specDef?.name || member.class;

                          // Get auras this member provides
                          const memberAuras = Object.values(PARTY_AURAS).filter(aura =>
                            memberProvidesAura(member, aura)
                          );

                          return (
                            <div
                              key={member.id}
                              className={`rgm-member ${isPlayer ? 'is-player' : ''} ${isPaladin ? 'is-paladin' : ''} ${isNpcShaman ? 'is-shaman' : ''} ${selectedPaladinForAura === member.id ? 'selected-for-aura' : ''} ${selectedShamanForTotems === member.id ? 'selected-for-totems' : ''} ${selectedMemberForClassSpec === member.id ? 'selected-for-class-spec' : ''} ${draggedMemberId === member.id ? 'dragging' : ''} ${draggedMemberId && draggedMemberId !== member.id ? 'swap-target' : ''}`}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('memberId', member.id);
                                setDraggedMemberId(member.id);
                              }}
                              onDragEnd={() => setDraggedMemberId(null)}
                              onDragOver={(e) => {
                                if (draggedMemberId && draggedMemberId !== member.id) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.currentTarget.classList.add('swap-hover');
                                }
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.classList.remove('swap-hover');
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.currentTarget.classList.remove('swap-hover');
                                const sourceMemberId = e.dataTransfer.getData('memberId');
                                if (sourceMemberId && sourceMemberId !== member.id) {
                                  engine.swapMembers(sourceMemberId, member.id);
                                  setDraggedMemberId(null);
                                }
                              }}
                              onClick={() => {
                                if (isPaladin && !draggedMemberId) {
                                  setSelectedPaladinForAura(selectedPaladinForAura === member.id ? null : member.id);
                                  setSelectedShamanForTotems(null);
                                  setSelectedMemberForClassSpec(null);
                                } else if (isNpcShaman && !draggedMemberId) {
                                  setSelectedShamanForTotems(selectedShamanForTotems === member.id ? null : member.id);
                                  setSelectedPaladinForAura(null);
                                  setSelectedMemberForClassSpec(null);
                                }
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if (!isPlayer && !draggedMemberId) {
                                  setSelectedMemberForClassSpec(selectedMemberForClassSpec === member.id ? null : member.id);
                                  setSelectedPaladinForAura(null);
                                  setSelectedShamanForTotems(null);
                                }
                              }}
                            >
                              <div className="rgm-class-bar" style={{ backgroundColor: classColor }} />
                              <div className="rgm-member-info">
                                <span className="rgm-member-name" style={{ color: classColor }}>
                                  {member.name}
                                  {isPlayer && <span className="rgm-you-tag">YOU</span>}
                                </span>
                                <span className="rgm-spec">{specName}</span>
                              </div>
                              {/* Right side: auras + role tag aligned */}
                              <div className="rgm-member-right">
                                <div className="rgm-member-auras">
                                  {memberAuras.filter(a => a.isAutomatic).map(aura => (
                                    <img
                                      key={aura.id}
                                      src={aura.icon}
                                      alt={aura.name}
                                      className="rgm-member-aura-icon"
                                      onMouseEnter={() => setHoveredAura({ aura, providerName: member.name })}
                                      onMouseLeave={() => setHoveredAura(null)}
                                    />
                                  ))}
                                  {isPaladin && paladinAura && (
                                    <img
                                      src={paladinAura.icon}
                                      alt={paladinAura.name}
                                      className="rgm-member-aura-icon paladin-aura"
                                      onMouseEnter={() => setHoveredAura({ aura: paladinAura, providerName: member.name })}
                                      onMouseLeave={() => setHoveredAura(null)}
                                    />
                                  )}
                                  {/* Show NPC Shaman totem assignments */}
                                  {isNpcShaman && shamanTotems && (
                                    <>
                                      {shamanTotems.earthTotemId && getTotemById(shamanTotems.earthTotemId) && (
                                        <img
                                          src={getTotemById(shamanTotems.earthTotemId)!.icon}
                                          alt={getTotemById(shamanTotems.earthTotemId)!.name}
                                          className="rgm-member-aura-icon shaman-totem"
                                          title={getTotemById(shamanTotems.earthTotemId)!.name}
                                        />
                                      )}
                                      {shamanTotems.fireTotemId && getTotemById(shamanTotems.fireTotemId) && (
                                        <img
                                          src={getTotemById(shamanTotems.fireTotemId)!.icon}
                                          alt={getTotemById(shamanTotems.fireTotemId)!.name}
                                          className="rgm-member-aura-icon shaman-totem"
                                          title={getTotemById(shamanTotems.fireTotemId)!.name}
                                        />
                                      )}
                                      {shamanTotems.waterTotemId && getTotemById(shamanTotems.waterTotemId) && (
                                        <img
                                          src={getTotemById(shamanTotems.waterTotemId)!.icon}
                                          alt={getTotemById(shamanTotems.waterTotemId)!.name}
                                          className="rgm-member-aura-icon shaman-totem"
                                          title={getTotemById(shamanTotems.waterTotemId)!.name}
                                        />
                                      )}
                                      {shamanTotems.airTotemId && getTotemById(shamanTotems.airTotemId) && (
                                        <img
                                          src={getTotemById(shamanTotems.airTotemId)!.icon}
                                          alt={getTotemById(shamanTotems.airTotemId)!.name}
                                          className="rgm-member-aura-icon shaman-totem"
                                          title={getTotemById(shamanTotems.airTotemId)!.name}
                                        />
                                      )}
                                    </>
                                  )}
                                </div>
                                <span className={`rgm-role-tag ${member.role}`}>
                                  {member.role === 'tank' && 'Tank'}
                                  {member.role === 'healer' && 'Healer'}
                                  {member.role === 'dps' && 'DPS'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {groupMembers.length === 0 && (
                          <div className="rgm-empty-slot">Drop here</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Aura Hover Tooltip */}
              {hoveredAura && (
                <div className="rgm-aura-tooltip">
                  <div className="rgm-aura-tooltip-header">
                    <img src={hoveredAura.aura.icon} alt={hoveredAura.aura.name} className="rgm-aura-tooltip-icon" />
                    <span className="rgm-aura-tooltip-name">{hoveredAura.aura.name}</span>
                  </div>
                  <div className="rgm-aura-tooltip-effect">{formatAuraEffect(hoveredAura.aura.effect)}</div>
                  <div className="rgm-aura-tooltip-scope">
                    {hoveredAura.aura.scope === 'raid' ? 'Affects entire raid' : 'Affects party members only'}
                  </div>
                  <div className="rgm-aura-tooltip-provider">
                    Provided by: {hoveredAura.providerName}
                  </div>
                </div>
              )}

              {/* Paladin Aura Selection Panel - Alliance only */}
              {selectedPaladinForAura && state.faction === 'alliance' && (() => {
                const currentAuraId = engine.getPaladinAura(selectedPaladinForAura);
                const selectedPaladin = state.raid.find(m => m.id === selectedPaladinForAura);
                const allAuras = getPaladinAuras();

                // Categorize auras
                const auraCategories = {
                  defensive: allAuras.filter(a => a.id === 'devotion_aura'),
                  resistance: allAuras.filter(a => a.id.includes('resistance')),
                  utility: allAuras.filter(a => ['concentration_aura', 'retribution_aura', 'sanctity_aura'].includes(a.id)),
                };

                const categoryColors: Record<string, string> = {
                  defensive: '#C79C6E', // Tan/bronze
                  resistance: '#8B0000', // Dark red
                  utility: '#DAA520', // Golden
                };

                return (
                  <div className="rgm-aura-panel rgm-aura-panel-columnar">
                    <div className="rgm-aura-header">
                      <h3>Select Aura for {selectedPaladin?.name}</h3>
                      <button className="close-panel-btn" onClick={() => setSelectedPaladinForAura(null)}>×</button>
                    </div>
                    <div className="rgm-aura-elements-horizontal">
                      {Object.entries(auraCategories).map(([category, auras]) => (
                        <div key={category} className="rgm-aura-element-column">
                          <div className="rgm-aura-element-header-h" style={{ backgroundColor: categoryColors[category] }}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </div>
                          <div className="rgm-aura-options-vertical">
                            {auras.map(aura => {
                              const isSelected = currentAuraId === aura.id;
                              // Get short name (remove "Aura" suffix and resistance type)
                              const shortName = aura.name.replace(' Aura', '').replace(' Resistance', ' Resist');
                              return (
                                <div
                                  key={aura.id}
                                  className={`rgm-aura-row ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    engine.setPaladinAura(selectedPaladinForAura, isSelected ? null : aura.id);
                                  }}
                                >
                                  <img src={aura.icon} alt={aura.name} className="rgm-aura-row-icon" />
                                  <span className="rgm-aura-row-name">{shortName}</span>
                                  {isSelected && <span className="aura-check">✓</span>}
                                  <div className="rgm-aura-tooltip">
                                    <div className="rgm-aura-tooltip-name">{aura.name}</div>
                                    <div className="rgm-aura-tooltip-effect">{formatAuraEffect(aura.effect)}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Shaman Totem Selection Panel - Horde only */}
              {selectedShamanForTotems && state.faction === 'horde' && (() => {
                const shamanTotems = engine.getShamanTotems(selectedShamanForTotems);
                const selectedShaman = state.raid.find(m => m.id === selectedShamanForTotems);
                const elementColors: Record<TotemElement, string> = {
                  earth: '#8B4513',
                  fire: '#FF4500',
                  water: '#4169E1',
                  air: '#87CEEB',
                };

                return (
                  <div className="rgm-aura-panel rgm-totem-panel">
                    <div className="rgm-aura-header">
                      <h3>Assign Totems for {selectedShaman?.name}</h3>
                      <button className="close-panel-btn" onClick={() => setSelectedShamanForTotems(null)}>×</button>
                    </div>
                    <div className="rgm-totem-elements-horizontal">
                      {(['earth', 'fire', 'water', 'air'] as TotemElement[]).map(element => {
                        const elementTotems = TOTEMS_BY_ELEMENT[element];
                        const currentTotemId = shamanTotems?.[`${element}TotemId` as keyof typeof shamanTotems] as string | null;

                        return (
                          <div key={element} className="rgm-totem-element-column">
                            <div className="rgm-totem-element-header-h" style={{ backgroundColor: elementColors[element] }}>
                              {element.charAt(0).toUpperCase() + element.slice(1)}
                            </div>
                            <div className="rgm-totem-options-vertical">
                              {elementTotems.map(totem => {
                                const isSelected = currentTotemId === totem.id;
                                // Get short name (remove "Totem" suffix)
                                const shortName = totem.name.replace(' Totem', '');
                                return (
                                  <div
                                    key={totem.id}
                                    className={`rgm-totem-row ${isSelected ? 'selected' : ''}`}
                                    onClick={() => {
                                      engine.setShamanTotem(selectedShamanForTotems, element, isSelected ? null : totem.id);
                                    }}
                                  >
                                    <img src={totem.icon} alt={totem.name} className="rgm-totem-row-icon" />
                                    <span className="rgm-totem-row-name">{shortName}</span>
                                    {isSelected && <span className="totem-check">✓</span>}
                                    <div className="rgm-totem-tooltip">
                                      <div className="rgm-totem-tooltip-name">{totem.name}</div>
                                      <div className="rgm-totem-tooltip-effect">{formatAuraEffect(totem.effect)}</div>
                                      <div className="rgm-totem-tooltip-duration">Duration: {totem.duration}s</div>
                                      {totem.tickRate && <div className="rgm-totem-tooltip-tick">Pulses every {totem.tickRate}s</div>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Spec Change Panel - Only shows gear-compatible specs from same class */}
              {selectedMemberForClassSpec && (() => {
                const currentMember = state.raid.find(m => m.id === selectedMemberForClassSpec);
                if (!currentMember) return null;

                const compatibleSpecIds = getGearCompatibleSpecs(currentMember.class, currentMember.spec);
                const allClassSpecs = CLASS_SPECS[currentMember.class];
                const compatibleSpecs = allClassSpecs.filter(s => compatibleSpecIds.includes(s.id));
                const classColor = CLASS_COLORS[currentMember.class];
                const hasMultipleOptions = compatibleSpecs.length > 1;

                return (
                  <div className="rgm-class-spec-panel">
                    <div className="rgm-class-spec-header">
                      <h3>Change Spec for {currentMember.name}</h3>
                      <button className="close-panel-btn" onClick={() => setSelectedMemberForClassSpec(null)}>×</button>
                    </div>
                    <div className="rgm-class-spec-content">
                      <div className="rgm-class-section current-class">
                        <div className="rgm-class-name" style={{ color: classColor }}>
                          {currentMember.class.charAt(0).toUpperCase() + currentMember.class.slice(1)}
                        </div>
                        {hasMultipleOptions ? (
                          <div className="rgm-spec-options">
                            {compatibleSpecs.map(spec => {
                              const isCurrentSpec = currentMember.spec === spec.id;
                              return (
                                <button
                                  key={spec.id}
                                  className={`rgm-spec-option ${isCurrentSpec ? 'selected' : ''}`}
                                  onClick={() => {
                                    engine.changeMemberClassAndSpec(selectedMemberForClassSpec, currentMember.class, spec.id);
                                  }}
                                >
                                  <img src={spec.icon} alt={spec.name} className="rgm-spec-icon" />
                                  <div className="rgm-spec-info">
                                    <span className="rgm-spec-name">{spec.name}</span>
                                    <span className={`rgm-spec-role ${spec.role}`}>
                                      {spec.role === 'tank' && 'Tank'}
                                      {spec.role === 'healer' && 'Healer'}
                                      {spec.role === 'dps' && 'DPS'}
                                    </span>
                                  </div>
                                  {isCurrentSpec && <span className="rgm-selected-check">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rgm-no-swap-info">
                            <p>No gear-compatible specs available for this specialization.</p>
                          </div>
                        )}
                      </div>
                      <div className="rgm-bench-hint">
                        <p>To change to a different class or incompatible spec, use the <strong>Bench</strong> tab to swap this character with a bench player.</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
                </>
              )}

              {/* Bench Tab Content - Two Panel Layout */}
              {raidManagerTab === 'bench' && (
                <div className="rgm-bench-layout">
                  {/* Left Side: Compact Raid Groups */}
                  <div className="rgm-raid-compact">
                    <h4 className="rgm-raid-compact-title">Active Raid</h4>
                    <p className="rgm-compact-hint">Drag players to bench or click to swap</p>
                    <div className={`rgm-compact-groups ${state.raid.length > 20 ? 'size-40' : 'size-20'}`}>
                      {Array.from({ length: state.raid.length > 20 ? 8 : 4 }, (_, groupIndex) => {
                        const groupNumber = groupIndex + 1;
                        const groupMembers = state.raid.filter(m => m.group === groupNumber);

                        return (
                          <div
                            key={groupNumber}
                            className="rgm-compact-group"
                          >
                            <div className="rgm-compact-group-header">Group {groupNumber}</div>
                            <div className="rgm-compact-members">
                              {groupMembers.map(member => {
                                const classColor = CLASS_COLORS[member.class];
                                const specDef = getSpecById(member.spec);
                                const isPlayer = member.id === 'player';
                                const isSwapTarget = selectedBenchPlayerForSwap && !isPlayer;
                                const isSelectedRaider = selectedRaidMemberForSwap === member.id;

                                return (
                                  <div
                                    key={member.id}
                                    className={`rgm-compact-member ${isPlayer ? 'is-player' : ''} ${isSwapTarget ? 'swap-target' : ''} ${isSelectedRaider ? 'selected-raider' : ''}`}
                                    draggable={!isPlayer}
                                    onDragStart={(e) => {
                                      if (!isPlayer) {
                                        e.dataTransfer.setData('raidMemberId', member.id);
                                      }
                                    }}
                                    onDragOver={(e) => {
                                      if (!isPlayer) {
                                        e.preventDefault();
                                        e.currentTarget.classList.add('drag-over');
                                      }
                                    }}
                                    onDragLeave={(e) => {
                                      e.currentTarget.classList.remove('drag-over');
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      e.currentTarget.classList.remove('drag-over');
                                      if (isPlayer) return;
                                      const benchPlayerId = e.dataTransfer.getData('benchPlayerId');
                                      if (benchPlayerId) {
                                        engine.swapWithBench(member.id, benchPlayerId);
                                      }
                                    }}
                                    onClick={() => {
                                      if (isPlayer) return;
                                      // If a bench player is selected, swap with them
                                      if (selectedBenchPlayerForSwap) {
                                        engine.swapWithBench(member.id, selectedBenchPlayerForSwap);
                                        setSelectedBenchPlayerForSwap(null);
                                        setSelectedRaidMemberForSwap(null);
                                      } else {
                                        // Toggle selection of this raid member
                                        setSelectedRaidMemberForSwap(isSelectedRaider ? null : member.id);
                                        setSelectedBenchPlayerForSwap(null);
                                      }
                                    }}
                                  >
                                    <div className="rgm-compact-class-bar" style={{ backgroundColor: classColor }} />
                                    <div className="rgm-compact-info">
                                      <span className="rgm-compact-name" style={{ color: classColor }}>
                                        {member.name}
                                        {isPlayer && ' (You)'}
                                      </span>
                                      <span className="rgm-compact-spec">
                                        {specDef?.name || member.class}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              {/* Fill empty slots - droppable and clickable */}
                              {Array.from({ length: 5 - groupMembers.length }, (_, i) => (
                                <div
                                  key={`empty-${groupNumber}-${i}`}
                                  className={`rgm-compact-member empty ${selectedBenchPlayerForSwap ? 'can-add' : ''}`}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('drag-over');
                                  }}
                                  onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('drag-over');
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.classList.remove('drag-over');
                                    const benchPlayerId = e.dataTransfer.getData('benchPlayerId');
                                    if (benchPlayerId) {
                                      engine.moveBenchPlayerToRaid(benchPlayerId, groupNumber);
                                    }
                                  }}
                                  onClick={() => {
                                    if (selectedBenchPlayerForSwap) {
                                      engine.moveBenchPlayerToRaid(selectedBenchPlayerForSwap, groupNumber);
                                      setSelectedBenchPlayerForSwap(null);
                                    }
                                  }}
                                >
                                  <span className="rgm-compact-empty-slot">
                                    {selectedBenchPlayerForSwap ? '+ Add Here' : 'Empty'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Side: Bench Area */}
                  <div
                    className="rgm-bench-area"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const raidMemberId = e.dataTransfer.getData('raidMemberId');
                      if (raidMemberId && state.benchPlayers.length < engine.getMaxBenchSize()) {
                        // Move raid member to bench
                        engine.moveRaidMemberToBench(raidMemberId);
                      }
                    }}
                  >
                    <h4 className="rgm-bench-title">
                      Bench ({state.benchPlayers.length}/{engine.getMaxBenchSize()})
                    </h4>
                    <p className="rgm-bench-hint-text">Drag players here or click to select for swap</p>

                    <div className="rgm-bench-players">
                      {state.benchPlayers.length === 0 ? (
                        <div className="rgm-bench-empty-area">
                          <p>No players on bench</p>
                          <p className="rgm-bench-empty-hint">Drag raid members here or add new players</p>
                        </div>
                      ) : (
                        state.benchPlayers.map(benchPlayer => {
                          const classColor = CLASS_COLORS[benchPlayer.class];
                          const specDef = getSpecById(benchPlayer.spec);
                          const isSelected = selectedBenchPlayerForSwap === benchPlayer.id;
                          const isSwapTarget = selectedRaidMemberForSwap !== null;

                          return (
                            <div
                              key={benchPlayer.id}
                              className={`rgm-bench-player-card ${isSelected ? 'selected' : ''} ${isSwapTarget ? 'swap-target' : ''}`}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('benchPlayerId', benchPlayer.id);
                              }}
                              onClick={() => {
                                // If a raid member is selected, swap with them
                                if (selectedRaidMemberForSwap) {
                                  engine.swapWithBench(selectedRaidMemberForSwap, benchPlayer.id);
                                  setSelectedRaidMemberForSwap(null);
                                  setSelectedBenchPlayerForSwap(null);
                                } else {
                                  // Toggle selection of this bench player
                                  setSelectedBenchPlayerForSwap(isSelected ? null : benchPlayer.id);
                                  setSelectedRaidMemberForSwap(null);
                                }
                              }}
                            >
                              <div className="rgm-bench-class-bar" style={{ backgroundColor: classColor }} />
                              <div className="rgm-bench-card-info">
                                <span className="rgm-bench-card-name" style={{ color: classColor }}>
                                  {benchPlayer.name}
                                </span>
                                <span className="rgm-bench-card-spec">
                                  {specDef?.name || benchPlayer.class}
                                </span>
                                <span className="rgm-bench-card-gs">GS: {benchPlayer.gearScore}</span>
                              </div>
                              <span className={`rgm-bench-role ${benchPlayer.role}`}>
                                {benchPlayer.role === 'tank' ? 'Tank' : benchPlayer.role === 'healer' ? 'Healer' : 'DPS'}
                              </span>
                              <button
                                className="rgm-bench-kick-btn"
                                title="Remove from team permanently"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRemoveBenchConfirm({ id: benchPlayer.id, name: benchPlayer.name });
                                }}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add to Bench Button */}
                    {state.benchPlayers.length < engine.getMaxBenchSize() && (
                      <button
                        className="rgm-add-bench-btn"
                        onClick={() => setShowAddToBenchModal(true)}
                      >
                        + Add New Player
                      </button>
                    )}

                    {selectedBenchPlayerForSwap && (
                      <div className="rgm-swap-instruction">
                        Click a raid member on the left to swap with {state.benchPlayers.find(b => b.id === selectedBenchPlayerForSwap)?.name}
                        <button
                          className="rgm-cancel-swap"
                          onClick={() => setSelectedBenchPlayerForSwap(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {selectedRaidMemberForSwap && (
                      <div className="rgm-swap-instruction raider-selected">
                        Click a bench player to swap with {state.raid.find(m => m.id === selectedRaidMemberForSwap)?.name}
                        <button
                          className="rgm-cancel-swap"
                          onClick={() => setSelectedRaidMemberForSwap(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Add to Bench Modal - Class/Spec Selection */}
                  {showAddToBenchModal && (
                    <div className="rgm-add-bench-modal">
                      <div className="rgm-add-bench-header">
                        <h3>Add Player to Bench</h3>
                        <button className="close-panel-btn" onClick={() => { setShowAddToBenchModal(false); setAddToBenchSelectedClass(null); }}>×</button>
                      </div>

                      {!addToBenchSelectedClass ? (
                        // Step 1: Class Selection
                        <>
                          <p className="rgm-add-bench-info">Select a class:</p>
                          <div className="rgm-class-grid">
                            {(Object.keys(CLASS_SPECS) as WoWClass[])
                              .filter(wowClass => {
                                // Alliance can't add Shaman, Horde can't add Paladin
                                if (state.faction === 'alliance' && wowClass === 'shaman') return false;
                                if (state.faction === 'horde' && wowClass === 'paladin') return false;
                                return true;
                              })
                              .map(wowClass => {
                                const classColor = CLASS_COLORS[wowClass];
                                return (
                                  <button
                                    key={wowClass}
                                    className="rgm-class-option"
                                    style={{ borderColor: classColor }}
                                    onClick={() => setAddToBenchSelectedClass(wowClass)}
                                  >
                                    <span style={{ color: classColor }}>
                                      {wowClass.charAt(0).toUpperCase() + wowClass.slice(1)}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </>
                      ) : (
                        // Step 2: Spec Selection
                        <>
                          <p className="rgm-add-bench-info">
                            Select spec for <span style={{ color: CLASS_COLORS[addToBenchSelectedClass] }}>
                              {addToBenchSelectedClass.charAt(0).toUpperCase() + addToBenchSelectedClass.slice(1)}
                            </span>:
                          </p>
                          <div className="rgm-spec-grid">
                            {CLASS_SPECS[addToBenchSelectedClass].map(specDef => (
                              <button
                                key={specDef.id}
                                className="rgm-spec-option"
                                style={{ borderColor: CLASS_COLORS[addToBenchSelectedClass] }}
                                onClick={() => {
                                  engine.createBenchPlayer(addToBenchSelectedClass, specDef.id);
                                  setShowAddToBenchModal(false);
                                  setAddToBenchSelectedClass(null);
                                }}
                              >
                                <img src={specDef.icon} alt={specDef.name} className="rgm-spec-icon" />
                                <div className="rgm-spec-info">
                                  <span className="rgm-spec-name" style={{ color: CLASS_COLORS[addToBenchSelectedClass] }}>
                                    {specDef.name}
                                  </span>
                                  <span className="rgm-spec-role">
                                    {specDef.role === 'tank' ? 'Tank' : specDef.role === 'healer' ? 'Healer' : 'DPS'}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                          <button
                            className="rgm-back-btn"
                            onClick={() => setAddToBenchSelectedClass(null)}
                          >
                            Back to Classes
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="rgm-footer">
              <button className="rgm-done-btn" onClick={() => { setShowRaidGroupManager(false); setSelectedPaladinForAura(null); setSelectedMemberForClassSpec(null); setSelectedBenchPlayerForSwap(null); setSelectedRaidMemberForSwap(null); setShowAddToBenchModal(false); }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patch Notes Modal */}
      {showPatchNotes && (
        <div className="modal-overlay" onClick={() => setShowPatchNotes(false)}>
          <div className="patch-notes-modal" onClick={e => e.stopPropagation()}>
            <button className="close-inspection" onClick={() => setShowPatchNotes(false)}>X</button>
            <div className="patch-notes-header">
              <h2>Patch Notes</h2>
            </div>
            <div className="patch-notes-content">
              <div className="patch-version">
                <h3>Version 0.26.0 - Bench System Added</h3>
                <span className="patch-date">December 3, 2025</span>
              </div>

              <div className="patch-section">
                <h4>Bench System</h4>
                <ul>
                  <li><strong>Swap Raiders for Bench Players</strong>: Add new classes or specs to your raid for boss encounters that require specific compositions</li>
                  <li><strong>Persistent Gear</strong>: Bench players keep their own gear that persists between swaps</li>
                  <li><strong>5/10 Bench Slots</strong>: 5 bench slots for 20-man raids, 10 for 40-man raids</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Bench Tab Layout</h4>
                <ul>
                  <li><strong>Two-Panel Design</strong>: Compact raid groups on the left, dedicated bench area on the right</li>
                  <li><strong>Drag & Drop</strong>: Drag players between raid and bench with visual feedback</li>
                  <li><strong>Click-to-Swap</strong>: Click raiders or bench players to swap them</li>
                </ul>
              </div>

              <div className="patch-version previous">
                <h3>Version 0.25.0 - Molten Core Boss Overhaul</h3>
                <span className="patch-date">December 3, 2025</span>
              </div>

              <div className="patch-section">
                <h4>Boss Mechanics</h4>
                <ul>
                  <li><strong>Ragnaros</strong>: 2-tank swap, Elemental Fire DoT, Submerge phase with Sons of Flame</li>
                  <li><strong>Majordomo</strong>: 5-tank add fight, Magic Reflection, Teleport mechanic</li>
                  <li><strong>Sulfuron</strong>: 4 Flamewaker Priests must die first</li>
                  <li><strong>Golemagg</strong>: 3-tank fight with Magma Splash stacks</li>
                </ul>
              </div>

              <div className="patch-version previous">
                <h3>Version 0.24.0 - Loot & UI Polish</h3>
                <span className="patch-date">December 2, 2025</span>
              </div>

              <div className="patch-section">
                <h4>Cloud Saves</h4>
                <ul>
                  <li><strong>Google & Apple Sign-In</strong>: Log in to sync progress across devices</li>
                  <li><strong>Automatic Cloud Sync</strong>: Save/Load automatically uses cloud storage when logged in</li>
                </ul>
              </div>

              <div className="patch-version previous">
                <h3>Version 0.15.0 - AI Healer Intelligence Update</h3>
                <span className="patch-date">November 29, 2025</span>
              </div>

              <div className="patch-section">
                <h4>AI Healer Mana System</h4>
                <ul>
                  <li><strong>Realistic Mana Pools</strong>: AI healers now have class-specific mana pools</li>
                  <li><strong>MP5 Regeneration</strong>: Each class regenerates mana over time at different rates</li>
                  <li><strong>Smart Spell Selection</strong>: AI healers choose efficient small heals for top-offs, big expensive heals for emergencies</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Healer Mana Bars on Raid Frames</h4>
                <ul>
                  <li><strong>Visible Mana</strong>: All healers now show mana bars on their raid frames</li>
                  <li><strong>Real-Time Updates</strong>: Watch AI healers drain and regenerate mana during encounters</li>
                  <li><strong>Mobile Support</strong>: Compact mana bars on mobile raid frames too</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>AI Healer Dispelling</h4>
                <ul>
                  <li><strong>Class-Specific Dispels</strong>: AI healers now dispel debuffs they can remove (Paladin: magic/poison/disease, Priest: magic/disease, Shaman: poison/disease, Druid: poison/curse)</li>
                  <li><strong>Priority Targeting</strong>: AI prioritizes dispelling tanks, then healers, then DPS</li>
                  <li><strong>GCD Cooldown</strong>: Dispels respect the 1.5s global cooldown like player spells</li>
                  <li><strong>Mana Cost</strong>: AI dispels cost mana (65 per dispel)</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Mobile Improvements</h4>
                <ul>
                  <li><strong>Full Action Bar</strong>: Mobile now shows all action bar spells (was limited to 6)</li>
                  <li><strong>Bag Button</strong>: Inventory button now visible on mobile when out of combat</li>
                  <li><strong>LFG Button</strong>: Multiplayer access added to mobile utility buttons</li>
                  <li><strong>Flex Wrap</strong>: Action bar wraps to multiple rows on narrow screens</li>
                </ul>
              </div>

              <div className="patch-version previous">
                <h3>Version 0.14.0 - UI Polish Update</h3>
                <span className="patch-date">November 29, 2025</span>
              </div>

              <div className="patch-section">
                <h4>Encounter Selection Redesign</h4>
                <ul>
                  <li><strong>Visual Progress Bar</strong>: New segmented progress bar shows boss completion at a glance</li>
                  <li><strong>Training Dummy Section</strong>: Practice mode now separated into its own section</li>
                  <li><strong>5-Column Boss Grid</strong>: Clean, uniform layout for all raid bosses</li>
                  <li><strong>Enhanced Boss Buttons</strong>: Next boss pulses with golden glow animation</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>UI Improvements</h4>
                <ul>
                  <li><strong>Raid Setup Modal</strong>: Faction, raid size, and AI healers moved to a dedicated settings panel</li>
                  <li><strong>Collapsible Buffs</strong>: World buffs panel can now be collapsed to save space</li>
                  <li><strong>LFG Button</strong>: Multiplayer moved to encounter area as "LFG" (Looking for Group)</li>
                  <li><strong>Modal Close Buttons</strong>: All modal X buttons now properly inside their panels</li>
                  <li><strong>Auto Mobile Detection</strong>: Phone UI now auto-enables on mobile devices</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Bug Fixes</h4>
                <ul>
                  <li><strong>Keybind Fix</strong>: Hotkeys (M, B, 1-9) no longer trigger while typing in input fields</li>
                  <li><strong>Layout Fix</strong>: Panels now properly fit on screen without overflow</li>
                </ul>
              </div>

              <div className="patch-version previous">
                <h3>Version 0.13.0 - Multiplayer Update</h3>
                <span className="patch-date">November 28, 2025</span>
              </div>

              <div className="patch-section">
                <h4>Multiplayer Co-op Healing</h4>
                <ul>
                  <li><strong>Real-Time Multiplayer</strong>: Host a game or join with a room code - heal raids together with friends!</li>
                  <li><strong>Host-Authoritative Sync</strong>: Raid frames, boss health, damage events, and loot all sync in real-time at 20Hz</li>
                  <li><strong>Multiplayer Lobby</strong>: Create/join sessions, see connected players, ready-up system</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Real-Time Healing Meter</h4>
                <ul>
                  <li><strong>Live HPS Tracking</strong>: See all healers' output in real-time during encounters</li>
                  <li><strong>Spell Breakdown</strong>: Click your entry to see per-spell healing breakdown</li>
                  <li><strong>Dispel Tracking</strong>: Tab to see dispel counts for all healers</li>
                  <li><strong>Encounter Summary</strong>: Healing meter shows after each boss kill or wipe</li>
                  <li><strong>Mobile Support</strong>: Healing meter available on mobile UI after action bar</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Multiplayer Loot System</h4>
                <ul>
                  <li><strong>DKP Bidding</strong>: All players can bid "Need" on loot they can equip</li>
                  <li><strong>15-Second Timer</strong>: Bidding window with countdown timer</li>
                  <li><strong>Fair Resolution</strong>: Highest DKP wins - random roll on ties!</li>
                  <li><strong>Results Display</strong>: See who won each item and their winning roll</li>
                  <li><strong>Auto-Loot</strong>: Won items go directly to your bag with DKP deducted</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Multiplayer Sync Features</h4>
                <ul>
                  <li><strong>Boss Progress Sync</strong>: Defeated bosses sync to all players</li>
                  <li><strong>Loot Drop Sync</strong>: All players see loot when it drops</li>
                  <li><strong>Healing Stats Sync</strong>: Everyone sees accurate healing meters</li>
                  <li><strong>Encounter Results</strong>: Victory/wipe status synced with summary display</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Bug Fixes</h4>
                <ul>
                  <li><strong>Player Indicator Fix</strong>: "(You)" now correctly shows YOUR character in multiplayer, not the host's</li>
                  <li><strong>Healing Meter Duplicates</strong>: Fixed duplicate player entries in healing meter</li>
                  <li><strong>Decimal Display</strong>: Fixed floating point numbers showing in healing totals</li>
                  <li><strong>Back to Solo</strong>: Fixed "Back to Solo" button to properly leave multiplayer session</li>
                  <li><strong>Client Sync</strong>: Fixed "You are dead!" spam and flickering raid frames on client</li>
                </ul>
              </div>

              <div className="patch-version previous">
                <h3>Version 0.12.0</h3>
                <span className="patch-date">November 27, 2025</span>
              </div>

              <div className="patch-section">
                <h4>New Raid: Blackwing Lair</h4>
                <ul>
                  <li><strong>8 New Boss Encounters</strong>: Razorgore, Vaelastrasz, Broodlord, Firemaw, Ebonroc, Flamegor, Chromaggus, and Nefarian</li>
                  <li><strong>Tier 2 Armor Sets</strong>: Complete T2 sets for all 8 classes with authentic set bonuses</li>
                  <li><strong>BWL Non-Set Loot</strong>: Ashkandi, Chromatically Tempered Sword, Lok'amir, and more iconic items</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Secret Boss: Prince Thunderaan</h4>
                <ul>
                  <li><strong>Hidden Silithus Raid</strong>: Unlocks when you have both Bindings of the Windseeker and defeat Firemaw</li>
                  <li><strong>Legendary Alert System</strong>: Special on-screen alert when Thunderaan is summoned</li>
                  <li><strong>Thunderfury Quest Complete</strong>: Defeat Thunderaan to unlock Thunderfury crafting</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>World Buff: Warchief's Blessing</h4>
                <ul>
                  <li>Unlocks after defeating Nefarian for the first time</li>
                  <li>Grants +300 HP, +15% attack speed (more raid DPS), and +10 mp5</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Bug Fixes</h4>
                <ul>
                  <li><strong>Player Death Lockout</strong>: Dead players can no longer cast spells - action bar properly locked until encounter ends</li>
                  <li><strong>BWL Loot Sanitized</strong>: Removed trinkets, rings, and neck items that had invalid equipment slots</li>
                  <li><strong>Admin Panel Unlocks</strong>: Toggling boss defeats now properly triggers special unlocks (Silithus, world buffs)</li>
                </ul>
              </div>

              <div className="patch-version previous">
                <h3>Version 0.11.0</h3>
                <span className="patch-date">November 27, 2025</span>
              </div>

              <div className="patch-section">
                <h4>New Features</h4>
                <ul>
                  <li><strong>Dual Wield Support</strong>: Warriors and Rogues now have an Offhand weapon slot</li>
                  <li><strong>Hunter Ranged Slot</strong>: Hunters now have a dedicated Ranged weapon slot</li>
                  <li><strong>Spec-Aware Loot Distribution</strong>: Loot assignment now considers spec - caster weapons go to caster specs, melee to melee specs</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Weapon Classification</h4>
                <ul>
                  <li>All weapons now have a type: One-Hand, Two-Hand, Offhand Only, or Ranged</li>
                  <li>All weapons categorized for smart loot: Melee, Caster, Healer, or Physical Ranged</li>
                  <li>Protection Warriors can still dual wield (Fury/Prot tank spec)</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>UI Improvements</h4>
                <ul>
                  <li>Inspection panel now shows class-appropriate weapon slots</li>
                  <li>Admin panel equipment grid updated for new slots</li>
                  <li>Item filter dropdown includes Offhand and Ranged options</li>
                </ul>
              </div>

              <div className="patch-version previous">
                <h3>Version 0.10.0</h3>
                <span className="patch-date">November 27, 2025</span>
              </div>

              <div className="patch-section">
                <h4>Added</h4>
                <ul>
                  <li><strong>Encounter Journal Loot Display</strong>: Boss loot now shown in encounter journal</li>
                  <li><strong>Admin Panel Legendary Materials</strong>: Toggle materials for testing</li>
                  <li><strong>Legendary Materials Persistence</strong>: Materials now save/load correctly</li>
                </ul>
              </div>

              <div className="patch-section">
                <h4>Fixed</h4>
                <ul>
                  <li>Ragnaros loot table corrected (removed non-authentic drops)</li>
                  <li>Legendary material icons updated to correct WoW icons</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Encounter Journal Modal */}
      {showEncounterJournal && (
        <div className="modal-overlay" onClick={() => setShowEncounterJournal(false)}>
          <div className="encounter-journal-modal" onClick={e => e.stopPropagation()}>
            <div className="journal-header">
              <h2>📖 Encounter Journal - {engine.getCurrentRaid()?.name || 'Raid'}</h2>
              <button className="journal-close-btn" onClick={() => setShowEncounterJournal(false)}>×</button>
            </div>
            <div className="journal-content">
              {/* Boss List Sidebar */}
              <div className="journal-boss-list">
                {engine.getCurrentRaidEncounters().map((enc, idx) => (
                  <div
                    key={enc.id}
                    className={`journal-boss-item ${selectedJournalBoss === enc.id ? 'selected' : ''}`}
                    onClick={() => setSelectedJournalBoss(enc.id)}
                  >
                    <span className="journal-boss-number">{idx + 1}.</span>
                    <span className="journal-boss-name">{enc.name}</span>
                  </div>
                ))}
              </div>

              {/* Boss Details */}
              <div className="journal-boss-details">
                {selectedJournalBoss && (() => {
                  const boss = engine.getCurrentRaidEncounters().find(e => e.id === selectedJournalBoss);
                  if (!boss) return null;
                  const abilities = getBossAbilities(selectedJournalBoss);

                  return (
                    <>
                      <div className="journal-boss-header">
                        <h3>{boss.name}</h3>
                        <div className="journal-boss-stats">
                          <span>Health: {(boss.maxHealth / 1000000).toFixed(1)}M</span>
                          <span>Enrage: {formatTime(boss.enrageTimer)}</span>
                        </div>
                      </div>

                      <div className="journal-details-columns">
                        {/* Left Column - Abilities & Strategy */}
                        <div className="journal-left-column">
                          <div className="journal-abilities">
                            <h4>Abilities</h4>
                            {abilities.map((ability, idx) => (
                              <div key={idx} className={`journal-ability ability-${ability.type}`}>
                                <div className="ability-header">
                                  {ability.icon && (
                                    <img src={ability.icon} alt={ability.name} className="ability-icon" />
                                  )}
                                  <div className="ability-title">
                                    <span className="ability-name">{ability.name}</span>
                                    <span className={`ability-type type-${ability.type}`}>
                                      {ability.type.charAt(0).toUpperCase() + ability.type.slice(1)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ability-description">{ability.description}</div>
                                <div className="ability-timing">
                                  Cast every {ability.interval} seconds
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="journal-strategy">
                            <h4>Healer Tips</h4>
                            <ul>
                              {boss.damageEvents.some(e => e.type === 'debuff' && e.debuffId && DEBUFFS[e.debuffId]?.type === 'magic') && (
                                <li>⚡ <strong>Dispel priority:</strong> Watch for magic debuffs and Cleanse them quickly!</li>
                              )}
                              {boss.damageEvents.some(e => e.type === 'debuff' && e.debuffId && DEBUFFS[e.debuffId]?.type === 'curse') && (
                                <li>💀 <strong>Curse alert:</strong> Coordinate with Mages/Druids to decurse raid members.</li>
                              )}
                              {boss.damageEvents.some(e => e.type === 'tank_damage' && e.damage > 1000) && (
                                <li>🛡️ <strong>Tank buster:</strong> Keep Blessing of Light on tanks and be ready with Holy Light!</li>
                              )}
                              {boss.damageEvents.some(e => e.type === 'raid_damage' && (e.targetCount || 5) > 8) && (
                                <li>👥 <strong>Heavy raid damage:</strong> Expect significant AoE damage. Flash of Light spam recommended.</li>
                              )}
                              <li>💧 Keep an eye on your mana. Use potions during high damage phases.</li>
                            </ul>
                          </div>
                        </div>

                        {/* Right Column - Loot */}
                        <div className="journal-right-column">
                          <div className="journal-loot">
                            <h4>Loot</h4>
                            {(() => {
                              const lootTable = BOSS_LOOT_TABLES[selectedJournalBoss];
                              if (!lootTable) return <div className="no-loot">No loot data available</div>;

                              const items = lootTable.items
                                .map(itemId => ALL_ITEMS[itemId])
                                .filter(item => item != null)
                                .sort((a, b) => {
                                  // Sort by rarity (legendary > epic > rare > uncommon)
                                  const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3 };
                                  return rarityOrder[a.rarity] - rarityOrder[b.rarity];
                                });

                              // Get legendary material if this boss drops one
                              const legendaryMat = lootTable.legendaryMaterial
                                ? LEGENDARY_MATERIALS[lootTable.legendaryMaterial]
                                : null;

                              return (
                                <div className="loot-items">
                                  {/* Show legendary material first if exists */}
                                  {legendaryMat && (
                                    <div className="loot-item legendary-material">
                                      <img
                                        src={legendaryMat.icon}
                                        alt={legendaryMat.name}
                                        className="loot-item-icon"
                                        style={{ borderColor: RARITY_COLORS.legendary }}
                                      />
                                      <div className="loot-item-info">
                                        <span
                                          className="loot-item-name"
                                          style={{ color: RARITY_COLORS.legendary }}
                                        >
                                          {legendaryMat.name}
                                        </span>
                                        <span className="loot-item-slot">
                                          Legendary Material • {Math.round(legendaryMat.dropChance * 100)}% drop
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {items.map((item, idx) => (
                                    <div key={idx} className="loot-item">
                                      <img
                                        src={item.icon}
                                        alt={item.name}
                                        className="loot-item-icon"
                                        style={{ borderColor: RARITY_COLORS[item.rarity] }}
                                      />
                                      <div className="loot-item-info">
                                        <span
                                          className="loot-item-name"
                                          style={{ color: RARITY_COLORS[item.rarity] }}
                                        >
                                          {item.name}
                                        </span>
                                        <span className="loot-item-slot">
                                          {item.slot.charAt(0).toUpperCase() + item.slot.slice(1)} • {item.classes.join(', ')}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => { setShowSettings(false); setRecordingKeybind(null); }}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <h2>Settings</h2>
              <button className="settings-close-btn" onClick={() => { setShowSettings(false); setRecordingKeybind(null); }}>×</button>
            </div>

            {/* Tab Navigation */}
            <div className="settings-tabs">
              <button
                className={`settings-tab ${settingsTab === 'keybinds' ? 'active' : ''}`}
                onClick={() => setSettingsTab('keybinds')}
              >
                Keybinds
              </button>
              <button
                className={`settings-tab ${settingsTab === 'interface' ? 'active' : ''}`}
                onClick={() => setSettingsTab('interface')}
              >
                Interface
              </button>
            </div>

            <div className="settings-content">
              {/* KEYBINDS TAB */}
              {settingsTab === 'keybinds' && (
                <div className="settings-keybinds-tab">
                  <div className="keybind-section">
                    <div className="keybind-section-header">Action Bar</div>
                    <div className="keybind-grid">
                      {keybinds.actionBar.map((key, index) => (
                        <div key={index} className="keybind-row">
                          <span className="keybind-label">Slot {index + 1}</span>
                          <button
                            className={`keybind-button ${recordingKeybind === `actionBar_${index}` ? 'recording' : ''}`}
                            onClick={() => setRecordingKeybind(`actionBar_${index}`)}
                          >
                            {recordingKeybind === `actionBar_${index}` ? 'Press a key...' : key.toUpperCase()}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="keybind-section">
                    <div className="keybind-section-header">Items</div>
                    <div className="keybind-grid">
                      <div className="keybind-row">
                        <span className="keybind-label">Mana Potion</span>
                        <button
                          className={`keybind-button ${recordingKeybind === 'manaPotion' ? 'recording' : ''}`}
                          onClick={() => setRecordingKeybind('manaPotion')}
                        >
                          {recordingKeybind === 'manaPotion' ? 'Press a key...' : keybinds.manaPotion.toUpperCase()}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="keybind-section">
                    <div className="keybind-section-header">Targeting Mode</div>
                    <div className="targeting-mode-toggle">
                      <button
                        className={`targeting-mode-btn ${!mouseoverHealingEnabled ? 'active' : ''}`}
                        onClick={() => setMouseoverHealingEnabled(false)}
                      >
                        Click Target
                      </button>
                      <button
                        className={`targeting-mode-btn ${mouseoverHealingEnabled ? 'active' : ''}`}
                        onClick={() => setMouseoverHealingEnabled(true)}
                      >
                        Mouseover
                      </button>
                    </div>
                    <div className="targeting-mode-hint">
                      {mouseoverHealingEnabled
                        ? 'Spells will heal the raid frame under your mouse cursor'
                        : 'Click a raid frame to select it, then cast spells on that target'}
                    </div>
                  </div>

                  <div className="keybind-actions">
                    <button
                      className="reset-keybinds-btn"
                      onClick={() => setKeybinds(DEFAULT_KEYBINDS)}
                    >
                      Reset to Defaults
                    </button>
                  </div>

                  <div className="keybind-hint">
                    Click a key to rebind. Press Escape to cancel. Conflicting keys will be swapped.
                  </div>
                </div>
              )}

              {/* INTERFACE TAB */}
              {settingsTab === 'interface' && (
                <div className="settings-interface-tab">
                  <div className="settings-section">
                    <div className="settings-section-header">Layout Mode</div>
                    <div className="settings-option">
                      <span>UI Layout:</span>
                      <div className="settings-toggle-group">
                        <button
                          className={!isMobileMode ? 'active' : ''}
                          onClick={() => setIsMobileMode(false)}
                        >
                          Desktop
                        </button>
                        <button
                          className={isMobileMode ? 'active' : ''}
                          onClick={() => setIsMobileMode(true)}
                        >
                          Phone
                        </button>
                      </div>
                    </div>
                    <div className="settings-hint">
                      Desktop mode shows all panels side by side. Phone mode uses a tabbed interface.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>×</button>
            <div className="auth-modal-header">
              <h2>{currentUser ? 'Account' : 'Sign In'}</h2>
            </div>
            <div className="auth-modal-content">
              {currentUser ? (
                <div className="auth-logged-in-view">
                  <div className="auth-user-info">
                    <div className="auth-avatar">
                      {currentUser.user_metadata?.avatar_url ? (
                        <img src={currentUser.user_metadata.avatar_url} alt="Avatar" />
                      ) : (
                        <span>{(currentUser.email?.[0] || '?').toUpperCase()}</span>
                      )}
                    </div>
                    <div className="auth-user-details">
                      <span className="auth-user-name">{currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}</span>
                      <span className="auth-user-email">{currentUser.email}</span>
                    </div>
                  </div>
                  <div className="auth-cloud-actions">
                    <button className="auth-sync-btn" onClick={handleCloudSave} disabled={cloudSyncStatus === 'syncing'}>
                      {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Save to Cloud'}
                    </button>
                    <button className="auth-sync-btn" onClick={handleCloudLoad} disabled={cloudSyncStatus === 'syncing'}>
                      {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Load from Cloud'}
                    </button>
                  </div>
                  <button className="auth-signout-btn" onClick={async () => {
                    await signOut();
                    posthog.reset(); // Clear user identity on sign out
                    setShowAuthModal(false);
                  }}>
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="auth-signin-view">
                  <p className="auth-description">
                    Sign in to sync your progress across devices with cloud saves.
                  </p>
                  <div className="auth-providers">
                    <button className="auth-provider-btn google" onClick={() => signInWithGoogle()}>
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                    <button className="auth-provider-btn apple" onClick={() => signInWithApple()}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continue with Apple
                    </button>
                  </div>
                  <p className="auth-privacy">
                    Your game data is saved securely in the cloud and only accessible by you.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="modal-overlay" onClick={() => setShowAdminPanel(false)}>
          <div className="admin-panel-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-header">
              <h2>Admin Panel</h2>
              <button className="admin-close-btn" onClick={() => setShowAdminPanel(false)}>×</button>
            </div>

            {/* Tab Navigation */}
            <div className="admin-tabs">
              <button
                className={`admin-tab ${adminTab === 'loot' ? 'active' : ''}`}
                onClick={() => setAdminTab('loot')}
              >
                Loot
              </button>
              <button
                className={`admin-tab ${adminTab === 'dkp' ? 'active' : ''}`}
                onClick={() => setAdminTab('dkp')}
              >
                DKP
              </button>
              <button
                className={`admin-tab ${adminTab === 'progression' ? 'active' : ''}`}
                onClick={() => setAdminTab('progression')}
              >
                Progression
              </button>
              <button
                className={`admin-tab ${adminTab === 'raid' ? 'active' : ''}`}
                onClick={() => setAdminTab('raid')}
              >
                Raid Members
              </button>
            </div>

            {/* Tab Content */}
            <div className="admin-tab-content">
              {/* LOOT TAB */}
              {adminTab === 'loot' && (() => {
                const selectedMember = selectedAdminMemberId
                  ? engine.adminGetMemberById(selectedAdminMemberId)
                  : null;
                const equipItems = selectedMember
                  ? engine.getEquippableItemsForClass(selectedMember.class)
                  : [];

                // Filter items
                let filteredItems = equipItems;
                if (adminItemSlotFilter !== 'all') {
                  filteredItems = filteredItems.filter(i => i.slot === adminItemSlotFilter);
                }
                if (adminItemSearch) {
                  const search = adminItemSearch.toLowerCase();
                  filteredItems = filteredItems.filter(i =>
                    i.name.toLowerCase().includes(search)
                  );
                }

                return (
                  <div className="admin-loot-tab">
                    {/* Member Selector */}
                    <div className="admin-section">
                      <label className="admin-section-header">Select Raid Member:</label>
                      <select
                        className="admin-member-select"
                        value={selectedAdminMemberId || ''}
                        onChange={e => setSelectedAdminMemberId(e.target.value)}
                      >
                        {state.raid.map(m => (
                          <option key={m.id} value={m.id} style={{ color: CLASS_COLORS[m.class] }}>
                            {m.name} ({m.class}) - GS: {m.gearScore}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedMember && (
                      <div className="admin-loot-content">
                        {/* Current Equipment */}
                        <div className="admin-equipment-section">
                          <div className="admin-section-header">
                            Current Equipment - {selectedMember.name}
                            <span className="gear-score-display">GS: {selectedMember.gearScore}</span>
                          </div>
                          <div className="admin-equipment-grid">
                            {(() => {
                              // Build dynamic slot list based on class - now with all 17 WoW Classic slots
                              const memberClass = selectedMember.class;
                              // Armor slots
                              const armorSlots: EquipmentSlot[] = ['head', 'neck', 'shoulders', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet'];
                              // Accessory slots
                              const accessorySlots: EquipmentSlot[] = ['ring1', 'ring2', 'trinket1', 'trinket2'];
                              // Weapon slots (class-dependent)
                              const weaponSlots: EquipmentSlot[] = ['weapon'];
                              // Warriors and Rogues can dual wield (offhand), casters use offhand too
                              if (memberClass === 'warrior' || memberClass === 'rogue' || memberClass === 'paladin' || memberClass === 'shaman' ||
                                  memberClass === 'priest' || memberClass === 'mage' || memberClass === 'warlock' || memberClass === 'druid') {
                                weaponSlots.push('offhand');
                              }
                              // All classes get ranged slot (hunters=bows, healers=wands/relics)
                              weaponSlots.push('ranged');

                              const allSlots = [...armorSlots, ...accessorySlots, ...weaponSlots];

                              // Format slot name for display
                              const formatSlotName = (slot: string) => {
                                if (slot === 'ring1') return 'Ring 1';
                                if (slot === 'ring2') return 'Ring 2';
                                if (slot === 'trinket1') return 'Trinket 1';
                                if (slot === 'trinket2') return 'Trinket 2';
                                return slot.charAt(0).toUpperCase() + slot.slice(1);
                              };

                              return allSlots.map(slot => {
                                const item = selectedMember.equipment[slot];
                                return (
                                  <div key={slot} className="admin-equipment-slot">
                                    <span className="slot-label">{formatSlotName(slot)}:</span>
                                    {item ? (
                                      <div className="equipped-item">
                                        <span style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</span>
                                        <button
                                          className="remove-item-btn"
                                          onClick={() => engine.adminRemoveItemFromMember(selectedMember.id, slot)}
                                          title="Remove item"
                                        >
                                          X
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="empty-slot">Empty</span>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* Item Browser */}
                        <div className="admin-item-browser">
                          <div className="admin-section-header">
                            Available Items for {selectedMember.class}
                          </div>
                          <div className="admin-item-filters">
                            <select
                              value={adminItemSlotFilter}
                              onChange={e => setAdminItemSlotFilter(e.target.value)}
                              className="admin-slot-filter"
                            >
                              <option value="all">All Slots</option>
                              <option value="head">Head</option>
                              <option value="neck">Neck</option>
                              <option value="shoulders">Shoulders</option>
                              <option value="back">Back</option>
                              <option value="chest">Chest</option>
                              <option value="wrist">Wrist</option>
                              <option value="hands">Hands</option>
                              <option value="waist">Waist</option>
                              <option value="legs">Legs</option>
                              <option value="feet">Feet</option>
                              <option value="ring1">Ring 1</option>
                              <option value="ring2">Ring 2</option>
                              <option value="trinket1">Trinket 1</option>
                              <option value="trinket2">Trinket 2</option>
                              <option value="weapon">Weapon</option>
                              <option value="offhand">Offhand</option>
                              <option value="ranged">Ranged</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Search items..."
                              value={adminItemSearch}
                              onChange={e => setAdminItemSearch(e.target.value)}
                              className="admin-item-search"
                            />
                          </div>
                          <div className="admin-item-list">
                            {filteredItems.map(item => (
                              <div key={item.id} className="admin-item-row">
                                <img src={item.icon} alt={item.name} className="admin-item-icon" />
                                <div className="admin-item-info">
                                  <span className="admin-item-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                                    {item.name}
                                  </span>
                                  <span className="admin-item-slot">{item.slot} - iLvl {item.itemLevel}</span>
                                </div>
                                <div className="admin-item-buttons">
                                  <button
                                    className="admin-equip-btn"
                                    onClick={() => engine.adminEquipItemOnMember(selectedMember.id, item)}
                                  >
                                    Equip
                                  </button>
                                  {selectedMember.id === engine.getPlayerMember()?.id && (
                                    <button
                                      className="admin-to-bag-btn"
                                      onClick={() => engine.adminAddItemToBag(item)}
                                      disabled={state.playerBag.length >= 16}
                                      title={state.playerBag.length >= 16 ? 'Bag is full' : 'Add to bag'}
                                    >
                                      To Bag
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {filteredItems.length === 0 && (
                              <div className="no-items-found">No items found</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* DKP TAB */}
              {adminTab === 'dkp' && (
                <div className="admin-dkp-tab">
                  <div className="admin-section">
                    <div className="admin-section-header">Player DKP</div>
                    <div className="admin-dkp-display">
                      <span className="dkp-value-large">{state.playerDKP.points}</span>
                      <span className="dkp-label">Dragon Kill Points</span>
                    </div>

                    <div className="admin-dkp-controls">
                      <div className="dkp-input-row">
                        <input
                          type="number"
                          value={adminDkpInput}
                          onChange={e => setAdminDkpInput(e.target.value)}
                          placeholder="Amount"
                          className="admin-dkp-input"
                        />
                        <button
                          className="dkp-add-btn"
                          onClick={() => {
                            const val = parseInt(adminDkpInput);
                            if (!isNaN(val)) {
                              engine.adminModifyPlayerDKP(val);
                              setAdminDkpInput('');
                            }
                          }}
                        >
                          Add
                        </button>
                        <button
                          className="dkp-subtract-btn"
                          onClick={() => {
                            const val = parseInt(adminDkpInput);
                            if (!isNaN(val)) {
                              engine.adminModifyPlayerDKP(-val);
                              setAdminDkpInput('');
                            }
                          }}
                        >
                          Subtract
                        </button>
                        <button
                          className="dkp-set-btn"
                          onClick={() => {
                            const val = parseInt(adminDkpInput);
                            if (!isNaN(val)) {
                              engine.adminSetPlayerDKP(val);
                              setAdminDkpInput('');
                            }
                          }}
                        >
                          Set To
                        </button>
                      </div>

                      <div className="dkp-presets">
                        <span className="preset-label">Quick Add:</span>
                        <button onClick={() => engine.adminModifyPlayerDKP(50)}>+50</button>
                        <button onClick={() => engine.adminModifyPlayerDKP(100)}>+100</button>
                        <button onClick={() => engine.adminModifyPlayerDKP(500)}>+500</button>
                        <button onClick={() => engine.adminModifyPlayerDKP(-50)}>-50</button>
                        <button onClick={() => engine.adminSetPlayerDKP(50)}>Reset to 50</button>
                      </div>
                    </div>

                    <div className="dkp-info">
                      <div className="dkp-stat">
                        <span>Earned this raid:</span>
                        <span>{state.playerDKP.earnedThisRaid}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PROGRESSION TAB */}
              {adminTab === 'progression' && (
                <div className="admin-progression-tab">
                  {/* Boss Progress */}
                  <div className="admin-section">
                    <div className="admin-section-header">Boss Progression</div>
                    <div className="admin-raid-selector">
                      <label>Raid: </label>
                      <select
                        value={adminProgressionRaid}
                        onChange={(e) => setAdminProgressionRaid(e.target.value)}
                      >
                        {RAIDS.filter(r => r.available).map(raid => (
                          <option key={raid.id} value={raid.id}>
                            {raid.name} ({raid.encounters.length} bosses)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-boss-list">
                      {engine.adminGetAllEncounters(adminProgressionRaid).map((enc, idx) => (
                        <div
                          key={enc.id}
                          className={`admin-boss-item ${enc.isDefeated ? 'defeated' : ''}`}
                          onClick={() => engine.adminToggleBossDefeated(enc.id, adminProgressionRaid)}
                        >
                          <span className="boss-number">{idx + 1}.</span>
                          <span className="boss-name">{enc.name}</span>
                          <span className={`boss-status ${enc.isDefeated ? 'defeated' : 'available'}`}>
                            {enc.isDefeated ? 'Defeated' : 'Available'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="admin-progression-actions">
                      <button
                        className="defeat-all-btn"
                        onClick={() => {
                          ENCOUNTERS.forEach(e => {
                            if (!state.defeatedBosses.includes(e.id)) {
                              engine.adminToggleBossDefeated(e.id);
                            }
                          });
                        }}
                      >
                        Defeat All Bosses
                      </button>
                      <button
                        className="clear-progress-btn"
                        onClick={() => engine.adminClearAllProgression()}
                      >
                        Clear All Progress
                      </button>
                    </div>
                  </div>

                  {/* World Buffs */}
                  <div className="admin-section">
                    <div className="admin-section-header">World Buff Unlocks</div>
                    <div className="admin-world-buffs">
                      {Object.values(WORLD_BUFFS).map(buff => {
                        const isUnlocked = state.unlockedWorldBuffs.includes(buff.id);
                        return (
                          <div
                            key={buff.id}
                            className={`admin-world-buff-item ${isUnlocked ? 'unlocked' : ''} ${buff.comingSoon ? 'coming-soon' : ''}`}
                            onClick={() => {
                              if (!buff.comingSoon) {
                                engine.adminToggleWorldBuffUnlocked(buff.id);
                              }
                            }}
                          >
                            <img src={buff.icon} alt={buff.name} className="world-buff-icon" />
                            <span className="world-buff-name">{buff.name}</span>
                            <span className={`world-buff-status ${isUnlocked ? 'unlocked' : 'locked'}`}>
                              {buff.comingSoon ? 'Coming Soon' : isUnlocked ? 'Unlocked' : 'Locked'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legendary Materials */}
                  <div className="admin-section">
                    <div className="admin-section-header">Legendary Materials</div>
                    <div className="admin-legendary-materials">
                      {Object.values(LEGENDARY_MATERIALS).map(mat => {
                        const hasIt = engine.adminHasLegendaryMaterial(mat.id);
                        return (
                          <div
                            key={mat.id}
                            className={`admin-legendary-item ${hasIt ? 'owned' : ''}`}
                          >
                            <img
                              src={mat.icon}
                              alt={mat.name}
                              className="legendary-icon"
                              onClick={() => engine.adminToggleLegendaryMaterial(mat.id)}
                            />
                            <div className="legendary-info" onClick={() => engine.adminToggleLegendaryMaterial(mat.id)}>
                              <span className="legendary-name" style={{ color: RARITY_COLORS.legendary }}>{mat.name}</span>
                              <span className="legendary-desc">{mat.description}</span>
                            </div>
                            <div className="legendary-actions">
                              <span className={`legendary-status ${hasIt ? 'owned' : 'missing'}`}>
                                {hasIt ? 'Owned' : 'Not Owned'}
                              </span>
                              <button
                                className="test-legendary-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  engine.adminTestLegendaryDrop(mat.id);
                                }}
                              >
                                Test Drop
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="legendary-crafting-status">
                      <span>Can craft Thunderfury: {engine.canCraftThunderfury() ? 'Yes' : 'No'}</span>
                      <span>Can craft Sulfuras: {engine.canCraftSulfuras() ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  {/* Bad Luck Protection */}
                  <div className="admin-section">
                    <div className="admin-section-header">Bad Luck Protection</div>
                    <div className="bad-luck-display">
                      <span>Boss kills without Paladin loot: </span>
                      <span className="bad-luck-count">{state.bossKillsWithoutPaladinLoot}</span>
                      <span className="bad-luck-note">(Guaranteed at 3+)</span>
                    </div>
                    <div className="bad-luck-controls">
                      <button onClick={() => engine.adminResetBadLuckProtection()}>
                        Reset Counter
                      </button>
                      <button onClick={() => engine.adminSetBadLuckProtection(3)}>
                        Set to 3 (Force Protection)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* RAID MANAGEMENT TAB */}
              {adminTab === 'raid' && (
                <div className="admin-raid-tab">
                  {/* Raid Size Info (selected at character creation) */}
                  <div className="admin-section">
                    <div className="admin-section-header">Raid Size</div>
                    <div className="raid-size-info">
                      <span className="raid-size-badge">{state.raid.length}-Man Raid</span>
                      <span className="raid-size-hint">(Selected at character creation)</span>
                    </div>
                  </div>

                  {/* Gear All Players */}
                  <div className="admin-section">
                    <div className="admin-section-header">Quick Actions</div>
                    <div className="raid-size-controls">
                      <button
                        onClick={() => engine.adminGearAllPlayers()}
                        title="Equip best available gear on all raid members"
                      >
                        Gear All Players
                      </button>
                    </div>
                  </div>

                  {/* Member Table */}
                  <div className="admin-section">
                    <div className="admin-section-header">Raid Members</div>
                    <div className="admin-member-table">
                      <div className="admin-member-header">
                        <span className="col-index">#</span>
                        <span className="col-name">Name</span>
                        <span className="col-class">Class</span>
                        <span className="col-role">Role</span>
                        <span className="col-gs">GS</span>
                        <span className="col-actions">Actions</span>
                      </div>
                      <div className="admin-member-list">
                        {state.raid.map((member, idx) => {
                          const isPlayer = isLocalPlayer(member.id);
                          const isEditing = editingMemberId === member.id;

                          return (
                            <div
                              key={member.id}
                              className={`admin-member-row ${isPlayer ? 'is-player' : ''}`}
                            >
                              <span className="col-index">{idx + 1}</span>
                              <span className="col-name">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingMemberName}
                                    onChange={e => setEditingMemberName(e.target.value)}
                                    onBlur={() => {
                                      if (editingMemberName.trim()) {
                                        engine.adminRenameMember(member.id, editingMemberName);
                                      }
                                      setEditingMemberId(null);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        if (editingMemberName.trim()) {
                                          engine.adminRenameMember(member.id, editingMemberName);
                                        }
                                        setEditingMemberId(null);
                                      }
                                    }}
                                    autoFocus
                                    className="admin-name-input"
                                  />
                                ) : (
                                  <span
                                    style={{ color: CLASS_COLORS[member.class], cursor: 'pointer' }}
                                    onClick={() => {
                                      setEditingMemberId(member.id);
                                      setEditingMemberName(member.name);
                                    }}
                                    title="Click to rename"
                                  >
                                    {member.name}
                                    {isPlayer && <span className="player-tag"> (YOU)</span>}
                                  </span>
                                )}
                              </span>
                              <span className="col-class">
                                <select
                                  value={member.class}
                                  onChange={e => engine.adminChangeMemberClass(member.id, e.target.value as WoWClass)}
                                  className="admin-class-select"
                                  style={{ color: CLASS_COLORS[member.class] }}
                                >
                                  <option value="warrior">Warrior</option>
                                  {state.faction === 'alliance' && <option value="paladin">Paladin</option>}
                                  {state.faction === 'horde' && <option value="shaman">Shaman</option>}
                                  <option value="hunter">Hunter</option>
                                  <option value="rogue">Rogue</option>
                                  <option value="priest">Priest</option>
                                  <option value="mage">Mage</option>
                                  <option value="warlock">Warlock</option>
                                  <option value="druid">Druid</option>
                                </select>
                              </span>
                              <span className="col-role">{member.role}</span>
                              <span className="col-gs">{member.gearScore}</span>
                              <span className="col-actions">
                                <button
                                  className="admin-view-btn"
                                  onClick={() => {
                                    setSelectedAdminMemberId(member.id);
                                    setAdminTab('loot');
                                  }}
                                  title="View/Edit Equipment"
                                >
                                  Gear
                                </button>
                                {!isPlayer && (
                                  <button
                                    className="admin-delete-btn"
                                    onClick={() => engine.adminDeleteMember(member.id)}
                                    title="Remove from raid"
                                  >
                                    X
                                  </button>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Add New Member */}
                  <div className="admin-section">
                    <div className="admin-section-header">Add New Member</div>
                    <div className="add-member-form">
                      <input
                        type="text"
                        placeholder="Name"
                        value={adminNewMemberName}
                        onChange={e => setAdminNewMemberName(e.target.value)}
                        className="add-member-name"
                      />
                      <select
                        value={adminNewMemberClass}
                        onChange={e => setAdminNewMemberClass(e.target.value as WoWClass)}
                        className="add-member-class"
                      >
                        <option value="warrior">Warrior</option>
                        {state.faction === 'alliance' && <option value="paladin">Paladin</option>}
                        {state.faction === 'horde' && <option value="shaman">Shaman</option>}
                        <option value="hunter">Hunter</option>
                        <option value="rogue">Rogue</option>
                        <option value="priest">Priest</option>
                        <option value="mage">Mage</option>
                        <option value="warlock">Warlock</option>
                        <option value="druid">Druid</option>
                      </select>
                      <select
                        value={adminNewMemberRole}
                        onChange={e => setAdminNewMemberRole(e.target.value as 'tank' | 'healer' | 'dps')}
                        className="add-member-role"
                      >
                        <option value="tank">Tank</option>
                        <option value="healer">Healer</option>
                        <option value="dps">DPS</option>
                      </select>
                      <button
                        className="add-member-btn"
                        onClick={() => {
                          engine.adminAddMember(adminNewMemberName || 'NewMember', adminNewMemberClass, adminNewMemberRole);
                          setAdminNewMemberName('');
                        }}
                      >
                        Add Member
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <div className="modal-overlay" onClick={() => setShowInventory(false)}>
          <div className="inventory-modal" onClick={e => e.stopPropagation()}>
            <div className="inventory-header">
              <div className="inventory-title">
                <img
                  src="/icons/inv_misc_bag_08.jpg"
                  alt="Bag"
                  className="inventory-title-icon"
                />
                <h2>{state.playerName}'s Bags</h2>
              </div>
              <button className="inventory-close-btn" onClick={() => setShowInventory(false)}>×</button>
            </div>

            <div className="inventory-content">
              {/* Bag Section with Tab Dropdown */}
              <div className="bag-section">
                <div className="bag-header">
                  <select
                    className="bag-tab-dropdown"
                    value={activeBagTab}
                    onChange={e => setActiveBagTab(e.target.value as 'equipment' | 'materials')}
                  >
                    <option value="equipment">Equipment Bag</option>
                    <option value="materials">Materials Bag</option>
                  </select>
                  {activeBagTab === 'equipment' ? (
                    <>
                      <span className="bag-slots">{state.playerBag.length} / 16</span>
                      {state.playerBag.length > 0 && (() => {
                        const preRaidCount = state.playerBag.filter(i => i.isPreRaidBis).length;
                        const disenchantableCount = state.playerBag.length - preRaidCount;
                        return (
                          <button
                            className="disenchant-all-btn"
                            onClick={() => {
                              if (preRaidCount > 0) {
                                setConfirmDialog({
                                  title: 'Disenchant All Items',
                                  warningText: `${preRaidCount} pre-raid BiS item${preRaidCount > 1 ? 's' : ''} will be DESTROYED (no materials).`,
                                  message: `${disenchantableCount} item${disenchantableCount !== 1 ? 's' : ''} will be disenchanted for Nexus Crystals.`,
                                  confirmLabel: 'Disenchant',
                                  onConfirm: () => engine.disenchantAll()
                                });
                              } else {
                                engine.disenchantAll();
                              }
                            }}
                            title={preRaidCount > 0
                              ? `Disenchant ${disenchantableCount} items, destroy ${preRaidCount} pre-raid items`
                              : "Disenchant all items into Nexus Crystals"}
                          >
                            Disenchant All
                          </button>
                        );
                      })()}
                    </>
                  ) : (
                    <span className="bag-slots">{state.materialsBag.nexus_crystal} crystals</span>
                  )}
                </div>

                {/* Equipment Bag View */}
                {activeBagTab === 'equipment' && (
                  <>
                    <div className="bag-grid">
                      {/* Filled slots with gear items */}
                      {state.playerBag.map((item, index) => {
                        const itemEnchant = item.enchantId ? ENCHANTS[item.enchantId] : null;
                        return (
                          <div
                            key={`gear-${item.id}-${index}`}
                            className={`bag-slot filled gear rarity-${item.rarity} ${item.enchantId ? 'enchanted' : ''} ${item.isPreRaidBis ? 'pre-raid-bis' : ''}`}
                            onClick={() => engine.equipFromBag(index)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setBagContextMenu({ x: e.clientX, y: e.clientY, index });
                            }}
                            title={item.isPreRaidBis ? 'Click to equip • Right-click to destroy (pre-raid)' : 'Click to equip • Right-click to disenchant'}
                          >
                            <img src={item.icon} alt={item.name} />
                            <div className="slot-tooltip">
                              <div className="tooltip-name" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</div>
                              {itemEnchant && (
                                <div className="tooltip-enchant" style={{ color: '#1eff00' }}>{itemEnchant.name}</div>
                              )}
                              <div className="tooltip-slot">{item.slot.charAt(0).toUpperCase() + item.slot.slice(1)} - iLvl {item.itemLevel}</div>
                              <div className="tooltip-stats">
                                {item.stats.intellect && <div>+{item.stats.intellect} Intellect</div>}
                                {item.stats.stamina && <div>+{item.stats.stamina} Stamina</div>}
                                {item.stats.spellPower && <div>+{item.stats.spellPower} Spell Power</div>}
                                {item.stats.healingPower && <div>+{item.stats.healingPower} Healing</div>}
                                {item.stats.mp5 && <div>+{item.stats.mp5} MP5</div>}
                                {item.stats.critChance && <div>+{item.stats.critChance}% Crit</div>}
                              </div>
                              <div className="tooltip-action">Left-click: Equip • Right-click: {item.isPreRaidBis ? 'Destroy' : 'Disenchant'}</div>
                              {item.isPreRaidBis && <div className="pre-raid-destroy-warning">Pre-raid items cannot be disenchanted</div>}
                            </div>
                          </div>
                        );
                      })}
                      {/* Empty slots to fill the grid */}
                      {Array.from({ length: Math.max(0, 16 - state.playerBag.length) }).map((_, idx) => (
                        <div key={`gear-empty-${idx}`} className="bag-slot empty" />
                      ))}
                    </div>
                    {state.playerBag.length === 0 && (
                      <div className="bag-empty-hint">
                        <p>When you equip new gear, your old equipment will be stored here.</p>
                      </div>
                    )}
                  </>
                )}

                {/* Materials Bag View */}
                {activeBagTab === 'materials' && (
                  <>
                    <div className="bag-grid">
                      {/* Nexus Crystals */}
                      {state.materialsBag.nexus_crystal > 0 && (
                        <div
                          className="bag-slot filled epic"
                          title={`${ENCHANTING_MATERIALS.nexus_crystal.name} x${state.materialsBag.nexus_crystal}`}
                        >
                          <img src={ENCHANTING_MATERIALS.nexus_crystal.icon} alt="Nexus Crystal" />
                          <span className="item-count">{state.materialsBag.nexus_crystal}</span>
                          <div className="slot-tooltip">
                            <div className="tooltip-name epic-text">{ENCHANTING_MATERIALS.nexus_crystal.name}</div>
                            <div className="tooltip-count">x{state.materialsBag.nexus_crystal}</div>
                            <div className="tooltip-desc">{ENCHANTING_MATERIALS.nexus_crystal.description}</div>
                          </div>
                        </div>
                      )}
                      {/* Empty slots */}
                      {Array.from({ length: Math.max(0, 16 - (state.materialsBag.nexus_crystal > 0 ? 1 : 0)) }).map((_, idx) => (
                        <div key={`mat-empty-${idx}`} className="bag-slot empty" />
                      ))}
                    </div>
                    {state.materialsBag.nexus_crystal === 0 && (
                      <div className="bag-empty-hint">
                        <p>Disenchant epic gear to obtain Nexus Crystals.</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Context Menu for Disenchanting */}
              {bagContextMenu && (() => {
                const contextItem = state.playerBag[bagContextMenu.index];
                const isPreRaid = contextItem?.isPreRaidBis;
                return (
                  <div
                    className="bag-context-menu"
                    style={{ left: bagContextMenu.x, top: bagContextMenu.y }}
                    onClick={() => setBagContextMenu(null)}
                  >
                    <button
                      onClick={() => {
                        engine.disenchantItem(bagContextMenu.index);
                        setBagContextMenu(null);
                      }}
                    >
                      {isPreRaid ? 'Destroy' : 'Disenchant'}
                    </button>
                    {isPreRaid && <div className="pre-raid-destroy-warning">Cannot be disenchanted</div>}
                    <button onClick={() => setBagContextMenu(null)}>Cancel</button>
                  </div>
                );
              })()}

              {/* Quest Materials Section (Dragon Heads) */}
              <div className="bag-section">
                <div className="bag-header">
                  <span className="bag-name">Quest Items</span>
                  <span className="bag-slots">{state.questMaterials.length} items</span>
                </div>
                <div className="bag-grid">
                  {/* Quest materials in inventory */}
                  {engine.getQuestMaterials().map(({ material, count }) => {
                    const questMaterial = QUEST_MATERIALS[material];
                    const canClaim = engine.canClaimQuestReward(material);
                    return (
                      <div
                        key={material}
                        className={`bag-slot filled epic ${selectedQuestMaterial === material ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedQuestMaterial(material);
                          setSelectedQuestReward(null);
                          setSelectedQuestRecipient(null);
                        }}
                        title={`${questMaterial.name}${count > 1 ? ` x${count}` : ''}\n${questMaterial.description}`}
                      >
                        <img src={questMaterial.icon} alt={questMaterial.name} />
                        {count > 1 && <span className="item-count">{count}</span>}
                        <div className="slot-tooltip">
                          <div className="tooltip-name epic-text">{questMaterial.name}</div>
                          {count > 1 && <div className="tooltip-count">x{count}</div>}
                          <div className="tooltip-desc">{questMaterial.description}</div>
                          {canClaim ? (
                            <div className="tooltip-hint">Click to turn in for a reward!</div>
                          ) : (
                            <div className="tooltip-hint claimed">You already claimed your reward. Assign to a raid member.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Empty slots */}
                  {Array.from({ length: Math.max(0, 8 - engine.getQuestMaterials().length) }).map((_, idx) => (
                    <div key={`quest-empty-${idx}`} className="bag-slot empty" />
                  ))}
                </div>

                {/* Empty state message */}
                {state.questMaterials.length === 0 && (
                  <div className="bag-empty-message">
                    <p>No quest items!</p>
                    <p className="hint">Defeat Onyxia or Nefarian to obtain their heads.</p>
                  </div>
                )}
              </div>

              {/* Quest Turn-In Section */}
              {selectedQuestMaterial && (
                <div className="crafting-section quest-turnin-section">
                  <div className="crafting-header">
                    <span>Quest Turn-In: {QUEST_MATERIALS[selectedQuestMaterial].name}</span>
                    <button className="close-btn" onClick={() => setSelectedQuestMaterial(null)}>×</button>
                  </div>

                  {/* Show available rewards */}
                  <div className="quest-rewards">
                    <div className="quest-rewards-label">Choose your reward:</div>
                    <div className="quest-rewards-grid">
                      {QUEST_MATERIALS[selectedQuestMaterial].rewards.map((rewardId) => {
                        const reward = ALL_QUEST_REWARDS[rewardId as QuestRewardId];
                        if (!reward) return null;
                        return (
                          <div
                            key={rewardId}
                            className={`quest-reward-card ${selectedQuestReward === rewardId ? 'selected' : ''}`}
                            onClick={() => setSelectedQuestReward(rewardId as QuestRewardId)}
                          >
                            <img src={reward.icon} alt={reward.name} className="quest-reward-icon" />
                            <div className="quest-reward-info">
                              <span className="quest-reward-name epic-text">{reward.name}</span>
                              <span className="quest-reward-slot">{reward.slot}</span>
                              <div className="quest-reward-stats">
                                {Object.entries(reward.stats).map(([stat, value]) => (
                                  <span key={stat} className="stat">+{value} {stat}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recipient selection */}
                  {selectedQuestReward && (
                    <div className="quest-recipient">
                      {engine.canClaimQuestReward(selectedQuestMaterial) ? (
                        <>
                          <div className="quest-recipient-label">Turn in for yourself or assign to raid member:</div>
                          <div className="quest-recipient-options">
                            <button
                              className="quest-claim-btn self"
                              onClick={() => {
                                engine.claimQuestRewardForSelf(selectedQuestMaterial, selectedQuestReward);
                                setSelectedQuestMaterial(null);
                                setSelectedQuestReward(null);
                              }}
                            >
                              Claim for Myself
                            </button>
                            <div className="quest-recipient-divider">or</div>
                            <select
                              className="quest-recipient-select"
                              value={selectedQuestRecipient || ''}
                              onChange={e => setSelectedQuestRecipient(e.target.value)}
                            >
                              <option value="">Assign to raid member...</option>
                              {state.raid.filter(m => m.id !== 'player').map(m => {
                                const hasClaimed = !engine.canRaidMemberClaimQuestReward(m.id, selectedQuestMaterial);
                                return (
                                  <option key={m.id} value={m.id} disabled={hasClaimed}>
                                    {m.name} ({m.class}){hasClaimed ? ' - Already claimed' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            {selectedQuestRecipient && (
                              <button
                                className="quest-claim-btn assign"
                                onClick={() => {
                                  engine.assignQuestRewardToRaidMember(selectedQuestMaterial, selectedQuestReward, selectedQuestRecipient);
                                  setSelectedQuestMaterial(null);
                                  setSelectedQuestReward(null);
                                  setSelectedQuestRecipient(null);
                                }}
                              >
                                Assign
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="quest-recipient-label claimed-warning">
                            You already claimed your reward from this quest. Assign to a raid member:
                          </div>
                          <div className="quest-recipient-options">
                            <select
                              className="quest-recipient-select"
                              value={selectedQuestRecipient || ''}
                              onChange={e => setSelectedQuestRecipient(e.target.value)}
                            >
                              <option value="">Select raid member...</option>
                              {state.raid.filter(m => m.id !== 'player').map(m => {
                                const hasClaimed = !engine.canRaidMemberClaimQuestReward(m.id, selectedQuestMaterial);
                                return (
                                  <option key={m.id} value={m.id} disabled={hasClaimed}>
                                    {m.name} ({m.class}){hasClaimed ? ' - Already claimed' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            {selectedQuestRecipient && (
                              <button
                                className="quest-claim-btn assign"
                                onClick={() => {
                                  engine.assignQuestRewardToRaidMember(selectedQuestMaterial, selectedQuestReward, selectedQuestRecipient);
                                  setSelectedQuestMaterial(null);
                                  setSelectedQuestReward(null);
                                  setSelectedQuestRecipient(null);
                                }}
                              >
                                Assign to {state.raid.find(m => m.id === selectedQuestRecipient)?.name}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Legendary Materials Section */}
              <div className="bag-section">
                <div className="bag-header">
                  <span className="bag-name">Legendary Materials</span>
                  <span className="bag-slots">{state.legendaryMaterials.length} / 16</span>
                </div>
                <div className="bag-grid">
                  {/* Filled slots with legendary materials */}
                  {engine.getLegendaryMaterials().map(material => (
                    <div
                      key={material.id}
                      className="bag-slot filled legendary"
                      title={`${material.name}\n${material.description}`}
                    >
                      <img src={material.icon} alt={material.name} />
                      <div className="slot-tooltip">
                        <div className="tooltip-name legendary-text">{material.name}</div>
                        <div className="tooltip-desc">{material.description}</div>
                        <div className="tooltip-source">
                          Drops from: {
                            material.dropsFrom === 'garr' ? 'Garr' :
                            material.dropsFrom === 'baron_geddon' ? 'Baron Geddon' :
                            material.dropsFrom === 'ragnaros' ? 'Ragnaros' : material.dropsFrom
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Empty slots to fill the grid */}
                  {Array.from({ length: 16 - state.legendaryMaterials.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="bag-slot empty" />
                  ))}
                </div>
              </div>

              {/* Drop hints when empty */}
              {state.legendaryMaterials.length === 0 && (
                <div className="bag-empty-message">
                  <p>Your bags are empty!</p>
                  <p className="hint">Defeat raid bosses for a chance at legendary materials:</p>
                  <ul className="drop-hints-list">
                    <li>Left Binding of the Windseeker - Garr (3%)</li>
                    <li>Right Binding of the Windseeker - Baron Geddon (3%)</li>
                    <li>Eye of Sulfuras - Ragnaros (2%)</li>
                  </ul>
                </div>
              )}

              {/* Crafting Section */}
              <div className="crafting-section">
                <div className="crafting-header">
                  <span>Legendary Crafting</span>
                </div>

                {/* Sulfuras Crafting Card */}
                <div className={`craft-card ${engine.canCraftSulfuras() ? 'available' : 'unavailable'}`}>
                  <div className="craft-card-header">
                    <img
                      src="/icons/inv_hammer_unique_sulfuras.jpg"
                      alt="Sulfuras"
                      className="craft-card-icon"
                    />
                    <div className="craft-card-info">
                      <span className="craft-card-name legendary-text">Sulfuras, Hand of Ragnaros</span>
                      <span className="craft-card-type">Two-Hand Mace</span>
                    </div>
                  </div>
                  <div className="craft-card-reqs">
                    <div className={`req ${state.legendaryMaterials.includes('eye_of_sulfuras') ? 'met' : 'unmet'}`}>
                      {state.legendaryMaterials.includes('eye_of_sulfuras') ? '✓' : '○'} Eye of Sulfuras
                    </div>
                  </div>
                  {engine.canCraftSulfuras() && (
                    <div className="craft-card-action">
                      <select
                        className="craft-recipient-select"
                        value={selectedLegendaryCraftTarget || ''}
                        onChange={e => setSelectedLegendaryCraftTarget(e.target.value)}
                      >
                        <option value="">Select recipient...</option>
                        {state.raid
                          .filter(m => m.class === 'warrior' || m.class === 'paladin')
                          .map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.class})
                            </option>
                          ))}
                      </select>
                      <button
                        className="craft-button sulfuras"
                        disabled={!selectedLegendaryCraftTarget}
                        onClick={() => {
                          if (selectedLegendaryCraftTarget) {
                            engine.craftSulfuras(selectedLegendaryCraftTarget);
                            setSelectedLegendaryCraftTarget(null);
                          }
                        }}
                      >
                        Forge
                      </button>
                    </div>
                  )}
                </div>

                {/* Thunderfury Crafting Card */}
                <div className={`craft-card ${engine.canCraftThunderfury() ? 'available' : engine.hasThunderfuryMaterialsButNeedsThunderaan() ? 'needs-boss' : 'unavailable'}`}>
                  <div className="craft-card-header">
                    <img
                      src="/icons/inv_sword_39.jpg"
                      alt="Thunderfury"
                      className="craft-card-icon"
                    />
                    <div className="craft-card-info">
                      <span className="craft-card-name legendary-text">Thunderfury, Blessed Blade of the Windseeker</span>
                      <span className="craft-card-type">One-Hand Sword</span>
                    </div>
                  </div>
                  <div className="craft-card-reqs">
                    <div className={`req ${state.legendaryMaterials.includes('bindings_of_the_windseeker_left') ? 'met' : 'unmet'}`}>
                      {state.legendaryMaterials.includes('bindings_of_the_windseeker_left') ? '✓' : '○'} Left Binding
                    </div>
                    <div className={`req ${state.legendaryMaterials.includes('bindings_of_the_windseeker_right') ? 'met' : 'unmet'}`}>
                      {state.legendaryMaterials.includes('bindings_of_the_windseeker_right') ? '✓' : '○'} Right Binding
                    </div>
                    <div className={`req ${state.thunderaanDefeated ? 'met' : 'unmet'}`}>
                      {state.thunderaanDefeated ? '✓' : '○'} Defeat Prince Thunderaan
                      {!state.thunderaanDefeated && !state.silithusUnlocked && <span className="coming-soon">(Silithus - Locked)</span>}
                    </div>
                  </div>
                  {engine.hasThunderfuryMaterialsButNeedsThunderaan() && (
                    <div className="craft-card-blocked">
                      {state.silithusUnlocked
                        ? 'You have both bindings! Defeat Prince Thunderaan in Silithus to forge Thunderfury.'
                        : 'You have both bindings! Defeat Firemaw in BWL to summon Prince Thunderaan.'}
                    </div>
                  )}
                  {engine.canCraftThunderfury() && (
                    <div className="craft-card-action">
                      <select
                        className="craft-recipient-select"
                        value={selectedLegendaryCraftTarget || ''}
                        onChange={e => setSelectedLegendaryCraftTarget(e.target.value)}
                      >
                        <option value="">Select recipient...</option>
                        {state.raid
                          .filter(m => ['warrior', 'rogue', 'paladin', 'hunter'].includes(m.class))
                          .map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.class})
                            </option>
                          ))}
                      </select>
                      <button
                        className="craft-button thunderfury"
                        disabled={!selectedLegendaryCraftTarget}
                        onClick={() => {
                          if (selectedLegendaryCraftTarget) {
                            engine.craftThunderfury(selectedLegendaryCraftTarget);
                            setSelectedLegendaryCraftTarget(null);
                          }
                        }}
                      >
                        Forge
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auction House Modal */}
      {state.showAuctionHouse && (
        <div className="modal-overlay" onClick={() => engine.closeAuctionHouse()}>
          <div className="auction-house-modal" onClick={e => e.stopPropagation()}>
            <div className="ah-header">
              <div className="ah-title">
                <img
                  src="/icons/inv_misc_coin_01.jpg"
                  alt="AH"
                  className="ah-title-icon"
                />
                <h2>Auction House - Enchants</h2>
              </div>
              <div className="ah-currency">
                <img src={ENCHANTING_MATERIALS.nexus_crystal.icon} alt="Nexus Crystal" />
                <span>{state.materialsBag.nexus_crystal}</span>
              </div>
              <button className="ah-close-btn" onClick={() => engine.closeAuctionHouse()}>×</button>
            </div>

            <div className="ah-member-selector">
              <label>Enchanting gear for:</label>
              <select
                value={ahSelectedMember || (state.isRaidLeaderMode ? state.raid[0]?.id : 'player')}
                onChange={e => {
                  setAhSelectedMember(e.target.value);
                  setAhSelectedSlot(null);
                }}
              >
                {!state.isRaidLeaderMode && (
                  <option value="player">{state.playerName} (You)</option>
                )}
                {state.raid.filter(m => m.id !== 'player').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.class}) - {m.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="ah-content">
              {/* Left: Equipment Slots */}
              <div className="ah-equipment">
                <h3>Equipment</h3>
                <div className="ah-equipment-grid">
                  {(() => {
                    // Get equipment based on selected member
                    // In Raid Leader Mode, player doesn't have their own gear - use first raid member as default
                    const effectiveMember = ahSelectedMember || (state.isRaidLeaderMode ? state.raid[0]?.id : 'player');
                    const equipment: Equipment = effectiveMember === 'player'
                      ? state.playerEquipment
                      : (state.raid.find(m => m.id === effectiveMember)?.equipment || {}) as Equipment;

                    const slots: EquipmentSlot[] = ['head', 'shoulders', 'back', 'chest', 'wrist', 'hands', 'legs', 'feet', 'weapon', 'offhand'];

                    return slots.map(slot => {
                      const item = equipment[slot];
                      const hasEnchant = item?.enchantId;
                      const enchant = hasEnchant && item?.enchantId ? ENCHANTS[item.enchantId] : null;

                      return (
                        <div
                          key={slot}
                          className={`ah-equipment-slot ${item ? 'filled' : 'empty'} ${ahSelectedSlot === slot ? 'selected' : ''} ${hasEnchant ? 'enchanted' : ''}`}
                          onClick={() => item && setAhSelectedSlot(slot)}
                          title={item ? `${item.name}${enchant ? `\n${enchant.name}` : ''}` : `No ${slot} equipped`}
                        >
                          {item ? (
                            <>
                              <img src={item.icon} alt={item.name} className={`rarity-${item.rarity}-border`} />
                              <span className="ah-slot-label">{slot}</span>
                              {hasEnchant && <div className="enchant-indicator" />}
                            </>
                          ) : (
                            <span className="ah-slot-empty">{slot}</span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
                {ahSelectedSlot && (() => {
                  // In Raid Leader Mode, player doesn't have their own gear - use first raid member as default
                  const effectiveMember = ahSelectedMember || (state.isRaidLeaderMode ? state.raid[0]?.id : 'player');
                  const equipment: Equipment = effectiveMember === 'player'
                    ? state.playerEquipment
                    : (state.raid.find(m => m.id === effectiveMember)?.equipment || {}) as Equipment;
                  const item = equipment[ahSelectedSlot];
                  if (!item) return null;
                  const enchant = item.enchantId ? ENCHANTS[item.enchantId] : null;

                  return (
                    <div className="ah-selected-item">
                      <div className="ah-item-header">
                        <img src={item.icon} alt={item.name} />
                        <div className="ah-item-info">
                          <span className={`ah-item-name rarity-${item.rarity}-text`}>{item.name}</span>
                          <span className="ah-item-slot">{ahSelectedSlot} - iLvl {item.itemLevel}</span>
                        </div>
                      </div>
                      {enchant && (
                        <div className="ah-current-enchant">
                          Current: <span className="enchant-text">{enchant.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Right: Available Enchants */}
              <div className="ah-enchants">
                <h3>Available Enchants</h3>
                {ahSelectedSlot ? (
                  <div className="ah-enchants-list">
                    {(() => {
                      // For offhand slot, check if the item is actually a weapon (dual-wield)
                      // If so, show weapon enchants instead of shield enchants
                      const effectiveMember = ahSelectedMember || (state.isRaidLeaderMode ? state.raid[0]?.id : 'player');
                      const equipment: Equipment = effectiveMember === 'player'
                        ? state.playerEquipment
                        : (state.raid.find(m => m.id === effectiveMember)?.equipment || {}) as Equipment;
                      const selectedItem = equipment[ahSelectedSlot];

                      // If offhand slot has a one-hand weapon (dual-wield), use weapon enchants
                      let enchantSlot: EnchantSlot = ahSelectedSlot as EnchantSlot;
                      if (ahSelectedSlot === 'offhand' && selectedItem?.weaponType === 'one_hand') {
                        enchantSlot = 'weapon';
                      }

                      return getEnchantsForSlot(enchantSlot);
                    })().map(enchant => {
                      const canAfford = state.materialsBag.nexus_crystal >= enchant.cost;
                      return (
                        <div
                          key={enchant.id}
                          className={`ah-enchant-card ${canAfford ? '' : 'cannot-afford'}`}
                        >
                          <div className="ah-enchant-header">
                            <img src={enchant.icon} alt={enchant.name} />
                            <div className="ah-enchant-info">
                              <span className="ah-enchant-name">{enchant.name}</span>
                              <span className="ah-enchant-desc">{enchant.description}</span>
                            </div>
                          </div>
                          <div className="ah-enchant-footer">
                            <div className="ah-enchant-cost">
                              <img src={ENCHANTING_MATERIALS.nexus_crystal.icon} alt="Cost" />
                              <span className={canAfford ? '' : 'not-enough'}>{enchant.cost}</span>
                            </div>
                            <button
                              className="ah-buy-btn"
                              disabled={!canAfford}
                              onClick={() => {
                                // In Raid Leader Mode, default to first raid member if none selected
                                const effectiveMember = ahSelectedMember || (state.isRaidLeaderMode ? state.raid[0]?.id : 'player');
                                if (effectiveMember === 'player') {
                                  engine.purchaseEnchant(enchant.id, ahSelectedSlot);
                                } else {
                                  engine.purchaseEnchantForMember(enchant.id, ahSelectedSlot, effectiveMember);
                                }
                              }}
                            >
                              {canAfford ? 'Buy' : 'Need More'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {(() => {
                      // Same logic as above for determining enchant slot
                      const effectiveMember = ahSelectedMember || (state.isRaidLeaderMode ? state.raid[0]?.id : 'player');
                      const equipment: Equipment = effectiveMember === 'player'
                        ? state.playerEquipment
                        : (state.raid.find(m => m.id === effectiveMember)?.equipment || {}) as Equipment;
                      const selectedItem = equipment[ahSelectedSlot];
                      let enchantSlot: EnchantSlot = ahSelectedSlot as EnchantSlot;
                      if (ahSelectedSlot === 'offhand' && selectedItem?.weaponType === 'one_hand') {
                        enchantSlot = 'weapon';
                      }
                      return getEnchantsForSlot(enchantSlot).length === 0;
                    })() && (
                      <div className="ah-no-enchants">
                        No enchants available for this slot.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ah-select-hint">
                    Select an equipment slot to view available enchants.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
