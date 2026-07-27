import React, { useState } from 'react';
import { X, BookOpen, Award, Layers, Sparkles, HelpCircle } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';
import { PRIMIERA_VALUE_MAP, CARD_NAMES } from '../utils/scopaRules';


interface RulesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesPanel: React.FC<RulesPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'standard' | 'primiera' | 'variants' | 'faq'>('overview');

  if (!isOpen) return null;

  const handleTabChange = (tab: 'overview' | 'standard' | 'primiera' | 'variants' | 'faq') => {
    soundManager.playClick();
    setActiveTab(tab);
  };

  return (
    <div className="rules-overlay" onClick={() => { soundManager.playClick(); onClose(); }}>
      <div className="rules-slideout" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="rules-header">
          <div className="rules-title">
            <BookOpen className="icon-gold" size={24} />
            <h2>Official Scopa Rules</h2>
          </div>
          <button className="close-btn" onClick={() => { soundManager.playClick(); onClose(); }}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="rules-tabs">
          <button
            className={`rules-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <Layers size={16} /> Overview
          </button>
          <button
            className={`rules-tab-btn ${activeTab === 'standard' ? 'active' : ''}`}
            onClick={() => handleTabChange('standard')}
          >
            <Award size={16} /> 4 Core Points
          </button>
          <button
            className={`rules-tab-btn ${activeTab === 'primiera' ? 'active' : ''}`}
            onClick={() => handleTabChange('primiera')}
          >
            <Sparkles size={16} /> Primiera
          </button>
          <button
            className={`rules-tab-btn ${activeTab === 'variants' ? 'active' : ''}`}
            onClick={() => handleTabChange('variants')}
          >
            🏆 Variants
          </button>
          <button
            className={`rules-tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => handleTabChange('faq')}
          >
            <HelpCircle size={16} /> FAQ
          </button>
        </div>

        {/* Content Body */}
        <div className="rules-content custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="rules-section fade-in">
              <h3>🃏 Game Overview</h3>
              <p>
                <strong>Scopa</strong> (meaning <em>"sweep"</em> in Italian) is one of Italy's two national card games, played with a standard 40-card Italian deck across 4 suits: <strong>Denari</strong> (Coins), <strong>Coppe</strong> (Cups), <strong>Spade</strong> (Swords), and <strong>Bastoni</strong> (Clubs).
              </p>
              <div className="rules-card-box">
                <h4>Objective</h4>
                <p>
                  Reach or exceed the agreed target score (<strong>11</strong>, <strong>16</strong>, or <strong>21 points</strong>) by capturing cards during play and winning category points at the end of each round.
                </p>
              </div>

              <h4>Gameplay Basics</h4>
              <ul>
                <li><strong>Dealing:</strong> The dealer deals 3 cards to each player and 4 cards face-up to the table. Dealer rotates clockwise after each round.</li>
                <li><strong>Capturing:</strong> On your turn, play 1 card from your hand to capture cards from the table:
                  <ul className="sub-list">
                    <li>Match a card of exact equal rank (e.g. 7 captures 7).</li>
                    <li>Or sum cards on the table matching your card (e.g. 7 captures 3 + 4).</li>
                    <li><em>Forced single capture rule:</em> If a single card matches your played card rank, you MUST capture the single card instead of a combination.</li>
                  </ul>
                </li>
                <li><strong>Scopa (Sweep):</strong> If a player captures all remaining cards on the table during play, it is a <strong>Scopa</strong> (+1 point). The captured card is turned face-up in the trick pile as a trophy marker.</li>
                <li><strong>End of Round:</strong> Any cards remaining on the table after the last trick go to the player/team who made the last capture (this final trick capture does NOT count as a Scopa).</li>
              </ul>
            </div>
          )}

          {activeTab === 'standard' && (
            <div className="rules-section fade-in">
              <h3>🏆 The 4 Core Category Points</h3>
              <p>At the end of each round, 4 standard category points are awarded plus 1 point per Scopa:</p>

              <div className="point-rule-card">
                <div className="rule-badge">1 Point</div>
                <div className="rule-info">
                  <h4>Carte (Total Cards)</h4>
                  <p>Awarded to the player or team capturing the majority of cards (<strong>21 or more</strong> out of 40). If tied 20–20, no point is awarded.</p>
                </div>
              </div>

              <div className="point-rule-card">
                <div className="rule-badge">1 Point</div>
                <div className="rule-info">
                  <h4>Denari (Coins)</h4>
                  <p>Awarded to the player or team capturing the majority of Coin suit cards (<strong>6 or more</strong> out of 10). If tied 5–5, no point is awarded.</p>
                </div>
              </div>

              <div className="point-rule-card">
                <div className="rule-badge">1 Point</div>
                <div className="rule-info">
                  <h4>Settebello (7 of Coins 🪙)</h4>
                  <p>Awarded to the player or team holding the <strong>7 of Denari (Coins)</strong>. This is the single most valuable card in the deck!</p>
                </div>
              </div>

              <div className="point-rule-card">
                <div className="rule-badge">1 Point</div>
                <div className="rule-info">
                  <h4>Primiera (Prime)</h4>
                  <p>Awarded to the player or team with the highest Primiera rating (best card captured in each of the 4 suits). See the Primiera tab for exact points matrix.</p>
                </div>
              </div>

              <div className="point-rule-card gold-border">
                <div className="rule-badge gold">+1 Pt Each</div>
                <div className="rule-info">
                  <h4>Scopas (Sweeps)</h4>
                  <p>1 bonus point awarded for every table sweep made during the round. <em>(Note: Clearing the table on the very last trick of a round does NOT score a Scopa.)</em></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'primiera' && (
            <div className="rules-section fade-in">
              <h3>✨ Primiera (Prime) Rules & Rating Matrix</h3>
              <p>
                To score <strong>Primiera</strong>, each player/team takes the single highest-value card they captured in each suit and sums their point values together.
              </p>

              <div className="alert-box warning-box">
                <strong>🚨 Crucial Qualification Rule:</strong>
                <p>
                  A player/team <strong>MUST</strong> have captured at least 1 card in <u>ALL 4 SUITS</u> to qualify for Primiera! If Player A has cards in all 4 suits and Player B only captured cards in 3 suits, Player A automatically wins Primiera!
                </p>
              </div>

              <h4>Primiera Card Value Lookup Table</h4>
              <div className="table-responsive">
                <table className="rules-table">
                  <thead>
                    <tr>
                      <th>Card Rank</th>
                      <th>Traditional Card Name</th>
                      <th>Primiera Score Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(PRIMIERA_VALUE_MAP)
                      .sort(([valA], [valB]) => PRIMIERA_VALUE_MAP[Number(valB)] - PRIMIERA_VALUE_MAP[Number(valA)])
                      .map(([val, pts]) => (
                        <tr key={val} className={Number(val) === 7 ? 'highlight-row' : ''}>
                          <td><strong>{val === '1' ? 'Ace' : val}</strong></td>
                          <td>{CARD_NAMES[Number(val)]}</td>
                          <td><span className="pts-pill">{pts} pts</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <h4>Example Primiera Calculation</h4>
              <div className="example-box">
                <p><strong>Player A Captured:</strong> 7 of Denari (21), 6 of Coppe (18), Ace of Spade (16), 5 of Bastoni (15) $\rightarrow$ <strong>Total = 70 pts</strong> (Qualified in all 4 suits ✅)</p>
                <p><strong>Player B Captured:</strong> 7 of Coppe (21), 7 of Spade (21), 7 of Bastoni (21), No Denari cards $\rightarrow$ <strong>Disqualified</strong> (0 suits missing ❌)</p>
                <p><strong>Winner:</strong> Player A wins Primiera (1 pt)!</p>
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="rules-section fade-in">
              <h3>🇮🇹 Popular Rule Variants</h3>
              <p>Scopa Companion supports toggling popular traditional house rules in the game settings:</p>

              <div className="variant-rule-card">
                <div className="variant-title">
                  <span className="variant-icon">👑</span>
                  <h4>Il Napola (Napoleone)</h4>
                </div>
                <p>
                  If a player captures the <strong>Ace, 2, and 3 of Denari (Coins)</strong>, they score a <strong>Napola</strong> worth <strong>3 points</strong>.
                </p>
                <p>
                  If they also captured the 4 of Denari, it becomes 4 points, extending sequentially up to the 7 of Denari for a maximum of <strong>7 points</strong> (or up to Re/King for 10 points in some regions).
                </p>
              </div>

              <div className="variant-rule-card">
                <div className="variant-title">
                  <span className="variant-icon">🤴</span>
                  <h4>Re Bello (Beautiful King)</h4>
                </div>
                <p>
                  Award <strong>1 extra point</strong> to the player or team capturing the <strong>Re di Denari (King of Coins 🪙)</strong>.
                </p>
              </div>

              <div className="variant-rule-card">
                <div className="variant-title">
                  <span className="variant-icon">🚀</span>
                  <h4>Asso Piglia Tutto (Scopa d'Assi)</h4>
                </div>
                <p>
                  Playing an Ace captures all cards currently on the table and counts as a Scopa, unless an Ace is already on the table, in which case it captures only the table Ace.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="rules-section fade-in">
              <h3>❓ FAQ & Edge Cases</h3>
              
              <div className="faq-item">
                <h4>Q: What happens if there is a tie at or above the target score?</h4>
                <p>
                  If two or more players reach or exceed the target score (e.g. 11 points) in the same round with identical totals, the game continues into additional tie-breaker rounds until a clear leader finishes a round ahead.
                </p>
              </div>

              <div className="faq-item">
                <h4>Q: Does clearing the table on the final trick count as a Scopa?</h4>
                <p>
                  No! Traditional Scopa rules explicitly state that the player making the final capture of the round takes all remaining cards, but clearing the table on the very last turn does <strong>NOT</strong> grant a Scopa point.
                </p>
              </div>

              <div className="faq-item">
                <h4>Q: What if initial table setup has 3 or 4 Aces?</h4>
                <p>
                  If 3 or 4 Aces are dealt face-up on the table during initial deal, the hand is cancelled, all cards are gathered, reshuffled, and redealt by the same dealer.
                </p>
              </div>

              <div className="faq-item">
                <h4>Q: What if two players tie on Primiera score?</h4>
                <p>
                  If both players are qualified in all 4 suits and have the exact same Primiera sum (e.g., both 68 pts), no Primiera point is awarded to either player for that round.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
