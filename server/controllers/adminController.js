const Program = require('../models/Program');
const MCQQuestion = require('../models/MCQQuestion');
const MCQAnswer = require('../models/MCQAnswer');
const TestSession = require('../models/TestSession');
const TestAssignment = require('../models/TestAssignment');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');

exports.uploadProgram = async (req, res) => {
  const { title, description, testCases } = req.body;
  try {
    const newProgram = new Program({
      title,
      description,
      testCases,
    });
    const program = await newProgram.save();
    res.json(program);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPrograms = async (req, res) => {
  try {
    const programs = await Program.find();
    res.json(programs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateProgram = async (req, res) => {
  const { title, description } = req.body;
  try {
    let program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }
    if (title !== undefined) program.title = title;
    if (description !== undefined) program.description = description;
    await program.save();
    res.json(program);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createTestSession = async (req, res) => {
  try {
    const { name, duration, testType = 'Coding' } = req.body;
    console.log('Received testType:', testType);
    console.log('Request body:', req.body);
    let programIds = [];
    let mcqQuestionIds = [];

    // If Excel/CSV file is uploaded, parse and create programs or MCQ questions
    if (req.file) {
      try {
        // Read the file - xlsx library supports both Excel and CSV
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        console.log('Parsed data from file:', JSON.stringify(data.slice(0, 2), null, 2));

        if (data.length === 0) {
          return res.status(400).json({ msg: 'File is empty or has no valid data' });
        }

        if (testType === 'Coding') {
          // Validate and create coding programs
          for (const row of data) {
            if (!row.Title || !row.Description) {
              console.log('Skipping row due to missing Title or Description:', row);
              continue; // Skip rows without required fields
            }

            // Handle TestCases - can be JSON string, plain text, or empty
            let testCases = [];
            if (row.TestCases) {
              try {
                // Try to parse as JSON first
                testCases = JSON.parse(row.TestCases);
              } catch (e) {
                // If not valid JSON, store as plain text in description
                console.log('TestCases is plain text, skipping:', row.TestCases);
              }
            }

            const newProgram = new Program({
              title: row.Title,
              description: row.Description,
              testCases: testCases,
            });
            const savedProgram = await newProgram.save();
            programIds.push(savedProgram._id);
            console.log('Created program:', savedProgram.title);
          }
          console.log(`Successfully created ${programIds.length} programs`);
        } else if (testType === 'MCQ') {
          // Validate and create MCQ questions
          for (const row of data) {
            if (!row.Question || !row.Option1 || !row.Option2 || !row.Option3 || !row.Option4 || !row.CorrectOption) {
              console.log('Skipping row due to missing required fields:', row);
              continue; // Skip rows without required fields
            }

            const correctOption = parseInt(row.CorrectOption);
            if (isNaN(correctOption) || correctOption < 1 || correctOption > 4) {
              console.log('Skipping row due to invalid CorrectOption:', row);
              continue;
            }

            const newMCQQuestion = new MCQQuestion({
              question: row.Question,
              options: [row.Option1, row.Option2, row.Option3, row.Option4],
              correctOption: correctOption,
            });
            const savedQuestion = await newMCQQuestion.save();
            mcqQuestionIds.push(savedQuestion._id);
            console.log('Created MCQ question:', savedQuestion.question);
          }
          console.log(`Successfully created ${mcqQuestionIds.length} MCQ questions`);
        }
      } catch (parseErr) {
        console.error('Error parsing file:', parseErr);
        const errorMsg = testType === 'Coding' 
          ? 'Invalid file format. Ensure columns are: Title, Description, TestCases'
          : 'Invalid file format. Ensure columns are: Question, Option1, Option2, Option3, Option4, CorrectOption';
        return res.status(400).json({ 
          msg: errorMsg,
          error: parseErr.message 
        });
      }
    }

    const newTestSession = new TestSession({
      name,
      testType,
      programs: programIds,
      mcqQuestions: mcqQuestionIds,
      duration,
      createdBy: req.user.id,
    });
    const testSession = await newTestSession.save();
    res.json(testSession);
  } catch (err) {
    console.error('Error in createTestSession:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

exports.updateTestSession = async (req, res) => {
  const { name, testType, duration, programs } = req.body;
  try {
    let testSession = await TestSession.findById(req.params.id);
    if (!testSession) {
      return res.status(404).json({ msg: 'Test session not found' });
    }
    if (name !== undefined) testSession.name = name;
    if (testType !== undefined) testSession.testType = testType;
    if (duration !== undefined) testSession.duration = duration;
    if (programs !== undefined) testSession.programs = programs;
    await testSession.save();
    res.json(testSession);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createCandidate = async (req, res) => {
  const { username, password, testSessionId } = req.body;
  try {
    if (!testSessionId) {
      return res.status(400).json({ msg: 'Test session is required' });
    }

    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Verify test session exists
    const testSession = await TestSession.findById(testSessionId);
    if (!testSession) {
      return res.status(400).json({ msg: 'Test session not found' });
    }

    user = new User({
      username,
      password,
      role: 'candidate',
      assignedTest: testSessionId,
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    // Create TestAssignment record
    await TestAssignment.create({
      candidate: user._id,
      testSession: testSessionId,
      testType: testSession.testType,
      status: 'not-started',
      isActive: true,
      assignedAt: new Date()
    });
    
    res.status(201).json({ msg: 'Candidate created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.bulkCreateCandidates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Read the file - xlsx library supports both Excel and CSV
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log('Parsed candidate data from file:', JSON.stringify(data.slice(0, 2), null, 2));

    if (data.length === 0) {
      return res.status(400).json({ msg: 'File is empty or has no valid data' });
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    // Get all test sessions for matching
    const testSessions = await TestSession.find();
    const testSessionMap = {};
    testSessions.forEach(session => {
      const key = `${(session.testType || 'Coding').toLowerCase()}_${session.name.toLowerCase()}`;
      testSessionMap[key] = session._id;
    });

    // Create candidates from Excel/CSV data
    for (const row of data) {
      // Check for new format (Username, Password, TestType, TestName)
      const username = row.Username || row.username;
      const password = row.Password || row.password;
      const testType = row.TestType || row.testType || 'Coding';
      const testName = row.TestName || row.testName || row.test;

      if (!username || !password) {
        console.log('Skipping row due to missing username or password:', row);
        errors.push(`Row with username ${username || 'N/A'} is missing required fields`);
        skipped++;
        continue;
      }

      if (!testName) {
        console.log('Skipping row due to missing test name:', row);
        errors.push(`User ${username}: Test name is required`);
        skipped++;
        continue;
      }

      // Find test session by type and name (case insensitive)
      const testKey = `${testType.toLowerCase()}_${testName.toLowerCase()}`;
      const testSessionId = testSessionMap[testKey];
      if (!testSessionId) {
        console.log('Skipping row due to test not found:', testType, testName);
        errors.push(`User ${username}: Test "${testName}" of type "${testType}" not found`);
        skipped++;
        continue;
      }

      try {
        // Check if user already exists
        let user = await User.findOne({ username: username });
        if (user) {
          console.log('User already exists:', username);
          errors.push(`User ${username} already exists`);
          skipped++;
          continue;
        }

        user = new User({
          username: username,
          password: password,
          role: 'candidate',
          assignedTest: testSessionId,
        });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        // Get the full test session to determine type
        const testSession = await TestSession.findById(testSessionId);
        
        // Create TestAssignment record
        const newAssignment = await TestAssignment.create({
          candidate: user._id,
          testSession: testSessionId,
          testType: testSession.testType,
          status: 'not-started',
          isActive: true,
          assignedAt: new Date()
        });
        
        created++;
        console.log('Created candidate and test assignment:', username);
      } catch (err) {
        console.error('Error creating candidate:', username, err.message);
        errors.push(`Failed to create ${username}: ${err.message}`);
        skipped++;
      }
    }

    console.log(`Successfully created ${created} candidates, skipped ${skipped}`);
    
    res.json({ 
      msg: `Created ${created} candidates, skipped ${skipped}`,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Error in bulkCreateCandidates:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: 'candidate' })
      .select('-password')
      .populate('assignedProgram', 'title')
      .populate('assignedTest', 'name testType');
    
    // Fetch all test assignments and calculate average score for each candidate
    const candidatesWithScores = await Promise.all(
      candidates.map(async (candidate) => {
        const candidateObj = candidate.toObject();
        
        // Get all completed test assignments with scores
        const completedAssignments = await TestAssignment.find({
          candidate: candidate._id,
          status: 'completed',
          score: { $exists: true }
        }).populate('program');
        
        // Also check for legacy MCQ answers (tests completed before TestAssignment system)
        const legacyMCQAnswers = await MCQAnswer.find({
          candidate: candidate._id
        });
        
        const Solution = require('../models/Solution');
        
        // Collect all scores (from TestAssignments and legacy MCQ answers)
        const allScores = [];
        
        // Add scores from TestAssignments
        for (const assignment of completedAssignments) {
          let percentage;
          
          // For Coding tests, use AI evaluation score if available
          if (assignment.testType === 'Coding' && assignment.program) {
            const solution = await Solution.findOne({
              candidate: candidate._id,
              program: assignment.program._id
            }).sort({ submittedAt: -1 });
            
            if (solution && solution.aiEvaluation && solution.aiEvaluation.overallScore !== undefined) {
              percentage = solution.aiEvaluation.overallScore;
            } else {
              // Fallback to test execution score
              percentage = (assignment.score / assignment.totalQuestions) * 100;
            }
          } else {
            // For MCQ tests, use regular score
            percentage = (assignment.score / assignment.totalQuestions) * 100;
          }
          
          allScores.push(percentage);
        }
        
        // Add scores from legacy MCQ answers that don't have TestAssignments
        for (const mcqAnswer of legacyMCQAnswers) {
          // Check if this MCQ answer already has a TestAssignment
          const hasAssignment = completedAssignments.some(
            a => a.testSession && a.testSession.toString() === mcqAnswer.testSession.toString()
          );
          
          if (!hasAssignment) {
            const percentage = (mcqAnswer.score / mcqAnswer.totalQuestions) * 100;
            allScores.push(percentage);
          }
        }
        
        // Calculate average score as percentage
        if (allScores.length > 0) {
          const totalPercentage = allScores.reduce((sum, percentage) => sum + percentage, 0);
          candidateObj.averageScore = Math.round(totalPercentage / allScores.length);
          candidateObj.completedTests = allScores.length;
        }
        
        return candidateObj;
      })
    );
    
    res.json(candidatesWithScores);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await TestSession.find().populate('programs').populate('mcqQuestions');
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteTestSession = async (req, res) => {
  try {
    const session = await TestSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ msg: 'Test session not found' });
    }
    await TestSession.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Test session deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    const { password } = req.body;
    console.log('Reset password request for candidate:', req.params.id);
    
    if (!password || password.trim().length === 0) {
      return res.status(400).json({ msg: 'Password is required' });
    }
    
    const candidate = await User.findById(req.params.id);
    
    if (!candidate) {
      console.log('Candidate not found:', req.params.id);
      return res.status(404).json({ msg: 'Candidate not found' });
    }
    
    if (candidate.role !== 'candidate') {
      console.log('Not a candidate:', candidate.role);
      return res.status(400).json({ msg: 'Can only update candidates' });
    }

    // Hash and update password only
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    candidate.password = await bcrypt.hash(password, salt);

    await candidate.save();
    console.log('Password reset successfully for candidate:', candidate.username);
    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err.message, err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await User.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ msg: 'Candidate not found' });
    }
    if (candidate.role !== 'candidate') {
      return res.status(400).json({ msg: 'Can only delete candidates' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Candidate deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getCandidateSolution = async (req, res) => {
  try {
    const Solution = require('../models/Solution');
    const solution = await Solution.findOne({ candidate: req.params.id })
      .populate('program', 'title')
      .sort({ submittedAt: -1 });
    if (!solution) {
      return res.status(404).json({ msg: 'No solution found for this candidate' });
    }
    res.json(solution);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Admin user management
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json(admins);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createAdmin = async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Admin already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      username,
      password: hashedPassword,
      role: 'admin',
    });
    await user.save();
    res.json({ _id: user._id, username: user.username, role: user.role });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.bulkCreateAdmins = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ msg: 'File is empty or has no valid data' });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (const row of data) {
      if (!row.username || !row.password) {
        results.skipped++;
        results.errors.push(`Skipping row due to missing username or password`);
        continue;
      }

      try {
        const existingUser = await User.findOne({ username: row.username });
        if (existingUser) {
          results.skipped++;
          results.errors.push(`Admin '${row.username}' already exists`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(row.password, 10);
        const newAdmin = new User({
          username: row.username,
          password: hashedPassword,
          role: 'admin',
        });
        await newAdmin.save();
        results.created++;
      } catch (err) {
        results.errors.push(`Error creating admin '${row.username}': ${err.message}`);
        results.skipped++;
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

exports.updateAdmin = async (req, res) => {
  const { username, password } = req.body;
  try {
    let admin = await User.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ msg: 'Admin not found' });
    }
    if (admin.role !== 'admin') {
      return res.status(400).json({ msg: 'Can only update admins' });
    }

    if (username !== undefined) {
      const existingUser = await User.findOne({ username, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ msg: 'Username already exists' });
      }
      admin.username = username;
    }
    
    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      admin.password = hashedPassword;
    }

    await admin.save();
    res.json({ _id: admin._id, username: admin.username, role: admin.role });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ msg: 'Admin not found' });
    }
    if (admin.role !== 'admin') {
      return res.status(400).json({ msg: 'Can only delete admins' });
    }
    
    // Prevent deleting the last admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ msg: 'Cannot delete the last admin' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Admin deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Test Assignment endpoints
exports.getCandidateTestHistory = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const Solution = require('../models/Solution');
    
    // Fetch existing test assignments
    const assignments = await TestAssignment.find({ candidate: candidateId })
      .populate('testSession', 'name testType duration')
      .populate('program', 'title')
      .sort('-assignedAt');
    
    // For Coding tests, fetch AI evaluation scores
    const assignmentsWithScores = await Promise.all(
      assignments.map(async (assignment) => {
        const assignmentObj = assignment.toObject();
        
        if (assignment.testType === 'Coding' && assignment.status === 'completed' && assignment.program) {
          const solution = await Solution.findOne({
            candidate: assignment.candidate,
            program: assignment.program._id
          }).sort({ submittedAt: -1 });
          
          if (solution && solution.aiEvaluation && solution.aiEvaluation.overallScore !== undefined) {
            assignmentObj.aiScore = solution.aiEvaluation.overallScore;
          }
        }
        
        return assignmentObj;
      })
    );
    
    // Check if candidate has an assigned test without a TestAssignment record (legacy data)
    const candidate = await User.findById(candidateId)
      .populate('assignedTest', 'name testType duration')
      .populate('assignedProgram', 'title');
    
    if (candidate && candidate.assignedTest) {
      // Check if there's already a TestAssignment for this test
      const existingAssignment = assignments.find(
        a => a.testSession && a.testSession._id.toString() === candidate.assignedTest._id.toString()
      );
      
      // If no TestAssignment exists, create one
      if (!existingAssignment) {
        const testSession = candidate.assignedTest;
        
        // Check if there's an MCQ score for this test
        let score, totalQuestions;
        if (candidate.testStatus === 'completed' && testSession.testType === 'MCQ') {
          const mcqAnswer = await MCQAnswer.findOne({
            candidate: candidateId,
            testSession: testSession._id
          }).sort('-submittedAt');
          
          if (mcqAnswer) {
            score = mcqAnswer.score;
            totalQuestions = mcqAnswer.totalQuestions;
          }
        }
        
        // Create TestAssignment record for legacy data
        const newAssignment = new TestAssignment({
          candidate: candidateId,
          testSession: testSession._id,
          program: candidate.assignedProgram?._id,
          testType: testSession.testType,
          status: candidate.testStatus,
          isActive: true,
          score,
          totalQuestions,
          assignedAt: new Date(),
          startedAt: candidate.testStartTime,
          completedAt: candidate.testStatus === 'completed' ? new Date() : null,
          testStartTime: candidate.testStartTime,
          testDuration: candidate.testDuration,
        });
        
        await newAssignment.save();
        
        // Add to assignments array
        const populatedAssignment = await TestAssignment.findById(newAssignment._id)
          .populate('testSession', 'name testType duration')
          .populate('program', 'title');
        
        assignments.unshift(populatedAssignment);
      }
    }
    
    res.json(assignmentsWithScores);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.assignTestToCandidate = async (req, res) => {
  try {
    const { candidateId, testSessionId, makeActive } = req.body;
    
    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'candidate') {
      return res.status(404).json({ msg: 'Candidate not found' });
    }
    
    const testSession = await TestSession.findById(testSessionId);
    if (!testSession) {
      return res.status(404).json({ msg: 'Test session not found' });
    }
    
    // If making this test active, deactivate all other tests for this candidate
    if (makeActive) {
      await TestAssignment.updateMany(
        { candidate: candidateId, isActive: true },
        { isActive: false }
      );
    }
    
    // Create new test assignment
    const assignment = new TestAssignment({
      candidate: candidateId,
      testSession: testSessionId,
      testType: testSession.testType,
      isActive: makeActive || false,
    });
    
    await assignment.save();
    
    // Update candidate's assignedTest if making active
    if (makeActive) {
      candidate.assignedTest = testSessionId;
      candidate.testStatus = 'not-started';
      candidate.testStartTime = null;
      candidate.testDuration = null;
      candidate.assignedProgram = null;
      await candidate.save();
    }
    
    const populatedAssignment = await TestAssignment.findById(assignment._id)
      .populate('testSession', 'name testType duration')
      .populate('program', 'title');
    
    res.json(populatedAssignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.setActiveTest = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await TestAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ msg: 'Test assignment not found' });
    }
    
    // Deactivate all other tests for this candidate
    await TestAssignment.updateMany(
      { candidate: assignment.candidate, isActive: true },
      { isActive: false }
    );
    
    // Activate this test
    assignment.isActive = true;
    
    // Only allow setting as active if not completed
    if (assignment.status === 'completed') {
      return res.status(400).json({ msg: 'Cannot activate a completed test' });
    }
    
    // Reset status to not-started when making active
    assignment.status = 'not-started';
    
    await assignment.save();
    
    // Update candidate's assignedTest and reset test state
    const candidate = await User.findById(assignment.candidate);
    candidate.assignedTest = assignment.testSession;
    candidate.testStatus = 'not-started';
    candidate.testStartTime = null;
    candidate.testDuration = null;
    candidate.assignedProgram = assignment.program || null;
    await candidate.save();
    
    const populatedAssignment = await TestAssignment.findById(assignment._id)
      .populate('testSession', 'name testType duration')
      .populate('program', 'title');
    
    res.json(populatedAssignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getTestAssignmentSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await TestAssignment.findById(assignmentId)
      .populate('testSession', 'name testType')
      .populate('program', 'title description')
      .populate('candidate', 'username');
    
    if (!assignment) {
      return res.status(404).json({ msg: 'Test assignment not found' });
    }
    
    if (assignment.status !== 'completed') {
      return res.status(400).json({ msg: 'Test not completed yet' });
    }
    
    const result = {
      testType: assignment.testType,
      testSession: assignment.testSession,
      candidate: assignment.candidate,
    };
    
    if (assignment.testType === 'Coding') {
      const Solution = require('../models/Solution');
      
      console.log('Assignment details:', {
        assignmentId: assignment._id,
        candidateId: assignment.candidate._id,
        programFromAssignment: assignment.program,
        testSessionId: assignment.testSession._id
      });
      
      // Find solution by candidate and test session
      const solution = await Solution.findOne({
        candidate: assignment.candidate._id,
        program: assignment.program?._id || assignment.program
      }).sort({ submittedAt: -1 }); // Get the most recent submission
      
      console.log('Looking for solution:', {
        candidate: assignment.candidate._id,
        program: assignment.program?._id || assignment.program,
        found: !!solution,
        solutionData: solution ? { 
          id: solution._id, 
          program: solution.program, 
          code: solution.code?.substring(0, 50),
          tabSwitchCount: solution.tabSwitchCount 
        } : null
      });
      
      result.solution = solution;
      result.program = assignment.program;
    } else if (assignment.testType === 'MCQ') {
      const mcqAnswer = await MCQAnswer.findOne({
        candidate: assignment.candidate._id,
        testSession: assignment.testSession._id
      });
      
      const testSession = await TestSession.findById(assignment.testSession._id)
        .populate('mcqQuestions');
      
      result.mcqAnswer = mcqAnswer;
      result.questions = testSession.mcqQuestions;
    }
    
    console.log('Returning submission result:', {
      testType: result.testType,
      hasTabSwitchCount: result.testType === 'Coding' ? 
        (result.solution?.tabSwitchCount !== undefined) : 
        (result.mcqAnswer?.tabSwitchCount !== undefined),
      tabSwitchCount: result.testType === 'Coding' ? 
        result.solution?.tabSwitchCount : 
        result.mcqAnswer?.tabSwitchCount
    });
    
    res.json(result);
  } catch (err) {
    console.error('Error in getTestAssignmentSubmission:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteTestAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await TestAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ msg: 'Test assignment not found' });
    }
    
    if (assignment.isActive) {
      await User.findByIdAndUpdate(assignment.candidate, {
        assignedTest: null,
        assignedProgram: null,
        testStatus: 'not-started'
      });
    }
    
    await TestAssignment.findByIdAndDelete(assignmentId);
    
    res.json({ msg: 'Test assignment deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.exportCandidatesData = async (req, res) => {
  try {
    const Solution = require('../models/Solution');
    
    // Get all candidates
    const candidates = await User.find({ role: 'candidate' })
      .select('-password')
      .sort('username');
    
    // First pass: collect all unique test names that have been actually taken
    const allTestNames = new Set();
    const candidateData = [];
    
    for (const candidate of candidates) {
      // Get all test assignments for this candidate
      const assignments = await TestAssignment.find({ 
        candidate: candidate._id,
        status: 'completed'
      }).populate('testSession');
      
      // Store scores for each test
      const testScores = {};
      const allScores = [];
      
      for (const assignment of assignments) {
        let score;
        
        if (assignment.testType === 'Coding') {
          // Get AI score if available
          if (assignment.program) {
            const solution = await Solution.findOne({
              candidate: candidate._id,
              program: assignment.program
            }).sort({ submittedAt: -1 });
            
            if (solution && solution.aiEvaluation && solution.aiEvaluation.overallScore !== undefined) {
              score = solution.aiEvaluation.overallScore;
            } else {
              score = 0; // No solution or evaluation
            }
          } else {
            score = 0;
          }
        } else {
          // MCQ test
          if (assignment.score !== undefined && assignment.totalQuestions) {
            score = Math.round((assignment.score / assignment.totalQuestions) * 100);
          } else {
            score = 0;
          }
        }
        
        const testName = assignment.testSession ? assignment.testSession.name : 'Unknown Test';
        allTestNames.add(testName);
        
        // Store score for this test (if same test taken multiple times, keep track of all scores)
        if (!testScores[testName]) {
          testScores[testName] = [];
        }
        testScores[testName].push(score);
        allScores.push(score);
      }
      
      // Calculate cumulative score (average)
      const cumulativeScore = allScores.length > 0
        ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
        : 0;
      
      candidateData.push({
        username: candidate.username,
        cumulativeScore,
        testScores
      });
    }
    
    // Convert set to sorted array
    const testNamesArray = Array.from(allTestNames).sort();
    
    // Second pass: build export data with only the tests that were taken
    const exportData = candidateData.map(data => {
      const row = {
        Username: data.username,
        'Cumulative Score': `${data.cumulativeScore}%`
      };
      
      // Add columns for each test that was actually taken
      testNamesArray.forEach(testName => {
        if (data.testScores[testName] && data.testScores[testName].length > 0) {
          // If test taken multiple times, show all scores separated by comma
          if (data.testScores[testName].length === 1) {
            row[testName] = `${data.testScores[testName][0]}%`;
          } else {
            row[testName] = data.testScores[testName].map(s => `${s}%`).join(', ');
          }
        } else {
          row[testName] = '-';
        }
      });
      
      return row;
    });
    
    // Create Excel file
    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Candidates');
    
    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=candidates_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error exporting candidates data:', err.message);
    res.status(500).send('Server Error');
  }
};
