import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileText, ArrowRight, Calendar, Users, AlertTriangle, Eye, Cloud, Zap, Shield } from 'lucide-react';
import { plagiarismAPI } from '../services/api';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

const FacultyUploadPage = () => {
  const [uploadForm, setUploadForm] = useState({
    batch_name: '',
    topic: '',
    zip_file: null,
  });
  const [recentBatches, setRecentBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentBatches();
  }, []);

  const fetchRecentBatches = async () => {
    try {
      const response = await plagiarismAPI.getRecentBatches();
      setRecentBatches(response.data.recent_batches?.slice(0, 2) || []);
    } catch (err) {
      console.error('Failed to fetch recent batches:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadForm({ ...uploadForm, zip_file: file });
    if (!uploadForm.batch_name && file) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadForm(prev => ({ ...prev, batch_name: nameWithoutExt, zip_file: file }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('zip_file', uploadForm.zip_file);
    formData.append('batch_name', uploadForm.batch_name);
    formData.append('topic', uploadForm.topic);

    try {
      const response = await plagiarismAPI.batchCheck(formData);
      setSuccess('Batch processed successfully!');
      const batchId = response.data.batch_id;
      navigate(`/faculty/results/${batchId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      setUploadForm({
        ...uploadForm,
        zip_file: file,
        batch_name: uploadForm.batch_name || file.name.replace(/\.[^/.]+$/, '')
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 py-8">
        <motion.div {...fadeInUp} className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full text-blue-300 text-sm font-medium mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <Users className="h-4 w-4 mr-2" />
              Faculty Dashboard
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Batch{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Plagiarism
              </span>{' '}
              Analysis
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Upload student projects for similarity analysis using CodeNest's advanced ML algorithms
            </p>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <motion.div 
            {...fadeInUp}
            className="lg:col-span-2"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Cloud className="h-6 w-6 mr-3 text-blue-400" />
                Upload Student Projects
              </h2>

              {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}
              {success && <Alert type="success" message={success} onClose={() => setSuccess('')} className="mb-6" />}

              <form onSubmit={handleUploadSubmit} className="space-y-6">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragOver
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-white/20 hover:border-white/30'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white mb-2">
                        Drop your ZIP file here or click to browse
                      </p>
                      <p className="text-sm text-gray-400">
                        Supports ZIP files containing multiple student projects
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="hidden"
                      id="zip-upload"
                      required
                    />
                    <label
                      htmlFor="zip-upload"
                      className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200 cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                </div>

                {uploadForm.zip_file && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-green-400 mr-3" />
                      <div>
                        <p className="text-green-300 font-medium">{uploadForm.zip_file.name}</p>
                        <p className="text-green-400 text-sm">
                          {(uploadForm.zip_file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Batch Name
                    </label>
                    <input
                      type="text"
                      value={uploadForm.batch_name}
                      onChange={(e) => setUploadForm({ ...uploadForm, batch_name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder="e.g., Data Structures Assignment 1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Topic/Subject
                    </label>
                    <input
                      type="text"
                      value={uploadForm.topic}
                      onChange={(e) => setUploadForm({ ...uploadForm, topic: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder="e.g., Computer Science"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading || !uploadForm.zip_file}
                  className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Analyze for Plagiarism
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
            <div className="space-y-6">
              {/* Features */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-purple-400" />
                  Analysis Features
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    ML-powered similarity detection
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    Code structure analysis
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                    Comprehensive reporting
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    Batch processing support
                  </li>
                </ul>
              </div>

              {/* Recent Batches */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-green-400" />
                  Recent Batches
                </h3>

                {recentBatches.length > 0 ? (
                  <div className="space-y-4">
                    {recentBatches.map((batch) => (
                      <motion.div
                        key={batch.id}
                        className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => navigate(`/faculty/results/${batch.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white truncate">{batch.batch_name}</h4>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{batch.topic || 'No topic'}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            {batch.total_projects} projects
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            batch.plagiarism_percentage > 50
                              ? 'bg-red-500/20 text-red-400'
                              : batch.plagiarism_percentage > 25
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {batch.plagiarism_percentage}% flagged
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No batches yet</p>
                    <p className="text-gray-500 text-xs">Upload your first batch to get started!</p>
                  </div>
                )}

                <motion.button
                  onClick={() => navigate('/faculty/history')}
                  className="w-full mt-4 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-400/20 hover:border-blue-400/40 rounded-lg transition duration-200"
                  whileHover={{ scale: 1.02 }}
                >
                  View All Batches
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FacultyUploadPage;
