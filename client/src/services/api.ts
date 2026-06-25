import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@/lib/api-config';

export { axios };

const isAxiosError = (error: unknown): error is {
  response?: { status: number; data?: any; statusText?: string };
  request?: any;
  code?: string;
  message: string;
  config?: { url?: string; _retry?: boolean };
} => {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true, timeout: API_TIMEOUT })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function silentClearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('unauthorized'));
  }
}

function clearSessionAndPromptLogin() {
  silentClearSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('showLoginModal'));
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || '';
      const isSilentAuthCheck = url.includes('/auth/me');
      const isAuthRoute =
        url.includes('/auth/login') ||
        url.includes('/auth/signup') ||
        url.includes('/auth/refresh');

      if (isSilentAuthCheck) {
        return Promise.reject(error);
      }

      if (!isAuthRoute) {
        originalRequest._retry = true;
        try {
          await refreshSession();
          return api(originalRequest);
        } catch {
          clearSessionAndPromptLogin();
          return Promise.reject(error);
        }
      }
    }

    if (error.response?.status === 403) {
      clearSessionAndPromptLogin();
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
      throw new Error(getAuthErrorMessage(error));
    }
  },

  signup: async (data: SignupDto): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/signup', data);
      return response.data;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
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
