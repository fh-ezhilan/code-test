const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { isCandidate } = require('../middleware/authMiddleware');

router.get('/test/instructions', isCandidate, candidateController.getTestInstructions);
router.get('/test/program', isCandidate, candidateController.getTestProgram);
router.post('/test/start', isCandidate, candidateController.startTest);
router.post('/test/submit', isCandidate, candidateController.submitSolution);

module.exports = router;
