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

const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const solo=client().run;
solo("start('kali');player.hp=60;skill()");near(solo('player.hp'),72);assert.equal(solo('player.skillCd'),18);assert.equal(solo('player.mirrorGuard'),5);
solo('secondaryDown();tickNewHero(player,1)');near(solo('player.hp'),74.4);assert.equal(solo('mirrorIllusions.length'),1);
solo('player.ultimateCharge=100;ultimate()');near(solo('player.hp'),98.4);assert.equal(solo('player.ultimateTime'),10);near(solo('newDamage(player)'),1.15);assert.equal(solo('mirrorIllusions.length'),1);assert.equal(solo('mirrorIllusions[0].life'),10);
solo("player.invuln=0;player.mirrorGuard=0;player.dodgeChance=0;player.armor=0;Math.random=()=>.99;hurtPlayer(20,'mob')");near(solo('player.hp'),85.4);
solo("start('moretti');player.hp=25;Math.random=()=>.3;skill()");near(solo('player.hp'),33);near(solo('newDamage(player)'),1.2);near(solo('newAttackDelay(player)'),1/1.18);solo('secondaryDown()');near(solo('newSpeed(player)'),1.25);solo('player.ultimateCharge=100;ultimate();tickNewHero(player,1)');near(solo('player.hp'),50);near(solo('newDamage(player)'),1.5);near(solo('newAttackDelay(player)'),1/(1.18*1.2));solo('elapsed+=11');near(solo('newDamage(player)'),1);near(solo('newSpeed(player)'),1);
console.log('PASS solo: exact healing, cooldowns, guard, reflection duration, damage reduction, D20 scaling and expiration');
const worker=fs.readFileSync(new URL('../src/worker.mjs',import.meta.url),'utf8').replace("import { DurableObject } from 'cloudflare:workers';",'class DurableObject {constructor(ctx,env){this.ctx=ctx;this.env=env;}}');const tmp=new URL('../src/.worker_494_test.mjs',import.meta.url);fs.writeFileSync(tmp,worker);
try{
 const {Lobby}=await import(tmp.href);
 for(const heroes of [['kris','kali','moretti','loid','eve'],['kali','kris','moretti','loid','eve'],['moretti','kali','kris','loid','eve']]){
 const lobby=new Lobby({getWebSockets:()=>[]},{});const cs=heroes.map(()=>client());let clock=1000;
 const sockets=cs.map((c,i)=>({id:String(i),sent:[],attachment:{id:String(i)},send(z){const m=JSON.parse(z);this.sent.push(m);if(['state','motion','remotePress','remoteInput'].includes(m.t)){c.sandbox.incoming=m;c.run('coopOnMessage(incoming)');}},serializeAttachment(z){this.attachment=z},deserializeAttachment(){return this.attachment},close(){}}));
 const msg=(i,m)=>lobby.webSocketMessage(sockets[i],JSON.stringify(m));for(const [i,x] of sockets.entries())lobby.players.set(x.id,{id:x.id,socket:x,room:null,hero:null});msg(0,{t:'create'});const code=[...lobby.rooms.keys()][0];for(let i=1;i<5;i++)msg(i,{t:'join',code});for(let i=0;i<5;i++)msg(i,{t:'choose',hero:heroes[i]});msg(0,{t:'begin',boss:'japan',difficulty:'normal'});
 const room=lobby.rooms.get(code);assert(room.started);const host=cs[0].run;const members=heroes.map((hero,i)=>({id:String(i),hero}));
 for(const [i,c] of cs.entries()){c.sandbox.performance.now=()=>clock;c.sandbox.WebSocket={OPEN:1};c.sandbox.capture=z=>lobby.webSocketMessage(sockets[i],z);c.sandbox.members=members;c.run(`coop.active=true;coop.host=${i===0};coop.id='${i}';coop.hostId='0';coop.members=members;coop.socket={readyState:1,bufferedAmount:0,send:capture};coopResetSeq(1);start('${heroes[i]}');phase='play';`);}
 const k=heroes.indexOf('kali'),m=heroes.indexOf('moretti'),dead=4;const actor=i=>i===0?'player':`coop.allies.get('${i}')`;
 host(`for(const a of newTeam()){a.hp=a.maxHp*.3;a.x+=600*(a.type==='loid'?1:0);} ${actor(dead)}.hp=0;enemies=[];Math.random=()=>.3;coopSendState(true)`);
 const cast=(i,key)=>{clock+=100;cs[i].run(key);};const hp=(i)=>host(`${actor(i)}.hp`);const max=(i)=>host(`${actor(i)}.maxHp`);const synced=()=>{for(let i=0;i<5;i++)assert(Math.abs(cs[i].run('player.hp')-hp(i))<=.051);};
 cast(k,'skill()');for(let i=0;i<4;i++){near(hp(i),max(i)*.4);assert.equal(host(`${actor(i)}.mirrorGuard`),5);assert.match(cs[i].nodes.get('supportBuffHUD').textContent,/Reflexo/);}assert.equal(hp(dead),0);synced();
 cast(k,'secondaryDown()');assert.equal(host('mirrorIllusions.length'),4);assert.equal(host('new Set(mirrorIllusions.map(v=>v.ownerId)).size'),4);for(let i=1;i<5;i++)assert.equal(cs[i].run('mirrorIllusions.length'),4);host('for(const a of newTeam())tickNewHero(a,1)');for(let i=0;i<4;i++)near(hp(i),max(i)*.42);
 host(`${actor(k)}.ultimateCharge=100`);cast(k,'ultimate()');for(let i=0;i<4;i++){near(hp(i),max(i)*.62);near(host(`newDamage(${actor(i)})`),1.15);}assert.equal(host('mirrorIllusions.length'),4);synced();
 cast(m,'skill()');for(let i=0;i<4;i++){near(hp(i),max(i)*.70);near(host(`newDamage(${actor(i)})`),1.15*1.2);near(cs[i].run('newDamage(player)'),1.15*1.2);}synced();for(let i=0;i<5;i++)assert.equal(cs[i].run(`${i===m?'player':`coop.allies.get('${m}')`}.realityRoll.value`),7);
 cast(m,'secondaryDown()');for(let i=0;i<4;i++){near(host(`newSpeed(${actor(i)})`),1.25);near(cs[i].run('newSpeed(player)'),1.25);}host(`${actor(m)}.ultimateCharge=100`);cast(m,'ultimate()');for(let i=0;i<4;i++){near(hp(i),max(i)*.85);near(host(`newDamage(${actor(i)})`),1.15*1.2*1.25);near(cs[i].run('newAttackDelay(player)'),1/(1.18*1.2));}synced();assert.equal(hp(dead),0);
 // Guest casts are credited to the caster rather than the host, including projectile attacks.
 cast(k,'attack()');assert.equal(host('projectiles.at(-1).ownerId'),String(k));
 // Actual damage formula and real cooldown acceleration use the replicated buffs.
 const target=heroes.indexOf('loid');const before=hp(target);host(`{const saved=player;player=${actor(target)};player.mirrorGuard=0;player.invuln=0;player.armor=0;player.dodgeChance=0;hurtPlayer(10,'mob');player=saved;}`);near(hp(target),before-10*1.3*.65*.8);
 host(`{const saved=player;player=${actor(target)};const enemy={id:777,type:'walker',hp:100,maxHp:100,x:player.x,y:player.y};hitEnemy(enemy,10,false,true);globalThis.hit=enemy.hp;player=saved;}`);near(host('hit'),100-10*1.15*1.2*1.25);
 host(`${actor(target)}.skillCd=10;tickNewHero(${actor(target)},1)`);near(host(`${actor(target)}.skillCd`),9.78);
 // Full checkpoint preserves timed buffs, actor-specific mirrors and D20; restore on a different host.
 clock+=700;host('coopSendState(true)');const cp=room.checkpoint;assert(cp);assert.equal(cp.actors[String(m)].realityRoll.value,7);assert.equal(cp.mirrorIllusions.length,4);assert(cp.mirrorIllusions.every(v=>v.casterId===String(k)));assert.equal(cp.actors[String(target)].mirrorSanctuaryPower,1);
 const migrated=cs[1];migrated.sandbox.cp=cp;migrated.run("coop.host=true;coopRestoreCheckpoint(cp)");near(migrated.run('newDamage(player)'),1.15*1.2*1.25);assert.equal(migrated.run('mirrorIllusions.length'),4);assert.equal(migrated.run('mirrorIllusions.every(v=>v.owner&&v.owner.hp>0)'),true);
 console.log('PASS five independent clients + actual worker relay, host '+heroes[0]+': Kali/Moretti Q/E/R, shared roll, living-only healing, actual combat modifiers, HUD, projectiles and checkpoint');
 }
}finally{fs.unlinkSync(tmp);}
