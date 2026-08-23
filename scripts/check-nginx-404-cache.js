// Prüft nginx-Cache-Header auf einer 404-Antwort unter /assets/
const http = require('http');
http.get('http://nginx/assets/definitiv-nicht-vorhanden-xyz123.js', res => {
  console.log('STATUS:', res.statusCode);
  console.log('CACHE-CONTROL:', res.headers['cache-control']);
  console.log('EXPIRES:', res.headers.expires);
  process.exit(0);
}).on('error', e => { console.log('ERR', e.message); process.exit(1); });
