import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import auth from './auth';


// Response type with proper generics
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// API configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Error types
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

/**
 * Create and configure an axios instance for API requests
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create(API_CONFIG);

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config) => {
      // Get fresh token on each request to ensure latest state
      const token = auth.getToken();
      
      // Only set the Authorization header if a token exists
      if (token) {
        // Ensure headers object exists
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      console.error('API request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Log error for debugging
      console.error('API response error:', error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        // Clear auth state on 401 Unauthorized
        auth.logout();
        
        // Only redirect if we're in a browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      // Format error response
      const apiError: ApiError = {
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'An unknown error occurred',
        code: error.response?.data?.code,
        errors: error.response?.data?.errors,
      };

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create API client instance
const apiClient = createApiClient();

/**
 * API service for making requests to the backend
 */
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = apiClient;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      // Rethrow as ApiError
      throw this.handleError(error, `GET ${url}`);
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `POST ${url}`);
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `PUT ${url}`);
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `DELETE ${url}`);
    }
  }

  /**
   * Upload a file
   */
  async uploadFile<T = any>(url: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add any additional fields
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value?.toString() || '');
        });
      }

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const response: AxiosResponse<T> = await this.client.post(url, formData, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `UPLOAD ${url}`);
    }
  }

  /**
   * Process a receipt with OCR
   */
  async processReceipt<T = any>(file: File): Promise<T> {
    return this.uploadFile<T>('/upload', file);
  }

  /**
   * Handle and standardize errors
   */
  private handleError(error: unknown, context: string): ApiError {
    // Log the error for debugging
    console.error(`API Error in ${context}:`, error);
    
    // If it's already an ApiError, just return it
    if (error && typeof error === 'object' && 'status' in error) {
      return error as ApiError;
    }
    
    // Otherwise, create a generic ApiError
    return {
      status: 500,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Export singleton instance
const api = new ApiService();
export default api;
