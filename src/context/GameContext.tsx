// src/context/GameContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { GameState, Role } from '../types';
import { INITIAL_PLAYERS, WORD_LIST } from '../constants';

// 1. Definimos qué funciones y datos vamos a compartir con toda la app
interface GameContextType {
    gameState: GameState;
    startGame: () => void;
    resetGame: () => void;
    submitClue: (text: string) => Promise<void>;
}

// 2. Creamos el contexto vacío
const GameContext = createContext<GameContextType | undefined>(undefined);

// 3. El Estado Inicial (Como empieza todo antes de jugar)
const initialGameState: GameState = {
    players: INITIAL_PLAYERS,
    phase: 'LOBBY',
    secretWord: '',
    currentTurn: 1, // Por defecto empieza el ID 1 (Tú)
    currentRound: 1,
    clues: [],
    winner: undefined,
};

// 4. El Componente PROVEEDOR (El Cerebro)
export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [gameState, setGameState] = useState<GameState>(initialGameState);

    // --- LÓGICA PRINCIPAL: INICIAR PARTIDA ---
    const startGame = () => {
        // A. Elegir palabra al azar
        const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
        const newSecretWord = WORD_LIST[randomIndex];

        // B. Elegir quién es el impostor (0, 1 o 2)
        const impostorIndex = Math.floor(Math.random() * 3);

        // C. Asignar roles a los jugadores
        const newPlayers = INITIAL_PLAYERS.map((player, index) => {
            // Definimos el rol
            const assignedRole: Role = index === impostorIndex ? 'IMPOSTOR' : 'INOCENTE';

            return {
                ...player,
                role: assignedRole,
                voteCast: undefined // Limpiamos votos anteriores
            };
        });

        // D. Actualizar el estado para empezar
        setGameState({
            ...initialGameState,
            players: newPlayers,
            secretWord: newSecretWord,
            phase: 'REVEAL', // Pasamos a la fase de "Ver tu rol"
            currentTurn: 1,  // Siempre empieza el jugador 1 (puedes cambiarlo a random luego)
        });
    };

    // --- LÓGICA: REGISTRAR PISTA Y CAMBIAR TURNO ---
    const submitClue = async (text: string) => {
        const newClue = {
            playerId: gameState.currentTurn,
            text: text,
            round: gameState.currentRound
        };

        const updatedClues = [...gameState.clues, newClue];

        // Calcular siguiente turno
        let nextTurn = gameState.currentTurn + 1;
        if (nextTurn > 3) nextTurn = 1;

        // Calcular cambio de ronda/fase
        let nextRound = gameState.currentRound;
        let nextPhase = gameState.phase;

        if (updatedClues.length % 3 === 0) {
            if (gameState.currentRound === 1) {
                nextRound = 2;
            } else {
                nextPhase = 'VOTING';
            }
        }

        setGameState(prev => ({
            ...prev,
            clues: updatedClues,
            currentTurn: nextTurn,
            currentRound: nextRound,
            phase: nextPhase
        }));
    };

    // --- LÓGICA: REINICIAR AL LOBBY ---
    const resetGame = () => {
        setGameState(initialGameState);
    };

    return (
        <GameContext.Provider value={{ gameState, startGame, resetGame, submitClue }}>
            {children}
        </GameContext.Provider>
    );
};

// 5. Un Hook personalizado para usar esto fácil en tus componentes
export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame debe usarse dentro de un GameProvider');
    }
    return context;
};
