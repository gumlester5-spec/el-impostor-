# 🕵️‍♂️ El Impostor - Juego de Deducción Social con IA

¡Bienvenido a **El Impostor**! Un juego de engaño, astucia y deducción donde jugarás contra dos Inteligencias Artificiales (Julián y Sofía).

## � Reglamento Oficial

### 1. El Objetivo
El objetivo cambia dependiendo del rol secreto que te toque al inicio de la partida:

*   **😇 Si eres Inocente (Hay 2):** Tu misión es identificar quién de los otros dos jugadores es el impostor y convencer al otro inocente de votar por él.
*   **😈 Si eres el Impostor (Hay 1):** Tu misión es pasar desapercibido, fingir que sabes la palabra secreta y lograr que expulsen a un inocente o que haya un empate.

### 2. La Preparación
*   **Jugadores:** 3 participantes (Tú + 2 IAs).
*   **La Palabra Secreta:** Al inicio, el sistema elige una palabra al azar (ej. "Pizza", "Guitarra").
*   **Roles:**
    *   Los **Inocentes** ven la palabra secreta en su pantalla.
    *   El **Impostor** ve un mensaje de alerta: "🤫 ERES EL IMPOSTOR" y **no ve la palabra**.

### 3. Desarrollo del Juego

#### Fase 1: Revelación
Tienes 4 segundos para memorizar tu rol y, si eres inocente, la palabra secreta.

#### Fase 2: Rondas de Pistas (El Interrogatorio)
El juego consta de 2 Rondas. En tu turno, debes escribir una pista relacionada con la palabra secreta.

*   **🚫 Regla de Oro:** No puedes decir la palabra secreta.
*   **Estrategia del Inocente:** Da una pista clara para el otro inocente, pero sutil para que el impostor no adivine la palabra.
*   **Estrategia del Impostor:** Lee las pistas anteriores, deduce el tema y di algo vago o genérico que encaje para no levantar sospechas.

#### Fase 3: La Votación
Al terminar las rondas, comienza la votación. Cada jugador vota por quien cree que es el Impostor.

### 4. Condiciones de Victoria

*   **🎉 Ganan los Inocentes:** Si la mayoría (2 votos) expulsa al Impostor.
*   **😈 Gana el Impostor:** Si logran expulsar a un inocente o si nadie sospecha de él.
*   **⚖️ Empate:** Si cada jugador recibe 1 voto. Nadie es expulsado.

---

## 🛠️ Configuración Técnica (Para Desarrolladores)

Este proyecto utiliza **React + Vite** y la **API de Google Gemini**.

### Requisitos
Para jugar localmente o desplegar, necesitas una API Key de Google Gemini.

1.  Crea un archivo `.env` en la raíz.
2.  Agrega tu clave: `VITE_GEMINI_API_KEY=tu_api_key_aqui`
3.  Instala y corre:
    ```bash
    npm install
    npm run dev
    ```
