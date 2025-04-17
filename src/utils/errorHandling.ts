/**
 * Centralized error handling utilities
 * Provides consistent error logging, formatting, and handling across the application
 */

// Error details interface
interface ErrorDetails {
  message: string;
  stack?: string;
  componentName?: string;
  additionalData?: Record<string, any>;
}

/**
 * Log an error with proper formatting and context
 */
export function logError(error: unknown, componentName?: string, additionalData?: Record<string, any>): void {
  // Parse the error to get consistent format
  const errorDetails = parseError(error, componentName, additionalData);
  
  // Development environment: detailed console logs
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔴 Error in ${errorDetails.componentName || 'unknown component'}`);
    console.error(errorDetails.message);
    if (errorDetails.stack) {
      console.error(errorDetails.stack);
    }
    if (errorDetails.additionalData) {
      console.info('Additional context:', errorDetails.additionalData);
    }
    console.groupEnd();
  } else {
    // Production: send to error tracking service
    sendToErrorTrackingService(errorDetails);
  }
}

/**
 * Parse an error into a consistent format
 */
function parseError(error: unknown, componentName?: string, additionalData?: Record<string, any>): ErrorDetails {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      componentName,
      additionalData,
    };
  }
  
  if (typeof error === 'string') {
    return {
      message: error,
      componentName,
      additionalData,
    };
  }
  
  // Handle unknown error types
  return {
    message: 'An unknown error occurred',
    componentName,
    additionalData: { ...additionalData, rawError: error },
  };
}

/**
 * Send error to tracking service (e.g., Sentry, LogRocket, etc.)
 * This is a placeholder implementation - replace with actual service integration
 */
function sendToErrorTrackingService(errorDetails: ErrorDetails): void {
  // In a real application, you would integrate with an error tracking service
  // Example for Sentry:
  //
  // import * as Sentry from '@sentry/react';
  // 
  // Sentry.captureException(new Error(errorDetails.message), {
  //   tags: { component: errorDetails.componentName },
  //   extra: errorDetails.additionalData,
  // });
  
  // For now, just log to console in a production-friendly way
  console.error(`[ERROR] ${errorDetails.message} ${errorDetails.componentName ? `in ${errorDetails.componentName}` : ''}`);
}

/**
 * Format user-friendly error message based on error type
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

/**
 * Create a safer version of a synchronous function that catches and logs errors
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  errorHandler?: (error: Error) => void,
  componentName?: string
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      logError(error, componentName, { args });
      if (errorHandler && error instanceof Error) {
        errorHandler(error);
      }
      return undefined;
    }
  };
}

/**
 * Create a safer version of an async function that catches and logs errors
 */
export function withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: Error) => void,
  componentName?: string
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | undefined> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, componentName, { args });
      if (errorHandler && error instanceof Error) {
        errorHandler(error);
      }
      return undefined;
    }
  };
}

/**
 * Custom Error classes for different error types
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends Error {
  field?: string;
  
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
