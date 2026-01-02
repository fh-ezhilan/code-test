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
    const Program = require('../models/Program');
    const judge0Service = require('../services/judge0Service');
    const geminiService = require('../services/geminiService');
    
    const user = await User.findById(req.user.id);
    
    // Fetch program with test cases
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }
    
    // Run code against test cases
    let testResults = null;
    let score = 0;
    
    if (program.testCases && program.testCases.length > 0) {
      try {
        testResults = await judge0Service.runTestCases(code, language, program.testCases);
        score = testResults.score;
      } catch (err) {
        console.error('Test execution failed:', err);
        return res.status(500).json({ 
          msg: 'Failed to execute code',
          error: err.message 
        });
      }
    }

    // Get AI evaluation from Gemini
    let aiEvaluation = null;
    if (testResults) {
      try {
        console.log('Starting Gemini AI evaluation...');
        const geminiResult = await geminiService.evaluateCode(code, language, program, testResults);
        aiEvaluation = {
          ...geminiResult.evaluation,
          aiModel: geminiResult.aiModel,
          evaluatedAt: geminiResult.evaluatedAt,
          rawResponse: geminiResult.rawResponse
        };
        // Use Gemini's overall score if available, otherwise use test score
        score = aiEvaluation.overallScore || score;
        console.log('Gemini evaluation completed. Overall score:', score);
      } catch (err) {
        console.error('Gemini evaluation failed:', err);
        // Continue without AI evaluation
      }
    }
    
    const newSolution = new Solution({
      program: programId,
      candidate: req.user.id,
      code,
      language,
      testResults,
      aiEvaluation
    });
    const solution = await newSolution.save();
    
    // Update user status to completed
    await User.findByIdAndUpdate(req.user.id, { testStatus: 'completed' });
    
    // Update or create test assignment with score
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
          program: programId, // Ensure program is set
          score: score,
          totalQuestions: program.testCases?.length || 0
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
          score: score,
          totalQuestions: program.testCases?.length || 0,
          assignedAt: user.createdAt || new Date(),
          startedAt: user.testStartTime || new Date(),
          completedAt: new Date(),
          testStartTime: user.testStartTime,
          testDuration: user.testDuration,
        });
      }
    }
    
    res.json({ 
      msg: 'Solution submitted successfully', 
      solution,
      testResults
    });
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
  const { code, language, programId } = req.body;
  
  try {
    const User = require('../models/User');
    const Program = require('../models/Program');
    const judge0Service = require('../services/judge0Service');
    
    const user = await User.findById(req.user.id);
    
    // Get program ID from user's assigned test if not provided
    const progId = programId || user.assignedProgram;
    
    if (!progId) {
      return res.status(400).json({ msg: 'No program assigned' });
    }
    
    // Fetch program with test cases
    const program = await Program.findById(progId);
    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }
    
    // Run code against test cases
    if (program.testCases && program.testCases.length > 0) {
      try {
        const testResults = await judge0Service.runTestCases(code, language, program.testCases);
        return res.json({
          success: true,
          testResults
        });
      } catch (err) {
        console.error('Test execution failed:', err);
        return res.status(500).json({ 
          success: false,
          error: err.message 
        });
      }
    } else {
      // No test cases, just compile/run the code once
      try {
        const result = await judge0Service.executeCode(code, language, '');
        return res.json({
          success: true,
          stdout: result.stdout,
          stderr: result.stderr,
          compile_output: result.compile_output,
          status: result.status
        });
      } catch (err) {
        console.error('Code execution failed:', err);
        return res.status(500).json({ 
          success: false,
          error: err.message 
        });
      }
    }
    
  } catch (err) {
    console.error('Code execution error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
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
