const { createServer } = require('vite');
const path = require('path');

async function start() {
  try {
    const root = path.resolve(__dirname, '../..');
    const server = await createServer({
      root: root,
      configFile: path.join(root, 'vite.config.ts'),
      server: {
        port: 3000,
        host: '0.0.0.0'
      }
    });
    await server.listen();
    console.log('Phong Hoc Tin Hoc Server is running on port 3000');
  } catch (e) {
    console.error('Error starting Vite server:', e);
  }
}

start();
