import React, { useEffect, useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Zap, Layers } from 'lucide-react';

import type { GameSettings, Suit } from '../types/scopa';
import { calculateRoundScores } from '../utils/scopaRules';

import { PrimieraCalculator } from './PrimieraCalculator';
import { soundManager } from '../utils/soundEffects';

interface RoundWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRound: (roundScores: Record<string, number>, breakdown: any, isOverride: boolean) => void;
  entities: { id: string; name: string; color: string }[];
  settings: GameSettings;
  roundNumber: number;
}

export const RoundWizardModal: React.FC<RoundWizardModalProps> = ({
  isOpen,
  onClose,
  onSubmitRound,
  entities,
  settings,
  roundNumber,
}) => {
  const [entryMode, setEntryMode] = useState<'wizard' | 'override'>('wizard');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Wizard State
  const [scopas, setScopas] = useState<Record<string, number>>(() =>
    Object.fromEntries(entities.map((e) => [e.id, 0]))
  );
  const [settebelloId, setSettebelloId] = useState<string | null>(null);
  const [denariCount, setDenariCount] = useState<Record<string, number>>(() =>
    Object.fromEntries(entities.map((e) => [e.id, 0]))
  );
  const [denariAutoBalance, setDenariAutoBalance] = useState<boolean>(entities.length === 2);
  const [cardsCount, setCardsCount] = useState<Record<string, number>>(() =>
    Object.fromEntries(entities.map((e) => [e.id, 0]))
  );
  const [cardsAutoBalance, setCardsAutoBalance] = useState<boolean>(entities.length === 2);
  const [primieraSelections, setPrimieraSelections] = useState<Record<string, Record<Suit, number | null>>>(() =>
    Object.fromEntries(
      entities.map((e) => [e.id, { denari: null, coppe: null, spade: null, bastoni: null }])
    )
  );
  const [napolaCount, setNapolaCount] = useState<Record<string, number>>(() =>
    Object.fromEntries(entities.map((e) => [e.id, 0]))
  );
  const [reBelloId, setReBelloId] = useState<string | null>(null);

  // Manual Override State
  const [overrideScores, setOverrideScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(entities.map((e) => [e.id, 0]))
  );

  useEffect(() => {
    if (isOpen) {
      setEntryMode('wizard');
      setCurrentStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate total steps
  let totalSteps = 5; // Scopas, Settebello, Denari, Cards, Primiera
  if (settings.variantNapola) totalSteps++;
  if (settings.variantReBello) totalSteps++;

  // Step 1: Increments / Decrements
  const handleScopaChange = (id: string, delta: number) => {
    const current = scopas[id] || 0;
    const nextVal = Math.max(0, current + delta);
    setScopas({ ...scopas, [id]: nextVal });
    if (delta > 0) soundManager.playScopaSweep();
    else soundManager.playClick();
  };

  const clampDenari = (val: number) => Math.max(0, Math.min(10, val));

  const handleDenariChange = (id: string, val: number) => {
    soundManager.playCardSelect();
    const clamped = clampDenari(val);
    setDenariCount((prev) => {
      const next = { ...prev, [id]: clamped };
      if (denariAutoBalance && entities.length === 2) {
        const other = entities.find((e) => e.id !== id);
        if (other) {
          next[other.id] = clampDenari(10 - clamped);
        }
      }
      return next;
    });
  };

  const handleDenariReset = () => {
    soundManager.playClick();
    setDenariCount(Object.fromEntries(entities.map((e) => [e.id, 0])));
  };

  const handleDenariSplit = () => {
    soundManager.playCardSelect();
    if (entities.length === 2) {
      setDenariCount({ [entities[0].id]: 5, [entities[1].id]: 5 });
      return;
    }

    const evenBase = Math.floor(10 / entities.length);
    const remainder = 10 % entities.length;
    const next: Record<string, number> = {};
    entities.forEach((e, idx) => {
      next[e.id] = evenBase + (idx < remainder ? 1 : 0);
    });
    setDenariCount(next);
  };

  const handleDenariAllTo = (id: string) => {
    soundManager.playCardSelect();
    const next = Object.fromEntries(entities.map((e) => [e.id, e.id === id ? 10 : 0]));
    setDenariCount(next);
  };

  const clampCards = (val: number) => Math.max(0, Math.min(40, val));

  const handleCardsChange = (id: string, val: number) => {
    soundManager.playCardSelect();
    const clamped = clampCards(val);
    setCardsCount((prev) => {
      const next = { ...prev, [id]: clamped };
      if (cardsAutoBalance && entities.length === 2) {
        const other = entities.find((e) => e.id !== id);
        if (other) {
          next[other.id] = clampCards(40 - clamped);
        }
      }
      return next;
    });
  };

  const handleCardsReset = () => {
    soundManager.playClick();
    setCardsCount(Object.fromEntries(entities.map((e) => [e.id, 0])));
  };

  const handleCardsSplit = () => {
    soundManager.playCardSelect();
    if (entities.length === 2) {
      setCardsCount({ [entities[0].id]: 20, [entities[1].id]: 20 });
      return;
    }

    const evenBase = Math.floor(40 / entities.length);
    const remainder = 40 % entities.length;
    const next: Record<string, number> = {};
    entities.forEach((e, idx) => {
      next[e.id] = evenBase + (idx < remainder ? 1 : 0);
    });
    setCardsCount(next);
  };

  const handleCardsAllTo = (id: string) => {
    soundManager.playCardSelect();
    const next = Object.fromEntries(entities.map((e) => [e.id, e.id === id ? 40 : 0]));
    setCardsCount(next);
  };


  const handleNapolaChange = (id: string, val: number) => {
    soundManager.playClick();
    setNapolaCount({ ...napolaCount, [id]: val });
  };


  // Compute calculated preview
  const calculatedBreakdown = calculateRoundScores(
    entities,
    {
      scopas,
      settebelloId,
      denariCount,
      cardsCount,
      primieraSelections,
      napolaCount: settings.variantNapola ? napolaCount : undefined,
      reBelloId: settings.variantReBello ? reBelloId : undefined,
    },
    settings
  );

  const handleWizardSubmit = () => {
    soundManager.playRoundComplete();
    const finalScores: Record<string, number> = {};
    for (const e of entities) {
      finalScores[e.id] = calculatedBreakdown[e.id]?.total || 0;
    }
    onSubmitRound(finalScores, calculatedBreakdown, false);
  };

  const handleOverrideSubmit = () => {
    soundManager.playRoundComplete();
    const breakdown: Record<string, any> = {};
    for (const e of entities) {
      breakdown[e.id] = {
        carte: 0,
        denari: 0,
        settebello: 0,
        primiera: 0,
        scopas: 0,
        total: overrideScores[e.id] || 0,
      };
    }
    onSubmitRound(overrideScores, breakdown, true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container wizard-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-badge">Round {roundNumber}</span>
            <h2>Enter Round Score</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Entry Mode Toggle Tabs */}
        <div className="wizard-mode-tabs">
          <button
            className={`mode-tab-btn ${entryMode === 'wizard' ? 'active' : ''}`}
            onClick={() => {
              soundManager.playClick();
              setEntryMode('wizard');
            }}
          >
            <Layers size={16} /> Guided Wizard
          </button>
          <button
            className={`mode-tab-btn ${entryMode === 'override' ? 'active' : ''}`}
            onClick={() => {
              soundManager.playClick();
              setEntryMode('override');
            }}
          >
            <Zap size={16} /> Quick Manual Override
          </button>
        </div>

        {/* GUIDED WIZARD MODE */}
        {entryMode === 'wizard' && (
          <div className="wizard-body">
            {/* Step Progress Bar */}
            <div className="step-progress-bar">
              <div
                className="step-progress-fill"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
              <span className="step-count-text">Step {currentStep} of {totalSteps}</span>
            </div>

            <div className="wizard-step-content custom-scrollbar">
              {/* STEP 1: SCOPAS */}
              {currentStep === 1 && (
                <div className="step-panel fade-in">
                  <h3>🧹 Step 1: Scopas (Sweeps)</h3>
                  <p className="step-desc">Enter the number of table sweeps scored by each player/team during the round.</p>
                  <div className="stepper-list">
                    {entities.map((e) => (
                      <div key={e.id} className="stepper-row" style={{ borderLeftColor: e.color }}>
                        <span className="entity-label">{e.name}</span>
                        <div className="counter-controls">
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={() => handleScopaChange(e.id, -1)}
                          >
                            -
                          </button>
                          <span className="counter-val">{scopas[e.id] || 0}</span>
                          <button
                            type="button"
                            className="counter-btn highlight"
                            onClick={() => handleScopaChange(e.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: SETTEBELLO */}
              {currentStep === 2 && (
                <div className="step-panel fade-in">
                  <h3>🪙 Step 2: Settebello (7 of Coins 7♦)</h3>
                  <p className="step-desc">Who captured the 7 of Coins card?</p>
                  <div className="radio-options-grid">
                    {entities.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        className={`radio-card ${settebelloId === e.id ? 'selected' : ''}`}
                        style={settebelloId === e.id ? { borderColor: e.color, backgroundColor: `${e.color}15` } : {}}
                        onClick={() => {
                          soundManager.playCardSelect();
                          setSettebelloId(e.id);
                        }}
                      >
                        <span className="radio-icon">7♦</span>
                        <span className="radio-name">{e.name}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`radio-card ${settebelloId === null ? 'selected' : ''}`}
                      onClick={() => {
                        soundManager.playClick();
                        setSettebelloId(null);
                      }}
                    >
                      <span className="radio-icon">❓</span>
                      <span className="radio-name">None / Unsure</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DENARI COUNT */}
              {currentStep === 3 && (() => {
                const totalDenariSum = entities.reduce((acc, e) => acc + (denariCount[e.id] || 0), 0);
                return (
                  <div className="step-panel fade-in">
                    <div className="step-header-with-tracker">
                      <div>
                        <h3>🪙 Step 3: Denari (Coins Count)</h3>
                        <p className="step-desc">Enter Coin cards captured per player/team (10 total; majority &gt; 5 earns 1 point).</p>
                      </div>

                      <div className={`total-tally-badge compact ${totalDenariSum === 10 ? 'ok' : totalDenariSum > 10 ? 'warn' : ''}`}>
                        <span>
                          Assigned: <strong>{totalDenariSum} / 10 🪙</strong>
                        </span>
                        {totalDenariSum > 10 && <span className="warning-pill">Too many coins</span>}
                      </div>
                    </div>

                    <div className="denari-toolbar">
                      <div className="denari-quick-actions">
                        <button type="button" className="btn-autofill-sm" onClick={handleDenariSplit}>
                          Split 10
                        </button>
                        {entities.length === 2 && entities.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            className="btn-autofill-sm"
                            onClick={() => handleDenariAllTo(e.id)}
                          >
                            All to {e.name}
                          </button>
                        ))}
                        <button type="button" className="btn-autofill-sm" onClick={handleDenariReset}>
                          Reset
                        </button>
                      </div>

                      {entities.length === 2 && (
                        <label className="denari-balance-toggle">
                          <input
                            type="checkbox"
                            checked={denariAutoBalance}
                            onChange={(ev) => {
                              soundManager.playClick();
                              setDenariAutoBalance(ev.target.checked);
                            }}
                          />
                          Auto-balance (10 total)
                        </label>
                      )}
                    </div>

                    <div className="denari-compact-list">
                      {entities.map((e) => {
                        const count = denariCount[e.id] ?? 0;
                        const hasMajority = count > 5;
                        return (
                          <div key={e.id} className="denari-compact-row" style={{ borderLeftColor: e.color }}>
                            <div className="denari-row-identity">
                              <span className="count-entity-name" style={{ color: e.color }}>{e.name}</span>
                              {hasMajority && <span className="majority-badge">+1 Denari</span>}
                            </div>

                            <div className="denari-row-controls">
                              <button
                                type="button"
                                className="stepper-btn-sm"
                                onClick={() => handleDenariChange(e.id, count - 1)}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={count}
                                onChange={(ev) => handleDenariChange(e.id, parseInt(ev.target.value) || 0)}
                                className="count-num-input compact"
                              />
                              <button
                                type="button"
                                className="stepper-btn-sm highlight"
                                onClick={() => handleDenariChange(e.id, count + 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {entities.length === 2 && denariAutoBalance && (
                      <div className="denari-helper-note">
                        Editing one side automatically sets the other to keep totals at 10.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* STEP 4: CARDS COUNT */}
              {currentStep === 4 && (() => {
                const totalCardsSum = entities.reduce((acc, e) => acc + (cardsCount[e.id] || 0), 0);
                return (
                  <div className="step-panel fade-in">
                    <div className="step-header-with-tracker">
                      <div>
                        <h3>🃏 Step 4: Total Cards Count</h3>
                        <p className="step-desc">Enter total cards captured per player/team (40 total; majority &gt; 20 earns 1 point).</p>
                      </div>

                      <div className={`total-tally-badge compact ${totalCardsSum === 40 ? 'ok' : totalCardsSum > 40 ? 'warn' : ''}`}>
                        <span>
                          Assigned: <strong>{totalCardsSum} / 40 🃏</strong>
                        </span>
                        {totalCardsSum > 40 && <span className="warning-pill">Too many cards</span>}
                      </div>
                    </div>

                    <div className="cards-toolbar">
                      <div className="cards-quick-actions">
                        <button type="button" className="btn-autofill-sm" onClick={handleCardsSplit}>
                          Split 40
                        </button>
                        {entities.length === 2 && entities.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            className="btn-autofill-sm"
                            onClick={() => handleCardsAllTo(e.id)}
                          >
                            All to {e.name}
                          </button>
                        ))}
                        <button type="button" className="btn-autofill-sm" onClick={handleCardsReset}>
                          Reset
                        </button>
                      </div>

                      {entities.length === 2 && (
                        <label className="cards-balance-toggle">
                          <input
                            type="checkbox"
                            checked={cardsAutoBalance}
                            onChange={(ev) => {
                              soundManager.playClick();
                              setCardsAutoBalance(ev.target.checked);
                            }}
                          />
                          Auto-balance (40 total)
                        </label>
                      )}
                    </div>

                    <div className="cards-compact-list">
                      {entities.map((e) => {
                        const count = cardsCount[e.id] ?? 0;
                        const hasMajority = count > 20;
                        return (
                          <div key={e.id} className="cards-compact-row" style={{ borderLeftColor: e.color }}>
                            <div className="cards-row-identity">
                              <span className="count-entity-name" style={{ color: e.color }}>{e.name}</span>
                              {hasMajority && <span className="majority-badge">+1 Cards</span>}
                            </div>

                            <div className="cards-row-controls">
                              <button
                                type="button"
                                className="stepper-btn-sm"
                                onClick={() => handleCardsChange(e.id, count - 5)}
                              >
                                -5
                              </button>
                              <button
                                type="button"
                                className="stepper-btn-sm"
                                onClick={() => handleCardsChange(e.id, count - 1)}
                              >
                                -1
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="40"
                                value={count}
                                onChange={(ev) => handleCardsChange(e.id, parseInt(ev.target.value) || 0)}
                                className="count-num-input compact"
                              />
                              <button
                                type="button"
                                className="stepper-btn-sm highlight"
                                onClick={() => handleCardsChange(e.id, count + 1)}
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                className="stepper-btn-sm highlight"
                                onClick={() => handleCardsChange(e.id, count + 5)}
                              >
                                +5
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {entities.length === 2 && cardsAutoBalance && (
                      <div className="cards-helper-note">
                        Editing one side automatically sets the other to keep totals at 40.
                      </div>
                    )}
                  </div>
                );
              })()}



              {/* STEP 5: PRIMIERA CALCULATOR */}
              {currentStep === 5 && (
                <div className="step-panel fade-in">
                  <PrimieraCalculator
                    entities={entities}
                    selections={primieraSelections}
                    onChange={setPrimieraSelections}
                  />
                </div>
              )}

              {/* STEP 6: NAPOLA (If Variant Enabled) */}
              {settings.variantNapola && currentStep === (settings.variantReBello ? totalSteps - 1 : totalSteps) && (
                <div className="step-panel fade-in">
                  <h3>👑 Step 6: Il Napola Sequence</h3>
                  <p className="step-desc">Enter length of consecutive Coin sequence starting from Ace, 2, 3 (e.g. 3 to 7 pts).</p>
                  <div className="stepper-list">
                    {entities.map((e) => (
                      <div key={e.id} className="stepper-row" style={{ borderLeftColor: e.color }}>
                        <span className="entity-label">{e.name}</span>
                        <div className="counter-controls">
                          <select
                            value={napolaCount[e.id] || 0}
                            onChange={(ev) => handleNapolaChange(e.id, parseInt(ev.target.value) || 0)}
                            className="select-dropdown"
                          >
                            <option value={0}>No Napola (0 pts)</option>
                            <option value={3}>Ace, 2, 3 (3 pts)</option>
                            <option value={4}>Ace, 2, 3, 4 (4 pts)</option>
                            <option value={5}>Ace, 2, 3, 4, 5 (5 pts)</option>
                            <option value={6}>Ace, 2, 3, 4, 5, 6 (6 pts)</option>
                            <option value={7}>Ace to 7 of Coins (7 pts)</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 7: RE BELLO (If Variant Enabled) */}
              {settings.variantReBello && currentStep === totalSteps && (
                <div className="step-panel fade-in">
                  <h3>🤴 Step 7: Re Bello (King of Coins 🪙)</h3>
                  <p className="step-desc">Who captured the King of Denari?</p>
                  <div className="radio-options-grid">
                    {entities.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        className={`radio-card ${reBelloId === e.id ? 'selected' : ''}`}
                        style={reBelloId === e.id ? { borderColor: e.color, backgroundColor: `${e.color}15` } : {}}
                        onClick={() => {
                          soundManager.playCardSelect();
                          setReBelloId(e.id);
                        }}
                      >
                        <span className="radio-icon">🤴</span>
                        <span className="radio-name">{e.name}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`radio-card ${reBelloId === null ? 'selected' : ''}`}
                      onClick={() => {
                        soundManager.playClick();
                        setReBelloId(null);
                      }}
                    >
                      <span className="radio-icon">❓</span>
                      <span className="radio-name">None / Unsure</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Calculated Summary Preview Bar */}
              <div className="summary-preview-box">
                <h4>Calculated Round Scores Preview:</h4>
                <div className="preview-scores-row">
                  {entities.map((e) => (
                    <div key={e.id} className="preview-score-pill" style={{ backgroundColor: `${e.color}25`, borderColor: e.color }}>
                      <span className="p-name">{e.name}:</span>
                      <span className="p-pts">+{calculatedBreakdown[e.id]?.total || 0} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="wizard-footer">
              {currentStep > 1 ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    soundManager.playClick();
                    setCurrentStep((prev) => prev - 1);
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    soundManager.playClick();
                    setCurrentStep((prev) => prev + 1);
                  }}
                >
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success submit-round-btn"
                  onClick={handleWizardSubmit}
                >
                  <Check size={18} /> Confirm Round Scores
                </button>
              )}
            </div>
          </div>
        )}

        {/* QUICK MANUAL OVERRIDE MODE */}
        {entryMode === 'override' && (
          <div className="override-body fade-in">
            <div className="override-intro-card">
              <div className="intro-icon-box">
                <Zap size={22} className="icon-gold" />
              </div>
              <div className="intro-text">
                <h3>Quick Manual Point Override</h3>
                <p>Directly enter end-of-round points calculated physically at the table.</p>
              </div>
            </div>

            <div className="override-cards-grid custom-scrollbar">
              {entities.map((e) => {
                const currentScore = overrideScores[e.id] ?? 0;
                return (
                  <div key={e.id} className="override-player-card" style={{ borderLeftColor: e.color }}>
                    <div className="override-card-header">
                      <div className="player-avatar-sm" style={{ backgroundColor: e.color }}>
                        {e.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="override-player-name">{e.name}</span>
                    </div>

                    <div className="override-score-stepper-box">
                      <div className="stepper-main-controls">
                        <button
                          type="button"
                          className="stepper-btn-sm"
                          onClick={() => {
                            soundManager.playClick();
                            setOverrideScores({ ...overrideScores, [e.id]: Math.max(0, currentScore - 5) });
                          }}
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          className="stepper-btn-sm"
                          onClick={() => {
                            soundManager.playClick();
                            setOverrideScores({ ...overrideScores, [e.id]: Math.max(0, currentScore - 1) });
                          }}
                        >
                          -1
                        </button>

                        <div className="override-display-input">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={currentScore}
                            onChange={(ev) => {
                              const val = Math.max(0, parseInt(ev.target.value) || 0);
                              setOverrideScores({ ...overrideScores, [e.id]: val });
                            }}
                            className="score-val-input"
                          />
                          <span className="score-val-unit">pts</span>
                        </div>

                        <button
                          type="button"
                          className="stepper-btn-sm highlight"
                          onClick={() => {
                            soundManager.playCardSelect();
                            setOverrideScores({ ...overrideScores, [e.id]: currentScore + 1 });
                          }}
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          className="stepper-btn-sm highlight"
                          onClick={() => {
                            soundManager.playCardSelect();
                            setOverrideScores({ ...overrideScores, [e.id]: currentScore + 5 });
                          }}
                        >
                          +5
                        </button>
                      </div>

                      {/* Quick Score Presets */}
                      <div className="quick-presets-row">
                        <span className="preset-label">Quick Set:</span>
                        {[0, 1, 2, 3, 4, 5, 6].map((pVal) => (
                          <button
                            key={pVal}
                            type="button"
                            className={`preset-pill ${currentScore === pVal ? 'active' : ''}`}
                            onClick={() => {
                              soundManager.playCardSelect();
                              setOverrideScores({ ...overrideScores, [e.id]: pVal });
                            }}
                          >
                            +{pVal}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success primary-cta-btn"
                onClick={handleOverrideSubmit}
              >
                <Check size={18} /> Confirm Manual Scores
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
