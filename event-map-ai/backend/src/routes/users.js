const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const { protect } = require('../middleware/auth');

// Protected routes
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/change-password', protect, userController.changePassword);

// Public routes for special registrations
router.post('/register-organizer', userController.registerOrganizer);
router.post('/register-admin', userController.registerAdmin);

module.exports = router;