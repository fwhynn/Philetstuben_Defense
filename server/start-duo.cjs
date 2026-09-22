'use strict';
const {createLobbies}=require('./duo-lobbies.cjs'),{createTransport}=require('./duo-transport.cjs');
const server=createTransport(createLobbies(),{browser:true,autoTick:true});
server.listen(Number(process.env.DUO_PORT)||8090,'127.0.0.1',()=>console.log('Duo-Lobby: http://127.0.0.1:'+server.address().port+'/ · Nur lokal, Strg+C beendet alle Partien.'));
