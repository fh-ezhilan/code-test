const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/program', isAdmin, adminController.uploadProgram);
router.get('/programs', isAdmin, adminController.getPrograms);
router.put('/program/:id', isAdmin, adminController.updateProgram);
router.post('/session', isAdmin, upload.single('programsFile'), adminController.createTestSession);
router.put('/session/:id', isAdmin, adminController.updateTestSession);
router.delete('/session/:id', isAdmin, adminController.deleteTestSession);
router.post('/candidate', isAdmin, adminController.createCandidate);
router.post('/candidates/bulk', isAdmin, upload.single('candidatesFile'), adminController.bulkCreateCandidates);
router.get('/candidates', isAdmin, adminController.getCandidates);
router.put('/candidate/:id', isAdmin, adminController.updateCandidate);
router.delete('/candidate/:id', isAdmin, adminController.deleteCandidate);
router.get('/candidate/:id/solution', isAdmin, adminController.getCandidateSolution);
router.get('/sessions', isAdmin, adminController.getSessions);

// Admin user management routes
router.get('/admins', isAdmin, adminController.getAdmins);
router.post('/admin', isAdmin, adminController.createAdmin);
router.post('/admins/bulk', isAdmin, upload.single('adminsFile'), adminController.bulkCreateAdmins);
router.put('/admin/:id', isAdmin, adminController.updateAdmin);
router.delete('/admin/:id', isAdmin, adminController.deleteAdmin);

// Test assignment routes
router.get('/candidate/:candidateId/test-history', isAdmin, adminController.getCandidateTestHistory);
router.post('/test-assignment', isAdmin, adminController.assignTestToCandidate);
router.put('/test-assignment/:assignmentId/set-active', isAdmin, adminController.setActiveTest);
router.get('/test-assignment/:assignmentId/submission', isAdmin, adminController.getTestAssignmentSubmission);
router.delete('/test-assignment/:assignmentId', isAdmin, adminController.deleteTestAssignment);

// Export routes
router.get('/candidates/export', isAdmin, adminController.exportCandidatesData);

module.exports = router;
