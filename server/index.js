
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Try loading from server/.env (standard case)
dotenv.config({ path: path.join(__dirname, '.env') });

// 2. If not found, try loading from root .env (fallback case)
if (!process.env.API_KEY) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini
const apiKey = process.env.API_KEY;

if (!apiKey || apiKey === 'PASTE_YOUR_GEMINI_KEY_HERE') {
  console.error("CRITICAL ERROR: API_KEY is missing or invalid.");
  console.error("Please open 'server/.env' and paste your actual Gemini API key.");
}

// Initialize the client
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// USE CORRECT MODEL
const MODEL_NAME = 'gemini-2.0-flash-exp';
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });

// --- Helper: Retry Logic ---
const callWithRetry = async (fn, retries = 1, delay = 2000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error.status === 429 || error.status === 503 || error.message?.includes('429'))) {
      console.log(`Rate limited. Retrying in ${delay / 1000}s... (Attempts left: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// --- Routes ---

// 1. Chat / Tutor
app.post('/api/chat', async (req, res) => {
  try {
    const { history, message } = req.body;

    const contents = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.parts[0].text }]
    }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await callWithRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: `You are a friendly, encouraging, and highly knowledgeable AI Tutor. 
        
        STANDARD BEHAVIOR:
        For general questions, explain concepts clearly, concisely, and with a fun tone. Use emojis occasionally.
        If asked who created you, answer: "I was Created by Victor Adoghe, a frontend, game developer and SEO optimizer".

        CODE GENERATION BEHAVIOR:
        If the user asks to write, generate, or show code:
        1. Output ONLY the code wrapped in triple backticks (e.g., \`\`\`python ... \`\`\`).
        2. Do NOT provide conversational text before or after the code block.
        3. Include necessary imports.`,
      }
    }));

    res.json({ text: response.text });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Failed to generate response", details: error.message });
  }
});

// 2. Generate Flashcards
app.post('/api/flashcards', async (req, res) => {
  try {
    const { topic, count } = req.body;
    const prompt = `Create ${count || 5} study flashcards about "${topic}".`;

    const response = await callWithRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                },
                required: ['front', 'back']
              }
            }
          },
          required: ['cards']
        }
      }
    }));

    const json = JSON.parse(response.text || '{}');
    res.json(json);
  } catch (error) {
    console.error("Flashcards Error:", error);
    res.status(500).json({ error: "Failed to generate flashcards", details: error.message });
  }
});

// 3. Generate Answer for a Card
app.post('/api/card-answer', async (req, res) => {
  try {
    const { front } = req.body;
    const response = await callWithRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Provide a clear, concise definition or answer for the flashcard front: "${front}". Keep it under 30 words suitable for studying.`,
    }));

    res.json({ text: response.text?.trim() });
  } catch (error) {
    console.error("Card Answer Error:", error);
    res.status(500).json({ error: "Failed to generate answer", details: error.message });
  }
});

// 4. Generate Quiz
app.post('/api/quiz', async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const prompt = `Create a ${difficulty} level multiple-choice quiz with 5 questions about "${topic}".`;

    const response = await callWithRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctIndex', 'explanation']
              }
            }
          },
          required: ['questions']
        }
      }
    }));

    const json = JSON.parse(response.text || '{}');
    res.json(json);
  } catch (error) {
    console.error("Quiz Error:", error);
    res.status(500).json({ error: "Failed to generate quiz", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (v2 - Fixed Model: ${MODEL_NAME})`);
  console.log("Health check: Server is staying alive...");

  if (apiKey && apiKey !== 'PASTE_YOUR_GEMINI_KEY_HERE') {
    console.log("API Key loaded successfully.");
  } else {
    console.log("WARNING: API Key not set.");
  }
});