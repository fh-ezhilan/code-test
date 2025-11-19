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
});

module.exports = mongoose.model('User', UserSchema);
