import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        // Assuming you have authentication in place to get the token
        const res = await axios.get('/api/candidate/test/instructions', { withCredentials: true });
        setInstructions(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInstructions();
  }, []);

  const handleStartTest = () => {
    navigate('/test');
  };

  if (!instructions) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: '2rem', marginTop: '4rem' }}>
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
