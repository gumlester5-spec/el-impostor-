import type { Player } from './types';

export const WORD_LIST = [
    'Escoba', 'Guitarra', 'Pizza', 'Sol', 'Montaña',
    'Computadora', 'Gato', 'Zapatos', 'Playa', 'Libro'
];

export const INITIAL_PLAYERS: Player[] = [
    {
        id: 1,
        name: 'Lester',
        avatar: '/images/lester-avatar.png',
        isHuman: true,
        role: null
    },
    {
        id: 2,
        name: 'Julián',
        avatar: '/images/julian.png',
        isHuman: false,
        role: null
    },
    {
        id: 3,
        name: 'Sofía',
        avatar: '/images/sofia.png',
        isHuman: false,
        role: null
    }
];
