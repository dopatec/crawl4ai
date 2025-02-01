// Types for the crawler application

export type ExtractionMode = 
  | 'default'
  | 'headless'
  | 'sitemap'
  | 'api_discovery'
  | 'structured';

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  resourceCount: number;
}

export interface SecurityAnalysis {
  thirdPartyScripts: string[];
  forms: {
    action: string;
    method: string;
    hasPassword: boolean;
  }[];
}

export interface CrawlConfig {
  url: string;
  mode: ExtractionMode;
  options: Record<string, any>;
  user_id: string;
}

export interface CrawlResult {
  id: string;
  url: string;
  content: string;
  metadata?: {
    performance?: PerformanceMetrics;
    security?: SecurityAnalysis;
    schema_org?: any[];
    open_graph?: Record<string, string>;
    api_endpoints?: {
      url: string;
      method: string;
      headers: Record<string, string>;
    }[];
  };
  extraction_mode: ExtractionMode;
  user_id?: string;
  created_at?: string;
  screenshot?: string;
}

export interface ScheduledCrawl {
  id: string;
  config: CrawlConfig;
  schedule: string;
  enabled: boolean;
  created_at: string;
  updated_at?: string;
  last_run?: string;
  last_error?: string;
}

export interface CrawlAnalytics {
  crawl_id: string;
  performance_metrics?: PerformanceMetrics;
  security_findings?: SecurityAnalysis;
  ai_insights?: {
    entities: string[];
    sentiment: number;
    summary: string;
    topics: string[];
  };
  entities?: string[];
  sentiment?: number;
  summary?: string;
  topics?: string[];
}

export interface DataEnrichment {
  crawl_id: string;
  entities?: {
    name: string;
    type: string;
    confidence: number;
  }[];
  sentiment_analysis?: {
    score: number;
    magnitude: number;
    sentences: {
      text: string;
      score: number;
    }[];
  };
  translations?: Record<string, string>;
}
