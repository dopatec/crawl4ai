import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Paper,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_usage: number;
}

interface AgentMetrics {
  total_sessions: number;
  active_sessions: number;
  error_sessions: number;
  hourly_counts: Array<{
    hour: string;
    count: number;
  }>;
}

interface MetricsData {
  system: SystemMetrics;
  agent: AgentMetrics;
  timestamp: string;
}

const MetricCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  color?: string;
}> = ({ title, value, unit, color }) => (
  <Card>
    <CardContent>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div" color={color}>
        {value}
        <Typography variant="body2" component="span" sx={{ ml: 1 }}>
          {unit}
        </Typography>
      </Typography>
    </CardContent>
  </Card>
);

const MonitoringDashboard: React.FC = () => {
  const theme = useTheme();

  const { data: metrics, isLoading, error } = useQuery<MetricsData>(
    'dashboard-metrics',
    async () => {
      const response = await fetch('http://localhost:8000/dashboard/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    {
      refetchInterval: 5000, // Refresh every 5 seconds
    }
  );

  const { data: history } = useQuery(
    'metrics-history',
    async () => {
      const response = await fetch('http://localhost:8000/dashboard/metrics/history');
      if (!response.ok) throw new Error('Failed to fetch metrics history');
      return response.json();
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load dashboard metrics
      </Alert>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Monitor
      </Typography>

      {/* System Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="CPU Usage"
            value={metrics.system.cpu_percent}
            unit="%"
            color={metrics.system.cpu_percent > 80 ? 'error.main' : 'success.main'}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Memory Usage"
            value={metrics.system.memory_percent}
            unit="%"
            color={metrics.system.memory_percent > 80 ? 'error.main' : 'success.main'}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Disk Usage"
            value={metrics.system.disk_usage}
            unit="%"
            color={metrics.system.disk_usage > 80 ? 'error.main' : 'success.main'}
          />
        </Grid>
      </Grid>

      {/* Agent Metrics */}
      <Typography variant="h5" gutterBottom>
        Agent Statistics
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Total Sessions"
            value={metrics.agent.total_sessions}
            unit="sessions"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Active Sessions"
            value={metrics.agent.active_sessions}
            unit="running"
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Error Sessions"
            value={metrics.agent.error_sessions}
            unit="errors"
            color="error.main"
          />
        </Grid>
      </Grid>

      {/* Hourly Activity Chart */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Hourly Activity
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.agent.hourly_counts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={theme.palette.primary.main} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Performance History */}
      {history && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            7-Day Performance
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.daily_metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_sessions"
                  stroke={theme.palette.primary.main}
                  name="Total Sessions"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="success_rate"
                  stroke={theme.palette.success.main}
                  name="Success Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default MonitoringDashboard;
