import React, { useState, useEffect } from 'react';
import finnhubService from '../services/finnhubService';
import { Spinner, Alert, Card, Form, Button, Container, Row, Col } from 'react-bootstrap';

interface StockQuote {
  c: number; // Current price
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  dp: number; // Percent change
}

const Stocks: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [stockData, setStockData] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Fetch stock data based on symbol
  const fetchStockData = async (stockSymbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await finnhubService.getStockQuote(stockSymbol);
      setStockData(data);
    } catch (err) {
      setError('Failed to fetch stock data. Please try again later.');
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search for stock symbols
  const searchStocks = async (query: string) => {
    if (!query) return;
    
    setSearching(true);
    try {
      const results = await finnhubService.getStockSymbols(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching stocks:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol) {
      fetchStockData(symbol);
      setSearchResults([]);
    }
  };

  // Initialize with default symbol
  useEffect(() => {
    fetchStockData(symbol);
  }, []);

  return (
    <Container className="py-4">
      <h1 className="mb-4">Stock Tracker</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="stockSymbol">
              <Form.Label>Enter Stock Symbol</Form.Label>
              <Form.Control
                type="text"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value.toUpperCase());
                  if (e.target.value.length > 1) {
                    searchStocks(e.target.value);
                  }
                }}
                placeholder="e.g. AAPL, MSFT, GOOGL"
              />
            </Form.Group>
            
            {searchResults.length > 0 && (
              <div className="search-results mt-2 mb-3">
                <Card>
                  <Card.Body className="p-0">
                    <ul className="list-group">
                      {searchResults.slice(0, 5).map((result, index) => (
                        <li 
                          key={index} 
                          className="list-group-item" 
                          onClick={() => {
                            setSymbol(result.symbol);
                            fetchStockData(result.symbol);
                            setSearchResults([]);
                          }}
                        >
                          <b>{result.symbol}</b> - {result.description}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </div>
            )}
            
            <Button type="submit" variant="primary" className="mt-3">
              {loading ? 'Loading...' : 'Get Stock Data'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : stockData ? (
        <Card>
          <Card.Header as="h5">{symbol} Stock Information</Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Current Price:</strong> ${stockData.c.toFixed(2)}</p>
                <p><strong>Previous Close:</strong> ${stockData.pc.toFixed(2)}</p>
              </Col>
              <Col md={6}>
                <p><strong>Day High:</strong> ${stockData.h.toFixed(2)}</p>
                <p><strong>Day Low:</strong> ${stockData.l.toFixed(2)}</p>
              </Col>
            </Row>
            <Row>
              <Col>
                <p><strong>Change:</strong> 
                  <span className={stockData.dp >= 0 ? 'text-success' : 'text-danger'}>
                    {stockData.dp >= 0 ? ' +' : ' '}
                    {stockData.dp.toFixed(2)}%
                  </span>
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ) : !error && (
        <Alert variant="info">Enter a stock symbol and click "Get Stock Data" to view details.</Alert>
      )}
    </Container>
  );
};

export default Stocks;