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

// Explanation routes
router.get('/test/explanation/questions', isCandidate, candidateController.getExplanationQuestions);
router.post('/test/explanation/submit', isCandidate, candidateController.submitExplanationAnswers);

module.exports = router;
