const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireApiKey, authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// REGISTER - Register a new user
router.post('/register', requireApiKey, async (req, res) => {
  const { userName, password , otp ,...rest } = req.body;

  if (!userName) {
    return res.status(400).json({ message: 'userName is required!' });
  }
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  if (otp !== 12345) {
    return res.status(403).json({ message: 'OTP is incorrect' });
  }

  try {
    const existingUser = await User.findOne({
      userName,
      application_key: req.api_key,
    });

    if (existingUser) {
      return res.status(400).json({ message: 'UserName already in use for this application'});
    }

    const newUser = new User({
      userName,
      password,
      profileImage : '',
      ...rest,
      application_key: req.api_key,
      data_id: Date.now() * (Math.floor(Math.random() * 1000) + 1),
      is_admin: userName === 'admin' ? true :false,
      type: "user",
    });

    await newUser.save();

    // Generate JWT tokens
    const accessToken = jwt.sign({ id: newUser._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });
    const refreshToken = jwt.sign({ id: newUser._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRE });

    newUser.refreshToken = refreshToken; // Save the refresh token in the user document
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN - Login a user
router.post('/login', requireApiKey, async (req, res) => {
  const { userName, password } = req.body;

  if (!userName) {
    return res.status(400).json({ message: 'userName is required' });
  }
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const user = await User.findOne({
      userName,
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
    const accessToken = jwt.sign({ id: user._id}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE  });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRE  });

    user.refreshToken = refreshToken;
    await user.save();

    const finalResponse = { accessToken, refreshToken  }

    if(user.is_admin){
      finalResponse.is_admin = true;
    }

    res.status(200).json(finalResponse);
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
    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });

    // Send response without application_key
    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

// GET - Fetch user data
router.get('/me', requireApiKey, authenticateToken, async (req, res) => {
    try {
      let user = await User.findOne({ _id: req.userId, application_key: req.api_key });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user = user.toObject();

      if(!user.is_admin){
        delete user.is_admin;
      }
      
      delete user.application_key;
      delete user._id;
      delete user.type;
      delete user.password;
      delete user.data_id;
      delete user.__v;
      
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// PUT - Update user data
router.put('/me', requireApiKey, authenticateToken, async (req, res) => {
  const updates = { ...req.body };

  // Remove blocked fields from the update payload
  const blockedFields = ['is_admin', 'application_key', '_id', 'type', 'data_id'];
  blockedFields.forEach(field => delete updates[field]);

  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.userId, application_key: req.api_key },
      { $set: updates },
      {
        new: true,          // return the updated user
        strict: false,      // allow dynamic fields outside schema
        runValidators: false // skip schema validation
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optional: remove sensitive fields like password before sending
    const userObj = updatedUser.toObject();
    delete userObj.is_admin;
    delete userObj.application_key;
    delete userObj._id;
    delete userObj.type;
    delete userObj.password;
    delete userObj.data_id;
    delete userObj.__v;

    res.status(200).json({
      message: 'User data updated successfully',
      data: userObj
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: error.message });
  }
});


// PUT - Update user data
router.put('/me/change-password', requireApiKey, authenticateToken, async (req, res) => {
  const {password} = req.body; // Accept all fields for update
  
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const user = await User.findOne({ _id: req.userId, application_key: req.api_key });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = password

    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 