import { finnhubClient } from '../lib/finnhub';
import { isApiKeyValid } from '../config/api';

// Type definitions
export interface QuoteData {
  c: number;  // Current price
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface NewsData {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

export interface FinancialData {
  metric: Record<string, number>;
  metricType: string;
  symbol: string;
}

export interface CandleData {
  c: number[];  // Close prices
  h: number[];  // High prices
  l: number[];  // Low prices
  o: number[];  // Open prices
  s: string;    // Status
  t: number[];  // Timestamps
  v: number[];  // Volumes
}

export type Resolution = '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';

export interface SearchResult {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export interface SentimentData {
  buzz: {
    articlesInLastWeek: number;
    buzz: number;
    weeklyAverage: number;
  };
  companyNewsScore: number;
  sectorAverageBullishPercent: number;
  sectorAverageNewsScore: number;
  sentiment: {
    bearishPercent: number;
    bullishPercent: number;
  };
  symbol: string;
}

// Error handling
interface ApiErrorDetails {
  code: 'AUTH_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
}

class ApiError extends Error {
  code: string;
  constructor({ code, message }: ApiErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

// Helper functions
const validateApiKey = () => {
  if (!isApiKeyValid()) {
    throw new ApiError({ 
      code: 'AUTH_ERROR', 
      message: 'API key is not configured or invalid' 
    });
  }
};

const fetchFromFinnhub = async <T>(request: Promise<any>): Promise<T> => {
  try {
    validateApiKey();
    const response = await request;
    
    if (response.response?.status === 403) {
      throw new ApiError({ 
        code: 'AUTH_ERROR',
        message: 'Invalid or expired API key'
      });
    }
    
    if (response.response?.status === 429) {
      throw new ApiError({
        code: 'RATE_LIMIT',
        message: 'API rate limit exceeded'
      });
    }
    
    if (!response.data) {
      if (response.status === 403) {
        throw new ApiError({
          code: 'AUTH_ERROR',
          message: 'Finnhub API access denied. The API key may be invalid or expired.'
        });
      } else if (response.status === 429) {
        throw new ApiError({
          code: 'RATE_LIMIT',
          message: 'Finnhub API rate limit exceeded. Please try again later.'
        });
      } else {
        throw new ApiError({
          code: 'NETWORK_ERROR',
          message: 'No data received from Finnhub'
        });
      }
    }
    
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching from Finnhub:', errorMessage);
    throw new ApiError({
      code: 'UNKNOWN_ERROR',
      message: `Finnhub API error: ${errorMessage}`
    });
  }
};

// Finnhub service object
const finnhubService = {
  // Stock quote data
  getQuote: async (symbol: string): Promise<QuoteData> => {
    return fetchFromFinnhub(finnhubClient.quote(symbol));
  },

  // Market news
  getMarketNews: async (category = 'general'): Promise<NewsData[]> => {
    return fetchFromFinnhub(finnhubClient.marketNews(category));
  },

  // Company profile
  getCompanyProfile: async (symbol: string): Promise<CompanyProfile> => {
    return fetchFromFinnhub(finnhubClient.companyProfile2({ symbol }));
  },

  // Company news
  getCompanyNews: async (
    symbol: string, 
    from: string = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    to: string = new Date().toISOString().split('T')[0]
  ): Promise<NewsData[]> => {
    return fetchFromFinnhub(finnhubClient.companyNews(symbol, from, to));
  },

  // Financial metrics
  getBasicFinancials: async (symbol: string, metric = 'all'): Promise<FinancialData> => {
    return fetchFromFinnhub(finnhubClient.companyBasicFinancials(symbol, metric));
  },

  // Symbol search
  symbolSearch: async (query: string): Promise<SearchResult> => {
    return fetchFromFinnhub(finnhubClient.symbolSearch(query));
  },

  // Stock candles (historical data)
  getCandles: async (
    symbol: string, 
    resolution: Resolution = 'D',
    from: number = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000),
    to: number = Math.floor(Date.now() / 1000)
  ): Promise<CandleData> => {
    return fetchFromFinnhub(finnhubClient.stockCandles(symbol, resolution, from, to));
  },

  // News sentiment
  getSentiment: async (symbol: string): Promise<SentimentData> => {
    return fetchFromFinnhub(finnhubClient.newsSentiment(symbol));
  },

  // Check if API key is configured
  isApiKeySet: (): boolean => {
    return isApiKeyValid();
  }
};

export default finnhubService;
