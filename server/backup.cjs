'use strict';
const fs=require('node:fs'),path=require('node:path'),{createLobbies}=require('./duo-lobbies.cjs'),{atomicWrite}=require('./duo-store.cjs');
function backup(source,destination){const text=fs.readFileSync(source,'utf8');createLobbies({snapshot:JSON.parse(text)});if(path.resolve(source)===path.resolve(destination))throw Error('Use a separate destination');if(fs.existsSync(destination))throw Error('Destination already exists');atomicWrite(destination,text);return destination;}
if(require.main===module){const [source,destination]=process.argv.slice(2);if(!source||!destination){console.error('Usage: node server/backup.cjs SOURCE NEW_DESTINATION (server paused/stopped)');process.exitCode=1;}else{backup(source,destination);console.log('Validated private backup created.');}}
module.exports={backup};
