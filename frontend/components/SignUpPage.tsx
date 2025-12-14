import React, { useState } from 'react';
import { Zap, Eye, EyeOff, Moon, Sun, ArrowRight, Mail, Lock, User } from 'lucide-react';

interface SignUpPageProps {
  onSignUp: (name: string, email: string) => void;
  onSwitchToLogin: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onSwitchToLogin, isDarkMode, toggleTheme }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Static signup - just proceed
    onSignUp(name || 'New User', email || 'user@askk.ai');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gray-50 dark:bg-[#0f0f10]">
      
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create an account</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Start your intelligent workspace journey
          </p>
        </div>

        {/* Form */}
        <div className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#161618] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#161618] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                  placeholder="Create a password"
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

            {/* Login Link */}
            <div className="flex justify-end pt-2 pb-1">
                 <button 
                   type="button" 
                   onClick={onSwitchToLogin} 
                   className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline focus:outline-none transition-colors"
                 >
                    Already have an account? Log in
                 </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
            >
              Create Account <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#1c1c1e] px-2 text-gray-500">Or sign up with</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#161618] hover:bg-gray-100 dark:hover:bg-[#202022] border border-gray-200 dark:border-white/10 rounded-xl transition-colors text-sm font-medium text-gray-700 dark:text-gray-200">
              Google
            </button>
            <button type="button" className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#161618] hover:bg-gray-100 dark:hover:bg-[#202022] border border-gray-200 dark:border-white/10 rounded-xl transition-colors text-sm font-medium text-gray-700 dark:text-gray-200">
              GitHub
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By creating an account you agree to our <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms</a> & <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>
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