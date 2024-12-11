const jwt = require('jsonwebtoken');

const requireApiKey = (req, res, next) => {
  const apiKey = req.header('api_key');
  
  if (!apiKey) {
    return res.status(401).json({ message: 'API key is required' });
  }
  
  req.api_key = apiKey;
  next();
};

// New middleware to authenticate the access token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Assuming token is sent as "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid access token' });
    }
    req.userId = user.id; // Store user ID for later use
    next();
  });
};

module.exports = { requireApiKey, authenticateToken }; 