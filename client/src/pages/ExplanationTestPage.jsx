import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Logout as LogoutIcon, Send as SendIcon } from '@mui/icons-material';

const ExplanationTestPage = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [tabSwitchDialog, setTabSwitchDialog] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const { logout, user, loading: authLoading } = useAuth();
  
  // Load answers from localStorage when user is available
  useEffect(() => {
    const userId = user?.id || user?._id;
    
    if (!authLoading && userId) {
      const storageKey = `explanation_answers_${userId}`;
      const savedAnswers = localStorage.getItem(storageKey);
      if (savedAnswers) {
        try {
          const parsed = JSON.parse(savedAnswers);
          setAnswers(parsed);
        } catch (err) {
          console.error('Failed to parse saved answers:', err);
        }
      }
    }
  }, [user, authLoading]);

  const handleLogout = async () => {
    // Submit the test before logging out
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      question: questionId,
      answer: answer || '',
    }));

    try {
      // Always submit the test (even with empty answers) to mark it as completed
      await axios.post('/api/candidate/test/explanation/submit', {
        answers: answersArray,
      }, { withCredentials: true });
      
      // Clear localStorage
      const userId = user?.id || user?._id;
      if (userId) {
        localStorage.removeItem(`explanation_answers_${userId}`);
      }
    } catch (err) {
      console.error('Error submitting test on logout:', err);
    }
    
    await logout();
    navigate('/login');
  };

  // Format time for display (HH:MM:SS)
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Auto-submit when timer expires
  const autoSubmit = async () => {
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      question: questionId,
      answer: answer || '',
    }));

    try {
      await axios.post('/api/candidate/test/explanation/submit', {
        answers: answersArray,
        tabSwitchCount,
      }, { withCredentials: true });
      // Clear localStorage after successful submission
      const userId = user?.id || user?._id;
      if (userId) {
        const storageKey = `explanation_answers_${userId}`;
        localStorage.removeItem(storageKey);
      }
      navigate('/test-completed');
    } catch (err) {
      console.error('Auto-submit error:', err);
      navigate('/test-completed');
    }
  };

  // Submit test due to tab switch violation
  const handleTabSwitchTermination = async (count) => {
    // Read answers from localStorage to ensure we get the latest saved answers
    const userId = user?.id || user?._id;
    let currentAnswers = answers;
    
    if (userId) {
      const storageKey = `explanation_answers_${userId}`;
      const savedAnswers = localStorage.getItem(storageKey);
      console.log('[Tab Switch Termination] Reading from localStorage:', {
        storageKey,
        savedAnswers: savedAnswers ? 'exists' : 'null',
        stateAnswers: Object.keys(answers).length
      });
      if (savedAnswers) {
        try {
          currentAnswers = JSON.parse(savedAnswers);
          console.log('[Tab Switch Termination] Parsed answers:', {
            count: Object.keys(currentAnswers).length,
            answers: currentAnswers
          });
        } catch (err) {
          console.error('Failed to parse saved answers during termination:', err);
        }
      }
    }
    
    const answersArray = Object.entries(currentAnswers).map(([questionId, answer]) => ({
      question: questionId,
      answer: answer || '',
    }));

    console.log('[Tab Switch Termination] Submitting:', {
      answersCount: answersArray.length,
      answersArray,
      tabSwitchCount: count
    });

    try {
      await axios.post('/api/candidate/test/explanation/submit', {
        answers: answersArray,
        tabSwitchCount: count,
      }, { withCredentials: true });
      // Clear localStorage after successful submission
      if (userId) {
        const storageKey = `explanation_answers_${userId}`;
        localStorage.removeItem(storageKey);
      }
    } catch (err) {
      console.error('Tab switch termination error:', err);
    }
    // Show logout dialog instead of immediately navigating
    setLogoutDialog(true);
  };

  // Check if user has completed the test
  useEffect(() => {
    // Don't navigate away if we're showing the logout dialog
    if (user?.testStatus === 'completed' && !logoutDialog) {
      navigate('/test-completed');
    }
  }, [user, navigate, logoutDialog]);

  // Detect tab/window switches
  useEffect(() => {
    let lastSwitchTime = 0;
    const DEBOUNCE_TIME = 1000; // Prevent double counting within 1 second

    const recordSwitch = () => {
      const now = Date.now();
      if (now - lastSwitchTime > DEBOUNCE_TIME) {
        lastSwitchTime = now;
        setTabSwitchCount(prev => {
          const newCount = prev + 1;

          // If this is the second switch, terminate test
          if (newCount >= 2) {
            handleTabSwitchTermination(newCount);
          } else {
            // First switch, show warning
            setTabSwitchDialog(true);
          }
          
          return newCount;
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && questions.length > 0) {
        // Tab was switched
        recordSwitch();
      }
    };

    const handleBlur = () => {
      if (questions.length > 0) {
        // Window lost focus (switched to another application)
        recordSwitch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [questions]);

  // Fetch Explanation questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get('/api/candidate/test/explanation/questions', { withCredentials: true });
        setQuestions(res.data.questions);
        
        // Calculate time remaining
        if (res.data.testStartTime && res.data.testDuration) {
          const startTime = new Date(res.data.testStartTime).getTime();
          const durationMs = res.data.testDuration * 60 * 1000;
          const endTime = startTime + durationMs;
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          
          setTimeRemaining(remaining);
          
          if (remaining <= 0) {
            autoSubmit();
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          autoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Show warning when 5 minutes remaining
  useEffect(() => {
    if (timeRemaining === 300) {
      setSnackbar({ 
        open: true, 
        message: '⚠️ Warning: Only 5 minutes remaining!', 
        severity: 'warning' 
      });
    }
  }, [timeRemaining]);

  const handleAnswerChange = (questionId, answerText) => {
    const updatedAnswers = {
      ...answers,
      [questionId]: answerText,
    };
    setAnswers(updatedAnswers);
    
    // Save to localStorage immediately
    const userId = user?.id || user?._id;
    if (userId) {
      const storageKey = `explanation_answers_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedAnswers));
    }
  };

  const handleSubmit = () => {
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmDialog(false);
    
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      question: questionId,
      answer: answer || '',
    }));

    try {
      await axios.post('/api/candidate/test/explanation/submit', {
        answers: answersArray,
        tabSwitchCount,
      }, { withCredentials: true });
      // Clear localStorage after successful submission
      const userId = user?.id || user?._id;
      if (userId) {
        const storageKey = `explanation_answers_${userId}`;
        localStorage.removeItem(storageKey);
      }
      navigate('/test-completed');
    } catch (err) {
      console.error('Submit error:', err);
      setSnackbar({ open: true, message: 'Failed to submit answers. Please try again.', severity: 'error' });
    }
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(answer => answer && answer.trim().length > 0).length;
  };

  const getTotalCount = () => {
    return questions.length;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading questions...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#1a1a1a' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Explanation Test
          </Typography>
          <Chip 
            label={formatTime(timeRemaining)} 
            color={timeRemaining < 300 ? "error" : "primary"}
            sx={{ mr: 2, fontWeight: 'bold', fontSize: '1rem' }}
          />
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Progress Bar */}
      <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progress: {getAnsweredCount()} / {getTotalCount()} questions answered
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getTotalCount() > 0 ? Math.round((getAnsweredCount() / getTotalCount()) * 100) : 0}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={getTotalCount() > 0 ? (getAnsweredCount() / getTotalCount()) * 100 : 0} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* Questions */}
      <Container sx={{ flex: 1, overflowY: 'auto', py: 3 }}>
        {questions.map((question, index) => (
          <Paper key={question._id} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Question {index + 1}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {question.question}
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              placeholder="Type your answer here..."
              value={answers[question._id] || ''}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              sx={{ mb: 2 }}
            />
          </Paper>
        ))}
      </Container>

      {/* Submit Button */}
      <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
        <Container>
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={<SendIcon />}
            onClick={handleSubmit}
          >
            Submit Test
          </Button>
        </Container>
      </Box>

      {/* Confirm Submit Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>
            You have answered {getAnsweredCount()} out of {getTotalCount()} questions.
            Are you sure you want to submit your test?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmSubmit} color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tab Switch Warning Dialog */}
      <Dialog 
        open={tabSwitchDialog} 
        onClose={() => setTabSwitchDialog(false)}
      >
        <DialogTitle sx={{ color: 'error.main' }}>⚠️ Warning: Tab Switch Detected</DialogTitle>
        <DialogContent>
          <Typography>
            You have switched tabs or windows during the test. This is your first and only warning.
          </Typography>
          <Typography sx={{ mt: 2, fontWeight: 'bold' }}>
            If you switch tabs again, your test will be automatically submitted and you will be logged out.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTabSwitchDialog(false)} color="primary" variant="contained">
            I Understand
          </Button>
        </DialogActions>
      </Dialog>

      {/* Forced Logout Dialog */}
      <Dialog 
        open={logoutDialog}
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ color: 'error.main' }}>Test Submitted Due to Tab Switch</DialogTitle>
        <DialogContent>
          <Typography>
            You switched tabs/windows twice during the test. Your test has been automatically submitted with your current answers.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            You will now be logged out.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogout} color="primary" variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExplanationTestPage;
