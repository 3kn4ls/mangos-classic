const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const accountRoutes = require('../routes/accounts');
const characterRoutes = require('../routes/characters');
const itemRoutes = require('../routes/items');
const serverRoutes = require('../routes/server');
const commandRoutes = require('../routes/commands');
const skillRoutes = require('../routes/skills');
const spellRoutes = require('../routes/spells');
const reputationRoutes = require('../routes/reputations');
const questRoutes = require('../routes/quests');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - needed when behind reverse proxy (Traefik/nginx)
// 1 means trust the first proxy (Traefik) in front of this app
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for internal health checks
  skip: (req) => req.path === '/health'
});
app.use('/api/', limiter);

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/commands', commandRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/spells', spellRoutes);
app.use('/api/reputations', reputationRoutes);
app.use('/api/quests', questRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`mangos-admin API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
