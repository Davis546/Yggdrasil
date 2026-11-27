import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDuel} from '../src/duel-engine.mjs';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const original=globalThis.performance;let clock=0;Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
const advance=(m,n)=>{for(let i=0;i<n&&!m.finished;i++){clock+=50;m.tick();}};
for(const hero of ['loid','kris','cross','eve','kali','mollitiam']){
 const m=createDuel([{id:'human',hero:hero==='loid'?'kris':'loid',cards:[]},{id:'bot:test:1',hero,cards:[],bot:true}]);
 assert(!m.input('bot:test:1',{x:0,y:0,aim:0}));assert(!m.action('bot:test:1','q','',0));
 const before=m.snapshot().players[1];advance(m,250);const after=m.snapshot().players;
 assert(after[1].bot);assert(Math.hypot(after[1].x-before.x,after[1].y-before.y)>50,hero+' moves');assert(after[0].hp<11200,hero+' deals damage');
 advance(m,4000);assert(m.finished);assert.equal(m.winnerTeam,1);
}
console.log('PASS bots: 6 heróis movimentam, atacam e vencem; comandos externos rejeitados.');
const source=fs.readFileSync(new URL('../src/worker.mjs',import.meta.url),'utf8').replace("import { DurableObject } from 'cloudflare:workers';",'class DurableObject {constructor(ctx,env){this.ctx=ctx;this.env=env;}}');
const tmp=new URL('../src/.worker_v621_test.mjs',import.meta.url);fs.writeFileSync(tmp,source);let lobby;
try{
 const {Lobby}=await import(tmp.href);const db=new Map(),storage={get:async k=>db.get(k),put:async(k,v)=>db.set(k,v),transaction:async fn=>fn(storage)};lobby=new Lobby({getWebSockets:()=>[],storage},{});
 const sockets=Array.from({length:5},(_,i)=>({id:String(i),sent:[],attachment:{id:String(i)},send(x){this.sent.push(JSON.parse(x))},serializeAttachment(x){this.attachment=x},deserializeAttachment(){return this.attachment}}));for(const x of sockets)lobby.players.set(x.id,{id:x.id,socket:x,room:null,hero:null});
 const send=(i,m)=>lobby.webSocketMessage(sockets[i],JSON.stringify(m));const identity=i=>({name:'Jogador '+i,key:String(i).repeat(48)});
 const ready=(i,hero)=>{send(i,{t:'pvpChoose',hero});const draft=sockets[i].sent.findLast(m=>m.t==='pvpDraft');for(const card of draft.offer.slice(0,3))send(i,{t:'pvpPick',card});};
 for(const scenario of [{size:2,n:1},{size:4,n:1},{size:4,n:2,together:true},{size:4,n:2},{size:4,n:3}]){
  send(0,{t:'pvpCreate',size:scenario.size,fillBots:true});const room=lobby.players.get('0').room;
  for(let i=1;i<scenario.n;i++)send(i,{t:'pvpJoin',code:room.code});
  if(scenario.together)send(0,{t:'pvpBots',fillBots:true,together:true});
  for(let i=0;i<scenario.n;i++)ready(i,['loid','kris','cross'][i]);send(0,{t:'pvpBegin'});
  assert(room.match);assert.equal(room.roster.length,scenario.size);assert.equal(room.roster.filter(p=>p.bot).length,scenario.size-scenario.n);assert.equal(new Set(room.roster.map(p=>p.hero)).size,scenario.size);
  if(scenario.together)assert.deepEqual(room.roster.filter(p=>!p.bot).map(p=>p.team),[0,0]);
  assert.deepEqual(room.roster.map(p=>p.team),scenario.size===4?[0,1,0,1]:[0,1]);
  send(4,{t:'pvpJoin',code:room.code,role:'spectator'});assert.equal(sockets[4].sent.findLast(x=>x.t==='pvpBegin').fighters.length,scenario.size);
  advance(room.match,4000);assert(room.match.finished);await new Promise(r=>setTimeout(r,80));assert(sockets[0].sent.some(x=>x.t==='pvpResult'&&!x.ranked));assert.equal(db.size,0);send(0,{t:'pvpRematch'});assert.equal(room.roster,null);assert.equal(room.started,false);assert(room.fillBots);
  send(0,{t:'pvpLeave'});
 }
 send(0,{t:'pvpCreate',size:4,ranked:true,fillBots:true,...identity(0)});const rank=lobby.players.get('0').room;assert(!rank.fillBots);send(0,{t:'pvpBots',fillBots:true,together:true});assert(!rank.fillBots);ready(0,'loid');send(0,{t:'pvpBegin'});assert(!rank.match);
 console.log('PASS salas: 1v1 solo, 2v2 com 1/2/3 humanos, dupla aliada, espectador, revanche, ranking protegido.');
}finally{if(lobby?.duelTicker)clearInterval(lobby.duelTicker);fs.unlinkSync(tmp);Object.defineProperty(globalThis,'performance',{value:original,configurable:true});}
