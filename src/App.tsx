import { useEffect } from 'react';
import { useGame } from './context/GameContext';
import { generateAiClue } from './services/gemini';

function App() {
  // Usamos nuestro hook para obtener los datos y la función
  const { gameState, startGame, resetGame, submitClue } = useGame();

  // --- EFECTO: DETECTAR TURNO DE IA ---
  useEffect(() => {
    // Solo actuamos si estamos en fase de JUEGO (PLAYING)
    if (gameState.phase !== 'PLAYING') return;

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurn);

    // Si el jugador actual NO es humano (es Julián o Sofía)
    if (currentPlayer && !currentPlayer.isHuman) {
      const playAiTurn = async () => {
        console.log(`🤖 Pensando IA (${currentPlayer.name})...`);

        // Llamamos a Gemini
        const clue = await generateAiClue(
          currentPlayer,
          gameState.secretWord,
          gameState.clues
        );

        // Enviamos la pista al juego
        submitClue(clue);
      };

      // Pequeño delay para realismo
      const timer = setTimeout(playAiTurn, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.phase]); // Se ejecuta cada vez que cambia el turno

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Juego: El Impostor</h1>

      {/* Muestra la fase actual */}
      <h2>Fase: {gameState.phase}</h2>

      {/* Botones de control */}
      {gameState.phase === 'LOBBY' && (
        <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '16px' }}>
          JUGAR AHORA
        </button>
      )}

      {gameState.phase !== 'LOBBY' && (
        <button onClick={resetGame} style={{ marginTop: '10px' }}>
          Volver al Lobby
        </button>
      )}

      {/* ZONA DE DEBUGEO (Solo para que veas qué pasa internamente) */}
      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
        <h3>Datos Secretos (Debug):</h3>
        <p><strong>Palabra Secreta:</strong> {gameState.secretWord}</p>

        <div style={{ display: 'flex', gap: '20px' }}>
          {gameState.players.map(p => (
            <div key={p.id} style={{ border: '1px solid black', padding: '10px' }}>
              <p>{p.name}</p>
              <p style={{ color: p.role === 'IMPOSTOR' ? 'red' : 'green', fontWeight: 'bold' }}>
                {p.role || 'Esperando...'}
              </p>
            </div>
          ))}
        </div>

        {/* Historial de Pistas */}
        <div style={{ marginTop: '20px' }}>
          <h4>Historial de Pistas:</h4>
          <ul>
            {gameState.clues.map((clue, index) => (
              <li key={index}>
                <strong>Jugador {clue.playerId}:</strong> {clue.text} (Ronda {clue.round})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
