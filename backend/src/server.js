require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/location');
const rideRoutes = require('./routes/ride');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5501",
    methods: ["GET", "POST"]
  }
});

// CORS Middleware with specific configuration
app.use(cors({
  origin: ['http://localhost:5500', 'http://localhost:5501', 'http://127.0.0.1:5500', 'http://127.0.0.1:5501', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/raahi-cab', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  console.log('Connection URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/raahi-cab');
})
.catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('updateLocation', (data) => {
    // Broadcast location update to all connected clients except sender
    socket.broadcast.emit('driverLocation', {
      driverId: data.driverId,
      location: data.location
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/ride', rideRoutes);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Route not found handler
app.use((req, res) => {
  console.log('Route not found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on:
- http://localhost:${PORT}
- http://127.0.0.1:${PORT}
- http://${HOST}:${PORT}`);
  
  console.log('\nAvailable routes:');
  console.log('- POST /api/auth/register');
  console.log('- POST /api/auth/login');
  console.log('- GET /api/location');
  console.log('- POST /api/ride');
});