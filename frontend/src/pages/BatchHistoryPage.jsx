import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar, 
  Users,
  AlertTriangle,
  FileText,
  Eye,
  Upload,
  TrendingUp
} from 'lucide-react';
import { plagiarismAPI } from '../services/api';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

const BatchHistoryPage = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, [currentPage]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await plagiarismAPI.getBatches(currentPage);
      
      if (response.data.results) {
        setBatches(response.data.results.batches);
        setHasNext(!!response.data.next);
        setHasPrev(!!response.data.previous);
        setTotalPages(Math.ceil(response.data.count / 12));
      } else {
        setBatches(response.data.batches);
      }
    } catch (err) {
      setError('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.batch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlagiarismStatus = (percentage) => {
    if (percentage > 70) return { text: 'High Risk', color: 'text-red-400', bg: 'bg-red-500/20', icon: 'bg-red-500' };
    if (percentage > 40) return { text: 'Medium Risk', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: 'bg-yellow-500' };
    return { text: 'Low Risk', color: 'text-green-400', bg: 'bg-green-500/20', icon: 'bg-green-500' };
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  if (loading && batches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div {...fadeInUp} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/faculty/upload')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              <div>
                <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 rounded-full text-blue-300 text-sm font-medium mb-2">
                  <Users className="h-4 w-4 mr-2" />
                  Faculty Dashboard
                </div>
                <h1 className="text-3xl font-bold text-white">Batch History</h1>
                <p className="text-gray-300">View all your analyzed batches and CodeNest Results</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/faculty/upload')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200 flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New Batch</span>
            </button>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search batches or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              />
            </div>
          </div>
        </motion.div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Batches Grid */}
        {filteredBatches.length === 0 ? (
          <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? 'No matching batches found' : 'No batches yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Upload your first batch to get started with CodeNest!'
              }
            </p>
            <button 
              onClick={() => navigate('/faculty/upload')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200"
            >
              Upload Batch
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBatches.map((batch, index) => {
                // Use summary.similarity_percentage if available (from Batch Result page), fallback to existing field
                const similarity = (batch.summary && typeof batch.summary.similarity_percentage === 'number')
                  ? batch.summary.similarity_percentage
                  : (typeof batch.plagiarism_percentage === 'number' ? batch.plagiarism_percentage : 0);
                const status = getPlagiarismStatus(similarity || 0);
                return (
                  <motion.div 
                    key={batch.id} 
                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    {/* Batch Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate" title={batch.batch_name}>
                          {batch.batch_name}
                        </h3>
                        <p className="text-sm text-gray-400 truncate mt-1" title={batch.topic}>
                          {batch.topic}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500 ml-2">
                        #{batch.id}
                      </span>
                    </div>

                    {/* Upload Date */}
                    <div className="flex items-center text-sm text-gray-400 mb-4">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(batch.uploaded_at).toLocaleDateString()}
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Users className="w-4 h-4 text-blue-400 mr-1" />
                          <span className="text-2xl font-bold text-blue-400">
                            {batch.total_projects || 0}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Projects</p>
                      </div>
                      
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <AlertTriangle className="w-4 h-4 text-red-400 mr-1" />
                          <span className="text-2xl font-bold text-red-400">
                            {batch.plagiarism_cases || 0}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Flagged</p>
                      </div>
                    </div>

                    {/* Similarity Rate (aligned with Batch Result page) */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Similarity Rate</span>
                        <span className={`text-sm font-semibold ${status.color}`}>
                          {similarity || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            similarity > 70 ? 'bg-red-500' :
                            similarity > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(similarity || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${status.icon}`}></div>
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full font-medium">
                        {batch.status || 'Completed'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/faculty/results/${batch.id}`)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Results</span>
                      </button>
                      
                      <button
                        onClick={() => navigate(`/faculty/results/${batch.id}`)}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
                        title="View detailed analysis"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div {...fadeInUp} transition={{ delay: 0.3 }} className="flex items-center justify-center space-x-4 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!hasPrev}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!hasNext}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  Next
                </button>
              </motion.div>
            )}
          </>
        )}

        {/* Summary Statistics */}
        {filteredBatches.length > 0 && (
          <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className="mt-12 pt-8 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {filteredBatches.length}
                </div>
                <div className="text-sm text-gray-400">Total Batches</div>
              </div>
              
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {filteredBatches.reduce((sum, batch) => sum + (batch.total_projects || 0), 0)}
                </div>
                <div className="text-sm text-gray-400">Projects Analyzed</div>
              </div>
              
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-red-400 mb-2">
                  {filteredBatches.reduce((sum, batch) => sum + (batch.plagiarism_cases || 0), 0)}
                </div>
                <div className="text-sm text-gray-400">Cases Detected</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BatchHistoryPage;