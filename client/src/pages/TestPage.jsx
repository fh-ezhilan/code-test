import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
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
} from '@mui/material';

const TestPage = () => {
  const [program, setProgram] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const editorRef = useRef(null);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const res = await axios.get('/api/candidate/test/program', { withCredentials: true });
        setProgram(res.data);
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
        alert('Solution submitted successfully!');
        // Potentially redirect or show a summary page
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
    <Container maxWidth="xl" style={{ marginTop: '2rem' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper elevation={3} style={{ padding: '1rem', height: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              {program.title}
            </Typography>
            <Typography paragraph>{program.description}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <FormControl variant="outlined" size="small">
              <InputLabel>Language</InputLabel>
              <Select value={language} onChange={handleLanguageChange} label="Language">
                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem value="python">Python</MenuItem>
                <MenuItem value="java">Java</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Submit
            </Button>
          </Box>
          <Paper elevation={3}>
            <Editor
              height="calc(100vh - 150px)"
              language={language}
              value={code}
              onMount={handleEditorDidMount}
              theme="vs-dark"
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TestPage;
