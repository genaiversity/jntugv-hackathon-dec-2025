const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agents');
const { protect, admin } = require('../middleware/auth');

// Public agent routes
router.get('/search', agentController.searchEvents);

// Protected agent routes
router.post('/duplicates', protect, agentController.checkDuplicates);
router.post('/moderate', protect, agentController.moderateEvent);
router.get('/recommendations', protect, agentController.getRecommendations);

// Admin agent routes
router.post('/approve/:eventId', protect, admin, agentController.approveEvent);

module.exports = router;