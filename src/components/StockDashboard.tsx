import React, { useState } from 'react';
import { useStockQuote, useCompanyProfile, useSymbolSearch } from '../hooks/useFinnhub';

interface StockDashboardProps {
  defaultSymbol?: string;
}

const StockDashboard: React.FC<StockDashboardProps> = ({ defaultSymbol = 'AAPL' }) => {
  const [symbol, setSymbol] = useState<string>(defaultSymbol);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { quote, loading: quoteLoading, error: quoteError } = useStockQuote(symbol);
  const { profile, loading: profileLoading, error: profileError } = useCompanyProfile(symbol);
  const { results: searchResults, loading: searchLoading } = useSymbolSearch(searchQuery);

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    setSearchQuery('');
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: profile?.currency || 'USD' 
    }).format(value);
  };

  const calculatePriceChange = (): { value: number; percentage: number } => {
    if (!quote) return { value: 0, percentage: 0 };
    
    const change = quote.c - quote.pc;
    const percentage = (change / quote.pc) * 100;
    
    return { value: change, percentage };
  };

  const priceChange = calculatePriceChange();
  const isPriceUp = priceChange.value >= 0;

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <input
            type="text"
            placeholder="Search for stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        {searchQuery && (
          <div className="relative">
            <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
              {searchLoading ? (
                <div className="p-2">Loading...</div>
              ) : (
                searchResults.map((result) => (
                  <div
                    key={result.symbol}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSymbolChange(result.symbol)}
                  >
                    <div className="font-medium">{result.symbol}</div>
                    <div className="text-sm text-gray-600">{result.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {(quoteLoading || profileLoading) ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-lg">Loading stock data...</p>
        </div>
      ) : quoteError || profileError ? (
        <div className="bg-red-100 p-4 rounded">
          <p className="text-red-700">Error loading stock data. Please check symbol and try again.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{profile?.name || symbol}</h1>
              <p className="text-gray-600">{profile?.exchange}: {symbol}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatCurrency(quote?.c)}</div>
              <div className={`flex items-center justify-end ${isPriceUp ? 'text-green-600' : 'text-red-600'}`}>
                <span>{isPriceUp ? '▲' : '▼'}</span>
                <span className="ml-1">{formatCurrency(Math.abs(priceChange.value))}</span>
                <span className="ml-1">({priceChange.percentage.toFixed(2)}%)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Previous Close</div>
              <div className="font-medium">{formatCurrency(quote?.pc)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Open</div>
              <div className="font-medium">{formatCurrency(quote?.o)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Day's High</div>
              <div className="font-medium">{formatCurrency(quote?.h)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Day's Low</div>
              <div className="font-medium">{formatCurrency(quote?.l)}</div>
            </div>
          </div>

          {profile && (
            <div className="border-t pt-4">
              <h2 className="text-xl font-bold mb-3">Company Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Industry</div>
                  <div className="font-medium">{profile.finnhubIndustry}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Market Cap</div>
                  <div className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: profile.currency,
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 2
                    }).format(profile.marketCapitalization)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Country</div>
                  <div className="font-medium">{profile.country}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Website</div>
                  <a 
                    href={profile.weburl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {profile.weburl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockDashboard;