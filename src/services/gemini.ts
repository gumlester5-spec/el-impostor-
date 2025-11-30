// src/services/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Player, Clue } from "../types";

// Iniciamos la API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const generateAiClue = async (
    player: Player,
    secretWord: string,
    history: Clue[]
): Promise<string> => {

    // 1. Preparamos el historial de texto para que la IA sepa qué han dicho antes
    const conversationHistory = history.map(h => `- Jugador ${h.playerId} dijo: "${h.text}"`).join("\n");

    // 2. Definimos la personalidad según el personaje
    let personality = "";
    if (player.name === "Julián") {
        personality = "Eres Julián, un panadero tierno, amable y un poco tímido. Hablas de forma dulce y suave.";
    } else if (player.name === "Sofía") {
        personality = "Eres Sofía, una artista urbana, cool y moderna. Hablas con confianza, estilo y energía.";
    }

    // 3. CONSTRUCCIÓN DEL PROMPT (La parte más importante)
    let prompt = "";

    if (player.role === 'INOCENTE') {
        // --- LÓGICA DE INOCENTE ---
        // Sabe la palabra y debe dar una pista sutil.
        prompt = `
      ${personality}
      Estás jugando al juego "El Impostor".
      La palabra secreta es: "${secretWord}".
      
      Historial de pistas dichas hasta ahora:
      ${conversationHistory}

      Tu misión: Di una pista MUY BREVE (máximo 10 palabras) sobre la palabra secreta.
      Reglas:
      1. No digas la palabra secreta.
      2. No seas demasiado obvio, pero tampoco mientas.
      3. Mantén tu personalidad.
      
      Respuesta (solo la pista):
    `;
    } else {
        // --- LÓGICA DE IMPOSTOR ---
        // NO sabe la palabra. Debe fingir basándose en el historial.
        prompt = `
      ${personality}
      Estás jugando al juego "El Impostor".
      ¡TÚ ERES EL IMPOSTOR!
      NO SABES cuál es la palabra secreta.
      
      Historial de pistas dichas por los otros (úsalo para deducir de qué hablan):
      ${conversationHistory}

      Tu misión: Di una pista MUY BREVE (máximo 10 palabras) que suene convincente para encajar con lo que han dicho los demás.
      Reglas:
      1. Trata de ser vago o genérico para que no te descubran.
      2. Si no hay historial, di algo muy general que aplique a muchas cosas.
      3. ¡Miente con confianza!
      
      Respuesta (solo la pista):
    `;
    }

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Error conectando con Gemini:", error);
        return "Mmm... estoy pensando..."; // Respuesta por defecto si falla
    }
};
