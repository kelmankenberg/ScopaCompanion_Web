import React from 'react';
import { History, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import type { RoundRecord } from '../types/scopa';

import { soundManager } from '../utils/soundEffects';

interface HistoryLogProps {
  rounds: RoundRecord[];
  entities: { id: string; name: string; color: string }[];
  onUndoLastRound: () => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  rounds,
  entities,
  onUndoLastRound,
}) => {
  const [expandedRoundId, setExpandedRoundId] = React.useState<string | null>(null);

  if (rounds.length === 0) {
    return (
      <div className="history-empty-card">
        <History size={28} className="icon-muted" />
        <p>No rounds played yet. Click <strong>"Enter Round Results"</strong> above to start scoring!</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    soundManager.playClick();
    setExpandedRoundId(expandedRoundId === id ? null : id);
  };

  return (
    <div className="history-log-container">
      <div className="history-header">
        <div className="title">
          <History size={18} className="icon-gold" />
          <h3>Round History Feed</h3>
        </div>
        <button
          className="btn btn-secondary btn-sm undo-btn"
          onClick={() => {
            soundManager.playClick();
            onUndoLastRound();
          }}
          title="Undo the last recorded round"
        >
          <RotateCcw size={14} /> Undo Last Round
        </button>
      </div>

      <div className="history-list">
        {rounds.slice().reverse().map((round) => {
          const isExpanded = expandedRoundId === round.id;

          return (
            <div key={round.id} className="history-item-card">
              <div className="item-summary" onClick={() => toggleExpand(round.id)}>
                <div className="round-tag">
                  <span>Round {round.roundNumber}</span>
                  {round.isOverride && <span className="override-tag">Manual</span>}
                </div>

                <div className="round-scores-row">
                  {entities.map((e) => {
                    const roundPts = round.scores[e.id] || 0;
                    const cumul = round.cumulativeScores[e.id] || 0;
                    return (
                      <div key={e.id} className="score-pill" style={{ borderColor: e.color }}>
                        <span className="name">{e.name}:</span>
                        <strong className="pts">+{roundPts}</strong>
                        <span className="cumul">({cumul})</span>
                      </div>
                    );
                  })}
                </div>

                <div className="expand-icon">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Detailed Breakdown */}
              {isExpanded && round.breakdown && (
                <div className="item-breakdown-details fade-in">
                  <h4>Category Point Breakdown:</h4>
                  <div className="breakdown-grid">
                    {entities.map((e) => {
                      const b = round.breakdown[e.id] || { carte: 0, denari: 0, settebello: 0, primiera: 0, scopas: 0, total: 0 };
                      return (
                        <div key={e.id} className="entity-breakdown-col" style={{ borderLeftColor: e.color }}>
                          <h5 style={{ color: e.color }}>{e.name}</h5>
                          <ul>
                            <li>Carte (Cards): <strong>+{b.carte}</strong></li>
                            <li>Denari (Coins): <strong>+{b.denari}</strong></li>
                            <li>Settebello (7♦): <strong>+{b.settebello}</strong></li>
                            <li>Primiera (Prime): <strong>+{b.primiera}</strong></li>
                            <li>Scopas (Sweeps): <strong>+{b.scopas}</strong></li>
                            {b.napola !== undefined && b.napola > 0 && <li>Napola: <strong>+{b.napola}</strong></li>}
                            {b.reBello !== undefined && b.reBello > 0 && <li>Re Bello: <strong>+{b.reBello}</strong></li>}
                            <li className="total-li">Total Round: <strong>+{b.total} pts</strong></li>
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
