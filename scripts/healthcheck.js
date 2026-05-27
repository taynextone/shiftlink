const http = require('http');
http.get('http://127.0.0.1:3000/api/v1/health', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      process.exit(json.status === 'healthy' || json.status === 'degraded' ? 0 : 1);
    } catch {
      process.exit(1);
    }
  });
}).on('error', () => process.exit(1));
