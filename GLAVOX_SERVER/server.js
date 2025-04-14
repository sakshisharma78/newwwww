const app = require('./src/app');
const connectDB = require('./src/config/db');
require('dotenv').config();
const cors = require("cors");
const path = require('path');
const express = require('express');

app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🌐 Accessible at http://YOUR_IP_ADDRESS:${PORT}`);
});
