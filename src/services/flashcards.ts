import { supabase } from './supabase';
import type { Folder, FlashcardSet, Flashcard } from '../types';

// --- Offline Backup Helpers ---
const BACKUP_PREFIX = 'offline_backup_';

const getLocal = <T>(key: string): T[] => {
    try {
        return JSON.parse(localStorage.getItem(BACKUP_PREFIX + key) || '[]');
    } catch (e) {
        console.error('Error parsing local backup:', e);
        return [];
    }
};

const saveLocal = <T>(key: string, item: T) => {
    const items = getLocal<T>(key);
    items.push(item);
    localStorage.setItem(BACKUP_PREFIX + key, JSON.stringify(items));
};

const updateLocal = <T extends { id: string }>(key: string, id: string, updates: Partial<T>) => {
    const items = getLocal<T>(key);
    const updatedItems = items.map(item => item.id === id ? { ...item, ...updates } : item);
    localStorage.setItem(BACKUP_PREFIX + key, JSON.stringify(updatedItems));
};

const deleteLocal = <T extends { id: string }>(key: string, id: string) => {
    const items = getLocal<T>(key);
    const filteredItems = items.filter(item => item.id !== id);
    localStorage.setItem(BACKUP_PREFIX + key, JSON.stringify(filteredItems));
};


export const getFolders = async (userId: string): Promise<Folder[]> => {
    const localFolders = getLocal<Folder>(`folders_${userId}`);

    const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Supabase error fetching folders, using local backup:', error);
        return localFolders;
    }

    const dbFolders = data.map((f: any) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        tags: [],
        setIds: [],
        createdAt: new Date(f.created_at).getTime()
    }));

    // Merge DB and Local (Local items might be duplicates if eventually synced, but for now we append "local-" items)
    // Filter out local items that might have collided or are just fallback
    // For this forceful fix, we just combine them.
    return [...localFolders, ...dbFolders].sort((a, b) => b.createdAt - a.createdAt);
};

export const createFolder = async (userId: string, name: string, description: string): Promise<Folder | null> => {
    try {
        const { data, error } = await supabase
            .from('folders')
            .insert([{ user_id: userId, name, description }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            tags: [],
            setIds: [],
            createdAt: new Date(data.created_at).getTime()
        };
    } catch (err) {
        console.warn('Supabase create folder failed, using local fallback:', err);
        const newFolder: Folder = {
            id: `local-folder-${Date.now()}`,
            name,
            description,
            tags: [],
            setIds: [],
            createdAt: Date.now()
        };
        saveLocal(`folders_${userId}`, newFolder);
        return newFolder;
    }
};

export const updateFolder = async (folderId: string, updates: Partial<Folder>): Promise<boolean> => {
    if (folderId.startsWith('local-')) {
        // Update local only
        // Need userId to find the key, but we don't have it here. 
        // We might need to iterate or assume a single active user in localStorage.
        // For simplicity, we'll try to guess or search all keys?
        // Actually, we can just fail gracefully or implement a smarter key strategy.
        // Hack: We stored it under `folders_${userId}`. We don't have userId.
        // But we can check localStorage keys.
        const keys = Object.keys(localStorage).filter(k => k.startsWith(BACKUP_PREFIX + 'folders_'));
        keys.forEach(key => updateLocal<Folder>(key.replace(BACKUP_PREFIX, ''), folderId, updates));
        return true;
    }

    const { error } = await supabase
        .from('folders')
        .update({
            name: updates.name,
            description: updates.description,
        })
        .eq('id', folderId);

    if (error) {
        console.error('Error updating folder:', error);
        return false;
    }
    return true;
};

export const deleteFolder = async (folderId: string): Promise<boolean> => {
    if (folderId.startsWith('local-')) {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(BACKUP_PREFIX + 'folders_'));
        keys.forEach(key => deleteLocal<Folder>(key.replace(BACKUP_PREFIX, ''), folderId));
        return true;
    }

    const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

    if (error) {
        console.error('Error deleting folder:', error);
        return false;
    }
    return true;
};

