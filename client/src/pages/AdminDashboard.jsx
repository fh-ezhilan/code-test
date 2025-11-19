import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'candidates' ? 1 : 0);
  const [openTestDialog, setOpenTestDialog] = useState(false);
  const [openCandidateDialog, setOpenCandidateDialog] = useState(false);
  const [openProgramDialog, setOpenProgramDialog] = useState(false);
  
  // Test Session States
  const [sessionName, setSessionName] = useState('');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [sessions, setSessions] = useState([]);
  
  // Program States
  const [programTitle, setProgramTitle] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programs, setPrograms] = useState([]);
  
  // Candidate States
  const [candidateUsername, setCandidateUsername] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetchCandidates();
    fetchSessions();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get('/api/admin/candidates', { withCredentials: true });
      setCandidates(res.data);
    } catch (err) {
      console.error('Error fetching candidates:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/admin/sessions', { withCredentials: true });
      setSessions(res.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchParams({ tab: newValue === 0 ? 'tests' : 'candidates' });
  };

  const handleCreateSession = async () => {
    try {
      await axios.post('/api/admin/session', {
        name: sessionName,
        duration: sessionDuration,
        programs: [],
      }, {
        withCredentials: true
      });
      setSessionName('');
      setSessionDuration(60);
      setOpenTestDialog(false);
      fetchSessions();
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
        testCases: [],
      }, {
        withCredentials: true
      });
      setProgramTitle('');
      setProgramDescription('');
      setOpenProgramDialog(false);
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
      setCandidateUsername('');
      setCandidatePassword('');
      setOpenCandidateDialog(false);
      fetchCandidates();
      alert('Candidate created successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to create candidate');
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) {
      return;
    }
    try {
      await axios.delete(`/api/admin/candidate/${candidateId}`, {
        withCredentials: true
      });
      await fetchCandidates();
      alert('Candidate deleted successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to delete candidate');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#1e2329' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            HackerRank
          </Typography>
          <Button color="inherit" sx={{ textTransform: 'none', fontSize: '14px', mr: 2 }}>
            Admin
          </Button>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            sx={{ textTransform: 'none', fontSize: '14px' }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Tests" sx={{ textTransform: 'none', fontSize: '16px', fontWeight: 500 }} />
            <Tab label="Candidates" sx={{ textTransform: 'none', fontSize: '16px', fontWeight: 500 }} />
          </Tabs>
        </Box>

        {/* Tests Tab */}
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Active Tests
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenProgramDialog(true)}
                  sx={{ mr: 2, textTransform: 'none' }}
                >
                  Add Program
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenTestDialog(true)}
                  sx={{ 
                    bgcolor: '#00a86b',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#008f5a' }
                  }}
                >
                  Create Test
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Test</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Programs</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No tests created yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => (
                      <TableRow key={session._id} hover>
                        <TableCell>{session.name}</TableCell>
                        <TableCell>{session.duration} mins</TableCell>
                        <TableCell>{session.programs.length}</TableCell>
                        <TableCell>
                          <Chip label="Active" size="small" color="success" />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small"><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Candidates Tab */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Candidates
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCandidateDialog(true)}
                sx={{ 
                  bgcolor: '#00a86b',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#008f5a' }
                }}
              >
                Create Candidate
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Problem Title</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No candidates created yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    candidates.map((candidate) => (
                      <TableRow key={candidate._id} hover>
                        <TableCell>{candidate.username}</TableCell>
                        <TableCell>
                          {candidate.assignedProgram?.title ? (
                            <Chip label={candidate.assignedProgram.title} size="small" color="primary" variant="outlined" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">Not assigned</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label="Active" size="small" color="success" />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteCandidate(candidate._id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Container>

      {/* Create Test Dialog */}
      <Dialog open={openTestDialog} onClose={() => setOpenTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Test Session</DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTestDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateSession} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Add Program Dialog */}
      <Dialog open={openProgramDialog} onClose={() => setOpenProgramDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Program</DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProgramDialog(false)}>Cancel</Button>
          <Button onClick={handleUploadProgram} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Create Candidate Dialog */}
      <Dialog open={openCandidateDialog} onClose={() => setOpenCandidateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Candidate</DialogTitle>
        <DialogContent>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={candidateUsername}
            onChange={e => setCandidateUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={candidatePassword}
            onChange={e => setCandidatePassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCandidateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCandidate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
