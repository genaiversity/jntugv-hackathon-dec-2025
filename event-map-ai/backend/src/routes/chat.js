const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/message', chatController.chat);
router.post('/stream', chatController.chatStream);

module.exports = router;