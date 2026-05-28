const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verifies the user's JSON Web Token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from Bearer string
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token matching your JWT secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user profile object data without exposing their hashed password string
      req.user = await User.findById(decoded.id).select('-password');
      
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed verification' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token payload found' });
  }
};

// Role-based Access Gate - Restricts access to specific accounts (like admins)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user?.role || 'Guest'}' is not authorized to access this resource` });
    }
    next();
  };
};

module.exports = { protect, authorize };