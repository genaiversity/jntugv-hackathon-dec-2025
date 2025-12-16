const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviews');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/event/:eventId', reviewController.getEventReviews);

// Protected routes
router.post('/event/:eventId', protect, reviewController.createReview);
router.get('/event/:eventId/user', protect, reviewController.getUserReview);
router.put('/:reviewId', protect, reviewController.updateReview);
router.delete('/:reviewId', protect, reviewController.deleteReview);

module.exports = router;