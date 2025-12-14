import { 
  MessageSquare, 
} from 'lucide-react';
import { SidebarSection } from './types.ts';

export const INITIAL_SUGGESTIONS = [
  "✉️ Send an email",
  "📄 Generate a PDF",
  "📅 Schedule a meeting",
  "💬 Send a Slack message"
];

export const SIDEBAR_NAVIGATION = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
];

export const HISTORY_SECTIONS: SidebarSection[] = [
  {
    title: 'Today',
    items: [
      { id: 'h1', label: 'Drafting Internship Email' },
      { id: 'h2', label: 'Meeting Schedule Query' },
    ]
  },
  {
    title: 'Yesterday',
    items: [
      { id: 'h3', label: 'Project Deadlines PDF' },
      { id: 'h4', label: 'Slack Announcements' },
    ]
  },
  {
    title: 'Previous 7 days',
    items: [
      { id: 'h5', label: 'Weekly Team Update' },
      { id: 'h6', label: 'React Component Help' },
    ]
  }
];