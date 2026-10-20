/* Read-only source inventory; writes only this documentation folder. No game/server execution. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const files=['style.css','duo.css','leaderboard.css','admin.css','index.html','duo-lobby.html','leaderboard.html','admin.html','viewer.html','duo-prototype.html'];
const rules=[],inline=[],sources=[];
function parse(css,file,base=0){
 const clean=css.replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g,' '));
 function block(start,end,contexts){
  let mark=start,quote='',paren=0;
  for(let i=start;i<end;i++){
   const c=clean[i];
   if(quote){if(c==='\\')i++;else if(c===quote)quote='';continue;}
   if(c==='"'||c==="'"){quote=c;continue;}
   if(c==='(')paren++;if(c===')')paren--;
   if(c!=='{'||paren)continue;
   let depth=1,j=i+1,q='';
   for(;j<end&&depth;j++){const ch=clean[j];if(q){if(ch==='\\')j++;else if(ch===q)q='';continue;}if(ch==='"'||ch==="'"){q=ch;continue;}if(ch==='{')depth++;if(ch==='}')depth--;}
   if(depth)throw Error('Unbalanced CSS: '+file);
   const selector=clean.slice(mark,i).trim(),body=css.slice(i+1,j-1).trim();
   const line=base+clean.slice(0,mark+clean.slice(mark,i).search(/\S/)).split('\n').length;
   if(/^@(media|supports|container|layer|(?:-\w+-)?keyframes)\b/.test(selector))block(i+1,j-1,[...contexts,selector]);
   else if(selector)rules.push({file,line,contexts,selector,body});
   i=j-1;mark=j;
  }
 }
 block(0,css.length,[]);
}
for(const file of files){
 const text=fs.readFileSync(path.join(root,file),'utf8');
 sources.push({file,sha256:crypto.createHash('sha256').update(text).digest('hex')});
 if(file.endsWith('.css'))parse(text,file);
 else for(const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi))parse(m[1],file,text.slice(0,m.index+m[0].indexOf('>')+1).split('\n').length-1);
}
const js=fs.readdirSync(path.join(root,'classes')).filter(f=>/\.(js|mjs)$/.test(f)).map(f=>'classes/'+f);
for(const file of [...files.filter(f=>f.endsWith('.html')),...js]){
 const text=fs.readFileSync(path.join(root,file),'utf8');
 const hits=text.split(/\r?\n/).flatMap((text,i)=>/\bstyle\s*=|\.style\b|font:|fontFamily|fontSize|textShadow/.test(text)?[{file,line:i+1,text}]:[]);
 inline.push(...hits);
 if(hits.length&&!sources.some(s=>s.file===file))sources.push({file,sha256:crypto.createHash('sha256').update(text).digest('hex')});
}
const vars=rules.flatMap(r=>[...r.body.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)].map(m=>({name:m[1],value:m[2].trim(),file:r.file,line:r.line,selector:r.selector,contexts:r.contexts})));
const data={generatedAt:new Date().toISOString(),scope:'Local source declarations; not browser-computed styles',sources,rules,variables:vars,inlineStyleCandidates:inline};
fs.writeFileSync(path.join(__dirname,'ui-inventory.json'),JSON.stringify(data,null,2)+'\n');
const table=(headers,rows)=>'<div class="table"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const ref=r=>esc(r.file+':'+r.line);
const tokenTable=table(['Token','Wert / Farbmuster','Scope / Quelle'],vars.map(v=>[esc(v.name),(/^#[0-9a-f]{3,8}$/i.test(v.value)?'<i class="swatch" style="background:'+v.value+'"></i>':'')+'<code>'+esc(v.value)+'</code>',esc([...v.contexts,v.selector].join(' → '))+'<br>'+ref(v)]));
const ruleHtml=rules.map((r,i)=>'<details class="rule"><summary><small>'+esc(r.file)+':'+r.line+' · #'+(i+1)+'</small><br><code>'+esc(r.selector)+'</code></summary><p>'+esc(r.contexts.join(' → ')||'Ohne Media-Query')+'</p><pre>'+esc(r.body.replace(/;\s*/g,';\n'))+'</pre></details>').join('');
const dynamicHtml=inline.map(r=>'<details class="rule"><summary>'+ref(r)+'</summary><pre>'+esc(r.text)+'</pre></details>').join('');
const content=fs.readFileSync(path.join(__dirname,'guide-content.html'),'utf8');
const html=`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AutoHex TD · UI & Branding · Status quo</title>
<style>
:root{color-scheme:dark;font:16px/1.6 system-ui,sans-serif;color:#f5f0df;background:#111714}*{box-sizing:border-box}body{margin:0}main{max-width:1150px;margin:auto;padding:48px 28px 100px}h1,h2,h3{font-family:Georgia,serif;line-height:1.2}h1{font-size:clamp(32px,5vw,60px);max-width:900px}h2{font-size:30px;margin-top:56px;border-top:1px solid #425b49;padding-top:24px}h3{font-size:21px;margin-top:28px}p,li{max-width:85ch}a{color:#edcc7c}small,.muted{color:#b9c3b7}code{font-size:.88em;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 ui-monospace,monospace;background:#101a14;padding:16px;border-radius:8px}.note{padding:18px 22px;border:1px solid #8e7948;background:#2a2a1b;border-radius:12px;margin:24px 0}.table{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid #3b5143;text-align:left;vertical-align:top;padding:12px}th{background:#24342a}td:first-child{font-weight:600}nav{display:flex;flex-wrap:wrap;gap:8px 20px;padding:20px 0}section{scroll-margin-top:20px}.swatch{display:inline-block;width:24px;height:24px;border:1px solid #ffffff55;border-radius:5px;vertical-align:middle;margin-right:8px}.chips{display:flex;flex-wrap:wrap;gap:10px}.chip{padding:14px;border:1px solid #4d684f;border-radius:12px;background:#1d2922}.rule{border:1px solid #34493b;border-radius:8px;margin:8px 0;padding:10px 14px}.rule summary{cursor:pointer;overflow-wrap:anywhere}input{width:100%;padding:14px;background:#24342a;border:1px solid #73917b;color:#fff;border-radius:9px;font:inherit}button{padding:10px 16px;border:0;border-radius:9px;background:#326345;color:white;cursor:pointer}.samples{display:flex;gap:16px;flex-wrap:wrap;padding:22px;background:#162019;border-radius:12px}.sampleButton{font:700 16px/1.35 system-ui;min-height:44px;padding:13px;border-radius:9px;background:#326345;color:#fff}.sampleGold{background:linear-gradient(180deg,#e9c86a,#b88f2e);color:#2a1e08;box-shadow:inset 0 1px 0 #fff6,0 3px 10px #0006}.sampleCard{padding:14px;background:#efe3c2;color:#2b281f;border:3px solid #8a40c0;border-radius:10px;box-shadow:0 0 10px #b16cff66;font-family:Georgia,serif}.sampleFocus{outline:3px solid #ffe198;outline-offset:3px}
@media print{:root{color-scheme:light;color:#151c17;background:white}main{max-width:none;padding:0}a{color:#214d32}.note,th,.chip,pre{background:#f2f4ef;color:#111}nav,.searchTools{display:none}h2{break-after:avoid}tr,.note{break-inside:avoid}details:not([open]){display:none}.samples{print-color-adjust:exact}.swatch{print-color-adjust:exact}}
</style><main><p class="muted">AUTOHEX TD · BESTANDSAUFNAHME · 20.10.2026</p>${content}
<section id="tokens"><h2>12 · Vollständiges CSS-Variablenverzeichnis</h2><p>Alle deklarierten Variablen inklusive Scopes und Duplikaten. Keine automatische Zusammenführung zu einem neuen Designsystem.</p>${tokenTable}</section>
<section id="inventory"><h2>13 · Durchsuchbares CSS-Regelverzeichnis</h2><p>${rules.length} Deklarationsblöcke in Quelldatei-Reihenfolge. Suchen z. B. nach <code>menuButtons</code>, <code>border-radius</code>, <code>@media</code>, <code>hover</code> oder <code>duo.css</code>. Es sind Quellregeln, keine berechneten Endwerte. Der Browser entscheidet zusätzlich über Selektorspezifität, DOM, Vererbung, Zustand und Inline-Stile.</p><div class="searchTools"><input id="search" aria-label="Regeln durchsuchen" placeholder="Selektor, Wert, Datei oder Breakpoint suchen …"><p id="count"></p></div><div id="rules">${ruleHtml}</div></section>
<section id="dynamic"><h2>14 · Dynamische Styles und Inline-Fundstellen</h2><p>Automatisch erfasste Kandidaten aus Root-HTML und classes/*.js bzw. *.mjs. Auch Renderer- und Hilfscode ist enthalten. Diese Liste ersetzt keine vollständige semantische Analyse von JavaScript oder WebGL-Materialien.</p>${dynamicHtml}</section>
<section id="provenance"><h2>15 · Provenienz und Weitergabe</h2><p>Generiert: ${esc(data.generatedAt)}. Quellstand: lokaler Arbeitsbaum auf Basis 7b6d632, Paketversion 1.0.7; enthält unveröffentlichte Änderungen. Der Guide ist keine Bestätigung des Live-Designs. JSON-Inventar: <a href="ui-inventory.json">ui-inventory.json</a>. Neu erzeugen mit <code>node docs/branding-status-quo/build-guide.cjs</code>. Dabei werden nur Dokumentationsdateien geschrieben.</p>${table(['Quelldatei','SHA-256 des erfassten Inhalts'],sources.map(s=>[esc(s.file),'<code>'+s.sha256+'</code>']))}</section>
</main><script>
const input=document.getElementById('search'),rows=[...document.querySelectorAll('#rules .rule')],count=document.getElementById('count');
function filter(){const q=input.value.toLowerCase().trim();let n=0;for(const row of rows){const match=row.textContent.toLowerCase().includes(q);row.hidden=!match;if(match)n++;row.open=!!q&&match;}count.textContent=n+' von '+rows.length+' Regeln';}
input.addEventListener('input',filter);filter();
</script></html>`;
fs.writeFileSync(path.join(__dirname,'index.html'),html);
console.log(JSON.stringify({rules:rules.length,variables:vars.length,dynamicCandidates:inline.length,sources:sources.length,htmlBytes:Buffer.byteLength(html)}));
