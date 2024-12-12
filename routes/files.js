const express = require('express');
const router = express.Router();
const {requireApiKey} = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = 'assets/uploads';
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const randomName = `${Date.now()}-${Math.floor(Math.random() * 1000)}${path.extname(file.originalname)}`;
      cb(null, randomName);
    }
  });
  
  const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
    fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
    }
  });

// UPLOAD - Upload an image file
router.post('/upload', requireApiKey, upload.single('image'), (req, res) => {
    if (req.file) {
      const downloadLink = `/assets/uploads/${req.file.filename}`;
      res.status(201).json({ message: 'File uploaded successfully', downloadLink });
    } else {
      res.status(400).json({ message: 'No file uploaded' });
    }
  });


  module.exports = router; 