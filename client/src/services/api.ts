import axios from 'axios';

// Re-export axios for use in other files
export { axios };

// Type guard for Axios errors
const isAxiosError = (error: unknown): error is { 
  response?: { status: number; data?: any; statusText?: string };
  request?: any;
  code?: string;
  message: string;
  config?: { url?: string };
} => {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
};

// Get API base URL from environment variable
// In production, this should be set via NEXT_PUBLIC_API_URL
// Never use localhost in production code
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin.replace(/:\d+$/, ':3001') : 'http://localhost:3001');
// Increase timeout for Render.com free tier which can take 30-60 seconds to wake up
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '60000', 10);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh on 401 and redirect to login on unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post<{ accessToken: string; refreshToken: string }>(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and trigger login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Dispatch events to trigger login modal and sync auth state
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('unauthorized'));
          window.dispatchEvent(new CustomEvent('showLoginModal'));
        }
        
        return Promise.reject(refreshError);
      }
      
      // No refresh token available, trigger login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
        window.dispatchEvent(new CustomEvent('showLoginModal'));
      }
      
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
        window.dispatchEvent(new CustomEvent('showLoginModal'));
      }
      
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  email: string;
  password: string;
  name?: string;
  username?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    username?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  username?: string;
  createdAt: string;
  favorites: Array<{
    id: number;
    name: string;
    image: string;
    imageOfficial?: string;
    types: string[];
  }>;
}

const getAuthErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      if (status === 400) {
        if (Array.isArray(data.message)) {
          return data.message.join('. ');
        }
        return data.message || 'Invalid input. Please check your credentials.';
      }
      
      if (status === 401) {
        return data.message || 'Invalid email or password.';
      }
      
      if (status === 409) {
        return data.message || 'User already exists with this email.';
      }
      
      if (status >= 500) {
        return 'Server error. Please try again later.';
      }
      
      return data.message || `Authentication failed with status ${status}`;
    }
    
    if (error.request) {
      return 'No response from server. Please check your connection.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred during authentication.';
};

export const authApi = {
  login: async (credentials: LoginDto): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },

  signup: async (data: SignupDto): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/signup', data);
      return response.data;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Log error but don't throw - always clear local storage
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
};

const getFavoritesErrorMessage = (error: unknown, action: string): string => {
  if (isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      if (status === 401) {
        return 'Please log in to manage favorites.';
      }
      
      if (status === 404) {
        return data.message || 'Pokémon not found.';
      }
      
      if (status === 409) {
        return data.message || 'This Pokémon is already in your favorites.';
      }
      
      if (status >= 500) {
        return `Server error while ${action}. Please try again later.`;
      }
      
      return data.message || `Failed to ${action}. Please try again.`;
    }
    
    if (error.request) {
      return `No response from server while ${action}. Please check your connection.`;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return `An unexpected error occurred while ${action}.`;
};

export const favoritesApi = {
  getFavorites: async (): Promise<any[]> => {
    try {
      const response = await api.get<any[]>('/favorites');
      return response.data;
    } catch (error) {
      const errorMessage = getFavoritesErrorMessage(error, 'loading favorites');
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },

  addFavorite: async (pokemonId: number): Promise<void> => {
    try {
      await api.post(`/favorites/${pokemonId}`);
    } catch (error) {
      const errorMessage = getFavoritesErrorMessage(error, 'adding favorite');
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },

  removeFavorite: async (pokemonId: number): Promise<void> => {
    try {
      await api.delete(`/favorites/${pokemonId}`);
    } catch (error) {
      const errorMessage = getFavoritesErrorMessage(error, 'removing favorite');
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },
};

export const usersApi = {
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get<UserProfile>('/users/profile');
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to load user profile.';
      
      if (isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data as any;
          
          if (status === 401) {
            errorMessage = 'Please log in to view your profile.';
          } else if (status === 404) {
            errorMessage = 'Profile not found.';
          } else if (status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = data.message || errorMessage;
          }
        } else if (error.request) {
          errorMessage = 'No response from server. Please check your connection.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },
};

export default api;

