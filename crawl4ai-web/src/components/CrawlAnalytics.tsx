import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { CrawlAnalytics as ICrawlAnalytics } from '../types';
import { supabase } from '../lib/supabaseClient';

interface PerformanceChartData {
  timestamp: string;
  loadTime: number;
  domContentLoaded: number;
}

const CrawlAnalytics: React.FC<{ crawlId: string }> = ({ crawlId }) => {
  const { data: analytics, isLoading } = useQuery<ICrawlAnalytics>(
    ['analytics', crawlId],
    async () => {
      const session = await supabase.auth.getSession();
      const response = await fetch(`http://localhost:8000/api/analytics/${crawlId}`, {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  );

  if (isLoading) {
    return <Typography>Loading analytics...</Typography>;
  }

  if (!analytics) {
    return <Typography>No analytics available</Typography>;
  }

  const performanceData: PerformanceChartData[] = [
    {
      timestamp: format(new Date(), 'HH:mm:ss'),
      loadTime: analytics.performance_metrics?.loadTime || 0,
      domContentLoaded: analytics.performance_metrics?.domContentLoaded || 0
    }
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Crawl Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Performance Metrics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="loadTime"
                  stroke="#8884d8"
                  name="Load Time"
                />
                <Line
                  type="monotone"
                  dataKey="domContentLoaded"
                  stroke="#82ca9d"
                  name="DOM Content Loaded"
                />
              </LineChart>
            </ResponsiveContainer>
            <List>
              <ListItem>
                <ListItemText
                  primary="Resource Count"
                  secondary={analytics.performance_metrics?.resourceCount || 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="First Paint"
                  secondary={`${analytics.performance_metrics?.firstPaint || 0}ms`}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Security Findings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Security Analysis
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Third-Party Scripts"
                  secondary={
                    analytics.security_findings?.thirdPartyScripts?.length || 0
                  }
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Forms with Password Fields"
                  secondary={
                    analytics.security_findings?.forms?.filter(
                      (f) => f.hasPassword
                    ).length || 0
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* AI Insights */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              AI Insights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Sentiment Score
                    </Typography>
                    <Typography variant="h5">
                      {analytics.ai_insights?.sentiment.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Entities Detected
                    </Typography>
                    <Typography variant="h5">
                      {analytics.ai_insights?.entities.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Topics
                    </Typography>
                    <List dense>
                      {analytics.ai_insights?.topics.map((topic, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={topic} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Summary
                    </Typography>
                    <Typography variant="body1">
                      {analytics.ai_insights?.summary}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CrawlAnalytics;
