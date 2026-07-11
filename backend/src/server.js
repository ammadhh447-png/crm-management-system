const http = require('http');
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { initSocket } = require('./config/socket');
const { startAutomationScheduler } = require('./jobs/automation.scheduler');
const { port } = require('./config/env');

const startServer = async () => {
  await connectDatabase();
  const server = http.createServer(app);
  initSocket(server);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Kill the existing process or change PORT in .env`);
      console.error(`Run: netstat -ano | findstr :${port}  then  taskkill /PID <pid> /F`);
    } else {
      console.error('Server error:', err.message);
    }
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Socket.io ready for live notifications`);
    startAutomationScheduler();
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
