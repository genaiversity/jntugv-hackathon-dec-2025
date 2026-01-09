import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/authService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      const { token, user } = response;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setCurrentUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password, role = 'user') => {
    try {
      let response;
      
      if (role === 'organizer') {
        response = await authService.registerOrganizer(name, email, password);
      } else {
        response = await authService.register(name, email, password);
      }
      
      const { token, user } = response;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setCurrentUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setCurrentUser(null);
    }
  };

  const getProfile = async () => {
    if (!token) return null;
    
    try {
      const profile = await authService.getProfile(token);
      return profile;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  const updateProfile = async (profileData) => {
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      const response = await authService.updateProfile(profileData, token);
      
      // Update current user if profile was updated
      if (response.user) {
        setCurrentUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return { success: true, ...response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Failed to update profile' 
      };
    }
  };

  const changePassword = async (passwordData) => {
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      const response = await authService.changePassword(passwordData, token);
      return { success: true, ...response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Failed to change password' 
      };
    }
  };

  const value = {
    currentUser,
    token,
    login,
    register,
    logout,
    getProfile,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}