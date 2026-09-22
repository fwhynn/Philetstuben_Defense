const HexTutorial=(()=>{
  const steps=[
    'Wähle unten eine Hexkarte. Drehe sie mit R oder Mausrad-Klick, bis die Straße passt.',
    'Klicke auf ein freies Nachbarfeld mit grüner Vorschau, um dein Hex anzulegen.',
    'Klicke auf einen leuchtenden freien Turmplatz auf deinem gelegten Hex.',
    'Baue einen Bogenschützen. Hebe etwas Gold für seine erste Verbesserung auf.',
    'Klicke deinen Bogenschützen an und wähle Salve für 35 Gold. Der Flächenschaden hilft dir, alle Gegner der ersten Welle abzuwehren.',
    'Achte auf die Herzen oben rechts: Lass keine Gegner in die Basis laufen. Bei null Leben verlierst du.',
    'Bereit! Starte die Welle mit der Leertaste oder mit dem hervorgehobenen Knopf unten rechts.'
  ];
  function begin(state){const towers=[...state.map.values()].flatMap(t=>t.towers||[]).filter(Boolean);return {active:true,alternativeTower:!!towers.length&&!towers.some(t=>t.type==='archer'),step:towers.some(t=>t.level>1||t.branch)?5:towers.length?4:state.phase==='place'?0:2};}
  function advance(tutorial,event,type){
    if(!tutorial?.active)return false;
    if(event==='buy'&&tutorial.step<=3)tutorial.alternativeTower=!!type&&type!=='archer';
    if(event==='skipUpgrade'&&(!tutorial.alternativeTower||tutorial.step!==4))return false;
    const target={rotate:1,place:2,slot:3,buy:4,upgrade:5,skipUpgrade:5,health:6,wave:7}[event];
    if(target===undefined||event==='health'&&tutorial.step!==5)return false;
    tutorial.step=Math.max(tutorial.step,target);
    if(tutorial.step>=steps.length){tutorial.active=false;return true;}return false;
  }
  function message(tutorial){return tutorial.step===4&&tutorial.alternativeTower?'Das ist zwar kein Bogenschütze – aber viel Glück und viel Spaß damit! Klicke deinen Turm an, um seine Verbesserungen anzusehen. Falls dein Gold nicht reicht, kannst du hier trotzdem weitergehen.':steps[tutorial.step]||'';}
  return {steps,begin,advance,message};
})();
