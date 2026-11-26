import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const noop=()=>{};const ctx=new Proxy({}, {get:(o,k)=>k==='measureText'?()=>({width:50}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop:noop}):o[k]??noop});
const nodes=new Map();function node(id=''){if(nodes.has(id)&&id)return nodes.get(id);const n={style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},addEventListener:noop,setAttribute:noop,getContext:()=>ctx,getBoundingClientRect:()=>({width:832,height:384,x:0,y:0,left:0,top:0}),querySelector:()=>node(''),appendChild:noop,remove:noop,focus:noop,children:[],value:'normal'};if(id)nodes.set(id,n);return n;}
const storage=new Map();const document={body:node('body'),documentElement:node('root'),getElementById:node,querySelector:()=>node('scene'),querySelectorAll:()=>[],createElement:()=>node('')};
const sandbox={document,window:{matchMedia:()=>({matches:false}),innerWidth:832,innerHeight:384,addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'test'},Image:class{complete=true;naturalWidth=768;naturalHeight=1728;addEventListener(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>0},requestAnimationFrame:noop,YG_AUDIO:new Proxy({}, {get:()=>noop}),console,setTimeout:noop,clearTimeout:noop};
vm.createContext(sandbox);vm.runInContext(src,sandbox);const run=expr=>vm.runInContext(expr,sandbox);

const expected=[[1,1,1,1,1,1,1],[1.75,1.1,1.25,1.5,1.25,1.15,1.05],[2.5,1.2,1.5,2,1.5,1.3,1.1],[3.25,1.3,1.75,2.5,1.75,1.45,1.15],[4,1.3,2,3,2,1.6,1.2]];
for(let n=1;n<=5;n++)assert.deepEqual(JSON.parse(run(`JSON.stringify(Object.values(coopBalance(${n})).slice(1))`)),expected[n-1]);
const setup=(n,realm,mode,wave)=>run(`coop.active=${n>1};coop.host=${n>1};coop.id='h';coop.members=Array.from({length:${n}},(_,i)=>({id:i?'a'+i:'h',hero:'kris'}));coop.allies.clear();player=createPlayer('kris');coop.hostAvatar=player;activeCampaign='${realm}';difficulty='${mode}';stage=${wave};testBossMode=false;spawnStage()`);
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const [realm,wave] of [['japan',5],['nordic',25]])for(const mode of ['normal','pecador']){
 setup(1,realm,mode,wave);const base=run('enemies.find(isBossEnemy).maxHp'),speed=run('enemies.find(isBossEnemy).speed'),count=run('enemies.filter(e=>!isBossEnemy(e)).length'),mob=run("addMob('walker',200,200).maxHp");
 for(let n=2;n<=5;n++){
  setup(n,realm,mode,wave);near(run('enemies.find(isBossEnemy).maxHp'),base*expected[n-1][3]);near(run('enemies.find(isBossEnemy).speed'),speed*expected[n-1][6]);assert.equal(run('enemies.filter(e=>!isBossEnemy(e)).length'),Math.round(count*expected[n-1][2]));if(realm==='nordic'&&mode==='pecador')assert.equal(run("addMob('walker',200,200).maxHp"),Math.round(44*(1.55+(wave-21)*.045)*1.20*(1+.40*(n-1))));else near(run("addMob('walker',200,200).maxHp"),mob*expected[n-1][0]);
 }
}
setup(5,'japan','normal',5);run("player.hp=100;player.invuln=0;player.armor=0;player.dodgeChance=0;hurtPlayer(10,'mob')");near(run('player.hp'),87);
run("player.hp=100;player.invuln=0;hurtPlayer(10,'boss')");near(run('player.hp'),80);
run("projectiles=[];shoot(enemies.find(isBossEnemy),{x:1,y:0},100,10,'red');shoot(enemies.find(e=>!isBossEnemy(e)),{x:1,y:0},100,10,'red')");near(run('projectiles[0].damage'),20);near(run('projectiles[1].damage'),13);
run("player.hp=100;player.invuln=0;hazards=[{x:player.x,y:player.y,r:20,type:'blood',delay:0}];updateBossHazards(.01)");near(run('player.hp'),60);
// Death does not change the wave roster; a departure affects the next spawn only.
run("coop.allies.set('a1',{hp:0});coopOnMessage({t:'left',id:'a1'})");assert.equal(run('waveBalance.players'),5);assert.equal(run('coop.members.length'),4);run('spawnStage()');assert.equal(run('waveBalance.players'),4);
// Dragon uses the same boss HP multiplier; its runic seal mechanics stay fixed.
setup(1,'nordic','normal',35);run('spawnAncestralDragon(enemies.find(isBossEnemy))');const dragon=run("enemies.find(e=>e.type==='ancestralDragon').maxHp");setup(3,'nordic','normal',35);run('spawnAncestralDragon(enemies.find(isBossEnemy))');near(run("enemies.find(e=>e.type==='ancestralDragon').maxHp"),dragon*2);
// Solo after co-op resets the modifiers.
setup(1,'japan','normal',5);assert.equal(run('waveBalance.players'),1);near(run("coopDamageFactor('boss')"),1);
console.log('PASS v4.9.1: actual wave spawns, 1–5 players, both realms/difficulties, direct/projectile/hazard damage, death/disconnect, dragon, solo');
// Real room logic with mock WebSockets: roster size comes from the server, not begin payload.
let worker=fs.readFileSync(new URL('../src/worker.mjs',import.meta.url),'utf8').replace("import { DurableObject } from 'cloudflare:workers';",'class DurableObject {constructor(ctx,env){this.ctx=ctx;this.env=env;}}');
const tmp=new URL('../src/.worker_coop491_test.mjs',import.meta.url);fs.writeFileSync(tmp,worker);
try{const {Lobby}=await import(tmp.href);const lobby=new Lobby({getWebSockets:()=>[]},{});const sockets=Array.from({length:5},(_,i)=>({id:String(i),sent:[],attachment:{id:String(i)},send(x){this.sent.push(JSON.parse(x))},serializeAttachment(x){this.attachment=x},deserializeAttachment(){return this.attachment}}));for(const x of sockets)lobby.players.set(x.id,{id:x.id,socket:x,room:null,hero:null});const msg=(x,m)=>lobby.webSocketMessage(x,JSON.stringify(m));msg(sockets[0],{t:'create'});const code=[...lobby.rooms.keys()][0];for(const x of sockets.slice(1))msg(x,{t:'join',code});for(const [i,x] of sockets.entries())msg(x,{t:'choose',hero:['kris','loid','cross','eve','kali'][i]});msg(sockets[0],{t:'begin',boss:'japan',difficulty:'pecador',playerCount:1});for(const x of sockets){const begun=x.sent.find(m=>m.t==='begun');assert.equal(begun.playerCount,5);assert.equal(begun.members.length,5);}msg(sockets[4],{t:'leave'});assert.equal(sockets[0].sent.filter(m=>m.t==='lobby').at(-1).members.length,4);assert(sockets[0].sent.some(m=>m.t==='left'&&m.id==='4'));console.log('PASS v4.9.1: mocked server room, 5-player roster and leave broadcast');}finally{fs.unlinkSync(tmp);}
