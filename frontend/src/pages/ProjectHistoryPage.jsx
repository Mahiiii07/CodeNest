import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar, 
  Code, 
  FileText, 
  Eye, 
  Upload,
  User,
  Layers
} from 'lucide-react';
import { analysisAPI } from '../services/api';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

const ProjectHistoryPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [currentPage]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await analysisAPI.getProjects(currentPage);
      
      if (response.data.results) {
        setProjects(response.data.results.projects);
        setHasNext(!!response.data.next);
        setHasPrev(!!response.data.previous);
        setTotalPages(Math.ceil(response.data.count / 12));
      } else {
        setProjects(response.data.projects);
      }
    } catch (err) {
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.tech_stack?.some(tech => 
      tech.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const TechStackBadge = ({ tech }) => {
    const colorMap = {
      'Python': 'bg-green-500/20 text-green-300',
      'JavaScript': 'bg-yellow-500/20 text-yellow-300',
      'React': 'bg-blue-500/20 text-blue-300',
      'Django': 'bg-green-500/20 text-green-300',
      'HTML': 'bg-orange-500/20 text-orange-300',
      'CSS': 'bg-purple-500/20 text-purple-300',
      'Node.js': 'bg-green-500/20 text-green-300',
      'TypeScript': 'bg-blue-500/20 text-blue-300',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        colorMap[tech] || 'bg-gray-500/20 text-gray-300'
      }`}>
        {tech}
      </span>
    );
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  if (loading && projects.length === 0) {
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
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div {...fadeInUp} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/student/upload')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              <div>
                <div className="inline-flex items-center px-3 py-1 bg-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-2">
                  <User className="h-4 w-4 mr-2" />
                  Student Dashboard
                </div>
                <h1 className="text-3xl font-bold text-white">Project History</h1>
                <p className="text-gray-300">View all your analyzed projects</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/student/upload')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition duration-200 flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New Project</span>
            </button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects or technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
              />
            </div>
          </div>
        </motion.div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="text-center py-12">
            <Layers className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? 'No matching projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Upload your first project to get started!'
              }
            </p>
            <button 
              onClick={() => navigate('/student/upload')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition duration-200"
            >
              Upload Project
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300 cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/student/results/${project.id}`)}
                >
                  {/* Project Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate" title={project.project_name}>
                        {project.project_name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(project.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Tech Stack */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack && project.tech_stack.length > 0 ? (
                        <>
                          {project.tech_stack.slice(0, 3).map((tech, techIndex) => (
                            <TechStackBadge key={techIndex} tech={tech} />
                          ))}
                          {project.tech_stack.length > 3 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                              +{project.tech_stack.length - 3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No tech stack detected</span>
                      )}
                    </div>
                  </div>

                  {/* File Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <div className="text-lg font-bold text-blue-400">
                        {project.file_stats?.total_files || 0}
                      </div>
                      <p className="text-xs text-gray-400">Total Files</p>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <div className="text-lg font-bold text-purple-400">
                        {project.file_stats?.code_files || 0}
                      </div>
                      <p className="text-xs text-gray-400">Code Files</p>
                    </div>
                  </div>

                  {/* View Button */}
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition duration-200 flex items-center justify-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>View Analysis</span>
                  </button>
                </motion.div>
              ))}
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
        {filteredProjects.length > 0 && (
          <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className="mt-12 pt-8 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {filteredProjects.length}
                </div>
                <div className="text-sm text-gray-400">Total Projects</div>
              </div>
              
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {filteredProjects.reduce((sum, project) => {
                    const uniqueTech = new Set(project.tech_stack || []);
                    return sum + uniqueTech.size;
                  }, 0)}
                </div>
                <div className="text-sm text-gray-400">Technologies Used</div>
              </div>
              
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-cyan-400 mb-2">
                  {filteredProjects.reduce((sum, project) => sum + (project.file_stats?.total_files || 0), 0)}
                </div>
                <div className="text-sm text-gray-400">Files Analyzed</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectHistoryPage;
