import axios, { AxiosResponse, AxiosError } from 'axios';

// API configuration
const API_KEY = process.env.REACT_APP_STOCK_API_KEY || 'demo';
const BASE_URL = 'https://finnhub.io/api/v1';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache: { [key: string]: { data: any; timestamp: number } } = {};

// Types
export interface StockQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
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

export interface StockCandle {
  c: number[];  // Close prices
  h: number[];  // High prices
  l: number[];  // Low prices
  o: number[];  // Open prices
  s: string;    // Status ('ok' or 'no_data')
  t: number[];  // Timestamps
  v: number[];  // Volumes
}

export interface SearchResult {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export interface MarketNews {
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

// Additional types for combined data
export interface StockData {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number | null;
  exchange?: string;
  industry?: string;
  website?: string;
}

export interface HistoricalDataPoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

// API error handling
interface ApiError {
  message: string;
  code?: string | number;
}

// Cache helpers
const getCacheKey = (endpoint: string, params: any): string => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const isCacheValid = (cacheKey: string): boolean => {
  const cacheItem = cache[cacheKey];
  if (!cacheItem) return false;
  
  const now = Date.now();
  return now - cacheItem.timestamp < CACHE_DURATION;
};

const getCachedData = <T>(cacheKey: string): T | null => {
  if (!isCacheValid(cacheKey)) return null;
  return cache[cacheKey].data;
};

const setCacheData = <T>(cacheKey: string, data: T): void => {
  cache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
};

// Clear specific cache entry
const clearCacheEntry = (endpoint: string, params: any = {}): void => {
  const cacheKey = getCacheKey(endpoint, params);
  delete cache[cacheKey];
};

// Clear all cache
const clearCache = (): void => {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
};

// API request helper
const apiRequest = async <T>(
  endpoint: string,
  params: any = {}
): Promise<T> => {
  try {
    // Add API key to params
    const requestParams = {
      ...params,
      token: API_KEY
    };
    
    // Check cache first
    const cacheKey = getCacheKey(endpoint, requestParams);
    const cachedData = getCachedData<T>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // Make the API request
    const response: AxiosResponse<T> = await axios.get(`${BASE_URL}${endpoint}`, {
      params: requestParams
    });
    
    // Cache the response
    setCacheData(cacheKey, response.data);
    
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    
    let errorMessage = 'An unknown error occurred';
    let errorCode;
    
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage = axiosError.response.data.error || 'Server error';
      errorCode = axiosError.response.status;
    } else if (axiosError.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = axiosError.message;
    }
    
    const apiError: ApiError = {
      message: errorMessage,
      code: errorCode
    };
    
    console.error('API request failed:', apiError);
    throw apiError;
  }
};

// Stock API methods
const StockApi = {
  // Get quote for a symbol
  getQuote: async (symbol: string): Promise<StockQuote> => {
    return apiRequest<StockQuote>('/quote', { symbol });
  },
  
  // Get company profile
  getCompanyProfile: async (symbol: string): Promise<CompanyProfile> => {
    return apiRequest<CompanyProfile>('/stock/profile2', { symbol });
  },
  
  // Get historical data
  getHistoricalData: async (
    symbol: string,
    resolution: string, // 1, 5, 15, 30, 60, D, W, M
    from: number,
    to: number
  ): Promise<StockCandle> => {
    return apiRequest<StockCandle>('/stock/candle', {
      symbol,
      resolution,
      from,
      to
    });
  },
  
  // Search for stocks
  searchStocks: async (query: string): Promise<SearchResult> => {
    return apiRequest<SearchResult>('/search', { q: query });
  },
  
  // Get market news
  getMarketNews: async (category: string = 'general'): Promise<MarketNews[]> => {
    return apiRequest<MarketNews[]>('/news', { category });
  },
  
  // Get company news
  getCompanyNews: async (
    symbol: string,
    from: string, // YYYY-MM-DD
    to: string    // YYYY-MM-DD
  ): Promise<MarketNews[]> => {
    return apiRequest<MarketNews[]>('/company-news', {
      symbol,
      from,
      to
    });
  },
  
  // Get stock data with combined information
  getStockData: async (symbol: string): Promise<StockData> => {
    try {
      // Get both quote and profile in parallel
      const [quoteData, profileData] = await Promise.all([
        StockApi.getQuote(symbol),
        StockApi.getCompanyProfile(symbol).catch(() => null) // Profile might not exist for all symbols
      ]);
      
      return {
        symbol,
        companyName: profileData?.name || symbol,
        price: quoteData.c,
        change: quoteData.d,
        changePercent: quoteData.dp,
        previousClose: quoteData.pc,
        open: quoteData.o,
        dayHigh: quoteData.h,
        dayLow: quoteData.l,
        volume: quoteData.v,
        marketCap: profileData?.marketCapitalization || null,
        exchange: profileData?.exchange,
        industry: profileData?.finnhubIndustry,
        website: profileData?.weburl
      };
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw error;
    }
  },
  
  // Get multiple stocks' data
  getMultipleStocksData: async (symbols: string[]): Promise<StockData[]> => {
    try {
      const promises = symbols.map(symbol => StockApi.getStockData(symbol));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching multiple stocks data:', error);
      throw error;
    }
  },
  
  // Get formatted historical data
  getFormattedHistoricalData: async (
    symbol: string,
    timeRange: string = '1m'
  ): Promise<HistoricalDataPoint[]> => {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      // Set time range
      switch (timeRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '1w':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '1m':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case '5y':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1);
      }
      
      const from = Math.floor(startDate.getTime() / 1000);
      const to = Math.floor(endDate.getTime() / 1000);
      
      // Determine appropriate resolution based on time range
      const resolution = timeRange === '1d' ? '5' :
                        timeRange === '1w' ? '60' :
                        timeRange === '1m' ? 'D' :
                        timeRange === '3m' ? 'D' :
                        timeRange === '1y' ? 'W' : 'W';
      
      const candles = await StockApi.getHistoricalData(symbol, resolution, from, to);
      
      if (candles.s === 'ok' && candles.t.length > 0) {
        // Format the data
        return candles.t.map((timestamp, index) => ({
          date: new Date(timestamp * 1000).toLocaleDateString(),
          close: candles.c[index],
          open: candles.o[index],
          high: candles.h[index],
          low: candles.l[index],
          volume: candles.v[index]
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw error;
    }
  },
  
  // Cache management
  cache: {
    clear: clearCache,
    clearEntry: clearCacheEntry
  }
};

export default StockApi;