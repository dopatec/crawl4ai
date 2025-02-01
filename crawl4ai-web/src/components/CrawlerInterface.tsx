import React, { useState } from 'react';

interface CrawlResult {
  content?: string;
  metadata?: Record<string, any>;
}

const CrawlerInterface: React.FC = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCrawl = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Simulated crawl result for frontend demonstration
      const mockResult = {
        content: `Crawled content from ${url}:\n\nThis is a mock demonstration of Crawl4AI's web crawling capabilities.`,
        metadata: {
          url: url,
          timestamp: new Date().toISOString()
        }
      };

      setResult(mockResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crawler-interface">
      <h1>Crawl4AI Web Crawler</h1>
      
      <div className="input-container">
        <input 
          type="url" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL (e.g., https://example.com)"
          disabled={loading}
        />
        <button 
          onClick={handleCrawl} 
          disabled={loading}
        >
          {loading ? 'Crawling...' : 'Start Crawling'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading-spinner">Loading...</div>}

      {result && (
        <div className="result-container">
          <h2>Crawled Content:</h2>
          <pre>{result.content}</pre>
          
          <h3>Metadata:</h3>
          <pre>{JSON.stringify(result.metadata, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CrawlerInterface;
