/* DOM adapter. Transactions are saved before the result is rendered. */
const HexAugmentCardsUI=(()=>{
 const SLOT_WAVES=[20,25,35,50];
 const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node;};
 const target=id=>id==='base'?'Basis':typeof HexData!=='undefined'&&HexData.TOWERS[id]?HexData.TOWERS[id].name:({house:'Haus',forge:'Schmiede',market:'Markt'})[id]||id;
 // Hexwerk: Symbol über data-augment (CSS ordnet Turm-/Gebäude-Icon zu), Seltenheit über data-tier.
 function cardHead(id,def){
  const head=el('div','augmentCardHead'),hex=el('span','augmentHex');hex.dataset.augment=id;hex.setAttribute('aria-hidden','true');head.appendChild(hex);
  const names=el('div','augmentCardNames');names.appendChild(el('h3','',def.name));names.appendChild(el('small','augmentTarget',target(id)));head.appendChild(names);return head;
 }
 function render(root,profile,save,transact){
  let host=root.querySelector?.('#augmentCardCollection');
  if(!host){host=document.getElementById('augmentCardCollection');if(!host?.parentNode){host=document.createElement('section');host.id='augmentCardCollection';root.querySelector?.('.loadoutBox')?.appendChild(host);}}

  if(!host)return;
  const eligible=HexAugmentCards.unlocked(profile);
  root.classList.toggle('augmentsOpen',eligible&&!!root._augmentsOpen);
  let toggle=root.querySelector?.('#augmentCollectionToggle');
  if(!toggle){toggle=document.createElement('button');toggle.id='augmentCollectionToggle';root.querySelector?.('.arsenalToolbar')?.appendChild(toggle);}
  const seen=HexAugmentCards.clean(profile.augmentCards).introSeen;
  toggle.hidden=!eligible;toggle.className='secondary';toggle.dataset.fresh=seen?'':'1';toggle.textContent=root._augmentsOpen?'Türme & Gebäude':seen?'Augment-Karten':'Neu · Augment-Karten';toggle.setAttribute('aria-pressed',String(!!root._augmentsOpen));
  toggle.onclick=()=>{root._augmentsOpen=!root._augmentsOpen;render(root,profile,save,transact);};
  host.replaceChildren();host.className='augmentCollection';host.hidden=!eligible||!root._augmentsOpen;if(host.hidden)return;
  const a=HexAugmentCards.clean(profile.augmentCards),slots=HexAugmentCards.slots(profile);
  const status=el('p','augmentStatus');status.setAttribute('role','status');
  let busy=false;
  const commit=async(fn,operation)=>{if(busy)return;busy=true;if(operation.kind==='buy')root._augmentRevealPacks=a.packs+1;const buttons=[...host.querySelectorAll('button')],disabled=buttons.map(b=>b.disabled);buttons.forEach(b=>b.disabled=true);status.textContent='Wird gespeichert …';try{if(transact)await transact(operation,fn);else save(fn());}catch(e){delete root._augmentRevealPacks;status.textContent=e.message;}finally{busy=false;buttons.forEach((b,i)=>b.disabled=disabled[i]);}};

  // Kopf: Titel, belegte Plätze als Hex-Reihe, Booster als Hauptaktion
  const head=el('header','augmentHead'),intro=el('div','augmentHeadText');intro.appendChild(el('p','augmentKicker','Standard / zwei Fronten / Duo'));intro.appendChild(el('h2','','Augment-Karten'));
  const slotRow=el('div','augmentSlots');slotRow.setAttribute('aria-label','Augment-Plätze: '+a.equipped.length+'/'+slots);
  for(let i=0;i<5;i++){const pip=el('span','augmentSlot');pip.dataset.state=i<a.equipped.length?'filled':i<slots?'open':'locked';if(i>=slots)pip.title='Welle '+SLOT_WAVES[i-1];slotRow.appendChild(pip);}
  const nextWave=SLOT_WAVES[slots-1];
  slotRow.appendChild(el('span','augmentSlotText','Ausgerüstet: '+a.equipped.length+'/'+slots+' · '+(nextWave?'Nächster Platz nach Welle '+nextWave:'Alle Plätze freigeschaltet')));intro.appendChild(slotRow);head.appendChild(intro);
  const shop=el('div','augmentShop'),buy=el('button','primary augmentBuy','Booster öffnen · 50 ◆ · 2 Karten');buy.disabled=profile.diamonds<50;
  buy.addEventListener('click',()=>{commit(()=>HexAugmentCards.buy(profile,()=>{const buffer=new Uint32Array(1);crypto.getRandomValues(buffer);return buffer[0]/4294967296;}),{kind:'buy'});});shop.appendChild(buy);
  shop.appendChild(el('small','','Spätestens jedes 10. Paket enthält Selten oder besser.'));head.appendChild(shop);host.appendChild(head);
  const odds=el('ul','augmentOdds');odds.setAttribute('aria-label','Ziehchancen');
  for(const [tier,chance] of [60,25,10,4,1].entries()){const item=el('li','',HexAugmentCards.rarities[tier]+' '+chance+' %');item.dataset.tier=String(tier);odds.appendChild(item);}
  host.appendChild(odds);

  if(!a.introSeen){const welcome=el('aside','augmentWelcome');
   welcome.appendChild(el('h3','','Neu: Deine Augment-Sammlung'));
   welcome.appendChild(el('p','','Öffne ein Paket mit zwei Karten, rüste eine Karte aus und starte deinen nächsten Run. Drei gleiche Karten kannst du zu einer stärkeren verschmelzen. Die Karten bleiben dauerhaft in deiner Sammlung.'));
   const ok=el('button','primary','Verstanden');ok.addEventListener('click',()=>{if(busy)return;try{save({...profile,augmentCards:{...a,introSeen:true}});}catch(e){status.textContent=e.message;}});welcome.appendChild(ok);host.appendChild(welcome);
  }
  if(a.lastPack.length){const result=el('div'),fresh=root._augmentRevealPacks===a.packs;result.className='augmentPackResult'+(fresh?' augmentReveal':'');if(fresh)delete root._augmentRevealPacks;
   result.setAttribute('aria-live','polite');result.appendChild(el('h3','augmentPackCaption',fresh?'Deine neuen Karten':'Zuletzt erhalten'));
   const cards=el('div','augmentPackCards');
   for(const [i,c] of a.lastPack.entries()){const def=HexAugmentCards.catalog[c.id],tile=el('article','augmentCard augmentPackCard');tile.dataset.tier=String(c.tier);tile.dataset.order=String(i);
    tile.appendChild(cardHead(c.id,def));tile.appendChild(el('strong','augmentRarity',HexAugmentCards.rarities[c.tier]));
    tile.appendChild(el('p','augmentEffect',HexAugmentCards.describe(c.id,c.tier)));cards.appendChild(tile);
   }result.appendChild(cards);host.appendChild(result);
  }
  host.appendChild(el('p','augmentRules','Vor dem Run ausrüsten. Höchste besessene Seltenheit wird ausgerüstet. Laufende Runs bleiben unverändert. Drei gleiche Karten gleicher Seltenheit → nächsthöhere Seltenheit. Nur verfügbare Türme und Basis/Gebäude.'));

  const grid=el('div','augmentGrid');
  for(const [id,def] of Object.entries(HexAugmentCards.catalog)){
   const t=HexAugmentCards.tier(a.cards,id),equipped=a.equipped.includes(id),card=el('article','augmentCard'+(equipped?' equipped':'')+(t<0?' missing':''));card.dataset.tier=String(t);
   card.appendChild(cardHead(id,def));
   card.appendChild(el('strong','augmentRarity',t<0?'Noch nicht gesammelt.':HexAugmentCards.rarities[t]));
   if(equipped)card.appendChild(el('span','augmentEquippedTag','Ausgerüstet'));
   card.appendChild(el('p','augmentEffect',HexAugmentCards.describe(id,Math.max(t,0))));
   if(t>=0){
    const copies=el('div','augmentCopies');
    for(let tier=0;tier<5;tier++){const count=a.cards[id][tier];if(!count)continue;const row=el('div','augmentCopy');row.dataset.tier=String(tier);row.appendChild(el('span','',HexAugmentCards.rarities[tier]+' × '+count));
     if(tier<4){const fuse=el('button','secondary augmentFuse','3 → 1 '+HexAugmentCards.rarities[tier+1]);fuse.disabled=count<3;fuse.addEventListener('click',()=>commit(()=>HexAugmentCards.fuse(profile,id,tier),{kind:'fuse',card:id,tier}));row.appendChild(fuse);}copies.appendChild(row);}
    card.appendChild(copies);
    const use=el('button',equipped?'secondary augmentEquip':'primary augmentEquip',equipped?'Ablegen':'Ausrüsten');use.setAttribute('aria-pressed',String(equipped));use.disabled=!equipped&&a.equipped.length>=slots;use.addEventListener('click',()=>commit(()=>HexAugmentCards.equip(profile,id),{kind:'equip',card:id}));card.appendChild(use);
   }grid.appendChild(card);
  }
  host.appendChild(grid);host.appendChild(status);
 }
 return {render};
})();
