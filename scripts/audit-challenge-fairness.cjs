/* Deterministic, DOM-free fairness audit. Uses real combat, costs, rewards and legal placement.
 * Expedition branches are chosen before the hidden objectives are known; adjustments require visibility.
 * Draft prioritizes damage, one frost tower and usable upgrades, never stockpiling unusable tickets.
 * No account, network or browser storage access; no resources injected.
 * node scripts/audit-challenge-fairness.cjs expedition 64 exp-fair
 * node scripts/audit-challenge-fairness.cjs draft 24 bag
 */
const fs=require('node:fs'),core=require('../headless-core.cjs'),c=core();
function simulateDraft(seed){
 const r=c.session.create({seed,runId:'audit',challengeDay:'2026-11-29',loadout:['archer','catapult','chain','freeze','mine']}),s=r.state;const slots=()=>[...s.map.values()].flatMap(t=>Array.from({length:t.slots},(_,index)=>({q:t.q,r:t.r,index}))).sort((a,b)=>Math.abs(a.q-1)+Math.abs(a.r-2)-Math.abs(b.q-1)-Math.abs(b.r-2));
 const deploy=()=>{const order=slots();for(const [type,n]of Object.entries(s.towerDraft.inventory))for(let i=0;i<n;i++){const p=order.find(p=>!s.map.get(p.q+','+p.r).towers[p.index]);if(p)c.towers.buy(s,type,[p]);}for(const p of order){const tw=s.map.get(p.q+','+p.r).towers[p.index];if(tw&&s.towerDraft.upgrades){const up=c.data.runUpgrades(s,tw)[0];if(up)c.towers.upgrade(s,p,up[0]);}}};let result,offers=[],hp=[];
 for(let w=1;w<=35;w++){
 while(s.towerDraft.picks){const existing=[...s.map.values()].flatMap(t=>t.towers).filter(Boolean),score=o=>o.kind==='upgrade'?(existing.filter(t=>t.type!=='freeze').length>=4&&c.towerDraft.eligible(s)&&s.towerDraft.upgrades===0?-1:8):o.kind==='repair'?9:o.type==='freeze'&&!existing.some(t=>t.type==='freeze')?-1:({flame:0,chain:1,necromancer:2,catapult:3,ballista:4,archer:5,mine:6,freeze:7}[o.type]);const choices=s.towerDraft.offers.map((o,i)=>({i,p:score(o)})).sort((a,b)=>a.p-b.p);offers.push({w,offers:s.towerDraft.offers,pick:choices[0].i});if(!c.towerDraft.choose(s,choices[0].i))throw Error('choose');deploy();}
 deploy();if(!c.flow.start(s,r.random))throw Error('start');let steps=0;do{result=c.session.advance(s,r.random,.05);}while(result==='running'&&++steps<20000);hp.push(s.hp);if(result!=='complete')break;c.session.acknowledge(s);
 }const row={seed:s.seed,won:!!s.challengeWon,wave:s.wave,hp,offers};return row;
}

function simulateExpedition(seed){
 const r=c.session.create({seed,runId:'audit',loadout:['archer','catapult','chain','freeze','mine'],challengeDay:'2026-11-22'}),s=r.state,[e,n,b]=[...s.landmarks.values()];const route=[];
 for(let q=1;q<e.q;q++)route.push({q,r:0,roads:q===2?[0,2,3]:q===3?[0,3,5]:[0,3]});
 // Choose the initial branches without knowing either hidden relic. Adjust only after reveal.
 for(let z=-1;z>n.r;z--)route.push({q:2,r:z,roads:n.q===1&&z===n.r+1?[3,5]:[2,5],requires:n});
 if(n.q===1)route.push({q:1,r:n.r+1,roads:[0,2],requires:n});
 for(let z=1;z<b.r;z++)route.push({q:3,r:z,roads:b.q===4&&z===b.r-1?[0,2]:[2,5],requires:b});
 if(b.q===4)route.push({q:4,r:b.r-1,roads:[3,5],requires:b});
 let next=0,result,hp=[];for(let wave=1;wave<=12&&!s.challengeWon;wave++){
  for(let i=0;i<2&&next<route.length;i++){const p=route[next++];if(p.requires&&c.exploration.visibility(s.map,p.requires)==='hidden')throw Error('Solver used a hidden relic');let command;for(let index=0;index<s.hand.length;index++)for(let rotation=0;rotation<6;rotation++){const card=c.data.CARD_LIBRARY[s.hand[index]];if(c.map.rotatedRoads(card,rotation).slice().sort().join()===p.roads.slice().sort().join())command={q:p.q,r:p.r,index,rotation};}if(!command||!c.session.place(s,r.random,command))throw Error('placement '+seed+' '+JSON.stringify(p));}
  const slots=[...s.map.values()].flatMap(t=>Array.from({length:t.slots},(_,index)=>({q:t.q,r:t.r,index}))).sort((a,b)=>Math.abs(a.q-1)+Math.abs(a.r)-Math.abs(b.q-1)-Math.abs(b.r));
  if(wave>1)for(const p of slots){const tw=s.map.get(p.q+','+p.r).towers[p.index];if(tw&&tw.type!=='freeze'){const up=c.data.runUpgrades(s,tw)[0];if(up)c.towers.upgrade(s,p,up[0]);}}
  const types=['catapult','freeze','archer','ballista','mine','catapult','archer','ballista'];let towers=[...s.map.values()].flatMap(t=>t.towers).filter(Boolean);
  while(towers.length<types.length){const p=slots.find(p=>!s.map.get(p.q+','+p.r).towers[p.index]);if(!p||!c.towers.buy(s,types[towers.length],[p]).ok)break;towers=[...s.map.values()].flatMap(t=>t.towers).filter(Boolean);}
  for(const p of slots){const tw=s.map.get(p.q+','+p.r).towers[p.index];if(tw){const up=c.data.runUpgrades(s,tw)[0];if(up)c.towers.upgrade(s,p,up[0]);}}
  if(!c.expedition.finishPlanning(s)||!c.flow.start(s,r.random))throw Error('start');let steps=0;do{result=c.session.advance(s,r.random,.05);}while(result==='running'&&++steps<20000);hp.push(s.hp);if(result!=='complete')break;
 }
 const row={seed:s.seed,won:!!s.challengeWon,wave:s.wave,hp,placements:route.length,relics:s.expedition.collected.length};return row;
}


module.exports={simulateDraft,simulateExpedition};
if(require.main===module){
 const [kind='expedition',n='12',prefix='fairness']=process.argv.slice(2),count=Number(n);
 if(!['draft','expedition'].includes(kind)||!Number.isInteger(count)||count<1||count>1000||!/^[a-zA-Z0-9_-]+$/.test(prefix))throw Error('Usage: expedition|draft count(1..1000) seed-prefix');
 const results=[];fs.mkdirSync('.local',{recursive:true});
 for(let i=0;i<count;i++){const row=(kind==='draft'?simulateDraft:simulateExpedition)(prefix+'-'+i);results.push(row);console.log(row.seed,row.won?'WIN':'LOSS','wave',row.wave,'hp',row.hp.at(-1));fs.writeFileSync('.local/fairness-'+kind+'-'+prefix+'.json',JSON.stringify(results,null,2));}
 console.log(results.filter(r=>r.won).length+'/'+count+' wins');if(results.some(r=>!r.won))process.exitCode=1;
}
