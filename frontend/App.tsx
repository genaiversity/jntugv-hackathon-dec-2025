import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { InputArea } from './components/InputArea.tsx';
import { ToolsModal } from './components/ToolsModal.tsx';
import { TopNavigation } from './components/TopNavigation.tsx';
import { WelcomeScreen } from './components/WelcomeScreen.tsx';
import { ChatMessages } from './components/ChatMessages.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import { LogoutModal } from './components/LogoutModal.tsx';
import { ProModal } from './components/ProModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { SignUpPage } from './components/SignUpPage.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { Message, ModelType } from './types.ts';
import { streamChatResponse } from './services/geminiService.ts';
import { HISTORY_SECTIONS } from './constants.tsx';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // User Data State
  const [userName, setUserName] = useState('Mokshayagna Sai Kumar Gompa');
  const [userEmail, setUserEmail] = useState('user@askk.ai');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWelcomeScreen, setIsWelcomeScreen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentModel, setCurrentModel] = useState('Gemini 3 Pro');
  const [historySections, setHistorySections] = useState(HISTORY_SECTIONS);
  
  // Modal States
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [shareModalData, setShareModalData] = useState<{isOpen: boolean, itemId: string | null}>({
    isOpen: false,
    itemId: null
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for persisted login
  useEffect(() => {
    const stored = localStorage.getItem('askk_remember_me');
    if (stored) {
      try {
        const { email, name } = JSON.parse(stored);
        if (email) {
            setUserEmail(email);
            if (name) setUserName(name);
            setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Failed to parse remember me data");
        localStorage.removeItem('askk_remember_me');
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = async (text: string) => {
    if (isLoading) return;
    abortControllerRef.current = new AbortController();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setIsWelcomeScreen(false);
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: 'model',
      content: '', 
      timestamp: new Date()
    }]);

    try {
      await streamChatResponse(
        messages,
        text,
        ModelType.FLASH, 
        (chunk) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId 
              ? { ...msg, content: msg.content + chunk }
              : msg
          ));
        },
        abortControllerRef.current.signal
      );
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, content: msg.content + "\n[Error: " + (error.message || "Something went wrong") + "]", isError: true }
            : msg
        ));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setIsWelcomeScreen(true);
    setInputValue('');
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
  };

  const handleSidebarPromptSelect = (prompt: string) => {
    setInputValue(prompt);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleEdit = (text: string) => {
    setInputValue(text);
  };

  const handleRetry = (text: string) => {
    handleSendMessage(text);
  };

  const handleLogin = (email: string, name?: string) => {
    setUserEmail(email);
    if (name) setUserName(name);
    setIsAuthenticated(true);
  };

  const handleSignUp = (name: string, email: string) => {
    setUserName(name);
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('askk_remember_me');
    setIsLogoutModalOpen(false);
    setIsAuthenticated(false);
    setAuthMode('login');
    handleNewChat();
  };

  const handleDeleteHistoryItem = (itemId: string) => {
    setHistorySections(prev => 
      prev.map(section => ({
        ...section,
        items: section.items.filter(item => item.id !== itemId)
      })).filter(section => section.items.length > 0)
    );
  };

  const handleShareHistoryItem = (itemId: string) => {
    setShareModalData({ isOpen: true, itemId });
  };

  if (!isAuthenticated) {
    if (authMode === 'signup') {
      return (
        <SignUpPage 
          onSignUp={handleSignUp} 
          onSwitchToLogin={() => setAuthMode('login')}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      );
    }
    return (
      <LoginPage 
        onLogin={handleLogin} 
        onSwitchToSignUp={() => setAuthMode('signup')}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f0f10] text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Modals */}
      <ToolsModal 
        isOpen={isToolsModalOpen} 
        onClose={() => setIsToolsModalOpen(false)} 
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        userName={userName}
        userEmail={userEmail}
      />
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
      <ProModal 
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />
      <ShareModal 
        isOpen={shareModalData.isOpen}
        onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
        itemId={shareModalData.itemId}
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        activeNav={activeNav} 
        setActiveNav={setActiveNav}
        onNewChat={handleNewChat}
        onPromptSelect={handleSidebarPromptSelect}
        historySections={historySections}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onShareHistoryItem={handleShareHistoryItem}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-0'}`}>
        
        <TopNavigation 
          isWelcomeScreen={isWelcomeScreen}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          currentModel={currentModel}
          setCurrentModel={setCurrentModel}
          setIsToolsModalOpen={setIsToolsModalOpen}
          onMobileMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenLogout={() => setIsLogoutModalOpen(true)}
          onOpenPro={() => setIsProModalOpen(true)}
          userName={userName}
        />

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {isWelcomeScreen ? (
            <WelcomeScreen 
              onSuggestionClick={handleSuggestionClick}
            />
          ) : (
            <ChatMessages 
              messages={messages}
              isLoading={isLoading}
              onEdit={handleEdit}
              onRetry={handleRetry}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>

        {/* Bottom Input Area Container */}
        <div className="shrink-0 w-full px-4 md:px-6 pb-6 pt-2 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0f0f10] dark:via-[#0f0f10] dark:to-transparent">
          <div className="w-full max-w-5xl mx-auto">
            <InputArea 
              onSend={handleSendMessage} 
              onStop={handleStopGeneration}
              disabled={isLoading} 
              value={inputValue}
              isGenerating={isLoading}
            />
          </div>
        </div>

      </div>
    </div>
  );
}