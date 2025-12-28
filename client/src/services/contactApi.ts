import api from './api';

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

export interface CreateContactDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
  };
}

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      // Handle validation errors from NestJS
      if (status === 400) {
        if (Array.isArray(data.message)) {
          return data.message.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err?.constraints) {
              return Object.values(err.constraints).join(', ');
            }
            return err?.property 
              ? `${err.property}: ${Object.values(err.constraints || {}).join(', ')}` 
              : String(err);
          }).join('. ');
        }
        return data.message || 'Invalid input. Please check your form data.';
      }
      
      if (status === 500) {
        return 'Server error. Please try again later.';
      }
      
      if (status === 503) {
        return 'Service temporarily unavailable. Please try again in a moment.';
      }
      
      return data.message || `Request failed with status ${status}`;
    }
    
    if (error.request) {
      return 'No response from server. Please check your connection and try again.';
    }
    
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export const contactApi = {
  submitContact: async (data: CreateContactDto): Promise<ContactResponse> => {
    try {
      const response = await api.post<ContactResponse>('/contacts', data);
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },
};

