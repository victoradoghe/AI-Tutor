import React from 'react';
import { ArrowRight, Sparkles, Brain, Zap, Globe, Shield, Rocket, CheckCircle } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    return (
        <div className="h-screen bg-slate-900 text-white overflow-y-auto selection:bg-indigo-500/30">

            {/* Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Brain className="text-white" size={24} />
                    </div>
                    <span>AI Tutor</span>
                </div>
                <button
                    onClick={onGetStarted}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium transition-all backdrop-blur-sm"
                >
                    Sign In
                </button>
            </nav>

            {/* Hero Section */}
            <div className="relative z-10 container mx-auto px-6 pt-20 pb-32 md:pt-32 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Sparkles size={16} />
                    <span>The Future of Learning is Here</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    Master Any Subject <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        Powered by AI
                    </span>
                </h1>

                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    Personalized tutoring, intelligent flashcards, and adaptive quizzes.
                    Experience a smarter way to learn that evolves with you.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <button
                        onClick={onGetStarted}
                        className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        Get Started For Free
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </button>
                    <button className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl font-bold text-lg transition-all flex items-center gap-2 backdrop-blur-sm">
                        Watch Demo
                    </button>
                </div>
            </div>

            {/* Features Grid */}
            <div className="relative z-10 container mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Brain size={32} className="text-indigo-400" />}
                        title="AI Tutor"
                        desc="Chat with an advanced AI that understands your learning style and adapts explanations to you."
                        delay="delay-0"
                    />
                    <FeatureCard
                        icon={<Zap size={32} className="text-purple-400" />}
                        title="Smart Flashcards"
                        desc="Generate study sets instantly from any topic. Master concepts faster with active recall."
                        delay="delay-100"
                    />
                    <FeatureCard
                        icon={<Globe size={32} className="text-pink-400" />}
                        title="Global Knowledge"
                        desc="Access a vast database of information across limitless subjects, languages, and skills."
                        delay="delay-200"
                    />
                </div>
            </div>

            {/* Pricing Section */}
            <div className="relative z-10 container mx-auto px-6 py-24 border-t border-white/5">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
                    <p className="text-slate-400 text-lg">
                        Start for free and upgrade when you're ready to unlock the full power of AI learning.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Tier */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col">
                        <div className="mb-4">
                            <span className="px-3 py-1 bg-slate-100/10 rounded-full text-sm font-bold text-slate-300">Starter</span>
                        </div>
                        <h3 className="text-4xl font-bold mb-2">Free</h3>
                        <p className="text-slate-400 mb-8">Perfect for trying out the AI Tutor.</p>

                        <div className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-slate-300">
                                <CheckCircle size={20} className="text-indigo-400" />
                                10 AI Chat Messages / Day
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <CheckCircle size={20} className="text-indigo-400" />
                                3 Flashcard Sets
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <CheckCircle size={20} className="text-indigo-400" />
                                Basic Quiz Generation
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <CheckCircle size={20} className="text-indigo-400" />
                                2 Folders
                            </li>
                        </div>

                        <button
                            onClick={onGetStarted}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Pro Tier */}
                    <div className="relative p-8 rounded-3xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 flex flex-col overflow-hidden group">
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>

                        <div className="mb-4 relative z-10">
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-bold border border-indigo-500/30">Pro</span>
                        </div>
                        <h3 className="text-4xl font-bold mb-2 relative z-10">$4.00<span className="text-lg text-slate-400 font-medium">/mo</span></h3>
                        <p className="text-indigo-200/70 mb-8 relative z-10">For serious learners who want no limits.</p>

                        <div className="space-y-4 mb-8 flex-1 relative z-10">
                            <li className="flex items-center gap-3 text-white">
                                <div className="p-1 bg-green-500/20 rounded-full text-green-400"><CheckCircle size={16} strokeWidth={3} /></div>
                                Unlimited AI Chat
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <div className="p-1 bg-green-500/20 rounded-full text-green-400"><CheckCircle size={16} strokeWidth={3} /></div>
                                Unlimited Flashcards & Sets
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <div className="p-1 bg-green-500/20 rounded-full text-green-400"><CheckCircle size={16} strokeWidth={3} /></div>
                                Advanced Quiz Modes
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <div className="p-1 bg-green-500/20 rounded-full text-green-400"><CheckCircle size={16} strokeWidth={3} /></div>
                                Priority Support
                            </li>
                        </div>

                        <button
                            onClick={onGetStarted}
                            className="relative z-10 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                        >
                            Get Pro
                        </button>
                    </div>
                </div>
            </div>

            {/* Social Proof / Trust */}
            <div className="relative z-10 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl">
                <div className="container mx-auto px-6 py-16 text-center">
                    <h3 className="text-2xl font-bold mb-12">Trusted by learners everywhere</h3>
                    <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholders for logos */}
                        <div className="flex items-center gap-2 text-xl font-bold"><Shield size={24} /> University</div>
                        <div className="flex items-center gap-2 text-xl font-bold"><Rocket size={24} /> EdTech</div>
                        <div className="flex items-center gap-2 text-xl font-bold"><Globe size={24} /> GlobalLearn</div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-12 text-center text-slate-500 text-sm">
                <p>© {new Date().getFullYear()} AI Tutor. Built for the future of education.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: string }) => (
    <div className={`p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all hover:-translate-y-2 duration-300 animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards ${delay}`}>
        <div className="mb-6 p-4 rounded-2xl bg-slate-800/50 w-fit">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-slate-400 leading-relaxed">
            {desc}
        </p>
    </div>
);

export default LandingPage;
