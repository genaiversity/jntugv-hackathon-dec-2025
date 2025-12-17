import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, BarChart3 } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">T40</span>
            </div>
            <span>TEAM-40</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex gap-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${
                isActive('/')
                  ? 'bg-white/30 border-2 border-white'
                  : 'hover:bg-white/20'
              }`}
            >
              <Home className="w-4 h-4" />
              Courses
            </Link>
            <Link
              to="/post-job"
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${
                isActive('/post-job')
                  ? 'bg-white/30 border-2 border-white'
                  : 'hover:bg-white/20'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Post Job
            </Link>
            <Link
              to="/curriculum-updates"
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${
                isActive('/curriculum-updates')
                  ? 'bg-white/30 border-2 border-white'
                  : 'hover:bg-white/20'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Updates
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
