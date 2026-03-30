import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL
// For local development with Expo, use your machine's IP address
// Example: 'http://192.168.1.100:5000/api'
const API_BASE_URL = 'http://10.45.198.56:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.log('API Error:', error.response.data);
    } else if (error.request) {
      // Request was made but no response
      console.log('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Farmer Products API calls
export const farmerProductsAPI = {
  getAll: () => api.get('/farmer-products'),
  getById: (id) => api.get(`/farmer-products/${id}`),
  getMyProducts: () => api.get('/farmer-products/my/products'),
  add: (formData) => api.post('/farmer-products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/farmer-products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/farmer-products/${id}`),
};

// Trader Products API calls
export const traderProductsAPI = {
  getAll: () => api.get('/trader-products'),
  getById: (id) => api.get(`/trader-products/${id}`),
  getMyProducts: () => api.get('/trader-products/my/products'),
  getMyOrders: () => api.get('/trader-products/my/orders'),
  add: (formData) => api.post('/trader-products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/trader-products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/trader-products/${id}`),
};

// Orders API calls
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getMyPurchases: () => api.get('/orders/purchases'),
  getMySales: () => api.get('/orders/sales'),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

export default api;
