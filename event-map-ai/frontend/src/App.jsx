import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapView from './components/MapView';
import Login from './components/Login';
import Register from './components/Register';
import SocialCallback from './components/SocialCallback';
import EventDetails from './components/EventDetails';
import UserProfile from './components/UserProfile';
import CreateEvent from './components/CreateEvent';
import ImageAnalyzer from './components/ImageAnalyzer';
import Navigation from './components/Navigation';
import AIEventBot from './components/AIEventBot';
import AIAssistantWidget from './components/AIAssistantWidget';
import AuthProvider, { useAuth } from './context/AuthContext';
import './App.css';

function AppContent() {
  const [events, setEvents] = useState([]);
  const { currentUser } = useAuth();

  // Fetch events data for the AI bot
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch('/api/events');
        if (response.ok) {
          const eventsData = await response.json();
          setEvents(eventsData);
        } else {
          // Fallback sample data for demonstration
          setEvents([
            {
              id: 1,
              title: "Tech Conference 2024",
              description: "Annual technology conference featuring latest innovations",
              location: "Downtown Convention Center",
              date: "2024-03-15",
              time: "9:00 AM",
              category: "Technology",
              price: 150
            },
            {
              id: 2,
              title: "Music Festival",
              description: "Three-day music festival with top artists",
              location: "Central Park",
              date: "2024-03-20",
              time: "6:00 PM",
              category: "Music",
              price: 75
            },
            {
              id: 3,
              title: "Food & Wine Expo",
              description: "Culinary experience with local chefs and wineries",
              location: "Riverside Plaza",
              date: "2024-03-25",
              time: "12:00 PM",
              category: "Food",
              price: 45
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        // Use sample data as fallback
        setEvents([
          {
            id: 1,
            title: "Tech Conference 2024",
            description: "Annual technology conference featuring latest innovations",
            location: "Downtown Convention Center",
            date: "2024-03-15",
            time: "9:00 AM",
            category: "Technology",
            price: 150
          }
        ]);
      }
    };

    fetchEvents();
  }, []);

  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/social" element={<SocialCallback />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/image-analyzer" element={<ImageAnalyzer />} />
        </Routes>

        {/* AI Event Bot - Available on all pages */}
        <AIEventBot events={events} />
        
        {/* NEW: Multi-Agent AI Assistant Widget */}
        <AIAssistantWidget user={currentUser} />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;