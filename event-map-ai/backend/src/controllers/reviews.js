const Review = require('../models/Review');
const Event = require('../models/Event');

// Create a review for an event
exports.createReview = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment is required' });
    }
    
    // Check if event exists and is approved
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Cannot review unapproved event' });
    }
    
    // Check if user has already reviewed this event
    const existingReview = await Review.findOne({
      event: eventId,
      user: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this event' });
    }
    
    // Create review
    const review = new Review({
      event: eventId,
      user: req.user._id,
      rating,
      comment: comment.trim()
    });
    
    await review.save();
    
    // Populate user info
    await review.populate('user', 'name');
    
    res.status(201).json({
      message: 'Review created successfully',
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        user: {
          id: review.user._id,
          name: review.user.name
        },
        createdAt: review.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reviews for an event
exports.getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get reviews with user info
    const reviews = await Review.find({ event: eventId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
    }
    
    res.json({
      reviews: reviews.map(review => ({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        user: {
          id: review.user._id,
          name: review.user.name
        },
        createdAt: review.createdAt
      })),
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's review for an event (if exists)
exports.getUserReview = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get user's review
    const review = await Review.findOne({
      event: eventId,
      user: req.user._id
    }).populate('user', 'name');
    
    if (!review) {
      return res.json({ review: null });
    }
    
    res.json({
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        user: {
          id: review.user._id,
          name: review.user.name
        },
        createdAt: review.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    
    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns this review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }
    
    // Update fields
    if (rating) review.rating = rating;
    if (comment) review.comment = comment.trim();
    
    await review.save();
    
    // Populate user info
    await review.populate('user', 'name');
    
    res.json({
      message: 'Review updated successfully',
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        user: {
          id: review.user._id,
          name: review.user.name
        },
        createdAt: review.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns this review or is admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    await review.remove();
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};