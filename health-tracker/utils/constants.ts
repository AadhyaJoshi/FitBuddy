export const COLORS = {
  primary: '#4f46e5',
  primaryLight: '#6366f1',
  primaryDark: '#4338ca',
  secondary: '#6b7280',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  background: '#f9fafb',
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

export const CATEGORIES = {
  screenTime: {
    social: { 
      name: 'Social Media', 
      color: '#ec4899',
      icon: '📱'
    },
    work: { 
      name: 'Work/Study', 
      color: '#3b82f6',
      icon: '💼'
    },
    entertainment: { 
      name: 'Entertainment', 
      color: '#a855f7',
      icon: '🎮'
    },
    other: { 
      name: 'Other', 
      color: '#6b7280',
      icon: '📊'
    }
  },
  
  reminders: {
    medication: { 
      name: 'Medication', 
      icon: '💊',
      color: '#ef4444'
    },
    appointment: { 
      name: 'Appointment', 
      icon: '📅',
      color: '#3b82f6'
    },
    water: { 
      name: 'Water Intake', 
      icon: '💧',
      color: '#06b6d4'
    },
    exercise: { 
      name: 'Exercise', 
      icon: '🏃',
      color: '#10b981'
    },
    custom: { 
      name: 'Custom', 
      icon: '📌',
      color: '#8b5cf6'
    }
  }
};

export const SCREEN_TIME_GOAL = 180; // 3 hours in minutes

export const API_ENDPOINTS = {
  AUTH: '/auth',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  SCREEN_TIME: '/screentime',
  REMINDERS: '/reminders',
  CHAT: '/chat',
};