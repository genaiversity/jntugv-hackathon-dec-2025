import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import eventService from '../api/eventService';
import './CreateEvent.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function CreateEvent() {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    date: '',
    endDate: '',
    category: 'other',
    photos: [] // Added for photo upload
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to India center
  const [markerPosition, setMarkerPosition] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);

  // AI Generator State
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiGenData, setAiGenData] = useState({
    type: '',
    audience: '',
    highlights: ''
  });
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiChange = (e) => {
    const { name, value } = e.target;
    setAiGenData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateDescription = async () => {
    if (!eventData.title || !aiGenData.type) {
      setError('Please provide at least a Title and Event Type for AI generation');
      return;
    }

    setAiLoading(true);
    setError('');

    try {
      const response = await eventService.generateDescription({
        title: eventData.title,
        type: aiGenData.type,
        audience: aiGenData.audience,
        highlights: aiGenData.highlights
      }, token);

      if (response.success) {
        setEventData(prev => ({
          ...prev,
          description: response.description
        }));
        setShowAiGenerator(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate description');
    }
    setAiLoading(false);
  };

  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize map center to user's location if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("User's actual location:", latitude, longitude);
          setMapCenter([latitude, longitude]);
          
          // Set marker position and form data if using current location
          if (useCurrentLocation) {
            setMarkerPosition([latitude, longitude]);
            setEventData(prev => ({
              ...prev,
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6)
            }));
          }
        },
        (err) => {
          console.error("Error getting location:", err);
          setError("Unable to get your precise location. Please select location manually on the map.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser. Please select location manually on the map.");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle photo file selection
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setEventData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };

  // Remove a photo from the list
  const removePhoto = (index) => {
    setEventData(prev => {
      const newPhotos = [...prev.photos];
      newPhotos.splice(index, 1);
      return { ...prev, photos: newPhotos };
    });
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setMarkerPosition([lat, lng]);
    
    // Update form data when clicking on map
    setEventData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
    
    // Disable current location mode when manually selecting
    setUseCurrentLocation(false);
  };

  // Enable marker dragging
  const enableMarkerDrag = () => {
    setIsDraggingMarker(true);
  };

  // Handle marker drag end
  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    
    setMarkerPosition([position.lat, position.lng]);
    setEventData(prev => ({
      ...prev,
      latitude: position.lat.toFixed(6),
      longitude: position.lng.toFixed(6)
    }));
    
    // Disable current location mode when manually dragging
    setUseCurrentLocation(false);
  };

  const toggleUseCurrentLocation = () => {
    const newUseCurrentLocation = !useCurrentLocation;
    setUseCurrentLocation(newUseCurrentLocation);
    
    if (newUseCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMarkerPosition([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setEventData(prev => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6)
          }));
        },
        (err) => {
          setError("Unable to get your current location: " + err.message);
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!eventData.title || !eventData.description || !eventData.location ||
      !eventData.latitude || !eventData.longitude || !eventData.date) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Prepare form data for submission
      const formData = new FormData();
      Object.keys(eventData).forEach(key => {
        if (key !== 'photos') {
          // Ensure latitude and longitude are properly formatted
          if (key === 'latitude' || key === 'longitude') {
            formData.append(key, String(eventData[key]));
          } else {
            formData.append(key, eventData[key]);
          }
        }
      });
      
      // Append photos if any
      if (eventData.photos && Array.isArray(eventData.photos)) {
        eventData.photos.forEach(photo => {
          formData.append('photos', photo);
        });
      }
      
      // Debugging: Log FormData contents
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      const response = await eventService.createEvent(formData, token);
      setSuccess(true);

      // Reset form
      setEventData({
        title: '',
        description: '',
        location: '',
        latitude: '',
        longitude: '',
        date: '',
        endDate: '',
        category: 'other',
        photos: []
      });

      // Redirect to event page after short delay
      setTimeout(() => {
        navigate(`/event/${response.event._id}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create event');
    }

    setLoading(false);
  };

  if (!currentUser || (currentUser.role !== 'organizer' && currentUser.role !== 'admin')) {
    return (
      <div className="create-event-container">
        <div className="create-event-card">
          <h2>Access Denied</h2>
          <p>You must be an organizer or admin to create events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-event-container">
      <div className="create-event-card">
        <h2>Create New Event</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">Event created successfully!</div>}

        <div className="map-section">
          <h3>Select Event Location</h3>
          
          <div className="location-options">
            <div className="toggle-option">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={useCurrentLocation}
                  onChange={toggleUseCurrentLocation}
                />
                <span className="slider round"></span>
              </label>
              <span className="toggle-label">
                {useCurrentLocation ? 'Using Current Location' : 'Set Manual Location'}
              </span>
            </div>
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={enableMarkerDrag}
              style={{ marginTop: '10px' }}
            >
              Drag Marker to Position
            </button>
          </div>

          <p>Click on the map or drag the marker to set the event location</p>

          <MapContainer
            center={mapCenter}
            zoom={6}
            style={{ height: '400px', marginBottom: '20px' }}
            whenCreated={(map) => {
              mapRef.current = map;
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markerPosition && (
              <Marker 
                position={markerPosition}
                draggable={isDraggingMarker}
                eventHandlers={{
                  dragend: handleMarkerDragEnd,
                  click: () => {}
                }}
                ref={markerRef}
              >
                <Popup>Event location. {isDraggingMarker ? 'Drag me to reposition' : 'Click and drag to move'}</Popup>
              </Marker>
            )}
          </MapContainer>

          {markerPosition && (
            <p className="coordinates-display">
              Selected coordinates: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-group">
            <label htmlFor="title">Event Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={eventData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div className="label-with-action" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="description">Description *</label>
              <button
                type="button"
                className="btn-text"
                style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => setShowAiGenerator(!showAiGenerator)}
              >
                {showAiGenerator ? 'Cancel AI Generation' : '✨ Auto-Generate with AI'}
              </button>
            </div>

            {showAiGenerator && (
              <div className="ai-generator-panel" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e9ecef' }}>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                  Answer a few questions to generate a description.
                </p>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#444' }}>Event Type *</label>
                  <input
                    type="text"
                    name="type"
                    value={aiGenData.type}
                    onChange={handleAiChange}
                    placeholder="e.g. Technology Conference, Music Festival"
                    style={{ fontSize: '0.9rem', padding: '8px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#444' }}>Target Audience</label>
                  <input
                    type="text"
                    name="audience"
                    value={aiGenData.audience}
                    onChange={handleAiChange}
                    placeholder="e.g. Developers, Students, Families"
                    style={{ fontSize: '0.9rem', padding: '8px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#444' }}>Key Highlights</label>
                  <textarea
                    name="highlights"
                    value={aiGenData.highlights}
                    onChange={handleAiChange}
                    placeholder="e.g. Keynote speakers, Live demos, Free food"
                    rows="2"
                    style={{ fontSize: '0.9rem', padding: '8px' }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '8px', fontSize: '0.9rem' }}
                  onClick={generateDescription}
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Generating...' : 'Generate Description'}
                </button>
              </div>
            )}
            <textarea
              id="description"
              name="description"
              value={eventData.description}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={eventData.location}
              onChange={handleChange}
              placeholder="e.g., Central Park, Conference Hall, etc."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">Latitude *</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={eventData.latitude}
                onChange={handleChange}
                step="any"
                placeholder="Click on map or drag marker"
                required
                readOnly={!useCurrentLocation}
              />
            </div>

            <div className="form-group">
              <label htmlFor="longitude">Longitude *</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={eventData.longitude}
                onChange={handleChange}
                step="any"
                placeholder="Click on map or drag marker"
                required
                readOnly={!useCurrentLocation}
              />
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="form-group">
            <label htmlFor="photos">Event Photos</label>
            <input
              type="file"
              id="photos"
              name="photos"
              onChange={handlePhotoChange}
              accept="image/*"
              multiple
            />
            {eventData.photos.length > 0 && (
              <div className="photo-preview">
                <h4>Selected Photos ({eventData.photos.length})</h4>
                <div className="photo-list">
                  {eventData.photos.map((photo, index) => (
                    <div key={index} className="photo-item">
                      <span>{photo.name}</span>
                      <button 
                        type="button" 
                        className="btn-remove-photo"
                        onClick={() => removePhoto(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="date">Start Date & Time *</label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={eventData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date & Time</label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={eventData.endDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={eventData.category}
              onChange={handleChange}
            >
              <option value="other">Other</option>
              <option value="music">Music</option>
              <option value="sports">Sports</option>
              <option value="workshop">Workshop</option>
              <option value="exhibition">Exhibition</option>
              <option value="college fest">College Fest</option>
              <option value="religious">Religious</option>
              <option value="promotion">Promotion</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating Event...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
}