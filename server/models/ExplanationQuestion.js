const mongoose = require('mongoose');

const ExplanationQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ExplanationQuestion', ExplanationQuestionSchema);
