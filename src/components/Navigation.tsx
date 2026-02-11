import React from 'react';
import { LayoutDashboard, MessageSquare, Layers, GraduationCap, User, LogOut, Brain } from 'lucide-react';

interface NavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isMobile: boolean;
  onLogout: () => void;
}

const Navigation: React.FC<NavProps> = ({ currentTab, setTab, isMobile, onLogout }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> },
    { id: 'tutor', label: 'AI Tutor', icon: <MessageSquare size={24} /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers size={24} /> },
    { id: 'quiz', label: 'Quizzes', icon: <GraduationCap size={24} /> },
    { id: 'profile', label: 'Profile', icon: <User size={24} /> },
  ];

  if (isMobile) {
    return (
      <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4 pb-safe">
        <div className="bg-white/90 dark:bg-[#0f1115]/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[2.5rem] p-2 flex items-center justify-between pointer-events-auto w-full max-w-[360px] animate-in slide-in-from-bottom-6 duration-500 ring-1 ring-black/5 dark:ring-white/5">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`relative flex flex-col items-center justify-center h-14 w-14 rounded-2xl transition-all duration-300 group ${isActive
                  ? 'text-indigo-600 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-indigo-500/10 dark:bg-white/10 rounded-2xl transition-all duration-300 -z-10 scale-90" />
                )}
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {tab.icon}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-72 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 h-screen flex flex-col fixed left-0 top-0 shadow-2xl z-50 transition-colors duration-150">
      <div className="p-8 pb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Brain className="text-white" size={28} />
        </div>
        <div>
          <h1 className="font-extrabold text-2xl tracking-tight text-slate-800 dark:text-white">AI Tutor</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Learning Assistant</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${currentTab === tab.id
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300'
              }`}
          >
            {currentTab === tab.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-30"></div>
            )}
            <span className={`transition-transform duration-300 ${currentTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              {tab.icon}
            </span>
            <span className="font-bold tracking-wide">{tab.label}</span>
            {currentTab === tab.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-5 py-3.5 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/30 group"
        >
          <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Navigation;