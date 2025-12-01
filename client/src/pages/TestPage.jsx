import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Select,
  MenuItem,
  Button,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Divider,
} from '@mui/material';
import { 
  PlayArrow as RunIcon, 
  CloudUpload as SubmitIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

const TestPage = () => {
  const [program, setProgram] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [bottomTab, setBottomTab] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(40);
  const [isResizing, setIsResizing] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(35);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null); // Time in seconds
  const editorRef = useRef(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
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
    if (editorRef.current && program) {
      const currentCode = editorRef.current.getValue();
      try {
        await axios.post('/api/candidate/test/submit', {
          programId: program._id,
          code: currentCode,
          language,
        }, { withCredentials: true });
        navigate('/test-completed');
      } catch (err) {
        console.error('Auto-submit error:', err);
        navigate('/test-completed');
      }
    }
  };

  // Check if user has completed the test
  useEffect(() => {
    if (user?.testStatus === 'completed') {
      navigate('/test-completed');
    }
  }, [user, navigate]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleVerticalMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingVertical(true);
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    e.preventDefault();
    const container = e.currentTarget;
    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    if (newWidth >= 20 && newWidth <= 70) {
      setLeftPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isResizing) {
        const container = document.querySelector('[data-main-container]');
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newWidth >= 20 && newWidth <= 70) {
          setLeftPanelWidth(newWidth);
        }
      }
      
      if (isResizingVertical) {
        const editorContainer = document.querySelector('[data-editor-container]');
        if (!editorContainer) return;
        const containerRect = editorContainer.getBoundingClientRect();
        const newHeight = ((containerRect.bottom - e.clientY) / containerRect.height) * 100;
        if (newHeight >= 20 && newHeight <= 70) {
          setBottomPanelHeight(newHeight);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsResizing(false);
      setIsResizingVertical(false);
    };

    if (isResizing || isResizingVertical) {
      document.body.style.cursor = isResizing ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isResizing, isResizingVertical]);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const res = await axios.get('/api/candidate/test/program', { withCredentials: true });
        setProgram(res.data);
        
        // Calculate time remaining
        if (res.data.testStartTime && res.data.testDuration) {
          const startTime = new Date(res.data.testStartTime).getTime();
          const durationMs = res.data.testDuration * 60 * 1000; // Convert minutes to milliseconds
          const endTime = startTime + durationMs;
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000)); // Convert to seconds
          
          setTimeRemaining(remaining);
          
          // If time already expired, auto-submit immediately
          if (remaining <= 0) {
            autoSubmit();
          }
        }
        
        // Set initial code based on language
        setCode(getInitialCode(language));
      } catch (err) {
        console.error(err);
      }
    };
    fetchProgram();
  }, []);

  const getInitialCode = (lang) => {
    switch (lang) {
      case 'javascript':
        return '// Write your JavaScript code here';
      case 'python':
        return '# Write your Python code here';
      case 'java':
        return '// Write your Java code here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}';
      default:
        return '';
    }
  };

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
  }

  useEffect(() => {
    const autoSave = setInterval(() => {
      if (editorRef.current) {
        const currentCode = editorRef.current.getValue();
        // In a real app, you would save this to the backend
        console.log('Auto-saving code:', currentCode);
        // For now, just update the state
        setCode(currentCode);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSave);
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

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    setCode(getInitialCode(newLanguage));
  };

  const handleSubmit = async () => {
    if (editorRef.current) {
      const currentCode = editorRef.current.getValue();
      try {
        await axios.post('/api/candidate/test/submit', {
          programId: program._id,
          code: currentCode,
          language,
        }, { withCredentials: true });
        navigate('/submission-success');
      } catch (err) {
        console.error(err);
        alert('Failed to submit solution.');
      }
    }
  };

  if (!program) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      {/* Top Navigation Bar */}
      <Box sx={{ 
        bgcolor: '#fff', 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1
      }}>
        <Typography sx={{ color: '#000', fontWeight: 500 }}>
          Code Editor
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {timeRemaining !== null && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: timeRemaining < 300 ? '#ffebee' : '#e3f2fd',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              border: `1px solid ${timeRemaining < 300 ? '#f44336' : '#2196f3'}`
            }}>
              <Typography sx={{ 
                color: timeRemaining < 300 ? '#d32f2f' : '#1976d2',
                fontWeight: 600,
                fontSize: '14px',
                fontFamily: 'monospace'
              }}>
                ⏱ {formatTime(timeRemaining)}
              </Typography>
            </Box>
          )}
          <Button 
            variant="contained" 
            size="small"
            onClick={handleLogout}
            sx={{ 
              bgcolor: '#ff4444',
              textTransform: 'none',
              '&:hover': { bgcolor: '#cc0000' }
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box 
        data-main-container
        sx={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}
      >
        {/* Left Panel - Problem Description */}
        {!isFullscreen && (
          <Box sx={{ 
            flexBasis: `${leftPanelWidth}%`,
            flexShrink: 0,
            flexGrow: 0,
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#fff',
            overflow: 'hidden'
          }}>
          <Box sx={{ 
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            gap: 3,
            px: 3,
            pt: 2
          }}>
            <Typography 
              sx={{ 
                color: '#000', 
                pb: 1,
                borderBottom: '2px solid #000',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              Description
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            <Typography variant="h5" sx={{ color: '#000', mb: 2 }}>
              {program?.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <Box sx={{ 
                px: 1.5, 
                py: 0.5, 
                bgcolor: '#00b8a3', 
                borderRadius: '12px',
                fontSize: '12px',
                color: '#fff'
              }}>
                Easy
              </Box>
            </Box>
            <Typography sx={{ color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {program?.description}
            </Typography>
          </Box>
        </Box>
        )}

        {/* Resize Handle */}
        {!isFullscreen && (
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              width: '4px',
              cursor: 'col-resize',
              bgcolor: isResizing ? '#00b8a3' : '#e0e0e0',
              '&:hover': {
                bgcolor: '#00b8a3'
              },
              transition: 'background-color 0.2s',
              position: 'relative',
              zIndex: 10,
              userSelect: 'none',
              flexShrink: 0
            }}
          />
        )}

        {/* Right Panel - Code Editor */}
        <Box 
          data-editor-container
          sx={{ 
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Editor Header */}
          <Box sx={{ 
            bgcolor: '#f5f5f5',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            flexShrink: 0,
            minWidth: 0
          }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={language}
                onChange={handleLanguageChange}
                sx={{
                  color: '#000',
                  '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem value="python">Python</MenuItem>
                <MenuItem value="java">Java</MenuItem>
              </Select>
            </FormControl>
            <IconButton size="small" onClick={toggleFullscreen} sx={{ color: '#666' }}>
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Box>

          {/* Code Editor */}
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onMount={handleEditorDidMount}
              theme="light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </Box>

          {/* Vertical Resize Handle */}
          {!isFullscreen && (
            <Box
              onMouseDown={handleVerticalMouseDown}
              sx={{
                height: '5px',
                cursor: 'row-resize',
                bgcolor: isResizingVertical ? '#00b8a3' : 'transparent',
                '&:hover': {
                  bgcolor: '#00b8a3'
                },
                transition: 'background-color 0.2s',
                position: 'relative',
                zIndex: 10,
                userSelect: 'none',
                flexShrink: 0
              }}
            />
          )}

          {/* Bottom Panel - Testcase/Results */}
          {!isFullscreen && (
            <Box sx={{ 
              height: `${bottomPanelHeight}%`,
              borderTop: '1px solid #e0e0e0',
              bgcolor: '#fff',
              display: 'flex',
              flexDirection: 'column'
            }}>
            <Tabs 
              value={bottomTab} 
              onChange={(e, val) => setBottomTab(val)}
              sx={{
                minHeight: '40px',
                borderBottom: '1px solid #e0e0e0',
                '.MuiTab-root': {
                  color: '#666',
                  textTransform: 'none',
                  minHeight: '40px',
                  fontSize: '13px'
                },
                '.Mui-selected': {
                  color: '#000'
                },
                '.MuiTabs-indicator': {
                  bgcolor: '#000'
                }
              }}
            >
              <Tab label="Testcase" />
              <Tab label="Test Result" />
            </Tabs>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {bottomTab === 0 && (
                <Box>
                  <Typography sx={{ color: '#666', fontSize: '13px', mb: 1 }}>
                    Case 1
                  </Typography>
                  <Box sx={{ 
                    bgcolor: '#f5f5f5', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: '#000'
                  }}>
                    nums = [2,7,11,15], target = 9
                  </Box>
                </Box>
              )}
              {bottomTab === 1 && (
                <Typography sx={{ color: '#666', fontSize: '13px' }}>
                  You must run your code first.
                </Typography>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ 
              borderTop: '1px solid #e0e0e0',
              p: 2,
              display: 'flex',
              gap: 1,
              justifyContent: 'flex-end',
              bgcolor: '#fafafa'
            }}>
              <Button
                variant="outlined"
                startIcon={<RunIcon />}
                sx={{
                  color: '#000',
                  borderColor: '#d0d0d0',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#000',
                    bgcolor: 'rgba(0,0,0,0.05)'
                  }
                }}
              >
                Run
              </Button>
              <Button
                variant="contained"
                startIcon={<SubmitIcon />}
                onClick={handleSubmit}
                sx={{
                  bgcolor: '#00b8a3',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#009688'
                  }
                }}
              >
                Submit
              </Button>
            </Box>
          </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TestPage;
