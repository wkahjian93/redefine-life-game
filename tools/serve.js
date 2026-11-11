// Local preview server for docs/ on port 5199: node tools/serve.js
const http = require('http'), fs = require('fs'), path = require('path');
const DOCS = path.join(__dirname, '..', 'docs'), PORT = 5199;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
http.createServer((req, res) => {
  // local-only helper used to save sample images during test runs: POST /__save?name=x.png with a data: URL body
  if (req.method === 'POST' && req.url.startsWith('/__save')) {
    const name = path.basename(new URL(req.url, 'http://x').searchParams.get('name') || 'sample.png');
    let body = ''; req.on('data', d => body += d); req.on('end', () => {
      const dir = path.join(__dirname, '..', 'samples'); fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), Buffer.from(body.split(',')[1], 'base64')); res.end('ok');
    }); return;
  }
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DOCS, path.normalize(p).replace(/^([\\/]\.\.)+/, ''));
  if (!f.startsWith(DOCS)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': (TYPES[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-cache' }); res.end(d);
  });
}).listen(PORT, () => console.log('REDEFINE Life Game on http://localhost:' + PORT));
