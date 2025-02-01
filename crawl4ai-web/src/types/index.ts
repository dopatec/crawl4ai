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
  updated_at: string;
  last_run?: string;
  last_error?: string;
}

export interface NewScheduledCrawl extends Omit<ScheduledCrawl, 'id'> {
  config: CrawlConfig;
  schedule: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
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

// LLM Agent Types
export interface LLMAgentConfig {
  objective: string;
  max_depth: number;
  allowed_domains: string[];
  reasoning_mode: 'fast' | 'detailed';
  temperature?: number;
}

export interface AgentStep {
  action: 'crawl' | 'analyze' | 'store';
  target: string;
  reasoning: string;
  timestamp: string;
}

export interface AgentSession {
  id: string;
  status: 'running' | 'completed' | 'error';
  objective: string;
  pages_crawled: number;
  config: LLMAgentConfig;
  created_at: string;
  steps: AgentStep[];
}

export interface AgentResponse {
  session_id: string;
  next_action: AgentStep;
  completion_status: number;
  error?: string;
}

// Monitoring Dashboard Types
export interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_usage: number;
}

export interface AgentMetrics {
  total_sessions: number;
  active_sessions: number;
  error_sessions: number;
  hourly_counts: Array<{
    hour: string;
    count: number;
  }>;
}

export interface MetricsHistory {
  daily_metrics: Array<{
    date: string;
    total_sessions: number;
    success_rate: number;
    avg_duration: number;
  }>;
  total_sessions_last_7_days: number;
}

export interface DashboardMetrics {
  system: SystemMetrics;
  agent: AgentMetrics;
  timestamp: string;
}

export interface DeepSeekConfig {
  api_key: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

export interface AppSettings {
  deepseek: DeepSeekConfig;
  crawling: {
    max_concurrent_crawls: number;
    request_delay: number;
    respect_robots_txt: boolean;
    max_retries: number;
    timeout: number;
  };
  monitoring: {
    enable_performance_tracking: boolean;
    log_level: 'debug' | 'info' | 'warn' | 'error';
    metrics_retention_days: number;
  };
}
