/**
 * AI ASSISTANT ROUTES
 * API endpoints for the multi-agent AI assistant system
 */

const express = require('express');
const router = express.Router();
const aiAssistantController = require('../controllers/aiAssistantController');
const { protect } = require('../middleware/auth');

// Optional authentication middleware for guest support
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // Try to authenticate if token is provided
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user) {
        req.user = user;
      } else {
        req.user = null;
      }
    } else {
      req.user = null; // Guest user
    }
    next();
  } catch (error) {
    // If token is invalid, treat as guest
    req.user = null;
    next();
  }
};

// Main AI assistant endpoint (allow both authenticated and guest users)
router.post('/chat', optionalAuth, aiAssistantController.processMessage);

// Get AI capabilities based on user role (allow guests)
router.get('/capabilities', optionalAuth, aiAssistantController.getCapabilities);

// Conversation management
router.get('/conversation/:sessionId', protect, aiAssistantController.getConversationHistory);
router.delete('/conversation/:sessionId', protect, aiAssistantController.clearConversation);

// Analytics (admin only)
router.get('/analytics', protect, aiAssistantController.getAnalytics);

// Health check
router.get('/health', aiAssistantController.healthCheck);

// Feedback
router.post('/feedback', protect, aiAssistantController.submitFeedback);

module.exports = router;