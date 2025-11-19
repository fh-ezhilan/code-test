import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const TestCompletedPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="md">
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            maxWidth: '600px',
            width: '100%'
          }}
        >
          <CheckCircleIcon 
            sx={{ 
              fontSize: 80, 
              color: '#00b8a3',
              mb: 3
            }} 
          />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Test Already Completed
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mt: 2, mb: 4 }}>
            You have already completed this test. Your solution has been submitted and is being evaluated.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
            Sit tight for the results!
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 3 }}>
            You will be notified once the evaluation is complete.
          </Typography>
          <Box mt={4}>
            <Button
              variant="contained"
              size="large"
              onClick={handleLogout}
              sx={{
                bgcolor: '#00b8a3',
                textTransform: 'none',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: '#009688'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default TestCompletedPage;
