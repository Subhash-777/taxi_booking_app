import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const auth = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
};

export const rides = {
    book: (rideData) => api.post('/rides/book', rideData),
    getHistory: () => api.get('/rides/history'),
    accept: (rideId) => api.post(`/rides/${rideId}/accept`),
};

export const drivers = {
    updateLocation: (location) => api.post('/drivers/location', location),
    toggleAvailability: () => api.post('/drivers/toggle-availability'),
};

export default api;
