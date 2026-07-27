import React, { useState, useEffect, useRef } from 'react';
import type { GameState, GameSettings, Player, RoundRecord } from './types/scopa';

import { Header } from './components/Header';
import { Scoreboard } from './components/Scoreboard';
import { RulesPanel } from './components/RulesPanel';
import { RoundWizardModal } from './components/RoundWizardModal';
import { HistoryLog } from './components/HistoryLog';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { VictoryModal } from './components/VictoryModal';
import { soundManager } from './utils/soundEffects';
import { isCloudSyncConfigured, loadCloudGameState, saveCloudGameState } from './utils/cloudSync';
import packageJson from '../package.json';

const LOCAL_STORAGE_KEY = 'scopa_companion_game_v1';
type CloudSyncStatus = 'disabled' | 'connecting' | 'syncing' | 'synced' | 'error';
const APP_VERSION = packageJson.version || '0.0.0';

const defaultSettings: GameSettings = {
  gameMode: '1v1',
  targetScore: 11,
  variantNapola: false,
  variantReBello: false,
  soundEnabled: true,
  dealerIndex: 0,
};

const defaultPlayers: Player[] = [
  { id: 'p1', name: 'Player 1', color: '#e74c3c', team: null },
  { id: 'p2', name: 'Player 2', color: '#3498db', team: null },
];

