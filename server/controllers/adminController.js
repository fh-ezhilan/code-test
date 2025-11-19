const Program = require('../models/Program');
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
    const { name, duration } = req.body;
    let programIds = [];

    // If Excel/CSV file is uploaded, parse and create programs
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

        // Create programs from Excel/CSV data
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
              // Don't create test case objects from plain text
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
      } catch (parseErr) {
        console.error('Error parsing file:', parseErr);
        return res.status(400).json({ 
          msg: 'Invalid file format. Ensure columns are: Title, Description, TestCases',
          error: parseErr.message 
        });
      }
    }

    const newTestSession = new TestSession({
      name,
      programs: programIds,
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
  const { name, duration, programs } = req.body;
  try {
    let testSession = await TestSession.findById(req.params.id);
    if (!testSession) {
      return res.status(404).json({ msg: 'Test session not found' });
    }
    if (name !== undefined) testSession.name = name;
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
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    user = new User({
      username,
      password,
      role: 'candidate',
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

exports.getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: 'candidate' })
      .select('-password')
      .populate('assignedProgram', 'title');
    res.json(candidates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await TestSession.find().populate('programs');
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