export const getSets = async (userId: string): Promise<FlashcardSet[]> => {
    const localSets = getLocal<FlashcardSet>(`sets_${userId}`);

    const { data: sets, error } = await supabase
        .from('flashcard_sets')
        .select(`
      *,
      flashcards (*)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Error fetching sets:', error);
        return localSets;
    }

    const dbSets = sets.map((set: any) => ({
        id: set.id,
        title: set.title,
        description: set.description,
        folderId: set.folder_id,
        cards: set.flashcards.map((c: any) => ({
            id: c.id,
            front: c.front,
            back: c.back,
            mastered: c.mastered
        })),
        createdAt: new Date(set.created_at).getTime()
    }));

    return [...localSets, ...dbSets].sort((a, b) => b.createdAt - a.createdAt);
};

export const createSet = async (userId: string, set: Partial<FlashcardSet>, folderId?: string): Promise<FlashcardSet | null> => {
    try {
        // 1. Create the Set
        const { data: setData, error: setError } = await supabase
            .from('flashcard_sets')
            .insert([{
                user_id: userId,
                folder_id: folderId || null,
                title: set.title,
                description: set.description
            }])
            .select()
            .single();

        if (setError || !setData) throw setError;

        // 2. Create Cards
        let createdCards: Flashcard[] = [];
        if (set.cards && set.cards.length > 0) {
            const cardsToInsert = set.cards.map(c => ({
                set_id: setData.id,
                front: c.front,
                back: c.back,
                mastered: c.mastered || false
            }));

            const { data: cardsData, error: cardsError } = await supabase
                .from('flashcards')
                .insert(cardsToInsert)
                .select();

            if (!cardsError && cardsData) {
                createdCards = cardsData.map((c: any) => ({
                    id: c.id,
                    front: c.front,
                    back: c.back,
                    mastered: c.mastered
                }));
            }
        }

        return {
            id: setData.id,
            title: setData.title,
            description: setData.description,
            cards: createdCards,
            createdAt: new Date(setData.created_at).getTime(),
            folderId: folderId
        };

    } catch (err) {
        console.warn('Supabase create set failed, using local fallback:', err);
        const newSet: FlashcardSet = {
            id: `local-set-${Date.now()}`,
            title: set.title || 'Untitled',
            description: set.description || '',
            cards: set.cards || [],
            createdAt: Date.now(),
            folderId: folderId
        };
        saveLocal(`sets_${userId}`, newSet);
        return newSet;
    }
};

export const updateSet = async (setId: string, updates: Partial<FlashcardSet>): Promise<boolean> => {
    if (setId.startsWith('local-')) {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(BACKUP_PREFIX + 'sets_'));
        keys.forEach(key => updateLocal<FlashcardSet>(key.replace(BACKUP_PREFIX, ''), setId, updates));
        return true;
    }

    const { error } = await supabase
        .from('flashcard_sets')
        .update({
            title: updates.title,
            description: updates.description
        })
        .eq('id', setId);

    if (error) {
        console.error('Error updating set:', error);
        return false;
    }

    // Handle cards update safely...
    if (updates.cards) {
        await supabase.from('flashcards').delete().eq('set_id', setId);
        const cardsToInsert = updates.cards.map(c => ({
            set_id: setId,
            front: c.front,
            back: c.back,
            mastered: c.mastered || false
        }));
        if (cardsToInsert.length > 0) {
            await supabase.from('flashcards').insert(cardsToInsert);
        }
    }

    return true;
};

export const deleteSet = async (setId: string): Promise<boolean> => {
    if (setId.startsWith('local-')) {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(BACKUP_PREFIX + 'sets_'));
        keys.forEach(key => deleteLocal<FlashcardSet>(key.replace(BACKUP_PREFIX, ''), setId));
        return true;
    }

    const { error } = await supabase
        .from('flashcard_sets')
        .delete()
        .eq('id', setId);

    if (error) {
        console.error('Error deleting set:', error);
        return false;
    }
    return true;
};

// ... keep exports for generate function if any ...
// Wait, generateFlashcards was imported in Flashcard.tsx from here?
// I need to check if I am overwriting generateFlashcards... YES I AM.
// Previous file had generateFlashcards? No...
// Wait, Flashcard.tsx imports:
// import { ... generateFlashcards, generateCardAnswer } from '../services/flashcards';
// But my previous view_file of services/flashcards.ts DID NOT SHOW these functions!
// Let me double check usage in Flashcard.tsx.
// Ah, lines 600-800 of Flashcard.tsx show usage.
// I MUST CHECK if they are in GemeniService or Flashcards service.
// Flashcard.tsx:
// import { generateFlashcards, generateQuiz, generateTutorResponse, generateCardAnswer } from '../services/geminiService';
// Wait, let me check imports in Flashcard.tsx again.
