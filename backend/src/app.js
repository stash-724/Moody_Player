const express = require('express');
const cors = require('cors');
const songRoutes = require('./routes/song.routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// CORS_ORIGIN is a comma-separated allow-list; unset means allow any origin (local dev).
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
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
