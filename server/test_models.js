
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.API_KEY) {
    dotenv.config({ path: path.join(__dirname, '../.env') });
}

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });

async function listModels() {
    try {
        const response = await ai.models.list();
        const models = [];
        for await (const model of response) {
            models.push(model.name);
        }
        fs.writeFileSync(path.join(__dirname, 'all_models.txt'), models.join('\n'));
        console.log("Written models to server/all_models.txt");
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
