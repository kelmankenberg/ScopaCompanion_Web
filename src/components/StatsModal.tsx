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

  const formatPct = (value: number): string => `${Math.round(value)}%`;

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

  const rankedEntities = entities
    .map((e) => ({
      ...e,
      stats: stats[e.id],
    }))
    .sort((a, b) => (b.stats?.totalPts || 0) - (a.stats?.totalPts || 0));

  const totalScopas = entities.reduce((sum, e) => sum + (stats[e.id]?.scopas || 0), 0);
  const totalPrimieras = entities.reduce((sum, e) => sum + (stats[e.id]?.primieras || 0), 0);
  const totalSettebellos = entities.reduce((sum, e) => sum + (stats[e.id]?.settebellos || 0), 0);

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

        <div className="modal-body stats-modal-body custom-scrollbar">
          <div className="stats-overview-grid">
            <div className="stats-overview-card highlight">
              <span className="stats-overview-label">Rounds Played</span>
              <strong className="stats-overview-value">{rounds.length}</strong>
            </div>
            <div className="stats-overview-card">
              <span className="stats-overview-label">Total Scopas</span>
              <strong className="stats-overview-value">{totalScopas}</strong>
            </div>
            <div className="stats-overview-card">
              <span className="stats-overview-label">Primieras Awarded</span>
              <strong className="stats-overview-value">{totalPrimieras}</strong>
            </div>
            <div className="stats-overview-card">
              <span className="stats-overview-label">Settebellos Captured</span>
              <strong className="stats-overview-value">{totalSettebellos}</strong>
            </div>
          </div>

          <div className="stats-summary-strip">
            {rankedEntities.map((entry, index) => (
              <div key={entry.id} className="stats-summary-pill" style={{ borderColor: entry.color }}>
                <span className="stats-summary-rank">#{index + 1}</span>
                <span className="stats-summary-name">{entry.name}</span>
                <strong className="stats-summary-points">{entry.stats?.totalPts || 0} pts</strong>
              </div>
            ))}
          </div>

          <div className="stats-grid">
            {entities.map((e) => {
              const st = stats[e.id] || { totalPts: 0, scopas: 0, primieras: 0, settebellos: 0, carteCount: 0, denariCount: 0 };
              const avgPts = rounds.length > 0 ? (st.totalPts / rounds.length).toFixed(1) : '0';
              const primieraWinRate = rounds.length > 0 ? (st.primieras / rounds.length) * 100 : 0;
              const denariControlRate = rounds.length > 0 ? (st.denariCount / rounds.length) * 100 : 0;

              return (
                <div key={e.id} className="stat-card" style={{ borderTopColor: e.color }}>
                  <div className="stat-card-header">
                    <h3 style={{ color: e.color }}>{e.name}</h3>
                    <div className="stat-hero-metric" style={{ borderColor: `${e.color}55` }}>
                      <span className="stat-hero-label">Total Score</span>
                      <strong className="stat-hero-value">{st.totalPts}</strong>
                    </div>
                  </div>

                  <div className="stat-highlight-grid">
                    <div className="stat-highlight-card">
                      <span className="label">Avg / Round</span>
                      <strong className="value">{avgPts} pts</strong>
                    </div>
                    <div className="stat-highlight-card">
                      <span className="label">Primiera Win Rate</span>
                      <strong className="value">{formatPct(primieraWinRate)}</strong>
                    </div>
                    <div className="stat-highlight-card">
                      <span className="label">Denari Control</span>
                      <strong className="value">{formatPct(denariControlRate)}</strong>
                    </div>
                  </div>

                  <div className="stat-rows-list">
                    <div className="stat-row">
                      <span className="label">🧹 Scopas</span>
                      <strong className="value">{st.scopas}</strong>
                    </div>

                    <div className="stat-row">
                      <span className="label">✨ Primieras Won</span>
                      <strong className="value">{st.primieras}</strong>
                    </div>

                    <div className="stat-row">
                      <span className="label">🪙 Settebellos</span>
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
