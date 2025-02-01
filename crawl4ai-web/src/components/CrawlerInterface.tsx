import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CrawlResult } from '../types';

interface CrawlerInterfaceProps {}

const CrawlerInterface: React.FC<CrawlerInterfaceProps> = () => {
  const [url, setUrl] = useState('');
  const [extractionMode, setExtractionMode] = useState<CrawlResult['extraction_mode']>('default');
  const [crawlResults, setCrawlResults] = useState<CrawlResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to crawl results
    const channel = supabase
      .channel('crawl_results')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crawl_results'
        },
        (payload) => {
          const newResult = payload.new as CrawlResult;
          setCrawlResults(prev => [...prev, newResult]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCrawl = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to use the crawler');
      }

      const response = await fetch('http://localhost:8000/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          url,
          extraction_mode: extractionMode
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start crawl');
      }

      const result = await response.json();
      setCrawlResults(prev => [...prev, result]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crawler-interface">
      <h1>Web Crawler</h1>
      <div className="input-group">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to crawl"
          required
        />
        <select
          value={extractionMode}
          onChange={(e) => setExtractionMode(e.target.value as CrawlResult['extraction_mode'])}
        >
          <option value="default">Default</option>
          <option value="question_based">Question Based</option>
          <option value="knowledge_optimal">Knowledge Optimal</option>
        </select>
        <button onClick={handleCrawl} disabled={loading || !url}>
          {loading ? 'Crawling...' : 'Start Crawl'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="results">
        <h2>Crawl Results</h2>
        {crawlResults.map((result, index) => (
          <div key={result.id || index} className="result-item">
            <h3>{result.url}</h3>
            <p>Mode: {result.extraction_mode}</p>
            <p>Content: {result.content}</p>
            {result.metadata && (
              <pre>{JSON.stringify(result.metadata, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CrawlerInterface;
