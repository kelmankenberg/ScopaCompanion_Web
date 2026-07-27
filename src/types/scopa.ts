export type GameMode = '1v1' | '2v2' | '3p';

export type TargetScore = 11 | 16 | 21 | number;

export type Suit = 'denari' | 'coppe' | 'spade' | 'bastoni';

export interface Player {
  id: string;
  name: string;
  color: string;
  team: 'A' | 'B' | null; // Used for 2v2 mode
}

export interface GameSettings {
  gameMode: GameMode;
  targetScore: TargetScore;
  variantNapola: boolean;
  variantReBello: boolean;
  soundEnabled: boolean;
  dealerIndex: number;
}

export interface CardDef {
  suit: Suit;
  value: number; // 1 (Ace) to 10 (King)
  name: string;
  primieraValue: number;
}

export interface RoundBreakdown {
  carte: number;
  denari: number;
  settebello: number;
  primiera: number;
  scopas: number;
  napola?: number;
  reBello?: number;
  total: number;
}

export interface RoundRecord {
  id: string;
  roundNumber: number;
  dealerId: string;
  scores: Record<string, number>; // playerId or team -> points earned in round
  cumulativeScores: Record<string, number>; // running totals after this round
  breakdown: Record<string, RoundBreakdown>;
  timestamp: number;
  isOverride?: boolean;
}

export interface GameState {
  id: string;
  settings: GameSettings;
  players: Player[];
  rounds: RoundRecord[];
  currentDealerId: string;
  isFinished: boolean;
  winnerId: string | null;
  savedPlayers?: string[];
  createdAt: number;
  updatedAt?: number;
}

