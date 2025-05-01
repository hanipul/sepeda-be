const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const scanRoutes = require('./routes/scanRoutes');

dotenv.config();
connectDB();

const app = express();

// ✅ JSON parser harus di atas logger
app.use(express.json());

// 🔥 GLOBAL LOGGER: Semua request masuk akan dicetak
app.use((req, res, next) => {
  console.log(`\n===== [${new Date().toISOString()}] ${req.method} ${req.originalUrl} =====`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  } else {
    console.log('No body.');
  }
  next();
});

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Mount routes
app.use('/users', userRoutes);
app.use('/sessions', sessionRoutes);
app.use('/scan', scanRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});




