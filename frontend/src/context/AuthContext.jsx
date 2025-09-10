import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [loading, setLoading] = useState(false); 

  // user function 
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    setIsAuthenticated(true); 
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

const login = async (credentials) => {
  setLoading(true);
  try {
    const response = await authAPI.login(credentials);
    const { user: userData, tokens } = response.data;
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
    
    //  Fetch fresh profile data after login
    try {
      const profileResponse = await authAPI.profile();
      const freshUserData = profileResponse.data.user;
      setUser(freshUserData); // Update with fresh data including verification status
      localStorage.setItem('user', JSON.stringify(freshUserData));
    } catch (profileError) {
      console.warn('Could not fetch fresh profile data:', profileError);
    }
    
    return { success: true, user: userData };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || 'Login failed' 
    };
  } finally {
    setLoading(false);
  }
};

const register = async (userData) => {
  setLoading(true);
  try {
    console.log('Attempting registration with data:', userData);
    console.log('API URL:', 'http://192.168.0.107:8000/api/auth/register/');
    
    const response = await authAPI.register(userData);
    const { user: newUser, tokens, email_message } = response.data;
    
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
    
    return { 
      success: true, 
      user: newUser,
      email_message: email_message
    };
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    // Handle field-specific validation errors
    if (error.response?.data && typeof error.response.data === 'object' && !error.response.data.error) {
      const processedErrors = {};
      Object.keys(error.response.data).forEach(field => {
        if (Array.isArray(error.response.data[field])) {
          processedErrors[field] = error.response.data[field][0];
        } else {
          processedErrors[field] = error.response.data[field];
        }
      });
      
      return {
        success: false,
        fieldErrors: processedErrors,
        error: 'Please correct the errors below'
      };
    }
    
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Registration failed. Please try again.' 
    };
  } finally {
    setLoading(false);
  }
};


  const logout = async () => {
    setLoading(true); // Set loading during logout
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setLoading(false); // Clear loading after logout
    }
  };

  // Sync authentication state when user changes
  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const value = {
    user,
    setUser, 
    login,
    register,
    logout,
    updateUser,
    loading, 
    setLoading, 
    isAuthenticated, 
    isFaculty: user?.role === 'faculty',
    isStudent: user?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
