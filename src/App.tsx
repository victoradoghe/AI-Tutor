import { useState, useEffect } from 'react';
import './App.css';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import type { UserProfile } from './types';
import { getSessionUser, saveUser, updateUserStreak } from './services/storage';
import { getUserProfile, updateUserProfile } from './services/supabase';
import { supabase } from './services/supabase';

// Lazy load heavy components
import { lazy, Suspense } from 'react';
const Tutor = lazy(() => import('./components/Tutor'));
const Flashcard = lazy(() => import('./components/Flashcard'));
const Quiz = lazy(() => import('./components/Quiz'));
const Profile = lazy(() => import('./components/Profile'));

function App() {
    const [currentTab, setCurrentTab] = useState('landing');
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check for existing session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const profile = await getUserProfile(session.user.id);
                if (profile) {
                    setUser(profile);
                    setCurrentTab('dashboard');
                }
            } else {
                // Fallback to localStorage
                const sessionUser = getSessionUser();
                if (sessionUser) {
                    setUser(sessionUser);
                    setCurrentTab('dashboard');
                }
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const profile = await getUserProfile(session.user.id);
                if (profile) {
                    setUser(profile);
                    setCurrentTab('dashboard');
                }
            } else {
                setUser(null);
                setCurrentTab('landing');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (user) {
            const updatedUser = updateUserStreak(user);
            if (updatedUser.streak !== user.streak) {
                handleUpdateUser(updatedUser);
            }
        }
    }, [user?.id]);

    // Apply theme to HTML element
    useEffect(() => {
        const theme = user?.theme || 'light';
        const htmlElement = document.documentElement;

        if (theme === 'dark') {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    }, [user?.theme]);

    const handleLogin = (loggedInUser: UserProfile) => {
        setUser(loggedInUser);
        saveUser(loggedInUser);
        setCurrentTab('dashboard');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setCurrentTab('landing');
    };

    const handleUpdateUser = async (updatedUser: UserProfile) => {
        setUser(updatedUser);
        saveUser(updatedUser);

        if (updatedUser.id) {
            try {
                await updateUserProfile(updatedUser.id, updatedUser);
            } catch (error) {
                console.error('Failed to update user profile in Supabase:', error);
            }
        }
    };

    const handleQuizComplete = (score: number, total: number) => {
        if (!user) return;

        const xpGained = score * 10;
        // Simple level logic: Level 1 -> 0-999 XP, Level 2 -> 1000-1999 XP, etc.
        const newLevel = Math.floor(((user.xp || 0) + xpGained) / 1000) + 1;

        const updatedUser: UserProfile = {
            ...user,
            quizTotalQuestions: (user.quizTotalQuestions || 0) + total,
            quizTotalCorrect: (user.quizTotalCorrect || 0) + score,
            xp: (user.xp || 0) + xpGained,
            level: newLevel > user.level ? newLevel : user.level
        };

        handleUpdateUser(updatedUser);
    };

    // Landing page
    if (currentTab === 'landing' && !user) {
        return <LandingPage onGetStarted={() => setCurrentTab('auth')} />;
    }

    // Auth page
    if (currentTab === 'auth' && !user) {
        return <Auth onLogin={handleLogin} />;
    }

    // Main app
    if (!user) {
        return <LandingPage onGetStarted={() => setCurrentTab('auth')} />;
    }

    const LoadingFallback = () => (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <SubscriptionProvider user={user} onUpdateUser={handleUpdateUser}>
            <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-150">
                <Navigation
                    currentTab={currentTab}
                    setTab={setCurrentTab}
                    isMobile={isMobile}
                    onLogout={handleLogout}
                />

                <main className={`flex-1 ${isMobile ? 'pb-24' : 'ml-72'} transition-all duration-300`}>
                    <Suspense fallback={<LoadingFallback />}>
                        {currentTab === 'dashboard' && <Dashboard user={user} setTab={setCurrentTab} />}
                        {currentTab === 'tutor' && <Tutor userId={user.id} userEmail={user.email} />}
                        {currentTab === 'flashcards' && <Flashcard userId={user.id} />}
                        {currentTab === 'quiz' && <Quiz onQuizComplete={handleQuizComplete} />}
                        {currentTab === 'profile' && <Profile user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />}
                    </Suspense>
                </main>
            </div>
        </SubscriptionProvider>
    );
}

export default App;
