import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../api/eventService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './EventDetails.css';

// Get API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function EventDetails() {
  const { id } = useParams();
  const { token, currentUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAttending, setIsAttending] = useState(false);
  const [attendeesCount, setAttendeesCount] = useState(0);
  
  // Review states
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await eventService.getEventById(id);
        setEvent(eventData);
        setAttendeesCount(eventData.attendees ? eventData.attendees.length : 0);
        
        // Check if current user is attending (if logged in)
        if (currentUser && eventData.attendees) {
          const isUserAttending = eventData.attendees.some(
            attendee => attendee.id === currentUser.id
          );
          setIsAttending(isUserAttending);
        }
        
        setLoading(false);
      } catch (err) {
        setError("Failed to load event details");
        setLoading(false);
      }
    };
    
    const fetchReviews = async () => {
      try {
        // Fetch event reviews
        const response = await fetch(`${API_BASE_URL}/reviews/event/${id}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews);
          setAverageRating(data.averageRating);
          setTotalReviews(data.totalReviews);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };
    
    const fetchUserReview = async () => {
      if (!token) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/reviews/event/${id}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.review) {
            setUserReview(data.review);
          }
        }
      } catch (err) {
        console.error("Error fetching user review:", err);
      }
    };
    
    fetchEvent();
    fetchReviews();
    fetchUserReview();
  }, [id, currentUser, token]);

  const handleAttend = async () => {
    if (!token) {
      alert('Please log in to attend events');
      return;
    }
    
    try {
      const response = await eventService.attendEvent(id, token);
      setIsAttending(!isAttending);
      setAttendeesCount(response.attendees);
    } catch (err) {
      alert(err.message || 'Failed to update attendance');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      alert('Please log in to submit a review');
      return;
    }
    
    if (!reviewData.comment.trim()) {
      setReviewError('Please enter a comment');
      return;
    }
    
    setReviewLoading(true);
    setReviewError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/event/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserReview(data.review);
        setShowReviewForm(false);
        setReviewData({ rating: 5, comment: '' });
        
        // Refresh reviews
        const reviewsResponse = await fetch(`${API_BASE_URL}/reviews/event/${id}`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews);
          setAverageRating(reviewsData.averageRating);
          setTotalReviews(reviewsData.totalReviews);
        }
      } else {
        const errorData = await response.json();
        setReviewError(errorData.message || 'Failed to submit review');
      }
    } catch (err) {
      setReviewError('Failed to submit review');
    }
    
    setReviewLoading(false);
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    if (end && start.toDateString() === end.toDateString()) {
      return `${start.toLocaleDateString(undefined, options)} from ${start.toLocaleTimeString(undefined, timeOptions)} to ${end.toLocaleTimeString(undefined, timeOptions)}`;
    } else if (end) {
      return `${start.toLocaleDateString(undefined, options)} ${start.toLocaleTimeString(undefined, timeOptions)} - ${end.toLocaleDateString(undefined, options)} ${end.toLocaleTimeString(undefined, timeOptions)}`;
    } else {
      return `${start.toLocaleDateString(undefined, options)} at ${start.toLocaleTimeString(undefined, timeOptions)}`;
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={`star ${star <= rating ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="event-details-loading">Loading event details...</div>;
  }

  if (error) {
    return <div className="event-details-error">{error}</div>;
  }

  return (
    <div className="event-details">
      <div className="event-header">
        <div className="event-image-placeholder">
          <div className="event-image-text">Event Image</div>
        </div>
        <div className="event-header-content">
          <h1>{event.title}</h1>
          <div className="event-meta">
            <span className="event-category">{event.category}</span>
            <span className="event-attendees">👥 {attendeesCount} attending</span>
            {totalReviews > 0 && (
              <span className="event-rating">
                {renderStars(averageRating)} ({averageRating.toFixed(1)}) - {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="event-content">
        <div className="event-main">
          <div className="event-section">
            <h2>Description</h2>
            <p>{event.description}</p>
          </div>
          
          <div className="event-section">
            <h2>Details</h2>
            <div className="event-details-grid">
              <div className="detail-item">
                <span className="detail-label">📅 Date & Time</span>
                <span className="detail-value">{formatDateRange(event.date, event.endDate)}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">📍 Location</span>
                <span className="detail-value">{event.location}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">🏢 Organizer</span>
                <span className="detail-value">{event.organizer.name}</span>
              </div>
            </div>
          </div>
          
          <div className="event-section">
            <h2>Reviews</h2>
            
            {token && !userReview && (
              <div className="add-review-section">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {showReviewForm ? 'Cancel' : 'Write a Review'}
                </button>
                
                {showReviewForm && (
                  <form onSubmit={handleReviewSubmit} className="review-form">
                    <div className="form-group">
                      <label>Rating</label>
                      <div className="rating-input">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star}
                            className={`star ${star <= reviewData.rating ? 'filled' : 'empty'}`}
                            onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                          >
                            ★
                          </span>
                        ))}
                        <span className="rating-text">({reviewData.rating} stars)</span>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="comment">Comment</label>
                      <textarea
                        id="comment"
                        name="comment"
                        value={reviewData.comment}
                        onChange={handleReviewChange}
                        rows="4"
                        placeholder="Share your experience with this event..."
                        required
                      />
                    </div>
                    
                    {reviewError && <div className="alert alert-error">{reviewError}</div>}
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={reviewLoading}
                    >
                      {reviewLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            )}
            
            {userReview && (
              <div className="user-review">
                <h3>Your Review</h3>
                <div className="review-item">
                  <div className="review-header">
                    <div className="review-author">{userReview.user.name}</div>
                    <div className="review-rating">{renderStars(userReview.rating)}</div>
                  </div>
                  <div className="review-comment">{userReview.comment}</div>
                  <div className="review-date">
                    {new Date(userReview.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
            
            {reviews.length > 0 ? (
              <div className="reviews-list">
                <h3>Community Reviews</h3>
                {reviews
                  .filter(review => !userReview || review._id !== userReview._id)
                  .map(review => (
                    <div key={review._id} className="review-item">
                      <div className="review-header">
                        <div className="review-author">{review.user.name}</div>
                        <div className="review-rating">{renderStars(review.rating)}</div>
                      </div>
                      <div className="review-comment">{review.comment}</div>
                      <div className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="no-reviews">
                <p>No reviews yet. Be the first to review this event!</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="event-sidebar">
          <div className="event-actions">
            {token ? (
              <button 
                className={`btn ${isAttending ? 'btn-secondary' : 'btn-primary'} btn-block`}
                onClick={handleAttend}
              >
                {isAttending ? 'Cancel Attendance' : 'Attend Event'}
              </button>
            ) : (
              <button 
                className="btn btn-primary btn-block"
                onClick={() => alert('Please log in to attend events')}
              >
                Log in to Attend
              </button>
            )}
            
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline btn-block"
            >
              Get Directions
            </a>
          </div>
          
          <div className="event-share">
            <h3>Share Event</h3>
            <div className="share-buttons">
              <button className="share-btn">
                <i className="fab fa-facebook-f"></i>
              </button>
              <button className="share-btn">
                <i className="fab fa-twitter"></i>
              </button>
              <button className="share-btn">
                <i className="fas fa-link"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}