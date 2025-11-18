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
    const testSession = await TestSession.findOne().sort({ _id: -1 });
    if (!testSession) {
      return res.status(404).json({ msg: 'No active test session found' });
    }
    const programs = testSession.programs;
    const randomProgram = programs[Math.floor(Math.random() * programs.length)];
    const program = await Program.findById(randomProgram);
    res.json(program);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.submitSolution = async (req, res) => {
  const { programId, code, language } = req.body;
  try {
    const newSolution = new Solution({
      program: programId,
      candidate: req.user.id,
      code,
      language,
    });
    const solution = await newSolution.save();
    res.json({ msg: 'Solution submitted successfully', solution });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
