// Prüft: setzt nginx 'expires 1y' auch auf Fehlerantworten (500/404) für /assets/?
const http = require('http');
http.get('http://nginx/assets/gibtsnicht.js', res => {
  console.log('STATUS:', res.statusCode);
  console.log('CACHE-CONTROL:', res.headers['cache-control']);
  console.log('EXPIRES:', res.headers.expires);
  process.exit(0);
}).on('error', e => { console.log('ERR', e.message); process.exit(1); });
