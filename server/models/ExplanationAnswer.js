const mongoose = require('mongoose');

const ExplanationAnswerSchema = new mongoose.Schema({
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
  answers: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExplanationQuestion',
        required: true,
      },
      answer: {
        type: String,
        default: '',
      },
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  tabSwitchCount: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number,
    default: null,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('ExplanationAnswer', ExplanationAnswerSchema);
