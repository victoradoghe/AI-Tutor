import type React from 'react';
import { useState } from 'react';
import { generateQuiz } from '../services/geminiService';
import type { QuizQuestion } from '../types';
import { Brain, CheckCircle2, XCircle, Trophy, RefreshCw, ChevronRight, Loader2, Lock } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

interface QuizProps {
  onQuizComplete: (score: number, total: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ onQuizComplete }) => {
  const { showUpgradeModal } = useSubscription();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const startQuiz = async () => {
    if (!topic) return;
    setIsLoading(true);
    setQuizFinished(false);
    setScore(0);
    setCurrentQIndex(0);
    const newQuestions = await generateQuiz(topic, difficulty);
    setQuestions(newQuestions);
    setIsLoading(false);
  };

  const handleOptionSelect = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const submitAnswer = () => {
    setIsSubmitted(true);
    if (selectedOption === questions[currentQIndex].correctIndex) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);
    // Update global stats
    onQuizComplete(score, questions.length);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="animate-spin text-indigo-500 relative z-10" size={64} />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-6 text-lg animate-pulse">Generating your personalized quiz...</p>
      </div>
    );
  }

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = "Good effort!";
    if (percentage >= 90) message = "Outstanding!";
    else if (percentage >= 70) message = "Great job!";
    else if (percentage >= 50) message = "Not bad!";

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in zoom-in duration-500 max-w-lg mx-auto">
        <div className="w-32 h-32 bg-gradient-to-tr from-yellow-400/20 to-orange-500/20 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-yellow-500/10 border border-yellow-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-yellow-500/10 animate-pulse"></div>
          <Trophy className="text-yellow-600 dark:text-yellow-400 relative z-10" size={56} />
        </div>

        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{message}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">You scored <span className="font-bold text-slate-900 dark:text-white">{score}</span> out of <span className="font-bold text-slate-900 dark:text-white">{questions.length}</span></p>

        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-6 mb-10 overflow-hidden border border-slate-300 dark:border-white/5 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20"></div>
          </div>
        </div>

        <button
          onClick={() => {
            setQuestions([]);
            setTopic('');
            setCurrentQIndex(0);
            setSelectedOption(null);
            setIsSubmitted(false);
            setScore(0);
            setQuizFinished(false);
          }}
          className="px-8 py-4 bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-100 border border-slate-200 dark:border-transparent rounded-2xl font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 group"
        >
          <RefreshCw size={22} className="group-hover:rotate-180 transition-transform duration-500" /> Create New Quiz
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6 mt-4 md:mt-10 pb-32 md:pb-24 animate-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl p-6 md:p-10 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-white/5 text-center transition-all hover:bg-white/80 dark:hover:bg-slate-800/60 group">
          <div className="w-20 h-20 bg-gradient-to-tr from-teal-400/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl border border-teal-500/20 group-hover:scale-110 transition-transform duration-500">
            <Brain className="text-teal-600 dark:text-teal-400" size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">AI Quiz Generator</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">Test your knowledge on any subject. The AI will create a unique quiz just for you.</p>

          <div className="space-y-8 text-left">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. World War II, Python Lists, Calculus..."
                className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Mode</label>
              <div className="flex flex-col gap-3">
                <button className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-700 border-2 border-teal-500 text-slate-900 dark:text-white shadow-md relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-teal-500" />
                    <div className="text-left">
                      <div className="font-bold">Standard Quiz</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Multiple Choice Questions</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => showUpgradeModal()}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group relative"
                >
                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-400" />
                    <div className="text-left">
                      <div className="font-bold">Deep Dive</div>
                      <div className="text-xs">Written Answers & Detailed Feedback</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                    <Lock size={14} /> PRO
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Difficulty</label>
              <div className="flex flex-col sm:flex-row gap-2 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-white/5">
                {['Beginner', 'Intermed.', 'Advanced'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${difficulty === diff
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startQuiz}
              disabled={!topic}
              className="w-full py-4 mt-6 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/20 active:scale-95 text-lg"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentQIndex];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 min-h-screen pb-32 md:pb-24">

      <div className="flex items-center justify-between mb-8">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-white/5 px-3 py-1 rounded-full bg-white dark:bg-slate-800/50">Question {currentQIndex + 1} of {questions.length}</span>
        <span className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
          <Trophy size={14} className="text-indigo-600 dark:text-indigo-400" /> Score: {score}
        </span>
      </div>

      <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl p-6 md:p-10 rounded-[2rem] shadow-xl border border-slate-200 dark:border-white/5 mb-8 transition-all animate-in fade-in slide-in-from-right-4 duration-500">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-relaxed mb-8">{q.question}</h3>

        <div className="space-y-4">
          {q.options.map((option, idx) => {
            let itemClass = "w-full p-5 rounded-2xl border-2 text-left font-medium transition-all relative group ";
            let icon = null;

            if (isSubmitted) {
              if (idx === q.correctIndex) {
                itemClass += "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                icon = <CheckCircle2 className="absolute right-5 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400" size={24} />;
              } else if (idx === selectedOption) {
                itemClass += "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300";
                icon = <XCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-red-600 dark:text-red-400" size={24} />;
              } else {
                itemClass += "border-transparent bg-slate-100 dark:bg-slate-900/30 text-slate-400 opacity-50";
              }
            } else {
              itemClass += selectedOption === idx
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                : "border-transparent bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={itemClass}
                disabled={isSubmitted}
              >
                <div className="pr-8">{option}</div>
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {isSubmitted && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4 shadow-lg shadow-blue-900/10">
          <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2"><Brain size={18} /> Explanation:</h4>
          <div className="w-full h-px bg-blue-500/20 mb-3"></div>
          <p className="text-blue-800 dark:text-blue-100/80 leading-relaxed">{q.explanation}</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        {!isSubmitted ? (
          <button
            onClick={submitAnswer}
            disabled={selectedOption === null}
            className="px-8 py-4 bg-white dark:bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-white transition-all shadow-xl shadow-slate-200 dark:shadow-white/5 active:scale-95"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 hover:scale-[1.02] transition-all flex items-center gap-3 shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            Next Question <ChevronRight size={20} />
          </button>
        )}
      </div>

    </div>
  );
};

export default Quiz;