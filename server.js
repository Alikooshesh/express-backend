const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const recordsRouter = require('./routes/records');
const usersRouter = require('./routes/users');
const filesRouter = require('./routes/files');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
// Serve static files from the 'assets/uploads' directory
app.use('/assets/uploads', express.static(path.join(__dirname, 'assets/uploads')));

// Routes
app.use('/api/records', recordsRouter);
app.use('/api/users', usersRouter);
app.use('/api/files', filesRouter);

// Error handling middleware (must be after routes)
app.use(errorHandler);

// Connect to Database
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 