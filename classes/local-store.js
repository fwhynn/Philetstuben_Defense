/* Account-scoped storage. Web Locks keep only one writable tab per profile. */
(() => {
  if (globalThis.HexLocalStore || globalThis.HexChallengeLab?.active || globalThis.HexFirstPlayerTest?.active || typeof localStorage === 'undefined') return;
  const environment = globalThis.HexApi?.baseUrl || 'https://api.autohextd.zlyfer.net';
  const prefix = 'autohex-store-v2:' + encodeURIComponent(environment) + ':';
  const legacyKeys = ['hex-bastion-profile-v1','autohex-solo-autosave-v1','hex-cloud-dirty','hex-cloud-last-sync','hex-bastion-profile-backup','hex-game-settings-v1','hex-arsenal-seen-v1','gameSpeed','hexGrid','slotHints','onboardingHints','tutorial-v1'];
  const scopes = new Map(); let scope = 'guest', notice;
  function showNotice() {
    if (typeof document === 'undefined') return;
    if (!entry() || entry().writable) { notice?.remove(); notice=null; return; }
    if (!notice) { notice=document.createElement('div');notice.setAttribute('role','alert');notice.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:12px;background:#462b14;color:white;text-align:center';document.body.appendChild(notice); }
    notice.textContent = !globalThis.navigator?.locks
      ? 'Speichern gesperrt: Dieser Browser stellt keine sichere Speichersperre bereit. Öffne das Spiel über HTTPS in einem aktuellen Browser.'
      : entry().invalid ? 'Speichern gesperrt: Der Browser-Speicher ist nicht verfügbar oder der Spielstand wurde außerhalb dieses Tabs geändert. Bitte lade die Seite neu.'
      : 'Nur-Lese-Modus: Ein anderer Spiel-Tab hält die Speichersperre. Schließe ihn. Die Sperre wird beim Zurückkehren automatisch erneut geprüft.';
  }
  async function retry() {
    const e=entry(); if(!e || e.writable || e.invalid || !globalThis.navigator?.locks)return;
    await navigator.locks.request(prefix+scope,{ifAvailable:true},async lock=>{
      if(!lock)return;
      try { if(localStorage.getItem(prefix+e.name)!==e.raw){e.invalid=true;return;} e.writable=true;showNotice();await new Promise(resolve=>{e.release=resolve;}); }
      catch { e.writable=false;e.invalid=true; }
      finally { e.writable=false;showNotice(); }
    });
    showNotice();
  }
  function entry() { return scopes.get(scope); }
  async function prepare(id = null) {
    const name = id == null ? 'guest' : 'user-' + String(id);
    if (scopes.has(name)) return scopes.get(name).ready;
    const e = { name, writable: false, raw: null, values: {}, release: null };
    scopes.set(name, e);
    e.ready = (async () => {
      // No unsafe fallback on browsers lacking an atomic cross-tab lock.
      if (globalThis.navigator?.locks) await new Promise(resolve => {
        navigator.locks.request(prefix + name, { ifAvailable: true }, async lock => {
          e.writable = !!lock; resolve();
          if (lock) await new Promise(release => { e.release = release; });
        }).catch(() => resolve());
      });
      try {
        e.raw = localStorage.getItem(prefix + name);
        if (e.raw) { const saved = JSON.parse(e.raw); if (saved.version !== 1 || !saved.values || typeof saved.values !== 'object' || Array.isArray(saved.values)) throw Error(); e.values = saved.values; }
        else if (name === 'guest' && environment === 'https://api.autohextd.zlyfer.net') {
          for (const key of legacyKeys) { const value = localStorage.getItem(key); if (value != null) e.values[key] = value; }
        }
      } catch { e.writable = false; e.invalid=true; }
    })();
    await e.ready;
  }
  function activate(id = null) {
    const name = id == null ? 'guest' : 'user-' + String(id);
    if (!scopes.has(name)) throw Error('Account-Speicher wurde nicht vorbereitet.');
    scope = name;
    showNotice();
  }
  function write(key, value) {
    const e = entry();
    if (!e?.writable || localStorage.getItem(prefix + scope) !== e.raw) {
      if (e) { e.writable = false; e.invalid=true; } showNotice();
      throw Error('Dieses Profil ist in einem anderen Tab geöffnet oder wurde geändert. Bitte den anderen Tab schließen und diese Seite neu laden.');
    }
    const values = {...e.values}; if (value == null) delete values[key]; else values[key] = String(value);
    const raw = JSON.stringify({version:1,values});
    localStorage.setItem(prefix + scope, raw); e.raw = raw; e.values = values;
  }
  const api = { prepare, activate, retry, get blocked(){return !entry()?.writable;}, get scope(){return scope;},
    getItem:key=>entry()?.values[key] ?? null, setItem:write, removeItem:key=>write(key,null) };
  globalThis.HexLocalStore = api;
  api.ready = (async () => { await prepare(); const user = globalThis.HexApi?.storedUserId?.(); if (user != null) { await prepare(user); activate(user); }
    showNotice();
  })();
  globalThis.addEventListener?.('pagehide',()=>{for(const e of scopes.values()){e.writable=false;e.release?.();e.release=null;}});
  globalThis.addEventListener?.('pageshow',()=>{retry().catch(()=>{});});
  globalThis.addEventListener?.('focus',()=>{retry().catch(()=>{});});
})();
