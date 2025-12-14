import React from 'react';
import { 
  Search, 
  Zap, 
  Plus, 
  Share2,
  Trash2
} from 'lucide-react';
import { SIDEBAR_NAVIGATION } from '../constants.tsx';
import { SidebarSection } from '../types.ts';

interface SidebarProps {
  isOpen: boolean;
  activeNav: string;
  setActiveNav: (id: string) => void;
  onNewChat: () => void;
  onPromptSelect?: (prompt: string) => void;
  historySections: SidebarSection[];
  onDeleteHistoryItem: (id: string) => void;
  onShareHistoryItem: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  activeNav, 
  setActiveNav, 
  onNewChat, 
  onPromptSelect,
  historySections,
  onDeleteHistoryItem,
  onShareHistoryItem
}) => {
  return (
    <div className={`
      fixed inset-y-0 left-0 z-40 w-[280px] bg-[#f9fafb] dark:bg-[#0f0f10] text-gray-600 dark:text-gray-300 transform transition-transform duration-300 ease-in-out border-r border-gray-200 dark:border-white/5 flex flex-col font-sans
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
    `}>
      {/* Header / New Chat */}
      <div className="p-4 pt-5">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-between bg-white dark:bg-[#1c1c1e] hover:bg-gray-50 dark:hover:bg-[#2c2c2e] text-gray-900 dark:text-white p-3 rounded-xl transition-all border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
               <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold tracking-tight">New Chat</div>
              <div className="text-xs text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400 font-medium">Click to start</div>
            </div>
          </div>
          <Plus className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search history..." 
            className="w-full bg-white dark:bg-[#1c1c1e] text-sm text-gray-900 dark:text-gray-200 rounded-xl pl-10 pr-4 py-2.5 border border-gray-200 dark:border-white/5 focus:border-blue-500/50 dark:focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-gray-400 dark:placeholder-gray-600 shadow-sm"
          />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="px-3 space-y-1">
        {SIDEBAR_NAVIGATION.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeNav === item.id 
                ? 'bg-gray-100 dark:bg-[#1c1c1e] text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1c1c1e]/50 hover:text-gray-900 dark:hover:text-gray-200'}
            `}
          >
            <item.icon className={`w-4 h-4 ${activeNav === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Scrollable Content - History */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-6 pb-4">
        
        {/* History Label */}
        {historySections.length > 0 && (
          <div className="px-3 mb-3 text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
            Recents
          </div>
        )}

        {/* History Sections */}
        {historySections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="px-3 mb-2 text-xs font-medium text-gray-500 dark:text-gray-500">{section.title}</div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <button 
                  key={item.id} 
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1c1c1e] hover:text-gray-900 dark:hover:text-gray-200 rounded-lg group transition-colors relative"
                  onClick={() => onPromptSelect && onPromptSelect(item.label)}
                >
                  <span className="truncate pr-8">{item.label}</span>
                  
                  {/* Action Buttons */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-gray-100 via-gray-100 to-transparent dark:from-[#1c1c1e] dark:via-[#1c1c1e] pl-4">
                    <div 
                      onClick={(e) => { e.stopPropagation(); onShareHistoryItem(item.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-[#2c2c2e] rounded-md text-gray-400 hover:text-blue-500 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </div>
                    <div 
                      onClick={(e) => { e.stopPropagation(); onDeleteHistoryItem(item.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-[#2c2c2e] rounded-md text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
};