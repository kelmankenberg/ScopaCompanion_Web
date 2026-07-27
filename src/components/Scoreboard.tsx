import React from 'react';
import { Crown, Plus, Zap, Trophy } from 'lucide-react';
import type { TargetScore } from '../types/scopa';

import { soundManager } from '../utils/soundEffects';

interface EntityScore {
  id: string; // playerId or teamId ('A'/'B')
  name: string;
  color: string;
  score: number;
  isDealer: boolean;
  teamMembers?: string[];
}

interface ScoreboardProps {
  entities: EntityScore[];
  targetScore: TargetScore;
  currentLeaderId: string | null;
  roundNumber: number;
  onOpenWizard: () => void;
  onOpenOverride: () => void;
  isFinished: boolean;
  winnerId: string | null;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  entities,
  targetScore,
  currentLeaderId,
  roundNumber,
  onOpenWizard,
  onOpenOverride,
  isFinished,
  winnerId,
}) => {
  return (
    <div className="scoreboard-container">
      {/* Top Info Bar */}
      <div className="scoreboard-meta">
        <div className="round-badge">
          <span className="label">ROUND</span>
          <span className="value">{roundNumber}</span>
        </div>

        <div className="target-badge">
          <Trophy size={16} className="icon-gold" />
          <span>Target Score: <strong>{targetScore} pts</strong></span>
        </div>
      </div>

      {/* Player Score Cards */}
      <div className={`score-cards-grid grid-count-${entities.length}`}>
        {entities.map((entity) => {
          const isLeader = entity.id === currentLeaderId && entity.score > 0;
          const isWinner = entity.id === winnerId;
          const progressPercent = Math.min(100, Math.round((entity.score / Number(targetScore)) * 100));

          return (
            <div
              key={entity.id}
              className={`score-card ${isLeader ? 'leader-card' : ''} ${isWinner ? 'winner-card' : ''}`}
              style={{ borderTopColor: entity.color }}
            >
              {isLeader && (
                <div className="crown-badge" title="Current Match Leader">
                  <Crown size={16} /> Leader
                </div>
              )}

              {entity.isDealer && (
                <div className="dealer-pill" title="Dealer this round">
                  🃏 Dealer
                </div>
              )}

              <div className="card-player-header">
                <div className="player-avatar" style={{ backgroundColor: entity.color }}>
                  {entity.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <h3 className="player-name">{entity.name}</h3>
                  {entity.teamMembers && entity.teamMembers.length > 0 && (
                    <span className="team-subtext">{entity.teamMembers.join(' & ')}</span>
                  )}
                </div>
              </div>

              {/* Main Score Display */}
              <div className="card-score-display">
                <span className="score-number">{entity.score}</span>
                <span className="score-unit">pts</span>
              </div>

              {/* Progress Bar */}
              <div className="progress-container">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: entity.color,
                    }}
                  />
                </div>
                <div className="progress-labels">
                  <span>{progressPercent}%</span>
                  <span>{targetScore} pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Actions */}
      {!isFinished && (
        <div className="scoreboard-actions">
          <button
            className="btn btn-primary primary-cta-btn pulse-effect"
            onClick={() => {
              soundManager.playClick();
              onOpenWizard();
            }}
          >
            <Plus size={20} />
            <span>Enter Round Results</span>
          </button>

          <button
            className="btn btn-secondary override-btn"
            onClick={() => {
              soundManager.playClick();
              onOpenOverride();
            }}
            title="Directly enter final round points without wizard"
          >
            <Zap size={16} />
            <span>Quick Manual Override</span>
          </button>
        </div>
      )}
    </div>
  );
};
