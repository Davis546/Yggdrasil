import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDuel} from '../src/duel-engine.mjs';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const original=globalThis.performance;let clock=0;Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
const list=['cross','kris','kali','loid'].map((hero,i)=>({id:String(i),hero,cards:[]}));
const m=createDuel(list);const step=n=>{for(let i=0;i<n;i++){clock+=50;m.tick();}};
assert.deepEqual(m.snapshot().players.map(p=>p.team),[0,1,0,1]);step(65);assert.equal(m.getStarting(),0);
const initial=m.snapshot().players; m.action('0','q','',0);step(20);const after=m.snapshot().players;
assert.equal(after[0].x,initial[0].x);assert.equal(after[0].y,initial[0].y);assert.equal(after[2].hp,initial[2].hp);assert(after[1].hp<initial[1].hp&&after[3].hp<initial[3].hp);
m.action('0','dash','',0);assert(m.snapshot().players[0].x>initial[0].x);assert.equal(m.snapshot().players[0].dashCd,1.1);
assert(m.input('0',{x:1,y:0,aim:0},3));assert(!m.input('0',{x:-1,y:0,aim:0},2));step(3);assert(m.snapshot().players[0].x>initial[0].x+120);
step(3650);assert(m.finished);assert.equal(m.winnerTeam,0);
const solo=createDuel(list.slice(0,2));for(let i=0;i<65;i++){clock+=50;solo.tick();}solo.action('0','q','',0);for(let i=0;i<15;i++){clock+=50;solo.tick();}assert(solo.snapshot().players[1].hp<11200);
console.log('PASS duelo: dois/quatro lutadores, equipes, Xans Q/dash, alvo inimigo, sequência de comandos e resultado.');
const worker=fs.readFileSync(new URL('../src/worker.mjs',import.meta.url),'utf8').replace("import { DurableObject } from 'cloudflare:workers';",'class DurableObject {constructor(ctx,env){this.ctx=ctx;this.env=env;}}');
const tmp=new URL('../src/.worker_v620_test.mjs',import.meta.url);fs.writeFileSync(tmp,worker);let lobby;
try{const {Lobby}=await import(tmp.href);const db=new Map(),pending=[];const storage={get:async k=>structuredClone(db.get(k)),put:async(k,v)=>db.set(k,structuredClone(v)),transaction:async fn=>fn(storage)};lobby=new Lobby({getWebSockets:()=>[],storage,waitUntil:p=>pending.push(p)},{});const sockets=Array.from({length:5},(_,i)=>({id:String(i),sent:[],attachment:{id:String(i)},send(x){this.sent.push(JSON.parse(x))},serializeAttachment(x){this.attachment=x},deserializeAttachment(){return this.attachment}}));for(const x of sockets)lobby.players.set(x.id,{id:x.id,socket:x,room:null,hero:null});const send=(i,m)=>lobby.webSocketMessage(sockets[i],JSON.stringify(m));const id=i=>({name:'Player '+i,key:String(i).repeat(48)});
send(0,{t:'pvpCreate',ranked:true,size:4,...id(0)});const code=[...lobby.rooms.keys()][0];for(let i=1;i<4;i++)send(i,{t:'pvpJoin',code,...id(i)});send(4,{t:'pvpJoin',code,...id(4)});assert.equal(sockets[4].sent.at(-1).t,'error');const room=lobby.rooms.get(code);assert.equal(room.members.size,4);
for(let i=0;i<4;i++){send(i,{t:'pvpChoose',hero:list[i].hero});const draft=sockets[i].sent.findLast(m=>m.t==='pvpDraft');for(const card of draft.offer.slice(0,3))send(i,{t:'pvpPick',card});}send(0,{t:'pvpBegin'});assert(room.match);assert.equal(room.match.snapshot().players.length,4);assert.deepEqual(room.match.snapshot().players.map(p=>p.team),[0,1,0,1]);
// Force the simulation to complete a match using its normal timeout; then allow ticker to publish result.
for(let i=0;i<65;i++){clock+=50;room.match.tick();}room.match.action('0','q','',0);for(let i=0;i<3650;i++){clock+=50;room.match.tick();}assert(room.match.finished);assert.equal(room.match.winnerTeam,0);await new Promise(r=>setTimeout(r,120));await Promise.all(pending);const ranks=await (await lobby.fetch(new Request('https://local/duel-ranking?size=4'))).json();assert.equal(ranks.entries.length,4);assert.equal(ranks.entries[0].points,25);assert.equal(ranks.entries[0].rank,'Bronze');assert(ranks.entries.every(p=>!('key'in p)));assert(sockets[0].sent.some(p=>p.t==='pvpResult'&&p.ranked&&p.winnerTeam===0));send(0,{t:'pvpRematch'});assert.equal(room.started,false);assert.equal(room.match,null);
console.log('PASS servidor duelo: sala competitiva 2v2, resultado do servidor, ranking persistido, rematch.');
// Same protocol transports defense mode and preserves tree fields.
for(let i=0;i<4;i++)send(i,{t:'pvpLeave'});send(0,{t:'create',boss:'defense',wire616:1});const co=[...lobby.rooms.values()].find(r=>r.kind!=='pvp');send(1,{t:'join',code:co.code,wire616:1});send(0,{t:'choose',hero:'loid'});send(1,{t:'choose',hero:'abloy'});send(0,{t:'begin',boss:'defense',difficulty:'normal',playerCount:2});assert.equal(co.selectedBoss,'defense');assert(co.started);const world={stage:1,seq:1,phase:'play',actors:{'0':{hp:100},'1':{hp:100}},defense62:true,tree62:{hp:1200,maxHp:1200,shield:40,repair:0,roots:0}};send(0,{t:'state',data:world,checkpoint:world});assert.equal(sockets[1].sent.at(-1).data.tree62.hp,1200);assert.equal(co.checkpoint.tree62.shield,40);console.log('PASS servidor defesa: modo e estado da árvore enviados a convidados.');
}finally{if(lobby?.duelTicker)clearInterval(lobby.duelTicker);if(lobby?.coopTicker)clearInterval(lobby.coopTicker);fs.unlinkSync(tmp);Object.defineProperty(globalThis,'performance',{value:original,configurable:true});}
