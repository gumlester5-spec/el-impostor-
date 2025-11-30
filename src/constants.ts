// src/constants.ts
import type { Player } from './types';

// Lista de palabras para el juego (puedes agregar más)
export const WORD_LIST = [
    'Escoba', 'Guitarra', 'Pizza', 'Sol', 'Montaña',
    'Computadora', 'Gato', 'Zapatos', 'Playa', 'Libro'
];

// Configuración inicial de los jugadores
export const INITIAL_PLAYERS: Player[] = [
    {
        id: 1,
        name: 'Lester', // Tu nombre
        avatar: '/images/lester-avatar.png', // Pon tu imagen aquí
        isHuman: true,
        role: null
    },
    {
        id: 2,
        name: 'Julián',
        avatar: '/images/julian.png', // La imagen del chico tierno
        isHuman: false,
        role: null
    },
    {
        id: 3,
        name: 'Sofía',
        avatar: '/images/sofia.png', // La imagen de la chica cool
        isHuman: false,
        role: null
    }
];
