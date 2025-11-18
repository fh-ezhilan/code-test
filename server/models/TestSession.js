const mongoose = require('mongoose');

const TestSessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  programs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
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
