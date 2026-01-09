
import React, { useState } from 'react';
import { User } from '../types';
import { Zap, Mail, Lock, User as UserIcon, BookOpen, ArrowRight, Loader2, GraduationCap } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    college: '',
    year: '1st Year'
  });

  const validate = () => {
      // Email validation
      if (!formData.email.trim()) {
          setError('Email is required');
          return false;
      }
      const emailRegex = /^[^\s@]+@gmail\.com$/;
      if (!emailRegex.test(formData.email.trim())) {
          setError('Email must be a valid @gmail.com address');
          return false;
      }
      
      // Password validation
      if (!formData.password.trim()) {
          setError('Password is required');
          return false;
      }
      if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
      }
      
      // Signup specific validations
      if (!isLogin) {
          if (!formData.name.trim()) {
              setError('Full name is required');
              return false;
          }
          if (formData.name.trim().length < 2) {
              setError('Name must be at least 2 characters');
              return false;
          }
          if (!formData.college.trim()) {
              setError('College name is required');
              return false;
          }
      }
      
      return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;
    
    setLoading(true);

    // Simulate Network Delay and Persistent Storage Logic
    setTimeout(() => {
        setLoading(false);
        
        const existingUsersStr = localStorage.getItem('eduBridgeUsers');
        const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];

        if (isLogin) {
            // LOGIN LOGIC: Verify against stored users
            const foundUser = existingUsers.find((u: any) => u.email === formData.email && u.password === formData.password);
            
            if (foundUser) {
                 const user: User = {
                    name: foundUser.name,
                    email: foundUser.email,
                    college: foundUser.college,
                    year: foundUser.year
                };
                // Clear form and redirect
                setFormData({ email: '', password: '', name: '', college: '', year: '1st Year' });
                setIsSuccess(true);
                // Call onLogin immediately to trigger redirect
                onLogin(user);
            } else {
                setError('Invalid email or password. Please try again or Sign Up if you are new.');
            }
        } else {
            // SIGNUP LOGIC: Store new user
            const userExists = existingUsers.some((u: any) => u.email === formData.email);
            if (userExists) {
                setError('User already exists. Please Log In.');
            } else {
                const newUser = { ...formData };
                localStorage.setItem('eduBridgeUsers', JSON.stringify([...existingUsers, newUser]));
                
                const user: User = {
                    name: formData.name,
                    email: formData.email,
                    college: formData.college,
                    year: formData.year
                };
                // Clear form and redirect
                setFormData({ email: '', password: '', name: '', college: '', year: '1st Year' });
                setIsSuccess(true);
                // Call onLogin immediately to trigger redirect
                onLogin(user);
            }
        }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl flex max-w-4xl w-full overflow-hidden border border-slate-200">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          {/* LOGO SECTION */}
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <GraduationCap className="h-6 w-6 text-white" />
             </div>
             <span className="text-2xl font-bold text-slate-800 tracking-tight">EduBridge</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="text-slate-500 mb-8">
            {isLogin 
                ? 'Enter your credentials to access your dashboard.' 
                : 'Join thousands of engineering students bridging the skill gap.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSuccess && (
                <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span> {isLogin ? 'Login successful! Redirecting...' : 'Account created! Redirecting...'}
                </div>
            )}
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> {error}
                </div>
            )}

            {!isLogin && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <input 
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="pl-10 w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">College</label>
                            <div className="relative">
                                <BookOpen className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input 
                                    type="text"
                                    value={formData.college}
                                    onChange={e => setFormData({...formData, college: e.target.value})}
                                    className="pl-10 w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                                    placeholder="IIT/NIT/Other"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                             <select 
                                value={formData.year}
                                onChange={e => setFormData({...formData, year: e.target.value})}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                             >
                                <option>1st Year</option>
                                <option>2nd Year</option>
                                <option>3rd Year</option>
                                <option>4th Year</option>
                             </select>
                        </div>
                    </div>
                </>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input 
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="pl-10 w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                        placeholder="student@gmail.com"
                        required
                    />
                </div>
                <p className="text-xs text-slate-400 mt-1">Must be a valid @gmail.com address</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input 
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="pl-10 w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                        placeholder="••••••"
                        required
                    />
                </div>
                 <p className="text-xs text-slate-400 mt-1">Min. 6 characters</p>
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                    <>
                        {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="h-5 w-5" />
                    </>
                )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"} {' '}
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); setIsSuccess(false); }}
                className="text-indigo-600 font-semibold hover:underline"
            >
                {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        {/* Right Side - Decorative */}
        <div className="hidden md:block w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 text-white flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 h-full flex flex-col justify-center">
                <h3 className="text-3xl font-bold mb-4">Tech Accelerator</h3>
                <p className="text-indigo-100 mb-8 text-lg leading-relaxed">
                    Compare your skills with Google, Amazon, and Microsoft hiring trends. Get a personalized roadmap to your dream job.
                </p>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold">Real-time Trends</p>
                            <p className="text-xs text-indigo-200">Updated weekly from top MNCs</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold">AI Mentorship</p>
                            <p className="text-xs text-indigo-200">24/7 doubt clearing & guidance</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
