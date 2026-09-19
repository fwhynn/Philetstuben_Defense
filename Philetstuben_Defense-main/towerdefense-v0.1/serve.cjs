// Minimaler statischer Server für lokale Entwicklung (nötig, damit .glb-Dateien geladen werden können).
const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname,port=Number(process.env.PORT)||8080;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
// Liste aller .glb-Modelle unter assets/, damit der Renderer nur vorhandene Dateien lädt (keine 404-Fehler für optionale Modelle).
function listModels(dir=path.join(root,'assets'),base='',out=[]){
  for(const entry of fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}):[]){
    const rel=base?base+'/'+entry.name:entry.name;
    if(entry.isDirectory()) listModels(path.join(dir,entry.name),rel,out);else if(/.glb$/i.test(entry.name)) out.push(rel);
  }
  return out;
}
http.createServer((req,res)=>{
  let p=decodeURIComponent(new URL(req.url,'http://x').pathname);if(p.endsWith('/')) p+='index.html';
  if(p==='/assets/index.json'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-cache'});return res.end(JSON.stringify(listModels()));}
  const file=path.join(root,p);
  if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden');}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  });
}).listen(port,()=>console.log(`Hex Bastion: http://localhost:${port}/  (Viewer: /viewer.html)`));
