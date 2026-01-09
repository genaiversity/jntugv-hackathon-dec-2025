import React from 'react';
import { Link } from 'react-router-dom';
import './EventCard.css';

export default function EventCard({ event }) {
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Technology': '#3b82f6',
      'Music': '#ef4444',
      'Arts': '#8b5cf6',
      'Sports': '#10b981',
      'default': '#6b7280'
    };
    return colors[category] || colors.default;
  };

  return (
    <div className="event-card">
      <div className="event-header">
        <h3 className="event-title">{event.title}</h3>
        <span 
          className="event-category" 
          style={{ backgroundColor: getCategoryColor(event.category) }}
        >
          {event.category}
        </span>
      </div>
      
      <p className="event-description">{event.description}</p>
      
      <div className="event-details">
        <div className="event-info">
          <span className="event-location">📍 {event.location}</span>
          <span className="event-date">📅 {formatDate(event.date)}</span>
        </div>
        
        <div className="event-stats">
          <span className="event-attendees">👥 {event.attendees} attending</span>
        </div>
      </div>
      
      <div className="event-actions">
        <Link to={`/event/${event.id}`} className="btn btn-primary">
          View Details
        </Link>
        <a 
          href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          Get Directions
        </a>
      </div>
    </div>
  );
}