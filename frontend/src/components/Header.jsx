import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLandingPage = location.pathname === '/';
  const showMarketingLinks = !isAuthenticated && isLandingPage;
  const showAuthLinks = isAuthenticated;

  const uploadPath = user?.role === 'faculty' ? '/faculty/upload' : '/student/upload';
  const historyPath = user?.role === 'faculty' ? '/faculty/history' : '/student/history';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link
          to="/"
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-white">CN</span>
          </div>
          <span className="text-xl font-bold text-white">CodeNest</span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center space-x-8">
          {showMarketingLinks && (
            <>
              <Link to="/features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
              <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
              <Link to="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link>
              <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
              <Link to="/faculty-dashboard" className="text-gray-300 hover:text-white transition-colors">Faculty</Link>
              <Link to="/student-dashboard" className="text-gray-300 hover:text-white transition-colors">Student</Link>
            </>
          )}
          {showAuthLinks && (
            <>
              <Link to={uploadPath} className="text-gray-300 hover:text-white transition-colors">Upload</Link>
              <Link to={historyPath} className="text-gray-300 hover:text-white transition-colors">History</Link>
              <Link to="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-300 hover:text-white focus:outline-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Conditional User Info and Login/Logout (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link to="/profile"> 
                <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <User className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-white font-medium">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full capitalize font-medium">
                    {user?.role}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <button className="px-6 py-2 text-gray-300 hover:text-white font-medium transition duration-200">
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200">
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Collapsible Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900">
          <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
            {/* Authenticated links */}
            {showAuthLinks && (
              <div className="flex flex-col space-y-3">
                <Link onClick={() => setMobileOpen(false)} to={uploadPath} className="text-gray-300 hover:text-white transition-colors">Upload</Link>
                <Link onClick={() => setMobileOpen(false)} to={historyPath} className="text-gray-300 hover:text-white transition-colors">History</Link>
                <Link onClick={() => setMobileOpen(false)} to="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link>
              </div>
            )}

            {/* Marketing links on landing */}
            {showMarketingLinks && (
              <div className="flex flex-col space-y-3">
                <Link onClick={() => setMobileOpen(false)} to="/features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
                <Link onClick={() => setMobileOpen(false)} to="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
                <Link onClick={() => setMobileOpen(false)} to="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link>
                <Link onClick={() => setMobileOpen(false)} to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
                <Link onClick={() => setMobileOpen(false)} to="/faculty-dashboard" className="text-gray-300 hover:text-white transition-colors">Faculty</Link>
                <Link onClick={() => setMobileOpen(false)} to="/student-dashboard" className="text-gray-300 hover:text-white transition-colors">Student</Link>
              </div>
            )}

            {/* Auth actions */}
            <div className="pt-2 border-t border-white/10">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <Link onClick={() => setMobileOpen(false)} to="/profile" className="flex items-center space-x-2 text-gray-300 hover:text-white">
                    <User className="w-4 h-4" />
                    <span className="text-sm">
                      {user?.first_name} {user?.last_name}
                    </span>
                    <span className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full capitalize">
                      {user?.role}
                    </span>
                  </Link>
                  <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Link onClick={() => setMobileOpen(false)} to="/login" className="px-4 py-2 text-gray-300 hover:text-white font-medium">Sign In</Link>
                  <Link onClick={() => setMobileOpen(false)} to="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700">Get Started</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;