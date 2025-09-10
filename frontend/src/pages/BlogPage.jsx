import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, Plus, Edit, Trash2, MessageCircle, X, Send, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const BlogPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedComment, setEditedComment] = useState('');

  // Fetch blog posts
  const fetchPosts = async () => {
    try {
      const response = await authAPI.get('/blog/posts/');
      const fetchedPosts = response.data.results || response.data;
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    switch (activeTab) {
      case 'faculty':
        return posts.filter(post => post.author_role === 'faculty');
      case 'student':
        return posts.filter(post => post.author_role === 'student');
      default:
        return posts;
    }
  };

  // Create new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const response = await authAPI.post('/blog/posts/', formData);
      setPosts([response.data, ...posts]);
      setFormData({ title: '', content: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  // Update post
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    try {
      const response = await authAPI.patch(`/blog/posts/${editingPost.id}/`, formData);
      setPosts(posts.map(post => post.id === editingPost.id ? response.data : post));
      setFormData({ title: '', content: '' });
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await authAPI.delete(`/blog/posts/${postId}/`);
        setPosts(posts.filter(post => post.id !== postId));
        if (selectedPost && selectedPost.id === postId) setSelectedPost(null);
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost) return;
    try {
      const response = await authAPI.post('/blog/comments/', { post: selectedPost.id, content: newComment });
      setSelectedPost({ ...selectedPost, comments: [...(selectedPost.comments || []), response.data] });
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comments: [...(p.comments || []), response.data] } : p));
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment.');
    }
  };

  // Begin editing a comment
  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedComment(comment.content);
  };

  // Cancel editing comment
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditedComment('');
  };

  // Update a comment
  const handleUpdateComment = async (e) => {
    e.preventDefault();
    if (!editedComment.trim() || !editingCommentId) return;
    try {
      const response = await authAPI.patch(`/blog/comments/${editingCommentId}/`, { content: editedComment });
      const updated = response.data;
      // Update in modal
      setSelectedPost(sel => sel ? { ...sel, comments: (sel.comments || []).map(c => c.id === updated.id ? updated : c) } : sel);
      // Update in list
      setPosts(prev => prev.map(p => p.id === (selectedPost?.id || p.id) ? { ...p, comments: (p.comments || []).map(c => c.id === updated.id ? updated : c) } : p));
      cancelEditComment();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment.');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!selectedPost) return;
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await authAPI.delete(`/blog/comments/${commentId}/`);
        setSelectedPost({ ...selectedPost, comments: (selectedPost.comments || []).filter(c => c.id !== commentId) });
        setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comments: (p.comments || []).filter(c => c.id !== commentId) } : p));
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment.');
      }
    }
  };

  // Start editing post
  const startEditing = (post) => {
    setEditingPost(post);
    setFormData({ title: post.title, content: post.content });
  };

  // Cancel editing post
  const cancelEditing = () => {
    setEditingPost(null);
    setFormData({ title: '', content: '' });
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const getRoleDisplay = (role) => role === 'faculty' ? 'Professor' : role === 'student' ? 'Student' : 'User';

  useEffect(() => { fetchPosts(); }, []);

  const fadeInUp = { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: 'easeOut' } };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xl">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  const filteredPosts = getFilteredPosts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">CodeNest <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Blog</span></h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Latest insights, updates, and best practices from the CodeNest community</p>
          {isAuthenticated && (
            <motion.button onClick={() => setShowCreateForm(true)} className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200 flex items-center mx-auto space-x-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Plus className="w-5 h-5" />
              <span>Create New Post</span>
            </motion.button>
          )}
        </motion.div>

        {(showCreateForm || editingPost) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingPost ? 'Edit Post' : 'Create New Post'}</h2>
              <button onClick={editingPost ? cancelEditing : () => setShowCreateForm(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Enter post title..." required />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={6} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none" placeholder="Write your post content..." required />
              </div>
              <div className="flex space-x-4">
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200">{editingPost ? 'Update Post' : 'Create Post'}</button>
                <button type="button" onClick={editingPost ? cancelEditing : () => setShowCreateForm(false)} className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition duration-200">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="mb-8">
          <nav className="flex space-x-8 justify-center">
            <button onClick={() => setActiveTab('all')} className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>All Blogs ({posts.length})</button>
            <button onClick={() => setActiveTab('faculty')} className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'faculty' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>Professor Blogs ({posts.filter(p => p.author_role === 'faculty').length})</button>
            <button onClick={() => setActiveTab('student')} className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'student' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>Student Blogs ({posts.filter(p => p.author_role === 'student').length})</button>
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300 group cursor-pointer h-80 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setSelectedPost(post)}
            >
              {/* Header with role badge and action buttons */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold tracking-wide uppercase">
                  {getRoleDisplay(post.author_role)}
                </span>
                {isAuthenticated && user?.id === post.author && (
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditing(post); }}
                      className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all duration-200 hover:scale-105"
                      title="Edit post"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                      className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200 hover:scale-105"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                {post.title}
              </h2>

              {/* Content */}
              <p className="text-gray-300 mb-4 text-sm line-clamp-3 leading-relaxed flex-1">
                {post.content}
              </p>

              {/* Footer section */}
              <div className="mt-auto space-y-3 pt-2 border-t border-white/5">
                {/* Author and comments row */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate max-w-24 font-medium">{post.author_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="font-medium">{post.comments?.length || 0}</span>
                  </div>
                </div>

                {/* Date row */}
                <div className="flex items-center text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  <span>{formatDate(post.created_at)}</span>
              </div>

                {/* Read more CTA */}
                <div className="flex items-center justify-end text-blue-400 group-hover:text-blue-300 transition-colors text-xs font-medium pt-1">
                  <span>Read more</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </motion.article>

          ))}
        </div>

        {filteredPosts.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16"><p className="text-xl text-gray-400">{activeTab === 'faculty' ? 'No professor blogs yet.' : activeTab === 'student' ? 'No student blogs yet.' : 'No blog posts yet. Be the first to share!'}</p></motion.div>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 ">
              <div className="flex items-center justify-between mb-6 ">
                <h2 className="text-3xl font-bold text-white">{selectedPost.title}</h2>
                <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex items-center space-x-4 text-gray-400 mb-6">
                <div className="flex items-center"><User className="w-4 h-4 mr-2" /><span>{selectedPost.author_name}</span></div>
                <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /><span>{formatDate(selectedPost.created_at)}</span></div>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">{getRoleDisplay(selectedPost.author_role)}</span>
              </div>

              <div className="prose prose-invert max-w-none mb-8"><p className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">{selectedPost.content}</p></div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-xl font-bold text-white mb-4">Comments ({selectedPost.comments?.length || 0})</h3>

                {isAuthenticated && (
                  <form onSubmit={handleAddComment} className="mb-6">
                    <div className="flex space-x-4">
                      <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors" required />
                      <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200 flex items-center space-x-2"><Send className="w-4 h-4" /><span>Comment</span></button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {selectedPost.comments?.map((comment) => (
                    <div key={comment.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-white">{comment.author_name}</span>
                            <span className="text-sm text-gray-400">{formatDate(comment.created_at)}</span>
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">{getRoleDisplay(comment.author_role)}</span>
                          </div>
                          {editingCommentId === comment.id ? (
                            <form onSubmit={handleUpdateComment} className="space-y-2">
                              <textarea value={editedComment} onChange={(e) => setEditedComment(e.target.value)} rows={3} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none" required />
                              <div className="flex space-x-2">
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"><Save className="w-4 h-4" /><span>Save</span></button>
                                <button type="button" onClick={cancelEditComment} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <p className="text-gray-300">{comment.content}</p>
                          )}
                        </div>
                        {isAuthenticated && user?.id === comment.author && (
                          <div className="flex items-center space-x-2 ml-4">
                            {editingCommentId === comment.id ? null : (
                              <button onClick={() => startEditComment(comment)} className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors" title="Edit comment"><Edit className="w-4 h-4" /></button>
                            )}
                            <button onClick={() => handleDeleteComment(comment.id)} className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors" title="Delete comment"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!selectedPost.comments || selectedPost.comments.length === 0) && (
                    <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </div>
            </div>
        </motion.div>
      </div>
      )}
    </div>
  );
};

export default BlogPage;

