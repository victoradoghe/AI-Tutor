import type { UserProfile, Flashcard, FlashcardSet, Folder, Message, ChatSession } from '../types';
import { LearningStyle } from '../types';

const USERS_KEY = 'ai_tutor_users';
const CURRENT_USER_KEY = 'ai_tutor_session';
const FLASHCARDS_PREFIX = 'ai_tutor_flashcards_'; // Legacy key, kept for migration
const SETS_PREFIX = 'ai_tutor_sets_';
const FOLDERS_PREFIX = 'ai_tutor_folders_';
const CHAT_PREFIX = 'chatHistory_';

// Default user template
export const createDefaultUser = (email: string, firstName: string, lastName: string, password?: string): UserProfile => ({
  id: `user-${Date.now()}`,
  firstName,
  lastName,
  name: `${firstName} ${lastName}`,
  email,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`, // Deterministic avatar
  level: 1,
  xp: 0,
  streak: 1,
  lastActiveDate: new Date().toDateString(), // Initialize with today's date
  learningStyle: LearningStyle.Visual,
  interests: [],
  theme: 'light',
  password, // In a real app, never store plain text passwords
  lessonsCompleted: 0,
  quizTotalQuestions: 0,
  quizTotalCorrect: 0,
  // Subscription
  subscription_tier: 'free',
  subscription_status: 'active',
  usage: {
    daily_messages: 0,
    last_reset_date: new Date().toDateString()
  }
});

// User Persistence
export const saveUser = (user: UserProfile) => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  users[user.email] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUser = (email: string): UserProfile | null => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  return users[email] || null;
};

// Session Management
export const saveSession = (email: string) => {
  localStorage.setItem(CURRENT_USER_KEY, email);
};

export const getSessionUser = (): UserProfile | null => {
  const email = localStorage.getItem(CURRENT_USER_KEY);
  if (!email) return null;
  return getUser(email);
};

export const clearSession = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// --- New Folder & Set System ---

export const saveUserSets = (email: string, sets: FlashcardSet[]) => {
  localStorage.setItem(`${SETS_PREFIX}${email}`, JSON.stringify(sets));
};

export const getUserSets = (email: string): FlashcardSet[] => {
  const setsData = localStorage.getItem(`${SETS_PREFIX}${email}`);

  if (setsData) {
    try {
      return JSON.parse(setsData);
    } catch (e) {
      console.error("Error parsing sets data", e);
      return [];
    }
  }

  // Migration Strategy: Check for legacy flat flashcards
  const legacyData = localStorage.getItem(`${FLASHCARDS_PREFIX}${email}`);
  if (legacyData) {
    try {
      const legacyCards: Flashcard[] = JSON.parse(legacyData);
      if (Array.isArray(legacyCards) && legacyCards.length > 0) {
        const migratedSet: FlashcardSet = {
          id: `set-migrated-${Date.now()}`,
          title: 'General Flashcards',
          description: 'Imported from previous version',
          cards: legacyCards,
          createdAt: Date.now()
        };
        // Save immediately to new structure
        const newSets = [migratedSet];
        saveUserSets(email, newSets);
        return newSets;
      }
    } catch (e) {
      console.error("Migration error", e);
    }
  }

  return [];
};

export const saveUserFolders = (email: string, folders: Folder[]) => {
  localStorage.setItem(`${FOLDERS_PREFIX}${email}`, JSON.stringify(folders));
};

export const getUserFolders = (email: string): Folder[] => {
  const data = localStorage.getItem(`${FOLDERS_PREFIX}${email}`);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error parsing folders", e);
    return [];
  }
};

// Deprecated but kept for reference if needed
export const saveUserFlashcards = (email: string, cards: Flashcard[]) => {
  localStorage.setItem(`${FLASHCARDS_PREFIX}${email}`, JSON.stringify(cards));
};

export const getUserFlashcards = (email: string): Flashcard[] => {
  const data = localStorage.getItem(`${FLASHCARDS_PREFIX}${email}`);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) { return []; }
  }
  return [];
};

// --- Chat History Management (Single Session) ---

// --- Chat History Management (Multi-Session) ---

export const saveChatSession = (email: string, session: ChatSession) => {
  const sessions = getChatSessions(email);
  const index = sessions.findIndex(s => s.id === session.id);

  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session); // Add new sessions to the top
  }

  localStorage.setItem(`${CHAT_PREFIX}${email}`, JSON.stringify(sessions));
};

export const deleteChatSession = (email: string, sessionId: string) => {
  const sessions = getChatSessions(email);
  const newSessions = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem(`${CHAT_PREFIX}${email}`, JSON.stringify(newSessions));
};

export const getChatSessions = (email: string): ChatSession[] => {
  const data = localStorage.getItem(`${CHAT_PREFIX}${email}`);

  if (data) {
    try {
      // Check if data is array of sessions (new format) or array of messages (legacy format)
      const parsed = JSON.parse(data);

      if (Array.isArray(parsed) && parsed.length > 0) {
        // Simple heuristic: check if first item has 'messages' property
        if ('messages' in parsed[0]) {
          return parsed as ChatSession[];
        } else {
          // It's a legacy flat message array, migrate it
          const legacyMessages = parsed as Message[];
          const migratedSession: ChatSession = {
            id: `session-migrated-${Date.now()}`,
            userId: email,
            title: legacyMessages.length > 0 ? (legacyMessages[0].text.slice(0, 30) + '...') : 'Past Conversation',
            messages: legacyMessages,
            createdAt: legacyMessages.length > 0 ? legacyMessages[0].timestamp : Date.now(),
            lastUpdatedAt: Date.now()
          };
          // Save in new format immediately
          const newSessions = [migratedSession];
          localStorage.setItem(`${CHAT_PREFIX}${email}`, JSON.stringify(newSessions));
          return newSessions;
        }
      } else if (Array.isArray(parsed) && parsed.length === 0) {
        return [];
      }
    } catch (e) {
      console.error("Error parsing chat history", e);
      return [];
    }
  }
  return [];
};
// --- Usage Limits ---

export const canSendMessage = (user: UserProfile): boolean => {
  if (user.subscription_tier === 'pro') return true;

  const today = new Date().toDateString();
  if (!user.usage) return true; // Safe default if usage data is missing
  if (user.usage.last_reset_date !== today) return true; // Will reset on increment

  return user.usage.daily_messages < 10;
};

export const incrementMessageCount = async (user: UserProfile, updateUser: (u: UserProfile) => Promise<void>) => {
  if (user.subscription_tier === 'pro') return;

  const today = new Date().toDateString();
  let newUsage = { ...user.usage };

  if (newUsage.last_reset_date !== today) {
    newUsage = {
      daily_messages: 1,
      last_reset_date: today
    };
  } else {
    newUsage.daily_messages += 1;
  }

  const updatedUser = { ...user, usage: newUsage };
  await updateUser(updatedUser);
};

export const updateUserStreak = (user: UserProfile): UserProfile => {
  const today = new Date().toDateString();

  if (user.lastActiveDate === today) {
    // Already updated today
    return user;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (user.lastActiveDate === yesterdayStr) {
    // Consecutive day - increment streak
    return {
      ...user,
      streak: user.streak + 1,
      lastActiveDate: today
    };
  } else {
    // Streak broken - reset to 1
    return {
      ...user,
      streak: 1,
      lastActiveDate: today
    };
  }
};

export const saveThemePreference = (theme: 'light' | 'dark') => {
  localStorage.setItem('ai_tutor_theme', theme);
};

export const getThemePreference = (): 'light' | 'dark' | null => {
  return localStorage.getItem('ai_tutor_theme') as 'light' | 'dark' | null;
};
