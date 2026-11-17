'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
const {access}=require('./duo-access.cjs');
const runningRuleset=require('../package.json').version, deliveryGold=require('../headless-core.cjs')().duo.DELIVERY.gold;
const assets = new Set(["classes/profile.js", "classes/translations.js", "classes/i18n.js", "duo-lobby.html", "duo-lobby.js", "duo-prototype.html", "classes/duo-prototype.js", "duo-client.js", "classes/random.js", "classes/biomes.js", "classes/data.js", "classes/map.js", "classes/heroes.js", "classes/waves.js", "classes/exploration.js", "classes/placement-commands.js", "classes/run-flow.js", "classes/run-session.js", "classes/buildings.js", "classes/tower-commands.js", "classes/deck.js", "classes/rewards.js", "classes/combat.js", "classes/detour.js", "classes/villages.js", "classes/power-grid.js", "classes/expedition.js", "classes/tower-draft.js", "classes/moving-fortress.js", "classes/run-runtime.js", "classes/run-snapshot.js", "classes/duo-session.js", "classes/camera.js", "classes/svg-renderer.js"]);
// Behind nginx/Caddy the socket address is the proxy; only then is the forwarded client address trustworthy.
function clientAddress(req, trustProxy) {
  const socket = req.socket.remoteAddress || '';
  if (!trustProxy && !/^(127\.|::1$|::ffff:127\.)/.test(socket)) return socket;
  const real = String(req.headers['x-real-ip'] || '').trim(), forwarded = String(req.headers['x-forwarded-for'] || '').split(',').map(part => part.trim()).filter(Boolean);
  return real || forwarded[forwarded.length - 1] || socket;
}
// Guest saves supply catalog identifiers only. Account augments always come from the account API.
async function guestProgress(req){
  let length=0;const chunks=[];
  for await(const chunk of req){length+=chunk.length;if(length>8192)throw Error('Guest selection too large');chunks.push(chunk);}
  if(!length)return null;
  const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const ids=(values,max)=>Array.isArray(values)&&values.length<=max&&values.every(id=>typeof id==='string'&&/^[A-Za-z0-9:_-]{1,80}$/.test(id));
  if(!data||typeof data!=='object'||!ids(data.towers,16)||!ids(data.loadout,5)||!ids(data.milestones,2)||!ids(data.unlocks,32))throw Error('Invalid guest selection');
  return {activeHero:typeof data.hero==='string'?data.hero:'standard',difficulty:data.difficulty,unlockedTowers:data.towers,activeLoadout:data.loadout,milestones:data.milestones,unlocks:data.unlocks};
}
function createTransport(room, { browser = false, autoTick = false, publicOrigin = null, liveSecret = null, visits = null, verifyAdmin = null, trustProxy = false, rankingOptions = {}, loadAugmentProfile = null } = {}) {
  const rankings = require('./leaderboard-http.cjs').createLeaderboardHandler(rankingOptions);
  let closing = false; const attempts = new Map();
  const server = http.createServer(async (req, res) => {
    const send = (status, value) => { if (res.writableEnded) return; const body = JSON.stringify(value), headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Accept-Encoding' }; if (body.length > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) { res.writeHead(status, { ...headers, 'Content-Encoding': 'gzip' }); return res.end(zlib.gzipSync(body)); } res.writeHead(status, headers); res.end(body); };
    try {
    if (closing) return send(503, { error: 'server-restarting' });
    const origin = req.headers.origin;
    if (origin && (!browser || origin !== (publicOrigin || 'http://' + req.headers.host))) return send(403, { error: 'cross-origin-disabled' });
    if (await rankings(req, send)) return;
    if (browser && req.method === 'GET') {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      const file = pathname === '/' ? (room.create ? 'duo-lobby.html' : 'duo-prototype.html') : pathname.slice(1);
      const publicFile = ['patch-notes.json', 'runtime-config.js', 'index.html', 'admin.html', 'style.css', 'duo.css', 'hexwerk.css', 'hexwerk-pages.css', 'admin.css', 'leaderboard.html', 'leaderboard.css'].includes(file) || file.startsWith('classes/') && /^[a-z0-9-]+\.js$/.test(file.slice(8)) || (file.startsWith('assets/') || file.startsWith('node_modules/three/')) && !file.split('/').some(part => part.startsWith('.') || part.includes('\\'));
      if (publicFile) { const resolved = path.resolve(root, file); if (!resolved.startsWith(root + path.sep)) return send(403, { error: 'forbidden' }); fs.readFile(resolved, (error, data) => { if (error) return send(404, { error: 'not-found' }); const ext = path.extname(file), mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary' }[ext] || 'application/octet-stream'; res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(data); }); return; }
      if (assets.has(file)) { res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' }); return res.end(fs.readFileSync(path.join(root, file))); }
    }
    if (req.method === 'GET' && req.url === '/healthz') return send(room.healthy === false ? 503 : 200, { ok: room.healthy !== false, service: 'autohex-duo', ruleset: runningRuleset, deliveryGold, simulationWorkers: room.workerCount ?? 1, maintenance: !!room.maintenance });
    if (req.method === 'GET' && req.url === '/live') {
      if (typeof liveSecret !== 'string' || liveSecret.length < 16 || typeof room.live !== 'function') return send(404, { error: 'not-found' });
      const supplied = String(req.headers['x-duo-live-secret'] || ''), expected = Buffer.from(liveSecret), actual = Buffer.from(supplied);
      if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return send(401, { error: 'unauthorized' });
      if (room.healthy === false) return send(503, { ok: false, error: 'storage-unavailable' });
      return send(200, { ok: true, ...await room.live() });
    }
    if (visits && req.method === 'POST' && req.url === '/visit') {
      // Counting is best effort and must never disturb Duo matches.
      let length = 0; const chunks = [];
      try { for await (const chunk of req) { length += chunk.length; if (length > 512) { req.resume(); return send(413, { error: 'too-large' }); } chunks.push(chunk); } const packet = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); const result = visits.record({ kind: packet?.kind, page: packet?.page, webdriver: packet?.webdriver === true, ip: clientAddress(req, trustProxy), userAgent: String(req.headers['user-agent'] || '').slice(0, 512), acceptLanguage: String(req.headers['accept-language'] || '') }); if (!result.ok) return send(400, { error: 'invalid-visit' }); res.writeHead(204, { 'Cache-Control': 'no-store' }); return res.end(); }
      catch { return send(400, { error: 'invalid-json' }); }
    }
    if (visits && req.method === 'GET' && req.url === '/visits') {
      const bearer = req.headers.authorization?.replace(/^Bearer /, '');
      if (!bearer || typeof verifyAdmin !== 'function') return send(401, { error: 'unauthorized' });
      let admin; try { admin = await verifyAdmin(bearer); } catch { return send(502, { error: 'account-api-unavailable' }); }
      return admin ? send(200, { ok: true, ...visits.stats() }) : send(403, { error: 'forbidden' });
    }
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    if (room.healthy === false) return send(503, { error: 'storage-unavailable' });
    if (req.method === 'GET' && req.url === '/results' && room.receipts) { const receipts = await room.receipts(token); return receipts ? send(200, { receipts }) : send(401, { error: 'unauthorized' }); }
    if(req.method==='POST'&&req.url==='/lobby/augments') {
      if(!token||!await room.hasSeat?.(token))return send(401,{error:'unauthorized'});
      const clientId=req.headers['x-duo-client'],ownership=await room.claim?.(token,clientId);
      if(ownership&&!ownership.ok)return send(409,{error:ownership.reason});
      const key='augments:'+token,now=Date.now();
      if(now-(attempts.get(key)?.at||0)<1000)return send(429,{error:'rate-limit'});
      attempts.set(key,{at:now,count:1});
      const accountToken=req.headers['x-account-token'];let guest=null;
      if(!accountToken){try{guest=await guestProgress(req);}catch{return send(400,{error:'invalid-guest-selection'});}}
      try {
        if(accountToken&&typeof loadAugmentProfile!=='function')return send(503,{error:'Augments sind auf diesem Duo-Server noch nicht verfügbar.'});
        const profile=accountToken?await loadAugmentProfile(accountToken):null;
        if(closing)return send(503,{error:'server-restarting'});
        const response=await access(room,token,clientId,'/augments',{profile,guest});return send(response.status,response.body);
      }catch{return send(503,{error:'Account-Augments konnten nicht geladen werden. Bitte erneut versuchen.'});}
    }
    const lobbyAction = req.method === 'POST' && room.create && ['/lobby/create', '/lobby/join'].includes(req.url);
    if (!lobbyAction && (!token || !await (room.hasSeat?room.hasSeat(token):room.view(token)))) return send(401, { error: 'unauthorized' });
    if (lobbyAction) { const ip = req.socket.remoteAddress, time = Date.now(), old = attempts.get(ip); if (!old || time - old.at > 60000) attempts.set(ip, { at: time, count: 1 }); else if (++old.count > 20) return send(429, { error: 'rate-limit' }); if (attempts.size > 1024) for (const [key, value] of attempts) if (time - value.at > 60000) attempts.delete(key); }
    const sessionAction = req.method === 'POST' && req.url === '/session' && room.claim, clientId = req.headers['x-duo-client'];
    if (req.method === 'GET' && req.url === '/state') { const response=await access(room,token,clientId,'/state');return send(response.status,response.body); }
    if (!lobbyAction && !sessionAction && (req.method !== 'POST' || req.url !== '/command')) return send(404, { error: 'not-found' });
    let length = 0, chunks = [];
    try {
      for await (const chunk of req) { length += chunk.length; if (length > 8192) { send(413, { error: 'too-large' }); req.resume(); return; } chunks.push(chunk); }
      if (closing) return send(503, { error: 'server-restarting' });
      const packet=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if(lobbyAction)return send(200,await (req.url==='/lobby/create'?room.create(packet):room.join(packet)));
      const response=await access(room,token,clientId,sessionAction?'/session':'/command',packet);
      send(response.status,response.body);
    } catch { send(room.healthy === false ? 503 : 400, { error: room.healthy === false ? 'storage-unavailable' : 'invalid-json' }); }
    } catch { send(503,{error:'storage-unavailable'}); }
  });
  const io = require('./duo-sockets.cjs').attachSockets(server, room, { browser, publicOrigin, isClosing: () => closing });
  server.quiesce = () => { closing = true; clearInterval(timer); io.engine.close(); return room.stopTicks?.(); };
  server.requestTimeout = 5000; server.headersTimeout = 5000;
  let timer; server.on('listening', () => { if (!autoTick) return; if(room.startTicks){room.startTicks().catch(()=>{});return;} let last = performance.now(), debt = 0; timer = setInterval(() => { const now = performance.now(); debt = Math.min(1000, debt + now - last); last = now; let count = 0; while (debt >= 50 && count++ < 5) { room.tick(); debt -= 50; } }, 25); }); server.on('close', () => {clearInterval(timer);room.stopTicks?.().catch(()=>{});});
  server.on('close', () => io.engine.close());
  return server;
}
module.exports = { createTransport };
