const mongoose = require('mongoose');

const MCQQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      type: String,
      required: true,
    },
  ],
  correctOption: {
    type: Number, // Index of correct option (1-4)
    required: true,
    min: 1,
    max: 4,
  },
});

module.exports = mongoose.model('MCQQuestion', MCQQuestionSchema);
