export type Role = 'INOCENTE' | 'IMPOSTOR';

export type GamePhase =
  | 'LOBBY'
  | 'ASSIGNING'
  | 'REVEAL'
  | 'PLAYING'
  | 'VOTING'
  | 'TIE'
  | 'GAME_OVER';

export interface Player {
  id: number;
  name: string;
  avatar: string;
  isHuman: boolean;
  role: Role | null;
  voteCast?: number;
}

export interface Clue {
  playerId: number;
  text: string;
  round: number;
}

export interface GameState {
  players: Player[];
  phase: GamePhase;
  secretWord: string;
  currentTurn: number;
  currentRound: number;
  clues: Clue[];
  winner?: Role;
}
