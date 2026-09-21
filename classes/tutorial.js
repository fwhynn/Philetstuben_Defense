const HexTutorial=(()=>{
  const steps=[
    'Wähle unten eine Hexkarte. Drehe sie mit R oder Mausrad-Klick, bis die Straße passt.',
    'Klicke auf ein freies Nachbarfeld mit grüner Vorschau, um dein Hex anzulegen.',
    'Klicke auf einen leuchtenden freien Turmplatz auf deinem gelegten Hex.',
    'Wähle im Turmmenü einen bezahlbaren Turm. Für den Einstieg eignet sich der Archer.',
    'Dein Turm ist bereit! Starte die Wave mit dem Button oder der Leertaste.'
  ];
  function begin(state){const built=[...state.map.values()].some(t=>t.towers?.some(Boolean));return {active:true,step:built?4:state.phase==='place'?0:2};}
  function advance(tutorial,event){
    if(!tutorial?.active)return false;
    const target={rotate:1,place:2,slot:3,buy:4,wave:5}[event];
    if(target===undefined)return false;tutorial.step=Math.max(tutorial.step,target);
    if(tutorial.step>=steps.length){tutorial.active=false;return true;}return false;
  }
  return {steps,begin,advance};
})();
