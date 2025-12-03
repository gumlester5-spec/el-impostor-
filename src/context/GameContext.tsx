
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { GameState, Role } from '../types';
import { INITIAL_PLAYERS } from '../constants';
import { generateSecretWord } from '../services/gemini';
import { saveWord } from '../services/history';

interface GameContextType {
    gameState: GameState;
    startGame: () => Promise<void>;
    resetGame: () => void;
    submitClue: (text: string) => void;
    startRound: () => void;
    castVote: (voterId: number, targetId: number) => void;
    updatePlayerNames: (p1: string, p2: string, p3: string) => void;
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


    const updatePlayerNames = useCallback((name1: string, name2: string, name3: string) => {
        setGameState(prev => ({
            ...prev,
            players: prev.players.map(p => {
                if (p.id === 1) return { ...p, name: name1 };
                if (p.id === 2) return { ...p, name: name2 };
                if (p.id === 3) return { ...p, name: name3 };
                return p;
            })
        }));
    }, []);



    const startGame = useCallback(async () => {
        const word = await generateSecretWord();
        await saveWord(word); // Guardar en historial
        const impostorIndex = Math.floor(Math.random() * 3);
        const randomStartTurn = Math.floor(Math.random() * 3) + 1;


        setGameState(prev => {
            const newPlayers = prev.players.map((player, index) => ({
                ...player,
                role: (index === impostorIndex ? 'IMPOSTOR' : 'INOCENTE') as Role,
                voteCast: undefined
            }));

            return {
                ...prev,
                players: newPlayers,
                secretWord: word,
                phase: 'REVEAL',
                currentTurn: randomStartTurn,
                currentRound: 1,
                clues: [],
                winner: undefined
            };
        });
    }, []);

    const startRound = useCallback(() => {
        setGameState(prev => ({ ...prev, phase: 'PLAYING' }));
    }, []);

    const resetGame = useCallback(() => {

        setGameState(prev => ({
            ...initialGameState,
            players: prev.players.map(p => ({ ...p, role: null, voteCast: undefined }))
        }));
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
            if (voterId === targetId) return prev; // No puedes votarte a ti mismo
            const player = prev.players.find(p => p.id === voterId);
            if (player?.voteCast !== undefined) return prev; // Si ya votó, no hacer nada

            const updatedPlayers = prev.players.map(p =>
                p.id === voterId ? { ...p, voteCast: targetId } : p
            );

            const votesCount = updatedPlayers.filter(p => p.voteCast !== undefined).length;
            let finalPhase = prev.phase;
            let winner: Role | undefined = undefined;

            if (votesCount === 3) {
                const votesReceived: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
                updatedPlayers.forEach(p => { if (p.voteCast) votesReceived[p.voteCast]++; });

                let maxVotes = 0;
                let playerMostVotedId = -1;

                Object.entries(votesReceived).forEach(([id, count]) => {
                    if (count > maxVotes) {
                        maxVotes = count;
                        playerMostVotedId = parseInt(id);
                    } else if (count === maxVotes) playerMostVotedId = -1;
                });

                if (playerMostVotedId === -1) {
                    finalPhase = 'TIE';
                } else {
                    const expelledPlayer = updatedPlayers.find(p => p.id === playerMostVotedId);
                    winner = expelledPlayer?.role === 'IMPOSTOR' ? 'INOCENTE' : 'IMPOSTOR';
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
        <GameContext.Provider value={{ gameState, startGame, resetGame, submitClue, startRound, castVote, updatePlayerNames }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame Error');
    return context;
};
