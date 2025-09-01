import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  setAuthToken(token) {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    this.setAuthToken(null);
    localStorage.removeItem('user');
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return response;
  },

  async updateProfile(profileData) {
    const response = await api.put('/users/profile', profileData);
    return response;
  }
};

// Export auth as an alias (backward compatibility)
export const auth = authService;

// Ride Service
export const rideService = {
  async bookRide(rideData) {
    const response = await api.post('/rides/book', rideData);
    return response.data;
  },

  async cancelRide(rideId) {
    const response = await api.put(`/rides/${rideId}/cancel`);
    return response.data;
  },

  async getRideHistory() {
    const response = await api.get('/rides/history');
    return response.data;
  },

  async getCurrentRide() {
    const response = await api.get('/rides/current');
    return response.data;
  }
};

// Rides service (alternative export name)
export const rides = rideService;

// User Service
export const userService = {
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  async getWalletBalance() {
    const response = await api.get('/users/wallet');
    return response.data;
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (token expired/invalid)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
