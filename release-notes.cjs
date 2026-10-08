const fs=require('node:fs');
function prepare(file,version,date=new Date().toISOString().slice(0,10)){
 const notes=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!Array.isArray(notes)||notes[0]?.version!=='next'||typeof notes[0].title!=='string'||!notes[0].title.trim()||!Array.isArray(notes[0].changes)||!notes[0].changes.length||notes[0].changes.some(v=>typeof v!=='string'||!v.trim()))throw Error('Patch Notes fehlen: zuerst den next-Eintrag in patch-notes.json mit den Spieler-Änderungen ergänzen.');
 if(!/^\d+\.\d+\.\d+$/.test(version)||notes.some(n=>n.version===version))throw Error('Ungültige oder doppelte Patch-Notes-Version.');
 return [{...notes[0],version,date},...notes.slice(1)];
}
module.exports={prepare};
