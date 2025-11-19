const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

router.post('/program', isAdmin, adminController.uploadProgram);
router.get('/programs', isAdmin, adminController.getPrograms);
router.put('/program/:id', isAdmin, adminController.updateProgram);
router.post('/session', isAdmin, adminController.createTestSession);
router.put('/session/:id', isAdmin, adminController.updateTestSession);
router.delete('/session/:id', isAdmin, adminController.deleteTestSession);
router.post('/candidate', isAdmin, adminController.createCandidate);
router.get('/candidates', isAdmin, adminController.getCandidates);
router.delete('/candidate/:id', isAdmin, adminController.deleteCandidate);
router.get('/candidate/:id/solution', isAdmin, adminController.getCandidateSolution);
router.get('/sessions', isAdmin, adminController.getSessions);

module.exports = router;
