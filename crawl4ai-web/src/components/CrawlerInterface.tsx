import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Paper,
  Grid,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Container
} from '@mui/material';
import { useMutation } from 'react-query';
import { ExtractionMode, CrawlResult } from '../types';
import ScheduledCrawls from './ScheduledCrawls';
import CrawlAnalytics from './CrawlAnalytics';

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
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<ExtractionMode>('default');
  const [tabValue, setTabValue] = useState(0);
  const [selectedCrawlId, setSelectedCrawlId] = useState<string | null>(null);

  const crawlMutation = useMutation<CrawlResult, Error>(
    async () => {
      const response = await fetch('http://localhost:8000/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          mode,
          options: {}
        })
      });

      if (!response.ok) {
        throw new Error('Crawl failed');
      }

      const data = await response.json();
      if (data.result.id) {
        setSelectedCrawlId(data.result.id);
      }
      return data.result;
    }
  );

  const handleCrawl = () => {
    crawlMutation.mutate();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Crawl4AI Web Crawler
      </Typography>
      
      <Box sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Crawler" />
            <Tab label="Scheduled Crawls" />
            {selectedCrawlId && <Tab label="Analytics" />}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="Enter the URL to crawl"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Extraction Mode</InputLabel>
                  <Select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as ExtractionMode)}
                    label="Extraction Mode"
                  >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="headless">Headless Browser</MenuItem>
                    <MenuItem value="sitemap">Sitemap</MenuItem>
                    <MenuItem value="api_discovery">API Discovery</MenuItem>
                    <MenuItem value="structured">Structured Data</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
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
              </Grid>
            </Grid>

            {crawlMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {crawlMutation.error?.message}
              </Alert>
            )}

            {crawlMutation.isSuccess && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Crawl Results
                </Typography>
                <Paper sx={{ p: 2 }}>
                  {/* Performance Metrics */}
                  {crawlMutation.data?.metadata?.performance && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">Performance</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            Load Time
                          </Typography>
                          <Typography>
                            {crawlMutation.data.metadata.performance.loadTime}ms
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            DOM Content Loaded
                          </Typography>
                          <Typography>
                            {crawlMutation.data.metadata.performance.domContentLoaded}ms
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Security Analysis */}
                  {crawlMutation.data?.metadata?.security && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">Security Analysis</Typography>
                      <Typography variant="body2">
                        Third-party Scripts:{' '}
                        {crawlMutation.data.metadata.security.thirdPartyScripts.length}
                      </Typography>
                      <Typography variant="body2">
                        Forms with Password Fields:{' '}
                        {
                          crawlMutation.data.metadata.security.forms.filter(
                            (f) => f.hasPassword
                          ).length
                        }
                      </Typography>
                    </Box>
                  )}

                  {/* Structured Data */}
                  {crawlMutation.data?.metadata?.schema_org && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">Structured Data</Typography>
                      <Typography variant="body2">
                        Schema.org Items:{' '}
                        {crawlMutation.data.metadata.schema_org.length}
                      </Typography>
                    </Box>
                  )}

                  {/* API Endpoints */}
                  {crawlMutation.data?.metadata?.api_endpoints && (
                    <Box>
                      <Typography variant="subtitle1">API Endpoints</Typography>
                      <Typography variant="body2">
                        Discovered Endpoints:{' '}
                        {crawlMutation.data.metadata.api_endpoints.length}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            )}
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ScheduledCrawls />
        </TabPanel>

        {selectedCrawlId && (
          <TabPanel value={tabValue} index={2}>
            <CrawlAnalytics crawlId={selectedCrawlId} />
          </TabPanel>
        )}
      </Box>
    </Container>
  );
};

export default CrawlerInterface;
