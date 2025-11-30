import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold
} from "@google/generative-ai";
import type { Player, Clue } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: safetySettings
}) : null;

export const generateAiClue = async (
    player: Player,
    secretWord: string,
    history: Clue[]
): Promise<string> => {
    if (!model) return "Error: Falta API Key";

    const conversationHistory = history.length > 0
        ? history.map(h => `- Jugador ${h.playerId}: "${h.text}"`).join("\n")
        : "Nadie ha hablado aún.";

    const trait = player.name === "Julián" ? "tierno e inocente" : "cool, moderna y directa";

    let prompt = "";

    if (player.role === 'INOCENTE') {
        prompt = `
            Contexto: Juego de mesa familiar "El Impostor".
            Personaje: Eres ${player.name}, una persona ${trait}.
            Palabra Secreta: "${secretWord}".
            Historial de la ronda:
            ${conversationHistory}
            
            Tarea: Escribe una pista MUY BREVE (máximo 12 palabras) que describa la palabra "${secretWord}" sutilmente para probar que NO eres el impostor.
            Reglas: NO digas la palabra secreta. Habla en primera persona. Sé natural.
            Respuesta:
        `;
    } else {
        prompt = `
            Contexto: Juego de mesa familiar "El Impostor".
            Personaje: Eres ${player.name}, una persona ${trait}.
            Rol: ERES EL IMPOSTOR. No sabes la palabra secreta.
            Historial de pistas de otros jugadores:
            ${conversationHistory}
            
            Tarea: Escribe una pista MUY BREVE (máximo 12 palabras) que suene convincente para encajar con lo que han dicho los otros.
            Reglas: Miente con confianza. Si nadie ha hablado, di algo genérico sobre un objeto común.
            Respuesta:
        `;
    }

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/^"|"$/g, '').trim();
        return text || "Mmm...";
    } catch (e) {
        console.error("Error Gemini Pista:", e);
        return "¡Ay! Me quedé en blanco.";
    }
};

export const generateSecretWord = async (): Promise<string> => {
    if (!model) return "Pizza";

    const prompt = `
        Genera una sola palabra en español para un juego de adivinanzas.
        Debe ser un sustantivo concreto común (ej. Guitarra, Sol, Manzana, Silla).
        Respuesta: SOLO la palabra. Sin puntos.
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().replace(/[\."\n]/g, '').trim();
    } catch (error) {
        console.error("Error Gemini Palabra:", error);
        return "Luna";
    }
};

export const generateAiVote = async (
    voter: Player,
    players: Player[],
    history: Clue[]
): Promise<number> => {
    if (!model) return 1;

    const conversationHistory = history.map(h => `- P${h.playerId}: "${h.text}"`).join("\n");
    const candidates = players.filter(p => p.id !== voter.id).map(p => p.id).join(", ");

    const prompt = `
        Juego: El Impostor.
        Historial:
        ${conversationHistory}
        
        Eres el Jugador ${voter.id} (${voter.role}).
        Debes votar para expulsar a alguien.
        
        ${voter.role === 'INOCENTE'
            ? "Analiza las pistas. Vota al jugador cuya pista tenga menos sentido con la palabra secreta."
            : "Vota a cualquier otro jugador inocente para salvarte."}
        
        Candidatos válidos (IDs): ${candidates}.
        
        Respuesta: ÚNICAMENTE el número del ID del jugador. Ejemplo: 2
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const votedId = parseInt(text.match(/\d+/)?.[0] || "1");
        return votedId;
    } catch (error) {
        console.error("Error Gemini Voto:", error);
        const validTargets = players.filter(p => p.id !== voter.id);
        const randomTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
        return randomTarget.id;
    }
};
