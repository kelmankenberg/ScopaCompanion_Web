import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw } from 'lucide-react';

import { soundManager } from '../utils/soundEffects';

interface VictoryModalProps {
  isOpen: boolean;
  winnerName: string;
  winnerColor: string;
  winnerScore: number;
  onRematch: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winnerName,
  winnerColor,
  winnerScore,
  onRematch,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundManager.playVictoryFanfare();

      // Launch Confetti fireworks!
      try {
        const count = 200;
        const defaults = { origin: { y: 0.7 } };

        const fire = (particleRatio: number, opts: confetti.Options) => {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        };

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      } catch {
        // Fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay victory-overlay">
      <div className="modal-container victory-modal fade-in-up">
        <div className="victory-icon-wrapper">
          <Trophy size={64} className="icon-gold pulse-glow" />
        </div>

        <h1 className="victory-title">VICTORY!</h1>
        <h2 className="winner-name-banner" style={{ color: winnerColor }}>
          {winnerName} Wins!
        </h2>

        <p className="final-score-text">
          Final Winning Score: <strong>{winnerScore} Points</strong>
        </p>

        <div className="victory-actions">
          <button
            type="button"
            className="btn btn-primary primary-cta-btn"
            onClick={() => {
              soundManager.playClick();
              onRematch();
            }}
          >
            <RotateCcw size={18} /> Play Rematch!
          </button>
        </div>
      </div>
    </div>
  );
};
