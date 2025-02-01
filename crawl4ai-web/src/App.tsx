import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import CrawlerInterface from './components/CrawlerInterface';
import './App.css';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <CrawlerInterface />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
