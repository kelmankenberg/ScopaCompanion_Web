import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Settings, Volume2, VolumeX, RotateCcw, BarChart2 } from 'lucide-react';

import { soundManager } from '../utils/soundEffects';

interface HeaderProps {
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onNewGame: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentDealerName?: string;
  cloudSyncStatus: 'disabled' | 'connecting' | 'syncing' | 'synced' | 'error';
  cloudSyncError: string | null;
  cloudLastSyncedAt: number | null;
  appVersion: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRules,
  onOpenSettings,
  onOpenStats,
  onNewGame,
  soundEnabled,
  onToggleSound,
  currentDealerName,
  cloudSyncStatus,
  cloudSyncError,
  cloudLastSyncedAt,
  appVersion,
}) => {
  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState<boolean>(false);

  const normalizedError = useMemo(() => {
    if (!cloudSyncError) return null;
    const compact = cloudSyncError.replace(/\s+/g, ' ').trim();
    return compact || null;
  }, [cloudSyncError]);

  const statusLabels: Record<HeaderProps['cloudSyncStatus'], string> = {
    disabled: 'Local only',
    connecting: 'Connecting',
    syncing: 'Syncing',
    synced: 'Synced',
    error: 'Sync error',
  };

  const statusTitles: Record<HeaderProps['cloudSyncStatus'], string> = {
    disabled: 'Cloud sync is not configured. The app is using local storage only.',
    connecting: 'Connecting to cloud sync provider...',
    syncing: 'Saving changes to cloud...',
    synced: 'Cloud sync is active and up to date.',
    error: 'Cloud sync failed. Local changes are still saved on this device.',
  };

  const syncTimeLabel = cloudLastSyncedAt
    ? new Date(cloudLastSyncedAt).toLocaleTimeString()
    : 'No successful sync yet';

  useEffect(() => {
    if (cloudSyncStatus === 'error' && normalizedError) {
      setIsSyncPanelOpen(true);
    }
  }, [cloudSyncStatus, normalizedError]);

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-badge">
          <span className="logo-card gold">7♦</span>
        </div>
        <div className="logo-text">
          <div className="logo-title-row">
            <h1>Scopa Companion</h1>
            <span className="app-version-badge">v{appVersion}</span>
          </div>
          <span className="logo-subtitle">Scorekeeper & Game Assistant</span>
        </div>
      </div>

      <div className="header-controls">
        <div className="sync-status-wrap">
          <button
            type="button"
            className={`sync-status-badge ${cloudSyncStatus}`}
            title={statusTitles[cloudSyncStatus]}
            aria-live="polite"
            aria-expanded={isSyncPanelOpen}
            aria-controls="sync-status-panel"
            onClick={() => setIsSyncPanelOpen((prev) => !prev)}
          >
            <span className="sync-dot" />
            <span>{statusLabels[cloudSyncStatus]}</span>
          </button>

          {isSyncPanelOpen && (
            <div id="sync-status-panel" className="sync-status-panel" role="dialog" aria-label="Cloud sync diagnostics">
              {cloudSyncStatus === 'error' && normalizedError && (
                <p className="sync-panel-line error-text prominent">
                  <strong>Sync error:</strong> {normalizedError}
                </p>
              )}
              <p className="sync-panel-line">
                <strong>Status:</strong> {statusLabels[cloudSyncStatus]}
              </p>
              <p className="sync-panel-line">
                <strong>Last success:</strong> {syncTimeLabel}
              </p>
              <p className="sync-panel-line subtle">{statusTitles[cloudSyncStatus]}</p>
              {normalizedError && (
                <p className="sync-panel-line error-text">
                  <strong>Details:</strong> {normalizedError}
                </p>
              )}
            </div>
          )}
        </div>

        {cloudSyncStatus === 'error' && normalizedError && (
          <button
            type="button"
            className="sync-error-chip"
            title={normalizedError}
            onClick={() => setIsSyncPanelOpen(true)}
          >
            {normalizedError}
          </button>
        )}

        {currentDealerName && (
          <div className="dealer-badge" title="Current Dealer for this round">
            <span className="dealer-icon">🃏</span>
            <span className="dealer-label">Dealer:</span>
            <strong className="dealer-name">{currentDealerName}</strong>
          </div>
        )}

        <button
          className="icon-btn rules-trigger-btn"
          onClick={() => {
            soundManager.playClick();
            onOpenRules();
          }}
          title="Official Scopa Rules & Scoring Guide"
        >
          <BookOpen size={18} />
          <span className="btn-text">Rules</span>
        </button>

        <button
          className="icon-btn"
          onClick={() => {
            soundManager.playClick();
            onOpenStats();
          }}
          title="Game Statistics & Match Analytics"
        >
          <BarChart2 size={18} />
          <span className="btn-text">Stats</span>
        </button>

        <button
          className="icon-btn"
          onClick={() => {
            soundManager.playClick();
            onOpenSettings();
          }}
          title="Game Settings & Variants"
        >
          <Settings size={18} />
        </button>

        <button
          className={`icon-btn ${!soundEnabled ? 'muted' : ''}`}
          onClick={() => {
            soundManager.playClick();
            onToggleSound();
          }}
          title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          className="icon-btn danger-hover"
          onClick={() => {
            soundManager.playClick();
            onNewGame();
          }}
          title="Start New Game / Reset"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </header>
  );
};
