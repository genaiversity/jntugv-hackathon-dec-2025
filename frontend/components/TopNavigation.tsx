import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Blocks, 
  LogOut, 
  ChevronDown, 
  Check,
  Menu
} from 'lucide-react';
import { ExportButton } from './ExportButton.tsx';
import { ProfileButton } from './ProfileButton.tsx';
import { SettingsDropdownItem } from './SettingsDropdownItem.tsx';

interface TopNavigationProps {
  isWelcomeScreen: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
  currentModel: string;
  setCurrentModel: (model: string) => void;
  setIsToolsModalOpen: (isOpen: boolean) => void;
  onMobileMenuClick: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenLogout: () => void;
  onOpenPro: () => void;
  userName: string;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  isWelcomeScreen,
  isDarkMode,
  toggleTheme,
  currentModel,
  setCurrentModel,
  setIsToolsModalOpen,
  onMobileMenuClick,
  onOpenSettings,
  onOpenExport,
  onOpenLogout,
  onOpenPro,
  userName
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 md:px-6 bg-white/80 dark:bg-[#0f0f10]/80 backdrop-blur-md z-30 sticky top-0 transition-colors font-sans">
      <div className="flex items-center gap-2">
         {/* Mobile Menu Trigger */}
         <button 
            onClick={onMobileMenuClick}
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1c1c1e] rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

         {/* Model Selector */}
         <div className="relative" ref={modelDropdownRef}>
            <button 
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1c1c1e] transition-colors group"
            >
                <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{currentModel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isModelDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-up">
                <div className="py-1.5">
                  {['Gemini 3 Pro', 'LLaMA', 'Gemini 2.5 Flash', 'DeepSeek'].map((model) => (
                    <button
                      key={model}
                      onClick={() => {
                        setCurrentModel(model);
                        setIsModelDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group"
                    >
                      <span>{model}</span>
                      {currentModel === model && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
         </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3">
         <button 
           onClick={toggleTheme}
           className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1c1c1e] rounded-lg transition-colors"
           title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
         >
           {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
         </button>

        <ExportButton onClick={onOpenExport} />
        
        <button 
          onClick={onOpenPro}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:opacity-90 transition-opacity"
        >
          Pro
        </button>
        
        {/* User Profile */}
        <div className="relative ml-1" ref={profileRef}>
          <ProfileButton 
            name={userName} 
            onClick={() => setIsProfileOpen(!isProfileOpen)} 
          />

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-up">
              <div className="py-1.5">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-1">
                   <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userName}</p>
                   <p className="text-xs text-gray-500 truncate">user@askk.ai</p>
                </div>
                
                <button 
                  onClick={() => {
                    setIsToolsModalOpen(true);
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3"
                >
                  <Blocks className="w-4 h-4 text-gray-400" />
                  Integrations
                </button>
                
                <SettingsDropdownItem onClick={() => {
                    onOpenSettings();
                    setIsProfileOpen(false);
                }} />

                <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                
                <button 
                  onClick={() => {
                    onOpenLogout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};