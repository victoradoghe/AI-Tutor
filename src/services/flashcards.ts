import type { Folder, FlashcardSet, Flashcard } from '../types';

// LocalStorage keys
const FOLDERS_KEY = 'ai_tutor_folders';
const SETS_KEY = 'ai_tutor_sets';

// Helper to get user-specific data
const getUserKey = (userId: string, baseKey: string) => `${baseKey}_${userId}`;

// ============= FOLDERS =============

export const getFolders = async (userId: string): Promise<Folder[]> => {
    try {
        const key = getUserKey(userId, FOLDERS_KEY);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error('Error fetching folders:', err);
        return [];
    }
};

export const createFolder = async (userId: string, name: string, description: string): Promise<Folder | null> => {
    try {
        const folders = await getFolders(userId);

        const newFolder: Folder = {
            id: `folder-${Date.now()}`,
            name,
            description,
            tags: [],
            setIds: [],
            createdAt: Date.now()
        };

        folders.push(newFolder);

        const key = getUserKey(userId, FOLDERS_KEY);
        localStorage.setItem(key, JSON.stringify(folders));

        return newFolder;
    } catch (err) {
        console.error('Error creating folder:', err);
        return null;
    }
};

export const updateFolder = async (folderId: string, updates: Partial<Folder>): Promise<boolean> => {
    try {
        // Get user email from session
        const sessionEmail = localStorage.getItem('ai_tutor_session');
        if (!sessionEmail) return false;

        // Get full user object from email
        const usersData = localStorage.getItem('ai_tutor_users');
        if (!usersData) return false;

        const users = JSON.parse(usersData);
        const user = users[sessionEmail];
        if (!user) return false;

        const folders = await getFolders(user.id);

        const index = folders.findIndex(f => f.id === folderId);
        if (index === -1) return false;

        folders[index] = { ...folders[index], ...updates };

        const key = getUserKey(user.id, FOLDERS_KEY);
        localStorage.setItem(key, JSON.stringify(folders));

        return true;
    } catch (err) {
        console.error('Error updating folder:', err);
        return false;
    }
};

export const deleteFolder = async (folderId: string): Promise<boolean> => {
    try {
        const sessionUser = localStorage.getItem('ai_tutor_session');
        if (!sessionUser) return false;

        const user = JSON.parse(sessionUser);
        const folders = await getFolders(user.id);

        const filtered = folders.filter(f => f.id !== folderId);

        const key = getUserKey(user.id, FOLDERS_KEY);
        localStorage.setItem(key, JSON.stringify(filtered));

        // Also delete all sets in this folder
        const sets = await getSets(user.id);
        const filteredSets = sets.filter(s => s.folderId !== folderId);
        const setsKey = getUserKey(user.id, SETS_KEY);
        localStorage.setItem(setsKey, JSON.stringify(filteredSets));

        return true;
    } catch (err) {
        console.error('Error deleting folder:', err);
        return false;
    }
};

// ============= SETS =============

export const getSets = async (userId: string): Promise<FlashcardSet[]> => {
    try {
        const key = getUserKey(userId, SETS_KEY);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error('Error fetching sets:', err);
        return [];
    }
};

export const createSet = async (userId: string, set: Partial<FlashcardSet>, folderId?: string): Promise<FlashcardSet | null> => {
    try {
        const sets = await getSets(userId);

        const newSet: FlashcardSet = {
            id: `set-${Date.now()}`,
            title: set.title || 'Untitled Set',
            description: set.description || '',
            folderId: folderId || null,
            cards: set.cards || [],
            createdAt: Date.now()
        };

        sets.push(newSet);

        const key = getUserKey(userId, SETS_KEY);
        localStorage.setItem(key, JSON.stringify(sets));

        return newSet;
    } catch (err) {
        console.error('Error creating set:', err);
        return null;
    }
};

export const updateSet = async (setId: string, updates: Partial<FlashcardSet>): Promise<boolean> => {
    try {
        console.log('🔧 updateSet called with setId:', setId);
        console.log('📦 updates:', updates);

        const sessionEmail = localStorage.getItem('ai_tutor_session');
        console.log('👤 sessionEmail:', sessionEmail ? sessionEmail : 'not found');

        if (!sessionEmail) return false;

        const usersData = localStorage.getItem('ai_tutor_users');
        if (!usersData) {
            console.log('❌ No users data found');
            return false;
        }

        const users = JSON.parse(usersData);
        const user = users[sessionEmail];
        if (!user) {
            console.log('❌ User not found for email:', sessionEmail);
            return false;
        }

        console.log('👤 user.id:', user.id);

        const sets = await getSets(user.id);
        console.log('📚 Total sets:', sets.length);

        const index = sets.findIndex(s => s.id === setId);
        console.log('🔍 Set index:', index);

        if (index === -1) return false;

        sets[index] = { ...sets[index], ...updates };
        console.log('✏️ Updated set:', sets[index]);

        const key = getUserKey(user.id, SETS_KEY);
        localStorage.setItem(key, JSON.stringify(sets));
        console.log('💾 Saved to localStorage with key:', key);

        return true;
    } catch (err) {
        console.error('Error updating set:', err);
        return false;
    }
};

export const deleteSet = async (setId: string): Promise<boolean> => {
    try {
        const sessionEmail = localStorage.getItem('ai_tutor_session');
        if (!sessionEmail) return false;

        const usersData = localStorage.getItem('ai_tutor_users');
        if (!usersData) return false;

        const users = JSON.parse(usersData);
        const user = users[sessionEmail];
        if (!user) return false;

        const sets = await getSets(user.id);

        const updatedSets = sets.filter(s => s.id !== setId);

        const key = getUserKey(user.id, SETS_KEY);
        localStorage.setItem(key, JSON.stringify(updatedSets));

        return true;
    } catch (err) {
        console.error('Error deleting set:', err);
        return false;
    }
};
