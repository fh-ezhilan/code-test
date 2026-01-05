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
      return res.status(404).json({ msg: 'No test is assigned to you' });
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
      return res.status(400).json({ msg: 'No test is assigned to you' });
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
  const { programId, code, language, tabSwitchCount = 0 } = req.body;
  console.log('[Submit Solution] Received tabSwitchCount:', tabSwitchCount);
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
    
    // Create initial solution record without evaluation
    const newSolution = new Solution({
      program: programId,
      candidate: req.user.id,
      code,
      language,
      testResults: null,
      aiEvaluation: null,
      tabSwitchCount,
    });
    const solution = await newSolution.save();
    console.log('[Submit Solution] Saved solution with tabSwitchCount:', solution.tabSwitchCount);
    
    // Update user status to completed immediately
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
          program: programId,
          score: 0, // Will be updated after evaluation
          totalQuestions: program.testCases?.length || 0
        }, { new: true });
      } else {
        await TestAssignment.create({
          candidate: req.user.id,
          testSession: user.assignedTest,
          program: programId,
          testType: 'Coding',
          status: 'completed',
          isActive: true,
          score: 0,
          totalQuestions: program.testCases?.length || 0,
          assignedAt: new Date(),
          startedAt: user.testStartTime || new Date(),
          completedAt: new Date(),
          testStartTime: user.testStartTime,
          testDuration: user.testDuration,
        });
      }
    }
    
    // Send immediate response
    res.json({ 
      msg: 'Solution submitted successfully. Evaluation in progress.', 
      solution,
      testResults: null
    });
    
    // Process test execution and AI evaluation in background
    (async () => {
      let testResults = null;
      let score = 0;
      let executionFailed = false;
      
      // Run code against test cases
      if (program.testCases && program.testCases.length > 0) {
        try {
          console.log(`[Background] Running tests for solution ${solution._id}...`);
          testResults = await judge0Service.runTestCases(code, language, program.testCases);
          score = testResults.score;
          console.log(`[Background] Test execution completed. Score: ${score}`);
        } catch (err) {
          console.error('[Background] Test execution failed:', err);
          executionFailed = true;
          testResults = {
            score: 0,
            passed: 0,
            failed: program.testCases.length,
            error: err.message
          };
        }
      }

      // Get AI evaluation from Gemini
      let aiEvaluation = null;
      if (testResults && !executionFailed) {
        try {
          console.log(`[Background] Starting Gemini AI evaluation for solution ${solution._id}...`);
          const geminiResult = await geminiService.evaluateCode(code, language, program, testResults);
          aiEvaluation = {
            ...geminiResult.evaluation,
            aiModel: geminiResult.aiModel,
            evaluatedAt: geminiResult.evaluatedAt,
            rawResponse: geminiResult.rawResponse
          };
          score = aiEvaluation.overallScore || score;
          console.log(`[Background] Gemini evaluation completed. Overall score: ${score}`);
        } catch (err) {
          console.error('[Background] Gemini evaluation failed:', err);
        }
      }
      
      // Update solution with results
      await Solution.findByIdAndUpdate(solution._id, {
        testResults,
        aiEvaluation
      });
      
      // Update test assignment with final score
      if (user.assignedTest) {
        const assignment = await TestAssignment.findOne({
          candidate: user._id,
          testSession: user.assignedTest,
          isActive: true
        });
        
        if (assignment) {
          await TestAssignment.findByIdAndUpdate(assignment._id, { score });
          console.log(`[Background] Updated assignment ${assignment._id} with score: ${score}`);
        }
      }
      
      console.log(`[Background] Solution ${solution._id} fully processed.`);
    })().catch(err => {
      console.error('[Background] Error processing solution:', err);
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
      return res.status(400).json({ msg: 'No test is assigned to you' });
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
  const { answers, tabSwitchCount = 0 } = req.body; // Array of { questionId, selectedOption }
  
  console.log('[Submit MCQ Answers] Received data:', {
    answersCount: answers?.length,
    answers: answers,
    tabSwitchCount
  });
  
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
    
    console.log('[Submit MCQ Answers] Calculated score:', {
      score,
      totalQuestions,
      answersReceived: answers.length
    });
    
    // Delete any existing MCQAnswer for this candidate and test session
    // This prevents duplicate submissions
    await MCQAnswer.deleteMany({
      candidate: req.user.id,
      testSession: user.assignedTest
    });
    
    // Save MCQ answers
    const mcqAnswer = new MCQAnswer({
      candidate: req.user.id,
      testSession: user.assignedTest,
      answers,
      score,
      totalQuestions,
      tabSwitchCount,
    });
    await mcqAnswer.save();
    
    console.log('[Submit MCQ Answers] Saved MCQAnswer:', {
      id: mcqAnswer._id,
      answersCount: mcqAnswer.answers?.length,
      score: mcqAnswer.score,
      tabSwitchCount: mcqAnswer.tabSwitchCount
    });
    
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
