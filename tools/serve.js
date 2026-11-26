// Local preview server for docs/ on port 5199: node tools/serve.js
const http = require('http'), fs = require('fs'), path = require('path');
const DOCS = path.join(__dirname, '..', 'docs'), PORT = 5199;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4' };
const isLocal = req => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const readBody = (req, cb) => { const chunks = []; req.on('data', d => chunks.push(d)); req.on('end', () => cb(Buffer.concat(chunks))); };

http.createServer((req, res) => {
  // local-only helper used to save sample images during test runs: POST /__save?name=x.png with a data: URL body
  if (req.method === 'POST' && req.url.startsWith('/__save?')) {
    if (!isLocal(req)) { res.writeHead(403); return res.end(); }
    const name = path.basename(new URL(req.url, 'http://x').searchParams.get('name') || 'sample.png');
    readBody(req, b => { const body = b.toString(); const dir = path.join(__dirname, '..', 'samples'); fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), Buffer.from(body.split(',')[1], 'base64')); res.end('ok'); }); return;
  }
  // local-only: save a narration recording from docs/record.html → docs/voice/<lang>/<key>.wav and list it in docs/voice/index.json
  if (req.url.startsWith('/__voice')) {
    if (!isLocal(req)) { res.writeHead(403); return res.end(); }
    const q = new URL(req.url, 'http://x').searchParams, lang = q.get('lang'), key = q.get('key');
    if (!/^(en|zh)$/.test(lang || '') || !/^[a-z0-9_]{2,40}$/.test(key || '')) { res.writeHead(400); return res.end('bad lang/key'); }
    const vdir = path.join(DOCS, 'voice'), idx = path.join(vdir, 'index.json');
    const index = fs.existsSync(idx) ? JSON.parse(fs.readFileSync(idx, 'utf8')) : { en: {}, zh: {} };
    if (req.method === 'DELETE') { const f = index[lang][key]; if (f) { try { fs.unlinkSync(path.join(vdir, lang, f)); } catch (e) {} delete index[lang][key]; fs.writeFileSync(idx, JSON.stringify(index, null, 1)); } return res.end('ok'); }
    if (req.method !== 'POST') { res.writeHead(405); return res.end(); }
    return readBody(req, b => {
      if (b.length < 1000 || b.slice(0, 4).toString() !== 'RIFF') { res.writeHead(400); return res.end('not a wav'); }
      fs.mkdirSync(path.join(vdir, lang), { recursive: true });
      const file = key + '.wav'; fs.writeFileSync(path.join(vdir, lang, file), b);
      index[lang][key] = file + '?v=' + Date.now().toString(36);     // version tag so phones fetch the new take
      fs.writeFileSync(idx, JSON.stringify(index, null, 1)); res.end('ok');
    });
  }
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DOCS, path.normalize(p).replace(/^([\\/]\.\.)+/, ''));
  if (!f.startsWith(DOCS)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    const type = TYPES[path.extname(f)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type + (type.startsWith('audio') ? '' : '; charset=utf-8'), 'Cache-Control': 'no-cache' }); res.end(d);
  });
}).listen(PORT, () => console.log('REDEFINE Life Game on http://localhost:' + PORT));
