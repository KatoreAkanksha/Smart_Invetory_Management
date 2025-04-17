import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { getFinnhubApiKey, FINNHUB_CONFIG } from "@/config/api";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  image?: string;
}

interface StockNewsProps {
  symbol?: string;
}

export function StockNews({ symbol }: StockNewsProps) {
  const { t } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, [symbol]);

  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiKey = getFinnhubApiKey();
      if (!apiKey || apiKey === "demo") {
        setError("API key not set or using demo mode. Please set your Finnhub API key in settings.");
        setIsLoading(false);
        return;
      }

      // Get news from the last 7 days
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      const toDate = new Date();
      
      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];
      
      let url = `${FINNHUB_CONFIG.baseUrl}/news?category=general&token=${apiKey}`;
      
      // If symbol is provided, get company-specific news
      if (symbol) {
        url = `${FINNHUB_CONFIG.baseUrl}/company-news?symbol=${symbol}&from=${fromDateStr}&to=${toDateStr}&token=${apiKey}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      
      // Limit to 10 news items
      const limitedData = data.slice(0, 10);
      
      const mapped = limitedData.map((item: any, idx: number) => ({
        id: String(item.id || idx),
        title: item.headline || item.title,
        summary: item.summary,
        source: item.source,
        url: item.url,
        publishedAt: new Date(item.datetime * 1000).toISOString(),
        category: item.category || "General",
        image: item.image,
      }));
      setNews(mapped);
    } catch (err: any) {
      setError(err.message || "Failed to fetch news.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, news.length));
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "markets":
      case "market":
        return "bg-blue-100 text-blue-800";
      case "economy":
      case "economic":
        return "bg-green-100 text-green-800";
      case "corporate":
      case "business":
        return "bg-purple-100 text-purple-800";
      case "policy":
      case "political":
        return "bg-amber-100 text-amber-800";
      case "regulation":
      case "legal":
        return "bg-red-100 text-red-800";
      case "technology":
      case "tech":
        return "bg-indigo-100 text-indigo-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-md flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle>{t("Error")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {news.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            {symbol 
              ? t(`No recent news available for ${symbol}`) 
              : t("No financial news available at the moment.")}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {news.slice(0, visibleCount).map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {item.image && (
                      <div className="w-full md:w-24 h-40 md:h-24 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">
                            {t("Image")}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium">
                          {symbol && <span className="text-primary">{symbol}: </span>}
                          {item.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`ml-2 flex-shrink-0 ${getCategoryColor(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {item.summary}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          {item.source} • {formatDate(item.publishedAt)} • 
                          {format(new Date(item.publishedAt), ' MMM dd, yyyy')}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center text-primary hover:underline"
                        >
                          {t("Read More")}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {visibleCount < news.length && (
            <div className="text-center">
              <Button variant="outline" onClick={loadMore}>
                {t("Load More")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
