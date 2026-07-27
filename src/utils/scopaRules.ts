import type { Suit, RoundBreakdown, GameSettings } from '../types/scopa';


export const SUITS: Suit[] = ['denari', 'coppe', 'spade', 'bastoni'];

export const SUIT_INFO: Record<Suit, { name: string; icon: string; color: string; symbol: string }> = {
  denari: { name: 'Denari (Coins)', icon: '🪙', color: '#f1c40f', symbol: '♦' },
  coppe: { name: 'Coppe (Cups)', icon: '🏆', color: '#e74c3c', symbol: '♥' },
  spade: { name: 'Spade (Swords)', icon: '⚔️', color: '#3498db', symbol: '♠' },
  bastoni: { name: 'Bastoni (Clubs)', icon: '🪵', color: '#2ecc71', symbol: '♣' },
};

// Primiera point mapping
// 7 = 21, 6 = 18, Ace(1) = 16, 5 = 15, 4 = 14, 3 = 13, 2 = 12, Face (8,9,10) = 10
export const PRIMIERA_VALUE_MAP: Record<number, number> = {
  7: 21,
  6: 18,
  1: 16,
  5: 15,
  4: 14,
  3: 13,
  2: 12,
  8: 10, // Fante / Jack
  9: 10, // Cavallo / Knight
  10: 10, // Re / King
};

export const CARD_NAMES: Record<number, string> = {
  1: 'Asso (Ace)',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: 'Fante (Jack)',
  9: 'Cavallo (Knight)',
  10: 'Re (King)',
};

export interface PlayerSuitCards {
  [suit: string]: number | null; // Value 1-10 of best card in suit, or null if no card in suit
}

export interface PrimieraResult {
  qualified: boolean;
  score: number;
  bestCards: Record<Suit, number | null>;
}

/**
 * Calculates Primiera qualification and point sum for a set of suit cards.
 * A player MUST have captured at least 1 card in ALL 4 suits to qualify.
 */
export function calculatePrimiera(cards: Record<Suit, number | null>): PrimieraResult {
  let qualified = true;
  let score = 0;
  const bestCards: Record<Suit, number | null> = {
    denari: cards.denari ?? null,
    coppe: cards.coppe ?? null,
    spade: cards.spade ?? null,
    bastoni: cards.bastoni ?? null,
  };

  for (const suit of SUITS) {
    const val = cards[suit];
    if (val === null || val === undefined) {
      qualified = false;
    } else {
      score += PRIMIERA_VALUE_MAP[val] || 0;
    }
  }

  return { qualified, score: qualified ? score : 0, bestCards };
}

export interface RawRoundInput {
  // Key is entity ID (playerId or teamId 'A'/'B')
  scopas: Record<string, number>;
  settebelloId: string | null;
  denariCount: Record<string, number>;
  cardsCount: Record<string, number>;
  primieraSelections: Record<string, Record<Suit, number | null>>; // Or direct primieraWinnerId if manual
  primieraWinnerId?: string | null;
  napolaCount?: Record<string, number>; // Sequence length of Denari (e.g. 3 = Ace,2,3 -> 3pts)
  reBelloId?: string | null;
}

/**
 * Evaluates a complete round according to standard Scopa rules and selected variants.
 */
export function calculateRoundScores(
  entities: { id: string; name: string }[],
  input: RawRoundInput,
  settings: GameSettings
): Record<string, RoundBreakdown> {
  const result: Record<string, RoundBreakdown> = {};

  // Initialize breakdown
  for (const entity of entities) {
    result[entity.id] = {
      carte: 0,
      denari: 0,
      settebello: 0,
      primiera: 0,
      scopas: input.scopas[entity.id] || 0,
      total: 0,
    };
    if (settings.variantNapola) {
      result[entity.id].napola = 0;
    }
    if (settings.variantReBello) {
      result[entity.id].reBello = 0;
    }
  }

  // 1. CARTE (Cards majority > 20)
  let maxCards = -1;
  let maxCardsEntities: string[] = [];
  for (const entity of entities) {
    const count = input.cardsCount[entity.id] || 0;
    if (count > maxCards) {
      maxCards = count;
      maxCardsEntities = [entity.id];
    } else if (count === maxCards && count > 0) {
      maxCardsEntities.push(entity.id);
    }
  }
  // Standard rule: Majority (21+) gets 1 pt. If tie (20-20 or equal), no point.
  if (maxCardsEntities.length === 1 && maxCards > 20) {
    result[maxCardsEntities[0]].carte = 1;
  }

  // 2. DENARI (Coins majority > 5)
  let maxDenari = -1;
  let maxDenariEntities: string[] = [];
  for (const entity of entities) {
    const count = input.denariCount[entity.id] || 0;
    if (count > maxDenari) {
      maxDenari = count;
      maxDenariEntities = [entity.id];
    } else if (count === maxDenari && count > 0) {
      maxDenariEntities.push(entity.id);
    }
  }
  // Standard rule: Majority (6+) gets 1 pt. If tie (5-5 or equal), no point.
  if (maxDenariEntities.length === 1 && maxDenari > 5) {
    result[maxDenariEntities[0]].denari = 1;
  }

  // 3. SETTEBELLO (7 of Coins)
  if (input.settebelloId && result[input.settebelloId]) {
    result[input.settebelloId].settebello = 1;
  }

  // 4. PRIMIERA (Prime)
  if (input.primieraWinnerId !== undefined) {
    // Manual winner selection override
    if (input.primieraWinnerId && result[input.primieraWinnerId]) {
      result[input.primieraWinnerId].primiera = 1;
    }
  } else {
    // Calculated Primiera
    let highestPrimieraScore = -1;
    let primieraWinners: string[] = [];

    for (const entity of entities) {
      const suitCards = input.primieraSelections[entity.id] || {
        denari: null,
        coppe: null,
        spade: null,
        bastoni: null,
      };
      const pRes = calculatePrimiera(suitCards);

      if (pRes.qualified) {
        if (pRes.score > highestPrimieraScore) {
          highestPrimieraScore = pRes.score;
          primieraWinners = [entity.id];
        } else if (pRes.score === highestPrimieraScore) {
          primieraWinners.push(entity.id);
        }
      }
    }

    // Award 1 point to single highest qualified score (if tie, no point awarded)
    if (primieraWinners.length === 1) {
      result[primieraWinners[0]].primiera = 1;
    }
  }

  // 5. VARIANTS
  // Napola (Ace, 2, 3... of Denari = sequence length 3 to 7 points)
  if (settings.variantNapola && input.napolaCount) {
    for (const entity of entities) {
      const seq = input.napolaCount[entity.id] || 0;
      if (seq >= 3) {
        // Must have at least Ace, 2, 3 (3 pts) up to 7 (7 pts max)
        const pts = Math.min(seq, 7);
        result[entity.id].napola = pts;
      }
    }
  }

  // Re Bello (King of Coins = 1 pt)
  if (settings.variantReBello && input.reBelloId && result[input.reBelloId]) {
    result[input.reBelloId].reBello = 1;
  }

  // Compute Total
  for (const entity of entities) {
    const b = result[entity.id];
    b.total =
      b.carte +
      b.denari +
      b.settebello +
      b.primiera +
      b.scopas +
      (b.napola || 0) +
      (b.reBello || 0);
  }

  return result;
}
