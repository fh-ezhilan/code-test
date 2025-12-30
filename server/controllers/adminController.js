const Program = require('../models/Program');
const MCQQuestion = require('../models/MCQQuestion');
const MCQAnswer = require('../models/MCQAnswer');
const TestSession = require('../models/TestSession');
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
        created++;
        console.log('Created candidate:', username);
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
    
    // Fetch MCQ answers for each candidate
    const candidatesWithScores = await Promise.all(
      candidates.map(async (candidate) => {
        const candidateObj = candidate.toObject();
        
        // If the candidate completed an MCQ test, fetch their score
        if (candidate.testStatus === 'completed' && candidate.assignedTest?.testType === 'MCQ') {
          const mcqAnswer = await MCQAnswer.findOne({ candidate: candidate._id });
          if (mcqAnswer) {
            candidateObj.mcqScore = mcqAnswer.score;
            candidateObj.mcqTotalQuestions = mcqAnswer.totalQuestions;
          }
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
    const { testSessionId } = req.body;
    console.log('Update candidate request:', { candidateId: req.params.id, testSessionId });
    
    const candidate = await User.findById(req.params.id);
    
    if (!candidate) {
      console.log('Candidate not found:', req.params.id);
      return res.status(404).json({ msg: 'Candidate not found' });
    }
    
    if (candidate.role !== 'candidate') {
      console.log('Not a candidate:', candidate.role);
      return res.status(400).json({ msg: 'Can only update candidates' });
    }

    // Verify test session exists
    if (testSessionId) {
      const testSession = await TestSession.findById(testSessionId);
      if (!testSession) {
        console.log('Test session not found:', testSessionId);
        return res.status(400).json({ msg: 'Test session not found' });
      }
      candidate.assignedTest = testSessionId;
      // Reset assigned program and test timing since test changed
      candidate.assignedProgram = null;
      candidate.testStatus = 'not-started';
      candidate.testStartTime = null;
      candidate.testDuration = null;
    }

    await candidate.save();
    console.log('Candidate updated successfully:', candidate.username);
    res.json({ msg: 'Candidate updated successfully' });
  } catch (err) {
    console.error('Error updating candidate:', err.message, err);
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
