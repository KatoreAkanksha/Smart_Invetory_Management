import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, LineChart, BarChart2, DollarSign, AlertCircle, Key, ExternalLink } from 'lucide-react';
import { useFinnhub } from '@/contexts/FinnhubContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Default market indices to track
const marketIndices = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^IXIC', name: 'NASDAQ' },
];

// Default stocks for watchlist
const defaultWatchlist = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'
];

// Default portfolio data (this would come from user data in a real app)
const defaultPortfolio = [
  { symbol: 'AAPL', shares: 10, avgPrice: 150.00 },
  { symbol: 'MSFT', shares: 5, avgPrice: 300.00 },
  { symbol: 'GOOGL', shares: 15, avgPrice: 120.00 },
];

interface StockQuote {
  c: number;  // Current price
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: string;
}

interface PortfolioItem {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice?: number;
  currentValue?: number;
  profit?: number;
}

export const StockMarketDashboard: React.FC = () => {
  const { apiKey, setApiKey, isApiKeySet, getQuote, symbolSearch } = useFinnhub();
  const { language } = useLanguage();
  
  const [inputApiKey, setInputApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for market data
  const [indicesData, setIndicesData] = useState<StockData[]>([]);
  const [topStocks, setTopStocks] = useState<StockData[]>([]);
  const [watchlist, setWatchlist] = useState<StockData[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  // Handle API key submission
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputApiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }
    
    setApiKey(inputApiKey.trim());
    toast.success("API key has been set successfully");
    fetchAllData(); // Refresh data with new API key
  };

  // Fetch all market data
  const fetchAllData = async () => {
    if (!isApiKeySet) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchIndicesData(),
        fetchTopStocks(),
        fetchWatchlistData(),
        fetchPortfolioData()
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      console.error('Error fetching market data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch market indices data
  const fetchIndicesData = async () => {
    try {
      const indicesPromises = marketIndices.map(async (index) => {
        const quote = await getQuote(index.symbol);
        return {
          symbol: index.symbol,
          name: index.name,
          price: quote.c,
          change: quote.c - quote.pc,
          changePercent: ((quote.c - quote.pc) / quote.pc) * 100
        };
      });
      
      const results = await Promise.all(indicesPromises);
      setIndicesData(results);
    } catch (error) {
      console.error('Error fetching indices data:', error);
      // Use mock data as fallback
      setIndicesData(marketIndices.map((index, i) => ({
        symbol: index.symbol,
        name: index.name,
        price: 1000 + (i * 500),
        change: (Math.random() > 0.5 ? 1 : -1) * Math.random() * 20,
        changePercent: (Math.random() > 0.5 ? 1 : -1) * Math.random() * 2
      })));
    }
  };

  // Fetch top moving stocks
  const fetchTopStocks = async () => {
    try {
      // In a real implementation, you would use a specific API endpoint for market movers
      // For this demo, we'll use a predefined list of stocks
      const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
      const stockPromises = stockSymbols.map(async (symbol) => {
        const quote = await getQuote(symbol);
        const search = await symbolSearch(symbol);
        const name = search.result?.[0]?.description || symbol;
        
        return {
          symbol,
          name,
          price: quote.c,
          change: quote.c - quote.pc,
          changePercent: ((quote.c - quote.pc) / quote.pc) * 100,
          volume: '1.2M' // Mock volume data
        };
      });
      
      const results = await Promise.all(stockPromises);
      setTopStocks(results);
    } catch (error) {
      console.error('Error fetching top stocks:', error);
      // Use mock data as fallback
      setTopStocks([
        { symbol: 'AAPL', name: 'Apple Inc.', price: 180.95, change: 1.95, changePercent: 1.09, volume: '1.2M' },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.85, change: -3.15, changePercent: -0.82, volume: '890K' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 154.32, change: 0.87, changePercent: 0.57, volume: '750K' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 179.62, change: 2.43, changePercent: 1.37, volume: '1.5M' },
        { symbol: 'META', name: 'Meta Platforms Inc.', price: 472.18, change: -1.23, changePercent: -0.26, volume: '980K' }
      ]);
    }
  };

  // Fetch watchlist data
  const fetchWatchlistData = async () => {
    try {
      const watchlistPromises = defaultWatchlist.map(async (symbol) => {
        const quote = await getQuote(symbol);
        const search = await symbolSearch(symbol);
        const name = search.result?.[0]?.description || symbol;
        
        return {
          symbol,
          name,
          price: quote.c,
          change: quote.c - quote.pc,
          changePercent: ((quote.c - quote.pc) / quote.pc) * 100
        };
      });
      
      const results = await Promise.all(watchlistPromises);
      setWatchlist(results);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
      // Use mock data as fallback
      setWatchlist(defaultWatchlist.map((symbol, i) => ({
        symbol,
        name: `${symbol} Inc.`,
        price: 100 + (i * 50),
        change: (Math.random() > 0.5 ? 1 : -1) * Math.random() * 5,
        changePercent: (Math.random() > 0.5 ? 1 : -1) * Math.random() * 3
      })));
    }
  };

  // Fetch portfolio data
  const fetchPortfolioData = async () => {
    try {
      const portfolioPromises = defaultPortfolio.map(async (item) => {
        const quote = await getQuote(item.symbol);
        const currentPrice = quote.c;
        const currentValue = currentPrice * item.shares;
        const costBasis = item.avgPrice * item.shares;
        const profit = currentValue - costBasis;
        
        return {
          ...item,
          currentPrice,
          currentValue,
          profit
        };
      });
      
      const results = await Promise.all(portfolioPromises);
      setPortfolio(results);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      // Use mock data as fallback
      setPortfolio(defaultPortfolio.map(item => {
        const currentPrice = item.avgPrice * (1 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 0.2);
        const currentValue = currentPrice * item.shares;
        const costBasis = item.avgPrice * item.shares;
        const profit = currentValue - costBasis;
        
        return {
          ...item,
          currentPrice,
          currentValue,
          profit
        };
      }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
    
    // Set up refresh interval (every 60 seconds)
    const intervalId = setInterval(() => {
      if (isApiKeySet) {
        fetchAllData();
      }
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [isApiKeySet]);

  // API Key setup UI
  if (!isApiKeySet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Dashboard</CardTitle>
          <CardDescription>Track and monitor stock market trends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              To access real-time stock market data, you need to provide a Finnhub API key.
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                Finnhub API Key
              </label>
              <Input
                id="apiKey"
                type="text"
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                placeholder="Enter your Finnhub API key"
                className="font-mono"
              />
              <div className="flex items-start gap-2 mt-2">
                <Key className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  You can get a free API key by signing up at{' '}
                  <a
                    href="https://finnhub.io/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center hover:underline"
                  >
                    finnhub.io
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </a>
                </p>
              </div>
            </div>
            <Button type="submit">
              <Key className="h-4 w-4 mr-2" />
              Set API Key
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading && !error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Dashboard</CardTitle>
          <CardDescription>Track and monitor stock market trends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">
                <LineChart className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="portfolio">
                <DollarSign className="h-4 w-4 mr-2" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="watchlist">
                <BarChart2 className="h-4 w-4 mr-2" />
                Watchlist
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3 mt-4">
                {[1, 2, 3].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="divide-y">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <Skeleton className="h-5 w-20 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-5 w-24 mb-2" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Dashboard</CardTitle>
          <CardDescription>Track and monitor stock market trends</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              {error.includes('API key') && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal" 
                  onClick={() => setApiKey('')}
                >
                  Update API Key
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Calculate portfolio totals
  const portfolioTotalValue = portfolio.reduce((sum, item) => sum + (item.currentValue || 0), 0);
  const portfolioTotalProfit = portfolio.reduce((sum, item) => sum + (item.profit || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Dashboard</CardTitle>
        <CardDescription>Track and monitor stock market trends</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <LineChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="portfolio">
              <DollarSign className="h-4 w-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="watchlist">
              <BarChart2 className="h-4 w-4 mr-2" />
              Watchlist
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3 mt-4">
              {indicesData.map((index, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{index.name}</p>
                        <p className="text-2xl font-bold">{index.price.toLocaleString()}</p>
                      </div>
                      <Badge 
                        className={index.changePercent >= 0 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                        }
                      >
                        {index.changePercent >= 0 
                          ? <TrendingUp className="h-3 w-3 mr-1 inline" /> 
                          : <TrendingDown className="h-3 w-3 mr-1 inline" />
                        }
                        {index.changePercent >= 0 ? "+" : ""}{index.changePercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-medium">Market Movers</h3>
              </div>
              <div className="divide-y">
                {topStocks.map((stock, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{stock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{stock.price.toLocaleString()}</p>
                      <div className="flex items-center">
                        <Badge 
                          className={stock.changePercent >= 0 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                          }
                        >
                          {stock.changePercent >= 0 
                            ? <TrendingUp className="h-3 w-3 mr-1 inline" /> 
                            : <TrendingDown className="h-3 w-3 mr-1 inline" />
                          }
                          {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-2">Vol: {stock.volume}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3 mt-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">₹{portfolioTotalValue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Profit/Loss</p>
                  <p className={`text-2xl font-bold ${portfolioTotalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{portfolioTotalProfit.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Holdings</p>
                  <p className="text-2xl font-bold">{portfolio.length}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-medium">Your Portfolio</h3>
              </div>
              <div className="divide-y">
                {portfolio.map((holding, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{holding.symbol}</p>
                        <p className="text-sm text-muted-foreground">{holding.shares} shares @ ₹{holding.avgPrice.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{holding.currentValue?.toLocaleString()}</p>
                        <p className={holding.profit && holding.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {holding.profit && holding.profit >= 0 ? '+' : ''}₹{holding.profit?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-6">
            <div className="border rounded-lg mt-4">
              <div className="p-4 border-b">
                <h3 className="font-medium">Your Watchlist</h3>
              </div>
              <div className="divide-y">
                {watchlist.map((stock, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{stock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{stock.price.toLocaleString()}</p>
                      <div className="flex items-center">
                        <Badge 
                          className={stock.changePercent >= 0 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                          }
                        >
                          {stock.changePercent >= 0 
                            ? <TrendingUp className="h-3 w-3 mr-1 inline" /> 
                            : <TrendingDown className="h-3 w-3 mr-1 inline" />
                          }
                          {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};