import React, { useState } from 'react';
import { X, Users, Award, Check, UserPlus, Trash2, Bookmark, Sparkles, Sliders, Shuffle, UserCheck } from 'lucide-react';

import type { GameMode, TargetScore, GameSettings, Player } from '../types/scopa';
import { soundManager } from '../utils/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  players: Player[];
  onSaveSettings: (newSettings: GameSettings, newPlayers: Player[], savedPlayers: string[]) => void;
  savedPlayers?: string[];
}

const DEFAULT_SAVED_PLAYERS = ['Marco', 'Giulia', 'Matteo', 'Sofia', 'Francesca', 'Alessandro'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  players,
  onSaveSettings,
  savedPlayers: initialSavedPlayers,
}) => {
  const [gameMode, setGameMode] = useState<GameMode>(settings.gameMode);
  const [targetScore, setTargetScore] = useState<TargetScore>(settings.targetScore);
  const [customScoreInput, setCustomScoreInput] = useState<string>(
    [11, 16, 21].includes(Number(settings.targetScore)) ? '' : String(settings.targetScore)
  );
  const [variantNapola, setVariantNapola] = useState<boolean>(settings.variantNapola);
  const [variantReBello, setVariantReBello] = useState<boolean>(settings.variantReBello);
  const [tempPlayers, setTempPlayers] = useState<Player[]>(players);
  const [dealerSetupMode, setDealerSetupMode] = useState<'random' | 'manual'>(
    settings.initialDealerMode ?? 'random'
  );
  const [manualDealerId, setManualDealerId] = useState<string>(() => {
    const bySettings = players[settings.dealerIndex]?.id;
    return bySettings || players[0]?.id || 'p1';
  });
  
  // Saved Roster State
  const [roster, setRoster] = useState<string[]>(() => {
    if (initialSavedPlayers && initialSavedPlayers.length > 0) return initialSavedPlayers;
    try {
      const stored = localStorage.getItem('scopa_saved_players_v1');
      return stored ? JSON.parse(stored) : DEFAULT_SAVED_PLAYERS;
    } catch {
      return DEFAULT_SAVED_PLAYERS;
    }
  });

  const [newRosterInput, setNewRosterInput] = useState<string>('');
  const [showRosterManager, setShowRosterManager] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGameModeChange = (mode: GameMode) => {
    soundManager.playClick();
    setGameMode(mode);

    let nextPlayers: Player[] = tempPlayers;
    if (mode === '1v1') {
      nextPlayers = [
        { id: 'p1', name: tempPlayers[0]?.name || 'Player 1', color: '#e74c3c', team: null },
        { id: 'p2', name: tempPlayers[1]?.name || 'Player 2', color: '#3498db', team: null },
      ];
    } else if (mode === '2v2') {
      nextPlayers = [
        { id: 'p1', name: tempPlayers[0]?.name || 'Player 1', color: '#e74c3c', team: 'A' },
        { id: 'p2', name: tempPlayers[1]?.name || 'Player 2', color: '#e74c3c', team: 'A' },
        { id: 'p3', name: tempPlayers[2]?.name || 'Player 3', color: '#3498db', team: 'B' },
        { id: 'p4', name: tempPlayers[3]?.name || 'Player 4', color: '#3498db', team: 'B' },
      ];
    } else if (mode === '3p') {
      nextPlayers = [
        { id: 'p1', name: tempPlayers[0]?.name || 'Player 1', color: '#e74c3c', team: null },
        { id: 'p2', name: tempPlayers[1]?.name || 'Player 2', color: '#3498db', team: null },
        { id: 'p3', name: tempPlayers[2]?.name || 'Player 3', color: '#2ecc71', team: null },
      ];
    }

    setTempPlayers(nextPlayers);
    if (!nextPlayers.some((p) => p.id === manualDealerId)) {
      setManualDealerId(nextPlayers[0]?.id || 'p1');
    }
  };

  const handlePlayerNameChange = (id: string, name: string) => {
    setTempPlayers(
      tempPlayers.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  const handleQuickSelectName = (id: string, savedName: string) => {
    soundManager.playCardSelect();
    handlePlayerNameChange(id, savedName);
  };

  const handleSaveToRoster = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || roster.includes(trimmed)) return;
    soundManager.playClick();
    const updated = [...roster, trimmed];
    setRoster(updated);
    try {
      localStorage.setItem('scopa_saved_players_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleRemoveFromRoster = (nameToRemove: string) => {
    soundManager.playClick();
    const updated = roster.filter((n) => n !== nameToRemove);
    setRoster(updated);
    try {
      localStorage.setItem('scopa_saved_players_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleAddManualRosterItem = () => {
    if (!newRosterInput.trim()) return;
    handleSaveToRoster(newRosterInput);
    setNewRosterInput('');
  };

  const handleSave = () => {
    soundManager.playClick();
    let finalTargetScore = targetScore;
    if (customScoreInput.trim()) {
      const parsed = parseInt(customScoreInput);
      if (!isNaN(parsed) && parsed > 0) {
        finalTargetScore = parsed;
      }
    }

    const playerCount = Math.max(1, tempPlayers.length);
    const currentDealerIdx = ((settings.dealerIndex % playerCount) + playerCount) % playerCount;

    let resolvedDealerIndex = Math.max(0, tempPlayers.findIndex((p) => p.id === manualDealerId));
    if (dealerSetupMode === 'random') {
      resolvedDealerIndex = Math.floor(Math.random() * playerCount);

      // Make random selection visibly meaningful by avoiding the current dealer when possible.
      if (playerCount > 1 && resolvedDealerIndex === currentDealerIdx) {
        resolvedDealerIndex = (resolvedDealerIndex + 1 + Math.floor(Math.random() * (playerCount - 1))) % playerCount;
      }
    }

    onSaveSettings(
      {
        ...settings,
        gameMode,
        targetScore: finalTargetScore,
        variantNapola,
        variantReBello,
        dealerIndex: resolvedDealerIndex,
        initialDealerMode: dealerSetupMode,
      },
      tempPlayers,
      roster
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container settings-modal-modern" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modern-modal-header">
          <div className="header-left">
            <div className="header-icon-box">
              <Sliders size={22} className="icon-gold" />
            </div>
            <div>
              <h2>Match Settings & Rules</h2>
              <span className="header-sub">Customize game format, rule variants, and player profiles</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modern-modal-body custom-scrollbar">
          {/* SECTION 1: GAME MODE */}
          <div className="modern-section">
            <div className="section-title">
              <Users size={18} className="icon-gold" />
              <h3>Game Mode & Format</h3>
            </div>

            <div className="mode-cards-grid">
              <div
                className={`mode-card ${gameMode === '1v1' ? 'selected' : ''}`}
                onClick={() => handleGameModeChange('1v1')}
              >
                <div className="mode-card-badge">2 Players</div>
                <div className="mode-card-icon">🎴</div>
                <h4>1v1 Duel</h4>
                <p>Head-to-head classic match between 2 players.</p>
                {gameMode === '1v1' && <div className="selected-check"><Check size={14} /></div>}
              </div>

              <div
                className={`mode-card ${gameMode === '2v2' ? 'selected' : ''}`}
                onClick={() => handleGameModeChange('2v2')}
              >
                <div className="mode-card-badge">4 Players</div>
                <div className="mode-card-icon">👥</div>
                <h4>2v2 Teams</h4>
                <p>Partnership match (Team A vs Team B).</p>
                {gameMode === '2v2' && <div className="selected-check"><Check size={14} /></div>}
              </div>

              <div
                className={`mode-card ${gameMode === '3p' ? 'selected' : ''}`}
                onClick={() => handleGameModeChange('3p')}
              >
                <div className="mode-card-badge">3 Players</div>
                <div className="mode-card-icon">🗡️</div>
                <h4>3-Player Cutthroat</h4>
                <p>Individual free-for-all for 3 independent players.</p>
                {gameMode === '3p' && <div className="selected-check"><Check size={14} /></div>}
              </div>
            </div>
          </div>

          {/* SECTION 2: TARGET SCORE */}
          <div className="modern-section">
            <div className="section-title">
              <Award size={18} className="icon-gold" />
              <h3>Target Winning Score</h3>
            </div>

            <div className="target-score-selector">
              {[11, 16, 21].map((scoreVal) => {
                const isSelected = targetScore === scoreVal && !customScoreInput;
                return (
                  <button
                    key={scoreVal}
                    type="button"
                    className={`score-option-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      soundManager.playClick();
                      setTargetScore(scoreVal as TargetScore);
                      setCustomScoreInput('');
                    }}
                  >
                    <span className="score-num">{scoreVal}</span>
                    <span className="score-label">
                      {scoreVal === 11 ? 'Short' : scoreVal === 16 ? 'Medium' : 'Long'}
                    </span>
                  </button>
                );
              })}

              <div className={`custom-score-box ${customScoreInput ? 'active' : ''}`}>
                <input
                  type="number"
                  placeholder="Custom"
                  value={customScoreInput}
                  onChange={(e) => {
                    setCustomScoreInput(e.target.value);
                  }}
                  className="custom-score-input"
                />
                <span className="pts-suffix">pts</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: INITIAL DEALER */}
          <div className="modern-section">
            <div className="section-title">
              <Shuffle size={18} className="icon-gold" />
              <h3>Initial Dealer</h3>
            </div>

            <div className="dealer-setup-grid">
              <button
                type="button"
                className={`dealer-setup-card ${dealerSetupMode === 'random' ? 'selected' : ''}`}
                onClick={() => {
                  soundManager.playClick();
                  setDealerSetupMode('random');
                }}
              >
                <div className="dealer-setup-title">
                  <Shuffle size={16} />
                  <span>Random Dealer</span>
                </div>
                <p>Randomly choose who deals first when settings are saved.</p>
              </button>

              <button
                type="button"
                className={`dealer-setup-card ${dealerSetupMode === 'manual' ? 'selected' : ''}`}
                onClick={() => {
                  soundManager.playClick();
                  setDealerSetupMode('manual');
                }}
              >
                <div className="dealer-setup-title">
                  <UserCheck size={16} />
                  <span>Manual Dealer</span>
                </div>
                <p>Pick the specific player who deals first.</p>
              </button>
            </div>

            {dealerSetupMode === 'manual' && (
              <div className="dealer-picker-row fade-in">
                {tempPlayers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`dealer-player-pill ${manualDealerId === p.id ? 'active' : ''}`}
                    style={manualDealerId === p.id ? { borderColor: p.color, backgroundColor: `${p.color}22` } : {}}
                    onClick={() => {
                      soundManager.playCardSelect();
                      setManualDealerId(p.id);
                    }}
                  >
                    <span className="dealer-player-dot" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: RULE VARIANTS */}
          <div className="modern-section">
            <div className="section-title">
              <Sparkles size={18} className="icon-gold" />
              <h3>Italian House Rule Variants</h3>
            </div>

            <div className="variants-toggle-grid">
              <div
                className={`variant-modern-card ${variantNapola ? 'active' : ''}`}
                onClick={() => {
                  soundManager.playClick();
                  setVariantNapola(!variantNapola);
                }}
              >
                <div className="variant-card-header">
                  <div className="variant-icon-badge">👑</div>
                  <div>
                    <h4>Il Napola (Napoleone)</h4>
                    <span className="variant-points-tag">+3 to +7 Bonus Pts</span>
                  </div>
                  <div className={`custom-switch ${variantNapola ? 'on' : 'off'}`}>
                    <div className="switch-handle" />
                  </div>
                </div>
                <p className="variant-desc">
                  Bonus points for capturing Ace, 2, 3 of Denari (3 pts), extending sequentially up to 7 of Denari (7 pts max).
                </p>
              </div>

              <div
                className={`variant-modern-card ${variantReBello ? 'active' : ''}`}
                onClick={() => {
                  soundManager.playClick();
                  setVariantReBello(!variantReBello);
                }}
              >
                <div className="variant-card-header">
                  <div className="variant-icon-badge">🤴</div>
                  <div>
                    <h4>Re Bello (Beautiful King 🪙)</h4>
                    <span className="variant-points-tag">+1 Bonus Pt</span>
                  </div>
                  <div className={`custom-switch ${variantReBello ? 'on' : 'off'}`}>
                    <div className="switch-handle" />
                  </div>
                </div>
                <p className="variant-desc">
                  1 extra bonus point awarded to the player or team capturing the King of Coins (Re di Denari).
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 5: PLAYER ROSTER & SAVED NAMES */}
          <div className="modern-section">
            <div className="section-title-with-action">
              <div className="section-title">
                <Bookmark size={18} className="icon-gold" />
                <h3>Player Names & Saved Roster</h3>
              </div>
              <button
                type="button"
                className="btn-text-gold"
                onClick={() => {
                  soundManager.playClick();
                  setShowRosterManager(!showRosterManager);
                }}
              >
                {showRosterManager ? 'Hide Roster Manager' : 'Manage Saved Profiles'}
              </button>
            </div>

            {/* Collapsible Saved Roster Manager */}
            {showRosterManager && (
              <div className="roster-manager-panel fade-in">
                <h4>Saved Player Profiles Roster</h4>
                <div className="roster-chips-container">
                  {roster.map((savedName) => (
                    <div key={savedName} className="roster-chip">
                      <span>{savedName}</span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={() => handleRemoveFromRoster(savedName)}
                        title="Delete profile"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-roster-row">
                  <input
                    type="text"
                    placeholder="Add new player name..."
                    value={newRosterInput}
                    onChange={(e) => setNewRosterInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddManualRosterItem();
                    }}
                    className="add-roster-input"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddManualRosterItem}
                  >
                    <UserPlus size={14} /> Add Profile
                  </button>
                </div>
              </div>
            )}

            {/* Player Inputs List */}
            <div className="modern-players-list">
              {tempPlayers.map((p, idx) => (
                <div key={p.id} className="modern-player-card" style={{ borderLeftColor: p.color }}>
                  <div className="player-input-top">
                    <span className="player-badge-idx" style={{ backgroundColor: p.color }}>
                      P{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handlePlayerNameChange(p.id, e.target.value)}
                      placeholder={`Player ${idx + 1} Name`}
                      className="modern-player-input"
                    />
                    {p.team && <span className="team-pill-tag">Team {p.team}</span>}

                    {p.name.trim() && !roster.includes(p.name.trim()) && (
                      <button
                        type="button"
                        className="save-profile-btn"
                        onClick={() => handleSaveToRoster(p.name)}
                        title="Save name to roster"
                      >
                        <Bookmark size={14} /> Save
                      </button>
                    )}
                  </div>

                  {/* Quick Pick Saved Roster Chips */}
                  {roster.length > 0 && (
                    <div className="quick-saved-picks">
                      <span className="pick-label">Quick Pick Saved:</span>
                      <div className="quick-chips-scroll custom-scrollbar">
                        {roster.map((name) => (
                          <button
                            key={name}
                            type="button"
                            className={`quick-pick-chip ${p.name === name ? 'active' : ''}`}
                            onClick={() => handleQuickSelectName(p.id, name)}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modern-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary primary-cta-btn" onClick={handleSave}>
            <Check size={18} /> Apply & Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
