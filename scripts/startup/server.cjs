const { createServer } = require('vite');
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'server.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line, 'utf8');
}

process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.stack || err}`);
});
process.on('unhandledRejection', (reason) => {
  log(`Unhandled Rejection: ${reason}`);
});
process.on('exit', (code) => {
  log(`Process exit with code: ${code}`);
});

async function start() {
  try {
    const root = path.resolve(__dirname, '../..');
    log(`Starting Vite server at root: ${root}`);
    const server = await createServer({
      root: root,
      configFile: path.join(root, 'vite.config.ts'),
      server: {
        port: 3000,
        host: '0.0.0.0'
      }
    });
    await server.listen();
    log(`Phong Hoc Tin Hoc Server is listening on port 3000`);
    
    // Prevent event loop from ever draining
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (e) {
    log(`Error starting Vite server: ${e.stack || e}`);
  }
}

start();
