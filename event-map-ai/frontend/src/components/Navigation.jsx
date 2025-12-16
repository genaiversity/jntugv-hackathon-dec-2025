import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

export default function Navigation() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          EventMap
        </Link>
        
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">
              Map
            </Link>
          </li>
          
          {currentUser ? (
            <>
              <li className="nav-item">
                <Link to="/profile" className="nav-link">
                  Profile
                </Link>
              </li>
              
              {(currentUser.role === 'organizer' || currentUser.role === 'admin') && (
                <>
                  <li className="nav-item">
                    <Link to="/create-event" className="nav-link">
                      Create Event
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/image-analyzer" className="nav-link">
                      Image Analyzer
                    </Link>
                  </li>
                </>
              )}
              
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link nav-button">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}