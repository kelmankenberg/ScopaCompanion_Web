import React from 'react';
import { X, BarChart2 } from 'lucide-react';
import type { RoundRecord } from '../types/scopa';


interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rounds: RoundRecord[];
  entities: { id: string; name: string; color: string }[];
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  rounds,
  entities,
}) => {
  if (!isOpen) return null;

  // Compute Statistics
  const stats: Record<
    string,
    {
      totalPts: number;
      scopas: number;
      primieras: number;
      settebellos: number;
      carteCount: number;
      denariCount: number;
    }
  > = {};

  for (const e of entities) {
    stats[e.id] = {
      totalPts: 0,
      scopas: 0,
      primieras: 0,
      settebellos: 0,
      carteCount: 0,
      denariCount: 0,
    };
  }

  for (const r of rounds) {
    if (!r.breakdown) continue;
    for (const e of entities) {
      const b = r.breakdown[e.id];
      if (!b) continue;
      const s = stats[e.id];
      if (!s) continue;
      s.totalPts += b.total;
      s.scopas += b.scopas || 0;
      s.primieras += b.primiera || 0;
      s.settebellos += b.settebello || 0;
      s.carteCount += b.carte || 0;
      s.denariCount += b.denari || 0;
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <BarChart2 className="icon-gold" size={20} />
            <h2>Match Analytics & Performance</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body custom-scrollbar">
          <div className="stats-summary-meta">
            <span>Total Rounds Played: <strong>{rounds.length}</strong></span>
          </div>

          <div className="stats-grid">
            {entities.map((e) => {
              const st = stats[e.id] || { totalPts: 0, scopas: 0, primieras: 0, settebellos: 0, carteCount: 0, denariCount: 0 };
              const avgPts = rounds.length > 0 ? (st.totalPts / rounds.length).toFixed(1) : '0';

              return (
                <div key={e.id} className="stat-card" style={{ borderTopColor: e.color }}>
                  <h3 style={{ color: e.color }}>{e.name}</h3>

                  <div className="stat-rows-list">
                    <div className="stat-row">
                      <span className="label">Total Score</span>
                      <strong className="value gold">{st.totalPts} pts</strong>
                    </div>

                    <div className="stat-row">
                      <span className="label">Avg Score / Round</span>
                      <strong className="value">{avgPts} pts</strong>
                    </div>

                    <div className="stat-row">
                      <span className="label">🧹 Scopas (Sweeps)</span>
                      <strong className="value">{st.scopas}</strong>
                    </div>

                    <div className="stat-row">
                      <span className="label">✨ Primieras Won</span>
                      <strong className="value">{st.primieras}</strong>
                    </div>

                    <div className="stat-row">
                      <span className="label">🪙 Settebellos (7♦)</span>
                      <strong className="value">{st.settebellos}</strong>
                    </div>

                    <div className="stat-row">
                      <span className="label">🃏 Carte Majority</span>
                      <strong className="value">{st.carteCount} times</strong>
                    </div>

                    <div className="stat-row">
                      <span className="label">🪙 Denari Majority</span>
                      <strong className="value">{st.denariCount} times</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
