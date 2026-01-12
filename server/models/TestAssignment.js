const mongoose = require('mongoose');

const TestAssignmentSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  testSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSession',
    required: true,
  },
  testName: {
    type: String,
    required: true,
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
  },
  testType: {
    type: String,
    enum: ['Coding', 'MCQ', 'Explanation'],
    required: true,
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started',
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  score: {
    type: Number,
  },
  totalQuestions: {
    type: Number,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  testStartTime: {
    type: Date,
  },
  testDuration: {
    type: Number,
  },
});

module.exports = mongoose.model('TestAssignment', TestAssignmentSchema);
