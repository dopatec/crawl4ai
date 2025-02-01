import React from 'react';
import { useQuery } from 'react-query';
import {
  Paper,
  Typography,
  CircularProgress,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { AgentSession } from '../types';

const AgentSessions: React.FC = () => {
  const { data: sessions, isLoading } = useQuery<AgentSession[]>(
    'agent-sessions',
    async () => {
      const response = await fetch('http://localhost:8000/api/agent/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json();
    },
    {
      refetchInterval: 5000,
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography>No active agent sessions</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Active Agent Sessions
      </Typography>
      <List>
        {sessions.map((session) => (
          <ListItem key={session.id}>
            <ListItemText
              primary={session.objective}
              secondary={
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Status: <Chip label={session.status} color={session.status === 'running' ? 'success' : 'default'} size="small" />
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pages Crawled: {session.pages_crawled}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default AgentSessions;