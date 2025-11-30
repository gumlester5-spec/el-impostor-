import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { GameState, Role } from '../types';
import { INITIAL_PLAYERS } from '../constants';
import { generateSecretWord } from '../services/gemini';

interface GameContextType {
    gameState: GameState;
    startGame: () => Promise<void>;
    resetGame: () => void;
    submitClue: (text: string) => void;
    startRound: () => void;
    castVote: (voterId: number, targetId: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialGameState: GameState = {
    players: INITIAL_PLAYERS,
    phase: 'LOBBY',
    secretWord: '',
    currentTurn: 1,
    currentRound: 1,
    clues: [],
    winner: undefined,
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [gameState, setGameState] = useState<GameState>(initialGameState);

    const startGame = useCallback(async () => {
        const word = await generateSecretWord();

        const impostorIndex = Math.floor(Math.random() * 3);
        const randomStartTurn = Math.floor(Math.random() * 3) + 1;

        const newPlayers = INITIAL_PLAYERS.map((player, index) => ({
            ...player,
            role: (index === impostorIndex ? 'IMPOSTOR' : 'INOCENTE') as Role,
            voteCast: undefined
        }));

        setGameState({
            ...initialGameState,
            players: newPlayers,
            secretWord: word,
            phase: 'REVEAL',
            currentTurn: randomStartTurn,
        });
    }, []);

    const startRound = useCallback(() => {
        setGameState(prev => ({ ...prev, phase: 'PLAYING' }));
    }, []);

    const resetGame = useCallback(() => {
        setGameState(initialGameState);
    }, []);

    const submitClue = useCallback((text: string) => {
        setGameState(prev => {
            const newClue = { playerId: prev.currentTurn, text, round: prev.currentRound };
            const updatedClues = [...prev.clues, newClue];

            let nextTurn = prev.currentTurn + 1;
            if (nextTurn > 3) nextTurn = 1;

            let nextRound = prev.currentRound;
            let nextPhase = prev.phase;

            if (updatedClues.length % 3 === 0) {
                if (prev.currentRound === 1) {
                    nextRound = 2;
                } else {
                    nextPhase = 'VOTING';
                }
            }

            return {
                ...prev,
                clues: updatedClues,
                currentTurn: nextTurn,
                currentRound: nextRound,
                phase: nextPhase
            };
        });
    }, []);

    const castVote = useCallback((voterId: number, targetId: number) => {
        setGameState(prev => {
            const updatedPlayers = prev.players.map(p =>
                p.id === voterId ? { ...p, voteCast: targetId } : p
            );

            const votesCount = updatedPlayers.filter(p => p.voteCast !== undefined).length;

            let finalPhase = prev.phase;
            let winner: Role | undefined = undefined;

            if (votesCount === 3) {
                const votesReceived: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
                updatedPlayers.forEach(p => {
                    if (p.voteCast) votesReceived[p.voteCast]++;
                });

                let maxVotes = 0;
                let playerMostVotedId = -1;

                Object.entries(votesReceived).forEach(([id, count]) => {
                    if (count > maxVotes) {
                        maxVotes = count;
                        playerMostVotedId = parseInt(id);
                    } else if (count === maxVotes) {
                        playerMostVotedId = -1;
                    }
                });

                if (playerMostVotedId === -1) {
                    finalPhase = 'TIE';
                } else {
                    const expelledPlayer = updatedPlayers.find(p => p.id === playerMostVotedId);
                    if (expelledPlayer?.role === 'IMPOSTOR') {
                        winner = 'INOCENTE';
                    } else {
                        winner = 'IMPOSTOR';
                    }
                    finalPhase = 'GAME_OVER';
                }
            }

            return {
                ...prev,
                players: updatedPlayers,
                phase: finalPhase,
                winner: winner
            };
        });
    }, []);

    return (
        <GameContext.Provider value={{ gameState, startGame, resetGame, submitClue, startRound, castVote }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame Error');
    return context;
};
