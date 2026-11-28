import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {packDuel627,unpackDuel627} from '../public/duel-wire627.mjs';
import {createDuel} from '../src/duel-engine.mjs';
const json=x=>JSON.stringify(x), canonical=x=>JSON.parse(json(x));
let clock=0;const realPerf=globalThis.performance;Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
let raw=0,packed=0,count=0,maxClone=0,maxProjectile=0;
try{
 for(const heroes of [['loid','cross','abloy','kali'],['kris','mollitiam','moretti','josue']]){
  const ids=['a','b','c','d'];const match=createDuel(heroes.map((hero,i)=>({id:ids[i],hero})));for(let i=0;i<62;i++){clock+=50;match.tick();}
  for(let i=0;i<200&&!match.finished;i++){
   for(let j=0;j<4;j++){const aim=j%2?Math.PI:0;match.input(ids[j],{x:i<10?(j%2?-1:1):0,y:0,aim,attack:true},i+1);if(i%25===0){match.action(ids[j],'q','',aim);match.action(ids[j],'eDown','',aim);}if(i%25===15)match.action(ids[j],'eUp','',aim);}
   clock+=50;match.tick();const snap=match.snapshot(),compact=packDuel627(snap);assert.deepEqual(canonical(unpackDuel627(canonical(compact))),canonical(snap));assert(json(compact).length<=json(snap).length+12);raw+=Buffer.byteLength(json(snap));packed+=Buffer.byteLength(json(compact));count++;maxClone=Math.max(maxClone,snap.clones.length);maxProjectile=Math.max(maxProjectile,snap.projectiles.length);
  }
 }
 assert(packed<raw*.85);assert(maxClone>0&&maxProjectile>0);
 console.log(`TRAFFIC 627: ${count} snapshots PvP 2v2 reais do motor, ${raw} -> ${packed} bytes (${(100*(1-packed/raw)).toFixed(1)}% a menos); max ${maxClone} clones, ${maxProjectile} projéteis.`);
 assert.equal(unpackDuel627({wire627:1,players:{schemas:[['__proto__']],rows:[[0,1]]}}),null);
 const ordinary={players:[{id:'a'}]};assert.equal(unpackDuel627(ordinary),ordinary);
}finally{Object.defineProperty(globalThis,'performance',{value:realPerf,configurable:true});}
// Verify actual server ticker negotiates independently packed and legacy snapshots.
const workerText=fs.readFileSync(new URL('../src/worker.mjs',import.meta.url),'utf8').replace("import { DurableObject } from 'cloudflare:workers';",'class DurableObject {constructor(ctx,env){this.ctx=ctx;this.env=env;}}');
const tmp=new URL('../src/.worker_v627_test.mjs',import.meta.url);fs.writeFileSync(tmp,workerText);
const interval=globalThis.setInterval;let callback;
try{globalThis.setInterval=fn=>{callback=fn;return 1;};const {Lobby}=await import(tmp.href);const server=new Lobby({getWebSockets:()=>[]},{});const sent=[[],[]];const members=[true,false].map((wire627,i)=>({wire627,socket:{bufferedAmount:0,send:msg=>sent[i].push(JSON.parse(msg))}}));const match=createDuel([{id:'a',hero:'loid'},{id:'b',hero:'kris'}]);server.rooms.set('TEST',{kind:'pvp',started:true,finished:false,match,members:new Set(members)});server.ensureDuelTicker();callback();assert.equal(sent[0][0].data.wire627,1);assert.equal(sent[1][0].data.wire627,undefined);assert.deepEqual(unpackDuel627(sent[0][0].data),sent[1][0].data);callback();assert.equal(sent[0][1].t,'pvpMotion');assert.deepEqual(sent[0][1],sent[1][1]);console.log('PASS 627: relay compacto, cliente antigo, movimento sem dependência de quadros anteriores.');}finally{globalThis.setInterval=interval;fs.unlinkSync(tmp);}
// Reuse the same VM harness as the defense regression, instrument Image and canvas.
const test=fs.readFileSync(new URL('./v626.test.mjs',import.meta.url),'utf8');let harness=test.slice(test.indexOf('function client('),test.indexOf('\nconst {run,nodes}=client()'));const src=fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8');const requests=[],draws=[];harness=harness.replace('const noop=()=>{};const ctx=new Proxy({},','const noop=()=>{};const ctx=new Proxy({},').replace("o[k]??noop});","k==='drawImage'?(...a)=>draws.push(a):o[k]??noop});").replace('class{complete=true;naturalWidth=768;naturalHeight=1728;addEventListener(){}}','class{complete=true;naturalWidth=768;naturalHeight=1728;addEventListener(){} set src(s){this.url=s;requests.push(s);}}');
const client=Function('vm','src','requests','draws',harness+';return client;')(vm,src,requests,draws);const {run}=client();assert.equal(requests.filter(x=>x.includes('void624/')).length,0);run("start('loid','defense');");assert(requests.filter(x=>x.includes('void624/')).length>=29);run('tree62.intro=false;camera={x:20,y:20};drawTree62()');assert(draws.some(a=>a[0]?.url?.includes('arena.webp')&&a.length===9&&a[3]<a[0].naturalWidth));assert.equal(run('netPacing616(0,30000,60).motion'),50);assert.equal(run('netPacing616(4000,30000,60).motion'),80);console.log('PASS 627: carregamento por modo, recorte da área visível, cadência de movimento preservada em pacotes grandes.');
