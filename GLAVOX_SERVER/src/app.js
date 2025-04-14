const express = require('express');
const cors = require('cors');
const app = express();

// 🔁 Route Imports
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const speechRoutes = require('./routes/speechRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const trackingRoutes = require('./routes/trackingRoutes');

// 🌐 Middleware
app.use(cors());
app.use(express.json());

// 📁 Serve Static Files (for audio etc.)
app.use(express.static('public'));

// 📌 API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/tracking', trackingRoutes);

// ❌ 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
