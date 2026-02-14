import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
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

// Initialize Cerebras (via OpenAI SDK)
const apiKey = process.env.API_KEY;

if (!apiKey || apiKey === 'PASTE_YOUR_GEMINI_KEY_HERE') {
  console.error("CRITICAL ERROR: API_KEY is missing or invalid.");
  console.error("Please open 'server/.env' and paste your valid API key.");
  process.exit(1);
}

console.log(`DEBUG: API Key loaded (Length: ${apiKey.length})`);

// Initialize OpenAI client pointing to Cerebras
const client = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api.cerebras.ai/v1",
});

// USE CEREBRAS MODEL
const MODEL_NAME = 'llama-3.3-70b';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// --- Helper: Retry Logic ---
const callWithRetry = async (fn, retries = 1, delay = 2000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error.status === 429 || error.status === 503)) {
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

    // Convert history to OpenAI format
    const messages = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts[0].text
    }));

    // Add current message
    messages.push({ role: 'user', content: message });

    // Add system prompt
    messages.unshift({
      role: "system",
      content: `You are a friendly, encouraging, and highly knowledgeable AI Tutor. 
      
      STANDARD BEHAVIOR:
      For general questions, explain concepts clearly, concisely, and with a fun tone. Use emojis occasionally.
      If asked who created you, answer: "I was Created by Victor Adoghe, a frontend, game developer and SEO optimizer".

      CODE GENERATION BEHAVIOR:
      If the user asks to write, generate, or show code:
      1. Output ONLY the code wrapped in triple backticks (e.g., \`\`\`python ... \`\`\`).
      2. Do NOT provide conversational text before or after the code block.
      3. Include necessary imports.`
    });

    const completion = await callWithRetry(() => client.chat.completions.create({
      messages: messages,
      model: MODEL_NAME,
      temperature: 0.7,
      max_tokens: 1024,
    }));

    const aiText = completion.choices[0]?.message?.content || "I'm having trouble thinking right now.";
    res.json({ text: aiText });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Failed to generate response", details: error.message });
  }
});

// 2. Generate Flashcards
app.post('/api/flashcards', async (req, res) => {
  try {
    const { topic, count } = req.body;
    const prompt = `Create ${count || 5} study flashcards about "${topic}".
    Return ONLY a JSON object with this structure:
    {
      "cards": [
        { "front": "Question/Term", "back": "Answer/Definition" }
      ]
    }`;

    const completion = await callWithRetry(() => client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: MODEL_NAME,
      response_format: { type: "json_object" },
      temperature: 0.7,
    }));

    const jsonString = completion.choices[0]?.message?.content || '{}';
    const json = JSON.parse(jsonString);
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

    const completion = await callWithRetry(() => client.chat.completions.create({
      messages: [
        { role: "user", content: `Provide a clear, concise definition or answer for the flashcard front: "${front}". Keep it under 30 words suitable for studying.` }
      ],
      model: MODEL_NAME,
      temperature: 0.7,
    }));

    res.json({ text: completion.choices[0]?.message?.content?.trim() });
  } catch (error) {
    console.error("Card Answer Error:", error);
    res.status(500).json({ error: "Failed to generate answer", details: error.message });
  }
});

// 4. Generate Quiz
app.post('/api/quiz', async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const prompt = `Create a ${difficulty} level multiple-choice quiz with 5 questions about "${topic}".
    Return ONLY a JSON object with this structure:
    {
      "questions": [
        {
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0, // 0-3
          "explanation": "Explanation of correct answer"
        }
      ]
    }`;

    const completion = await callWithRetry(() => client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: MODEL_NAME,
      response_format: { type: "json_object" },
      temperature: 0.7,
    }));

    const jsonString = completion.choices[0]?.message?.content || '{}';
    const json = JSON.parse(jsonString);
    res.json(json);
  } catch (error) {
    console.error("Quiz Error:", error);
    res.status(500).json({ error: "Failed to generate quiz", details: error.message });
  }
});

// Export for Vercel
export default app;

// Only listen if running locally (not in Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (Cerebras - Model: ${MODEL_NAME})`);
    console.log("Health check: Server is staying alive...");
    console.log("API Key loaded successfully.");
  });
}