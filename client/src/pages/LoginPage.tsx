import { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, ChildCare } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const { login, error, isLoading, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(username, pin);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <ChildCare sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>
              Daycare Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in with your username and PIN
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              autoFocus
              sx={{ mb: 2 }}
            />
            <TextField
              label="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              type={showPin ? 'text' : 'password'}
              fullWidth
              required
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPin(!showPin)} edge="end" size="small">
                      {showPin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading || !username || !pin}
              sx={{ py: 1.5 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
            Daycare Management System
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
