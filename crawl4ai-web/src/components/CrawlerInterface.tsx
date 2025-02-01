import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  Alert
} from '@mui/material';
import { useMutation } from 'react-query';
import { ExtractionMode, CrawlResult } from '../types';
import MonitoringDashboard from './MonitoringDashboard';
import AgentController from './AgentController';
import { logger } from '../utils/logger';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const CrawlerInterface: React.FC = () => {
  const [mode, setMode] = useState<'manual' | 'agent' | 'monitor'>('manual');
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('default');
  const [url, setUrl] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedCrawlId, setSelectedCrawlId] = useState<string | null>(null);

  logger.debug('CrawlerInterface rendered', { mode, extractionMode, url });

  const crawlMutation = useMutation<CrawlResult, Error, void>(
    async () => {
      logger.info('Starting crawl request', { url, mode: extractionMode });
      try {
        const response = await fetch('http://localhost:8000/api/crawl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            mode: extractionMode,
            options: {}
          })
        });

        if (!response.ok) {
          const error = await response.json();
          logger.error('Crawl request failed', error);
          throw new Error(error.detail || 'Failed to start crawl');
        }

        const data = await response.json();
        logger.info('Crawl request successful', data);
        return data;
      } catch (error) {
        logger.error('Crawl request error', error);
        throw error;
      }
    }
  );

  const handleCrawl = () => {
    logger.info('Submitting crawl form', { url, extractionMode });
    crawlMutation.mutate();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleModeChange = (newMode: ExtractionMode) => {
    logger.debug('Extraction mode changed', newMode);
    setExtractionMode(newMode);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Crawl4AI Web Crawler
      </Typography>
      
      <Box sx={{ width: '100%', p: 3 }}>
        <Tabs 
          value={mode} 
          onChange={(_, newValue) => setMode(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Manual Crawl" value="manual" />
          <Tab label="AI Agent" value="agent" />
          <Tab label="Monitor" value="monitor" />
        </Tabs>

        {mode === 'manual' ? (
          <Box sx={{ width: '100%', mb: 4 }}>
            <Paper sx={{ p: 3 }}>
              <TextField
                fullWidth
                label="URL to crawl"
                value={url}
                onChange={(e) => {
                  logger.debug('URL changed', e.target.value);
                  setUrl(e.target.value);
                }}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ mb: 2 }}>
                <Tabs value={extractionMode} onChange={(_, value) => handleModeChange(value)}>
                  <Tab label="Default" value="default" />
                  <Tab label="JavaScript" value="javascript" />
                  <Tab label="Headless" value="headless" />
                </Tabs>
              </Box>

              <Button
                variant="contained"
                color="primary"
                onClick={handleCrawl}
                disabled={crawlMutation.isLoading || !url}
                fullWidth
                size="large"
              >
                {crawlMutation.isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Start Crawl'
                )}
              </Button>

              {crawlMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {crawlMutation.error?.message}
                </Alert>
              )}
            </Paper>
          </Box>
        ) : mode === 'agent' ? (
          <Box>
            <AgentController />
          </Box>
        ) : (
          <MonitoringDashboard />
        )}
      </Box>
    </Container>
  );
};

export default CrawlerInterface;
