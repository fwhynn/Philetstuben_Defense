/* DOM adapter. Transactions are saved before the result is rendered. */
const HexAugmentCardsUI=(()=>{
 function render(root,profile,save,transact){
  let host=root.querySelector?.('#augmentCardCollection');
  if(!host){host=document.getElementById('augmentCardCollection');if(!host?.parentNode){host=document.createElement('section');host.id='augmentCardCollection';root.querySelector?.('.loadoutBox')?.appendChild(host);}}

  if(!host)return;
  const eligible=HexAugmentCards.unlocked(profile);
  root.classList.toggle('augmentsOpen',eligible&&!!root._augmentsOpen);
  let toggle=root.querySelector?.('#augmentCollectionToggle');
  if(!toggle){toggle=document.createElement('button');toggle.id='augmentCollectionToggle';root.querySelector?.('.arsenalToolbar')?.appendChild(toggle);}
  toggle.hidden=!eligible;toggle.textContent=root._augmentsOpen?'Türme & Gebäude':HexAugmentCards.clean(profile.augmentCards).introSeen?'Augment-Karten':'Neu · Augment-Karten';toggle.setAttribute('aria-pressed',String(!!root._augmentsOpen));
  toggle.onclick=()=>{root._augmentsOpen=!root._augmentsOpen;render(root,profile,save,transact);};
  host.replaceChildren();host.className='augmentCollection';host.hidden=!eligible||!root._augmentsOpen;if(host.hidden)return;
  const a=HexAugmentCards.clean(profile.augmentCards),h=document.createElement('h2');h.textContent='Augment-Karten';host.appendChild(h);
  const intro=document.createElement('p');intro.textContent='Standard / zwei Fronten / Duo · Vor dem Run ausrüsten · '+a.equipped.length+'/'+HexAugmentCards.slots(profile)+' Plätze. Nächste Plätze: Welle 20, 25, 35 und 50 abgeschlossen. Höchste besessene Seltenheit wird ausgerüstet. Laufende Runs bleiben unverändert.';host.appendChild(intro);
  const status=document.createElement('p');status.setAttribute('role','status');
  let busy=false;
  const commit=async(fn,operation)=>{if(busy)return;busy=true;if(operation.kind==='buy')root._augmentRevealPacks=a.packs+1;const buttons=[...host.querySelectorAll('button')],disabled=buttons.map(b=>b.disabled);buttons.forEach(b=>b.disabled=true);status.textContent='Wird gespeichert …';try{if(transact)await transact(operation,fn);else save(fn());}catch(e){delete root._augmentRevealPacks;status.textContent=e.message;}finally{busy=false;buttons.forEach((b,i)=>b.disabled=disabled[i]);}};
  const buy=document.createElement('button');buy.textContent='Booster öffnen · 50 ◆ · 2 Karten';buy.disabled=profile.diamonds<50;
  buy.addEventListener('click',()=>{commit(()=>HexAugmentCards.buy(profile,()=>{const buffer=new Uint32Array(1);crypto.getRandomValues(buffer);return buffer[0]/4294967296;}),{kind:'buy'});});host.appendChild(buy);
  const odds=document.createElement('p');odds.className='hint';odds.textContent='Gewöhnlich 60 % · Ungewöhnlich 25 % · Selten 10 % · Episch 4 % · Legendär 1 %. Spätestens jedes 10. Paket enthält Selten oder besser. Nur verfügbare Türme und Basis/Gebäude. Drei gleiche Karten gleicher Seltenheit → nächsthöhere Seltenheit.';
  host.appendChild(odds);
  if(!a.introSeen){const welcome=document.createElement('aside');welcome.className='augmentWelcome';
   const title=document.createElement('h3');title.textContent='Neu: Deine Augment-Sammlung';welcome.appendChild(title);
   const help=document.createElement('p');help.textContent='Öffne ein Paket mit zwei Karten, rüste eine Karte aus und starte deinen nächsten Run. Drei gleiche Karten kannst du zu einer stärkeren verschmelzen. Die Karten bleiben dauerhaft in deiner Sammlung.';welcome.appendChild(help);
   const seen=document.createElement('button');seen.textContent='Verstanden';seen.addEventListener('click',()=>{if(busy)return;try{save({...profile,augmentCards:{...a,introSeen:true}});}catch(e){status.textContent=e.message;}});welcome.appendChild(seen);host.appendChild(welcome);
  }
  if(a.lastPack.length){const result=document.createElement('div'),fresh=root._augmentRevealPacks===a.packs;result.className='augmentPackResult'+(fresh?' augmentReveal':'');if(fresh)delete root._augmentRevealPacks;
   result.setAttribute('aria-live','polite');const caption=document.createElement('h3');caption.textContent=fresh?'Deine neuen Karten':'Zuletzt erhalten';result.appendChild(caption);
   const cards=document.createElement('div');cards.className='augmentPackCards';
   for(const [i,c] of a.lastPack.entries()){const tile=document.createElement('article');tile.className='augmentCard augmentPackCard';tile.dataset.tier=String(c.tier);tile.dataset.order=String(i);
    const symbol=document.createElement('span');symbol.className='augmentCardSymbol';symbol.setAttribute('aria-hidden','true');symbol.textContent=HexAugmentCards.catalog[c.id].icon;tile.appendChild(symbol);
    const name=document.createElement('h3');name.textContent=HexAugmentCards.catalog[c.id].name;tile.appendChild(name);
    const rarity=document.createElement('strong');rarity.textContent=HexAugmentCards.rarities[c.tier];tile.appendChild(rarity);
    const effect=document.createElement('p');effect.textContent=HexAugmentCards.describe(c.id,c.tier);tile.appendChild(effect);cards.appendChild(tile);
   }result.appendChild(cards);host.appendChild(result);
  }
  const grid=document.createElement('div');grid.className='augmentGrid';
  for(const [id,def] of Object.entries(HexAugmentCards.catalog)){
   const t=HexAugmentCards.tier(a.cards,id),card=document.createElement('article');card.className='augmentCard';card.dataset.tier=String(t);card.classList.toggle('equipped',a.equipped.includes(id));
   const title=document.createElement('h3');title.textContent=def.icon+' '+def.name+' · '+(id==='base'?'Basis':typeof HexData!=='undefined'?HexData.TOWERS[id]?.name||({house:'Haus',forge:'Schmiede',market:'Markt'})[id]:id);card.appendChild(title);
   const desc=document.createElement('p');desc.textContent=t<0?'Noch nicht gesammelt. '+HexAugmentCards.describe(id,0):HexAugmentCards.rarities[t]+' · '+HexAugmentCards.describe(id,t);card.appendChild(desc);
   if(t>=0){const use=document.createElement('button');use.textContent=a.equipped.includes(id)?'Ablegen':'Ausrüsten';use.setAttribute('aria-pressed',String(a.equipped.includes(id)));use.disabled=!a.equipped.includes(id)&&a.equipped.length>=HexAugmentCards.slots(profile);use.addEventListener('click',()=>commit(()=>HexAugmentCards.equip(profile,id),{kind:'equip',card:id}));card.appendChild(use);
    for(let tier=0;tier<5;tier++){const count=a.cards[id][tier];if(!count)continue;const row=document.createElement('div');row.textContent=HexAugmentCards.rarities[tier]+' × '+count;
     if(tier<4){const fuse=document.createElement('button');fuse.textContent='3 → 1 '+HexAugmentCards.rarities[tier+1];fuse.disabled=count<3;fuse.addEventListener('click',()=>commit(()=>HexAugmentCards.fuse(profile,id,tier),{kind:'fuse',card:id,tier}));row.appendChild(fuse);}card.appendChild(row);}
   }grid.appendChild(card);
  }
  host.appendChild(grid);host.appendChild(status);
 }
 return {render};
})();
