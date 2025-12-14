import React from 'react';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

export interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  onClick: () => void;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-2.5-flash', // Using flash as pro fallback for stability/speed in demo
  PLUS = 'gemini-2.5-flash'
}

export interface SidebarSection {
  title: string;
  items: { id: string; label: string; icon?: React.ElementType }[];
}
