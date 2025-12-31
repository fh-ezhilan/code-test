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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
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

const MCQTestPage = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();
  const { logout, user, loading: authLoading } = useAuth();
  
  // Load answers from localStorage when user is available
  useEffect(() => {
    const userId = user?.id || user?._id;
    
    if (!authLoading && userId) {
      const storageKey = `mcq_answers_${userId}`;
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
    const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    }));

    try {
      // Always submit the test (even with 0 answers) to mark it as completed
      await axios.post('/api/candidate/test/mcq/submit', {
        answers: answersArray,
      }, { withCredentials: true });
      
      // Clear localStorage
      const userId = user?.id || user?._id;
      if (userId) {
        localStorage.removeItem(`mcq_answers_${userId}`);
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
    const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    }));

    try {
      await axios.post('/api/candidate/test/mcq/submit', {
        answers: answersArray,
      }, { withCredentials: true });
      // Clear localStorage after successful submission
      const userId = user?.id || user?._id;
      if (userId) {
        const storageKey = `mcq_answers_${userId}`;
        localStorage.removeItem(storageKey);
      }
      navigate('/test-completed');
    } catch (err) {
      console.error('Auto-submit error:', err);
      navigate('/test-completed');
    }
  };

  // Check if user has completed the test
  useEffect(() => {
    if (user?.testStatus === 'completed') {
      navigate('/test-completed');
    }
  }, [user, navigate]);

  // Fetch MCQ questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get('/api/candidate/test/mcq/questions', { withCredentials: true });
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

  const handleAnswerChange = (questionId, selectedOption) => {
    const updatedAnswers = {
      ...answers,
      [questionId]: parseInt(selectedOption),
    };
    setAnswers(updatedAnswers);
    
    // Save to localStorage immediately
    const userId = user?.id || user?._id;
    if (userId) {
      const storageKey = `mcq_answers_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedAnswers));
    }
  };

  const handleSubmit = () => {
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmDialog(false);
    
    const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    }));

    try {
      await axios.post('/api/candidate/test/mcq/submit', {
        answers: answersArray,
      }, { withCredentials: true });
      // Clear localStorage after successful submission
      const userId = user?.id || user?._id;
      if (userId) {
        const storageKey = `mcq_answers_${userId}`;
        localStorage.removeItem(storageKey);
      }
      navigate('/test-completed');
    } catch (err) {
      console.error('Submit error:', err);
      setSnackbar({ open: true, message: 'Failed to submit answers. Please try again.', severity: 'error' });
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
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
            MCQ Test
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
            {Math.round((getAnsweredCount() / getTotalCount()) * 100)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={(getAnsweredCount() / getTotalCount()) * 100} 
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
            
            <FormControl component="fieldset">
              <RadioGroup
                value={answers[question._id]?.toString() || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              >
                {question.options.map((option, optIndex) => (
                  <FormControlLabel
                    key={optIndex}
                    value={(optIndex + 1).toString()}
                    control={<Radio />}
                    label={`${optIndex + 1}. ${option}`}
                    sx={{
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#f5f5f5' },
                      bgcolor: answers[question._id] === optIndex + 1 ? '#e3f2fd' : 'transparent',
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Paper>
        ))}

        {/* Submit Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            sx={{ 
              px: 6,
              py: 1.5,
              fontSize: '1.1rem',
              bgcolor: '#00a86b',
              '&:hover': { bgcolor: '#008f5a' }
            }}
          >
            Submit Test
          </Button>
        </Box>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>
            You have answered {getAnsweredCount()} out of {getTotalCount()} questions.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to submit your test? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmSubmit} variant="contained" color="primary">
            Confirm Submit
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
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

export default MCQTestPage;
