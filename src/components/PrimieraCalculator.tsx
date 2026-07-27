import type { Suit } from '../types/scopa';
import { SUITS, SUIT_INFO, PRIMIERA_VALUE_MAP, calculatePrimiera } from '../utils/scopaRules';

import { soundManager } from '../utils/soundEffects';

interface PrimieraCalculatorProps {
  entities: { id: string; name: string; color: string }[];
  selections: Record<string, Record<Suit, number | null>>;
  onChange: (newSelections: Record<string, Record<Suit, number | null>>) => void;
}

export const PrimieraCalculator: React.FC<PrimieraCalculatorProps> = ({
  entities,
  selections,
  onChange,
}) => {
  const suitTooltips: Record<Suit, string> = {
    denari: 'Denari (Coins): golden coin suit used for Denari scoring and Primiera qualification.',
    coppe: 'Coppe (Cups): chalice suit; you need at least one Coppe card to qualify for Primiera.',
    spade: 'Spade (Swords): blade suit; counts toward the 4-suit Primiera requirement.',
    bastoni: 'Bastoni (Clubs): staff suit; required alongside the other suits for Primiera.',
  };

  const handleCardSelect = (entityId: string, suit: Suit, cardValue: number | null) => {
    soundManager.playCardSelect();
    const updated = {
      ...selections,
      [entityId]: {
        ...(selections[entityId] || { denari: null, coppe: null, spade: null, bastoni: null }),
        [suit]: cardValue,
      },
    };
    onChange(updated);
  };

  // Card rank options for selection (Ordered by Primiera point value descending)
  const rankOptions: { val: number | null; label: string; pts: number }[] = [
    { val: 7, label: '7', pts: 21 },
    { val: 6, label: '6', pts: 18 },
    { val: 1, label: 'Ace', pts: 16 },
    { val: 5, label: '5', pts: 15 },
    { val: 4, label: '4', pts: 14 },
    { val: 3, label: '3', pts: 13 },
    { val: 2, label: '2', pts: 12 },
    { val: 10, label: 'Re/Cav/Fan', pts: 10 },
    { val: null, label: 'None ❌', pts: 0 },
  ];

  return (
    <div className="primiera-calculator">
      <div className="primiera-banner">
        <h4>✨ Primiera Visual Calculator</h4>
        <p>Select the single highest captured card rank for each suit per player. Must have at least 1 card in all 4 suits to qualify!</p>
      </div>

      <div className="primiera-entities-grid">
        {entities.map((entity) => {
          const entityCards = selections[entity.id] || { denari: null, coppe: null, spade: null, bastoni: null };
          const pResult = calculatePrimiera(entityCards);

          return (
            <div key={entity.id} className="primiera-entity-card" style={{ borderLeftColor: entity.color }}>
              <div className="entity-header">
                <span className="entity-name">{entity.name}</span>
                <span className={`status-badge ${pResult.qualified ? 'qualified' : 'disqualified'}`}>
                  {pResult.qualified ? `Qualified (${pResult.score} pts)` : 'Disqualified (Missing Suit)'}
                </span>
              </div>

              <div className="suits-selector-list">
                {SUITS.map((suit) => {
                  const sInfo = SUIT_INFO[suit];
                  const selectedVal = entityCards[suit];
                  const currentPts = selectedVal !== null && selectedVal !== undefined ? PRIMIERA_VALUE_MAP[selectedVal] || 0 : 0;

                  return (
                    <div key={suit} className="suit-row">
                      <div className="suit-label" style={{ color: sInfo.color }}>
                        <span className="suit-icon">{sInfo.icon}</span>
                        <span
                          className="suit-name tooltip-anchor"
                          tabIndex={0}
                          title={suitTooltips[suit]}
                          aria-label={suitTooltips[suit]}
                        >
                          {sInfo.name.split(' ')[0]}
                          <span className="inline-tooltip" role="tooltip">{suitTooltips[suit]}</span>
                        </span>
                        <span className="suit-pts">{currentPts > 0 ? `(${currentPts}pts)` : ''}</span>
                      </div>

                      <div className="rank-buttons-scroll custom-scrollbar">
                        {rankOptions.map((opt) => {
                          const isSelected = selectedVal === opt.val;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              className={`rank-btn ${isSelected ? 'selected' : ''}`}
                              style={isSelected ? { backgroundColor: sInfo.color, borderColor: sInfo.color } : {}}
                              onClick={() => handleCardSelect(entity.id, suit, opt.val)}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
