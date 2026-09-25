const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');

function load(storage=new Map()){
  const context={localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}};vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes/asset-edition.js'),'utf8')+';globalThis.edition=HexAssetEdition;',context);
  return context.edition;
}

test('asset edition defaults to normal and prefers sakura models with fallback once chosen',()=>{
  const storage=new Map(),edition=load(storage),changes=[];edition.onChange(value=>changes.push(value));
  assert.equal(edition.get(),'normal');assert.deepEqual([...edition.paths('tiles/tile_straight.glb')],['tiles/tile_straight.glb']);
  edition.set('sakura');assert.equal(edition.get(),'sakura');assert.deepEqual(changes,['sakura']);assert.equal(storage.get('hexAssetEdition'),'sakura');
  const available=new Set(['tiles/tile_straight.glb','tiles/tile_royalBend.glb','sakura/tiles/tile_royalBend.glb']);
  assert.deepEqual([...edition.paths('tiles/tile_royalBend.glb',available)],['sakura/tiles/tile_royalBend.glb','tiles/tile_royalBend.glb']);
  assert.deepEqual([...edition.paths('tiles/tile_straight.glb',available)],['tiles/tile_straight.glb'],'fehlende Sakura-Datei nutzt die normale');
  edition.set('unbekannt');edition.set('sakura');assert.deepEqual(changes,['sakura'],'ungültige oder gleiche Werte lösen nichts aus');
  assert.equal(load(storage).get(),'sakura','Wahl bleibt nach dem Neuladen erhalten');
});

test('every sakura model replaces an existing normal model of the same name',()=>{
  const root=path.join(__dirname,'../assets');
  for(const kind of ['tiles','towers','enemies','buildings','bases']){
    const dir=path.join(root,'sakura',kind);if(!fs.existsSync(dir))continue;
    for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.glb')))assert.ok(fs.existsSync(path.join(root,kind,file)),'sakura/'+kind+'/'+file+' hat kein normales Gegenstück');
  }
});

test('renderer and menu backdrop reach the edition by name, since const globals are not on globalThis',()=>{
  const context={};vm.createContext(context);vm.runInContext('const Probe=1;',context);assert.equal(context.Probe,undefined);
  for(const file of ['three-renderer.js','menu-backdrop.js']){
    const source=fs.readFileSync(path.join(__dirname,'../classes/'+file),'utf8');
    assert.doesNotMatch(source,/globalThis\.HexAssetEdition/,file);assert.match(source,/typeof HexAssetEdition!=='undefined'/,file);
  }
});
