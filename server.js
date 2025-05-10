const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const adminRouter = require('./routes/admin');
const recordsRouter = require('./routes/records');
const usersRouter = require('./routes/users');
const filesRouter = require('./routes/files');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors()); // Allow all origins
app.use(express.json());
// Serve static files from the 'assets/uploads' directory
app.use('/assets/uploads', express.static(path.join(__dirname, 'assets/uploads')));

// Routes
app.use('/api/admin', adminRouter)
app.use('/api/records', recordsRouter);
app.use('/api/users', usersRouter);
app.use('/api/files', filesRouter);

// Error handling middleware (must be after routes)
app.use(errorHandler);

// Connect to Database
connectDB();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});