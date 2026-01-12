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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
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
  const [editProgramTestCases, setEditProgramTestCases] = useState([]);
  const [openSolutionDialog, setOpenSolutionDialog] = useState(false);
  const [viewingSolution, setViewingSolution] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [openEditAdminDialog, setOpenEditAdminDialog] = useState(false);
  
  // Test Session States
  const [sessionName, setSessionName] = useState('');
  const [testType, setTestType] = useState('Coding');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [sessions, setSessions] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  
  // Program States
  const [programs, setPrograms] = useState([]);
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [selectedMcqQuestions, setSelectedMcqQuestions] = useState([]);
  const [expandedMcqQuestion, setExpandedMcqQuestion] = useState(null);
  
  // Candidate States
  const [candidateUsername, setCandidateUsername] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');
  const [candidateTestType, setCandidateTestType] = useState('');
  const [candidateTestSession, setCandidateTestSession] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [candidateFile, setCandidateFile] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [candidatePage, setCandidatePage] = useState(0);
  const [candidateRowsPerPage, setCandidateRowsPerPage] = useState(20);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [snackbars, setSnackbars] = useState([]);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [openEditCandidateDialog, setOpenEditCandidateDialog] = useState(false);
  const [editCandidatePassword, setEditCandidatePassword] = useState('');
  const [candidateDialogTab, setCandidateDialogTab] = useState(0);
  
  // Delete confirmation states
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, type: '', id: null, name: '' });

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
  
  // Test history states
  const [openTestHistoryDialog, setOpenTestHistoryDialog] = useState(false);
  const [selectedCandidateForHistory, setSelectedCandidateForHistory] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [openAssignTestDialog, setOpenAssignTestDialog] = useState(false);
  const [assignTestType, setAssignTestType] = useState('');
  const [assignTestSession, setAssignTestSession] = useState('');
  const [makeActiveTest, setMakeActiveTest] = useState(true);
  const [openSubmissionDialog, setOpenSubmissionDialog] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null);
  const [explanationScore, setExplanationScore] = useState('');
  const [savingScore, setSavingScore] = useState(false);
  const [codingScore, setCodingScore] = useState('');
  const [savingCodingScore, setSavingCodingScore] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchSessions();
    fetchPrograms();
    fetchAdmins();
  }, []);

  // Helper functions for snackbar management
  const addSnackbar = (message, severity = 'success') => {
    const id = Date.now() + Math.random(); // Unique ID
    setSnackbars(prev => [...prev, { id, message, severity }]);
  };

  const removeSnackbar = (id) => {
    setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
  };

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
      if (!sessionName || sessionName.trim().length === 0) {
        addSnackbar('Test name is required', 'warning');
        return;
      }

      if (!excelFile) {
        addSnackbar('No file found to import the programs', 'warning');
        return;
      }

      const formData = new FormData();
      formData.append('name', sessionName);
      formData.append('testType', testType);
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
      setTestType('Coding');
      setSessionDuration(60);
      setExcelFile(null);
      setOpenTestDialog(false);
      fetchSessions();
      fetchPrograms();
      addSnackbar('Test session created successfully', 'success');
    } catch (err) {
      console.error(err);
      addSnackbar('Failed to create test session: ' + (err.response?.data?.msg || err.message), 'error');
    }
  };

  const handleCreateCandidate = async () => {
    try {
      if (candidateFile) {
        // Bulk upload via file
        const formData = new FormData();
        formData.append('candidatesFile', candidateFile);
        
        const res = await axios.post('/api/admin/candidates/bulk', formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // Show messages based on results
        if (res.data.created > 0 && res.data.testsAssigned === 0 && res.data.skipped === 0) {
          // All new candidates created successfully
          addSnackbar(`${res.data.created} candidate(s) created successfully`, 'success');
        } else if (res.data.created === 0 && res.data.testsAssigned > 0 && res.data.skipped === 0) {
          // All were existing candidates with tests assigned
          addSnackbar(`${res.data.testsAssigned} test(s) assigned to existing candidate(s)`, 'success');
        } else if (res.data.created > 0 && res.data.testsAssigned > 0 && res.data.skipped === 0) {
          // Mix of new candidates and test assignments
          addSnackbar(`${res.data.created} candidate(s) created successfully`, 'success');
          addSnackbar(`${res.data.testsAssigned} test(s) assigned to existing candidate(s)`, 'info');
        } else if (res.data.created === 0 && res.data.testsAssigned === 0 && res.data.skipped > 0) {
          // All records failed
          const messages = [];
          
          const missingFieldsCount = res.data.errors?.filter(err => 
            err.includes('missing required fields') || 
            err.includes('Test name is required')
          ).length || 0;
          
          const testNotFoundCount = res.data.errors?.filter(err => 
            err.includes('not found')
          ).length || 0;
          
          const duplicateCount = res.data.errors?.filter(err => 
            err.includes('already exists')
          ).length || 0;
          
          if (missingFieldsCount > 0) {
            messages.push(`${missingFieldsCount} candidate(s) not uploaded due to missing data`);
          }
          if (testNotFoundCount > 0) {
            messages.push(`${testNotFoundCount} candidate(s) not uploaded because Test name doesn't match`);
          }
          if (duplicateCount > 0) {
            messages.push(`${duplicateCount} candidate(s) skipped (already exists)`);
          }
          
          addSnackbar(messages.join('. '), 'error');
        } else {
          // Mixed results with some successes and some failures
          const errorMessages = [];
          
          const missingFieldsCount = res.data.errors?.filter(err => 
            err.includes('missing required fields') || 
            err.includes('Test name is required')
          ).length || 0;
          
          const testNotFoundCount = res.data.errors?.filter(err => 
            err.includes('not found')
          ).length || 0;
          
          const duplicateCount = res.data.errors?.filter(err => 
            err.includes('already exists')
          ).length || 0;
          
          if (missingFieldsCount > 0) {
            errorMessages.push(`${missingFieldsCount} not uploaded (missing data)`);
          }
          if (testNotFoundCount > 0) {
            errorMessages.push(`${testNotFoundCount} not uploaded (test not found)`);
          }
          if (duplicateCount > 0) {
            errorMessages.push(`${duplicateCount} skipped (duplicates)`);
          }
          
          // Show success messages
          if (res.data.created > 0) {
            addSnackbar(`${res.data.created} candidate(s) created successfully`, 'success');
          }
          if (res.data.testsAssigned > 0) {
            addSnackbar(`${res.data.testsAssigned} test(s) assigned to existing candidate(s)`, 'info');
          }
          // Show error messages if any
          if (errorMessages.length > 0) {
            addSnackbar(errorMessages.join('. '), 'error');
          }
        }
        
        setCandidateFile(null);
      } else {
        // Single candidate creation
        if (!candidateUsername || !candidatePassword || !candidateTestSession) {
          addSnackbar('Please fill in all required fields', 'warning');
          return;
        }

        await axios.post('/api/admin/candidate', {
          username: candidateUsername,
          password: candidatePassword,
          testSessionId: candidateTestSession,
        }, {
          withCredentials: true
        });
        addSnackbar('Candidate created successfully', 'success');
      }
      setCandidateUsername('');
      setCandidatePassword('');
      setCandidateTestType('');
      setCandidateTestSession('');
      setCandidateDialogTab(0);
      setOpenCandidateDialog(false);
      fetchCandidates();
    } catch (err) {
      console.error(err);
      addSnackbar('Failed to create candidate: ' + (err.response?.data?.msg || err.message), 'error');
    }
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setEditCandidatePassword('');
    setOpenEditCandidateDialog(true);
  };

  const handleUpdateCandidate = async () => {
    if (!editCandidatePassword || editCandidatePassword.trim().length === 0) {
      addSnackbar('Please enter a new password', 'warning');
      return;
    }

    try {
      await axios.put(`/api/admin/candidate/${editingCandidate._id}`, {
        password: editCandidatePassword,
      }, {
        withCredentials: true
      });
      setOpenEditCandidateDialog(false);
      setEditingCandidate(null);
      setEditCandidatePassword('');
      addSnackbar('Password reset successfully', 'success');
      fetchCandidates();
    } catch (err) {
      console.error(err);
      addSnackbar(err.response?.data?.msg || 'Failed to reset password', 'error');
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    const candidate = candidates.find(c => c._id === candidateId);
    setDeleteConfirmDialog({
      open: true,
      type: 'candidate',
      id: candidateId,
      name: candidate?.username || 'this candidate'
    });
  };

  const confirmDelete = async () => {
    const { type, id } = deleteConfirmDialog;
    setDeleteConfirmDialog({ open: false, type: '', id: null, name: '' });

    try {
      if (type === 'candidate') {
        await axios.delete(`/api/admin/candidate/${id}`, { withCredentials: true });
        addSnackbar('Candidate deleted successfully', 'success');
        await fetchCandidates();
      } else if (type === 'admin') {
        await axios.delete(`/api/admin/admin/${id}`, { withCredentials: true });
        addSnackbar('Admin deleted successfully', 'success');
        await fetchAdmins();
      } else if (type === 'session') {
        await axios.delete(`/api/admin/session/${id}`, { withCredentials: true });
        addSnackbar('Test session deleted successfully', 'success');
        await fetchSessions();
      } else if (type === 'test-assignment') {
        await axios.delete(`/api/admin/test-assignment/${id}`, { withCredentials: true });
        addSnackbar('Test assignment deleted successfully', 'success');
        // Refresh test history
        if (selectedCandidateForHistory) {
          const res = await axios.get(`/api/admin/candidate/${selectedCandidateForHistory._id}/test-history`, {
            withCredentials: true
          });
          setTestHistory(res.data);
        }
        await fetchCandidates();
      }
    } catch (err) {
      console.error(err);
      addSnackbar(err.response?.data?.msg || `Failed to delete ${type}`, 'error');
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
      addSnackbar('No candidates selected', 'warning');
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
      addSnackbar(`${count} candidate(s) deleted successfully`, 'success');
    } catch (err) {
      console.error(err);
      addSnackbar('Failed to delete some candidates', 'error');
    }
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
      addSnackbar('Please fill in all fields', 'warning');
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
        addSnackbar(`Created ${res.data.created} admin(s). Skipped ${res.data.skipped}.`, 'success');
      } else {
        await axios.post('/api/admin/admin', { username: adminUsername, password: adminPassword }, {
          withCredentials: true
        });
        addSnackbar('Admin created successfully', 'success');
      }
      
      setAdminUsername('');
      setAdminPassword('');
      setAdminFile(null);
      setOpenAdminDialog(false);
      fetchAdmins();
    } catch (err) {
      console.error(err);
      addSnackbar('Failed to create admin: ' + (err.response?.data?.msg || err.message), 'error');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    const admin = admins.find(a => a._id === adminId);
    setDeleteConfirmDialog({
      open: true,
      type: 'admin',
      id: adminId,
      name: admin?.username || 'this admin'
    });
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
      addSnackbar('No admins selected', 'warning');
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
      addSnackbar(`${count} admin(s) deleted successfully`, 'success');
    } catch (err) {
      console.error(err);
      addSnackbar('Failed to delete some admins', 'error');
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
      addSnackbar('Username is required', 'warning');
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
      addSnackbar('Admin updated successfully', 'success');
      fetchAdmins();
    } catch (err) {
      console.error(err);
      addSnackbar(err.response?.data?.msg || 'Failed to update admin', 'error');
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
    setTestType(session.testType || 'Coding');
    setSessionDuration(session.duration);
    
    if (session.testType === 'MCQ') {
      setSelectedMcqQuestions(session.mcqQuestions?.map(q => q._id || q) || []);
      setMcqQuestions(session.mcqQuestions || []);
    } else {
      setSelectedPrograms(session.programs.map(p => p._id || p));
      setPrograms(session.programs || []);
    }
    
    setExpandedProgram(null);
    setExpandedMcqQuestion(null);
    setOpenEditDialog(true);
  };

  const handleUpdateSession = async () => {
    try {
      await axios.put(`/api/admin/session/${editingSession._id}`, {
        name: sessionName,
        testType: testType,
        duration: sessionDuration,
        programs: selectedPrograms,
      }, {
        withCredentials: true
      });
      setOpenEditDialog(false);
      setEditingSession(null);
      setSessionName('');
      setTestType('Coding');
      setSessionDuration(60);
      setSelectedPrograms([]);
      fetchSessions();
    } catch (err) {
      console.error(err);
      addSnackbar('Failed to update test session', 'error');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    const session = sessions.find(s => s._id === sessionId);
    setDeleteConfirmDialog({
      open: true,
      type: 'session',
      id: sessionId,
      name: session?.name || 'this test session'
    });
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
    setEditProgramTestCases(program.testCases || []);
  };

  const handleCancelEditProgram = () => {
    setEditingProgram(null);
    setEditProgramTitle('');
    setEditProgramDescription('');
    setEditProgramTestCases([]);
  };

  const handleUpdateProgram = async (programId) => {
    try {
      const response = await axios.put(`/api/admin/program/${programId}`, {
        title: editProgramTitle,
        description: editProgramDescription,
        testCases: editProgramTestCases,
      }, {
        withCredentials: true
      });
      
      // Update the specific program in the current programs list
      setPrograms(prevPrograms => 
        prevPrograms.map(p => 
          p._id === programId ? response.data : p
        )
      );
      
      // Also update in sessions list only if the session contains this program
      setSessions(prevSessions =>
        prevSessions.map(session => {
          // Check if this session has this program
          const hasProgramInSession = session.programs?.some(p => (p._id || p) === programId);
          if (!hasProgramInSession) {
            return session; // Don't modify sessions that don't have this program
          }
          
          return {
            ...session,
            programs: session.programs.map(p =>
              (p._id || p) === programId ? response.data : p
            )
          };
        })
      );
      
      setEditingProgram(null);
      setEditProgramTitle('');
      setEditProgramDescription('');
      setEditProgramTestCases([]);
      addSnackbar('Program updated successfully', 'success');
    } catch (err) {
      console.error(err);
      addSnackbar('Failed to update program', 'error');
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
      addSnackbar('No solution found for this candidate', 'error');
    }
  };
  
  const handleViewTestHistory = async (candidate) => {
    try {
      const res = await axios.get(`/api/admin/candidate/${candidate._id}/test-history`, {
        withCredentials: true
      });
      setTestHistory(res.data);
      setSelectedCandidateForHistory(candidate);
      setOpenTestHistoryDialog(true);
    } catch (err) {
      console.error(err);
      addSnackbar('Failed to load test history', 'error');
    }
  };

  const handleExportCandidates = async () => {
    try {
      const response = await axios.get('/api/admin/candidates/export', {
        withCredentials: true,
        responseType: 'blob', // Important for binary data
      });
      
      // Create a blob from the response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `candidates_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addSnackbar('Candidates data exported successfully', 'success');
    } catch (err) {
      console.error('Error exporting candidates:', err);
      addSnackbar('Failed to export candidates data', 'error');
    }
  };
  
  const handleSetActiveTest = async (assignmentId) => {
    try {
      await axios.put(`/api/admin/test-assignment/${assignmentId}/set-active`, {}, {
        withCredentials: true
      });
      // Refresh test history
      if (selectedCandidateForHistory) {
        const res = await axios.get(`/api/admin/candidate/${selectedCandidateForHistory._id}/test-history`, {
          withCredentials: true
        });
        setTestHistory(res.data);
      }
      // Refresh candidates list
      await fetchCandidates();
      addSnackbar('Test set as active successfully', 'success');
    } catch (err) {
      console.error(err);
      addSnackbar(err.response?.data?.msg || 'Failed to set active test', 'error');
    }
  };
  
  const handleAssignTest = async () => {
    if (!assignTestSession) {
      addSnackbar('Please select a test', 'error');
      return;
    }
    
    try {
      await axios.post('/api/admin/test-assignment', {
        candidateId: selectedCandidateForHistory._id,
        testSessionId: assignTestSession,
        makeActive: makeActiveTest,
      }, { withCredentials: true });
      
      // Refresh test history
      const res = await axios.get(`/api/admin/candidate/${selectedCandidateForHistory._id}/test-history`, {
        withCredentials: true
      });
      setTestHistory(res.data);
      
      // Refresh candidates list
      await fetchCandidates();
      
      setOpenAssignTestDialog(false);
      setAssignTestType('');
      setAssignTestSession('');
      setMakeActiveTest(true);
      addSnackbar('Test assigned successfully', 'success');
    } catch (err) {
      console.error(err);
      addSnackbar('Failed to assign test', 'error');
    }
  };
  
  const handleViewSubmission = async (assignment) => {
    try {
      const res = await axios.get(`/api/admin/test-assignment/${assignment._id}/submission`, {
        withCredentials: true
      });
      setViewingSubmission(res.data);
      setCurrentAssignmentId(assignment._id); // Store assignment ID separately
      // Set initial score if available for explanation tests
      if (res.data.testType === 'Explanation' && res.data.explanationAnswer?.score !== undefined && res.data.explanationAnswer?.score !== null) {
        setExplanationScore(res.data.explanationAnswer.score.toString());
      } else {
        setExplanationScore('');
      }
      // Set initial score for coding tests
      if (res.data.testType === 'Coding') {
        const manualScore = assignment.score;
        const aiScore = res.data.solution?.aiEvaluation?.overallScore;
        if (manualScore !== undefined && manualScore !== null) {
          setCodingScore(manualScore.toString());
        } else if (aiScore !== undefined) {
          setCodingScore(aiScore.toString());
        } else {
          setCodingScore('');
        }
      } else {
        setCodingScore('');
      }
      setOpenSubmissionDialog(true);
    } catch (err) {
      console.error(err);
      addSnackbar('Failed to load submission', 'error');
    }
  };

  const handleSaveExplanationScore = async () => {
    const score = parseInt(explanationScore);
    const totalQuestions = viewingSubmission?.questions?.length || 0;

    // Validation
    if (isNaN(score)) {
      addSnackbar('Please enter a valid number', 'error');
      return;
    }
    if (score < 0 || score > totalQuestions) {
      addSnackbar(`Score must be between 0 and ${totalQuestions}`, 'error');
      return;
    }

    try {
      setSavingScore(true);
      
      if (!currentAssignmentId) {
        addSnackbar('Assignment ID not found', 'error');
        setSavingScore(false);
        return;
      }

      const res = await axios.put(
        `/api/admin/test-assignment/${currentAssignmentId}/score`,
        { score },
        { withCredentials: true }
      );

      // Update the viewing submission with the new score
      setViewingSubmission(prev => ({
        ...prev,
        explanationAnswer: {
          ...prev.explanationAnswer,
          score: score
        }
      }));

      addSnackbar('Score saved successfully', 'success');
      
      // Refresh test history if the dialog is open
      if (selectedCandidateForHistory) {
        try {
          const historyRes = await axios.get(`/api/admin/candidate/${selectedCandidateForHistory._id}/test-history`, {
            withCredentials: true
          });
          setTestHistory(historyRes.data);
        } catch (historyErr) {
          console.error('Error refreshing test history:', historyErr);
          // Don't show error to user, score was saved successfully
        }
      }
    } catch (err) {
      console.error(err);
      addSnackbar(err.response?.data?.msg || 'Failed to save score', 'error');
    } finally {
      setSavingScore(false);
    }
  };

  const handleSaveCodingScore = async () => {
    const score = parseInt(codingScore);

    // Validation
    if (isNaN(score)) {
      addSnackbar('Please enter a valid number', 'error');
      return;
    }
    if (score < 0 || score > 100) {
      addSnackbar('Score must be between 0 and 100', 'error');
      return;
    }

    try {
      setSavingCodingScore(true);
      
      if (!currentAssignmentId) {
        addSnackbar('Assignment ID not found', 'error');
        setSavingCodingScore(false);
        return;
      }

      const res = await axios.put(
        `/api/admin/test-assignment/${currentAssignmentId}/coding-score`,
        { score },
        { withCredentials: true }
      );

      // Update the viewing submission with the new score
      setViewingSubmission(prev => ({
        ...prev,
        solution: {
          ...prev.solution,
          manualScore: score
        }
      }));

      addSnackbar('Score saved successfully', 'success');
      
      // Refresh test history if the dialog is open
      if (selectedCandidateForHistory) {
        try {
          const historyRes = await axios.get(`/api/admin/candidate/${selectedCandidateForHistory._id}/test-history`, {
            withCredentials: true
          });
          setTestHistory(historyRes.data);
        } catch (historyErr) {
          console.error('Error refreshing test history:', historyErr);
          // Don't show error to user, score was saved successfully
        }
      }
    } catch (err) {
      console.error(err);
      addSnackbar(err.response?.data?.msg || 'Failed to save score', 'error');
    } finally {
      setSavingCodingScore(false);
    }
  };
  
  const handleDeleteTestAssignment = async (assignmentId, testName) => {
    setDeleteConfirmDialog({
      open: true,
      type: 'test-assignment',
      id: assignmentId,
      name: testName || 'this test assignment'
    });
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
                    <TableCell sx={{ fontWeight: 600 }}>Test Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Questions</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No tests created yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => (
                      <TableRow key={session._id} hover>
                        <TableCell>{session.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={session.testType || 'Coding'} 
                            size="small" 
                            color={session.testType === 'MCQ' ? 'secondary' : 'primary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{session.duration} mins</TableCell>
                        <TableCell>
                          {session.testType === 'MCQ' 
                            ? (session.mcqQuestions?.length || 0)
                            : (session.programs?.length || 0)
                          }
                        </TableCell>
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
                  variant="outlined"
                  onClick={handleExportCandidates}
                  sx={{ 
                    textTransform: 'none',
                    borderColor: '#00a86b',
                    color: '#00a86b',
                    '&:hover': { 
                      borderColor: '#008f5a',
                      bgcolor: 'rgba(0, 168, 107, 0.04)'
                    }
                  }}
                >
                  Export to Excel
                </Button>
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
                    <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Result</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
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
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                        onClick={() => handleViewTestHistory(candidate)}
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedCandidates.includes(candidate._id)}
                            onChange={() => handleSelectCandidate(candidate._id)}
                          />
                        </TableCell>
                        <TableCell>{candidate.username}</TableCell>
                        <TableCell>
                          {candidate.averageScore !== undefined ? (
                            <Typography variant="body2" fontWeight={600}>
                              {candidate.averageScore}%
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {candidate.averageScore !== undefined ? (
                            <Chip 
                              label={candidate.averageScore >= 75 ? 'Pass' : 'Fail'}
                              size="small"
                              color={candidate.averageScore >= 75 ? 'success' : 'error'}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTestHistory(candidate);
                            }}
                            color="info"
                            sx={{ mr: 1 }}
                          >
                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCandidate(candidate);
                            }}
                            color="primary"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
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
            label="Test Name"
            fullWidth
            margin="normal"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Test Type</InputLabel>
            <Select
              value={testType}
              onChange={e => setTestType(e.target.value)}
              label="Test Type"
            >
              <MenuItem value="Coding">Coding</MenuItem>
              <MenuItem value="MCQ">MCQ</MenuItem>
              <MenuItem value="Explanation">Explanation</MenuItem>
            </Select>
          </FormControl>
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
              {testType === 'Coding' ? 'Upload Programs (Excel/CSV File)' : testType === 'MCQ' ? 'Upload MCQ Questions (Excel/CSV File)' : 'Upload Explanation Questions (Excel/CSV File)'}
            </Typography>
            {testType === 'Coding' ? (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  <strong>Required columns:</strong> Title, Description
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  <strong>Optional column:</strong> TestCases (can be JSON array or plain text)
                </Typography>
                <Typography variant="caption" color="info.main" sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
                  <strong>TestCases: </strong><br/>
                  &ensp;&ensp; <strong>JSON:</strong> [&#123;"input":"5","output":"120"&#125;,&#123;"input":"3","output":"6"&#125;] <br/>
                  &ensp;&ensp; <strong>Plain Text: </strong>Input: 5<br/>
                  &ensp;&ensp;&ensp;&ensp;
                  &ensp;&ensp;&ensp;&ensp;
                  &ensp;&ensp;&ensp;&ensp;
                  &ensp;&ensp;&ensp;
                  Output: 120
                </Typography>
              </>
            ) : testType === 'MCQ' ? (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Required columns: <strong>Question</strong>, <strong>Option1</strong>, <strong>Option2</strong>, <strong>Option3</strong>, <strong>Option4</strong>, <strong>CorrectOption</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Note: CorrectOption should be a number (1, 2, 3, or 4)
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Required column: <strong>Question</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Note: Each row should contain one question that requires a detailed explanation
                </Typography>
              </>
            )}
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
      <Dialog open={openCandidateDialog} onClose={() => {
        setOpenCandidateDialog(false);
        setCandidateDialogTab(0);
        setCandidateFile(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Create Candidate</DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={candidateDialogTab} onChange={(e, newValue) => setCandidateDialogTab(newValue)}>
            <Tab label="Single Candidate" />
            <Tab label="Bulk Upload" />
          </Tabs>
        </Box>
        <DialogContent>
          {candidateDialogTab === 0 && (
            <Box>
              <TextField
                label="Username"
                fullWidth
                margin="normal"
                value={candidateUsername}
                onChange={e => setCandidateUsername(e.target.value)}
                required
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={candidatePassword}
                onChange={e => setCandidatePassword(e.target.value)}
                required
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Test Type</InputLabel>
                <Select
                  value={candidateTestType}
                  onChange={e => {
                    setCandidateTestType(e.target.value);
                    setCandidateTestSession(''); // Reset test selection when test type changes
                  }}
                  label="Test Type"
                >
                  {[...new Set(sessions.map(s => s.testType || 'Coding'))].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" disabled={!candidateTestType} required>
                <InputLabel>Test Name</InputLabel>
                <Select
                  value={candidateTestSession}
                  onChange={e => setCandidateTestSession(e.target.value)}
                  label="Test Name"
                >
                  {sessions
                    .filter(session => (session.testType || 'Coding') === candidateTestType)
                    .map((session) => (
                      <MenuItem key={session._id} value={session._id}>
                        {session.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
          )}
          
          {candidateDialogTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Upload Candidates (Excel/CSV File)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Required columns: <strong>Username</strong>, <strong>Password</strong>, <strong>TestType</strong>, <strong>TestName</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Note: TestType should be 'Coding' or 'MCQ'. TestName should match Test names (case insensitive)
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenCandidateDialog(false);
            setCandidateDialogTab(0);
            setCandidateFile(null);
          }}>Cancel</Button>
          <Button onClick={handleCreateCandidate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Candidate Dialog */}
      <Dialog open={openEditCandidateDialog} onClose={() => setOpenEditCandidateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Candidate Password</DialogTitle>
        <DialogContent>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={editingCandidate?.username || ''}
            disabled
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={editCandidatePassword}
            onChange={e => setEditCandidatePassword(e.target.value)}
            required
            helperText="Enter a new password for this candidate"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditCandidateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateCandidate} 
            variant="contained"
            disabled={!editCandidatePassword || editCandidatePassword.trim().length === 0}
          >
            Update
          </Button>
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
          <FormControl fullWidth margin="normal" disabled>
            <InputLabel>Test Type</InputLabel>
            <Select
              value={testType}
              onChange={e => setTestType(e.target.value)}
              label="Test Type"
              disabled
            >
              <MenuItem value="Coding">Coding</MenuItem>
              <MenuItem value="MCQ">MCQ</MenuItem>
              <MenuItem value="Explanation">Explanation</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Duration (minutes)"
            type="number"
            fullWidth
            margin="normal"
            value={sessionDuration}
            onChange={e => setSessionDuration(e.target.value)}
          />
          
          {testType === 'Coding' ? (
            <>
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
                                sx={{ mb: 2 }}
                              />
                              
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Test Cases
                              </Typography>
                              {editProgramTestCases.map((testCase, index) => (
                                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fafafa' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>Test Case {index + 1}</Typography>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => {
                                        const newTestCases = editProgramTestCases.filter((_, i) => i !== index);
                                        setEditProgramTestCases(newTestCases);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                  <TextField
                                    label="Input"
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    value={testCase.input}
                                    onChange={e => {
                                      const newTestCases = [...editProgramTestCases];
                                      newTestCases[index].input = e.target.value;
                                      setEditProgramTestCases(newTestCases);
                                    }}
                                    sx={{ mb: 1 }}
                                  />
                                  <TextField
                                    label="Expected Output"
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    value={testCase.output}
                                    onChange={e => {
                                      const newTestCases = [...editProgramTestCases];
                                      newTestCases[index].output = e.target.value;
                                      setEditProgramTestCases(newTestCases);
                                    }}
                                  />
                                </Box>
                              ))}
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setEditProgramTestCases([...editProgramTestCases, { input: '', output: '' }]);
                                }}
                                sx={{ mb: 2 }}
                              >
                                + Add Test Case
                              </Button>
                              
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
            </>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                MCQ Questions
              </Typography>
              
              {mcqQuestions.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  No MCQ questions available.
                </Typography>
              ) : (
                <List sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  {mcqQuestions.map((question, index) => (
                    <React.Fragment key={question._id}>
                      <ListItem
                        sx={{ 
                          '&:hover': { bgcolor: '#f5f5f5' },
                          borderBottom: expandedMcqQuestion === question._id ? 'none' : '1px solid #e0e0e0',
                          display: 'flex',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ListItemText 
                              primary={`Q${index + 1}: ${question.question}`}
                              onClick={() => setExpandedMcqQuestion(expandedMcqQuestion === question._id ? null : question._id)}
                              sx={{ flex: 1, cursor: 'pointer' }}
                            />
                            <IconButton
                              onClick={() => setExpandedMcqQuestion(expandedMcqQuestion === question._id ? null : question._id)}
                              size="small"
                            >
                              {expandedMcqQuestion === question._id ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>
                        </Box>
                      </ListItem>
                      <Collapse in={expandedMcqQuestion === question._id} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                          <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>Options:</Typography>
                          {question.options?.map((option, optIndex) => (
                            <Box key={optIndex} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ 
                                  fontWeight: question.correctOption === (optIndex + 1) ? 'bold' : 'normal',
                                  color: question.correctOption === (optIndex + 1) ? 'success.main' : 'text.secondary'
                                }}
                              >
                                {optIndex + 1}. {option}
                                {question.correctOption === (optIndex + 1) && ' ✓'}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </>
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

      {/* Single Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false, type: '', id: null, name: '' })}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {deleteConfirmDialog.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog({ open: false, type: '', id: null, name: '' })}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test History Dialog */}
      <Dialog 
        open={openTestHistoryDialog} 
        onClose={() => setOpenTestHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Test History - {selectedCandidateForHistory?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => setOpenAssignTestDialog(true)}
              sx={{ bgcolor: '#00a86b', '&:hover': { bgcolor: '#008f5a' } }}
            >
              Assign New Test
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Test Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Result</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assigned</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Active</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No tests assigned yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  testHistory.map((assignment) => (
                    <TableRow key={assignment._id}>
                      <TableCell>
                        <Typography variant="body2">
                          {assignment.testSession?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={assignment.testType} 
                          size="small" 
                          color={assignment.testType === 'MCQ' ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        {assignment.status === 'not-started' && (
                          <Chip label="Not Started" size="small" color="default" />
                        )}
                        {assignment.status === 'in-progress' && (
                          <Chip label="In Progress" size="small" color="warning" />
                        )}
                        {assignment.status === 'completed' && (
                          <Chip label="Completed" size="small" color="success" />
                        )}
                      </TableCell>
                      <TableCell>
                        {assignment.testType === 'MCQ' && assignment.score !== undefined ? (
                          <Typography variant="body2" fontWeight={600}>
                            {assignment.score}/{assignment.totalQuestions} ({Math.round((assignment.score / assignment.totalQuestions) * 100)}%)
                          </Typography>
                        ) : assignment.testType === 'Explanation' && assignment.score !== undefined && assignment.score !== null ? (
                          <Typography variant="body2" fontWeight={600}>
                            {assignment.score}/{assignment.totalQuestions} ({Math.round((assignment.score / assignment.totalQuestions) * 100)}%)
                          </Typography>
                        ) : assignment.testType === 'Coding' && assignment.status === 'completed' ? (
                          <Typography variant="body2" fontWeight={600}>
                            {assignment.score !== undefined && assignment.score !== null ? assignment.score : (assignment.aiScore !== undefined ? assignment.aiScore : 0)}/100
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {assignment.testType === 'MCQ' && assignment.score !== undefined ? (
                          <Chip 
                            label={Math.round((assignment.score / assignment.totalQuestions) * 100) >= 75 ? 'Pass' : 'Fail'}
                            size="small"
                            color={Math.round((assignment.score / assignment.totalQuestions) * 100) >= 75 ? 'success' : 'error'}
                          />
                        ) : assignment.testType === 'Explanation' && assignment.score !== undefined && assignment.score !== null ? (
                          <Chip 
                            label={Math.round((assignment.score / assignment.totalQuestions) * 100) >= 75 ? 'Pass' : 'Fail'}
                            size="small"
                            color={Math.round((assignment.score / assignment.totalQuestions) * 100) >= 75 ? 'success' : 'error'}
                          />
                        ) : assignment.testType === 'Coding' && assignment.status === 'completed' ? (
                          <Chip 
                            label={((assignment.score !== undefined && assignment.score !== null) ? assignment.score : (assignment.aiScore !== undefined ? assignment.aiScore : 0)) >= 75 ? 'Pass' : 'Fail'}
                            size="small"
                            color={((assignment.score !== undefined && assignment.score !== null) ? assignment.score : (assignment.aiScore !== undefined ? assignment.aiScore : 0)) >= 75 ? 'success' : 'error'}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {assignment.isActive ? (
                          <Chip label="Active" size="small" color="success" />
                        ) : assignment.status !== 'completed' ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSetActiveTest(assignment._id)}
                            sx={{ textTransform: 'none' }}
                          >
                            Set Active
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {assignment.status === 'completed' && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewSubmission(assignment)}
                              title="View Submission"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTestAssignment(assignment._id, assignment.testName)}
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTestHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Test Dialog */}
      <Dialog 
        open={openAssignTestDialog} 
        onClose={() => setOpenAssignTestDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Test to {selectedCandidateForHistory?.username}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Test Type</InputLabel>
              <Select
                value={assignTestType}
                onChange={(e) => {
                  setAssignTestType(e.target.value);
                  setAssignTestSession('');
                }}
                label="Test Type"
              >
                <MenuItem value="">Select Test Type</MenuItem>
                <MenuItem value="Coding">Coding</MenuItem>
                <MenuItem value="MCQ">MCQ</MenuItem>
                <MenuItem value="Explanation">Explanation</MenuItem>
              </Select>
            </FormControl>
            
            {assignTestType && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Test</InputLabel>
                <Select
                  value={assignTestSession}
                  onChange={(e) => setAssignTestSession(e.target.value)}
                  label="Test"
                >
                  <MenuItem value="">Select Test</MenuItem>
                  {sessions
                    .filter(s => s.testType === assignTestType)
                    .map((session) => (
                      <MenuItem key={session._id} value={session._id}>
                        {session.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={makeActiveTest}
                  onChange={(e) => setMakeActiveTest(e.target.checked)}
                />
              }
              label="Make this test active"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignTestDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignTest} variant="contained" color="primary">
            Assign Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submission View Dialog */}
      <Dialog 
        open={openSubmissionDialog} 
        onClose={() => setOpenSubmissionDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Submission - {viewingSubmission?.testType} Test
        </DialogTitle>
        <DialogContent>
          {viewingSubmission?.testType === 'Coding' ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Problem: {viewingSubmission?.program?.title}
              </Typography>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Language: {viewingSubmission?.solution?.language}
              </Typography>
              
              {/* AI Evaluation Section */}
              {viewingSubmission?.solution?.aiEvaluation && (
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    AI Evaluation by Gemini 2.5 Flash
                  </Typography>
                  <Paper elevation={3} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Overall Score</Typography>
                        <Typography variant="h5" color="primary">
                          {viewingSubmission.solution.aiEvaluation.overallScore}/100
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Correctness</Typography>
                        <Typography variant="h6">
                          {viewingSubmission.solution.aiEvaluation.correctnessScore || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Code Quality</Typography>
                        <Typography variant="h6">
                          {viewingSubmission.solution.aiEvaluation.codeQualityScore || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Standards</Typography>
                        <Typography variant="h6">
                          {viewingSubmission.solution.aiEvaluation.codingStandardsScore || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>Summary:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {viewingSubmission.solution.aiEvaluation.summary}
                      </Typography>
                    </Box>
                    
                    {viewingSubmission.solution.aiEvaluation.strengths?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom color="success.main">
                          Strengths:
                        </Typography>
                        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                          {viewingSubmission.solution.aiEvaluation.strengths.map((s, i) => (
                            <li key={i}><Typography variant="body2">{s}</Typography></li>
                          ))}
                        </ul>
                      </Box>
                    )}
                    
                    {viewingSubmission.solution.aiEvaluation.weaknesses?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom color="error.main">
                          Areas for Improvement:
                        </Typography>
                        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                          {viewingSubmission.solution.aiEvaluation.weaknesses.map((w, i) => (
                            <li key={i}><Typography variant="body2">{w}</Typography></li>
                          ))}
                        </ul>
                      </Box>
                    )}
                    
                    {viewingSubmission.solution.aiEvaluation.suggestions?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom color="info.main">
                          Suggestions:
                        </Typography>
                        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                          {viewingSubmission.solution.aiEvaluation.suggestions.map((s, i) => (
                            <li key={i}><Typography variant="body2">{s}</Typography></li>
                          ))}
                        </ul>
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}
              
              {viewingSubmission?.solution?.tabSwitchCount !== undefined && viewingSubmission?.solution?.tabSwitchCount >= 1 && (
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    mt: 2, 
                    bgcolor: viewingSubmission.solution.tabSwitchCount >= 2 ? '#ffebee' : '#fff3e0', 
                    borderLeft: viewingSubmission.solution.tabSwitchCount >= 2 ? '4px solid #d32f2f' : '4px solid #ff9800' 
                  }}
                >
                  <Typography 
                    variant="body2" 
                    fontWeight={600} 
                    color={viewingSubmission.solution.tabSwitchCount >= 2 ? 'error.main' : 'warning.main'} 
                    gutterBottom
                  >
                    {viewingSubmission.solution.tabSwitchCount >= 2 ? '🚫 Test Terminated Due to Tab Switching' : '⚠️ Tab Switch Detected'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    The candidate switched tabs or windows <strong>{viewingSubmission.solution.tabSwitchCount} time(s)</strong> during this test.
                    {viewingSubmission.solution.tabSwitchCount >= 2 && (
                      <span style={{ display: 'block', marginTop: '8px', fontWeight: 600, color: '#d32f2f' }}>
                        The test was automatically submitted and the candidate was logged out due to excessive tab switching.
                      </span>
                    )}
                  </Typography>
                </Paper>
              )}
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Submitted Code
              </Typography>
              <Paper elevation={3} sx={{ p: 2, bgcolor: '#1e1e1e', mt: 2 }}>
                <pre style={{ 
                  color: '#d4d4d4', 
                  margin: 0, 
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {viewingSubmission?.solution?.code || 'No code submitted'}
                </pre>
              </Paper>
              
              {/* Manual Score Input Section */}
              <Paper elevation={3} sx={{ p: 3, mt: 3, bgcolor: '#f8f9fa' }}>
                <Typography variant="h6" gutterBottom>
                  Manual Scoring
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  Override AI score with manual evaluation (0 to 100)
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    label="Score (0-100)"
                    type="number"
                    value={codingScore}
                    onChange={(e) => setCodingScore(e.target.value)}
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 1
                    }}
                    sx={{ flex: 1 }}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveCodingScore}
                    disabled={savingCodingScore || !codingScore}
                    sx={{ minWidth: 100 }}
                  >
                    {savingCodingScore ? 'Saving...' : 'Save Score'}
                  </Button>
                </Box>
              </Paper>
            </Box>
          ) : viewingSubmission?.testType === 'MCQ' ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                MCQ Answers
              </Typography>
              <Typography variant="subtitle1" gutterBottom color="text.secondary">
                Score: {viewingSubmission?.mcqAnswer?.score}/{viewingSubmission?.mcqAnswer?.totalQuestions} 
                ({Math.round((viewingSubmission?.mcqAnswer?.score / viewingSubmission?.mcqAnswer?.totalQuestions) * 100)}%)
              </Typography>
              
              {viewingSubmission?.mcqAnswer?.tabSwitchCount !== undefined && viewingSubmission?.mcqAnswer?.tabSwitchCount >= 1 && (
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    mt: 2, 
                    bgcolor: viewingSubmission.mcqAnswer.tabSwitchCount >= 2 ? '#ffebee' : '#fff3e0', 
                    borderLeft: viewingSubmission.mcqAnswer.tabSwitchCount >= 2 ? '4px solid #d32f2f' : '4px solid #ff9800' 
                  }}
                >
                  <Typography 
                    variant="body2" 
                    fontWeight={600} 
                    color={viewingSubmission.mcqAnswer.tabSwitchCount >= 2 ? 'error.main' : 'warning.main'} 
                    gutterBottom
                  >
                    {viewingSubmission.mcqAnswer.tabSwitchCount >= 2 ? '🚫 Test Terminated Due to Tab Switching' : '⚠️ Tab Switch Detected'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    The candidate switched tabs or windows <strong>{viewingSubmission.mcqAnswer.tabSwitchCount} time(s)</strong> during this test.
                    {viewingSubmission.mcqAnswer.tabSwitchCount >= 2 && (
                      <span style={{ display: 'block', marginTop: '8px', fontWeight: 600, color: '#d32f2f' }}>
                        The test was automatically submitted and the candidate was logged out due to excessive tab switching.
                      </span>
                    )}
                  </Typography>
                </Paper>
              )}
              
              {viewingSubmission?.questions?.map((question, index) => {
                const userAnswer = viewingSubmission?.mcqAnswer?.answers?.find(
                  a => a.questionId.toString() === question._id.toString()
                );
                const isCorrect = userAnswer?.selectedOption === question.correctOption;
                
                return (
                  <Paper key={question._id} elevation={2} sx={{ p: 2, mb: 2, mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Question {index + 1}: {question.question}
                    </Typography>
                    
                    <Box sx={{ mt: 1, ml: 2 }}>
                      {question.options.map((option, optIndex) => {
                        const optionNumber = optIndex + 1;
                        const isUserAnswer = userAnswer?.selectedOption === optionNumber;
                        const isCorrectOption = question.correctOption === optionNumber;
                        
                        let bgcolor = 'transparent';
                        if (isUserAnswer && isCorrect) bgcolor = '#e8f5e9';
                        else if (isUserAnswer && !isCorrect) bgcolor = '#ffebee';
                        else if (isCorrectOption) bgcolor = '#e8f5e9';
                        
                        return (
                          <Box 
                            key={optIndex}
                            sx={{ 
                              p: 1, 
                              mb: 1, 
                              borderRadius: 1,
                              bgcolor,
                              border: isUserAnswer ? '2px solid' : '1px solid',
                              borderColor: isUserAnswer ? (isCorrect ? 'success.main' : 'error.main') : 'divider'
                            }}
                          >
                            <Typography>
                              {optionNumber}. {option}
                              {isUserAnswer && ' (Your Answer)'}
                              {isCorrectOption && ' ✓ (Correct Answer)'}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                    
                    <Chip 
                      label={isCorrect ? 'Correct' : 'Incorrect'}
                      size="small"
                      color={isCorrect ? 'success' : 'error'}
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                );
              })}
            </Box>
          ) : viewingSubmission?.testType === 'Explanation' ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Explanation Answers
              </Typography>
              
              {/* Display current score if available */}
              {viewingSubmission?.explanationAnswer?.score !== undefined && viewingSubmission?.explanationAnswer?.score !== null && (
                <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="primary">
                    Current Score: {viewingSubmission.explanationAnswer.score}/{viewingSubmission.questions?.length || 0} 
                    ({Math.round((viewingSubmission.explanationAnswer.score / (viewingSubmission.questions?.length || 1)) * 100)}%)
                  </Typography>
                </Box>
              )}
              
              <Typography variant="subtitle1" gutterBottom color="text.secondary">
                Answered: {viewingSubmission?.explanationAnswer?.answers?.filter(a => a.answer && a.answer.trim()).length || 0}/{viewingSubmission?.questions?.length || 0} questions
              </Typography>
              
              {viewingSubmission?.explanationAnswer?.tabSwitchCount !== undefined && viewingSubmission?.explanationAnswer?.tabSwitchCount >= 1 && (
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    mt: 2, 
                    bgcolor: viewingSubmission.explanationAnswer.tabSwitchCount >= 2 ? '#ffebee' : '#fff3e0', 
                    borderLeft: viewingSubmission.explanationAnswer.tabSwitchCount >= 2 ? '4px solid #d32f2f' : '4px solid #ff9800' 
                  }}
                >
                  <Typography 
                    variant="body2" 
                    fontWeight={600} 
                    color={viewingSubmission.explanationAnswer.tabSwitchCount >= 2 ? 'error.main' : 'warning.main'} 
                    gutterBottom
                  >
                    {viewingSubmission.explanationAnswer.tabSwitchCount >= 2 ? '🚫 Test Terminated Due to Tab Switching' : '⚠️ Tab Switch Detected'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    The candidate switched tabs or windows <strong>{viewingSubmission.explanationAnswer.tabSwitchCount} time(s)</strong> during this test.
                    {viewingSubmission.explanationAnswer.tabSwitchCount >= 2 && (
                      <span style={{ display: 'block', marginTop: '8px', fontWeight: 600, color: '#d32f2f' }}>
                        The test was automatically submitted and the candidate was logged out due to excessive tab switching.
                      </span>
                    )}
                  </Typography>
                </Paper>
              )}
              
              {viewingSubmission?.questions?.map((question, index) => {
                const userAnswer = viewingSubmission?.explanationAnswer?.answers?.find(
                  a => a.question?._id?.toString() === question._id.toString()
                );
                
                return (
                  <Paper key={question._id} elevation={2} sx={{ p: 2, mb: 2, mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Question {index + 1}: {question.question}
                    </Typography>
                    
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
                        Candidate's Answer:
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {userAnswer?.answer || '(No answer provided)'}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
              
              {/* Score Input Section */}
              <Paper elevation={3} sx={{ p: 3, mt: 3, bgcolor: '#f8f9fa' }}>
                <Typography variant="h6" gutterBottom>
                  Manual Scoring
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  Enter the number of correct answers (0 to {viewingSubmission?.questions?.length || 0})
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    label="Number of Correct Answers"
                    type="number"
                    value={explanationScore}
                    onChange={(e) => setExplanationScore(e.target.value)}
                    inputProps={{ 
                      min: 0, 
                      max: viewingSubmission?.questions?.length || 0,
                      step: 1
                    }}
                    sx={{ flex: 1 }}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveExplanationScore}
                    disabled={savingScore || !explanationScore}
                    sx={{ minWidth: 100 }}
                  >
                    {savingScore ? 'Saving...' : 'Save Score'}
                  </Button>
                </Box>
              </Paper>
            </Box>
          ) : (
            <Typography>No submission data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubmissionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Stacked Snackbars for notifications */}
      {snackbars.map((snackbar, index) => (
        <Snackbar
          key={snackbar.id}
          open={true}
          autoHideDuration={4000}
          onClose={() => removeSnackbar(snackbar.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ top: `${24 + index * 70}px !important` }}
        >
          <Alert onClose={() => removeSnackbar(snackbar.id)} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};

export default AdminDashboard;
