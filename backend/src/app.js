const express = require('express');
const cors = require('cors');
const songRoutes = require('./routes/song.routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Browsers send origins as scheme://host[:port] with no trailing slash, and the match is
// exact, so tolerate the usual copy-paste extras (quotes, spaces, a trailing slash).
const normalizeOrigin = (o) => o.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');

// CORS_ORIGIN is a comma-separated allow-list; unset means allow any origin (local dev).
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(normalizeOrigin).filter(Boolean)
  : '*';

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/', songRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
