import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
function client(){
const noop=()=>{};const ctx=new Proxy({}, {get:(o,k)=>k==='measureText'?()=>({width:50}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop:noop}):o[k]??noop});
const nodes=new Map();function node(id=''){if(nodes.has(id)&&id)return nodes.get(id);const n={style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},addEventListener:noop,setAttribute:noop,getContext:()=>ctx,getBoundingClientRect:()=>({width:832,height:384,x:0,y:0,left:0,top:0}),querySelector:()=>node(''),appendChild:noop,remove:noop,focus:noop,children:[],value:'normal'};if(id)nodes.set(id,n);return n;}
const storage=new Map();const document={body:node('body'),documentElement:node('root'),getElementById:node,querySelector:()=>node('scene'),querySelectorAll:()=>[],createElement:()=>node('')};
const sandbox={document,window:{matchMedia:()=>({matches:false}),innerWidth:832,innerHeight:384,addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'test'},Image:class{complete=true;naturalWidth=768;naturalHeight=1728;addEventListener(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>0},requestAnimationFrame:noop,YG_AUDIO:new Proxy({}, {get:()=>noop}),console,setTimeout:noop,clearTimeout:noop};
vm.createContext(sandbox);vm.runInContext(src,sandbox);const run=expr=>vm.runInContext(expr,sandbox);return {run,sandbox,nodes};
}

const worker=fs.readFileSync(new URL('../src/worker.mjs',import.meta.url),'utf8').replace("import { DurableObject } from 'cloudflare:workers';",'class DurableObject {constructor(ctx,env){this.ctx=ctx;this.env=env;}}');
const tmp=new URL('../src/.worker_497_test.mjs',import.meta.url);fs.writeFileSync(tmp,worker);
try{
 const {Lobby}=await import(tmp.href);const lobby=new Lobby({getWebSockets:()=>[]},{});
 const mk=(id)=>{const x={id,sent:[],attachment:{id},send(z){this.sent.push(JSON.parse(z))},serializeAttachment(z){this.attachment=z},deserializeAttachment(){return this.attachment},close(){}};lobby.players.set(id,{id,socket:x,room:null,hero:null});return x;};
 const msg=(x,m)=>lobby.webSocketMessage(x,JSON.stringify(m));const last=(x,t)=>x.sent.filter(m=>m.t===t).at(-1);
 const h=mk('h'),a=mk('a'),b=mk('b'),c=mk('c'),d=mk('d');msg(h,{t:'create'});const code=last(h,'welcome').code;const room=lobby.rooms.get(code);msg(h,{t:'choose',hero:'kris'});assert.equal(room.started,false);assert(last(h,'lobby').positions.h);
 const hc=client();let sent=[];hc.sandbox.WebSocket={OPEN:1};hc.sandbox.capture=x=>sent.push(JSON.parse(x));hc.sandbox.incoming=last(h,'welcome');hc.run("phase='coop';coop.socket={readyState:1,bufferedAmount:0,send:capture};coopOnMessage(incoming)");hc.sandbox.incoming=last(h,'lobby');hc.run('coopOnMessage(incoming)');assert.equal(hc.run('waitingVisible()'),true);assert.equal(hc.run('player'),null);assert.equal(hc.run('enemies.length'),0);const x=hc.run("waiting.actors.get('h').x");hc.run("keys.add('d');waitingFrame(.03,1000);keys.clear()");assert(hc.run("waiting.actors.get('h').x")>x);assert.equal(sent.at(-1).t,'waitingMove');msg(h,sent.at(-1));
 for(const [i,peer] of [a,b,c,d].entries()){msg(peer,{t:'join',code});msg(peer,{t:'choose',hero:['moretti','kali','loid','mollitiam'][i]});}
 assert.equal(room.members.size,5);assert.equal(Object.keys(last(d,'lobby').positions).length,5);assert.equal(last(d,'lobby').positions.h.x,sent.at(-1).x);assert.equal(room.started,false);
 const ac=client();ac.sandbox.WebSocket={OPEN:1};ac.sandbox.capture=()=>{};ac.sandbox.incoming=last(a,'welcome');ac.run("phase='coop';coop.socket={readyState:1,bufferedAmount:0,send:capture};coopOnMessage(incoming)");ac.sandbox.incoming=last(a,'lobby');ac.run('coopOnMessage(incoming)');assert.equal(ac.run('waitingVisible()'),true);assert.equal(ac.run('waiting.actors.size'),5);assert.equal(ac.run("$('coopBegin').disabled"),true);
 lobby.players.get('h').waitingAt=0;msg(h,{t:'waitingMove',x:800,y:500,face:'right',moving:true,id:'a'});assert.equal(last(a,'waitingMove').id,'h');ac.sandbox.incoming=last(a,'waitingMove');ac.run('coopOnMessage(incoming);waitingFrame(.03,1000)');assert(ac.run("waiting.actors.get('h').x")>x);
 lobby.players.get('h').waitingAt=0;msg(h,{t:'waitingMove',x:99999,y:-999,face:'bad'});assert.equal(last(a,'waitingMove').x,1088);assert.equal(last(a,'waitingMove').y,365);assert.equal(last(a,'waitingMove').face,'down');const count=a.sent.length;msg(h,{t:'waitingMove',x:700,y:700});assert.equal(a.sent.length,count);
 msg(a,{t:'begin',boss:'japan'});assert.equal(room.started,false);msg(h,{t:'mode',boss:'nordic'});hc.sandbox.incoming=last(h,'lobby');hc.run('coopOnMessage(incoming)');assert.equal(hc.run("$('waitingMapTitle').textContent"),'MIDGARD · REFÚGIO DO NORTE');assert.equal(hc.run("$('coopBegin').disabled"),true);msg(h,{t:'begin',boss:'nordic'});assert.equal(room.started,false);
 const token=last(h,'welcome').token;lobby.webSocketClose(h);assert.equal(room.host.id,'a');assert.equal(room.started,false);const h2=mk('h2');msg(h2,{t:'resume',code,token});assert.equal(last(h2,'resumed').id,'h');assert.equal(last(h2,'lobby').positions.h.x,1088);assert.equal(room.host.id,'a');
 for(const peer of [h2,a,b,c,d])msg(peer,{t:'passives',passives:['odin','tyr','ymir']});msg(a,{t:'begin',boss:'nordic',difficulty:'normal'});assert.equal(room.started,true);assert.equal(last(h2,'begun').playerCount,5);assert.equal(last(a,'begun').boss,'nordic');
 ac.sandbox.incoming=last(a,'begun');ac.run('coopOnMessage(incoming)');assert.equal(ac.run('waitingVisible()'),false);assert.equal(ac.run('waiting.actors.size'),0);assert.equal(ac.run('phase'),'play');assert.equal(ac.run('stage'),21);assert.equal(ac.run('activeCampaign'),'nordic');assert.equal(ac.run('player.type'),'moretti');const noMore=a.sent.length;msg(h2,{t:'waitingMove',x:700,y:700});assert.equal(a.sent.length,noMore);
 console.log('PASS lobby: five players, map selection, local input, remote motion, rate limit, bounds, host-only start, Nordic passives, reconnect, host migration, clean battle start');
}finally{fs.unlinkSync(tmp);}
