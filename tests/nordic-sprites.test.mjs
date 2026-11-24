import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const noop=()=>{};
const els=new Map();
const draws=[];
const ctx=new Proxy({}, {get(t,k){
  if(k==='drawImage')return (img,...a)=>{if(a.length===8){const [sx,sy,sw,sh,dx,dy,dw,dh]=a;for(const x of a)assert.ok(Number.isFinite(x),`Non finite sprite geometry ${x}`);assert.ok(sx>=0&&sy>=0&&sw>0&&sh>0&&sx+sw<=img.naturalWidth&&sy+sh<=img.naturalHeight,`Invalid ${img.src} crop`);draws.push({url:img.src,sx,sy,sw,sh,dx,dy,dw,dh});}};
  return t[k]||noop;
},set(t,k,v){t[k]=v;return true}});
function el(id){if(!els.has(id))els.set(id,{style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},value:'normal',innerHTML:'',textContent:'',hidden:false,addEventListener:noop,querySelector:()=>el('child'),getContext:()=>ctx,getBoundingClientRect:()=>({width:480,height:288,left:0,top:0}),setPointerCapture:noop});return els.get(id)}
class Img {complete=true;naturalWidth=1280;naturalHeight=1280;set src(v){this._src=v;if(v.includes('jarl_v39')){this.naturalWidth=1024;this.naturalHeight=1024}}get src(){return this._src}}
const sandbox={window:{innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'Desktop'},document:{body:el('body'),documentElement:el('html'),getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('query'),createElement:()=>el('created'),addEventListener:noop},Image:Img,performance:{now:()=>1000},requestAnimationFrame:noop,localStorage:{getItem:()=>null,setItem:noop},YG_AUDIO:{play:noop,syncMusic:noop},console,Math,Date,Map,Set,WebSocket:class{},location:{protocol:'https:',host:'test.workers.dev'},setTimeout:noop,clearTimeout:noop};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),sandbox,{timeout:5000});
const run=s=>vm.runInContext(s,sandbox,{timeout:10000});
for(const name of ['nameless_knight_sheet.png','ancient_dragon_sheet.png']){const path=new URL('../public/assets/nordic/'+name,import.meta.url);assert.ok(fs.statSync(path).size>50000)}
run("selectedCampaign='nordic';start('loid','nameless');player.maxHp=100000;player.hp=100000;");
assert.equal(run('stage'),35);
run("{const boss=enemies.find(e=>e.type==='nameless');boss.hp=boss.maxHp*.5;update(.016)}");
assert.equal(run("enemies.find(e=>e.type==='nameless').rage"),true);
let n=0;
for(const state of ['idle','walk','windup','attack','summon']){
 for(let t=0;t<24;t++){
   draws.length=0;
   run(`{const e=enemies.find(e=>e.type==='nameless');elapsed=${t*.147};e.step=${t*.83};e.phase=undefined;e.walking=${state==='walk'};e.mode=${JSON.stringify(state==='windup'?'windup':'idle')};e.attackPose=${state==='attack'?.37:0};e.dragonIntro=${state==='summon'?2:0};e.move=${JSON.stringify(state==='windup'?'slash':'summon')};enemySprite(e);}`);
   const knight=draws.find(d=>d.url.includes('nameless_knight_sheet'));
   assert.ok(knight,`Knight disappeared: ${state}:${t}`);
   assert.equal(knight.sw,320);assert.equal(knight.sh,320);
   assert.equal(knight.dw,88);assert.equal(knight.dh,88);
   n++;
 }
}
for(const state of ['idle','intro','breath-windup','breath','claws','wings']){
 for(let t=0;t<24;t++){
   draws.length=0;
   run(`{const e=enemies.find(e=>e.type==='nameless');elapsed=${t*.173};e.dragonIntro=${state==='intro'?2:0};e.mode=${JSON.stringify(state==='breath-windup'?'windup':'idle')};e.move='breath';e.dragonFxTime=${['breath','claws','wings'].includes(state)?1:0};e.dragonFxMove=${JSON.stringify(state)};drawNamelessDragon();}`);
   const dragon=draws.find(d=>d.url.includes('ancient_dragon_sheet'));
   assert.ok(dragon,`Dragon disappeared: ${state}:${t}`);
   assert.equal(dragon.sw,320);assert.equal(dragon.sh,320);
   assert.ok(dragon.dw>=155&&dragon.dw<=320,`Dragon wrong size: ${dragon.dw}`);
   n++;
 }
}
console.log(`NORDIC SPRITES PASS: ${n} states, knight regular size and dragon large, all 4x4 frames bounded`);
