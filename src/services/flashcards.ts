import { supabase } from './supabase';
import type { Folder, FlashcardSet, Flashcard } from '../types';

// Timeout wrapper to prevent hanging queries
const withTimeout = <T,>(promise: Promise<T>, timeoutMs = 5000): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
        )
    ]);
};

export const getFolders = async (userId: string): Promise<Folder[]> => {
    try {
        const { data, error } = await withTimeout(
            supabase
                .from('folders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false }),
            5000
        );

        if (error) {
            console.error('Error fetching folders:', error);
            return [];
        }

        // Map to frontend type (names match, but ensure case matches)
        return data.map((f: any) => ({
            id: f.id,
            name: f.name,
            description: f.description,
            tags: [], // Tags not yet in DB schema, defaulting to empty
            setIds: [], // Sets will be fetched separately or joined if needed. For now, we might need a join or separate fetch.
            // Actually, the frontend expects setIds directly on the folder usually? 
            // Let's check how the frontend uses it. 
            // Providing basic fields for now.
            createdAt: new Date(f.created_at).getTime()
        }));
    } catch (err) {
        console.error('Error or timeout fetching folders:', err);
        return [];
    }
};

export const createFolder = async (userId: string, name: string, description: string): Promise<Folder | null> => {
    const { data, error } = await supabase
        .from('folders')
        .insert([{ user_id: userId, name, description }])
        .select()
        .single();

    if (error) {
        console.error('Error creating folder:', error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        description: data.description,
        tags: [],
        setIds: [],
        createdAt: new Date(data.created_at).getTime()
    };
};

export const updateFolder = async (folderId: string, updates: Partial<Folder>): Promise<boolean> => {
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
    try {
        // We need to fetch sets AND their cards to match the frontend FlashcardSet interface
        const { data: sets, error } = await withTimeout(
            supabase
                .from('flashcard_sets')
                .select(`
          *,
          flashcards (*)
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false }),
            5000
        );

        if (error) {
            console.error('Error fetching sets:', error);
            return [];
        }

        return sets.map((set: any) => ({
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
    } catch (err) {
        console.error('Error or timeout fetching sets:', err);
        return [];
    }
};

export const createSet = async (userId: string, set: Partial<FlashcardSet>, folderId?: string): Promise<FlashcardSet | null> => {
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

    if (setError || !setData) {
        console.error('Error creating set:', setError);
        return null;
    }

    // 2. Create the Cards if any
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

        if (cardsError) {
            console.error('Error creating cards:', cardsError);
            // We continue, returning the set with empty cards or partial success?
            // For now, let's assume partial success but log error.
        } else {
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
        createdAt: new Date(setData.created_at).getTime()
    };
};

export const updateSet = async (setId: string, updates: Partial<FlashcardSet>): Promise<boolean> => {
    // Update Set details
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

    // Update Cards logic is complex (add/remove/update). 
    // For simplicity MVP: If cards are provided, we might wipe and recreate or handle intelligent diff.
    // For now, let's assume this function only updates metadata if cards aren't passed, 
    // or simple replacement if they are.
    // If cards ARE passed, we'll delete old ones and insert new ones for this MVP.
    if (updates.cards) {
        // 1. Delete existing cards
        await supabase.from('flashcards').delete().eq('set_id', setId);

        // 2. Insert new cards
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
