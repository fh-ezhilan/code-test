const TestSession = require('../models/TestSession');
const Program = require('../models/Program');
const Solution = require('../models/Solution');

exports.getTestInstructions = async (req, res) => {
  try {
    // Assuming there is an active test session for the candidate
    // This logic needs to be more sophisticated based on your application flow
    const testSession = await TestSession.findOne().sort({ _id: -1 });
    if (!testSession) {
      return res.status(404).json({ msg: 'No active test session found' });
    }
    res.json({
      name: testSession.name,
      duration: testSession.duration,
      instructions: 'Read the problem carefully and write your solution. You can choose between Java, JavaScript, and Python.',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getTestProgram = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    // If user already has an assigned program, return it
    if (user.assignedProgram) {
      const program = await Program.findById(user.assignedProgram);
      return res.json(program);
    }
    
    // Check if user has an assigned test
    if (!user.assignedTest) {
      return res.status(400).json({ msg: 'No test assigned to this candidate' });
    }
    
    // Get the test session assigned to this candidate
    const testSession = await TestSession.findById(user.assignedTest);
    if (!testSession) {
      return res.status(404).json({ msg: 'Assigned test session not found' });
    }
    
    // Check if test has programs
    if (!testSession.programs || testSession.programs.length === 0) {
      return res.status(404).json({ msg: 'No programs available in the assigned test' });
    }
    
    // Pick a random program from the assigned test
    const programs = testSession.programs;
    const randomProgram = programs[Math.floor(Math.random() * programs.length)];
    const program = await Program.findById(randomProgram);
    
    // Save the assigned program to the user
    user.assignedProgram = randomProgram;
    await user.save();
    
    res.json(program);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.submitSolution = async (req, res) => {
  const { programId, code, language } = req.body;
  try {
    const User = require('../models/User');
    const newSolution = new Solution({
      program: programId,
      candidate: req.user.id,
      code,
      language,
    });
    const solution = await newSolution.save();
    
    // Update user status to completed
    await User.findByIdAndUpdate(req.user.id, { testStatus: 'completed' });
    
    res.json({ msg: 'Solution submitted successfully', solution });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.startTest = async (req, res) => {
  try {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { testStatus: 'in-progress' });
    res.json({ msg: 'Test started' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
