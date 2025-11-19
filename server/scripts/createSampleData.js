const mongoose = require('mongoose');
require('dotenv').config();

const Program = require('../models/Program');
const TestSession = require('../models/TestSession');
const User = require('../models/User');

const createSampleData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Please create an admin user first!');
      process.exit(1);
    }

    // Create sample programs
    const program1 = new Program({
      title: 'Two Sum',
      description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`,
      testCases: [
        {
          input: '[2,7,11,15], 9',
          output: '[0,1]'
        },
        {
          input: '[3,2,4], 6',
          output: '[1,2]'
        }
      ]
    });

    const program2 = new Program({
      title: 'Reverse String',
      description: `Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.

Example:
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]`,
      testCases: [
        {
          input: '["h","e","l","l","o"]',
          output: '["o","l","l","e","h"]'
        },
        {
          input: '["H","a","n","n","a","h"]',
          output: '["h","a","n","n","a","H"]'
        }
      ]
    });

    const program3 = new Program({
      title: 'FizzBuzz',
      description: `Write a program that outputs the string representation of numbers from 1 to n.

But for multiples of three it should output "Fizz" instead of the number and for the multiples of five output "Buzz". For numbers which are multiples of both three and five output "FizzBuzz".

Example:
n = 15,
Return:
[
    "1",
    "2",
    "Fizz",
    "4",
    "Buzz",
    "Fizz",
    "7",
    "8",
    "Fizz",
    "Buzz",
    "11",
    "Fizz",
    "13",
    "14",
    "FizzBuzz"
]`,
      testCases: [
        {
          input: '15',
          output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]'
        }
      ]
    });

    await Program.deleteMany({});
    const savedProgram1 = await program1.save();
    const savedProgram2 = await program2.save();
    const savedProgram3 = await program3.save();

    console.log('✅ Sample programs created!');

    // Create test session
    await TestSession.deleteMany({});
    const testSession = new TestSession({
      name: 'Sample Full-stack Developer Hiring Test',
      programs: [savedProgram1._id, savedProgram2._id, savedProgram3._id],
      duration: 60,
      createdBy: admin._id
    });

    await testSession.save();

    console.log('✅ Test session created!');
    console.log('\nSample data setup complete:');
    console.log('- 3 programming problems');
    console.log('- 1 test session (60 minutes)');
    console.log('\nYou can now login as a candidate and take the test!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

createSampleData();
