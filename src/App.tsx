import { useEffect, useState } from 'react';
import { useGame } from './context/GameContext';
import { generateAiClue, generateAiVote } from './services/gemini';
import './App.css';

function App() {
  const { gameState, startGame, resetGame, submitClue, startRound, castVote } = useGame();
  const myPlayer = gameState.players.find(p => p.isHuman);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    await startGame();
    setLoading(false);
  };

  useEffect(() => {
    if (gameState.phase === 'REVEAL') {
      const timer = setTimeout(() => startRound(), 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, startRound]);

  useEffect(() => {
    if (gameState.phase !== 'PLAYING') return;
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurn);

    if (currentPlayer && !currentPlayer.isHuman) {
      let isActive = true;
      const playAiTurn = async () => {
        const clue = await generateAiClue(currentPlayer, gameState.secretWord, gameState.clues);
        if (isActive) submitClue(clue);
      };
      const timer = setTimeout(playAiTurn, 2500);
      return () => { isActive = false; clearTimeout(timer); };
    }
  }, [gameState.currentTurn, gameState.phase, gameState.clues]);

  useEffect(() => {
    if (gameState.phase === 'VOTING') {
      gameState.players.forEach(p => {
        if (!p.isHuman && p.voteCast === undefined) {
          const voteAi = async () => {
            const targetId = await generateAiVote(p, gameState.players, gameState.clues);
            castVote(p.id, targetId);
          };
          setTimeout(voteAi, Math.random() * 2000 + 1000);
        }
      });
    }
  }, [gameState.phase, gameState.players]);

  let headerText = `Palabra: ${gameState.secretWord}`;
  if (myPlayer?.role === 'IMPOSTOR') headerText = "🤫 ERES EL IMPOSTOR";
  if (gameState.phase === 'VOTING') headerText = "🗳️ ¡HORA DE VOTAR! Toca una carta";
  if (gameState.phase === 'GAME_OVER') headerText = gameState.winner === 'INOCENTE' ? "🎉 ¡GANARON LOS INOCENTES!" : "😈 ¡GANÓ EL IMPOSTOR!";
  if (gameState.phase === 'TIE') headerText = "⚖️ ¡EMPATE! Nadie fue expulsado.";

  // Dynamic styles for status bar
  const statusBg = gameState.phase === 'GAME_OVER' ? '#fff3cd' : (myPlayer?.role === 'IMPOSTOR' ? '#ffebee' : '#e8f5e9');
  const statusBorder = myPlayer?.role === 'IMPOSTOR' ? '#ef5350' : '#66bb6a';

  return (
    <div className="app-container">
      <h1 className="game-title">🕵️‍♂️ El Impostor</h1>

      {gameState.phase === 'LOBBY' && (
        <div className="lobby-container">
          <h2>¿Listo para jugar?</h2>
          {loading ? (
            <p>🤖 La IA está eligiendo una palabra secreta...</p>
          ) : (
            <button onClick={handleStart} className="play-button">
              JUGAR AHORA
            </button>
          )}
        </div>
      )}

      {gameState.phase !== 'LOBBY' && (
        <div>
          <div className="status-bar" style={{
            background: statusBg,
            borderColor: gameState.phase === 'GAME_OVER' ? '#ffc107' : statusBorder
          }}>
            <h2 className="status-title">{headerText}</h2>
            <p>Fase: {gameState.phase} | Ronda: {gameState.currentRound}</p>
          </div>

          <div className="players-grid">
            {gameState.players.map(p => {
              const showRole = (p.isHuman || gameState.phase === 'GAME_OVER');
              const isTurn = gameState.currentTurn === p.id && gameState.phase === 'PLAYING';

              const canVote = gameState.phase === 'VOTING' && !myPlayer?.voteCast && p.id !== myPlayer?.id;
              const votedByMe = myPlayer?.voteCast === p.id;

              let cardClass = "player-card";
              if (isTurn) cardClass += " turn";
              if (canVote) cardClass += " can-vote";
              if (votedByMe) cardClass += " voted-by-me";

              return (
                <div
                  key={p.id}
                  className={cardClass}
                  onClick={() => {
                    if (canVote && myPlayer) castVote(myPlayer.id, p.id);
                  }}
                >
                  <img src={p.avatar} alt={p.name} className="avatar" />

                  <div className="player-info">
                    <h3>{p.name} {p.isHuman && "(Tú)"}</h3>

                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {showRole ? <span style={{ color: p.role === 'IMPOSTOR' ? 'red' : 'green' }}>{p.role}</span> : "???"}
                    </div>

                    {gameState.phase === 'GAME_OVER' && (
                      <div style={{ background: '#333', color: 'white', borderRadius: '5px', padding: '2px 5px', fontSize: '0.8rem' }}>
                        Votos: {gameState.players.filter(v => v.voteCast === p.id).length}
                      </div>
                    )}
                  </div>

                  <div className="clue-bubble">
                    "{gameState.clues.filter(c => c.playerId === p.id).slice(-1)[0]?.text || "..."}"
                  </div>
                </div>
              );
            })}
          </div>

          {gameState.phase === 'PLAYING' && gameState.currentTurn === myPlayer?.id && (
            <div className="input-area">
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem('clue') as HTMLInputElement);
                if (input.value.trim()) { submitClue(input.value); input.value = ''; }
              }} className="input-form">
                <input name="clue" type="text" placeholder="Escribe tu pista..." autoFocus className="clue-input" autoComplete="off" />
                <button type="submit" className="send-button">Enviar</button>
              </form>
            </div>
          )}

          {(gameState.phase === 'GAME_OVER' || gameState.phase === 'TIE') && (
            <div style={{ marginTop: '50px', textAlign: 'center' }}>
              <button onClick={resetGame} className="play-button" style={{ fontSize: '16px', padding: '10px 20px' }}>
                Jugar de Nuevo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
