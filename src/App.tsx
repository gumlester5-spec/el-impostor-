import { useEffect, useState } from 'react';
import { useGame } from './context/GameContext';
import { generateAiClue, generateAiVote } from './services/gemini';
import './App.css';

function App() {
  const { gameState, startGame, resetGame, submitClue, startRound, castVote, updatePlayerNames } = useGame();
  const myPlayer = gameState.players.find(p => p.isHuman);

  const [loading, setLoading] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [configNames, setConfigNames] = useState({ user: '', bot1: 'Julián', bot2: 'Sofía' });


  useEffect(() => {
    const saved = localStorage.getItem('impostor_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConfigNames(parsed);
      updatePlayerNames(parsed.user, parsed.bot1, parsed.bot2);
      setIsConfiguring(false);
    }
  }, [updatePlayerNames]);


  const handleSaveConfig = () => {
    if (!configNames.user.trim()) return alert("¡Escribe tu nombre!");

    localStorage.setItem('impostor_config', JSON.stringify(configNames));
    updatePlayerNames(configNames.user, configNames.bot1, configNames.bot2);
    setIsConfiguring(false);
  };

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
  }, [gameState.currentTurn, gameState.phase, gameState.clues, submitClue, generateAiClue, gameState.secretWord, gameState.players]);

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
  }, [gameState.phase, gameState.players, castVote, generateAiVote, gameState.clues]);


  let mainTitle = "";
  let subTitle = "";
  let borderColor = '#66bb6a';


  if (gameState.phase === 'REVEAL') {
    mainTitle = myPlayer?.role === 'IMPOSTOR' ? "🤫 ERES EL IMPOSTOR" : `Palabra: ${gameState.secretWord}`;
    subTitle = "Memoriza tu rol...";
    if (myPlayer?.role === 'IMPOSTOR') borderColor = '#ef5350';
  }
  else if (gameState.phase === 'PLAYING') {

    mainTitle = myPlayer?.role === 'IMPOSTOR' ? "🤫 ERES EL IMPOSTOR" : `Palabra: ${gameState.secretWord}`;
    subTitle = `Ronda ${gameState.currentRound} - Turno de ${gameState.players.find(p => p.id === gameState.currentTurn)?.name}`;
    if (myPlayer?.role === 'IMPOSTOR') borderColor = '#ef5350';
  }
  else if (gameState.phase === 'VOTING') {
    mainTitle = "🗳️ ¡HORA DE VOTAR!";
    subTitle = "Toca la carta del sospechoso";
    borderColor = '#ff9800';
  }
  else if (gameState.phase === 'GAME_OVER') {
    mainTitle = gameState.winner === 'INOCENTE' ? "🎉 ¡GANARON LOS INOCENTES!" : "😈 ¡GANÓ EL IMPOSTOR!";
    subTitle = "Juego terminado";
    borderColor = '#ffc107';
  }
  else if (gameState.phase === 'TIE') {
    mainTitle = "⚖️ ¡EMPATE!";
    subTitle = "Nadie fue expulsado";
  }

  return (
    <div className="app-container">
      <h1 className="game-title">🕵️‍♂️ El Impostor</h1>


      {isConfiguring ? (
        <div className="lobby-card">
          <h2>👤 Configuración</h2>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5 }}>Tu Nombre:</label>
            <input className="config-input" value={configNames.user} onChange={e => setConfigNames({ ...configNames, user: e.target.value })} placeholder="Tu nombre..." autoFocus />
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5, marginTop: 15 }}>Rivales:</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="config-input" value={configNames.bot1} onChange={e => setConfigNames({ ...configNames, bot1: e.target.value })} />
              <input className="config-input" value={configNames.bot2} onChange={e => setConfigNames({ ...configNames, bot2: e.target.value })} />
            </div>
          </div>
          <button onClick={handleSaveConfig} className="play-button" style={{ marginTop: 20 }}>Guardar</button>
        </div>
      ) : (

        <>
          {gameState.phase === 'LOBBY' && (
            <div className="lobby-card">
              <h2>Hola, {configNames.user} 👋</h2>
              <p style={{ color: '#666', marginBottom: 30 }}>Jugarás contra {configNames.bot1} y {configNames.bot2}</p>
              {loading ? (
                <div style={{ color: 'var(--primary)', fontWeight: 'bold', padding: 20 }}>🤖 La IA está pensando una palabra...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={handleStart} className="play-button">JUGAR AHORA</button>
                  <button onClick={() => setIsConfiguring(true)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginTop: 10 }}>⚙️ Cambiar Nombres</button>
                </div>
              )}
            </div>
          )}

          {gameState.phase !== 'LOBBY' && (
            <div>
              <div className="status-bar" style={{ borderBottomColor: borderColor }}>
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{mainTitle}</h2>
                <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '1rem' }}>{subTitle}</p>
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
                    <div key={p.id} className={cardClass} onClick={() => { if (canVote && myPlayer) castVote(myPlayer.id, p.id); }}>
                      <img src={p.avatar} alt={p.name} className="avatar" />
                      <div className="player-info">
                        <h3>{p.name} {p.isHuman && "(Tú)"}</h3>
                        <div className="role-badge" style={{
                          background: showRole ? (p.role === 'IMPOSTOR' ? '#ffebee' : '#e8f5e9') : '#eee',
                          color: showRole ? (p.role === 'IMPOSTOR' ? '#d32f2f' : '#2e7d32') : '#666'
                        }}>
                          {showRole ? p.role : "???"}
                        </div>
                      </div>
                      <div className="clue-bubble">
                        "{gameState.clues.filter(c => c.playerId === p.id).slice(-1)[0]?.text || "..."}"
                      </div>
                      {gameState.phase === 'GAME_OVER' && (
                        <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#666' }}>
                          Votos recibidos: {gameState.players.filter(v => v.voteCast === p.id).length}
                        </div>
                      )}
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
                    <button type="submit" className="send-button">➤</button>
                  </form>
                </div>
              )}

              {(gameState.phase === 'GAME_OVER' || gameState.phase === 'TIE') && (
                <div style={{ marginTop: 40, textAlign: 'center' }}>
                  <button onClick={resetGame} className="play-button" style={{ maxWidth: 200 }}>Jugar de Nuevo</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
