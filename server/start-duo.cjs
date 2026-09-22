'use strict';
const path=require('node:path'),os=require('node:os'),{createStore}=require('./duo-store.cjs'),{createTransport}=require('./duo-transport.cjs');
const rooms=createStore(path.resolve(process.env.DUO_SAVE_FILE||path.join(os.homedir(),'.autohex-duo/checkpoint.json')));
const server=createTransport(rooms,{browser:true,autoTick:true});
server.listen(Number(process.env.DUO_PORT)||8090,'127.0.0.1',()=>console.log('Duo-Lobby: http://127.0.0.1:'+server.address().port+'/ · Nur lokal, automatische Speicherung aktiv.'));
let closing=false;function stop(){if(closing)return;closing=true;try{rooms.flush();}catch{console.error('Duo checkpoint could not be saved.');process.exitCode=1;}server.close();server.closeAllConnections();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
