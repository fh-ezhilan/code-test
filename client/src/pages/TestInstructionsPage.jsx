import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  CircularProgress,
} from '@mui/material';

const TestInstructionsPage = () => {
  const [instructions, setInstructions] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        // Assuming you have authentication in place to get the token
        const res = await axios.get('/api/candidate/test/instructions', { withCredentials: true });
        setInstructions(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || 'Failed to load test instructions');
      }
    };
    fetchInstructions();
  }, []);

  const handleStartTest = () => {
    navigate('/test');
  };

  if (error) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
        <Paper elevation={3} style={{ padding: '2rem', marginTop: '2rem' }}>
          <Typography variant="h5" component="h1" gutterBottom align="center" color="error">
            {error}
          </Typography>
          <Typography paragraph align="center">
            Please contact the administrator to set up a test session.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!instructions) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      <Paper elevation={3} style={{ padding: '2rem', marginTop: '2rem' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {instructions.name}
        </Typography>
        <Typography variant="h6" gutterBottom>
          Instructions
        </Typography>
        <Typography paragraph>{instructions.instructions}</Typography>
        <Typography variant="h6" gutterBottom>
          Test Duration
        </Typography>
        <Typography paragraph>{instructions.duration} minutes</Typography>
        <Box mt={4} display="flex" justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleStartTest}
          >
            Start Test
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestInstructionsPage;
