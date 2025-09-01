import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Set token in axios defaults
          authService.setAuthToken(storedToken);

          // Verify token is still valid
          const response = await authService.getProfile();
          setUser(response.data.user);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          authService.setAuthToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      const { token: newToken, user: newUser } = response.data;

      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Set in axios defaults
      authService.setAuthToken(newToken);

      // Update state
      setToken(newToken);
      setUser(newUser);

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      const { token: newToken, user: newUser } = response.data;

      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Set in axios defaults
      authService.setAuthToken(newToken);

      // Update state
      setToken(newToken);
      setUser(newUser);

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      await authService.logout();
    } catch (error) {
      // Continue with client-side logout even if server call fails
      console.error('Logout error:', error);
    } finally {
      // Clear client-side state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      authService.setAuthToken(null);
      setToken(null);
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      const updatedUser = response.data.user;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
