const multer = require('multer');

function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
