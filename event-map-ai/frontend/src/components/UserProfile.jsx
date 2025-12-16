import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './UserProfile.css';

export default function UserProfile() {
  const { currentUser, getProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [attendingEvents, setAttendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        try {
          const profileData = await getProfile();
          if (profileData) {
            setProfile(profileData.user);
            setOrganizedEvents(profileData.organizedEvents || []);
            setAttendingEvents(profileData.attendingEvents || []);
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [currentUser, getProfile]);

  if (!currentUser) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Please log in to view your profile</h2>
        </div>
      </div>
    );
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile?.name?.charAt(0).toUpperCase() || currentUser.name.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h1>{profile?.name || currentUser.name}</h1>
          <p>{profile?.email || currentUser.email}</p>
          <p className="profile-role">Role: {profile?.role || currentUser.role}</p>
        </div>
      </div>
      
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab ${activeTab === 'organized' ? 'active' : ''}`}
          onClick={() => setActiveTab('organized')}
        >
          Organized Events
        </button>
        <button 
          className={`tab ${activeTab === 'attending' ? 'active' : ''}`}
          onClick={() => setActiveTab('attending')}
        >
          Attending Events
        </button>
      </div>
      
      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            <h2>Account Information</h2>
            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Organized Events</span>
                <span className="detail-value">{organizedEvents.length}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Attending Events</span>
                <span className="detail-value">{attendingEvents.length}</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'organized' && (
          <div className="profile-section">
            <h2>Events You've Organized</h2>
            
            {organizedEvents.length === 0 ? (
              <div className="no-events">
                <p>You haven't organized any events yet.</p>
                {profile?.role === 'organizer' || profile?.role === 'admin' ? (
                  <p>Create your first event to get started!</p>
                ) : (
                  <p>Become an organizer to create events.</p>
                )}
              </div>
            ) : (
              <div className="events-list">
                {organizedEvents.map(event => (
                  <div key={event._id} className="event-item">
                    <div className="event-item-content">
                      <h3>{event.title}</h3>
                      <p className="event-location">📍 {event.location}</p>
                      <p className="event-date">📅 {new Date(event.date).toLocaleDateString()}</p>
                    </div>
                    <div className="event-status">
                      <span className={getStatusClass(event.status)}>
                        {getStatusText(event.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'attending' && (
          <div className="profile-section">
            <h2>Events You're Attending</h2>
            
            {attendingEvents.length === 0 ? (
              <div className="no-events">
                <p>You haven't registered for any events yet.</p>
              </div>
            ) : (
              <div className="events-list">
                {attendingEvents.map(event => (
                  <div key={event._id} className="event-item">
                    <div className="event-item-content">
                      <h3>{event.title}</h3>
                      <p className="event-location">📍 {event.location}</p>
                      <p className="event-date">📅 {new Date(event.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}