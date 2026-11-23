import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';
let src=fs.readFileSync(new URL('../src/worker.mjs',import.meta.url),'utf8');
src=src.replace("import { DurableObject } from 'cloudflare:workers';", 'class DurableObject{constructor(ctx,env){this.ctx=ctx;this.env=env;}}');
src=src.replace('export class Lobby extends DurableObject','class Lobby extends DurableObject').replace('export default', 'const defaultExport =')+'\nglobalThis.TestLobby=Lobby;';
const sandbox={crypto:webcrypto,console,URL,Response,WebSocketPair:class{}};vm.runInNewContext(src,sandbox);const Lobby=sandbox.TestLobby;
const ctx={getWebSockets(){return []}};const l=new Lobby(ctx,{});const sent={a:[],b:[],c:[]};
const mk=(id,role)=>({id,role,hero:'loid',picks:['heart','blade','fast'],room:null,socket:{bufferedAmount:0,send(txt){sent[id].push(JSON.parse(txt))},serializeAttachment(){}}});
const a=mk('a','fighter'),b=mk('b','fighter'),c=mk('c','spectator');const room={code:'ABCDEF',kind:'pvp',started:true,finished:false,host:a,members:new Set([a,b,c]),lastSnapshot:null};
for(const p of [a,b,c]){p.room=room;l.players.set(p.id,p);}l.rooms.set(room.code,room);
const put=(who,msg)=>l.webSocketMessage(who.socket,JSON.stringify(msg));
// Need server map mapping sockets via attachments.
for(const p of [a,b,c])p.socket.deserializeAttachment=()=>({id:p.id});
put(a,{t:'pvpSignal',to:'b',data:{type:'offer',sdp:'abc'}});assert(sent.b.some(m=>m.t==='pvpSignal'&&m.from==='a'));assert(!sent.c.some(m=>m.t==='pvpSignal'));
put(c,{t:'pvpSignal',to:'a',data:{type:'candidate',candidate:{candidate:'x'}}});assert(!sent.a.some(m=>m.t==='pvpSignal'));
put(b,{t:'pvpInput',seq:18,x:1,y:0,aim:3.14,attack:true});assert(sent.a.some(m=>m.t==='pvpInput'&&m.seq===18));
put(b,{t:'pvpAction',action:'q',aim:2,x:0.4,y:0});assert(sent.a.some(m=>m.t==='pvpAction'&&m.action==='q'&&m.aim===2));
put(a,{t:'pvpMotion',data:{seq:1,stamp:1,time:175,starting:0,players:[{id:'a',x:1,y:2},{id:'b',x:3,y:4}]}});assert(sent.b.some(m=>m.t==='pvpMotion'));assert(sent.c.some(m=>m.t==='pvpMotion'));
put(a,{t:'pvpSnapshot',data:{players:[{id:'a',x:10,y:2},{id:'b',x:3,y:4}],time:175,seq:1}});assert(sent.b.some(m=>m.t==='pvpSnapshot'));assert(sent.c.some(m=>m.t==='pvpSnapshot'));
console.log('PASS: 2 fighters + spectator; peer signaling restricted; input seq; skill direction; motion and state broadcast');
