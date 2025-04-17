import axios from 'axios';
import { getFinnhubUrl, validateEnv } from '../config/env.config';

// Define types for Finnhub responses
export interface Quote {
  c: number;  // Current price
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

class FinnhubService {
  // Check if the API key is properly configured
  private validateApiKey(): boolean {
    const isValid = validateEnv();
    if (!isValid) {
      console.error('⛔ Cannot make Finnhub API calls: API key is missing or invalid');
      console.error('Please check your .env file and ensure VITE_FINNHUB_API_KEY is set correctly');
    }
    return isValid;
  }

  /**
   * Helper method to log detailed API errors
   */
  private logApiError(error: any): void {
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:');
      console.error('- Status:', error.response?.status);
      console.error('- Status Text:', error.response?.statusText);
      console.error('- Response Data:', error.response?.data);
      
      if (error.response?.status === 401) {
        console.error('⚠️ Authentication Error: Your Finnhub API key is invalid or missing');
        console.error('Please check your .env file and ensure VITE_FINNHUB_API_KEY is set correctly');
      }
    }
  }

  /**
   * Generate mock stock quote data for development
   */
  private getMockQuote(symbol: string): Quote {
    return {
      c: 150.25, // Current price
      h: 152.00, // High price
      l: 148.50, // Low price
      o: 149.00, // Open price
      pc: 148.75, // Previous close
      t: Date.now() / 1000 // Current timestamp in seconds
    };
  }

  /**
   * Generate mock company profile for development
   */
  private getMockCompanyProfile(symbol: string): CompanyProfile {
    return {
      country: 'US',
      currency: 'USD',
      exchange: 'NASDAQ',
      ipo: '1980-12-12',
      marketCapitalization: 2500000000000,
      name: symbol === 'AAPL' ? 'Apple Inc' : `${symbol} Corporation`,
      phone: '14089961010',
      shareOutstanding: 16500000000,
      ticker: symbol,
      weburl: `https://www.${symbol.toLowerCase()}.com`,
      logo: `https://logo.clearbit.com/${symbol.toLowerCase()}.com`,
      finnhubIndustry: 'Technology'
    };
  }

  /**
   * Generate mock search results for development
   */
  private getMockSearchResults(query: string): any[] {
    const mockStocks = [
      { symbol: 'AAPL', description: 'Apple Inc' },
      { symbol: 'MSFT', description: 'Microsoft Corporation' },
      { symbol: 'GOOGL', description: 'Alphabet Inc' },
      { symbol: 'AMZN', description: 'Amazon.com Inc' },
      { symbol: 'META', description: 'Meta Platforms Inc' }
    ];
    
    return mockStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.description.toLowerCase().includes(query.toLowerCase())
    );
  }
  /**
   * Get real-time quote data for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with quote data
   */
  async getQuote(symbol: string): Promise<Quote> {
    try {
      // Check API key before making request
      if (!this.validateApiKey()) {
        return this.getMockQuote(symbol);
      }

      const url = getFinnhubUrl('/quote', { symbol });
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      
      // In development, provide more helpful error messages
      if (import.meta.env.DEV) {
        this.logApiError(error);
      }
      
      // Return mock data in development mode
      if (import.meta.env.DEV) {
        return this.getMockQuote(symbol);
      }
      
      throw error;
    }
  }

  /**
   * Get company profile information
   * @param symbol - Stock symbol
   * @returns Promise with company profile data
   */
  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    try {
      // Check API key before making request
      if (!this.validateApiKey()) {
        return this.getMockCompanyProfile(symbol);
      }

      const url = getFinnhubUrl('/stock/profile2', { symbol });
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching company profile for ${symbol}:`, error);
      
      // In development, provide more helpful error messages
      if (import.meta.env.DEV) {
        this.logApiError(error);
      }
      
      // Return mock data in development mode
      if (import.meta.env.DEV) {
        return this.getMockCompanyProfile(symbol);
      }
      
      throw error;
    }
  }

  /**
   * Search for symbols by query
   * @param query - Search query
   * @returns Promise with search results
   */
  async searchSymbols(query: string): Promise<any> {
    try {
      // Check API key before making request
      if (!this.validateApiKey()) {
        return { result: this.getMockSearchResults(query) };
      }

      const url = getFinnhubUrl('/search', { q: query });
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error searching symbols for ${query}:`, error);
      
      // In development, provide more helpful error messages
      if (import.meta.env.DEV) {
        this.logApiError(error);
        return { result: this.getMockSearchResults(query) };
      }
      
      throw error;
    }
  }

  /**
   * Get news for a specific symbol
   * @param symbol - Stock symbol
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   * @returns Promise with news articles
   */
  async getCompanyNews(symbol: string, from: string, to: string): Promise<any[]> {
    try {
      // Check API key before making request
      if (!this.validateApiKey()) {
        return [];
      }

      const url = getFinnhubUrl('/company-news', { 
        symbol,
        from,
        to
      });
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      
      // In development, provide more helpful error messages
      if (import.meta.env.DEV) {
        this.logApiError(error);
      }
      
      return [];
    }
  }

  /**
   * Get candlestick data for a symbol
   * @param symbol - Stock symbol
   * @param resolution - Candlestick resolution (1, 5, 15, 30, 60, D, W, M)
   * @param from - Start timestamp (Unix timestamp)
   * @param to - End timestamp (Unix timestamp)
   * @returns Promise with candlestick data
   */
  async getCandlestick(
    symbol: string, 
    resolution: string, 
    from: number, 
    to: number
  ): Promise<any> {
    try {
      // Check API key before making request
      if (!this.validateApiKey()) {
        return {
          s: "ok",
          c: [150, 151, 152, 151, 153],
          h: [155, 156, 157, 155, 158],
          l: [148, 149, 150, 149, 151],
          o: [149, 150, 151, 150, 152],
          t: Array(5).fill(0).map((_, i) => Math.floor(Date.now()/1000) - (86400 * (5-i)))
        };
      }

      const url = getFinnhubUrl('/stock/candle', {
        symbol,
        resolution,
        from: from.toString(),
        to: to.toString()
      });
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching candlestick data for ${symbol}:`, error);
      
      // In development, provide more helpful error messages
      if (import.meta.env.DEV) {
        this.logApiError(error);
        return {
          s: "ok",
          c: [150, 151, 152, 151, 153],
          h: [155, 156, 157, 155, 158],
          l: [148, 149, 150, 149, 151],
          o: [149, 150, 151, 150, 152],
          t: Array(5).fill(0).map((_, i) => Math.floor(Date.now()/1000) - (86400 * (5-i)))
        };
      }
      
      throw error;
    }
  }
}

// Export as singleton
export const finnhubService = new FinnhubService();
