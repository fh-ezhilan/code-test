import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Grid,
} from '@mui/material';
import axios from 'axios';

const AdminDashboard = () => {
  const [sessionName, setSessionName] = useState('');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [programTitle, setProgramTitle] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [candidateUsername, setCandidateUsername] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');

  const handleCreateSession = async () => {
    try {
      await axios.post('/api/admin/session', {
        name: sessionName,
        duration: sessionDuration,
        programs: [], // Add logic to select programs
      }, {
        withCredentials: true
      });
      alert('Test session created successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to create test session');
    }
  };

  const handleUploadProgram = async () => {
    try {
      await axios.post('/api/admin/program', {
        title: programTitle,
        description: programDescription,
        testCases: [], // Add logic to add test cases
      }, {
        withCredentials: true
      });
      alert('Program uploaded successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to upload program');
    }
  };

  const handleCreateCandidate = async () => {
    try {
      await axios.post('/api/admin/candidate', {
        username: candidateUsername,
        password: candidatePassword,
      }, {
        withCredentials: true
      });
      alert('Candidate created successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to create candidate');
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom mt={4}>
        Admin Dashboard
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: '2rem' }}>
            <Typography variant="h5" gutterBottom>
              Create Test Session
            </Typography>
            <TextField
              label="Session Name"
              fullWidth
              margin="normal"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
            />
            <TextField
              label="Duration (minutes)"
              type="number"
              fullWidth
              margin="normal"
              value={sessionDuration}
              onChange={e => setSessionDuration(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateSession}
              style={{ marginTop: '1rem' }}
            >
              Create Session
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: '2rem' }}>
            <Typography variant="h5" gutterBottom>
              Upload Program
            </Typography>
            <TextField
              label="Program Title"
              fullWidth
              margin="normal"
              value={programTitle}
              onChange={e => setProgramTitle(e.target.value)}
            />
            <TextField
              label="Program Description"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={programDescription}
              onChange={e => setProgramDescription(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleUploadProgram}
              style={{ marginTop: '1rem' }}
            >
              Upload Program
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: '2rem' }}>
            <Typography variant="h5" gutterBottom>
              Create Candidate
            </Typography>
            <TextField
              label="Candidate Username"
              fullWidth
              margin="normal"
              value={candidateUsername}
              onChange={e => setCandidateUsername(e.target.value)}
            />
            <TextField
              label="Candidate Password"
              type="password"
              fullWidth
              margin="normal"
              value={candidatePassword}
              onChange={e => setCandidatePassword(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateCandidate}
              style={{ marginTop: '1rem' }}
            >
              Create Candidate
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
