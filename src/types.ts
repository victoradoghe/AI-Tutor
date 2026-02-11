export enum Difficulty {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export enum LearningStyle {
  Visual = 'Visual',
  Auditory = 'Auditory',
  Kinesthetic = 'Kinesthetic',
}

export interface UsageTracking {
  daily_messages: number;
  last_reset_date: string; // YYYY-MM-DD
}

export interface UserProfile {
  id: string; // UUID from Supabase Auth
  firstName: string;
  lastName: string;
  name: string; // Full name for display
  email: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  lastActiveDate?: string; // Tracks the last date the user opened the app
  learningStyle: LearningStyle;
  interests: string[];
  theme: 'light' | 'dark';
  password?: string;

  // Subscription
  subscription_tier: 'free' | 'pro';
  subscription_status: 'active' | 'inactive' | 'past_due' | 'canceled';

  // Usage tracking for limits
  usage: UsageTracking;

  // Stats
  lessonsCompleted: number;
  quizTotalQuestions: number;
  quizTotalCorrect: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isAudio?: boolean; // If true, this message was spoken
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  lastUpdatedAt: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

export interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
  createdAt: number;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  tags: string[];
  setIds: string[]; // Ordered list of Set IDs belonging to this folder
  createdAt: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  questions: QuizQuestion[];
  completed: boolean;
  score?: number;
}