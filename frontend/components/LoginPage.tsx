import React, { useState } from 'react';
import { Zap, Eye, EyeOff, Moon, Sun, ArrowRight, Mail, Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, name?: string) => void;
  onSwitchToSignUp: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToSignUp, isDarkMode, toggleTheme }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Static login - just proceed
    onLogin(email || 'user@askk.ai', 'Mokshayagna Sai Kumar Gompa');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gray-50 dark:bg-[#0f0f10]">
      
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Theme Toggle - Top Right */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors z-20"
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/20 border border-gray-200 dark:border-white/5 relative z-10 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-6">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Enter your credentials to access your workspace
          </p>
        </div>

        {/* Form */}
        <div className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#161618] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#161618] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* Simple Checkbox & Forgot Password */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot Password?</button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#1c1c1e] px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#161618] hover:bg-gray-100 dark:hover:bg-[#202022] border border-gray-200 dark:border-white/10 rounded-xl transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Google
            </button>
            <button type="button" className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#161618] hover:bg-gray-100 dark:hover:bg-[#202022] border border-gray-200 dark:border-white/10 rounded-xl transition-colors text-sm font-medium text-gray-700 dark:text-gray-200">
              GitHub
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Don't have an account? <button onClick={onSwitchToSignUp} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Sign up</button>
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer info */}
      <div className="absolute bottom-6 text-center text-[10px] text-gray-400 dark:text-gray-600 z-10">
        &copy; 2025 Askk AI Inc. All rights reserved.
      </div>
    </div>
  );
};