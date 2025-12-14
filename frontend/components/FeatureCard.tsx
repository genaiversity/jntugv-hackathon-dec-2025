import React from 'react';
import { FeatureCardProps } from '../types.ts';

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, gradient, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl p-5 text-left h-full w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-white/5 bg-[#161618]"
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <div className={`mb-3 w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">{title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        
        {/* Decorative Sparkle */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="white" fillOpacity="0.5"/>
           </svg>
        </div>
      </div>
    </button>
  );
};