export const App: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [players, setPlayers] = useState<Player[]>(defaultPlayers);
  const [rounds, setRounds] = useState<RoundRecord[]>([]);
  const [currentDealerIndex, setCurrentDealerIndex] = useState<number>(0);

  // Modals visibility
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  const [savedPlayers, setSavedPlayers] = useState<string[]>([]);
  const [cloudUid, setCloudUid] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const saveDebounceRef = useRef<number | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(
    isCloudSyncConfigured() ? 'connecting' : 'disabled'
  );
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [cloudLastSyncedAt, setCloudLastSyncedAt] = useState<number | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'string' && err) return err;
    if (typeof err === 'object' && err !== null) {
      const maybeError = err as {
        message?: string;
        error_description?: string;
        details?: string;
        hint?: string;
        code?: string;
        status?: number;
      };

      const parts: string[] = [];
      const msg = maybeError.message || maybeError.error_description;
      if (msg) parts.push(msg);
      if (maybeError.details) parts.push(maybeError.details);
      if (maybeError.hint) parts.push(`Hint: ${maybeError.hint}`);
      if (maybeError.code) parts.push(`Code: ${maybeError.code}`);
      if (maybeError.status) parts.push(`Status: ${String(maybeError.status)}`);

      if (parts.length > 0) {
        return parts.join(' | ');
      }
    }
    return 'Unknown sync error';
  };

  const getStateTimestamp = (state: Partial<GameState> | null | undefined): number => {
    return Number(state?.updatedAt ?? state?.createdAt ?? 0);
  };

  const applyPersistedState = (state: GameState) => {
    if (state.settings) setSettings(state.settings);
    if (state.players) setPlayers(state.players);
    if (state.rounds) setRounds(state.rounds);
    if (state.savedPlayers) setSavedPlayers(state.savedPlayers);
    if (state.settings?.dealerIndex !== undefined) {
      setCurrentDealerIndex(state.settings.dealerIndex);
    }
    if (state.settings?.soundEnabled !== undefined) {
      soundManager.setEnabled(state.settings.soundEnabled);
    }
  };

  // Load from LocalStorage on mount
  useEffect(() => {
    let cancelled = false;

    const bootstrapState = async () => {
      let localState: GameState | null = null;
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          localState = JSON.parse(saved) as GameState;
        }
      } catch {
        // Ignore local load error
      }

      let cloudState: GameState | null = null;
      let uid: string | null = null;
      if (isCloudSyncConfigured()) {
        setCloudSyncStatus('connecting');
        try {
          const cloud = await loadCloudGameState();
          if (cloud) {
            uid = cloud.uid;
            cloudState = cloud.state;
          }
          setCloudSyncStatus('synced');
          setCloudSyncError(null);
          setCloudLastSyncedAt(Date.now());
        } catch (err) {
          setCloudSyncStatus('error');
          setCloudSyncError(getErrorMessage(err));
          // Ignore cloud load error and fall back to local-only behavior
        }
      } else {
        setCloudSyncStatus('disabled');
        setCloudSyncError(null);
      }

      if (cancelled) return;

      if (uid) setCloudUid(uid);

      const localStamp = getStateTimestamp(localState);
      const cloudStamp = getStateTimestamp(cloudState);
      const preferredState = cloudStamp > localStamp ? cloudState : localState;

      if (preferredState) {
        applyPersistedState(preferredState);
      }

      setIsHydrated(true);
    };

    void bootstrapState();

    return () => {
      cancelled = true;
    };

  }, []);

  // Save state to LocalStorage and cloud
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const stateToSave: GameState = {
        id: 'current',
        settings: { ...settings, dealerIndex: currentDealerIndex },
        players,
        rounds,
        currentDealerId: players[currentDealerIndex % players.length]?.id || 'p1',
        isFinished: false,
        winnerId: null,
        savedPlayers,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));

      if (saveDebounceRef.current !== null) {
        window.clearTimeout(saveDebounceRef.current);
      }

      saveDebounceRef.current = window.setTimeout(() => {
        void (async () => {
          if (!isCloudSyncConfigured()) {
            setCloudSyncStatus('disabled');
            setCloudSyncError(null);
            return;
          }

          try {
            setCloudSyncStatus('syncing');
            const syncedUid = await saveCloudGameState(stateToSave, cloudUid);
            if (syncedUid && syncedUid !== cloudUid) {
              setCloudUid(syncedUid);
            }
            setCloudSyncStatus('synced');
            setCloudSyncError(null);
            setCloudLastSyncedAt(Date.now());
          } catch (err) {
            setCloudSyncStatus('error');
            setCloudSyncError(getErrorMessage(err));
            // Ignore cloud save errors and keep local save as source of truth
          }
        })();
      }, 500);
    } catch {
      // Ignore save error
    }
  }, [settings, players, rounds, currentDealerIndex, savedPlayers, isHydrated, cloudUid]);

  // Entities for scoring (Players or Teams)
  const getEntities = () => {
    if (settings.gameMode === '2v2') {
      const teamAPlayers = players.filter((p) => p.team === 'A').map((p) => p.name);
      const teamBPlayers = players.filter((p) => p.team === 'B').map((p) => p.name);

      return [
        {
          id: 'team_A',
          name: 'Team A',
          color: '#e74c3c',
          teamMembers: teamAPlayers,
        },
        {
          id: 'team_B',
          name: 'Team B',
          color: '#3498db',
          teamMembers: teamBPlayers,
        },
      ];
    }

    return players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
    }));
  };

  const entities = getEntities();

  // Compute Current Total Cumulative Scores
  const getCumulativeScores = (): Record<string, number> => {
    const totals: Record<string, number> = {};
    for (const e of entities) {
      totals[e.id] = 0;
    }
    for (const r of rounds) {
      for (const e of entities) {
        totals[e.id] = (totals[e.id] || 0) + (r.scores[e.id] || 0);
      }
    }
    return totals;
  };

  const cumulativeScores = getCumulativeScores();

  // Current Leader
  const getCurrentLeaderId = (): string | null => {
    let topScore = -1;
    let leaderId: string | null = null;
    let isTie = false;

    for (const e of entities) {
      const sc = cumulativeScores[e.id] || 0;
      if (sc > topScore) {
        topScore = sc;
        leaderId = e.id;
        isTie = false;
      } else if (sc === topScore && sc > 0) {
        isTie = true;
      }
    }

    return isTie ? null : leaderId;
  };

  const currentLeaderId = getCurrentLeaderId();

  // Check Game Winner
  const checkWinner = (): { isFinished: boolean; winnerId: string | null } => {
    const target = Number(settings.targetScore);
    let highestScore = -1;
    let winners: string[] = [];

    for (const e of entities) {
      const sc = cumulativeScores[e.id] || 0;
      if (sc >= target) {
        if (sc > highestScore) {
          highestScore = sc;
          winners = [e.id];
        } else if (sc === highestScore) {
          winners.push(e.id);
        }
      }
    }

    // Must be unique winner above target score at end of round
    if (winners.length === 1) {
      return { isFinished: true, winnerId: winners[0] };
    }

    return { isFinished: false, winnerId: null };
  };

  const { isFinished, winnerId } = checkWinner();
  const winnerEntity = entities.find((e) => e.id === winnerId);

  // Current Dealer info
  const currentDealer = players[currentDealerIndex % players.length];

  // Handlers
  const handleToggleSound = () => {
    const nextState = !settings.soundEnabled;
    setSettings({ ...settings, soundEnabled: nextState });
    soundManager.setEnabled(nextState);
  };

  const handleSubmitRound = (
    roundScores: Record<string, number>,
    breakdown: any,
    isOverride: boolean
  ) => {
    const newCumulative: Record<string, number> = {};
    for (const e of entities) {
      newCumulative[e.id] = (cumulativeScores[e.id] || 0) + (roundScores[e.id] || 0);
    }

    const newRound: RoundRecord = {
      id: `r_${Date.now()}`,
      roundNumber: rounds.length + 1,
      dealerId: currentDealer?.id || 'p1',
      scores: roundScores,
      cumulativeScores: newCumulative,
      breakdown,
      timestamp: Date.now(),
      isOverride,
    };

    setRounds([...rounds, newRound]);
    setIsWizardOpen(false);

    // Rotate dealer for next round
    setCurrentDealerIndex((prev) => (prev + 1) % players.length);
  };

  const handleUndoLastRound = () => {
    if (rounds.length === 0) return;
    setRounds(rounds.slice(0, -1));
    setCurrentDealerIndex((prev) => (prev - 1 + players.length) % players.length);
  };

  const handleNewGame = () => {
    if (window.confirm('Are you sure you want to reset and start a new game?')) {
      setRounds([]);
      setCurrentDealerIndex(0);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const handleSaveSettings = (
    newSettings: GameSettings,
    newPlayers: Player[],
    newSavedPlayers: string[]
  ) => {
    setSettings(newSettings);
    setPlayers(newPlayers);
    setSavedPlayers(newSavedPlayers);
    soundManager.setEnabled(newSettings.soundEnabled);
  };


  // Map entities for Scoreboard
  const scoreboardEntities = entities.map((e) => ({
    id: e.id,
    name: e.name,
    color: e.color,
    score: cumulativeScores[e.id] || 0,
    isDealer: settings.gameMode === '2v2' ? false : currentDealer?.id === e.id,
    teamMembers: 'teamMembers' in e ? e.teamMembers : undefined,

  }));

  return (
    <div className="app-layout">
      {/* Background Felt Grid */}
      <div className="felt-background" />

      {/* Main Header */}
      <Header
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onNewGame={handleNewGame}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        currentDealerName={currentDealer?.name}
        cloudSyncStatus={cloudSyncStatus}
        cloudSyncError={cloudSyncError}
        cloudLastSyncedAt={cloudLastSyncedAt}
        appVersion={APP_VERSION}
      />

      {/* Main Content Area */}
      <main className="app-main-content">
        <Scoreboard
          entities={scoreboardEntities}
          targetScore={settings.targetScore}
          currentLeaderId={currentLeaderId}
          roundNumber={rounds.length + 1}
          onOpenWizard={() => setIsWizardOpen(true)}
          onOpenOverride={() => setIsWizardOpen(true)}
          isFinished={isFinished}
          winnerId={winnerId}
        />

        <HistoryLog
          rounds={rounds}
          entities={entities}
          onUndoLastRound={handleUndoLastRound}
        />
      </main>

      {/* Slideout Rules Panel */}
      <RulesPanel
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Round Wizard & Override Modal */}
      <RoundWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmitRound={handleSubmitRound}
        entities={entities}
        settings={settings}
        roundNumber={rounds.length + 1}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        players={players}
        savedPlayers={savedPlayers}
        onSaveSettings={handleSaveSettings}
      />


      {/* Stats Analytics Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        rounds={rounds}
        entities={entities}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={isFinished}
        winnerName={winnerEntity?.name || 'Winner'}
        winnerColor={winnerEntity?.color || '#f1c40f'}
        winnerScore={cumulativeScores[winnerId || ''] || 0}
        onRematch={() => {
          setRounds([]);
          setCurrentDealerIndex(0);
        }}
      />
    </div>
  );
};

export default App;

