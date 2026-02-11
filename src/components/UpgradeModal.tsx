import React from 'react';
import { X, Check, Zap, Crown } from 'lucide-react';


interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    title?: string;
    description?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade, title, description }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-white/10">

                {/* Header with Gradinet */}
                <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>

                    <div className="absolute -bottom-10 p-1 bg-white dark:bg-slate-900 rounded-full">
                        <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900">
                            <Crown className="text-white" size={32} fill="currentColor" />
                        </div>
                    </div>
                </div>

                <div className="pt-14 pb-8 px-8 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{title || "Upgrade to Pro"}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">{description || "Unlock the full potential of your AI Tutor."}</p>

                    <div className="space-y-4 mb-8 text-left bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-1 bg-green-100 dark:bg-green-500/20 rounded-full text-green-600 dark:text-green-400">
                                <Check size={16} strokeWidth={3} />
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">Unlimited Flashcard Sets</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-1 bg-green-100 dark:bg-green-500/20 rounded-full text-green-600 dark:text-green-400">
                                <Check size={16} strokeWidth={3} />
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">Unlimited AI Chat Messages</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-1 bg-green-100 dark:bg-green-500/20 rounded-full text-green-600 dark:text-green-400">
                                <Check size={16} strokeWidth={3} />
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">More Folders Organization</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-1 bg-green-100 dark:bg-green-500/20 rounded-full text-green-600 dark:text-green-400">
                                <Check size={16} strokeWidth={3} />
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">Detailed Quiz Analysis modes</span>
                        </div>
                    </div>

                    <button
                        onClick={onUpgrade}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <Zap className="fill-white group-hover:scale-110 transition-transform" size={20} /> Upgrade Now - Mock Action
                    </button>

                    <p className="text-xs text-slate-400 mt-4">
                        This is a mock payment for the demo. No actual charge.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
