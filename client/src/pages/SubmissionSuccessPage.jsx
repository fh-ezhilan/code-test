import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const SubmissionSuccessPage = () => {
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
            Submission Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mt: 2, mb: 4 }}>
            Your solution has been successfully submitted and sent for evaluation. 
            You will be notified of the results soon.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Thank you for completing the test.
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

export default SubmissionSuccessPage;
