import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Slider,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Divider,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Info } from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import { AppSettings } from '../types';
import { logger } from '../utils/logger';

type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

const defaultSettings: AppSettings = {
  deepseek: {
    api_key: '',
    model: 'deepseek-chat',
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.95,
    frequency_penalty: 0,
    presence_penalty: 0,
  },
  crawling: {
    max_concurrent_crawls: 5,
    request_delay: 1000,
    respect_robots_txt: true,
    max_retries: 3,
    timeout: 30000,
  },
  monitoring: {
    enable_performance_tracking: true,
    log_level: 'info',
    metrics_retention_days: 30,
  },
};

const Settings: React.FC = () => {
  logger.debug('Settings component rendered');

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
  }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading } = useQuery<AppSettings>(
    'settings',
    async () => {
      logger.info('Fetching settings');
      try {
        const response = await fetch('http://localhost:8000/api/settings');
        if (!response.ok) {
          const error = await response.json();
          logger.error('Failed to fetch settings', error);
          throw new Error(error.detail || 'Failed to fetch settings');
        }
        const data = await response.json();
        logger.info('Settings fetched successfully', data);
        return data;
      } catch (error) {
        logger.error('Error fetching settings', error);
        throw error;
      }
    },
    {
      onSuccess: (data) => {
        setSettings(data);
      },
    }
  );

  const updateMutation = useMutation<AppSettings, Error, AppSettings>(
    async (newSettings) => {
      logger.info('Updating settings', newSettings);
      try {
        const response = await fetch('http://localhost:8000/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });
        if (!response.ok) {
          const error = await response.json();
          logger.error('Failed to update settings', error);
          throw new Error(error.detail || 'Failed to update settings');
        }
        const data = await response.json();
        logger.info('Settings updated successfully', data);
        return data;
      } catch (error) {
        logger.error('Error updating settings', error);
        throw error;
      }
    },
    {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: 'Settings updated successfully',
          severity: 'success',
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Failed to update settings: ${error.message}`,
          severity: 'error',
        });
      },
    }
  );

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleReset = () => {
    setSettings(data || defaultSettings);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>
        <Typography color="text.secondary">
          Configure your DeepSeek API and application settings
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* DeepSeek API Settings */}
      <Typography variant="h6" gutterBottom>
        DeepSeek API Configuration
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="API Key"
            value={settings.deepseek.api_key}
            onChange={(e) =>
              setSettings({
                ...settings,
                deepseek: { ...settings.deepseek, api_key: e.target.value },
              })
            }
            type={showApiKey ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Model</InputLabel>
            <Select
              value={settings.deepseek.model}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  deepseek: { ...settings.deepseek, model: e.target.value },
                })
              }
              label="Model"
            >
              <MenuItem value="deepseek-chat">DeepSeek Chat</MenuItem>
              <MenuItem value="deepseek-coder">DeepSeek Coder</MenuItem>
              <MenuItem value="deepseek-large">DeepSeek Large</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>
              Temperature{' '}
              <Tooltip title="Controls randomness in the output. Higher values make the output more random, lower values make it more focused and deterministic.">
                <Info fontSize="small" sx={{ verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Slider
              value={settings.deepseek.temperature}
              onChange={(_, value) =>
                setSettings({
                  ...settings,
                  deepseek: { ...settings.deepseek, temperature: value as number },
                })
              }
              min={0}
              max={1}
              step={0.1}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Crawling Settings */}
      <Typography variant="h6" gutterBottom>
        Crawling Configuration
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Max Concurrent Crawls"
            value={settings.crawling.max_concurrent_crawls}
            onChange={(e) =>
              setSettings({
                ...settings,
                crawling: {
                  ...settings.crawling,
                  max_concurrent_crawls: parseInt(e.target.value),
                },
              })
            }
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Request Delay (ms)"
            value={settings.crawling.request_delay}
            onChange={(e) =>
              setSettings({
                ...settings,
                crawling: {
                  ...settings.crawling,
                  request_delay: parseInt(e.target.value),
                },
              })
            }
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.crawling.respect_robots_txt}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    crawling: {
                      ...settings.crawling,
                      respect_robots_txt: e.target.checked,
                    },
                  })
                }
              />
            }
            label="Respect robots.txt"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Monitoring Settings */}
      <Typography variant="h6" gutterBottom>
        Monitoring Configuration
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Log Level</InputLabel>
            <Select
              value={settings.monitoring.log_level}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  monitoring: {
                    ...settings.monitoring,
                    log_level: e.target.value as 'debug' | 'info' | 'warn' | 'error',
                  },
                })
              }
              label="Log Level"
            >
              <MenuItem value="debug">Debug</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="warn">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Metrics Retention (days)"
            value={settings.monitoring.metrics_retention_days}
            onChange={(e) =>
              setSettings({
                ...settings,
                monitoring: {
                  ...settings.monitoring,
                  metrics_retention_days: parseInt(e.target.value),
                },
              })
            }
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.monitoring.enable_performance_tracking}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monitoring: {
                      ...settings.monitoring,
                      enable_performance_tracking: e.target.checked,
                    },
                  })
                }
              />
            }
            label="Enable Performance Tracking"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={handleReset}>
          Reset
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={updateMutation.isLoading}
        >
          Save Changes
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Settings;
