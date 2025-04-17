import React, { useState } from 'react';
import { config } from '../config/env.config';

const ApiKeyDebug: React.FC = () => {
  const [showKey, setShowKey] = useState(false);
  const apiKey = config.finnhub.apiKey;
  
  // Function to partially mask the API key for display
  const maskApiKey = (key: string): string => {
    if (!key) return 'NOT SET';
    if (key === 'your_actual_finnhub_api_key_here') return 'USING PLACEHOLDER VALUE';
    
    // Only show first 4 and last 4 characters
    if (key.length > 8) {
      return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    }
    return '***INVALID FORMAT***';
  };
  
  const testApiKey = async () => {
    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`);
      const data = await response.json();
      
      if (response.ok) {
        alert('API Key is working! Successfully retrieved data from Finnhub.');
        console.log('API response:', data);
      } else {
        alert(`API Key error: ${data.error || 'Unknown error'}`);
        console.error('API error:', data);
      }
    } catch (error) {
      alert(`Network error testing API key: ${error}`);
      console.error('Error testing API key:', error);
    }
  };
  
  return (
    <div className="p-4 m-4 bg-yellow-100 border border-yellow-400 rounded-md">
      <h2 className="text-lg font-bold mb-2">Finnhub API Key Diagnostics</h2>
      
      <div className="mb-4">
        <div className="font-medium">API Key Status:</div>
        <div className="flex items-center space-x-2">
          <span className="font-mono bg-gray-100 p-1 rounded">
            {showKey ? apiKey || 'NOT SET' : maskApiKey(apiKey)}
          </span>
          <button 
            onClick={() => setShowKey(!showKey)}
            className="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="font-medium">API Key Length:</div>
        <div className="font-mono bg-gray-100 p-1 rounded">
          {apiKey ? apiKey.length : '0'} characters
        </div>
      </div>
      
      <div className="mb-4">
        <button
          onClick={testApiKey}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test API Key
        </button>
        <p className="text-sm mt-1 text-gray-600">
          This will make a direct request to Finnhub and show the result.
        </p>
      </div>
      
      <div className="text-sm text-gray-700 border-t pt-3 mt-3">
        <p className="font-bold">Troubleshooting steps:</p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Verify you have signed up at <a href="https://finnhub.io" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">finnhub.io</a></li>
          <li>Check that you've copied your API key correctly (no extra spaces)</li>
          <li>Make sure your .env file has the variable named exactly <code className="bg-gray-100 p-1">VITE_FINNHUB_API_KEY</code></li>
          <li>Restart your development server after changing the .env file</li>
          <li>If using the free tier, check that you haven't exceeded API limits</li>
        </ol>
      </div>
    </div>
  );
};

export default ApiKeyDebug;