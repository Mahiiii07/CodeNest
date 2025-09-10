import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Faculty Pages - New Workflow
import FacultyUploadPage from './pages/FacultyUploadPage';
import BatchResultPage from './pages/BatchResultPage';
import BatchHistoryPage from './pages/BatchHistoryPage';


// Student Pages - New Workflow
import StudentUploadPage from './pages/StudentUploadPage';
import AnalysisResultPage from './pages/AnalysisResultPage';
import ProjectHistoryPage from './pages/ProjectHistoryPage';

// Landing Page
import Landing from './components/CodeNestLanding.jsx';

// Import your NEW pages
import BlogPage from './pages/BlogPage';
import ProfilePage from './pages/ProfilePage';


const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {<Header />}

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            isAuthenticated
              ? <Navigate to={user?.role === 'faculty' ? '/faculty' : '/student'} replace />
              : <Landing />
          } />
          <Route path="/login" element={
            isAuthenticated
              ? <Navigate to={user?.role === 'faculty' ? '/faculty' : '/student'} replace />
              : <Login />
          } />
          <Route path="/register" element={
            isAuthenticated
              ? <Navigate to={user?.role === 'faculty' ? '/faculty' : '/student'} replace />
              : <Register />
          } />

          <Route path="/faculty" element={
            <ProtectedRoute requiredRole="faculty">
              <Navigate to="/faculty/upload" replace />
            </ProtectedRoute>
          } />
          <Route path="/faculty/upload" element={
            <ProtectedRoute requiredRole="faculty">
              <FacultyUploadPage />
            </ProtectedRoute>
          } />
          <Route path="/faculty/results/:batchId" element={
            <ProtectedRoute requiredRole="faculty">
              <BatchResultPage />
            </ProtectedRoute>
          } />
          <Route path="/faculty/history" element={
            <ProtectedRoute requiredRole="faculty">
              <BatchHistoryPage />
            </ProtectedRoute>
          } />

          <Route path="/blog" element={<BlogPage />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/student" element={
            <ProtectedRoute requiredRole="student">
              <Navigate to="/student/upload" replace />
            </ProtectedRoute>
          } />
          <Route path="/student/upload" element={
            <ProtectedRoute requiredRole="student">
              <StudentUploadPage />
            </ProtectedRoute>
          } />
          <Route path="/student/results/:projectId" element={
            <ProtectedRoute requiredRole="student">
              <AnalysisResultPage />
            </ProtectedRoute>
          } />
          <Route path="/student/history" element={
            <ProtectedRoute requiredRole="student">
              <ProjectHistoryPage />
            </ProtectedRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={
            isAuthenticated
              ? <Navigate to={user?.role === 'faculty' ? '/faculty' : '/student'} replace />
              : <Navigate to="/login" replace />
          } />

        </Routes>
      </main>
      <Footer />
    </div>

  );
};

function App() {
  return (
    <ErrorBoundary> {/* ← WRAP EVERYTHING WITH ERROR BOUNDARY */}
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>

  );
}

export default App;
