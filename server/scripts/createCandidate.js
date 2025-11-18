const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const createCandidate = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Check if candidate already exists
    const existingCandidate = await User.findOne({ username: 'candidate1' });
    if (existingCandidate) {
      console.log('Candidate user already exists!');
      console.log('Username:', existingCandidate.username);
      process.exit(0);
    }

    // Create candidate user
    const username = 'candidate1';
    const password = 'test123';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const candidate = new User({
      username,
      password: hashedPassword,
      role: 'candidate',
    });

    await candidate.save();

    console.log('✅ Candidate user created successfully!');
    console.log('Username: candidate1');
    console.log('Password: test123');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

createCandidate();
