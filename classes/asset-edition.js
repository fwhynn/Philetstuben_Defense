/* Grafikstil der 3D-Modelle: 'normal' (assets/) oder 'sakura' (assets/sakura/). Nur Darstellung, keine Spielregeln. */
const HexAssetEdition=(()=>{
  const KEY='hexAssetEdition',EDITIONS=['normal','sakura'],listeners=new Set();
  let current='normal';
  try{if(localStorage.getItem(KEY)==='sakura')current='sakura';}catch{/* Speicher nicht verfügbar */}
  function sync(){if(typeof document==='undefined')return;for(const el of document.querySelectorAll('[data-asset-edition]'))el.value=current;}
  function set(value){
    if(!EDITIONS.includes(value)||value===current)return;
    current=value;try{localStorage.setItem(KEY,value);}catch{/* Speichern nicht möglich */}
    sync();for(const fn of listeners)fn(value);
  }
  /** Ladereihenfolge für ein Modell relativ zu assets/: Sakura-Datei (falls vorhanden) mit Rückfall auf die normale. */
  function paths(rel,available){const sakura='sakura/'+rel;return current==='sakura'&&(!available||available.has(sakura))?[sakura,rel]:[rel];}
  if(typeof document!=='undefined'){
    document.addEventListener('change',e=>{if(e.target?.matches?.('[data-asset-edition]'))set(e.target.value);});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
  }
  return {get:()=>current,set,paths,onChange(fn){listeners.add(fn);return ()=>listeners.delete(fn);}};
})();
