const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static('frontend/dist'));

// Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/projects', require('./backend/routes/projects'));
app.use('/api/tasks', require('./backend/routes/tasks'));
app.use('/api/admin', require('./backend/routes/admin'));

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)

  .then(() => console.log('MongoDB Connected successfully'))
  .catch(err => console.log('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));