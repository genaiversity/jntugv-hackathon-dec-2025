import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Failed to log in');
      }
    } catch (err) {
      setError('Failed to log in');
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
        <h2>Welcome Back</h2>
        <p>Sign in to your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
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

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="social-login">
          <p className="divider-text">Or continue with</p>
          <div className="social-buttons">
            <a href="/api/auth/google" className="btn btn-google btn-block">
              Login with Google
            </a>
            <a href="/api/auth/facebook" className="btn btn-facebook btn-block">
              Login with Facebook
            </a>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}