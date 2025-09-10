import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileText, ArrowRight, Calendar, Code, User, Cpu, BarChart3, Layers } from 'lucide-react';
import { analysisAPI } from '../services/api';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

const StudentUploadPage = () => {
  const [uploadForm, setUploadForm] = useState({
    project_name: '',
    zip_file: null,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentProjects();
  }, []);

  const fetchRecentProjects = async () => {
    try {
      const response = await analysisAPI.getRecentProjects();
      setRecentProjects(response.data.recent_projects);
    } catch (err) {
      console.error('Failed to fetch recent projects:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadForm({ ...uploadForm, zip_file: file });
    if (!uploadForm.project_name && file) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadForm(prev => ({ ...prev, project_name: nameWithoutExt, zip_file: file }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('zip_file', uploadForm.zip_file);
    formData.append('project_name', uploadForm.project_name);

    try {
      const response = await analysisAPI.analyzeProject(formData);
      setSuccess('Project analyzed successfully!');
      const projectId = response.data.project_id;
      navigate(`/student/results/${projectId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed');
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
        project_name: uploadForm.project_name || file.name.replace(/\.[^/.]+$/, '')
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
              className="inline-flex items-center px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <User className="h-4 w-4 mr-2" />
              Student Dashboard
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Project{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Analysis
              </span>{' '}
              Hub
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Upload your project to get detailed tech stack analysis and insights
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
                <Code className="h-6 w-6 mr-3 text-purple-400" />
                Upload Your Project
              </h2>

              {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}
              {success && <Alert type="success" message={success} onClose={() => setSuccess('')} className="mb-6" />}

              <form onSubmit={handleUploadSubmit} className="space-y-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={uploadForm.project_name}
                    onChange={(e) => setUploadForm({ ...uploadForm, project_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                    placeholder="e.g., My React Portfolio"
                    required
                  />
                </div>

                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragOver
                      ? 'border-purple-400 bg-purple-500/10'
                      : 'border-white/20 hover:border-white/30'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white mb-2">
                        Drop your project ZIP file here
                      </p>
                      <p className="text-sm text-gray-400">
                        Supports ZIP files containing your source code
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="hidden"
                      id="project-upload"
                      required
                    />
                    <label
                      htmlFor="project-upload"
                      className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition duration-200 cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                </div>

                {uploadForm.zip_file && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4"
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-purple-400 mr-3" />
                      <div>
                        <p className="text-purple-300 font-medium">{uploadForm.zip_file.name}</p>
                        <p className="text-purple-400 text-sm">
                          {(uploadForm.zip_file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading || !uploadForm.zip_file}
                  className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Cpu className="h-5 w-5 mr-2" />
                      Analyze Project
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
              {/* Analysis Features */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
                  What You'll Get
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    Tech stack detection
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    Libraries & frameworks
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                    Project structure analysis
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    Detailed file statistics
                  </li>
                </ul>
              </div>

              {/* Recent Projects */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-green-400" />
                  Recent Projects
                </h3>

                {recentProjects.length > 0 ? (
                  <div className="space-y-4">
                    {recentProjects.slice(0, 2).map((project) => (
                      <motion.div
                        key={project.id}
                        className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => navigate(`/student/results/${project.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white truncate">{project.project_name}</h4>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {project.tech_stack.slice(0, 2).map((tech, index) => (
                            <span key={index} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                              {tech}
                            </span>
                          ))}
                          {project.tech_stack.length > 2 && (
                            <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-300 rounded">
                              +{project.tech_stack.length - 2}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(project.uploaded_at).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Layers className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No projects yet</p>
                    <p className="text-gray-500 text-xs">Upload your first project to get started with CodeNest!</p>
                  </div>
                )}

                <motion.button
                  onClick={() => navigate('/student/history')}
                  className="w-full mt-4 px-4 py-2 text-sm text-purple-400 hover:text-purple-300 border border-purple-400/20 hover:border-purple-400/40 rounded-lg transition duration-200"
                  whileHover={{ scale: 1.02 }}
                >
                  View All Projects
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudentUploadPage;
