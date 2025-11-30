// src/types.ts

// 1. Los Roles posibles
export type Role = 'INOCENTE' | 'IMPOSTOR';

// 2. Las Fases del juego (Estados de la pantalla)
export type GamePhase = 
  | 'LOBBY'         // Pantalla de inicio
  | 'ASSIGNING'     // Asignando roles (calculando...)
  | 'REVEAL'        // "Eres el Impostor" o "La palabra es X"
  | 'PLAYING'       // Ronda de pistas (turnos)
  | 'VOTING'        // Momento de votar
  | 'TIE'           // Empate (ronda extra)
  | 'GAME_OVER';    // Quién ganó

// 3. La estructura de un Jugador
export interface Player {
  id: number;
  name: string;
  avatar: string;   // URL de la imagen
  isHuman: boolean; // Para saber si eres tú o la IA
  role: Role | null; // Al principio es null hasta que empiece el juego
  voteCast?: number; // El ID de a quién votó este jugador (opcional)
}

// 4. La estructura de una Pista (Lo que dicen los personajes)
export interface Clue {
  playerId: number;
  text: string;     // Lo que dijeron: "Sirve para limpiar..."
  round: number;    // Ronda 1 o Ronda 2
}

// 5. El estado GLOBAL del juego (La memoria central)
export interface GameState {
  players: Player[];
  phase: GamePhase;
  secretWord: string;
  currentTurn: number; // ID del jugador que le toca hablar
  currentRound: number; // 1 o 2
  clues: Clue[];       // Historial de todas las pistas dichas
  winner?: Role;       // ¿Ganaron los Inocentes o el Impostor?
}
