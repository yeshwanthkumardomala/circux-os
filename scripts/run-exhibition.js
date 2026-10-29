const { spawn } = require('child_process');

const children = [
  spawn(process.execPath, ['relay-server.js'], { stdio: 'inherit', env: process.env }),
  spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '-p', '3000'], { stdio: 'inherit', env: process.env }),
];

console.log('Circux exhibition mode: workspace http://localhost:3000/display · relay http://localhost:3002');
function stop() { children.forEach(child => child.kill()); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach(child => child.on('exit', code => { if (code && code !== 0) process.exitCode = code; }));
children.forEach(child => child.on('error', error => { console.error(`Exhibition process failed: ${error.message}`); process.exitCode = 1; }));
