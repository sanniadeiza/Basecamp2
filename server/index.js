require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const threadRoutes = require('./routes/threads');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  contentSecurityPolicy: false, // Set to false if you have trouble with React scripts
}));
app.use(compression());
app.use(morgan('dev'));

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/messages', messageRoutes);

// Serve React root
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*all', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
});

// Error fallback
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
