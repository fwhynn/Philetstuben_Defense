const {test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('./helpers/game.cjs');
// Kartenbild zeigt Turm- und Gebäudeplätze als Symbole an ihren echten Positionen.
const towers=html=>(html.match(/M-30 42L-30-26/g)||[]).length,houses=html=>(html.match(/M-38 42L-38-8/g)||[]).length;
test('card art draws one tower per tower slot and one house per building slot',()=>{
 const {a,elements}=load();a.state.deck=['deadEnd','buildingPlot','straight'];a.state.drawPile=[];a.state.discard=[];
 elements.get('deckDropdown').open=true;elements.get('deckDropdown').listeners.toggle();
 const cards=elements.get('deckOverview').children[0].children[1].children,art=name=>cards.find(c=>c.innerHTML.includes(name)).innerHTML;
 assert.equal(towers(art('Bastionssackgasse')),2);assert.equal(houses(art('Bastionssackgasse')),1);assert.match(art('Bastionssackgasse'),/#b98af0/);
 assert.equal(towers(art('Baugrund')),0);assert.equal(houses(art('Baugrund')),1);
 const straight=a.state.deck.includes('straight')&&cards.find(c=>c.innerHTML.includes('class="hxCardSlots"')&&!c.innerHTML.includes('Baugrund')&&!c.innerHTML.includes('Bastions'));
 assert.ok(straight);assert.equal(houses(straight.innerHTML),0);
});
