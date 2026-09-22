'use strict';
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');
function buildPublic(destination=path.join(root,'public-build')){const out=path.resolve(destination);
if(out===root||root.startsWith(out+path.sep))throw Error('Output must not contain source');if(fs.existsSync(out)&&fs.readdirSync(out).length)throw Error('Output must be empty');fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(root))if(/\.(html|css|js)$/.test(name)||name==='package.json')fs.copyFileSync(path.join(root,name),path.join(out,name));
for(const name of ['classes','assets','node_modules/three'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
console.log('Public files copied. Server code, saves and Git metadata are excluded.');

}
if(require.main===module)buildPublic(process.argv[2]);
module.exports={buildPublic};
