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
  CircularProgress,
  Alert,
  Slider,
  Chip,
} from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import { LLMAgentConfig, AgentResponse } from '../types';

const AgentController: React.FC = () => {
  const [agentConfig, setAgentConfig] = useState<LLMAgentConfig>({
    objective: '',
    max_depth: 3,
    allowed_domains: [],
    reasoning_mode: 'detailed',
    temperature: 0.7,
  });
  const [newDomain, setNewDomain] = useState('');
  const queryClient = useQueryClient();

  const agentMutation = useMutation<AgentResponse, Error, LLMAgentConfig>(
    async (config) => {
      const response = await fetch('http://localhost:8000/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error('Failed to start agent');
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('agent-sessions');
      },
    }
  );

  const handleAddDomain = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && newDomain) {
      setAgentConfig({
        ...agentConfig,
        allowed_domains: [...agentConfig.allowed_domains, newDomain],
      });
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setAgentConfig({
      ...agentConfig,
      allowed_domains: agentConfig.allowed_domains.filter((d) => d !== domain),
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        AI Agent Configuration
      </Typography>
      
      <TextField
        label="Crawling Objective"
        fullWidth
        multiline
        rows={2}
        value={agentConfig.objective}
        onChange={(e) => setAgentConfig({ ...agentConfig, objective: e.target.value })}
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Reasoning Mode</InputLabel>
        <Select
          value={agentConfig.reasoning_mode}
          onChange={(e) => setAgentConfig({ ...agentConfig, reasoning_mode: e.target.value as 'fast' | 'detailed' })}
        >
          <MenuItem value="fast">Fast Execution</MenuItem>
          <MenuItem value="detailed">Detailed Analysis</MenuItem>
        </Select>
      </FormControl>

      <Typography gutterBottom>Max Crawl Depth: {agentConfig.max_depth}</Typography>
      <Slider
        value={agentConfig.max_depth}
        onChange={(_, value) => setAgentConfig({ ...agentConfig, max_depth: value as number })}
        min={1}
        max={10}
        marks
        sx={{ mb: 2 }}
      />

      <Typography gutterBottom>Temperature: {agentConfig.temperature}</Typography>
      <Slider
        value={agentConfig.temperature}
        onChange={(_, value) => setAgentConfig({ ...agentConfig, temperature: value as number })}
        min={0}
        max={1}
        step={0.1}
        marks
        sx={{ mb: 2 }}
      />

      <TextField
        label="Add Allowed Domain"
        fullWidth
        value={newDomain}
        onChange={(e) => setNewDomain(e.target.value)}
        onKeyPress={handleAddDomain}
        helperText="Press Enter to add domain"
        sx={{ mb: 2 }}
      />

      <Box sx={{ mb: 2 }}>
        {agentConfig.allowed_domains.map((domain) => (
          <Chip
            key={domain}
            label={domain}
            onDelete={() => handleRemoveDomain(domain)}
            sx={{ mr: 1, mb: 1 }}
          />
        ))}
      </Box>

      <Button
        variant="contained"
        fullWidth
        onClick={() => agentMutation.mutate(agentConfig)}
        disabled={agentMutation.isLoading || !agentConfig.objective || agentConfig.allowed_domains.length === 0}
      >
        {agentMutation.isLoading ? (
          <CircularProgress size={24} />
        ) : (
          'Start Autonomous Crawl'
        )}
      </Button>

      {agentMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {agentMutation.error?.message}
        </Alert>
      )}
    </Paper>
  );
};

export default AgentController;
