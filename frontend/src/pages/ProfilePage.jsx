import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Edit3, Save, X, Upload, Calendar, BarChart3, FileText, Eye, ArrowLeft, MessageSquare } from 'lucide-react';
import { analysisAPI, plagiarismAPI, authAPI } from '../services/api';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

const ProfilePage = () => {
    const { user, updateUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // User data state
    const [profileData, setProfileData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        username: user?.username || ''
    });

    // User activity data
    const [userProjects, setUserProjects] = useState([]);
    const [userBatches, setUserBatches] = useState([]);
    const [userBlogs, setUserBlogs] = useState([]);
    const [activityStats, setActivityStats] = useState({
        totalProjects: 0,
        totalBatches: 0,
        totalBlogs: 0,
        lastActivity: null,
        joinedDate: user?.date_joined
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            fetchUserActivity();
            fetchUserBlogs();
            refetchUserProfile();
        }
    }, [isAuthenticated]);

    // Refresh data when window gets focus (after upload)
    useEffect(() => {
        const handleFocus = () => {
            if (isAuthenticated) {
                fetchUserActivity();
                fetchUserBlogs();
                refetchUserProfile();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [isAuthenticated]);

    // Fetch user's own blogs
    const fetchUserBlogs = async () => {
        try {
            const response = await authAPI.get('/blog/posts/');
            const all = response.data.results || response.data || [];
            const mine = (all || []).filter(p => p.author === user?.id);
            const sorted = [...mine].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setUserBlogs(sorted);
            setActivityStats(prev => ({ ...prev, totalBlogs: sorted.length }));
        } catch (err) {
            console.error('Failed to fetch user blogs:', err);
        }
    };
    const fetchUserActivity = async () => {
        try {
            setLoading(true);

            if (user?.role === 'student') {
                const response = await analysisAPI.getProjects();
                let projectsArray = [];
                if (response.data.results) {
                    projectsArray = response.data.results.projects || [];
                } else {
                    projectsArray = response.data.projects || response.data || [];
                }
                const sortedProjects = [...projectsArray].sort(
                    (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
                );
                setUserProjects(sortedProjects);
                setActivityStats(prev => ({
                    ...prev,
                    totalProjects: sortedProjects.length
                }));

            } else if (user?.role === 'faculty') {
                const response = await plagiarismAPI.getBatches();
                let batchesArray = [];
                if (response.data.results) {
                    batchesArray = response.data.results.batches || [];
                } else {
                    batchesArray = response.data.batches || response.data || [];
                }
                const sortedBatches = [...batchesArray].sort(
                    (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
                );
                setUserBatches(sortedBatches);
                setActivityStats(prev => ({
                    ...prev,
                    totalBatches: sortedBatches.length
                }));
            }
        } catch (err) {
            console.error('Failed to fetch user activity:', err);
            setError('Failed to fetch user activity');
        } finally {
            setLoading(false);
        }
    };

    const refetchUserProfile = async () => {
        try {
            const response = await authAPI.profile();
            const updatedUser = response.data.user;
            updateUser(updatedUser);

            setProfileData({
                first_name: updatedUser.first_name || '',
                last_name: updatedUser.last_name || '',
                email: updatedUser.email || '',
                username: updatedUser.username || ''
            });
        } catch (error) {
            console.error('Failed to refetch profile:', error);
        }
    };

    // Client-side validation functions
    const validateEmail = (email) => {
        if (!email) {
            return "Email is required";
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return "Email must be in valid format (e.g., user@example.com). It should contain @ symbol and a valid domain.";
        }
        return null;
    };

    const validateName = (name, fieldName) => {
        if (!name || name.trim() === '') {
            return `${fieldName} is required`;
        }
        if (name.length < 2) {
            return `${fieldName} must be at least 2 characters long`;
        }
        return null;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData({
            ...profileData,
            [name]: value
        });

        // Clear field-specific errors when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }

        // Real-time validation
        let error = null;
        if (name === 'email') {
            error = validateEmail(value);
        } else if (name === 'first_name') {
            error = validateName(value, 'First name');
        } else if (name === 'last_name') {
            error = validateName(value, 'Last name');
        }

        if (error) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    const handleResendVerification = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await authAPI.resendVerification();
            setSuccess(response.data.message);
        } catch (error) {
            console.error('Resend verification error:', error);
            if (error.response?.status === 400) {
                setError(error.response.data.message || 'Email is already verified');
            } else {
                setError('Failed to resend verification email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');
            setFieldErrors({});

            // Client-side validation before API call
            const validationErrors = {};

            const emailError = validateEmail(profileData.email);
            const firstNameError = validateName(profileData.first_name, 'First name');
            const lastNameError = validateName(profileData.last_name, 'Last name');

            if (emailError) validationErrors.email = emailError;
            if (firstNameError) validationErrors.first_name = firstNameError;
            if (lastNameError) validationErrors.last_name = lastNameError;

            if (Object.keys(validationErrors).length > 0) {
                setFieldErrors(validationErrors);
                setError('Please correct the errors below');
                return;
            }

            const response = await authAPI.updateProfile(profileData);
            const updatedUser = response.data.user;
            updateUser(updatedUser);

            setSuccess('Profile updated successfully!');
            setIsEditing(false);

        } catch (error) {
            console.error('Profile update error:', error);
            setError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };
    const getFormattedJoinDate = (dateStr) => {
        console.log('Formatting date:', dateStr); // Debug log

        if (!dateStr) {
            console.log('No date provided, returning N/A');
            return 'N/A';
        }

        try {
            const date = new Date(dateStr);

            // Check if the date is valid
            if (isNaN(date.getTime())) {
                console.log('Invalid date detected:', dateStr);
                return 'Invalid Date';
            }

            const formatted = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            console.log('Formatted date result:', formatted);
            return formatted;
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'N/A';
        }
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: "easeOut" }
    };

    if (loading && userProjects.length === 0 && userBatches.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
                <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
                <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                <motion.div {...fadeInUp} className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-300" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-white">My Profile</h1>
                                <p className="text-gray-300">Manage your account and view your activity</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="lg:col-span-1">
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                                <button
                                    onClick={() => {
                                        if (isEditing) {
                                            setIsEditing(false);
                                            setFieldErrors({});
                                            setProfileData({
                                                first_name: user?.first_name || '',
                                                last_name: user?.last_name || '',
                                                email: user?.email || '',
                                                username: user?.username || ''
                                            });
                                        } else {
                                            setIsEditing(true);
                                        }
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="flex flex-col items-center mb-6">
                                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                                    <User className="w-10 h-10 text-white" />
                                </div>
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm capitalize font-medium">
                                    {user?.role}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                                    {isEditing ? (
                                        <>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={profileData.first_name}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${fieldErrors.first_name ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                                                    }`}
                                                placeholder="Enter your first name"
                                            />
                                            {fieldErrors.first_name && (
                                                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                    <p className="text-red-400 text-sm flex items-start">
                                                        <span className="mr-2 mt-0.5">⚠️</span>
                                                        <span>{fieldErrors.first_name}</span>
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-white">{profileData.first_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                                    {isEditing ? (
                                        <>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={profileData.last_name}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${fieldErrors.last_name ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                                                    }`}
                                                placeholder="Enter your last name"
                                            />
                                            {fieldErrors.last_name && (
                                                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                    <p className="text-red-400 text-sm flex items-start">
                                                        <span className="mr-2 mt-0.5">⚠️</span>
                                                        <span>{fieldErrors.last_name}</span>
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-white">{profileData.last_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                    {isEditing ? (
                                        <>
                                            <input
                                                type="email"
                                                name="email"
                                                value={profileData.email}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                                                    }`}
                                                placeholder="Enter your email address"
                                            />
                                            {fieldErrors.email && (
                                                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                    <p className="text-red-400 text-sm flex items-start">
                                                        <span className="mr-2 mt-0.5">⚠️</span>
                                                        <span>{fieldErrors.email}</span>
                                                    </p>
                                                </div>
                                            )}
                                            {!user?.is_email_verified && !fieldErrors.email && (
                                                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                                    <p className="text-yellow-400 text-sm flex items-center justify-between">
                                                        <span className="flex items-center">
                                                            <span className="mr-2">💡</span>
                                                            Email not verified. Please check your inbox.
                                                        </span>
                                                        <button
                                                            onClick={handleResendVerification}
                                                            disabled={loading}
                                                            className="text-blue-400 hover:text-blue-300 text-xs underline disabled:opacity-50"
                                                        >
                                                            {loading ? 'Sending...' : 'Resend'}
                                                        </button>
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <p className="text-white">{profileData.email}</p>
                                            {user?.is_email_verified ? (
                                                <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded-full">✓ Verified</span>
                                            ) : (
                                                <span className="text-yellow-400 text-xs bg-yellow-500/20 px-2 py-1 rounded-full">⚠️ Not Verified</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                                    <p className="text-gray-400">{profileData.username}</p>
                                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                                </div>

                                {isEditing && (
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={loading || Object.values(fieldErrors).some(error => error !== null)}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
                                <div className="text-2xl font-bold text-blue-400 mb-2">{user?.role === 'student' ? activityStats.totalProjects : activityStats.totalBatches}</div>
                                <div className="text-sm text-gray-400">{user?.role === 'student' ? 'Projects Submitted' : 'Batches Analyzed'}</div>
                            </div>

                            {/* Replaced Success Rate with Blog Count */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
                                <div className="text-2xl font-bold text-green-400 mb-2">{activityStats.totalBlogs}</div>
                                <div className="text-sm text-gray-400">Blogs Published</div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
                                <div className="text-2xl font-bold text-purple-400 mb-2">{user?.is_email_verified ? '✓ Active' : '⚠️ Pending'}</div>
                                <div className="text-sm text-gray-400">Account Status</div>
                            </div>
                        </div>

                        {/* Side-by-side: History and My Blogs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                        {/* History Section */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold mb-4 flex items-center">
                                    <Calendar className="h-5 w-5 mr-2 text-green-400" />
                                    Recent Projects
                                </h3>
                                {((user?.role === 'student' && userProjects.length > 0) || (user?.role === 'faculty' && userBatches.length > 0)) && (
                                    <button onClick={() => navigate(user?.role === 'student' ? '/student/history' : '/faculty/history')} className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">View All History</button>
                                )}
                            </div>

                            <div className="space-y-4 flex-1">
                                {user?.role === 'student' ? (
                                    userProjects.slice(0, 3).map((project, index) => (
                                        <div key={project.id || index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="w-5 h-5 text-blue-400" />
                                                <div>
                                                    <h4 className="text-white font-medium">{project.project_name}</h4>
                                                    <p className="text-gray-400 text-sm">Uploaded: {new Date(project.uploaded_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => navigate(`/student/results/${project.id}`)} className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors">
                                                <Eye className="w-4 h-4" />
                                                <span>View</span>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    userBatches.slice(0, 3).map((batch, index) => (
                                        <div key={batch.id || index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <Upload className="w-5 h-5 text-purple-400" />
                                                <div>
                                                    <h4 className="text-white font-medium">{batch.batch_name}</h4>
                                                    <p className="text-gray-400 text-sm">Uploaded: {new Date(batch.uploaded_at).toLocaleDateString()} • {batch.total_projects} projects</p>
                                                </div>
                                            </div>
                                            <button onClick={() => navigate(`/faculty/results/${batch.id}`)} className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors">
                                                <Eye className="w-4 h-4" />
                                                <span>View</span>
                                            </button>
                                        </div>
                                    ))
                                )}

                                {((user?.role === 'student' && userProjects.length === 0) || (user?.role === 'faculty' && userBatches.length === 0)) && (
                                    <div className="text-center py-8">
                                        <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                        <p className="text-gray-400 mb-4">No {user?.role === 'student' ? 'projects' : 'batches'} in history yet</p>
                                        <button onClick={() => navigate(user?.role === 'student' ? '/student/upload' : '/faculty/upload')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-200">
                                            {user?.role === 'student' ? 'Upload First Project' : 'Upload First Batch'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* My Blogs Section */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold mb-4 flex items-center">
                                    <MessageSquare className="h-5 w-5 mr-2 text-blue-400" />
                                    My Recent Blogs
                                </h3>
                                {userBlogs.length > 0 && (
                                    <button onClick={() => navigate('/blog')} className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">View All Blogs</button>
                                )}
                            </div>

                            <div className="space-y-4 flex-1">
                                {userBlogs.slice(0, 3).map((post) => (
                                    <div key={post.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <MessageSquare className="w-5 h-5 text-blue-400" />
                                            <div>
                                                <h4 className="text-white font-medium line-clamp-1">{post.title}</h4>
                                                <p className="text-gray-400 text-sm">Published: {new Date(post.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => navigate('/blog')} className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors">
                                            <Eye className="w-4 h-4" />
                                            <span>Open</span>
                                        </button>
                                    </div>
                                ))}

                                {userBlogs.length === 0 && (
                                    <div className="text-center py-8">
                                        <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                        <p className="text-gray-400 mb-4">No blogs published yet</p>
                                        <button onClick={() => navigate('/blog')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-200">Write Your First Blog</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
