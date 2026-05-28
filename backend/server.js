const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables immediately
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const authRoutes = require('./routes/authRoutes');

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/api/auth', authRoutes);

// Strict MongoDB Connection Configuration
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Successfully!'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error Details:');
    console.error(err.message);
    process.exit(1); // Stop server execution if database connection fails
  });

// Test Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Backend Engine is Active and Healthy!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running smoothly on port ${PORT}`);
});