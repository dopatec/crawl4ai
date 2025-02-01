import config from '../config';
import { CrawlRequest, CrawlResult } from '../types';

export const crawlWebsite = async (request: CrawlRequest, token: string): Promise<CrawlResult> => {
  const response = await fetch(`${config.apiUrl}/api/crawl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to crawl website');
  }

  return response.json();
};
