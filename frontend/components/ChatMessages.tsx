import React, { useState } from 'react';
import { Pencil, RotateCcw, Copy, Check } from 'lucide-react';
import { Message } from '../types.ts';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  onEdit: (text: string) => void;
  onRetry: (text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  onEdit,
  onRetry,
  messagesEndRef,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 pb-12 space-y-8 font-sans">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex w-full group ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {/* USER MESSAGE - Bubble Style, Right Aligned */}
          {msg.role === 'user' ? (
            <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
              <div className="bg-[#f4f4f5] dark:bg-[#27272a] text-gray-900 dark:text-gray-100 rounded-[20px] rounded-tr-[4px] px-6 py-3.5 text-[15px] leading-relaxed shadow-sm border border-transparent dark:border-white/5">
                {msg.content}
              </div>

              {/* User Actions */}
              <div className="flex items-center gap-3 mt-1.5 mr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onEdit(msg.content)}
                  className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => onRetry(msg.content)}
                  className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            </div>
          ) : (
            /* BOT MESSAGE - Full Width/Plain, Left Aligned */
            <div className="w-full pr-4 sm:pr-12">
              <div
                className={`prose prose-base dark:prose-invert max-w-none leading-7 ${
                  msg.isError ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="whitespace-pre-wrap font-normal">{msg.content}</div>
              </div>

              {/* Bot Actions */}
              <div className="flex items-center gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                <button
                  onClick={() => handleCopy(msg.content, msg.id)}
                  className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1.5 transition-colors"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedId === msg.id ? 'Copied' : 'Copy'}
                </button>

                <button
                  onClick={() => onRetry(msg.content)}
                  className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* TYPING INDICATOR */}
      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex justify-start w-full">
          <div className="py-4 pl-1 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce delay-150" />
            <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce delay-300" />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};