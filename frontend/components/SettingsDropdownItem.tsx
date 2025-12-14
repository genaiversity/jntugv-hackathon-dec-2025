import React from 'react';
import { Settings } from 'lucide-react';

interface SettingsDropdownItemProps {
  onClick: () => void;
}

export const SettingsDropdownItem: React.FC<SettingsDropdownItemProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
    >
      <Settings className="w-4 h-4" />
      Settings
    </button>
  );
};