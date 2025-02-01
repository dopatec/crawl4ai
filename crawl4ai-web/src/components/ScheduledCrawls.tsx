import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridValueGetterParams,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { ScheduledCrawl, NewScheduledCrawl, CrawlConfig, ExtractionMode } from '../types';

const defaultCrawlConfig: CrawlConfig = {
  url: '',
  mode: 'default',
  options: {},
  user_id: 'demo-user',
};

const ScheduledCrawls: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCrawl, setEditingCrawl] = useState<ScheduledCrawl | null>(null);
  const [formData, setFormData] = useState<Partial<NewScheduledCrawl>>({
    config: defaultCrawlConfig,
    schedule: '0 0 * * *',
    enabled: true,
  });

  const queryClient = useQueryClient();

  const { data: crawls, isLoading, error } = useQuery<ScheduledCrawl[]>(
    'scheduled-crawls',
    async () => {
      const response = await fetch('http://localhost:8000/api/scheduled-crawls');
      if (!response.ok) throw new Error('Failed to fetch scheduled crawls');
      return response.json();
    }
  );

  const createMutation = useMutation<ScheduledCrawl, Error, NewScheduledCrawl>(
    async (crawl) => {
      const response = await fetch('http://localhost:8000/api/scheduled-crawls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crawl),
      });
      if (!response.ok) throw new Error('Failed to create scheduled crawl');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scheduled-crawls');
        setOpenDialog(false);
      },
    }
  );

  const updateMutation = useMutation<ScheduledCrawl, Error, ScheduledCrawl>(
    async (crawl) => {
      const response = await fetch(`http://localhost:8000/api/scheduled-crawls/${crawl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crawl),
      });
      if (!response.ok) throw new Error('Failed to update scheduled crawl');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scheduled-crawls');
        setOpenDialog(false);
      },
    }
  );

  const deleteMutation = useMutation<void, Error, string>(
    async (id) => {
      const response = await fetch(`http://localhost:8000/api/scheduled-crawls/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete scheduled crawl');
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scheduled-crawls');
      },
    }
  );

  const columns: GridColDef[] = [
    {
      field: 'url',
      headerName: 'URL',
      flex: 1,
      valueGetter: (params: GridValueGetterParams) => params.row.config.url,
    },
    {
      field: 'schedule',
      headerName: 'Schedule',
      flex: 1,
    },
    {
      field: 'enabled',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <FormControlLabel
          control={
            <Switch
              checked={params.row.enabled}
              onChange={() => {
                const updatedCrawl: ScheduledCrawl = {
                  ...params.row,
                  enabled: !params.row.enabled,
                };
                updateMutation.mutate(updatedCrawl);
              }}
            />
          }
          label={params.row.enabled ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      field: 'last_run',
      headerName: 'Last Run',
      flex: 1,
      valueGetter: (params: GridValueGetterParams) => {
        return params.row.last_run ? format(new Date(params.row.last_run), 'PPpp') : 'Never';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            onClick={() => {
              setEditingCrawl(params.row);
              setFormData(params.row);
              setOpenDialog(true);
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this scheduled crawl?')) {
                deleteMutation.mutate(params.row.id);
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleFormSubmit = () => {
    const now = new Date().toISOString();
    if (editingCrawl) {
      const updatedCrawl: ScheduledCrawl = {
        ...editingCrawl,
        ...formData,
        updated_at: now,
      } as ScheduledCrawl;
      updateMutation.mutate(updatedCrawl);
    } else {
      const newCrawl: NewScheduledCrawl = {
        ...formData,
        created_at: now,
        updated_at: now,
      } as NewScheduledCrawl;
      createMutation.mutate(newCrawl);
    }
  };

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
        Failed to load scheduled crawls
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Scheduled Crawls
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditingCrawl(null);
            setFormData({
              config: defaultCrawlConfig,
              schedule: '0 0 * * *',
              enabled: true,
            });
            setOpenDialog(true);
          }}
        >
          Add Scheduled Crawl
        </Button>
      </Box>

      <DataGrid
        rows={crawls || []}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 5, page: 0 },
          },
        }}
        pageSizeOptions={[5, 10, 25]}
        autoHeight
        disableRowSelectionOnClick
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCrawl ? 'Edit Scheduled Crawl' : 'New Scheduled Crawl'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="URL"
              value={formData.config?.url || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  config: { ...(prev.config || defaultCrawlConfig), url: e.target.value },
                }))
              }
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Extraction Mode</InputLabel>
              <Select
                value={formData.config?.mode || 'default'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    config: {
                      ...(prev.config || defaultCrawlConfig),
                      mode: e.target.value as ExtractionMode,
                    },
                  }))
                }
                label="Extraction Mode"
              >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem value="headless">Headless</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Schedule (cron expression)"
              value={formData.schedule || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  schedule: e.target.value,
                }))
              }
              fullWidth
              required
              helperText="Example: 0 0 * * * (daily at midnight)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      enabled: e.target.checked,
                    }))
                  }
                />
              }
              label="Enabled"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            disabled={!formData.config?.url || !formData.schedule}
          >
            {editingCrawl ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ScheduledCrawls;
