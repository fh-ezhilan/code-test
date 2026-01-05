import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/login', {
        username,
        password,
      }, {
        withCredentials: true
      });
      const { user } = res.data;
      login(user);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        // Check if candidate has completed the test
        if (user.testStatus === 'completed') {
          navigate('/submission-success');
        } else if (user.testStatus === 'in-progress') {
          // If test is already in progress, route to the appropriate test page
          // Fetch test instructions to determine test type
          try {
            const testRes = await axios.get('/api/candidate/test/instructions', { withCredentials: true });
            if (testRes.data.testType === 'MCQ') {
              navigate('/test/mcq');
            } else {
              navigate('/test');
            }
          } catch (err) {
            // Fallback to instructions page if error
            navigate('/test/instructions');
          }
        } else {
          navigate('/test/instructions');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Login failed. Please try again.');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        mt={8}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Login
        </Typography>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {error && (
            <Typography color="error" variant="body2" style={{ marginBottom: '16px' }}>
              {error}
            </Typography>
          )}
          <TextField
            label="Username"
            variant="outlined"
            margin="normal"
            fullWidth
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            fullWidth
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            style={{ marginTop: '16px' }}
          >
            Login
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default LoginPage;
