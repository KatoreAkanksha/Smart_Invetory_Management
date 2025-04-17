// Environment configuration for browser environment with Vite

// TypeScript interface for strongly typed environment variables
interface ImportMetaEnv {
  readonly VITE_FINNHUB_API_KEY: string;
  readonly VITE_MONGODB_URI: string;
  readonly VITE_MONGODB_DBNAME: string;
}

// Extend ImportMeta interface
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Configuration object with fallbacks
export const config = {
  mongodb: {
    uri: import.meta.env.VITE_MONGODB_URI || 'mongodb://localhost:27017/finance-tracker',
    dbName: import.meta.env.VITE_MONGODB_DBNAME || 'finance-tracker',
  },
  finnhub: {
    apiKey: import.meta.env.VITE_FINNHUB_API_KEY || '',
    baseUrl: 'https://finnhub.io/api/v1',
  },
};

// Helper function to validate environment variables
export const validateEnv = (): boolean => {
  // Check if Finnhub API key exists
  if (!config.finnhub.apiKey) {
    console.error('⛔ MISSING API KEY: Finnhub API key is not set!');
    console.error('Please make sure VITE_FINNHUB_API_KEY is set in your .env file.');
    return false;
  }
  
  // Check if it's a placeholder value (adjust if you have a known placeholder)
  if (config.finnhub.apiKey === 'your_actual_finnhub_api_key_here') {
    console.error('⛔ INVALID API KEY: You are using the placeholder value!');
    console.error('Please replace "your_actual_finnhub_api_key_here" with your real Finnhub API key.');
    return false;
  }
  
  // Check if it follows the expected format
  // Finnhub API keys are typically alphanumeric strings
  const apiKeyPattern = /^[a-zA-Z0-9_-]+$/;
  if (!apiKeyPattern.test(config.finnhub.apiKey)) {
    console.error('⛔ SUSPICIOUS API KEY FORMAT: The API key contains unusual characters.');
    console.error('Finnhub API keys typically only contain letters, numbers, underscores, or hyphens.');
    return false;
  }
  
  return true;
};

// Initial validation on load
validateEnv();

// Helper function to get the Finnhub API key
export const getFinnhubApiKey = (): string => {
  // Validate the API key and log warnings if there are issues
  validateEnv();
  
  // In development, show a helpful message if the API key is missing
  if (!config.finnhub.apiKey && import.meta.env.DEV) {
    console.warn('⚠️ Finnhub API key is missing. Please add VITE_FINNHUB_API_KEY to your .env file.');
    console.warn('You can get an API key by signing up at https://finnhub.io/');
  }
  
  return config.finnhub.apiKey;
};

// Helper function to construct a Finnhub API URL with token
export const getFinnhubUrl = (endpoint: string, queryParams: Record<string, string> = {}): string => {
  const url = new URL(`${config.finnhub.baseUrl}${endpoint}`);
  
  // Add query parameters
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  // Check API key before adding it to the URL
  const apiKey = getFinnhubApiKey();
  
  // Log a clear message if the API key is missing but still continue
  if (!apiKey) {
    console.error('⚠️ WARNING: Making Finnhub API request with missing API key');
    console.error('This will definitely fail! Please set VITE_FINNHUB_API_KEY in your .env file.');
  }
  
  // Add API key to URL
  url.searchParams.append('token', apiKey);
  
  return url.toString();
};
