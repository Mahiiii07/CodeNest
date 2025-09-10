// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock } from 'lucide-react';
import Alert from '../components/Alert';
import ForgotPassword from '../components/ForgotPassword';
import VerifyResetCode from '../components/VerifyResetCode';
import ResetPassword from '../components/ResetPassword';
import Loading from '../components/Loading';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [forgotPasswordStep, setForgotPasswordStep] = useState(null);
  const [resetUsername, setResetUsername] = useState('');
  const [resetCode, setResetCode] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(credentials);
    if (result.success) {
      navigate(result.user.role === 'faculty' ? '/faculty' : '/student');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Forgot password handlers
  const handleForgotPasswordClick = () => {
    setForgotPasswordStep('request');
    setError('');
  };
  const handleBackToLogin = () => {
    setForgotPasswordStep(null);
    setResetUsername('');
    setResetCode('');
    setError('');
  };
  const handleCodeSent = (username) => {
    setResetUsername(username);
    setForgotPasswordStep('verify');
  };
  const handleCodeVerified = (username, code) => {
    setResetUsername(username);
    setResetCode(code);
    setForgotPasswordStep('reset');
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  // Render forgot password flow
  if (forgotPasswordStep === 'request') {
    return <ForgotPassword onBack={handleBackToLogin} onCodeSent={handleCodeSent} />;
  }
  if (forgotPasswordStep === 'verify') {
    return <VerifyResetCode username={resetUsername} onBack={handleBackToLogin} onCodeVerified={handleCodeVerified} />;
  }
  if (forgotPasswordStep === 'reset') {
    return <ResetPassword username={resetUsername} code={resetCode} onBack={handleBackToLogin} />;
  }

  // ✅ NEW LOGIN FORM THEME (same as Register.jsx)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
      </div>

      <motion.div {...fadeInUp} className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to your CodeNest account</p>
          </div>

          {successMessage && (
            <Alert type="success" message={successMessage} onClose={() => navigate(location.pathname, { replace: true })} />
          )}
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
              >
                Forgot your password?
              </button>
            </div>

            <motion.button
  type="submit"
  disabled={loading}
  className="w-full flex items-center justify-center gap-2 
             bg-gradient-to-r from-blue-600 to-purple-600 text-white 
             py-3 px-6 rounded-lg font-medium 
             hover:from-blue-700 hover:to-purple-700 
             focus:outline-none focus:ring-2 focus:ring-blue-500 
             focus:ring-offset-2 focus:ring-offset-slate-900 
             disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  {loading ? (
    <Loading />
  ) : (
    <>
      <span>Sign In</span>                      
    </>
  )}
</motion.button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
