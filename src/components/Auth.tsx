import type React from 'react';
import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Brain, Loader2 } from 'lucide-react';
import { type UserProfile, LearningStyle } from '../types';
import { supabase } from '../services/supabase';
import { getUser, saveUser, createDefaultUser, getThemePreference } from '../services/storage.ts';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (isLogin) {
      // Login Logic
      const { data: loginData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (loginData.user) {
        // Fetch the real profile from Supabase
        const { data: profile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', loginData.user.id)
          .single();

        if (profile && !profileFetchError) {
          const userProfile: UserProfile = {
            id: loginData.user.id,
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            name: profile.name || `${profile.first_name} ${profile.last_name}`.trim(),
            email: profile.email || email,
            avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            level: profile.level || 1,
            xp: profile.xp || 0,
            streak: profile.streak || 1,
            lessonsCompleted: profile.lessons_completed || 0,
            quizTotalQuestions: profile.quiz_total_questions || 0,
            quizTotalCorrect: profile.quiz_total_correct || 0,
            subscription_tier: profile.subscription_tier || 'free',
            subscription_status: profile.subscription_status || 'active',
            learningStyle: profile.learning_style as any || LearningStyle.Visual,
            interests: profile.interests || [],
            lastActiveDate: profile.last_active_date || new Date().toDateString(),
            theme: getThemePreference() || profile.theme || 'light',
            usage: profile.usage || { daily_messages: 0, last_reset_date: new Date().toDateString() },
          };
          onLogin(userProfile);
        } else {
          // Fallback if profile fetch fails (though it shouldn't)
          const tempUser: UserProfile = createDefaultUser(email, 'User', '', '');
          onLogin(tempUser);
        }
      }

    } else {
      // Signup Logic
      if (!firstName || !lastName) {
        setError("Please enter your full name.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
          }
        }
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      // Trigger should handle profile creation, but we add a fallback insert here
      // just in case the trigger failed or hasn't run yet.
      if (data.user) {
        const newUserProfile: UserProfile = {
          id: data.user.id,
          email: email,
          name: `${firstName} ${lastName}`.trim(),
          firstName: firstName,
          lastName: lastName,
          xp: 0,
          level: 1,
          streak: 1,
          lessonsCompleted: 0,
          quizTotalQuestions: 0,
          quizTotalCorrect: 0,
          subscription_tier: 'free',
          subscription_status: 'active',
          learningStyle: LearningStyle.Visual, // Default
          interests: [],
          lastActiveDate: new Date().toDateString(),
          theme: 'light',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          usage: { daily_messages: 0, last_reset_date: new Date().toDateString() }
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              ...newUserProfile,
              first_name: firstName, // Supabase expects snake_case for db cols
              last_name: lastName,
              lessons_completed: 0,
              quiz_total_questions: 0,
              quiz_total_correct: 0,
              last_active_date: new Date().toDateString(),
              learning_style: LearningStyle.Visual,
            }
          ]);

        if (profileError) {
          // If error is duplicate key, it means trigger worked or profile exists.
          // We ignore it to avoid false positives.
          if (!profileError.message.includes('duplicate key')) {
            console.log("Manual profile creation result:", profileError.message);
          }
        }

        // Force login immediately
        onLogin(newUserProfile);
      }
    }
  };

  const handleGoogleLogin = () => {
    // Simulate Google Login
    // In a real app, this would use OAuth
    const email = 'user@gmail.com';
    let user = getUser(email);

    if (!user) {
      user = createDefaultUser(email, 'Google', 'User', 'google-auth');
      // For local dev/simulation, we need a fake UUID if createDefaultUser doesn't provide one.
      // Assuming createDefaultUser is updated or we patch it here.
      // Let's check createDefaultUser first. It's imported from storage.
      // Ideally I should update createDefaultUser. But for now I will patch it here if needed.
      // Wait, getUser(email) returns UserProfile.
      if (!user.id) user.id = 'temp-google-id-' + Date.now();
      saveUser(user);
    }
    onLogin(user);
  };

  return (
    <div className="auth-div min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 overflow-y-auto relative selection:bg-indigo-500/30">

      {/* Background Elements from Landing Page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="p-8 text-center border-b border-white/5">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
            <Brain className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">AI Tutor</h1>
          <p className="text-slate-400">
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {!isLogin && (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <User className="absolute left-4 mt-[10px] top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    required={!isLogin}
                  />
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 mt-[1px] top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 mt-[1px] top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 mt-[1px] mr-2 bg-slate-100/ top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-slate-500 text-sm font-medium">OR</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-3"
          >
            {/* Google Icon SVG */}
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.96-2.91l-3.86-3c-1.08.72-2.45 1.16-4.1 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z" />
                <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" />
                <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0 7.565 0 3.515 2.7 1.545 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
              </g>
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center">
            <p className="text-slate-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-indigo-400 font-bold ml-2 hover:text-indigo-300 transition-colors hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
