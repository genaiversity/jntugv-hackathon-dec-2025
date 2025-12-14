import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onInput: (text: string) => void;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onInput, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          // Add a space before the new transcript if it's a new sentence/phrase
          onInput(finalTranscript + ' ');
        }
      };

      recognitionRef.current.onend = () => {
        // Automatically restart if we think we should still be listening, 
        // otherwise update state. Ideally, we let the user toggle.
        // Here we just update state to match reality if it stops unexpectedly.
        if (isListening) {
             // Optional: restart logic could go here
             setIsListening(false); 
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, [onInput, isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support voice input.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <button 
      onClick={toggleListening}
      className={`${className} ${isListening ? 'text-red-500 hover:text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' : ''}`} 
      title={isListening ? "Stop Recording" : "Start Voice Input"}
      type="button"
    >
      {isListening ? (
        <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <MicOff className="relative inline-flex h-4 w-4" />
        </span>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};