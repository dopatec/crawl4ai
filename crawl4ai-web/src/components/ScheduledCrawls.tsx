import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef,
  GridRenderCellParams,
  GridValueGetterParams
} from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { ScheduledCrawl, ExtractionMode } from '../types';

const ScheduledCrawls: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledCrawl | null>(null);
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery<ScheduledCrawl[]>(
    'schedules',
    async () => {
      const response = await fetch('http://localhost:8000/api/schedules');
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      return response.json();
    }
  );

  const createMutation = useMutation<ScheduledCrawl, Error, Partial<ScheduledCrawl>>(
    async (newSchedule) => {
      const response = await fetch('http://localhost:8000/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSchedule)
      });
      if (!response.ok) {
        throw new Error('Failed to create schedule');
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schedules');
        setDialogOpen(false);
      }
    }
  );

  const updateMutation = useMutation<ScheduledCrawl, Error, Partial<ScheduledCrawl>>(
    async (updatedSchedule) => {
      const response = await fetch(`http://localhost:8000/api/schedules/${updatedSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSchedule)
      });
      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schedules');
        setDialogOpen(false);
      }
    }
  );

  const deleteMutation = useMutation<void, Error, string>(
    async (id) => {
      const response = await fetch(`http://localhost:8000/api/schedules/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schedules');
      }
    }
  );

  const columns: GridColDef<ScheduledCrawl>[] = [
    {
      field: 'config',
      headerName: 'URL',
      flex: 1,
      valueGetter: (params: GridValueGetterParams<ScheduledCrawl>) => params.row.config.url
    },
    {
      field: 'schedule',
      headerName: 'Schedule',
      width: 200
    },
    {
      field: 'enabled',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<ScheduledCrawl>) => (
        <Box
          sx={{
            backgroundColor: params.row.enabled ? 'success.light' : 'error.light',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1
          }}
        >
          {params.row.enabled ? 'Active' : 'Inactive'}
        </Box>
      )
    },
    {
      field: 'last_run',
      headerName: 'Last Run',
      width: 200,
      valueGetter: (params: GridValueGetterParams<ScheduledCrawl>) =>
        params.row.last_run ? format(new Date(params.row.last_run), 'PPpp') : 'Never'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params: GridRenderCellParams<ScheduledCrawl>) => (
        <Box>
          <IconButton
            onClick={() => {
              setSelectedSchedule(params.row);
              setDialogOpen(true);
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this schedule?')) {
                deleteMutation.mutate(params.row.id);
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  const [formData, setFormData] = useState<Partial<ScheduledCrawl>>({
    config: {
      url: '',
      mode: 'default',
      options: {},
      user_id: 'demo-user'
    },
    schedule: '0 0 * * *',
    enabled: true
  });

  const handleFormChange = (field: string, value: any) => {
    if (field === 'url') {
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config!,
          url: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Scheduled Crawls</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedSchedule(null);
            setFormData({
              config: {
                url: '',
                mode: 'default',
                options: {},
                user_id: 'demo-user'
              },
              schedule: '0 0 * * *',
              enabled: true
            });
            setDialogOpen(true);
          }}
        >
          Add Schedule
        </Button>
      </Box>

      <Paper sx={{ height: '100%', width: '100%' }}>
        <DataGrid
          rows={schedules}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          autoPageSize
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSchedule ? 'Edit Schedule' : 'New Schedule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="URL"
              value={selectedSchedule?.config.url ?? formData.config?.url}
              onChange={(e) => handleFormChange('url', e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Extraction Mode</InputLabel>
              <Select
                value={selectedSchedule?.config.mode ?? formData.config?.mode}
                onChange={(e) => handleFormChange('mode', e.target.value)}
                label="Extraction Mode"
              >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="headless">Headless Browser</MenuItem>
                <MenuItem value="sitemap">Sitemap</MenuItem>
                <MenuItem value="api_discovery">API Discovery</MenuItem>
                <MenuItem value="structured">Structured Data</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Schedule (cron expression)"
              value={selectedSchedule?.schedule ?? formData.schedule}
              onChange={(e) => handleFormChange('schedule', e.target.value)}
              fullWidth
              helperText="Example: 0 0 * * * (daily at midnight)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={selectedSchedule?.enabled ?? formData.enabled}
                  onChange={(e) => handleFormChange('enabled', e.target.checked)}
                />
              }
              label="Enabled"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const schedule = selectedSchedule
                ? {
                    ...selectedSchedule,
                    ...formData
                  }
                : {
                    ...formData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };

              if (selectedSchedule) {
                updateMutation.mutate(schedule);
              } else {
                createMutation.mutate(schedule);
              }
            }}
          >
            {selectedSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduledCrawls;
