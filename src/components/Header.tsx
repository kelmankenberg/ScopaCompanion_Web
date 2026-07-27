import React from 'react';
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
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRules,
  onOpenSettings,
  onOpenStats,
  onNewGame,
  soundEnabled,
  onToggleSound,
  currentDealerName,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-badge">
          <span className="logo-card gold">7♦</span>
        </div>
        <div className="logo-text">
          <h1>Scopa Companion</h1>
          <span className="logo-subtitle">Scorekeeper & Game Assistant</span>
        </div>
      </div>

      <div className="header-controls">
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
