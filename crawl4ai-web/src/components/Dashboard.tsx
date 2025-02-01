import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActions,
  useTheme,
} from '@mui/material';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useQuery } from 'react-query';

interface DashboardStats {
  total_crawls: number;
  active_crawls: number;
  scheduled_crawls: number;
  total_pages: number;
  success_rate: number;
  performance_metrics: {
    timestamp: string;
    crawl_speed: number;
    memory_usage: number;
    cpu_usage: number;
  }[];
}

const Dashboard: React.FC = () => {
  const theme = useTheme();

  const { data: stats, isLoading } = useQuery<DashboardStats>(
    'dashboard-stats',
    async () => {
      const response = await fetch('http://localhost:8000/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    }
  );

  if (isLoading || !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              Total Crawls
            </Typography>
            <Typography variant="h3">{stats.total_crawls}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              Active Crawls
            </Typography>
            <Typography variant="h3">{stats.active_crawls}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              Scheduled Crawls
            </Typography>
            <Typography variant="h3">{stats.scheduled_crawls}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              Success Rate
            </Typography>
            <Typography variant="h3">{stats.success_rate}%</Typography>
          </Paper>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.performance_metrics}>
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: theme.palette.text.secondary }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis tick={{ fill: theme.palette.text.secondary }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                  labelStyle={{ color: theme.palette.text.primary }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="crawl_speed"
                  name="Crawl Speed (pages/min)"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="memory_usage"
                  name="Memory Usage (%)"
                  stroke={theme.palette.secondary.main}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cpu_usage"
                  name="CPU Usage (%)"
                  stroke={theme.palette.success.main}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    New Crawl
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Start a new web crawling session
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => window.location.href = '/crawler'}>
                    Start Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Schedule Crawl
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Set up a new scheduled crawl
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => window.location.href = '/scheduled'}>
                    Schedule
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    View Sessions
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Monitor active agent sessions
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => window.location.href = '/sessions'}>
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Settings
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Configure system settings
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => window.location.href = '/settings'}>
                    Configure
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
