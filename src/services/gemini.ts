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
            Contexto: Juego "El Impostor".
            Personaje: Eres ${player.name}, una persona ${trait}.
            Palabra Secreta: "${secretWord}".
            Historial:
            ${conversationHistory}
            
            ESTRATEGIA OFICIAL (INOCENTE):
            "Debes dar una pista lo suficientemente clara para que el otro inocente sepa que tú sabes la palabra, pero lo suficientemente sutil para que el impostor no adivine de qué están hablando."
            
            Tarea: Escribe una pista (máx 12 palabras) siguiendo tu estrategia.
            Reglas: NO digas la palabra secreta. Habla en primera persona.
            Respuesta:
        `;
    } else {
        prompt = `
            Contexto: Juego "El Impostor".
            Personaje: Eres ${player.name}, una persona ${trait}.
            Rol: ERES EL IMPOSTOR. No sabes la palabra secreta.
            Historial:
            ${conversationHistory}
            
            ESTRATEGIA OFICIAL (IMPOSTOR):
            "Como no sabes la palabra, debes leer las pistas anteriores de los otros jugadores, deducir el tema y decir algo vago o genérico que encaje para no levantar sospechas."
            
            Tarea: Escribe una pista (máx 12 palabras) siguiendo tu estrategia.
            Reglas: Miente con confianza. Si eres el primero, di algo muy genérico sobre un objeto común.
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

import { getUsedWords } from "./history";

export const generateSecretWord = async (): Promise<string> => {
    if (!model) return "Pizza";

    const usedWords = await getUsedWords();
    const excluded = usedWords.length > 0 ? `NO uses estas palabras: ${usedWords.join(", ")}.` : "";

    const prompt = `
        Genera una sola palabra en español para un juego de adivinanzas.
        Debe ser un sustantivo concreto común (ej. Guitarra, Sol, Manzana, Silla).
        ${excluded}
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
        Palabra Secreta (Contexto): "${history[0]?.text ? 'Desconocida para el impostor' : '...'}"
        
        Historial de pistas:
        ${conversationHistory}
        
        Tu Rol: Jugador ${voter.id} (${voter.role}).
        Tu Misión: Votar para expulsar a alguien.
        
        Candidatos Válidos (IDs): [${candidates}]
        
        Instrucciones de Estrategia:
        ${voter.role === 'INOCENTE'
            ? "- Eres INOCENTE. Busca al jugador cuya pista sea más lejana, vaga o incorrecta respecto a la palabra secreta (si la sabes) o al contexto."
            : "- Eres el IMPOSTOR. Debes votar por un inocente para salvarte. Elige a quien parezca más sospechoso para los demás."}
        
        REGLA ABSOLUTA:
        - NO puedes votarte a ti mismo (ID ${voter.id}).
        - DEBES elegir uno de los IDs de la lista de candidatos: ${candidates}.
        
        Respuesta: ÚNICAMENTE el número del ID del jugador seleccionado.
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        let votedId = parseInt(text.match(/\d+/)?.[0] || "1");

        // VALIDACIÓN: Si vota por sí mismo o ID inválido, forzar error para usar fallback
        if (votedId === voter.id || !players.some(p => p.id === votedId)) {
            throw new Error("Voto inválido (auto-voto o ID inexistente)");
        }
        return votedId;
    } catch (error) {
        console.error("Error Gemini Voto:", error);
        const validTargets = players.filter(p => p.id !== voter.id);
        const randomTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
        return randomTarget.id;
    }
};
