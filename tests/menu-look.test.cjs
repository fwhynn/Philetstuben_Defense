const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const look=()=>import('../classes/menu-look.mjs');
const inventory=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/index.json'),'utf8')));

test('menu look only uses decor models that exist in the asset inventory',async()=>{
 const {LOOK_FILES}=await look();
 assert.ok(LOOK_FILES.length>=8);
 for(const file of LOOK_FILES)assert.ok(inventory.has(file+'.glb'),file);
});

test('forest, rocks and bushes stay off the maps and on the meadow, with a dense forest edge at the back',async()=>{
 const {scatterDecor,GROUND_X,GROUND_BACK,GROUND_FRONT}=await look();
 const islands=[{x:-9,z:2.6,r:4.2},{x:9,z:2.6,r:4.2}],spots=scatterDecor(islands);
 assert.deepEqual(spots,scatterDecor(islands),'gleiche Streuung bei jedem Aufbau');
 for(const s of spots){
  for(const i of islands)assert.ok(Math.hypot(s.x-i.x,s.z-i.z)>i.r,s.kind+' steht auf einer Karte');
  assert.ok(Math.abs(s.x)<GROUND_X&&s.z>=GROUND_BACK-.6&&s.z<=GROUND_FRONT,s.kind+' außerhalb der Wiese');
  assert.ok(s.scale>0);
 }
 const edge=spots.filter(s=>s.z<GROUND_BACK+2.2&&/pine|tree/.test(s.kind));
 assert.ok(edge.length>=150,'Waldrand hinten: '+edge.length);
 for(const kind of ['rock_a','rock_b','bush'])assert.ok(spots.some(s=>s.kind===kind),kind);
 // Kranz direkt um jede Karte
 for(const i of islands)assert.ok(spots.filter(s=>Math.hypot(s.x-i.x,s.z-i.z)<i.r+1.3).length>=15);
});

test('torches flank the castle gate and the back wall on the castle tile',async()=>{
 const {torchSpots}=await look();
 for(let exit=0;exit<6;exit++){
  const spots=torchSpots(exit,1.1),dir=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]][exit],gate=Math.atan2(1.5*dir[1],Math.sqrt(3)*(dir[0]+dir[1]/2));
  assert.equal(spots.length,4);
  for(const s of spots)assert.ok(Math.hypot(s.x,s.z)<1.1*.87,'auf der Kachel');
  const angle=s=>Math.abs(Math.atan2(Math.sin(Math.atan2(s.z,s.x)-gate),Math.cos(Math.atan2(s.z,s.x)-gate)));
  assert.ok(angle(spots[0])<.6&&angle(spots[1])<.6,'zwei am Tor');
  assert.ok(angle(spots[2])>2&&angle(spots[3])>2,'zwei hinten');
 }
});

test('the draft bar offers the classic look for comparison and the backdrop falls back to it',()=>{
 const variant=fs.readFileSync(path.join(__dirname,'../classes/menu-variant.js'),'utf8'),backdrop=fs.readFileSync(path.join(__dirname,'../classes/menu-backdrop.js'),'utf8');
 assert.match(variant,/LOOKS=\{pracht:'Pracht',klassisch:'Klassisch'\}/);assert.match(variant,/dataset\.menuLook=look/);
 assert.match(backdrop,/dataset\.menuLook!=='klassisch'/);assert.match(backdrop,/if\(!look\)\{\s*scene\.add\(new THREE\.HemisphereLight/);
});

test('post-processing never draws twice into a multisampled target', ()=>{
 // three.js verwirft den MSAA-Puffer nach jedem Rendern; ein zweiter Durchgang darauf ergab schwarze bzw. durchsichtige Flächen.
 const source=fs.readFileSync(path.join(__dirname,'../classes/menu-look.mjs'),'utf8');
 assert.doesNotMatch(source,/\.clear=false/);
 assert.match(source,/new EffectComposer\(renderer,new THREE\.WebGLRenderTarget\(1,1,\{type:THREE\.HalfFloatType\}\)\)/);
 assert.match(source,/scene\.background=skyTarget\.texture/);
});

test('colour grading clamps channels after saturation so pow() never sees negative values', ()=>{
 // Sattes Grün mit kaum Blau ging nach der Sättigung unter 0; pow() ergab NaN und schwarze Flächen auf Wiese und Festung.
 const source=fs.readFileSync(path.join(__dirname,'../classes/menu-look.mjs'),'utf8');
 const saturate=source.indexOf('col=max(mix(vec3(l),col,saturation),0.);'),contrast=source.indexOf('pow(col/.18');
 assert.ok(saturate>0&&contrast>saturate);
});
