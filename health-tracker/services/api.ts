import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_CONFIG = {
  // Development: try common targets automatically.
  // - Android emulator: 10.0.2.2
  // - iOS simulator / Expo web: localhost
  // - Physical device: replace HOST_IP below with your machine LAN IP (e.g. 192.168.1.100)
  BASE_URL: __DEV__
    ? (Platform.OS === 'android'
        ? 'http://10.0.2.2:5000/api'         // Android emulator
        : 'http://localhost:5000/api')       // iOS simulator / Expo web
    : 'https://your-production-api.com/api'
};

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      await AsyncStorage.clear();
      // You can also emit an event here to navigate to login
    }
    return Promise.reject(error);
  }
);

export default api;