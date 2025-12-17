const http = require('http');

const host = process.env.API_HOST || process.env.VITE_BACKEND_HOST || '127.0.0.1';
const port = process.env.API_PORT || process.env.VITE_BACKEND_PORT || process.env.PORT || '3001';
const path = process.env.API_PATH || '/api';

const url = `http://${host}:${port}${path}`;

http.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => { console.log(data); process.exit(0); });
}).on('error', err => { console.error('ERR', err.message); process.exit(1); });
