const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '=====================================================');
console.log('\x1b[32m%s\x1b[0m', '🌱 SMART FEED & SILAGE QUALITY ANALYZER (SIH 26111) 🌱');
console.log('\x1b[36m%s\x1b[0m', '   Ministry of Fisheries, Animal Husbandry & Dairying');
console.log('\x1b[36m%s\x1b[0m', '=====================================================\n');

// Start backend server
const server = spawn('node', ['server/server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Start frontend client
const client = spawn('npm', ['run', 'dev', '--prefix', 'client'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\nShutting down servers...');
  server.kill();
  client.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
