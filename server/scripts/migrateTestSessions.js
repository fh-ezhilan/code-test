const mongoose = require('mongoose');
require('dotenv').config();

const TestSession = require('../models/TestSession');

const migrateTestSessions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Update all test sessions without testType to have 'Coding' as default
    const result = await TestSession.updateMany(
      { testType: { $exists: false } },
      { $set: { testType: 'Coding' } }
    );

    console.log(`✅ Migration complete!`);
    console.log(`Updated ${result.modifiedCount} test session(s)`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

migrateTestSessions();
