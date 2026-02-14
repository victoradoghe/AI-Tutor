import type { Flashcard, QuizQuestion } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';



export const generateTutorResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  userMessage: string
): Promise<string> => {
  // Subscription check removed - unlimited messages
  // Subscription check removed - unlimited messages


  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, message: userMessage }),
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    return data.text || "I'm having a little trouble thinking right now.";
  } catch (error) {
    console.error("API Chat Error:", error);
    return "I'm currently offline or unable to reach the server. Please ensure the backend is running.";
  }
};

export const generateFlashcards = async (topic: string, count: number = 5): Promise<Flashcard[]> => {
  try {
    const response = await fetch(`${API_URL}/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, count }),
    });

    if (!response.ok) return [];

    const json = await response.json();
    if (!json.cards || !Array.isArray(json.cards)) return [];

    return json.cards.map((item: any, index: number) => ({
      id: `fc-${Date.now()}-${index}`,
      front: item.front,
      back: item.back,
      mastered: false,
    }));
  } catch (error) {
    console.error("API Flashcard Error:", error);
    return [];
  }
};

export const generateCardAnswer = async (front: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/card-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front }),
    });

    if (!response.ok) return "Could not generate answer.";

    const data = await response.json();
    return data.text || "Could not generate answer.";
  } catch (error) {
    console.error("API Card Answer Error:", error);
    return "";
  }
};

export const generateQuiz = async (topic: string, difficulty: string): Promise<QuizQuestion[]> => {
  try {
    const response = await fetch(`${API_URL}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, difficulty }),
    });

    if (!response.ok) return [];

    const json = await response.json();
    if (!json.questions || !Array.isArray(json.questions)) return [];

    return json.questions.map((item: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      question: item.question,
      options: item.options,
      correctIndex: item.correctIndex,
      explanation: item.explanation
    }));
  } catch (error) {
    console.error("API Quiz Error:", error);
    return [];
  }
};
