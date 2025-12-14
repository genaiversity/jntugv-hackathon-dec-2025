import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Globe, Lock } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, itemId }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsCopied(false);
      setIsPublic(true); // Default to public when opening
    }
  }, [isOpen]);

  if (!isOpen || !itemId) return null;

  const shareLink = `https://askk.ai/share/chat-${itemId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Share Chat
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          
          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPublic ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {isPublic ? 'Public Access' : 'Private'}
                </div>
                <div className="text-xs text-gray-500">
                  {isPublic ? 'Anyone with the link can view this chat' : 'Only you can access this chat'}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsPublic(!isPublic)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isPublic ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
              `}
            >
              <span className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${isPublic ? 'translate-x-6' : 'translate-x-1'}
              `} />
            </button>
          </div>

          {/* Link Section */}
          <div className={`space-y-2 transition-opacity duration-200 ${isPublic ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Chat Link
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 dark:bg-[#161618] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 font-mono truncate select-all">
                {shareLink}
              </div>
              <button 
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 min-w-[100px] justify-center"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-white/5">
            <p className="text-xs text-center text-gray-500">
              Shared chats do not include your personal API keys or account data.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};