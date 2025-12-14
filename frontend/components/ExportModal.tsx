import React, { useState, useEffect } from 'react';
import { X, FileText, Code, Download, Globe, Lock, Copy, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsCopied(false);
      setIsPublic(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentChatId = "current-session"; // Placeholder for current session ID
  const shareLink = `https://askk.ai/share/chat-${currentChatId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden transform transition-all scale-100">
        <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Share & Export</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          
          {/* Share Section */}
          <div className="space-y-4">
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
                      {isPublic ? 'Anyone with the link can view' : 'Only you can view'}
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

             <div className={`flex gap-2 transition-opacity duration-200 ${isPublic ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="flex-1 bg-gray-50 dark:bg-[#161618] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 font-mono truncate select-all">
                  {shareLink}
                </div>
                <button 
                  onClick={handleCopy}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 justify-center"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
             </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-white/5" />

          {/* Download Section */}
          <div className="space-y-3">
             <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Download Chat</label>
             <div className="grid grid-cols-1 gap-3">
                <button className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-[#2c2c2e] hover:border-blue-200 dark:hover:border-blue-500/30 transition-all group text-left">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Markdown</h3>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>

                <button className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-[#2c2c2e] hover:border-purple-200 dark:hover:border-purple-500/30 transition-all group text-left">
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Code className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">JSON</h3>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};