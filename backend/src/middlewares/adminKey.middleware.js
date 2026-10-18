const crypto = require('crypto');

// Hash both sides so timingSafeEqual always compares equal-length buffers.
function sha256(value) {
  return crypto.createHash('sha256').update(value).digest();
}

function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return res.status(503).json({ message: 'Uploads are disabled on this server' });
  }

  const provided = req.get('x-admin-key') || '';
  if (!crypto.timingSafeEqual(sha256(provided), sha256(expected))) {
    return res.status(401).json({ message: 'Invalid or missing admin key' });
  }
  next();
}

module.exports = requireAdminKey;
