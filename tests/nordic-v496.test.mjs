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
const tmp=new URL('../src/.worker_496_test.mjs',import.meta.url);fs.writeFileSync(tmp,worker);
try{
 const {Lobby}=await import(tmp.href);
 const heroes=['kris','moretti','l0id','kali','mollitiam'],passives=['odin','tyr','ymir'];
 const lobby=new Lobby({getWebSockets:()=>[]},{}),cs=heroes.map(()=>client());let clock=1000;
 const sockets=cs.map((c,i)=>({id:String(i),sent:[],attachment:{id:String(i)},send(z){const m=JSON.parse(z);this.sent.push(m);if(['state','motion','remotePress','remoteInput'].includes(m.t)){c.sandbox.incoming=m;c.run('coopOnMessage(incoming)');}},serializeAttachment(z){this.attachment=z},deserializeAttachment(){return this.attachment},close(){}}));
 const msg=(i,m)=>lobby.webSocketMessage(sockets[i],JSON.stringify(m));for(const x of sockets)lobby.players.set(x.id,{id:x.id,socket:x,room:null,hero:null});msg(0,{t:'create'});const code=[...lobby.rooms.keys()][0];for(let i=1;i<5;i++)msg(i,{t:'join',code});for(let i=0;i<5;i++){msg(i,{t:'choose',hero:heroes[i]});msg(i,{t:'passives',passives});}msg(0,{t:'begin',boss:'nordic',difficulty:'pecador'});
 const room=lobby.rooms.get(code);assert(room.started);const host=cs[0].run,members=heroes.map((hero,i)=>({id:String(i),hero,passives}));
 for(const [i,c] of cs.entries()){c.sandbox.performance.now=()=>clock;c.sandbox.WebSocket={OPEN:1};c.sandbox.capture=z=>lobby.webSocketMessage(sockets[i],z);c.sandbox.members=members;c.run(`coop.active=true;coop.host=${i===0};coop.id='${i}';coop.hostId='0';coop.members=members;coop.socket={readyState:1,bufferedAmount:0,send:capture};coopResetSeq(1);selectedCampaign='nordic';start('${heroes[i]}','nordic');phase='play';`);}
 for(let w=1;w<20;w++){
  clock+=800;host("phase='reward';showRewards();coopSendState(true)");
  for(const [i,c] of cs.entries()){
   assert.equal(c.run('stage'),20+w);assert.equal(c.run('opts.length'),3);assert(c.run("opts.every(c=>c.id.startsWith('n_')&&CARD_IMAGES[c.id].includes('/futhark/'))"));
   assert.equal(c.run('new Set(opts.map(c=>c.id)).size'),3);
   assert(c.run('opts.every(c=>!player.runes.includes(c.id))'));
   if(w===1&&i===1){msg(i,{t:'press',action:'card',value:'supply_heal'});msg(i,{t:'press',action:'card',value:'authorReality'});assert(!host("coop.choices.has('1')"));}
   const choice=w===5?2:0;clock+=100;c.run(`chooseCard(${choice})`);
  }
  for(const c of cs){assert.equal(c.run('stage'),21+w);assert.equal(c.run('player.runes.length'),w);assert.equal(c.run('player.cards.length'),5);}
 }
 assert.equal(host('stage'),40);assert(host('isCampaignFinalWave()'));assert(host("enemies.some(e=>e.type==='pecado')"));
 for(const [i,c] of cs.entries()){assert.equal(c.run('new Set(player.runes).size'),19);assert(c.run('player.nordicSpecialEarned'));assert.equal(c.run("player.runes.includes('n_f_'+player.type)"),true);if(i!==3)assert(c.run('!!player.cardPower'));}
 assert(room.checkpoint);assert.equal(room.checkpoint.actors['1'].runes.length,19);
 console.log('PASS five simulated network clients through all 19 rewards, 3 distinct Futhark cards per wave, exclusive rune powers, rejected Japanese/supply selections, final boss and checkpoint');
}finally{fs.unlinkSync(tmp);}
