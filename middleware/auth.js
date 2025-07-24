const jwt = require('jsonwebtoken');
const Schema = require('../models/Schema');
const User = require('../models/User');

const requireApiKey = (req, res, next) => {
  const apiKey = req.header('api_key');
  
  if (!apiKey) {
    return res.status(401).json({ message: 'API key is required' });
  }
  
  req.api_key = apiKey;
  next();
};

// middleware to authenticate the access token
const authenticateToken = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Assuming token is sent as "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }
  

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid access token' });
    }
    
    // Fetch user details from the database
    const foundUser = await User.findById(user.id);
    if (!foundUser) {
      return res.status(403).json({ message: 'User not found' });
    }
    req.userId = foundUser.id; // Store user ID for later use
    req.isAdmin = foundUser.is_admin; // Store admin status for later use
    next();
  });
};

// middleware to check if user has access to this request
const checkAccessLevel = async (req, res, next) => {
  const category = req.params.category || 'global';
  const schema = await Schema.findOne({ application_key: req.api_key, user_custom_category: category, method : req.method });
  const schemaAccessLevel =  
    !schema?.access || schema?.access === 'all' ? 
    process.env.DEFAULT_RECORDS_ACCESS_LEVEL || schema?.access :
    schema?.access;

  const token = req.header('Authorization')?.split(' ')[1];

  if (!schemaAccessLevel || schemaAccessLevel === 'all') {
    if(!token){
      return next();
    }
  }

  
  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid access token' });
    }

    const foundUser = await User.findOne({ _id: user.id, application_key: req.api_key });
    if (!foundUser) {
      return res.status(403).json({ message: 'Invalid access token' });
    }

    req.user_id = foundUser._id

    if (foundUser.is_admin || schemaAccessLevel === 'user') {
      req.user = foundUser;
      return next();
    }

    return res.status(403).json({ message: 'You don\'t have permission' });
  });
};

module.exports = { requireApiKey, authenticateToken, checkAccessLevel }; 