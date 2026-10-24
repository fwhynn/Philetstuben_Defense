/* Public practice sessions deliberately never use account storage or rewards. */
(()=>{
  const missions=[
    ['greed','Der Fluch der Gier','2026-12-13','Freiwillige Risiken gegen mehr Gold.'],
    ['detour','Die Kunst des Umwegs','2026-12-12','Plane Straßen um feste Türme. Fünf Angriffe.'],
    ['villages','Drei Dörfer','2026-12-11','Beschütze drei getrennte Lebensbalken.'],
    ['powerGrid','Stromnetz','2026-12-10','Verbinde Türme mit deinen Generatoren.'],
    ['expedition','Expedition ins Unbekannte','2026-12-09','Drei Relikte anschließen, dann eine Welle überleben. Frist: Welle 12.'],
    ['towerDraft','Turm-Draft','2026-12-08','Drei Angebote – entscheide dich für eines.'],
    ['movingFortress','Wandernde Festung','2026-12-07','Begleite die Festung über vier Stationen.'],
    ['caravan','Die letzte Karawane','2026-12-14','Überlebe zwanzig Wellen im Sandsturm.'],
    ['garrison','Die letzte Garnison','2026-12-15','Drei Angriffe, ein festes Goldbudget.']
  ].map(([id,name,day,description])=>({id,name,day,description}));
  const params=new URLSearchParams(location.search);
  const mission=missions.find(m=>m.id===params.get('challenge-lab'));
  const active=!!mission&&!new URLSearchParams(location.hash.slice(1)).has('duo');
  const prefix='autohex-challenge-lab-v1:'+mission?.id+':';
  const storage={getItem:key=>localStorage.getItem(prefix+key),setItem:(key,value)=>localStorage.setItem(prefix+key,String(value)),removeItem:key=>localStorage.removeItem(prefix+key)};
  globalThis.HexChallengeLab={active,mission,missions,storage};
})();
