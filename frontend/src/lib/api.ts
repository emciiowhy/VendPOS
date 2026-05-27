import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Ensure base URL always ends with /api so routes like /sales resolve to /api/sales
const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('accessToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh, connection errors, and retries
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: number; _retryCount?: number };

    // Initialize retry counter
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // Handle connection errors (ERR_CONNECTION_REFUSED, network timeouts, etc.)
    if (
      !error.response && 
      (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message?.includes('ERR_CONNECTION'))
    ) {
      // Retry up to 3 times with exponential backoff
      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount++;
        const delayMs = Math.pow(2, originalRequest._retryCount) * 1000; // 2s, 4s, 8s
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return api(originalRequest);
      }
      
      // After max retries, reject with helpful error message
      const error = new Error(
        'Unable to connect to server. Please ensure the backend server is running on port 5000.'
      );
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried token refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;

        // Save new token
        Cookies.set('accessToken', accessToken, { expires: 7 });

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        
        // Redirect to login if we're in the browser
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; errors?: any[] }>;
    
    if (axiosError.response?.data) {
      const data = axiosError.response.data;
      
      // Handle validation errors
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.map((e: any) => e.message).join(', ');
      }
      
      return data.message || data.error || 'An error occurred';
    }
    
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export default api;