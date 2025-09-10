import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import Alert from './Alert';
import Loading from './Loading';

const VerifyResetCode = ({ username, onBack, onCodeVerified }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.verifyResetCode({ username, code });
      onCodeVerified(username, code);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid reset code');
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Enter Reset Code</h2>
            <p className="text-gray-300">We sent a 6-digit code to your email. Enter it below.</p>
          </div>

          {error && <Alert type="error" message={error} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reset Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="XXXXXX"
                className="w-full text-center text-2xl font-mono tracking-widest py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                required
                style={{ letterSpacing: '0.5em' }}
              />
              <p className="text-sm text-gray-400 mt-2 text-center">Code expires in 15 minutes</p>
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
      <span>Verify Code</span>                      {/* text */}
    </>
  )}
</motion.button>

          </form>

          <div className="mt-6 text-center">
            <button onClick={onBack} className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2 mx-auto">
              <ArrowLeft size={20} /> Back
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyResetCode;
