import { create } from 'zustand';
import { storageService } from '../services/storageService';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      await storageService.saveUser(user);
      await storageService.saveToken(token);
      
      set({ user, token, loading: false });
      return true;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Login failed', 
        loading: false 
      });
      return false;
    }
  },

  signup: async (name: string, email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/signup', { name, email, password });
      const { user, token } = response.data;
      
      await storageService.saveUser(user);
      await storageService.saveToken(token);
      
      set({ user, token, loading: false });
      return true;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Signup failed', 
        loading: false 
      });
      return false;
    }
  },

  logout: async () => {
    await storageService.clearAll();
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const user = await storageService.getUser();
    const token = await storageService.getToken();
    if (user && token) {
      set({ user, token });
    }
  }
}));