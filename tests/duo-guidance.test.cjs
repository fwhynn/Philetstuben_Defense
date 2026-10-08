const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs'),{createRoom}=require('../server/duo-room.cjs'),{guide}=require('../classes/duo-game.js');
const loadout=['archer','catapult','chain','freeze','mine'];
function setup(seed){const room=createRoom({seed,loadouts:[loadout,loadout]}),seats=[room.connect(0),room.connect(1)];return {room,seats};}
function send(room,seat,action,payload){const v=room.view(seat.token);return room.receive(seat.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[seat.player].phase,action,payload});}
function opening(room,seat){const b=room.view(seat.token).boards[seat.player];for(let index=0;index<b.placements.length;index++)for(let rotation=0;rotation<6;rotation++){const cell=b.placements[index][rotation].find(c=>c.legal);if(cell)return {q:cell.q,r:cell.r,index,rotation};}}

test('team guidance tells each player what to do and why controls are locked',()=>{
 const {room,seats:[a,b]}=setup('guide');
 let g=guide(room.view(a.token));
 assert.equal(g.tone,'act');assert.equal(g.title,'Du bist dran: Hex legen');assert.equal(g.locked,false);assert.deepEqual([g.self.text,g.partner.text],['legt ein Hex','legt ein Hex']);
 assert.ok(send(room,a,'place',opening(room,a)).ok);
 g=guide(room.view(a.token));assert.equal(g.title,'Bauphase: Türme bauen');assert.equal(guide(room.view(b.token)).partner.text,'baut');
 assert.ok(send(room,a,'ready',{value:true}).ok);
 g=guide(room.view(a.token));assert.equal(g.tone,'wait');assert.equal(g.title,'Du bist bereit');assert.equal(g.locked,true);assert.equal(g.self.state,'ready');
 assert.ok(send(room,b,'place',opening(room,b)).ok);
 g=guide(room.view(b.token));assert.equal(g.partner.state,'ready');assert.match(g.text,/wartet auf dich/);
 assert.ok(send(room,b,'ready',{value:true}).ok);
 g=guide(room.view(a.token));assert.equal(g.tone,'combat');assert.equal(g.self.text,'kämpft');assert.equal(g.locked,false);
 const paused={...room.view(a.token),connection:{players:['connected','disconnected'],paused:true,expired:false,maintenance:false,remainingSeconds:95}};
 g=guide(paused);assert.equal(g.tone,'alert');assert.equal(g.locked,true);assert.equal(g.partner.state,'offline');assert.match(g.text,/95 s/);
 g=guide(room.view(a.token),1);assert.equal(g.title,'Du siehst die Partnerkarte');assert.equal(g.locked,true);
});

test('the shared screen shows the team bar and a card click plus field click sends a placement',()=>{
 const duo={real:true,calls:[]},ui=load({duo}),{room,seats:[a]}=setup('team-bar');
 duo.receive(room.view(a.token));
 const el=id=>ui.elements.get(id);
 assert.equal(el('duoTurn').classList.contains('hidden'),false);assert.equal(el('duoTurnTitle').textContent,'Du bist dran: Hex legen');
 assert.equal(el('duoSeatSelf').dataset.state,'todo');assert.equal(el('duoSeatPartnerText').textContent,'legt ein Hex');assert.equal(el('duoTeamHp').textContent,'♥ 40/40 gemeinsam');
 const s=duo.api.getState();el('hand').children[0].listeners.click();assert.equal(s.selectedCard,0);
 const cell=s.placements[0][0].find(c=>c.legal)||s.placements[0].flat().find(c=>c.legal);if(!s.placements[0][0].includes(cell))s.rotation=s.placements[0].findIndex(cells=>cells.includes(cell));
 ui.rendererCommands.placeTile(cell.q,cell.r);assert.equal(JSON.stringify(duo.calls.at(-1)),JSON.stringify({action:'place',payload:{q:cell.q,r:cell.r,index:0,rotation:s.rotation}}));
 const paused=room.view(a.token);paused.connection={...paused.connection,players:['connected','disconnected'],paused:true,remainingSeconds:60};duo.receive(paused);
 assert.equal(el('duoTurn').dataset.tone,'alert');assert.equal(el('startWaveBtn').textContent,'Pausiert · Partner fehlt');
});
