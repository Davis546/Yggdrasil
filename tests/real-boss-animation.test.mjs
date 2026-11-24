import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const noop=()=>{};const draws=[];const els=new Map();
const ctx=new Proxy({},{get(t,k){if(k==='drawImage')return (img,...args)=>{if(args.length===8){assert.ok(args.every(Number.isFinite));assert.ok(args[0]>=0&&args[1]>=0&&args[0]+args[2]<=img.naturalWidth+0.1&&args[1]+args[3]<=img.naturalHeight+0.1,`${img.src} invalid atlas`);}draws.push({url:img.src,args});};return t[k]||noop;},set(t,k,v){t[k]=v;return true;}});
function el(id){if(!els.has(id))els.set(id,{id,style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},value:'normal',textContent:'',innerHTML:'',addEventListener:noop,querySelector:()=>el('child'),getContext:()=>ctx,getBoundingClientRect:()=>({width:480,height:288,left:0,top:0})});return els.get(id);}
class FakeImage{complete=true;naturalWidth=1280;naturalHeight=1280;set src(v){this._src=v;this.naturalWidth=v.includes('jarl_v39')?1024:v.includes('samurai_sheet')||v.includes('reuni_sheet')||v.includes('tsukuomi_sheet')||v.includes('pecado_sheet')?336:1280;this.naturalHeight=v.includes('jarl_v39')?1024:v.includes('samurai_sheet')||v.includes('reuni_sheet')||v.includes('tsukuomi_sheet')||v.includes('pecado_sheet')?448:1280;}get src(){return this._src}}
const sb={window:{innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'Desktop'},document:{body:el('body'),documentElement:el('html'),getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('q'),createElement:()=>el('created'),addEventListener:noop},Image:FakeImage,performance:{now:()=>1000},requestAnimationFrame:noop,localStorage:{getItem:()=>null,setItem:noop},YG_AUDIO:{play:noop,syncMusic:noop},console,Math,Date,Map,Set,WebSocket:class{},location:{protocol:'https:',host:'test.workers.dev'},setTimeout:noop,clearTimeout:noop};
vm.createContext(sb);vm.runInContext(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),sb,{timeout:5000});const run=s=>vm.runInContext(s,sb,{timeout:8000});
let n=0;for(const [stage,type,fragment] of [[5,'boss','samurai_sheet'],[10,'reuni','reuni_sheet'],[15,'tsukuomi','tsukuomi_sheet'],[20,'pecado','pecado_sheet'],[25,'frostjarl','jarl_v39_atlas'],[30,'odin','odin_sheet'],[35,'nameless','nameless_knight_sheet']]){
 run(`player=createPlayer('loid');player.hp=100000;player.maxHp=100000;stage=${stage};testBossMode=true;spawnStage()`);assert.ok(run(`enemies.some(e=>e.type==='${type}')`));
 for(const mode of ['idle','walk','windup','attack']){
  const frames=new Set();for(let step=0;step<16;step++){
   draws.length=0;run(`{const e=enemies.find(e=>e.type==='${type}');e.face='right';e.step=${step*.77};e.walking=${mode==='walk'};e.move='execution';e.mode='${mode==='windup'?'windup':'walk'}';e.windup=${1.45-step*.08};e.attackPose=${mode==='attack'?.65-step*.025:0};elapsed=${step*.16};enemySprite(e);}`);
   const sprite=draws.find(d=>d.url.includes(fragment));assert.ok(sprite,`${type} disappeared in ${mode}`);
   if(sprite.args.length===8)frames.add(`${sprite.args[0]},${sprite.args[1]}`);n++;
  }
  assert.ok(frames.size>=(mode==='idle'&&['boss','reuni','tsukuomi','pecado'].includes(type)?1:2),`${type} static in ${mode}`);
 }
}
run("stage=35;player=createPlayer('loid');player.hp=100000;player.maxHp=100000;spawnStage();let k=enemies.find(e=>e.type==='nameless');k.hp=k.maxHp*.5;update(.016)");
for(const mode of ['idle','windup','fire']){
 const frames=new Set();for(let step=0;step<20;step++){
  draws.length=0;run(`{const d=enemies.find(e=>e.type==='ancestralDragon');d.mode='${mode}';d.fireTime=${mode==='fire'?.9:0};d.dragonIntro=0;elapsed=${step*.17};enemySprite(d);}`);
  const sprite=draws.find(d=>d.url.includes('ancient_dragon_sheet'));assert.ok(sprite);frames.add(sprite.args.slice(0,2).join(','));n++;
 }assert.ok(frames.size>=2,`${mode} dragon not animated`);
}
assert.match(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),/'step','walking','mode'/);
for(const h of ['index.html','game.html'])assert.match(fs.readFileSync(new URL('../public/'+h,import.meta.url),'utf8'),/game\.js\?v=470/);
console.log(`REAL BOSS ANIMATIONS PASS: ${n} boss and autonomous dragon frames rendered`);
