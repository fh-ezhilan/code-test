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
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    // Check if user has completed the test
    if (user?.testStatus === 'completed') {
      navigate('/test-completed');
      return;
    }

    const fetchInstructions = async () => {
      try {
        // Assuming you have authentication in place to get the token
        const res = await axios.get('/api/candidate/test/instructions', { withCredentials: true });
        setInstructions(res.data);
        
        // If test is already in progress, redirect to the appropriate test page
        if (user?.testStatus === 'in-progress') {
          if (res.data.testType === 'MCQ') {
            navigate('/test/mcq');
          } else if (res.data.testType === 'Explanation') {
            navigate('/test/explanation');
          } else {
            navigate('/test');
          }
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || 'Failed to load test instructions');
      }
    };
    fetchInstructions();
  }, [user, navigate]);

  const handleStartTest = async () => {
    try {
      await axios.post('/api/candidate/test/start', {}, { withCredentials: true });
      // Navigate based on test type
      if (instructions.testType === 'MCQ') {
        navigate('/test/mcq');
      } else if (instructions.testType === 'Explanation') {
        navigate('/test/explanation');
      } else {
        navigate('/test');
      }
    } catch (err) {
      console.error('Error starting test:', err);
      // Fallback to regular test page
      navigate('/test');
    }
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
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Instructions
        </Typography>
        <Typography paragraph>{instructions.instructions}</Typography>
        
        {instructions.testType === 'Coding' && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body1" paragraph>
              <strong>Choosing Programming Language:</strong>
              <br />
              • You can select your preferred programming language (Java, JavaScript, or Python) from the dropdown menu in the top-right section of the code editor.
            </Typography>
            
            <Typography variant="body1" paragraph>
              <strong>Running and Testing Your Code:</strong>
              <br />
              • Write your solution in the code editor provided.
              <br />
              • Click the <strong>"Run"</strong> button at the bottom-right to execute your code against sample test cases.
              <br />
              • View the output in the <strong>"Test Result"</strong> tab below the editor.
              <br />
              • Once satisfied with your solution, click the <strong>"Submit"</strong> button to finalize your submission.
            </Typography>
          </Box>
        )}
        
        <Typography variant="body1" paragraph sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: '#fff3cd', 
          borderLeft: '4px solid #ff9800',
          borderRadius: 1
        }}>
          <strong style={{ fontSize: '1.1rem' }}>⚠️ IMPORTANT: Do NOT switch tabs or windows during the test!</strong>
          <br />
          Switching tabs will trigger a warning on your first attempt. If you switch tabs a second time, your test will be automatically submitted and you will be logged out.
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: '#e3f2fd', 
          borderLeft: '4px solid #2196f3',
          borderRadius: 1
        }}>
          <strong>Time Management:</strong>
          <br />
          A popup notification will appear when you have <strong>5 minutes</strong> remaining in your test. Make sure to submit your answers before time runs out.
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
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
