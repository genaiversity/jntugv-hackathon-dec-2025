import React from 'react';
import { X, Mail, MessageCircle, Calendar, FileText, MoreHorizontal, Zap } from 'lucide-react';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const tools = [
    { name: 'Gmail', icon: Mail, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { name: 'Slack', icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { name: 'Calendar', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Gemini', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { name: 'PDF Reader', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { name: 'More', icon: MoreHorizontal, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden transform transition-all scale-100">
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Integrated Tools</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <button key={tool.name} className="flex flex-col items-center justify-center p-6 rounded-xl border border-gray-100 dark:border-white/5 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all group">
              <div className={`w-12 h-12 rounded-full ${tool.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <tool.icon className={`w-6 h-6 ${tool.color}`} />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">{tool.name}</span>
            </button>
          ))}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-[#161618] text-center text-sm text-gray-500">
          Connect your favorite apps to enhance Rexie's capabilities.
        </div>
      </div>
    </div>
  );
};