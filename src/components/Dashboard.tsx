import React from 'react';
import { Flame, Trophy, Target, BookOpen, Brain, Zap, Layers } from 'lucide-react';
import type { UserProfile } from '../types';

interface DashboardProps {
  user: UserProfile;
  setTab: (tab: string) => void;

}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl hover:-translate-y-1 duration-300 group">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-black dark:text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <div className="mt-4">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
    </div>
  </div>
);

const TOPICS = [
  { title: "Master Algebra Basics", description: "Continue your math streak with a quick interactive lesson on linear equations." },
  { title: "Learn Python Basics", description: "Start your coding journey with variables, loops, and functions in Python." },
  { title: "Explore World History", description: "Dive into the ancient civilizations and understand their impact on modern society." },
  { title: "Chemistry 101", description: "Understand the periodic table and the fundamental building blocks of matter." },
  { title: "French Greetings", description: "Learn how to say hello, goodbye, and introduce yourself in French." }
];

const Dashboard: React.FC<DashboardProps> = ({ user, setTab }) => {
  const [currentTopicIndex, setCurrentTopicIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTopicIndex((prev) => (prev + 1) % TOPICS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate Accuracy
  const accuracy = user.quizTotalQuestions > 0
    ? Math.round((user.quizTotalCorrect / user.quizTotalQuestions) * 100)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Welcome back, {user.firstName || 'Scholar'}!</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">You're on a great learning path. Keep it up!</p>
        </div>
        <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-transparent pr-6 pl-4 py-2.5 rounded-full border border-orange-500/20">
          <div className="bg-orange-500/20 p-2 rounded-full">
            <Flame className="text-orange-500 fill-orange-500" size={20} />
          </div>
          <div>
            <span className="block text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Current Streak</span>
            <span className="font-bold text-slate-900 dark:text-white text-lg leading-none">{user.streak} Days</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Current Level" value={user.level} icon={<Trophy size={24} />} color=" bg-gradient-to-br from-indigo-500 to-purple-500" />
        <StatCard title="Lessons Done" value={user.lessonsCompleted} icon={<BookOpen size={24} />} color="bg-gradient-to-br from-blue-500 to-cyan-500" />
        <StatCard title="Quiz Accuracy" value={`${accuracy}%`} icon={<Target size={24} />} color="bg-gradient-to-br from-emerald-500 to-teal-500" />
        {/* <StatCard title="Total XP" value={user.xp} icon={<Zap size={24} />} color="bg-gradient-to-br from-amber-500 to-orange-500" /> */}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Recommended Actions */}
        <div className="lg:col-span-3 space-y-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            Recommended for You
          </h3>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 dark:bg-slate-800/50 border border-indigo-500/20 dark:border-white/5 p-8 lg:p-12 text-white shadow-2xl transition-all duration-200 group cursor-pointer" onClick={() => setTab('tutor')}>
            {/* Abstract Background Pattern */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/10 to-transparent dark:from-indigo-600/30 dark:via-purple-600/10 dark:to-slate-900/50" />
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-400/30 dark:bg-indigo-500/30 rounded-full blur-[100px] animate-pulse-slow" />
              <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/20 rounded-full blur-[100px] animate-pulse-slow delay-700" />
            </div>

            {/* Decorative Icon */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 transform opacity-10 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
              <Zap size={240} className="text-white" />
            </div>

            <div className="relative z-10 flex flex-col items-start gap-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md border border-white/20 text-indigo-100">
                <Flame size={16} className="text-orange-300 fill-orange-300" />
                <span>Daily Challenge</span>
              </div>

              <div className="h-32 flex flex-col justify-center max-w-2xl">
                <h3 key={currentTopicIndex} className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white mb-4 animate-pan-reveal">
                  {TOPICS[currentTopicIndex].title}
                </h3>
                <p key={`desc-${currentTopicIndex}`} className="text-indigo-100 dark:text-slate-300 text-xl leading-relaxed animate-pan-reveal" style={{ animationDelay: '100ms' }}>
                  {TOPICS[currentTopicIndex].description}
                </p>
              </div>

              <button className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-8 py-4 font-bold text-indigo-600 dark:text-slate-900 shadow-xl shadow-white/10 transition-all hover:bg-indigo-50 hover:scale-105 active:scale-95">
                <span>Start Lesson</span>
                <Zap size={20} className="fill-current" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onClick={() => setTab('flashcards')} className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-6 group hover:-translate-y-1 duration-300 hover:shadow-xl hover:shadow-black/5">
              <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 dark:text-pink-400 group-hover:scale-110 transition-transform duration-300 border border-pink-500/20">
                <Layers size={32} />
              </div>
              <div>
                <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-1">Review Flashcards</h4>
                <p className="text-slate-500 dark:text-slate-400">Biology - Cell Structure</p>
              </div>
            </div>

            <div onClick={() => setTab('quiz')} className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-6 group hover:-translate-y-1 duration-300 hover:shadow-xl hover:shadow-black/5">
              <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300 border border-teal-500/20">
                <Brain size={32} />
              </div>
              <div>
                <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-1">Quick Quiz</h4>
                <p className="text-slate-500 dark:text-slate-400">Test your Spanish vocab</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
