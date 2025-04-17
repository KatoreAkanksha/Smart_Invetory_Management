import React, { useState, useEffect } from 'react';
import finnhubService from '../services/finnhubService';
import { Card, Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';

interface NewsItem {
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

const FinancialNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('general');

  const fetchNews = async (selectedCategory: string = 'general') => {
    setLoading(true);
    setError(null);
    
    try {
      const newsData = await finnhubService.getMarketNews(selectedCategory);
      
      if (Array.isArray(newsData) && newsData.length > 0) {
        setNews(newsData);
      } else {
        // If API returns empty array or invalid data
        setError('No news articles found. Please try again later.');
        // Set fallback dummy data to prevent UI breaks
        setNews(getFallbackNews());
      }
    } catch (err) {
      console.error('Error fetching financial news:', err);
      setError('Failed to fetch news. Please try again later.');
      // Set fallback dummy data on error
      setNews(getFallbackNews());
    } finally {
      setLoading(false);
    }
  };

  // Provide fallback news data in case API fails
  const getFallbackNews = (): NewsItem[] => {
    return [
      {
        category: 'general',
        datetime: Date.now() / 1000,
        headline: 'Market Update: Latest Financial Trends',
        id: 1,
        image: 'https://via.placeholder.com/800x400?text=Financial+News',
        related: 'Markets',
        source: 'Financial Times',
        summary: 'This is a placeholder summary for when the Finnhub API is unavailable. Please check back later for live updates.',
        url: '#'
      },
      {
        category: 'general',
        datetime: (Date.now() - 3600000) / 1000,
        headline: 'Economic Outlook: Experts Weigh In',
        id: 2,
        image: 'https://via.placeholder.com/800x400?text=Economic+News',
        related: 'Economy',
        source: 'Bloomberg',
        summary: 'This is a placeholder article about economic forecasts. Please check back later for live updates from our news feed.',
        url: '#'
      }
    ];
  };

  useEffect(() => {
    fetchNews(category);

    // Refresh news every 5 minutes
    const intervalId = setInterval(() => {
      fetchNews(category);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [category]);

  // Format Unix timestamp to readable date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const categories = ['general', 'forex', 'crypto', 'merger'];

  return (
    <Container className="py-4">
      <h1 className="mb-4">Financial News</h1>
      
      <div className="mb-4">
        <h5>Filter by Category:</h5>
        <div className="d-flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'primary' : 'outline-primary'}
              onClick={() => {
                setCategory(cat);
                fetchNews(cat);
              }}
              className="text-capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>
      
      {error && (
        <Alert variant="warning" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading news...</span>
          </Spinner>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {news.map((item) => (
            <Col key={item.id}>
              <Card className="h-100 news-card">
                {item.image && (
                  <Card.Img 
                    variant="top" 
                    src={item.image} 
                    alt={item.headline}
                    onError={(e) => {
                      // Replace broken images with placeholder
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/800x400?text=No+Image';
                    }}
                  />
                )}
                <Card.Body>
                  <Card.Title>{item.headline}</Card.Title>
                  <div className="text-muted mb-2">
                    <small>{item.source} | {formatDate(item.datetime)}</small>
                  </div>
                  <Card.Text>
                    {item.summary && item.summary.length > 150
                      ? `${item.summary.substring(0, 150)}...`
                      : item.summary}
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="bg-white border-top-0">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Read More
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {!loading && news.length === 0 && !error && (
        <Alert variant="info">
          No news articles found for this category. Try selecting a different category.
        </Alert>
      )}
    </Container>
  );
};

export default FinancialNews;