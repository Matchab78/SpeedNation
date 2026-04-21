const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());

app.use(express.json());

// Debug middleware to log request details
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log(`[DEBUG] Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[DEBUG] Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

const path = require('path');

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/events', require('./routes/events'));
app.use('/api/messaging', require('./routes/messaging'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/storage', require('./routes/storage'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SpeedNation API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
