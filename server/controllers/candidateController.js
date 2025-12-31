const TestSession = require('../models/TestSession');
const Program = require('../models/Program');
const Solution = require('../models/Solution');
const MCQQuestion = require('../models/MCQQuestion');
const MCQAnswer = require('../models/MCQAnswer');
const TestAssignment = require('../models/TestAssignment');

exports.getTestInstructions = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user || !user.assignedTest) {
      return res.status(404).json({ msg: 'No test assigned to this candidate' });
    }
    
    const testSession = await TestSession.findById(user.assignedTest);
    if (!testSession) {
      return res.status(404).json({ msg: 'Assigned test session not found' });
    }
    
    res.json({
      name: testSession.name,
      duration: testSession.duration,
      testType: testSession.testType,
      instructions: testSession.testType === 'MCQ' 
        ? 'Read each question carefully and select the correct option. You can navigate between questions and change your answers before submitting.'
        : 'Read the problem carefully and write your solution. You can choose between Java, JavaScript, and Python.',
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
      return res.json({
        ...program.toObject(),
        testStartTime: user.testStartTime,
        testDuration: user.testDuration
      });
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
    
    res.json({
      ...program.toObject(),
      testStartTime: user.testStartTime,
      testDuration: user.testDuration
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.submitSolution = async (req, res) => {
  const { programId, code, language } = req.body;
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    const newSolution = new Solution({
      program: programId,
      candidate: req.user.id,
      code,
      language,
    });
    const solution = await newSolution.save();
    
    // Update user status to completed
    await User.findByIdAndUpdate(req.user.id, { testStatus: 'completed' });
    
    // Update or create test assignment
    if (user.assignedTest) {
      const existingAssignment = await TestAssignment.findOne({
        candidate: req.user.id,
        testSession: user.assignedTest,
        isActive: true
      });
      
      if (existingAssignment) {
        await TestAssignment.findByIdAndUpdate(existingAssignment._id, {
          status: 'completed',
          completedAt: new Date(),
        });
      } else {
        // Create TestAssignment if it doesn't exist (for legacy tests)
        await TestAssignment.create({
          candidate: req.user.id,
          testSession: user.assignedTest,
          program: programId,
          testType: 'Coding',
          status: 'completed',
          isActive: true,
          assignedAt: user.createdAt || new Date(),
          startedAt: user.testStartTime || new Date(),
          completedAt: new Date(),
          testStartTime: user.testStartTime,
          testDuration: user.testDuration,
        });
      }
    }
    
    res.json({ msg: 'Solution submitted successfully', solution });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.startTest = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user.assignedTest) {
      return res.status(400).json({ msg: 'No test assigned' });
    }
    
    // Get test duration
    const testSession = await TestSession.findById(user.assignedTest);
    if (!testSession) {
      return res.status(404).json({ msg: 'Test session not found' });
    }
    
    // Update user with test start time and duration
    await User.findByIdAndUpdate(req.user.id, { 
      testStatus: 'in-progress',
      testStartTime: new Date(),
      testDuration: testSession.duration
    });
    
    // Update test assignment status
    await TestAssignment.findOneAndUpdate(
      { candidate: req.user.id, testSession: user.assignedTest, isActive: true },
      { 
        status: 'in-progress',
        startedAt: new Date(),
        testStartTime: new Date(),
        testDuration: testSession.duration
      }
    );
    
    res.json({ 
      msg: 'Test started',
      startTime: new Date(),
      duration: testSession.duration
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.runCode = async (req, res) => {
  const { code, language, input } = req.body;
  
  try {
    const axios = require('axios');
    
    // Language ID mapping for Judge0
    const languageMap = {
      'javascript': 63,  // Node.js
      'python': 71,      // Python 3
      'java': 62         // Java
    };
    
    const languageId = languageMap[language];
    if (!languageId) {
      return res.status(400).json({ msg: 'Unsupported language' });
    }
    
    // Submit code to Judge0
    const submissionResponse = await axios.post(
      `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: input || '',
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = submissionResponse.data;
    
    res.json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      status: result.status?.description || 'Unknown',
      time: result.time,
      memory: result.memory
    });
    
  } catch (err) {
    console.error('Code execution error:', err.message);
    res.status(500).json({ 
      msg: 'Code execution failed',
      error: err.response?.data || err.message 
    });
  }
};

// MCQ Test endpoints
exports.getMCQQuestions = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user || !user.assignedTest) {
      return res.status(400).json({ msg: 'No test assigned to this candidate' });
    }
    
    const testSession = await TestSession.findById(user.assignedTest).populate('mcqQuestions');
    if (!testSession) {
      return res.status(404).json({ msg: 'Assigned test session not found' });
    }
    
    // Return questions without revealing correct answers
    const questions = testSession.mcqQuestions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      // Don't send correctOption to frontend
    }));
    
    res.json({
      testType: testSession.testType,
      questions,
      testStartTime: user.testStartTime,
      testDuration: user.testDuration || testSession.duration,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.submitMCQAnswers = async (req, res) => {
  const { answers } = req.body; // Array of { questionId, selectedOption }
  
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user || !user.assignedTest) {
      return res.status(400).json({ msg: 'No test assigned' });
    }
    
    const testSession = await TestSession.findById(user.assignedTest).populate('mcqQuestions');
    
    // Calculate score
    let score = 0;
    const totalQuestions = testSession.mcqQuestions.length;
    
    answers.forEach(answer => {
      const question = testSession.mcqQuestions.find(q => q._id.toString() === answer.questionId);
      if (question && question.correctOption === answer.selectedOption) {
        score++;
      }
    });
    
    // Save MCQ answers
    const mcqAnswer = new MCQAnswer({
      candidate: req.user.id,
      testSession: user.assignedTest,
      answers,
      score,
      totalQuestions,
    });
    await mcqAnswer.save();
    
    // Update user status to completed
    await User.findByIdAndUpdate(req.user.id, { testStatus: 'completed' });
    
    // Update or create test assignment
    const existingAssignment = await TestAssignment.findOne({
      candidate: req.user.id,
      testSession: user.assignedTest,
      isActive: true
    });
    
    if (existingAssignment) {
      await TestAssignment.findByIdAndUpdate(existingAssignment._id, {
        status: 'completed',
        completedAt: new Date(),
        score,
        totalQuestions,
      });
    } else {
      // Create TestAssignment if it doesn't exist (for legacy tests)
      await TestAssignment.create({
        candidate: req.user.id,
        testSession: user.assignedTest,
        testType: 'MCQ',
        status: 'completed',
        isActive: true,
        score,
        totalQuestions,
        assignedAt: user.createdAt || new Date(),
        startedAt: user.testStartTime || new Date(),
        completedAt: new Date(),
        testStartTime: user.testStartTime,
        testDuration: user.testDuration,
      });
    }
    
    res.json({ 
      msg: 'MCQ answers submitted successfully',
      score,
      totalQuestions,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
