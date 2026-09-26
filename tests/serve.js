// Tiny static server that mounts a folder under a URL prefix, the way
// GitHub Pages serves a project site at /<repo-name>/.
//   node tests/serve.js [dir] [prefix]    ->  http://localhost:8000/Personal-Site/
const http = require('http');
const fs = require('fs');
const path = require('path');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
};

function startServer(root, prefix = '/Personal-Site/', port = 0) {
  root = path.resolve(root);
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (!url.startsWith(prefix)) { res.writeHead(404); return res.end('outside prefix'); }
    let file = path.join(root, url.slice(prefix.length));
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (url.endsWith('/')) file = path.join(file, 'index.html');
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise(resolve => server.listen(port, () => resolve({
    url: `http://localhost:${server.address().port}${prefix}`,
    close: () => new Promise(r => server.close(r)),
  })));
}

module.exports = { startServer };

if (require.main === module) {
  const [dir = 'dusk', prefix = '/Personal-Site/'] = process.argv.slice(2);
  startServer(dir, prefix, 8000).then(s => console.log('serving', dir, 'at', s.url));
}
