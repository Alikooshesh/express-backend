const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireApiKey, authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// REGISTER - Register a new user
router.post('/register', requireApiKey, async (req, res) => {
  const { email, phone, password } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ message: 'Email or Phone is required' });
  }
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
      application_key: req.api_key,
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or phone number already in use for this application' });
    }

    const newUser = new User({
      email,
      phone,
      password,
      application_key: req.api_key,
      data_id: Date.now() * (Math.floor(Math.random() * 1000) + 1),
      is_admin: false,
      type: "user",
    });

    await newUser.save();

    // Generate JWT tokens
    const accessToken = jwt.sign({ id: newUser._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: newUser._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    newUser.refreshToken = refreshToken; // Save the refresh token in the user document
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN - Login a user
router.post('/login', requireApiKey, async (req, res) => {
  const { email, phone, password } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ message: 'Email or phone number is required' });
  }
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: email }, { phone: phone }],
      application_key: req.api_key,
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign({ id: user._id}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Function to refresh access token using refresh token
router.post('/token', requireApiKey, async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Find the user associated with the refresh token and check api_key
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken || user.application_key !== req.api_key) {
      return res.status(403).json({ message: 'Invalid refresh token or API key' });
    }

    // Generate a new access token
    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

    // Send response without application_key
    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

// GET - Fetch user data
router.get('/me', requireApiKey, authenticateToken, async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.userId, application_key: req.api_key });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ email: user.email, phone: user.phone });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// PUT - Update user data
router.put('/me', requireApiKey, authenticateToken, async (req, res) => {
  const updates = req.body; // Accept all fields for update

  try {
    const user = await User.findOne({ _id: req.userId, application_key: req.api_key });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields with the provided data
    Object.keys(updates).forEach(key => {
      user[key] = updates[key];
    });

    await user.save();
    res.status(200).json({ message: 'User data updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.is_admin) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied' });
};

// ADMIN - CREATE a new user
router.post('/admin/users', requireApiKey, authenticateToken, isAdmin, async (req, res) => {
  const { email, phone, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and Password are required' });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
      application_key: req.api_key,
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or phone number already in use' });
    }

    const newUser = new User({
      email,
      phone,
      password,
      application_key: req.api_key,
      data_id: Date.now() * (Math.floor(Math.random() * 1000) + 1),
      is_admin: false,
      type: "user",
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN - READ all users
router.get('/admin/users', requireApiKey, authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ application_key: req.api_key });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN - UPDATE a user
router.put('/admin/users/:id', requireApiKey, authenticateToken, isAdmin, async (req, res) => {
  const updates = req.body;

  try {
    const user = await User.findOne({ _id: req.params.id, application_key: req.api_key });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    Object.keys(updates).forEach(key => {
      user[key] = updates[key];
    });

    await user.save();
    res.status(200).json({ message: 'User data updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN - DELETE a user
router.delete('/admin/users/:id', requireApiKey, authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, application_key: req.api_key });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN - CHANGE a user's role to admin
router.put('/admin/users/:id/role', requireApiKey, authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, application_key: req.api_key });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Change the user's role to admin
    user.is_admin = true;

    await user.save();
    res.status(200).json({ message: 'User role updated to admin successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 