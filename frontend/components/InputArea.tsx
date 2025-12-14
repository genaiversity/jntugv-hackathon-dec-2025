import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, Plus, Zap, Square } from 'lucide-react';
import { INITIAL_SUGGESTIONS } from '../constants.tsx';
import { VoiceInput } from './VoiceInput.tsx';

interface InputAreaProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isExpanded?: boolean;
  value?: string;
  isGenerating?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, onStop, disabled, isExpanded = true, value, isGenerating }) => {
  const [input, setInput] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allow external control of input value (for sidebar clicks)
  useEffect(() => {
    if (value) {
      setInput(value);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [value]);

  // Close prompts menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (promptMenuRef.current && !promptMenuRef.current.contains(event.target as Node)) {
        setShowPrompts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
    setShowPrompts(false);
  };

  const handleStop = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (onStop) {
      onStop();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setShowPrompts(false);
    if (textareaRef.current) {
        textareaRef.current.focus();
    }
  };

  const handleVoiceInput = (text: string) => {
    setInput(prev => {
        const newValue = prev ? `${prev} ${text}` : text;
        return newValue;
    });
    if (textareaRef.current) {
        textareaRef.current.focus();
    }
  };
  
  const handleUploadClick = () => {
      fileInputRef.current?.click();
      setShowPrompts(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          // Mock upload action
          const fileName = e.target.files[0].name;
          setInput(prev => prev ? `${prev} [Attached: ${fileName}]` : `[Attached: ${fileName}]`);
      }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  return (
    <div className="w-full mx-auto relative font-sans">
      
      {/* Prompt / Upload Menu Popup */}
      {showPrompts && (
        <div ref={promptMenuRef} className="absolute bottom-full left-0 mb-3 w-72 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
           
           {/* Actions Section */}
           <div className="p-1.5 border-b border-gray-100 dark:border-white/5">
               <button 
                  onClick={handleUploadClick}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3 font-medium"
               >
                   <div className="p-1.5 bg-blue-50 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                      <Paperclip className="w-4 h-4" />
                   </div>
                   Upload File
               </button>
               <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
           </div>

           <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 flex items-center justify-between">
             <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Prompts</span>
           </div>
           
           <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
             {INITIAL_SUGGESTIONS.map((suggestion, idx) => (
               <button
                 key={idx}
                 onClick={() => handlePromptClick(suggestion)}
                 className="w-full text-left px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white rounded-xl transition-colors truncate flex items-center gap-2.5"
               >
                 <Zap className="w-3.5 h-3.5 text-gray-400" />
                 <span className="truncate">{suggestion}</span>
               </button>
             ))}
           </div>
        </div>
      )}

      <div className="relative bg-white dark:bg-[#1c1c1e] rounded-[26px] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus-within:border-blue-500 dark:focus-within:border-blue-500/50 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex items-end p-2">
        
        {/* Plus / Menu Button */}
        <div className="absolute left-3 bottom-2.5 z-10">
           <button 
             onClick={() => setShowPrompts(!showPrompts)}
             className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3c] hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
             title="Add..."
           >
             <Plus className={`w-5 h-5 transition-transform duration-300 ${showPrompts ? 'rotate-45' : ''}`} />
           </button>
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-[15px] py-3.5 pl-14 pr-28 rounded-2xl resize-none focus:outline-none min-h-[52px] max-h-[180px] overflow-y-auto scrollbar-hide leading-relaxed"
          rows={1}
          disabled={disabled && !isGenerating}
        />
        
        {/* Right Actions: Voice & Send */}
        <div className="absolute right-3 bottom-2.5 flex items-center gap-1.5">
            <VoiceInput 
               onInput={handleVoiceInput} 
               className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#2c2c2e] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" 
             />

            <button
            onClick={isGenerating ? handleStop : () => handleSubmit()}
            disabled={(!input.trim() && !isGenerating) || (disabled && !isGenerating)}
            className={`
                p-2.5 rounded-full transition-all duration-200 flex items-center justify-center
                ${(input.trim() || isGenerating) && !(disabled && !isGenerating)
                ? 'bg-blue-600 dark:bg-white text-white dark:text-black hover:bg-blue-700 dark:hover:bg-gray-200 shadow-md transform hover:scale-105' 
                : 'bg-gray-100 dark:bg-[#2c2c2e] text-gray-300 dark:text-gray-600 cursor-not-allowed'}
            `}
            >
            {isGenerating ? (
                <Square className="w-4 h-4 fill-current" />
            ) : (
                <ArrowUp className="w-5 h-5" />
            )}
            </button>
        </div>
      </div>
      
      <div className="text-center mt-3">
        <p className="text-[11px] text-gray-400 dark:text-gray-600 font-medium">
          Rexie is an experimental AI and can make mistakes.
        </p>
      </div>
    </div>
  );
};