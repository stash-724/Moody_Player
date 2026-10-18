require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');

const PORT = process.env.PORT || 3000;

async function start() {
  // Don't accept requests until the database is reachable.
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
