/* Presentation only: all values are supplied by the existing combat definitions. */
const HexTowerView = (() => {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number(value.toFixed(2)).toLocaleString(globalThis.HexI18n?.getLanguage?.() === 'en' ? 'en-US' : 'de-DE', {maximumFractionDigits:2});
  function rows(def) {
    const result = [], add = (id, label, value, unit = '', lower = false) => result.push({id, label, value, unit, lower});
    if (def.aura) add('slow', 'Verlangsamung', (1 - def.slow) * 100, '%');
    else { const m = def.damageMultipliers || {hp:1, armor:1, magic:1}; for (const [id, label] of [['hp','Leben'],['armor','Rüstung'],['magic','Magieresistenz']]) add(id, label, def.damage * m[id]); }
    add('range', def.aura ? 'Wirkungsradius' : 'Reichweite', def.range);
    if (!def.aura) add('cooldown', def.mine ? 'Zeit zwischen Minen' : 'Schussabstand', def.cooldown, 's', true);
    if (def.splash) add('splash', 'Flächenradius', def.splash);
    if (def.chain) { add('chain', 'Blitzziele', def.chain); add('jumpRange', 'Sprungweite', def.jumpRange); }
    if (def.pierce) add('pierceTargets', 'Durchschlagziele', def.pierceTargets);
    if (def.hitSlow) { add('hitSlow', 'Treffer-Verlangsamung', (1 - def.hitSlow) * 100, '%'); add('slowDuration', 'Verlangsamungsdauer', def.slowDuration, 's'); }
    if (def.soulLimit) { add('soulLimit', 'Maximale Geister', def.soulLimit); add('soulDamage', 'Geisterschaden', def.soulDamage, '/s'); add('soulDuration', 'Geisterlebensdauer', def.soulDuration, 's'); }
    if (def.bossMultiplier) add('bossMultiplier', 'Boss-Schadensfaktor', def.bossMultiplier, '×');
    return result;
  }
  const value = row => row ? number(row.value) + (row.unit ? ' ' + row.unit : '') : '—';
  function summary(def) {
    const list = rows(def), primary = list.filter(r => ['hp','armor','magic','slow'].includes(r.id)), secondary = list.filter(r => ['range','cooldown'].includes(r.id));
    return '<div class="towerStatCaption">' + (def.aura ? 'Aura · kein Schaden' : def.mine ? 'Schaden pro Mine · aktuelle Werte' : 'Schaden pro Treffer · aktuelle Werte') + '</div><div class="towerDamageGrid">' + primary.map(r => '<div><span>' + r.label + '</span><strong>' + value(r) + '</strong></div>').join('') + '</div><div class="towerCoreStats">' + secondary.map(r => '<span>' + r.label + ' <b>' + value(r) + '</b></span>').join('') + '</div>';
  }
  function comparison(before, after) {
    const a = rows(before), b = rows(after), ids = [...new Set([...a, ...b].map(r => r.id))];
    return '<table class="towerValueTable"><caption>Alle Werte im Vergleich</caption><thead><tr><th scope="col">Wert</th><th scope="col">Aktuell</th><th scope="col">Danach</th></tr></thead><tbody>' + ids.map(id => {
      const old = a.find(r => r.id === id), next = b.find(r => r.id === id), row = next || old, delta = (next?.value || 0) - (old?.value || 0), tone = delta === 0 ? '' : (row.lower ? delta < 0 : delta > 0) ? 'better' : 'worse';
      return '<tr><th scope="row">' + row.label + '</th><td>' + value(old) + '</td><td class="' + tone + '">' + value(next) + '</td></tr>';
    }).join('') + '</tbody></table><p class="hint">Schussabstand: kleiner ist schneller. Aktive Einflüsse sind eingerechnet.</p>';
  }
  function details(def) { return '<dl class="towerValueList">' + rows(def).map(r => '<div><dt>' + r.label + '</dt><dd>' + value(r) + '</dd></div>').join('') + '</dl>'; }
  function tradeoff(before, after) {
    const hints = [];
    if (!before.aura && after.damage < before.damage) hints.push('Weniger Schaden je Ziel');
    if (!before.aura && after.cooldown > before.cooldown) hints.push(after.mine ? 'Langsamere Minenproduktion' : 'Langsamere Angriffe');
    if (after.range < before.range) hints.push('Kleinere Reichweite');
    if (after.chain < before.chain) hints.push('Weniger Blitzziele');
    if (after.slow > before.slow) hints.push('Schwächere Verlangsamung');
    return hints.join(' · ');
  }
  return {escape, number, rows, summary, comparison, details, tradeoff};
})();
