
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server/.env') });

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-8b',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-pro'
];

async function test() {
    console.log("--- START PROBE ---");
    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying ${modelName}...`);
            await ai.models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
            });
            console.log(`[SUCCESS] ${modelName} is working!`);
        } catch (e) {
            // Extract status code if available
            let status = "Unknown";
            if (e.status) status = e.status;
            else if (e.response && e.response.status) status = e.response.status;
            else if (e.toString().includes("404")) status = "404 (Not Found)";
            else if (e.toString().includes("429")) status = "429 (Rate Limit)";
            else if (e.toString().includes("503")) status = "503 (Overloaded)";

            console.log(`[FAILED] ${modelName} - Status: ${status}`);
            // console.log(`   Msg: ${e.message?.substring(0, 100)}`);
        }
    }
    console.log("--- END PROBE ---");
}

test();
