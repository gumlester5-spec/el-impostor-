const DB_NAME = 'ImpostorDB';
const DB_VERSION = 1;
const STORE_NAME = 'played_words';

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'word' });
            }
        };
    });
};

export const saveWord = async (word: string): Promise<void> => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ word: word.toLowerCase(), date: new Date().toISOString() });
    } catch (error) {
        console.error('Error saving word to history:', error);
    }
};

export const getUsedWords = async (): Promise<string[]> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result as { word: string }[];
                resolve(results.map(r => r.word));
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting history:', error);
        return [];
    }
};
