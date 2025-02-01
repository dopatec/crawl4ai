export interface CrawlResult {
  id?: string;
  url: string;
  content: string;
  metadata?: Record<string, any>;
  extraction_mode: 'default' | 'question_based' | 'knowledge_optimal';
  user_id: string;
  created_at?: string;
}

export interface CrawlRequest {
  url: string;
  extraction_mode: CrawlResult['extraction_mode'];
  max_depth?: number;
  timeout?: number;
}
