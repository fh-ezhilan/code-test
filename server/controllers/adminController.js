const Program = require('../models/Program');
const TestSession = require('../models/TestSession');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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

exports.createTestSession = async (req, res) => {
  const { name, programs, duration } = req.body;
  try {
    const newTestSession = new TestSession({
      name,
      programs,
      duration,
      createdBy: req.user.id,
    });
    const testSession = await newTestSession.save();
    res.json(testSession);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateTestSession = async (req, res) => {
  const { duration } = req.body;
  try {
    let testSession = await TestSession.findById(req.params.id);
    if (!testSession) {
      return res.status(404).json({ msg: 'Test session not found' });
    }
    testSession.duration = duration;
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
