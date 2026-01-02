const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const TestAssignment = require('../models/TestAssignment');
const Solution = require('../models/Solution');
const User = require('../models/User');

const fixTestAssignments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
    
    // Find all completed Coding test assignments without a program
    const assignmentsWithoutProgram = await TestAssignment.find({
      testType: 'Coding',
      status: 'completed',
      program: { $exists: false }
    });
    
    console.log(`Found ${assignmentsWithoutProgram.length} assignments without program field`);
    
    for (const assignment of assignmentsWithoutProgram) {
      // Find the solution for this assignment
      const solution = await Solution.findOne({
        candidate: assignment.candidate
      }).sort({ submittedAt: -1 });
      
      if (solution && solution.program) {
        // Update the assignment with the program from the solution
        await TestAssignment.findByIdAndUpdate(assignment._id, {
          program: solution.program
        });
        console.log(`Fixed assignment ${assignment._id} with program ${solution.program}`);
      } else {
        // Try to get program from user's assignedProgram
        const user = await User.findById(assignment.candidate);
        if (user && user.assignedProgram) {
          await TestAssignment.findByIdAndUpdate(assignment._id, {
            program: user.assignedProgram
          });
          console.log(`Fixed assignment ${assignment._id} with user's assignedProgram ${user.assignedProgram}`);
        } else {
          console.log(`Could not fix assignment ${assignment._id} - no program found`);
        }
      }
    }
    
    console.log('Migration completed');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

fixTestAssignments();
