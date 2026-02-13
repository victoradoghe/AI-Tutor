import { createClient } from '@supabase/supabase-js';
import type { UserProfile } from '../types';
import { getThemePreference } from './storage';

// These should be defined in your .env file
// VITE_SUPABASE_URL=your-project-url
// VITE_SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Auth and database features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to fetch a complete user profile from the 'profiles' table.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        );

        // Create fetch promise
        const fetchPromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        const { data: profile, error } = await Promise.race([fetchPromise, timeoutPromise]);

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        // Map DB (snake_case) to Frontend (camelCase)
        // Note: 'theme' and 'email' match both, but others need mapping
        const userProfile: UserProfile = {
            id: profile.id, // CRITICAL FIX: Include ID mapping
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            email: profile.email || '',
            avatar: profile.avatar || '',
            level: profile.level || 1,
            xp: profile.xp || 0,
            streak: profile.streak || 1,
            lastActiveDate: profile.last_active_date || new Date().toDateString(),
            learningStyle: profile.learning_style || 'Visual',
            interests: profile.interests || [],
            theme: getThemePreference() || profile.theme || 'light',
            subscription_tier: profile.subscription_tier || 'free',
            subscription_status: profile.subscription_status || 'active',
            lessonsCompleted: profile.lessons_completed || 0,
            quizTotalQuestions: profile.quiz_total_questions || 0,
            quizTotalCorrect: profile.quiz_total_correct || 0,
            usage: profile.usage || { daily_messages: 0, last_reset_date: new Date().toDateString() },
            password: '', // Not stored in profile
        };

        return userProfile;
    } catch (err) {
        console.error('Error or timeout fetching profile:', err);
        return null;
    }
}

/**
 * Helper to update user profile data.
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    // Map Frontend (camelCase) to DB (snake_case)
    const dbUpdates: any = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
    if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
    if (updates.lastActiveDate !== undefined) dbUpdates.last_active_date = updates.lastActiveDate;
    if (updates.learningStyle !== undefined) dbUpdates.learning_style = updates.learningStyle;
    if (updates.interests !== undefined) dbUpdates.interests = updates.interests;
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
    if (updates.subscription_tier !== undefined) dbUpdates.subscription_tier = updates.subscription_tier;
    if (updates.subscription_status !== undefined) dbUpdates.subscription_status = updates.subscription_status;
    if (updates.lessonsCompleted !== undefined) dbUpdates.lessons_completed = updates.lessonsCompleted;
    if (updates.quizTotalQuestions !== undefined) dbUpdates.quiz_total_questions = updates.quizTotalQuestions;
    if (updates.quizTotalCorrect !== undefined) dbUpdates.quiz_total_correct = updates.quizTotalCorrect;
    if (updates.usage !== undefined) dbUpdates.usage = updates.usage;

    const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId);

    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}
