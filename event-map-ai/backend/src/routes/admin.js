const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const { protect, admin } = require('../middleware/auth');

// Admin-only routes
router.get('/pending-events', protect, admin, adminController.getPendingEvents);
router.post('/review-event', protect, admin, adminController.reviewEvent);
router.get('/flagged-events', protect, admin, adminController.getFlaggedEvents);
router.get('/duplicate-events', protect, admin, adminController.getDuplicateEvents);
router.get('/users', protect, admin, adminController.getUsers);
router.put('/update-user-role', protect, admin, adminController.updateUserRole);

module.exports = router;