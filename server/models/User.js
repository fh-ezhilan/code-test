const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'candidate'],
    default: 'candidate',
  },
  assignedProgram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    default: null,
  },
  assignedTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSession',
    default: null,
  },
  testStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started',
  },
  testStartTime: {
    type: Date,
    default: null,
  },
  testDuration: {
    type: Number, // Duration in minutes
    default: null,
  },
});

module.exports = mongoose.model('User', UserSchema);
