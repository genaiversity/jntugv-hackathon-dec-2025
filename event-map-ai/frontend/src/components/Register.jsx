import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await register(name, email, password, role);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Failed to create account');
      }
    } catch (err) {
      setError('Failed to create account');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* 3D DNA Helix Animations */}
      <div className="dna-helix">
        <div className="dna-strand"></div>
        <div className="dna-strand"></div>
        <div className="dna-base" style={{ top: '10%' }}></div>
        <div className="dna-base" style={{ top: '25%' }}></div>
        <div className="dna-base" style={{ top: '40%' }}></div>
        <div className="dna-base" style={{ top: '55%' }}></div>
        <div className="dna-base" style={{ top: '70%' }}></div>
        <div className="dna-base" style={{ top: '85%' }}></div>
      </div>

      <div className="dna-helix">
        <div className="dna-strand"></div>
        <div className="dna-strand"></div>
        <div className="dna-base" style={{ top: '15%' }}></div>
        <div className="dna-base" style={{ top: '30%' }}></div>
        <div className="dna-base" style={{ top: '45%' }}></div>
        <div className="dna-base" style={{ top: '60%' }}></div>
        <div className="dna-base" style={{ top: '75%' }}></div>
      </div>

      <div className="dna-helix">
        <div className="dna-strand"></div>
        <div className="dna-strand"></div>
        <div className="dna-base" style={{ top: '20%' }}></div>
        <div className="dna-base" style={{ top: '40%' }}></div>
        <div className="dna-base" style={{ top: '60%' }}></div>
        <div className="dna-base" style={{ top: '80%' }}></div>
      </div>

      <div className="auth-card">
        <h2>Create Account</h2>
        <p>Join EventMap to discover events near you</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">Regular User</option>
              <option value="organizer">Event Organizer</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="social-login">
          <p className="divider-text">Or continue with</p>
          <div className="social-buttons">
            <a href="/api/auth/google" className="btn btn-google btn-block">
              Signup with Google
            </a>
            <a href="/api/auth/facebook" className="btn btn-facebook btn-block">
              Signup with Facebook
            </a>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}