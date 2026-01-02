const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Evaluate code using Gemini API
 * @param {string} code - The submitted code
 * @param {string} language - Programming language
 * @param {object} program - Program details with test cases
 * @param {object} testResults - Results from Piston execution
 * @returns {Promise<object>} - AI evaluation results
 */
async function evaluateCode(code, language, program, testResults) {
  try {
    const prompt = `You are an expert code reviewer evaluating a coding test submission. 

**Problem:**
${program.title}
${program.description}

**Test Cases:**
${program.testCases.map((tc, i) => `Test ${i + 1}: Input: ${tc.input}, Expected Output: ${tc.output}`).join('\n')}

**Submitted Code (${language}):**
\`\`\`${language}
${code}
\`\`\`

**Test Execution Results:**
- Total Tests: ${testResults.totalTests}
- Passed: ${testResults.passedTests}
- Failed: ${testResults.failedTests}
- Score: ${testResults.score}%

${testResults.results.map((r, i) => `
Test ${i + 1}: ${r.passed ? '✓ PASSED' : '✗ FAILED'}
  Input: ${r.input}
  Expected: ${r.expectedOutput}
  Got: ${r.actualOutput}
  ${r.stderr ? `Error: ${r.stderr}` : ''}
`).join('\n')}

**Evaluation Criteria:**
Please evaluate this code on a scale of 0-100 and provide detailed feedback on:

1. **Correctness (40%)**: Does the code produce the correct output for all test cases?
2. **Code Quality (30%)**: Is the code clean, readable, well-structured, and maintainable?
3. **Coding Standards (20%)**: Does it follow language best practices, naming conventions, and proper formatting?
4. **Efficiency (10%)**: Is the solution optimal in terms of time and space complexity?

**Response Format (JSON):**
{
  "overallScore": <number 0-100>,
  "correctnessScore": <number 0-100>,
  "codeQualityScore": <number 0-100>,
  "codingStandardsScore": <number 0-100>,
  "efficiencyScore": <number 0-100>,
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", ...],
  "summary": "<2-3 sentence overall evaluation>"
}

Provide your evaluation in valid JSON format only.`;

    console.log('Sending code to Gemini for evaluation...');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('Gemini response received:', responseText.substring(0, 200));

    // Parse JSON response
    let evaluation;
    try {
      // Extract JSON if wrapped in markdown code blocks
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/```\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);
      
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      evaluation = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini response:', parseErr);
      // Fallback evaluation based on test results
      evaluation = {
        overallScore: testResults.score,
        correctnessScore: testResults.score,
        codeQualityScore: 70,
        codingStandardsScore: 70,
        efficiencyScore: 70,
        strengths: ['Code executes successfully'],
        weaknesses: ['AI evaluation parsing failed'],
        suggestions: ['Review code manually'],
        summary: `Code achieved ${testResults.score}% test pass rate. Manual review recommended.`
      };
    }

    return {
      evaluation,
      aiModel: 'gemini-2.5-flash',
      evaluatedAt: new Date(),
      rawResponse: responseText
    };
  } catch (err) {
    console.error('Gemini evaluation error:', err);
    
    // Return fallback evaluation on error
    return {
      evaluation: {
        overallScore: testResults.score,
        correctnessScore: testResults.score,
        codeQualityScore: null,
        codingStandardsScore: null,
        efficiencyScore: null,
        strengths: [],
        weaknesses: ['AI evaluation unavailable'],
        suggestions: [],
        summary: `Test execution score: ${testResults.score}%. AI evaluation failed: ${err.message}`
      },
      aiModel: 'gemini-2.5-flash',
      evaluatedAt: new Date(),
      error: err.message
    };
  }
}

module.exports = {
  evaluateCode
};
