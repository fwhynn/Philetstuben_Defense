// Minimaler statischer Server für lokale Entwicklung (nötig, damit .glb-Dateien geladen werden können).
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path');
const root = __dirname, port = Number(process.env.PORT) || 8080;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8' };
function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  const values = {};
  for (const original of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = original.trim().replace(/^export\s+/, '');
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, '').trim();
    values[match[1]] = value;
  }
  return values;
}
function apiTarget() {
  const value = readEnv(path.join(root, '.env')).API_BASE_URL;
  if (!value) return null;
  const target = new URL(value);
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) throw Error('API_BASE_URL must be an http(s) URL without credentials');
  const targetPort = Number(target.port || (target.protocol === 'https:' ? 443 : 80));
  if (['localhost', '127.0.0.1', '::1'].includes(target.hostname) && targetPort === port) {
    throw Error(`API_BASE_URL (${target.origin}) darf nicht derselbe Port wie der Client-Server (${port}) sein. Starte die API z. B. auf 8081.`);
  }
  return target;
}
const localApi = apiTarget();
// Liste aller .glb-Modelle unter assets/, damit der Renderer nur vorhandene Dateien lädt (keine 404-Fehler für optionale Modelle).
function listModels(dir = path.join(root, 'assets'), base = '', out = []) {
  for (const entry of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
    const rel = base ? base + '/' + entry.name : entry.name;
    if (entry.isDirectory()) listModels(path.join(dir, entry.name), rel, out); else if (/.glb$/i.test(entry.name)) out.push(rel);
  }
  return base === '' ? out.sort() : out;
}
function writeIndex() {
  const dir = path.join(root, 'assets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(listModels()));
}
writeIndex();
if (process.argv.includes('--write-index')) process.exit(0);
function proxyApi(req, res, url) {
  const suffix = url.pathname.slice('/api'.length) || '/';
  const base = localApi.pathname.replace(/\/$/, '');
  const headers = { ...req.headers, host: localApi.host };
  delete headers.connection;
  const upstream = (localApi.protocol === 'https:' ? https : http).request({
    protocol: localApi.protocol, hostname: localApi.hostname, port: localApi.port,
    method: req.method, path: (base + suffix || '/') + url.search, headers
  }, response => {
    const responseHeaders = { ...response.headers };
    delete responseHeaders.connection;
    res.writeHead(response.statusCode || 502, responseHeaders);
    response.pipe(res);
  });
  upstream.on('error', error => {
    if (res.headersSent) return res.destroy(error);
    res.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ error: { message: 'Lokale API ist nicht erreichbar.' } }));
  });
  req.pipe(upstream);
}
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p; try { p = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
  if (localApi && (p === '/api' || p.startsWith('/api/'))) return proxyApi(req, res, url);
  if (p === '/runtime-config.js') {
    const config = localApi ? { apiBaseUrl: '/api' } : {};
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    return res.end(`globalThis.AUTOHEX_CONFIG=Object.freeze(${JSON.stringify(config)});`);
  }
  if (p.endsWith('/')) p += 'index.html';
  if (p === '/assets/index.json') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }); return res.end(JSON.stringify(listModels())); }
  if (p.split('/').some(part => part.startsWith('.'))) { res.writeHead(403); return res.end('Forbidden'); }
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(data);
  });
}).listen(port, () => console.log(`AutoHex TD: http://localhost:${port}/  (API: ${localApi ? localApi.origin : 'production'})`));
