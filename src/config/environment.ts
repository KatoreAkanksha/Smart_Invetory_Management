/**
 * Environment configuration
 * 
 * This file centralizes access to environment variables with proper defaults
 * to avoid undefined errors throughout the application.
 */

// Define the environment interface
interface Environment {
  NODE_ENV: string;
  FINNHUB_API_KEY: string;
  APP_NAME: string;
  APP_VERSION: string;
  IS_DEVELOPMENT: boolean;
}

// Get environment variables with fallbacks
const getEnvironment = (): Environment => {
  const isClient = typeof window !== 'undefined';
  
  return {
    NODE_ENV: import.meta.env.MODE || 'development',
    FINNHUB_API_KEY: import.meta.env.VITE_FINNHUB_API_KEY || '',
    APP_NAME: import.meta.env.VITE_APP_NAME || 'SmartBudget',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    IS_DEVELOPMENT: import.meta.env.DEV || false,
  };
};

// Export the environment
export const env = getEnvironment();

// Helper for checking the current environment
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variables are missing
 */
export const validateEnvironment = (): void => {
  const required = ['FINNHUB_API_KEY'];
  
  const missing = required.filter(key => !env[key as keyof Environment]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and make sure all required variables are set.'
    );
  }
};
