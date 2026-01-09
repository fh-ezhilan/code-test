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
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { 
  PlayArrow as RunIcon, 
  CloudUpload as SubmitIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

const TestPage = () => {
  const [program, setProgram] = useState(null);
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState('');
  const [bottomTab, setBottomTab] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(40);
  const [isResizing, setIsResizing] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(35);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null); // Time in seconds
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [timeWarningShown, setTimeWarningShown] = useState(false);
  const [timeWarningDialog, setTimeWarningDialog] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [tabSwitchDialog, setTabSwitchDialog] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const editorRef = useRef(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    // Submit the code before logging out
    if (editorRef.current && program?._id) {
      const currentCode = editorRef.current.getValue();
      try {
        // Always submit the test (even with empty code) to mark it as completed
        await axios.post('/api/candidate/test/submit', {
          programId: program._id,
          code: currentCode || '',
          language,
        }, { withCredentials: true });
      } catch (err) {
        console.error('Error submitting code on logout:', err);
      }
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
    if (editorRef.current && program) {
      const currentCode = editorRef.current.getValue();
      try {
        await axios.post('/api/candidate/test/submit', {
          programId: program._id,
          code: currentCode || '',
          language,
          tabSwitchCount,
        }, { withCredentials: true });
        navigate('/submission-success');
      } catch (err) {
        console.error('Auto-submit error:', err);
        navigate('/submission-success');
      }
    }
  };

  // Submit test due to tab switch violation
  const handleTabSwitchTermination = async (count) => {
    if (editorRef.current && program) {
      const currentCode = editorRef.current.getValue();
      try {
        await axios.post('/api/candidate/test/submit', {
          programId: program._id,
          code: currentCode || '',
          language,
          tabSwitchCount: count,
        }, { withCredentials: true });
      } catch (err) {
        console.error('Tab switch termination error:', err);
      }
    }
    // Show logout dialog instead of immediately logging out
    setLogoutDialog(true);
  };

  // Check if user has completed the test
  useEffect(() => {
    // Don't navigate away if we're showing the logout dialog
    if (user?.testStatus === 'completed' && !logoutDialog) {
      navigate('/submission-success');
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
          setTabSwitchDialog(true);
          // If this is the second switch, terminate test
          // if (newCount >= 2) {
          //   handleTabSwitchTermination(newCount);
          // } else {
          //   // First switch, show warning
          //   setTabSwitchDialog(true);
          // }
          
          return newCount;
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && program) {
        // Tab was switched
        recordSwitch();
      }
    };

    const handleBlur = () => {
      if (program) {
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
  }, [program]);

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
    
    // Configure JavaScript/TypeScript features for better IntelliSense
    if (language === 'javascript' || language === 'typescript') {
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2015,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        allowJs: true,
        checkJs: false,
      });

      // Enable diagnostics for better error detection
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      // Add common Node.js/ES6 type definitions for better IntelliSense
      monaco.languages.typescript.javascriptDefaults.addExtraLib(`
        declare const console: {
          log(...args: any[]): void;
          error(...args: any[]): void;
          warn(...args: any[]): void;
        };
        declare function setTimeout(callback: () => void, ms: number): number;
        declare function setInterval(callback: () => void, ms: number): number;
        declare function clearTimeout(id: number): void;
        declare function clearInterval(id: number): void;
      `, 'ts:filename/global.d.ts');
    }
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
        // Show warning when time drops below 5 minutes
        if (prev === 300 && !timeWarningShown) {
          setTimeWarningDialog(true);
          setTimeWarningShown(true);
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

  const handleRun = async () => {
    if (editorRef.current) {
      const currentCode = editorRef.current.getValue();
      setIsRunning(true);
      setBottomTab(1); // Switch to Test Result tab
      setTestResult(null);
      
      try {
        const res = await axios.post('/api/candidate/test/run', {
          code: currentCode,
          language,
          programId: program._id
        }, { withCredentials: true });
        
        setTestResult(res.data);
      } catch (err) {
        console.error('Run error:', err);
        setTestResult({
          success: false,
          error: err.response?.data?.error || err.message || 'Failed to run code'
        });
      } finally {
        setIsRunning(false);
      }
    }
  };

  const handleSubmit = () => {
    setConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setConfirmDialog(false);
    if (editorRef.current) {
      const currentCode = editorRef.current.getValue();
      try {
        setSnackbar({ open: true, message: 'Code is being submitted...', severity: 'info' });
        await axios.post('/api/candidate/test/submit', {
          programId: program._id,
          code: currentCode,
          language,
          tabSwitchCount,
        }, { withCredentials: true });
        setSnackbar({ open: true, message: 'Test submitted successfully!', severity: 'success' });
        setTimeout(() => navigate('/submission-success'), 1500);
      } catch (err) {
        console.error(err);
        setSnackbar({ open: true, message: 'Failed to submit solution.', severity: 'error' });
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
                suggestOnTriggerCharacters: true,
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: true,
                },
                quickSuggestionsDelay: 100,
                parameterHints: {
                  enabled: true,
                },
                suggest: {
                  snippetsPreventQuickSuggestions: false,
                  showMethods: true,
                  showFunctions: true,
                  showConstructors: true,
                  showFields: true,
                  showVariables: true,
                  showClasses: true,
                  showStructs: true,
                  showInterfaces: true,
                  showModules: true,
                  showProperties: true,
                  showKeywords: true,
                  showSnippets: true,
                },
                acceptSuggestionOnCommitCharacter: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
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
                  {program?.testCases && program.testCases.length > 0 ? (
                    program.testCases.map((testCase, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Typography sx={{ color: '#666', fontSize: '13px', mb: 1, fontWeight: 600 }}>
                          Test Case {index + 1}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ color: '#666', fontSize: '12px', mb: 0.5 }}>
                            Input:
                          </Typography>
                          <Box sx={{ 
                            bgcolor: '#f5f5f5', 
                            p: 2, 
                            borderRadius: 1,
                            border: '1px solid #e0e0e0',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            color: '#000',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {testCase.input || '(no input)'}
                          </Box>
                        </Box>
                        
                        <Box>
                          <Typography sx={{ color: '#666', fontSize: '12px', mb: 0.5 }}>
                            Expected Output:
                          </Typography>
                          <Box sx={{ 
                            bgcolor: '#f5f5f5', 
                            p: 2, 
                            borderRadius: 1,
                            border: '1px solid #e0e0e0',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            color: '#000',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {testCase.output}
                          </Box>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ color: '#666', fontSize: '13px' }}>
                      No test cases available.
                    </Typography>
                  )}
                </Box>
              )}
              {bottomTab === 1 && (
                <Box>
                  {isRunning && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography sx={{ color: '#666', fontSize: '13px' }}>
                        Running your code...
                      </Typography>
                    </Box>
                  )}
                  
                  {!isRunning && !testResult && (
                    <Typography sx={{ color: '#666', fontSize: '13px' }}>
                      You must run your code first.
                    </Typography>
                  )}
                  
                  {!isRunning && testResult && (
                    <Box>
                      {testResult.testResults ? (
                        // Display test case results
                        <Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography sx={{ 
                              color: testResult.testResults.passedTests === testResult.testResults.totalTests ? '#2e7d32' : '#d32f2f',
                              fontSize: '14px',
                              fontWeight: 600,
                              mb: 1
                            }}>
                              {testResult.testResults.passedTests === testResult.testResults.totalTests ? '✓' : '✗'} {testResult.testResults.passedTests}/{testResult.testResults.totalTests} Test Cases Passed
                            </Typography>
                            <Typography sx={{ color: '#666', fontSize: '13px' }}>
                              Score: {testResult.testResults.score}%
                            </Typography>
                          </Box>
                          
                          {testResult.testResults.results.map((result, index) => (
                            <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < testResult.testResults.results.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                              <Typography sx={{ 
                                color: result.passed ? '#2e7d32' : '#d32f2f',
                                fontSize: '13px',
                                fontWeight: 600,
                                mb: 1
                              }}>
                                {result.passed ? '✓' : '✗'} Test Case {result.testCase} - {result.passed ? 'Passed' : 'Failed'}
                              </Typography>
                              
                              <Box sx={{ mb: 1 }}>
                                <Typography sx={{ color: '#666', fontSize: '12px', mb: 0.5 }}>
                                  Input:
                                </Typography>
                                <Box sx={{ 
                                  bgcolor: '#f5f5f5', 
                                  p: 1.5, 
                                  borderRadius: 1,
                                  border: '1px solid #e0e0e0',
                                  fontFamily: 'monospace',
                                  fontSize: '12px',
                                  color: '#000',
                                  whiteSpace: 'pre-wrap'
                                }}>
                                  {result.input || '(empty)'}
                                </Box>
                              </Box>
                              
                              <Box sx={{ mb: 1 }}>
                                <Typography sx={{ color: '#666', fontSize: '12px', mb: 0.5 }}>
                                  Expected Output:
                                </Typography>
                                <Box sx={{ 
                                  bgcolor: '#f5f5f5', 
                                  p: 1.5, 
                                  borderRadius: 1,
                                  border: '1px solid #e0e0e0',
                                  fontFamily: 'monospace',
                                  fontSize: '12px',
                                  color: '#000',
                                  whiteSpace: 'pre-wrap'
                                }}>
                                  {result.expectedOutput}
                                </Box>
                              </Box>
                              
                              <Box sx={{ mb: 1 }}>
                                <Typography sx={{ color: '#666', fontSize: '12px', mb: 0.5 }}>
                                  Your Output:
                                </Typography>
                                <Box sx={{ 
                                  bgcolor: result.passed ? '#f1f8f4' : '#ffebee', 
                                  p: 1.5, 
                                  borderRadius: 1,
                                  border: result.passed ? '1px solid #2e7d32' : '1px solid #ef5350',
                                  fontFamily: 'monospace',
                                  fontSize: '12px',
                                  color: result.passed ? '#1b5e20' : '#c62828',
                                  whiteSpace: 'pre-wrap'
                                }}>
                                  {result.actualOutput || '(no output)'}
                                </Box>
                              </Box>
                              
                              {result.stderr && (
                                <Box>
                                  <Typography sx={{ color: '#d32f2f', fontSize: '12px', mb: 0.5 }}>
                                    Error:
                                  </Typography>
                                  <Box sx={{ 
                                    bgcolor: '#ffebee', 
                                    p: 1.5, 
                                    borderRadius: 1,
                                    border: '1px solid #ef5350',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    color: '#c62828',
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: '100px',
                                    overflow: 'auto'
                                  }}>
                                    {result.stderr}
                                  </Box>
                                </Box>
                              )}
                              
                              {result.compile_output && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography sx={{ color: '#d32f2f', fontSize: '12px', mb: 0.5 }}>
                                    Compilation Error:
                                  </Typography>
                                  <Box sx={{ 
                                    bgcolor: '#ffebee', 
                                    p: 1.5, 
                                    borderRadius: 1,
                                    border: '1px solid #ef5350',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    color: '#c62828',
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: '100px',
                                    overflow: 'auto'
                                  }}>
                                    {result.compile_output}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        // Display simple output for programs without test cases
                        <Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography sx={{ 
                              color: testResult.success ? '#2e7d32' : '#d32f2f',
                              fontSize: '13px',
                              fontWeight: 600,
                              mb: 1
                            }}>
                              Status: {testResult.status || (testResult.success ? 'Success' : 'Error')}
                            </Typography>
                          </Box>
                          
                          {testResult.stdout && (
                            <Box sx={{ mb: 2 }}>
                              <Typography sx={{ color: '#333', fontSize: '13px', fontWeight: 600, mb: 0.5 }}>
                                Output:
                              </Typography>
                              <Box sx={{ 
                                bgcolor: '#f5f5f5', 
                                p: 2, 
                                borderRadius: 1,
                                border: '1px solid #e0e0e0',
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                color: '#000',
                                whiteSpace: 'pre-wrap',
                                maxHeight: '200px',
                                overflow: 'auto'
                              }}>
                                {testResult.stdout}
                              </Box>
                            </Box>
                          )}
                          
                          {(testResult.error || testResult.stderr || testResult.compile_output) && (
                            <Box>
                              <Typography sx={{ color: '#d32f2f', fontSize: '13px', fontWeight: 600, mb: 0.5 }}>
                                Error:
                              </Typography>
                              <Box sx={{ 
                                bgcolor: '#ffebee', 
                                p: 2, 
                                borderRadius: 1,
                                border: '1px solid #ef5350',
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                color: '#c62828',
                                whiteSpace: 'pre-wrap',
                                maxHeight: '200px',
                                overflow: 'auto'
                              }}>
                                {testResult.error || testResult.stderr || testResult.compile_output}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
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
                startIcon={isRunning ? <CircularProgress size={16} /> : <RunIcon />}
                onClick={handleRun}
                disabled={isRunning}
                sx={{
                  color: '#000',
                  borderColor: '#d0d0d0',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#000',
                    bgcolor: 'rgba(0,0,0,0.05)'
                  },
                  '&:disabled': {
                    color: '#999',
                    borderColor: '#e0e0e0'
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

      {/* Logout Notification Dialog */}
      <Dialog
        open={logoutDialog}
        aria-labelledby="logout-dialog"
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle id="logout-dialog" sx={{ bgcolor: '#d32f2f', color: 'white' }}>
          Test Terminated
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ fontSize: '1.1rem', color: 'text.primary', mb: 2 }}>
            Your test has been automatically submitted and you have been logged out due to multiple tab switches.
          </DialogContentText>
          <DialogContentText sx={{ fontSize: '0.95rem', color: 'text.secondary' }}>
            Switching tabs or windows during the test is not allowed. Your submission has been recorded.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={async () => {
              try {
                await logout();
              } catch (err) {
                console.error('Logout error:', err);
              }
              navigate('/login');
            }} 
            variant="contained" 
            color="error"
            autoFocus
          >
            Okay
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tab Switch Warning Dialog */}
      <Dialog
        open={tabSwitchDialog}
        onClose={() => setTabSwitchDialog(false)}
        aria-labelledby="tab-switch-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="tab-switch-dialog" sx={{ bgcolor: '#d32f2f', color: 'white' }}>
          ⚠️ Tab Switch Detected!
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ fontSize: '1.1rem', color: 'text.primary', mb: 2 }}>
            You have switched away from the test window. This activity has been recorded.
          </DialogContentText>
          <DialogContentText sx={{ fontSize: '1rem', color: 'error.main', fontWeight: 700, mt: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
            ⚠️ CRITICAL WARNING: If you switch tabs or windows one more time, your test will be automatically submitted and you will be logged out.
          </DialogContentText>
          <DialogContentText sx={{ fontSize: '0.9rem', color: 'text.secondary', mt: 1 }}>
            Please remain on this page until you complete the test.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setTabSwitchDialog(false)} 
            variant="contained" 
            color="error"
            autoFocus
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>

      {/* Timer Warning Dialog */}
      <Dialog
        open={timeWarningDialog}
        onClose={() => setTimeWarningDialog(false)}
        aria-labelledby="timer-warning-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="timer-warning-dialog" sx={{ bgcolor: '#ff9800', color: 'white' }}>
          ⚠️ Time Running Out!
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ fontSize: '1.1rem', color: 'text.primary' }}>
            You have less than <strong>5 minutes</strong> remaining to complete your test.
            Please submit your solution soon to avoid automatic submission.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setTimeWarningDialog(false)} 
            variant="contained" 
            sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
            autoFocus
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          Confirm Submission
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            Are you sure you want to submit your code? Once submitted, you will not be able to make any changes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmSubmit} variant="contained" color="primary" autoFocus>
            Submit
          </Button>
        </DialogActions>
      </Dialog>    </Box>
  );
};

export default TestPage;
