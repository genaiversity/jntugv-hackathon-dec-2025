const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');

const { protect, organizerOrAdmin } = require('../middleware/auth');

// POST /api/ai/chat - Handle chat messages
router.post('/chat', aiChatController.handleChatMessage.bind(aiChatController));

// POST /api/ai/generate-description - Generate event description (Authenticated users)
router.post('/generate-description', protect, aiChatController.generateEventDescription.bind(aiChatController));

// GET /api/ai/suggestions - Get event suggestions
router.get('/suggestions', aiChatController.getEventSuggestions.bind(aiChatController));

// GET /api/ai/analytics - Get chat analytics
router.get('/analytics', aiChatController.getChatAnalytics.bind(aiChatController));

// POST /api/ai/update - Update RAG system (for admin use)
router.post('/update', async (req, res) => {
  try {
    const success = await aiChatController.updateRAGSystem();
    res.json({
      success,
      message: success ? 'RAG system updated successfully' : 'Failed to update RAG system'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;