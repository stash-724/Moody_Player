require('dotenv').config();
const dns = require('dns');

// Optional override for machines whose local resolver can't answer the SRV
// lookups that mongodb+srv:// URIs need (seen with Node on some Windows setups).
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()));
}

const app = require('./src/app');
const connectDB = require('./src/db/db');

const PORT = process.env.PORT || 3000;

async function start() {
  // Don't accept requests until the database is reachable.
  await connectDB();
  // Express 5 passes listen errors (e.g. EADDRINUSE) to this callback.
  app.listen(PORT, (err) => {
    if (err) {
      console.error(`Failed to listen on port ${PORT}:`, err.message);
      process.exit(1);
    }
    console.log(`Server is running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
