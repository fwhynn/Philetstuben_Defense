'use strict';
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');
const {createHash}=require('node:crypto');
function stampClientFiles(out){
  const files=[];
  function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory()){if(entry.name!=='assets'&&entry.name!=='node_modules')walk(full);}else if(/\.(html|css|js|mjs)$/.test(entry.name))files.push(full);}}
  walk(out);files.sort();
  const hash=createHash('sha256');for(const file of files)hash.update(path.relative(out,file)).update(fs.readFileSync(file));
  const version=hash.digest('hex').slice(0,16);
  for(const file of files.filter(f=>/\.(html|js|mjs)$/.test(f))){
    const source=fs.readFileSync(file,'utf8');
    // Only local files that actually exist in this artifact, including dynamic
    // script URLs and relative ES-module imports. API/socket URLs stay unchanged.
    const stamped=source.replace(/(["'])([^"'`\s<>?]+\.(?:js|mjs|css))\1/g,(whole,quote,url)=>{
      if(/^(?:https?:|\/\/|data:)/.test(url))return whole;
      const target=path.resolve(url.startsWith('/')?out:path.dirname(file),url.replace(/^\//,''));
      if(!target.startsWith(out+path.sep)||!fs.existsSync(target))return whole;
      return quote+url+'?v='+version+quote;
    });
    fs.writeFileSync(file,stamped);
  }
  return version;
}
function buildPublic(destination=path.join(root,'public-build')){const out=path.resolve(destination);
if(out===root||root.startsWith(out+path.sep))throw Error('Output must not contain source');if(fs.existsSync(out)&&fs.readdirSync(out).length)throw Error('Output must be empty');fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(root))if(/\.(html|css|js)$/.test(name)||name==='package.json'||name==='patch-notes.json')fs.copyFileSync(path.join(root,name),path.join(out,name));
for(const name of ['classes','assets','node_modules/three'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
stampClientFiles(out);
console.log('Public files copied. Server code, saves and Git metadata are excluded.');

}
if(require.main===module)buildPublic(process.argv[2]);
module.exports={buildPublic,stampClientFiles};
