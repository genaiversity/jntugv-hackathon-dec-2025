import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import eventService from '../api/eventService';
import EventCard from './EventCard';
import './MapView.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for events and tasks
const eventIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const taskIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1827/1827951.png', // Checklist icon
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

export default function MapView() {
  const [userPosition, setUserPosition] = useState(null);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];
          setUserPosition(userPos);
          setMapCenter(userPos);
          setMapZoom(14);
          setLoading(false);
          
          // Fetch all events (not just nearby ones)
          fetchAllEvents();
        },
        (err) => {
          console.error("Error getting location:", err);
          setError("Unable to get your location. Showing default location.");
          setLoading(false);
          
          // Still fetch all events even if we can't get user location
          fetchAllEvents();
        }
      );
    } else {
      setError("Geolocation is not supported by your browser. Showing default location.");
      setLoading(false);
      
      // Still fetch all events even if geolocation isn't supported
      fetchAllEvents();
    }
  }, []);

  const fetchAllEvents = async (position = null) => {
    try {
      // Prepare parameters for fetching events
      const params = {};
      
      // If we have user position, include it in the request
      if (position) {
        params.latitude = position[0];
        params.longitude = position[1];
        params.radius = 100; // Increase radius to capture more events
        console.log("Fetching events with user position:", position);
      } else if (userPosition) {
        // Fallback to existing userPosition state
        params.latitude = userPosition[0];
        params.longitude = userPosition[1];
        params.radius = 100;
        console.log("Fetching events with existing user position:", userPosition);
      } else {
        console.log("Fetching all events (no user position available)");
      }
      
      console.log("Event fetch parameters:", params);
      
      // Fetch events from the backend with location parameters
      const eventsData = await eventService.getEvents(params);
      console.log("Received", eventsData.length, "events from backend:", eventsData);
      setEvents(eventsData);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events from server. Please try again later.");
      
      // Clear events on error instead of showing static events
      setEvents([]);
    }
  };

  const handleMapClick = (e) => {
    // Handle map click for adding new events
    console.log("Map clicked at:", e.latlng);
  };

  if (loading && events.length === 0) {
    return <div className="map-loading">Loading events...</div>;
  }

  return (
    <div className="map-view">
      {error && <div className="map-error">{error}</div>}
      
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        ref={mapRef}
        className="map-container"
        whenCreated={(map) => {
          mapRef.current = map;
          map.on('click', handleMapClick);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userPosition && (
          <>
            <Marker position={userPosition}>
              <Popup>
                <div className="user-popup">
                  <h3>Your Location</h3>
                  <p>You are here</p>
                </div>
              </Popup>
            </Marker>
            
            {/* 10km radius circle */}
            <Circle 
              center={userPosition} 
              radius={10000} 
              fillColor="#3b82f6" 
              fillOpacity={0.1} 
              color="#3b82f6" 
              weight={1}
            />
          </>
        )}
        
        {events.map(event => (
          <Marker 
            key={`event-${event._id}`} 
            position={[event.latitude, event.longitude]}
            icon={eventIcon}
          >
            <Popup>
              <EventCard event={{
                id: event._id,
                title: event.title,
                description: event.description,
                location: event.location,
                latitude: event.latitude,
                longitude: event.longitude,
                date: event.date,
                category: event.category,
                attendees: event.attendees || 0
              }} />
            </Popup>
          </Marker>
        ))}

        {tasks.map(task => (
          <Marker 
            key={`task-${task._id}`} 
            position={[task.latitude, task.longitude]}
            icon={taskIcon}
          >
            <Popup>
              <div className="task-card">
                <h3>{task.title}</h3>
                <p><strong>Description:</strong> {task.description}</p>
                <p><strong>Location:</strong> {task.location}</p>
                <p><strong>Date:</strong> {new Date(task.date).toLocaleString()}</p>
                <p><strong>Category:</strong> {task.category}</p>
                <p><strong>Priority:</strong> 
                  <span className={`priority-${task.priority}`}> {task.priority}</span>
                </p>
                <p><strong>Attendees:</strong> {task.attendees}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <div className="map-overlay">
        <div className="events-summary">
          <h2>Events</h2>
          <p>{events.length} events loaded</p>
          {error && <p>(Some data may be from demo mode)</p>}
        </div>
      </div>
    </div>
  );
}