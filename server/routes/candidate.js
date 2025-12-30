const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { isCandidate } = require('../middleware/authMiddleware');

router.get('/test/instructions', isCandidate, candidateController.getTestInstructions);
router.get('/test/program', isCandidate, candidateController.getTestProgram);
router.post('/test/start', isCandidate, candidateController.startTest);
router.post('/test/run', isCandidate, candidateController.runCode);
router.post('/test/submit', isCandidate, candidateController.submitSolution);

// MCQ routes
router.get('/test/mcq/questions', isCandidate, candidateController.getMCQQuestions);
router.post('/test/mcq/submit', isCandidate, candidateController.submitMCQAnswers);

module.exports = router;
