import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// IMPORTA EL PROVIDER
import { GameProvider } from './context/GameContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Envuelve la App con el GameProvider */}
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
)
