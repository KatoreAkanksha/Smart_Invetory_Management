import { useState, useEffect } from 'react';
import { finnhubService, Quote, CompanyProfile } from '../services/finnhub.service';

// Hook for fetching stock quote
export const useStockQuote = (symbol: string) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchQuote = async () => {
      try {
        setLoading(true);
        const data = await finnhubService.getQuote(symbol);
        if (isMounted) {
          setQuote(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchQuote();

    // Set up auto-refresh every 15 seconds for real-time data
    const intervalId = setInterval(fetchQuote, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [symbol]);

  return { quote, loading, error };
};

// Hook for fetching company profile
export const useCompanyProfile = (symbol: string) => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await finnhubService.getCompanyProfile(symbol);
        if (isMounted) {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  return { profile, loading, error };
};

// Hook for searching symbols
export const useSymbolSearch = (query: string) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchSymbols = async () => {
      try {
        setLoading(true);
        const data = await finnhubService.searchSymbols(query);
        if (isMounted && data && data.result) {
          setResults(data.result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const debounceTimeout = setTimeout(() => {
      searchSymbols();
    }, 500); // Debounce search to avoid too many API calls

    return () => {
      isMounted = false;
      clearTimeout(debounceTimeout);
    };
  }, [query]);

  return { results, loading, error };
};