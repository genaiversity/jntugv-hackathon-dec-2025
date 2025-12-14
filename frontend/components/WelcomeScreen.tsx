import React from 'react';
import { Zap } from 'lucide-react';
import { INITIAL_SUGGESTIONS } from '../constants.tsx';

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onSuggestionClick,
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 space-y-4 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
          Welcome to Rexie.
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto text-lg font-light">
          Your intelligent assistant for Gmail, Slack, Calendar, Docs, and more
        </p>
      </div>

      {/* Suggestions Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 px-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {INITIAL_SUGGESTIONS.map((suggestion, idx) => (
           <button
            key={idx}
            onClick={() => onSuggestionClick(suggestion)}
            className={`
              group relative p-6 bg-white dark:bg-[#1c1c1e] hover:bg-gray-50 dark:hover:bg-[#2c2c2e] 
              border border-gray-200 dark:border-white/5 rounded-xl text-left 
              transition-all duration-300 hover:shadow-xl hover:scale-[1.01] shadow-sm
              ${(idx === INITIAL_SUGGESTIONS.length - 1 && INITIAL_SUGGESTIONS.length % 2 !== 0) ? 'md:col-span-2' : ''}
            `}
           >
             <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
             <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-white relative z-10 flex items-center gap-2">
               {suggestion}
             </h3>
             <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
               <Zap className="w-4 h-4 text-blue-500 dark:text-blue-400" />
             </div>
           </button>
        ))}
      </div>
    </div>
  );
};