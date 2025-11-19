const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

router.post('/program', isAdmin, adminController.uploadProgram);
router.post('/session', isAdmin, adminController.createTestSession);
router.put('/session/:id', isAdmin, adminController.updateTestSession);
router.post('/candidate', isAdmin, adminController.createCandidate);
router.get('/candidates', isAdmin, adminController.getCandidates);
router.delete('/candidate/:id', isAdmin, adminController.deleteCandidate);
router.get('/sessions', isAdmin, adminController.getSessions);

module.exports = router;
