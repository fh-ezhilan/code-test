const mongoose = require('mongoose');

const TestSessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  testType: {
    type: String,
    enum: ['Coding', 'MCQ'],
    default: 'Coding',
  },
  programs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
  ],
  mcqQuestions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MCQQuestion',
    },
  ],
  duration: {
    type: Number, // in minutes
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

module.exports = mongoose.model('TestSession', TestSessionSchema);
