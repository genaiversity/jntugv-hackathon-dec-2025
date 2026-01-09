
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart2, 
  BookOpen, 
  MessageSquare, 
  Briefcase, 
  Zap,
  Menu,
  X,
  Calendar,
  Beaker,
  Users,
  FileText,
  Mail,
  Speaker,
  LogOut,
  TrendingUp,
  GraduationCap,
  Moon,
  Sun,
  Camera
} from 'lucide-react';
import { View, User } from './types';
import Dashboard from './component/Dashboard';
import SkillGap from './component/SkillGap';
import Projects from './component/Projects';
import Mentor from './component/Mentor';
import Interview from './component/Interview';
import Trends from './component/Trends';
import Timetable from './component/Timetable';
import VirtualLab from './component/VirtualLab';
import PeerMatch from './component/PeerMatch';
import Notes from './component/Notes';
import ParentPortal from './component/ParentPortal';
import Auth from './component/Auth';
import TechAccelerator from './component/TechAccelerator';
import Scholar from './component/Scholar';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [cameraIndicatorOn, setCameraIndicatorOn] = useState<boolean>(() => {
    try { return localStorage.getItem('keep_camera_on') === 'true'; } catch (e) { return false; }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'keep_camera_on') {
        setCameraIndicatorOn(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Persistence Logic: Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('eduBridgeUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setCurrentView('dashboard'); // Ensure dashboard on mount if user exists
      } catch (e) {
        console.error("Failed to parse user from storage");
        localStorage.removeItem('eduBridgeUser');
      }
    }
  }, []);

  // Ensure dashboard view when user logs in
  useEffect(() => {
    if (user) {
      setCurrentView('dashboard');
    }
  }, [user]);

  // Screen Reader Logic for Blind Support
  useEffect(() => {
    if (blindMode && user) {
      const msg = new SpeechSynthesisUtterance(`Navigated to ${currentView.replace('-', ' ')}`);
      window.speechSynthesis.speak(msg);
    }
  }, [currentView, blindMode, user]);

  const toggleBlindMode = () => {
    const newState = !blindMode;
    setBlindMode(newState);
    const msg = new SpeechSynthesisUtterance(newState ? "Audio Guide Enabled" : "Audio Guide Disabled");
    window.speechSynthesis.speak(msg);
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setCurrentView('dashboard'); // Ensure dashboard view after login
    localStorage.setItem('eduBridgeUser', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem('eduBridgeUser');
  };

  const NavItem = ({ view, icon: Icon, label, highlight = false }: { view: View; icon: any; label: string; highlight?: boolean }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-600/30'
            : highlight
              ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
              : (darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')
        }`}
      >
        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : highlight ? 'text-yellow-600' : (darkMode ? 'text-slate-300' : 'text-slate-500')}`} />
        {label}
      </button>
    );
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out flex flex-col
        ${darkMode ? 'bg-slate-900 border-r border-slate-700' : 'bg-white border-r border-slate-200'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`p-6 flex items-center gap-2 shrink-0 ${darkMode ? 'border-b border-slate-700' : 'border-b border-slate-100'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 via-fuchsia-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-600">
              EduBridge
            </span>
            <button 
                className="ml-auto lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
            >
                <X className="h-5 w-5 text-slate-400" />
            </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            <div className={`text-xs font-semibold uppercase tracking-wider mb-2 px-4 mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Learning Hub
            </div>
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="tech-accelerator" icon={TrendingUp} label="Tech Accelerator" />
            <NavItem view="scholar" icon={GraduationCap} label="Scholar (IIT/NIT)" highlight={true} />
            <NavItem view="timetable" icon={Calendar} label="Smart Timetable" />
            <NavItem view="mentor" icon={MessageSquare} label="AI Mentor" />
            <NavItem view="lab" icon={Beaker} label="Industry Lab Guide" />
            <NavItem view="notes" icon={FileText} label="Notes Converter" />
            
            <div className={`text-xs font-semibold uppercase tracking-wider mb-2 px-4 mt-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Career & Network
            </div>
            <NavItem view="skill-gap" icon={BarChart2} label="Skill Gap" />
            <NavItem view="projects" icon={BookOpen} label="Project Gen" />
            <NavItem view="interview" icon={Briefcase} label="Mock Interview" />
            <NavItem view="peers" icon={Users} label="Peer Match" />
            <NavItem view="trends" icon={Zap} label="MNC Trends" />
            <NavItem view="parents" icon={Mail} label="Parent Portal" />
        </nav>

        <div className={`p-4 shrink-0 ${darkMode ? 'border-t border-slate-700' : 'border-t border-slate-100'}`}>
             <button 
                onClick={toggleBlindMode}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors mb-4 ${
                    blindMode ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
             >
                <Speaker className="h-4 w-4" /> {blindMode ? "Audio Guide ON" : "Audio Guide OFF"}
             </button>

             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-red-600 text-sm font-medium transition-colors"
             >
                <LogOut className="h-4 w-4" /> Sign Out
             </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className={`h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 ${darkMode ? 'bg-gradient-to-r from-rose-800 via-fuchsia-700 to-indigo-800 border-b border-slate-700' : 'bg-white border-b border-slate-200'}`}>
          <button 
            className="lg:hidden p-2 text-slate-500"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className={`hidden lg:flex items-center gap-2 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Engineering</span>
            <span>/</span>
            <span className={`font-medium capitalize ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{currentView.replace('-', ' ')}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className={`flex items-center gap-2 pr-4 ${darkMode ? 'border-r border-slate-700' : 'border-r border-slate-200'}`}>
                 {cameraIndicatorOn && (
                   <div className="flex items-center gap-2 mr-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs">
                     <Camera className="h-4 w-4" />
                     <span>Camera On</span>
                   </div>
                 )}
                 <div className="text-right hidden sm:block">
                    <p className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user.name}</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user.college} • {user.year}</p>
                 </div>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold border ${darkMode ? 'bg-gradient-to-br from-indigo-700 via-fuchsia-600 to-rose-600 text-white border-slate-600' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                    {user.name.charAt(0)}
                  </div>
            </div>
          </div>
        </header>

        <div className={`flex-1 overflow-auto p-4 lg:p-6 ${darkMode ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
          {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} user={user} />}
          {currentView === 'tech-accelerator' && <TechAccelerator onNavigate={setCurrentView} />}
          {currentView === 'scholar' && <Scholar />}
          {currentView === 'skill-gap' && <SkillGap />}
          {currentView === 'mentor' && <Mentor />}
          {currentView === 'projects' && <Projects />}
          {currentView === 'interview' && <Interview />}
          {currentView === 'trends' && <Trends />}
          {currentView === 'timetable' && <Timetable />}
          {currentView === 'lab' && <VirtualLab />}
          {currentView === 'peers' && <PeerMatch />}
          {currentView === 'notes' && <Notes />}
          {currentView === 'parents' && <ParentPortal />}
        </div>
      </main>
    </div>
  );
};

export default App;
//mndsjnckjsn
