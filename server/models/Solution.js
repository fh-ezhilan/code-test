const mongoose = require('mongoose');

const SolutionSchema = new mongoose.Schema({
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  // Test execution results
  testResults: {
    totalTests: Number,
    passedTests: Number,
    failedTests: Number,
    score: Number,
    results: [{
      testCase: Number,
      input: String,
      expectedOutput: String,
      actualOutput: String,
      passed: Boolean,
      status: String,
      time: String,
      memory: Number,
      stderr: String,
      compile_output: String
    }]
  },
  // AI Evaluation (Claude)
  aiEvaluation: {
    overallScore: Number,
    correctnessScore: Number,
    codeQualityScore: Number,
    codingStandardsScore: Number,
    efficiencyScore: Number,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    summary: String,
    aiModel: String,
    evaluatedAt: Date,
    rawResponse: String
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  tabSwitchCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('Solution', SolutionSchema);
