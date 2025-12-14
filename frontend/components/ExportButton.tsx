import React from 'react';
import { Share } from 'lucide-react';

interface ExportButtonProps {
  onClick: () => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1c1c1e] transition-colors"
    >
      <Share className="w-3.5 h-3.5" />
      Share & Export
    </button>
  );
};