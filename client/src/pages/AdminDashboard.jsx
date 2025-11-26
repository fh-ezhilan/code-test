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
  TablePagination,
  Snackbar,
  Alert,
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
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'candidates' ? 1 : tabFromUrl === 'admins' ? 2 : 0
  );
  const [openTestDialog, setOpenTestDialog] = useState(false);
  const [openCandidateDialog, setOpenCandidateDialog] = useState(false);
  const [openAdminDialog, setOpenAdminDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [editingProgram, setEditingProgram] = useState(null);
  const [editProgramTitle, setEditProgramTitle] = useState('');
  const [editProgramDescription, setEditProgramDescription] = useState('');
  const [openSolutionDialog, setOpenSolutionDialog] = useState(false);
  const [viewingSolution, setViewingSolution] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [openEditAdminDialog, setOpenEditAdminDialog] = useState(false);
  
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
  const [candidateFile, setCandidateFile] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [candidatePage, setCandidatePage] = useState(0);
  const [candidateRowsPerPage, setCandidateRowsPerPage] = useState(20);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Admin States
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [admins, setAdmins] = useState([]);
  const [adminFile, setAdminFile] = useState(null);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [adminPage, setAdminPage] = useState(0);
  const [adminRowsPerPage, setAdminRowsPerPage] = useState(20);
  const [openBulkDeleteAdminDialog, setOpenBulkDeleteAdminDialog] = useState(false);
  const [editAdminUsername, setEditAdminUsername] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');

  useEffect(() => {
    fetchCandidates();
    fetchSessions();
    fetchPrograms();
    fetchAdmins();
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
    const tabName = newValue === 0 ? 'tests' : newValue === 1 ? 'candidates' : 'admins';
    setSearchParams({ tab: tabName });
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
      if (candidateFile) {
        // Bulk upload via file
        const formData = new FormData();
        formData.append('candidatesFile', candidateFile);
        
        await axios.post('/api/admin/candidates/bulk', formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setCandidateFile(null);
      } else {
        // Single candidate creation
        await axios.post('/api/admin/candidate', {
          username: candidateUsername,
          password: candidatePassword,
        }, {
          withCredentials: true
        });
      }
      setCandidateUsername('');
      setCandidatePassword('');
      setOpenCandidateDialog(false);
      fetchCandidates();
    } catch (err) {
      console.error(err);
      alert('Failed to create candidate: ' + (err.response?.data?.msg || err.message));
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

  const handleSelectAllCandidates = (event) => {
    if (event.target.checked) {
      const currentPageCandidates = candidates.slice(
        candidatePage * candidateRowsPerPage,
        candidatePage * candidateRowsPerPage + candidateRowsPerPage
      );
      const currentPageIds = currentPageCandidates.map(c => c._id);
      setSelectedCandidates(prev => {
        const newSelection = [...new Set([...prev, ...currentPageIds])];
        return newSelection;
      });
    } else {
      const currentPageCandidates = candidates.slice(
        candidatePage * candidateRowsPerPage,
        candidatePage * candidateRowsPerPage + candidateRowsPerPage
      );
      const currentPageIds = currentPageCandidates.map(c => c._id);
      setSelectedCandidates(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  const handleBulkDeleteCandidates = async () => {
    if (selectedCandidates.length === 0) {
      setSnackbar({ open: true, message: 'No candidates selected', severity: 'warning' });
      return;
    }
    setOpenBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    const count = selectedCandidates.length;
    setOpenBulkDeleteDialog(false);
    try {
      await Promise.all(
        selectedCandidates.map(id => 
          axios.delete(`/api/admin/candidate/${id}`, { withCredentials: true })
        )
      );
      setSelectedCandidates([]);
      await fetchCandidates();
      setSnackbar({ open: true, message: `${count} candidate(s) deleted successfully`, severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to delete some candidates', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Admin User Management Functions
  const fetchAdmins = async () => {
    try {
      const res = await axios.get('/api/admin/admins', { withCredentials: true });
      setAdmins(res.data);
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminUsername || !adminPassword) {
      setSnackbar({ open: true, message: 'Please fill in all fields', severity: 'warning' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', adminUsername);
      formData.append('password', adminPassword);
      
      if (adminFile) {
        formData.append('adminsFile', adminFile);
        const res = await axios.post('/api/admin/admins/bulk', formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSnackbar({ 
          open: true, 
          message: `Created ${res.data.created} admin(s). Skipped ${res.data.skipped}.`, 
          severity: 'success' 
        });
      } else {
        await axios.post('/api/admin/admin', { username: adminUsername, password: adminPassword }, {
          withCredentials: true
        });
        setSnackbar({ open: true, message: 'Admin created successfully', severity: 'success' });
      }
      
      setAdminUsername('');
      setAdminPassword('');
      setAdminFile(null);
      setOpenAdminDialog(false);
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to create admin: ' + (err.response?.data?.msg || err.message), 
        severity: 'error' 
      });
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) {
      return;
    }
    try {
      await axios.delete(`/api/admin/admin/${adminId}`, {
        withCredentials: true
      });
      setSnackbar({ open: true, message: 'Admin deleted successfully', severity: 'success' });
      await fetchAdmins();
    } catch (err) {
      console.error(err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.msg || 'Failed to delete admin', 
        severity: 'error' 
      });
    }
  };

  const handleSelectAllAdmins = (event) => {
    if (event.target.checked) {
      const currentPageAdmins = admins.slice(
        adminPage * adminRowsPerPage,
        adminPage * adminRowsPerPage + adminRowsPerPage
      );
      const currentPageIds = currentPageAdmins.map(a => a._id);
      setSelectedAdmins(prev => {
        const newSelection = [...new Set([...prev, ...currentPageIds])];
        return newSelection;
      });
    } else {
      const currentPageAdmins = admins.slice(
        adminPage * adminRowsPerPage,
        adminPage * adminRowsPerPage + adminRowsPerPage
      );
      const currentPageIds = currentPageAdmins.map(a => a._id);
      setSelectedAdmins(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleSelectAdmin = (adminId) => {
    setSelectedAdmins(prev => {
      if (prev.includes(adminId)) {
        return prev.filter(id => id !== adminId);
      } else {
        return [...prev, adminId];
      }
    });
  };

  const handleBulkDeleteAdmins = async () => {
    if (selectedAdmins.length === 0) {
      setSnackbar({ open: true, message: 'No admins selected', severity: 'warning' });
      return;
    }
    setOpenBulkDeleteAdminDialog(true);
  };

  const confirmBulkDeleteAdmins = async () => {
    const count = selectedAdmins.length;
    setOpenBulkDeleteAdminDialog(false);
    try {
      await Promise.all(
        selectedAdmins.map(id => 
          axios.delete(`/api/admin/admin/${id}`, { withCredentials: true })
        )
      );
      setSelectedAdmins([]);
      await fetchAdmins();
      setSnackbar({ open: true, message: `${count} admin(s) deleted successfully`, severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to delete some admins', severity: 'error' });
    }
  };

  const handleChangeAdminPage = (event, newPage) => {
    setAdminPage(newPage);
  };

  const handleChangeAdminRowsPerPage = (event) => {
    setAdminRowsPerPage(parseInt(event.target.value, 10));
    setAdminPage(0);
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setEditAdminUsername(admin.username);
    setEditAdminPassword('');
    setOpenEditAdminDialog(true);
  };

  const handleUpdateAdmin = async () => {
    if (!editAdminUsername) {
      setSnackbar({ open: true, message: 'Username is required', severity: 'warning' });
      return;
    }

    try {
      await axios.put(`/api/admin/admin/${editingAdmin._id}`, {
        username: editAdminUsername,
        password: editAdminPassword,
      }, {
        withCredentials: true
      });
      setOpenEditAdminDialog(false);
      setEditingAdmin(null);
      setEditAdminUsername('');
      setEditAdminPassword('');
      setSnackbar({ open: true, message: 'Admin updated successfully', severity: 'success' });
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.msg || 'Failed to update admin', 
        severity: 'error' 
      });
    }
  };

  const handleChangeCandidatePage = (event, newPage) => {
    setCandidatePage(newPage);
  };

  const handleChangeCandidateRowsPerPage = (event) => {
    setCandidateRowsPerPage(parseInt(event.target.value, 10));
    setCandidatePage(0);
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
            <Tab label="Admins" sx={{ textTransform: 'none', fontSize: '16px', fontWeight: 500 }} />
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
              <Box sx={{ display: 'flex', gap: 2 }}>
                {selectedCandidates.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleBulkDeleteCandidates}
                    sx={{ textTransform: 'none' }}
                  >
                    Delete Selected ({selectedCandidates.length})
                  </Button>
                )}
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
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={
                          candidates.slice(candidatePage * candidateRowsPerPage, candidatePage * candidateRowsPerPage + candidateRowsPerPage).length > 0 &&
                          candidates.slice(candidatePage * candidateRowsPerPage, candidatePage * candidateRowsPerPage + candidateRowsPerPage)
                            .every(c => selectedCandidates.includes(c._id))
                        }
                        indeterminate={
                          candidates.slice(candidatePage * candidateRowsPerPage, candidatePage * candidateRowsPerPage + candidateRowsPerPage)
                            .some(c => selectedCandidates.includes(c._id)) &&
                          !candidates.slice(candidatePage * candidateRowsPerPage, candidatePage * candidateRowsPerPage + candidateRowsPerPage)
                            .every(c => selectedCandidates.includes(c._id))
                        }
                        onChange={handleSelectAllCandidates}
                      />
                    </TableCell>
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
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No candidates created yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    candidates
                      .slice(candidatePage * candidateRowsPerPage, candidatePage * candidateRowsPerPage + candidateRowsPerPage)
                      .map((candidate) => (
                      <TableRow 
                        key={candidate._id} 
                        hover
                        sx={{ 
                          cursor: candidate.testStatus === 'completed' ? 'pointer' : 'default',
                          '&:hover': candidate.testStatus === 'completed' ? { bgcolor: '#f5f5f5' } : {}
                        }}
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedCandidates.includes(candidate._id)}
                            onChange={() => handleSelectCandidate(candidate._id)}
                          />
                        </TableCell>
                        <TableCell onClick={() => candidate.testStatus === 'completed' && handleViewSolution(candidate._id)}>{candidate.username}</TableCell>
                        <TableCell onClick={() => candidate.testStatus === 'completed' && handleViewSolution(candidate._id)}>
                          {candidate.assignedProgram?.title ? (
                            <Chip label={candidate.assignedProgram.title} size="small" color="primary" variant="outlined" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">Not assigned</Typography>
                          )}
                        </TableCell>
                        <TableCell onClick={() => candidate.testStatus === 'completed' && handleViewSolution(candidate._id)}>
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
                        <TableCell onClick={() => candidate.testStatus === 'completed' && handleViewSolution(candidate._id)}>
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        </TableCell>
                        <TableCell onClick={() => candidate.testStatus === 'completed' && handleViewSolution(candidate._id)}>
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
              <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={candidates.length}
                rowsPerPage={candidateRowsPerPage}
                page={candidatePage}
                onPageChange={handleChangeCandidatePage}
                onRowsPerPageChange={handleChangeCandidateRowsPerPage}
              />
            </TableContainer>
          </Box>
        )}

        {/* Admins Tab */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Admins
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {selectedAdmins.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleBulkDeleteAdmins}
                    sx={{ textTransform: 'none' }}
                  >
                    Delete Selected ({selectedAdmins.length})
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAdminDialog(true)}
                  sx={{ 
                    bgcolor: '#00a86b',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#008f5a' }
                  }}
                >
                  Create Admin
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={
                          admins.slice(adminPage * adminRowsPerPage, adminPage * adminRowsPerPage + adminRowsPerPage).length > 0 &&
                          admins.slice(adminPage * adminRowsPerPage, adminPage * adminRowsPerPage + adminRowsPerPage)
                            .every(a => selectedAdmins.includes(a._id))
                        }
                        indeterminate={
                          admins.slice(adminPage * adminRowsPerPage, adminPage * adminRowsPerPage + adminRowsPerPage)
                            .some(a => selectedAdmins.includes(a._id)) &&
                          !admins.slice(adminPage * adminRowsPerPage, adminPage * adminRowsPerPage + adminRowsPerPage)
                            .every(a => selectedAdmins.includes(a._id))
                        }
                        onChange={handleSelectAllAdmins}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {admins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No admins created yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    admins
                      .slice(adminPage * adminRowsPerPage, adminPage * adminRowsPerPage + adminRowsPerPage)
                      .map((admin) => (
                      <TableRow key={admin._id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedAdmins.includes(admin._id)}
                            onChange={() => handleSelectAdmin(admin._id)}
                          />
                        </TableCell>
                        <TableCell>{admin.username}</TableCell>
                        <TableCell>
                          <Chip label="Admin" size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditAdmin(admin)}
                            color="primary"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteAdmin(admin._id)}
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
              <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={admins.length}
                rowsPerPage={adminRowsPerPage}
                page={adminPage}
                onPageChange={handleChangeAdminPage}
                onRowsPerPageChange={handleChangeAdminRowsPerPage}
              />
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
            disabled={!!candidateFile}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={candidatePassword}
            onChange={e => setCandidatePassword(e.target.value)}
            disabled={!!candidateFile}
          />
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Or Upload Candidates (Excel/CSV File)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Required columns: <strong>username</strong>, <strong>password</strong>
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              {candidateFile ? candidateFile.name : 'Choose Excel/CSV File'}
              <input
                type="file"
                hidden
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setCandidateFile(e.target.files[0])}
              />
            </Button>
            {candidateFile && (
              <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                ✓ File selected: {candidateFile.name}
              </Typography>
            )}
          </Box>
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={openBulkDeleteDialog}
        onClose={() => setOpenBulkDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedCandidates.length} candidate(s)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmBulkDelete} variant="contained" color="error">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Admin Dialog */}
      <Dialog open={openAdminDialog} onClose={() => setOpenAdminDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Admin</DialogTitle>
        <DialogContent>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={adminUsername}
            onChange={e => setAdminUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
          />
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Or Upload Admins (Excel/CSV File)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Required columns: <strong>username</strong>, <strong>password</strong>
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              {adminFile ? adminFile.name : 'Choose Excel/CSV File'}
              <input
                type="file"
                hidden
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setAdminFile(e.target.files[0])}
              />
            </Button>
            {adminFile && (
              <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                ✓ File selected: {adminFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdminDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAdmin} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={openEditAdminDialog} onClose={() => setOpenEditAdminDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Admin</DialogTitle>
        <DialogContent>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={editAdminUsername}
            onChange={e => setEditAdminUsername(e.target.value)}
          />
          <TextField
            label="Password (leave empty to keep current)"
            type="password"
            fullWidth
            margin="normal"
            value={editAdminPassword}
            onChange={e => setEditAdminPassword(e.target.value)}
            helperText="Only fill this if you want to change the password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditAdminDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateAdmin} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Admins Confirmation Dialog */}
      <Dialog
        open={openBulkDeleteAdminDialog}
        onClose={() => setOpenBulkDeleteAdminDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedAdmins.length} admin(s)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDeleteAdminDialog(false)}>Cancel</Button>
          <Button onClick={confirmBulkDeleteAdmins} variant="contained" color="error">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
