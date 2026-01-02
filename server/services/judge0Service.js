const axios = require('axios');

// Using Piston API - free code execution service
const PISTON_URL = 'https://emkc.org/api/v2/piston';

// Language mappings for Piston
const LANGUAGE_MAP = {
  javascript: { language: 'javascript', version: '18.15.0' },
  python: { language: 'python', version: '3.10.0' },
  java: { language: 'java', version: '15.0.2' }
};

// Helper function to add delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Submit code to Piston for execution
 * @param {string} code - Source code
 * @param {string} language - Programming language (javascript, python, java)
 * @param {string} stdin - Standard input
 * @returns {Promise<object>} - Execution result
 */
async function executeCode(code, language, stdin = '') {
  try {
    const langConfig = LANGUAGE_MAP[language.toLowerCase()];
    
    if (!langConfig) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const url = `${PISTON_URL}/execute`;
    console.log('Making request to:', url);

    const response = await axios.post(url, {
      language: langConfig.language,
      version: langConfig.version,
      files: [{
        content: code
      }],
      stdin: stdin,
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Execution response:', response.data);

    return {
      stdout: response.data.run?.stdout || '',
      stderr: response.data.run?.stderr || '',
      compile_output: response.data.compile?.output || '',
      status: response.data.run?.code === 0 ? 'Accepted' : 'Runtime Error',
      time: null,
      memory: null
    };
  } catch (err) {
    console.error('Piston execution error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Failed to execute code');
  }
}

/**
 * Run code against test cases
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @param {Array} testCases - Array of {input, output}
 * @returns {Promise<object>} - Test results
 */
async function runTestCases(code, language, testCases) {
  try {
    const results = [];
    let passedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
      // Add delay between requests to avoid rate limiting (250ms between requests)
      if (i > 0) {
        await delay(250);
      }

      const testCase = testCases[i];
      const result = await executeCode(code, language, testCase.input);

      const actualOutput = (result.stdout || '').trim();
      const expectedOutput = testCase.output.trim();
      const passed = actualOutput === expectedOutput;

      if (passed) passedCount++;

      results.push({
        testCase: i + 1,
        input: testCase.input,
        expectedOutput,
        actualOutput,
        passed,
        status: result.status,
        time: result.time,
        memory: result.memory,
        stderr: result.stderr,
        compile_output: result.compile_output
      });
    }

    return {
      totalTests: testCases.length,
      passedTests: passedCount,
      failedTests: testCases.length - passedCount,
      score: Math.round((passedCount / testCases.length) * 100),
      results
    };
  } catch (err) {
    console.error('Test execution error:', err);
    throw err;
  }
}

/**
 * Check if Piston API is available
 */
async function checkJudge0Status() {
  try {
    const response = await axios.get(`${PISTON_URL}/runtimes`);
    return response.status === 200;
  } catch (err) {
    console.error('Piston API not available:', err.message);
    return false;
  }
}

module.exports = {
  executeCode,
  runTestCases,
  checkJudge0Status,
  LANGUAGE_MAP
};
