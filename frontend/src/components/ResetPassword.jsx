import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Alert from './Alert';
import Loading from './Loading';

const ResetPassword = ({ username, code, onBack }) => {
  const [formData, setFormData] = useState({ new_password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.new_password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    if (formData.new_password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword({
        username,
        code,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });

      setSuccess(response.data.message);
      setTimeout(() => {
        navigate('/login', { state: { message: '🎉 Password reset successfully! Please login with your new password.' } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const fadeInUp = { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: "easeOut" } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      {/* Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/10 rounded-full blur-xl opacity-70 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200/10 rounded-full blur-xl opacity-70 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-200/10 rounded-full blur-xl opacity-70 animate-pulse" />
      </div>

      <motion.div {...fadeInUp} className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
            <p className="text-gray-300">Choose a strong password for your account</p>
          </div>

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm password"
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-400 bg-white/5 border border-white/10 p-3 rounded-lg">
              <p className="font-medium mb-1">Password requirements:</p>
              <ul className="text-xs space-y-1">
                <li className={formData.new_password.length >= 6 ? 'text-green-400' : 'text-gray-500'}>✓ At least 6 characters long</li>
                <li className={formData.new_password === formData.confirm_password && formData.new_password ? 'text-green-400' : 'text-gray-500'}>✓ Passwords match</li>
              </ul>
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
      {/* <LogIn size={20} className="shrink-0" /> icon */}
      <span>Reset Password</span>                      {/* text */}
    </>
  )}
</motion.button>

          </form>

          {onBack && (
            <div className="mt-6 text-center">
              <button onClick={onBack} className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2 mx-auto">
                <ArrowLeft size={20} /> Back
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
