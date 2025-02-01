import { useEffect, useState } from 'react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthProps {
  onAuthStateChange?: (user: User | null) => void;
}

const Auth = ({ onAuthStateChange }: AuthProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      onAuthStateChange?.(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      onAuthStateChange?.(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onAuthStateChange]);

  const handleGithubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <Box sx={{ textAlign: 'right', p: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Signed in as {user.email}
        </Typography>
        <Button variant="outlined" size="small" onClick={handleLogout}>
          Sign Out
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Welcome to Crawl4AI
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please sign in to continue
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGithubLogin}
          size="large"
        >
          Sign in with GitHub
        </Button>
      </Paper>
    </Container>
  );
};

export default Auth;
