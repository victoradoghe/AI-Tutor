import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Volume2, Copy, Check, Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react';
import { generateTutorResponse } from '../services/geminiService';
import { getChatSessions, saveChatSession, deleteChatSession } from '../services/storage';
import type { Message, ChatSession } from '../types';

interface TutorProps {
  userId: string;
  userEmail: string;
}

const Tutor: React.FC<TutorProps> = ({ userEmail }) => {
  // Subscription removed - unlimited messages for all users
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = getChatSessions(userEmail);
    setSessions(loadedSessions);

    if (loadedSessions.length > 0) {
      setCurrentSessionId(loadedSessions[0].id);
      setMessages(loadedSessions[0].messages);
    } else {
      createNewSession();
    }
  }, [userEmail]);

  // Save current session whenever messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      const currentSession = sessions.find(s => s.id === currentSessionId);
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          messages,
          lastUpdatedAt: Date.now(),
          // Update title if it's the first real message (not the welcome one)
          title: currentSession.messages.length <= 1 && messages.length > 1
            ? messages.find(m => m.role === 'user')?.text.slice(0, 30) + (messages.find(m => m.role === 'user')?.text.length! > 30 ? '...' : '') || 'New Chat'
            : currentSession.title
        };
        saveChatSession(userEmail, updatedSession);
        setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
      }
    }
  }, [messages]); // Removed userEmail from dependency to avoid re-triggering logic unnecessarily

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      userId: userEmail,
      title: 'New Chat',
      messages: [{
        id: 'welcome',
        role: 'model',
        text: "Hi there! I'm your AI Tutor. What would you like to learn about today? I can help with math, science, coding, or any other subject!",
        timestamp: Date.now()
      }],
      createdAt: Date.now(),
      lastUpdatedAt: Date.now()
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    saveChatSession(userEmail, newSession);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteChatSession(userEmail, sessionId);
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);

    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        loadSession(updatedSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check Subscription Limit
    const canSend = checkLimit('daily_messages');
    if (!canSend) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Increment usage in background (don't block chat)
      incrementMessageCount().catch(err => console.error("Failed to increment usage:", err));

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await generateTutorResponse(history, userMsg.text);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm encountering an error and can't respond right now. Please check your connection or try again later.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };



  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderMessageContent = (msg: Message) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(msg.text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`${msg.id}-text-${lastIndex}`} className="whitespace-pre-wrap">
            {msg.text.slice(lastIndex, match.index)}
          </span>
        );
      }
      const lang = match[1] || 'code';
      const code = match[2];
      const codeId = `${msg.id}-code-${match.index}`;
      parts.push(
        <div key={codeId} className="my-3 bg-slate-900 dark:bg-slate-950/50 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg group/code">
          <div className="flex justify-between items-center px-4 py-2 bg-slate-800 dark:bg-slate-900/50 border-b border-white/5">
            <span className="text-xs uppercase text-slate-300 dark:text-slate-400 font-bold tracking-wider">{lang}</span>
            <button onClick={() => copyToClipboard(code, codeId)} className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 dark:text-indigo-400 hover:text-white transition-colors">
              {copiedIndex === codeId ? <Check size={14} /> : <Copy size={14} />}
              {copiedIndex === codeId ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <pre className="font-mono text-sm leading-relaxed whitespace-pre text-slate-200 dark:text-slate-300">{code}</pre>
          </div>
        </div>
      );
      lastIndex = codeBlockRegex.lastIndex;
    }
    if (lastIndex < msg.text.length) {
      parts.push(<span key={`${msg.id}-text-end`} className="whitespace-pre-wrap">{msg.text.slice(lastIndex)}</span>);
    }
    if (parts.length === 0) return <span className="whitespace-pre-wrap">{msg.text}</span>;
    return <>{parts}</>;
  };

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative selection:bg-indigo-500/30">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] opacity-50" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px] opacity-30" />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200 dark:border-white/10 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-50
          /* Mobile: Fixed and transform-based */
          fixed inset-y-0 left-0 w-[280px] shadow-2xl
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          
          /* Desktop: Relative and width-based */
          md:relative md:translate-x-0 md:shadow-none
          ${isSidebarOpen ? 'md:w-[280px]' : 'md:w-0 md:border-r-0 overflow-hidden'}
        `}
      >
        <div className="w-[280px] h-full flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 dark:text-white tracking-tight">Chat History</h2>
            <div className="md:hidden">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={createNewSession}
              className="w-full flex items-center text-black dark:text-white justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 px-4 rounded-xl transition-all font-medium shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              <Plus size={18} />
              <span>New Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent ${currentSessionId === session.id
                  ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white border-indigo-100 dark:border-white/5 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
              >
                <MessageSquare size={18} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs opacity-50 truncate">{new Date(session.lastUpdatedAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  className="p-1.5 text-slate-500 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 transition-colors">
        {/* Header */}
        <div className="flex items-center p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-20 transition-colors">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} // Toggle sidebar on desktop too
            className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors mr-2"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="text-black dark:text-white" size={18} />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg">AI Tutor</span>

            {/* Subscription UI removed */}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-gradient-to-tr from-indigo-500 to-purple-500'
                }`}>
                {msg.role === 'user' ? (
                  <UserIcon size={20} className="text-slate-600 dark:text-slate-300" />
                ) : (
                  <Bot size={20} className="text-black dark:text-white" />
                )}
              </div>

              <div className={`relative max-w-[85%] lg:max-w-[70%] p-5 rounded-3xl text-[15px] leading-relaxed shadow-sm lg:shadow-xl ${msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800/80 backdrop-blur-md text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-bl-none'
                }`}>
                {renderMessageContent(msg)}

                {msg.role === 'model' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Read Aloud"
                  >
                    <Volume2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="text-white" size={20} />
              </div>
              <div className="bg-white dark:bg-slate-800/50 px-5 py-4 rounded-3xl rounded-bl-none border border-slate-200 dark:border-white/10 flex items-center gap-3 shadow-sm">
                <Loader2 size={18} className="animate-spin text-indigo-500 dark:text-indigo-400" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white/80 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-white/5 transition-colors">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your AI Tutor anything..."
                className="w-full bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-0 rounded-2xl pl-5 pr-14 py-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium shadow-xl transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutor;