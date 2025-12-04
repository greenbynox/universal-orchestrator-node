const http = require('http');
http.get('http://localhost:3001/api', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => { console.log(data); process.exit(0); });
}).on('error', err => { console.error('ERR', err.message); process.exit(1); });
