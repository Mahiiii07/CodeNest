import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, ArrowLeft, Send } from 'lucide-react';
import { authAPI } from '../services/api';
import Alert from './Alert';
import Loading from './Loading';

const ForgotPassword = ({ onBack, onCodeSent }) => {
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await authAPI.forgotPassword(formData);
      setSuccess(response.data.message);
      setTimeout(() => onCodeSent(formData.username), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/10 rounded-full blur-xl opacity-70 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200/10 rounded-full blur-xl opacity-70 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-200/10 rounded-full blur-xl opacity-70 animate-pulse" />
      </div>

      <motion.div {...fadeInUp} className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Forgot Password</h2>
            <p className="text-gray-300">Enter your username and email to receive a reset code</p>
          </div>

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
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
      <span>Send Reset Code</span>                      
    </>
  )}
</motion.button>

          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft size={20} /> Back to Login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
