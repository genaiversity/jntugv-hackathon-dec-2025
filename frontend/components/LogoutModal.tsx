import React from 'react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Log out?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to sign out of your account? You will need to sign in again to access your chat history.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};