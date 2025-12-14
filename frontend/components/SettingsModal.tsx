import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Plus, LogOut, Link } from 'lucide-react';
import { AccountIcon, NotificationIcon, SwitchAccountIcon, HelpIcon } from '../assets/settingsIcons.tsx';
import { ProfileButton } from './ProfileButton.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  userName: string;
  userEmail: string;
}

type View = 'main' | 'account' | 'notifications' | 'switch-account' | 'help';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  userName, 
  userEmail 
}) => {
  const [view, setView] = useState<View>('main');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false
  });

  if (!isOpen) return null;

  const handleBack = () => setView('main');

  const SettingRow = ({ icon: Icon, label, onClick, showArrow = true }: { icon: any, label: string, onClick?: () => void, showArrow?: boolean }) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2c2c2e] border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#161618] flex items-center justify-center group-hover:bg-white dark:group-hover:bg-white/10 transition-colors shadow-sm">
           <Icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-white transition-colors" />
        </div>
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
      </div>
      {showArrow && <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400" />}
    </button>
  );

  const Header = ({ title }: { title: string }) => (
     <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-[#1c1c1e]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
            {view !== 'main' && (
                <button onClick={handleBack} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
        </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden transform transition-all scale-100 flex flex-col h-[500px]">
        
        {view === 'main' && (
          <>
            <Header title="Settings" />
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
               <SettingRow icon={AccountIcon} label="Account" onClick={() => setView('account')} />
               <SettingRow icon={NotificationIcon} label="Notifications" onClick={() => setView('notifications')} />
               <SettingRow icon={SwitchAccountIcon} label="Switch Account" onClick={() => setView('switch-account')} />
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#161618]/50 mt-auto">
              <SettingRow icon={HelpIcon} label="Help" onClick={() => setView('help')} />
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Askk AI v1.2.0
                </p>
              </div>
            </div>
          </>
        )}

        {view === 'account' && (
           <>
             <Header title="Account" />
             <div className="p-6 flex flex-col items-center">
                <ProfileButton name={userName} onClick={() => {}} className="w-20 h-20 text-2xl mb-4 pointer-events-none" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{userName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{userEmail}</p>
                
                <div className="w-full space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</label>
                        <div className="w-full p-3 bg-gray-50 dark:bg-[#161618] rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-white">Free Plan</span>
                            <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Upgrade</button>
                        </div>
                    </div>
                </div>
             </div>
           </>
        )}

        {view === 'notifications' && (
           <>
             <Header title="Notifications" />
             <div className="p-4 space-y-4">
                {[
                    { id: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                    { id: 'push', label: 'Push Notifications', desc: 'Get notified in your browser' },
                    { id: 'marketing', label: 'Marketing Emails', desc: 'Receive offers and news' }
                ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#161618] rounded-xl border border-gray-100 dark:border-white/5">
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{item.label}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
                        </div>
                        <button 
                            onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof notifications] }))}
                            className={`w-11 h-6 rounded-full transition-colors relative ${notifications[item.id as keyof typeof notifications] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications[item.id as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                ))}
             </div>
           </>
        )}

        {view === 'switch-account' && (
           <>
             <Header title="Switch Account" />
             <div className="p-4 space-y-3">
                 <div className="p-4 bg-blue-50/50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ProfileButton name={userName} onClick={() => {}} className="w-10 h-10 pointer-events-none" />
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{userName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
                        </div>
                    </div>
                    <Check className="w-5 h-5 text-blue-600" />
                 </div>

                 <button className="w-full p-4 hover:bg-gray-50 dark:hover:bg-[#161618] rounded-xl border border-dashed border-gray-300 dark:border-white/10 flex items-center gap-3 text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2c2c2e] flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Add another account</span>
                 </button>

                 <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
                    <button className="w-full p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                        <LogOut className="w-4 h-4" />
                        Log out of all accounts
                    </button>
                 </div>
             </div>
           </>
        )}

        {view === 'help' && (
           <>
             <Header title="Help Center" />
             <div className="p-4 space-y-2">
                 {[
                     'Documentation',
                     'Keyboard Shortcuts',
                     'Privacy Policy',
                     'Terms of Service',
                     'Contact Support'
                 ].map((item) => (
                    <button key={item} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#161618] rounded-xl transition-colors group">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{item}</span>
                        <Link className="w-4 h-4 text-gray-400" />
                    </button>
                 ))}
             </div>
           </>
        )}

      </div>
    </div>
  );
};