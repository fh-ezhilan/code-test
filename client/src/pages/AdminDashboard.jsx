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
  List,
  ListItem,
  ListItemText,
  Collapse,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
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
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [editingProgram, setEditingProgram] = useState(null);
  const [editProgramTitle, setEditProgramTitle] = useState('');
  const [editProgramDescription, setEditProgramDescription] = useState('');
  const [openSolutionDialog, setOpenSolutionDialog] = useState(false);
  const [viewingSolution, setViewingSolution] = useState(null);
  
  // Test Session States
  const [sessionName, setSessionName] = useState('');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [sessions, setSessions] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  
  // Program States
  const [programs, setPrograms] = useState([]);
  
  // Candidate States
  const [candidateUsername, setCandidateUsername] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetchCandidates();
    fetchSessions();
    fetchPrograms();
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

  const fetchPrograms = async () => {
    try {
      const res = await axios.get('/api/admin/programs', { withCredentials: true });
      setPrograms(res.data);
    } catch (err) {
      console.error('Error fetching programs:', err);
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
      const formData = new FormData();
      formData.append('name', sessionName);
      formData.append('duration', sessionDuration);
      if (excelFile) {
        formData.append('programsFile', excelFile);
      }
      
      await axios.post('/api/admin/session', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSessionName('');
      setSessionDuration(60);
      setExcelFile(null);
      setOpenTestDialog(false);
      fetchSessions();
      fetchPrograms();
      alert('Test session created successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to create test session: ' + (err.response?.data?.msg || err.message));
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
    } catch (err) {
      console.error(err);
      alert('Failed to delete candidate');
    }
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionName(session.name);
    setSessionDuration(session.duration);
    setSelectedPrograms(session.programs.map(p => p._id || p));
    // Set programs to only the session's programs instead of all programs
    setPrograms(session.programs || []);
    setExpandedProgram(null);
    setOpenEditDialog(true);
  };

  const handleUpdateSession = async () => {
    try {
      await axios.put(`/api/admin/session/${editingSession._id}`, {
        name: sessionName,
        duration: sessionDuration,
        programs: selectedPrograms,
      }, {
        withCredentials: true
      });
      setOpenEditDialog(false);
      setEditingSession(null);
      setSessionName('');
      setSessionDuration(60);
      setSelectedPrograms([]);
      fetchSessions();
      fetchPrograms(); // Restore full programs list
    } catch (err) {
      console.error(err);
      alert('Failed to update test session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this test session?')) {
      return;
    }
    try {
      await axios.delete(`/api/admin/session/${sessionId}`, {
        withCredentials: true
      });
      await fetchSessions();
      alert('Test session deleted successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to delete test session');
    }
  };

  const handleProgramToggle = (programId) => {
    setSelectedPrograms(prev => {
      if (prev.includes(programId)) {
        return prev.filter(id => id !== programId);
      } else {
        return [...prev, programId];
      }
    });
  };

  const handleEditProgram = (program) => {
    setEditingProgram(program._id);
    setEditProgramTitle(program.title);
    setEditProgramDescription(program.description);
  };

  const handleCancelEditProgram = () => {
    setEditingProgram(null);
    setEditProgramTitle('');
    setEditProgramDescription('');
  };

  const handleUpdateProgram = async (programId) => {
    try {
      await axios.put(`/api/admin/program/${programId}`, {
        title: editProgramTitle,
        description: editProgramDescription,
      }, {
        withCredentials: true
      });
      await fetchPrograms();
      setEditingProgram(null);
      setEditProgramTitle('');
      setEditProgramDescription('');
    } catch (err) {
      console.error(err);
      alert('Failed to update program');
    }
  };

  const handleViewSolution = async (candidateId) => {
    try {
      const res = await axios.get(`/api/admin/candidate/${candidateId}/solution`, {
        withCredentials: true
      });
      setViewingSolution(res.data);
      setOpenSolutionDialog(true);
    } catch (err) {
      console.error(err);
      alert('No solution found for this candidate');
    }
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingSession(null);
    setSessionName('');
    setSessionDuration(60);
    setSelectedPrograms([]);
    fetchPrograms(); // Restore full programs list
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
                          <IconButton 
                            size="small"
                            onClick={() => handleEditSession(session)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => handleDeleteSession(session._id)}
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
                    <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Result</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No candidates created yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    candidates.map((candidate) => (
                      <TableRow 
                        key={candidate._id} 
                        hover
                        onClick={() => candidate.testStatus === 'completed' && handleViewSolution(candidate._id)}
                        sx={{ 
                          cursor: candidate.testStatus === 'completed' ? 'pointer' : 'default',
                          '&:hover': candidate.testStatus === 'completed' ? { bgcolor: '#f5f5f5' } : {}
                        }}
                      >
                        <TableCell>{candidate.username}</TableCell>
                        <TableCell>
                          {candidate.assignedProgram?.title ? (
                            <Chip label={candidate.assignedProgram.title} size="small" color="primary" variant="outlined" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">Not assigned</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {candidate.testStatus === 'not-started' && (
                            <Chip label="Not Started" size="small" color="default" />
                          )}
                          {candidate.testStatus === 'in-progress' && (
                            <Chip label="In Progress" size="small" color="warning" />
                          )}
                          {candidate.testStatus === 'completed' && (
                            <Chip label="Completed" size="small" color="success" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCandidate(candidate._id);
                            }}
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
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Upload Programs (Excel/CSV File)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Required columns: <strong>Title</strong>, <strong>Description</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Optional column: <strong>TestCases</strong> (can be JSON array or plain text)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              {excelFile ? excelFile.name : 'Choose Excel/CSV File'}
              <input
                type="file"
                hidden
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setExcelFile(e.target.files[0])}
              />
            </Button>
            {excelFile && (
              <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                ✓ File selected: {excelFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTestDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateSession} variant="contained">Create</Button>
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

      {/* Edit Test Session Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Test Session</DialogTitle>
        <DialogContent>
          <TextField
            label="Test Name"
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
          
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            Programs
          </Typography>
          
          {programs.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No programs available. Add programs first.
            </Typography>
          ) : (
            <List sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
              {programs.map((program) => (
                <React.Fragment key={program._id}>
                  <ListItem
                    sx={{ 
                      '&:hover': { bgcolor: '#f5f5f5' },
                      borderBottom: expandedProgram === program._id ? 'none' : '1px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedPrograms.includes(program._id)}
                          onChange={() => handleProgramToggle(program._id)}
                        />
                      }
                      label=""
                      sx={{ mr: 1, mt: 1 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {editingProgram === program._id ? (
                        <Box sx={{ py: 1 }}>
                          <TextField
                            label="Program Title"
                            fullWidth
                            size="small"
                            value={editProgramTitle}
                            onChange={e => setEditProgramTitle(e.target.value)}
                            sx={{ mb: 1 }}
                          />
                          <TextField
                            label="Program Description"
                            fullWidth
                            size="small"
                            multiline
                            rows={4}
                            value={editProgramDescription}
                            onChange={e => setEditProgramDescription(e.target.value)}
                          />
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant="contained"
                              onClick={() => handleUpdateProgram(program._id)}
                            >
                              Save
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={handleCancelEditProgram}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <ListItemText 
                            primary={program.title}
                            onClick={() => setExpandedProgram(expandedProgram === program._id ? null : program._id)}
                            sx={{ flex: 1, cursor: 'pointer' }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditProgram(program)}
                              sx={{ textTransform: 'none' }}
                            >
                              Edit
                            </Button>
                            <IconButton
                              onClick={() => setExpandedProgram(expandedProgram === program._id ? null : program._id)}
                              size="small"
                            >
                              {expandedProgram === program._id ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>
                        </>
                      )}
                    </Box>
                  </ListItem>
                  {editingProgram !== program._id && (
                    <Collapse in={expandedProgram === program._id} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                          {program.description}
                        </Typography>
                      </Box>
                    </Collapse>
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateSession} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* View Solution Dialog */}
      <Dialog 
        open={openSolutionDialog} 
        onClose={() => setOpenSolutionDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          {viewingSolution && (
            <Box>
              <Typography variant="h6">Submitted Solution</Typography>
              <Typography variant="body2" color="text.secondary">
                Problem: {viewingSolution.program?.title} | 
                Language: {viewingSolution.language} | 
                Submitted: {new Date(viewingSolution.submittedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent sx={{ height: '500px', p: 0 }}>
          {viewingSolution && (
            <Editor
              height="100%"
              language={viewingSolution.language.toLowerCase()}
              value={viewingSolution.code}
              theme="light"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSolutionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
