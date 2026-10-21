/* Grafikstil der 3D-Modelle: 'normal' (assets/), 'sakura' (assets/sakura/) oder 'halloween' (assets/halloween/). Nur Darstellung, keine Spielregeln. */
const HexAssetEdition=(()=>{
  const KEY='hexAssetEdition',EDITIONS=['normal','sakura','halloween'],listeners=new Set();
  let current='normal';
  try{const stored=localStorage.getItem(KEY);if(EDITIONS.includes(stored))current=stored;}catch{/* Speicher nicht verfügbar */}
  function sync(){if(typeof document==='undefined')return;for(const el of document.querySelectorAll('[data-asset-edition]'))el.value=current;}
  function set(value){
    if(!EDITIONS.includes(value)||value===current)return;
    current=value;try{localStorage.setItem(KEY,value);}catch{/* Speichern nicht möglich */}
    sync();for(const fn of listeners)fn(value);
  }
  /** Ladereihenfolge für ein Modell relativ zu assets/: Datei der gewählten Edition (falls vorhanden) mit Rückfall auf die normale. */
  function paths(rel,available){if(current==='normal')return [rel];const own=current+'/'+rel;return !available||available.has(own)?[own,rel]:[rel];}
  if(typeof document!=='undefined'){
    document.addEventListener('change',e=>{if(e.target?.matches?.('[data-asset-edition]'))set(e.target.value);});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
  }
  return {EDITIONS,get:()=>current,set,paths,onChange(fn){listeners.add(fn);return ()=>listeners.delete(fn);}};
})();
