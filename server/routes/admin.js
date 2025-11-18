const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

router.post('/program', isAdmin, adminController.uploadProgram);
router.post('/session', isAdmin, adminController.createTestSession);
router.put('/session/:id', isAdmin, adminController.updateTestSession);
router.post('/candidate', isAdmin, adminController.createCandidate);

module.exports = router;
