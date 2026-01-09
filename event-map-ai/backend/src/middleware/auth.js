const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

      // Get user from token
      req.user = await User.findById(decoded.userId).select('-password');

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      console.log('Token that failed:', token ? token.substring(0, 20) + '...' : 'No token');
      console.log('Using Secret:', process.env.JWT_SECRET ? 'From ENV' : 'Fallback');
      return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Restrict to organizers only
const organizer = (req, res, next) => {
  if (req.user && req.user.role === 'organizer') {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as an organizer' });
  }
};

// Restrict to admins only
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// Restrict to organizers or admins
const organizerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'organizer' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as an organizer or admin' });
  }
};

module.exports = {
  protect,
  organizer,
  admin,
  organizerOrAdmin
};