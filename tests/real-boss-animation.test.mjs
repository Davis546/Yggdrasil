import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const noop=()=>{};const elmap=new Map(),draws=[];
const ctx=new Proxy({}, {get(t,k){if(k==='drawImage')return (img,...args)=>{
 if(args.length===8){for(const n of args)assert.ok(Number.isFinite(n),`${img.src} geometry not finite: ${n}`);
 const [sx,sy,sw,sh]=args;assert.ok(sx>=0&&sy>=0&&sw>0&&sh>0&&sx+sw<=img.naturalWidth+0.01&&sy+sh<=img.naturalHeight+.01,`${img.src}: invalid ${args.slice(0,4)}`);}
 draws.push({name:img.src,args});};return t[k]||noop;},set(t,k,v){t[k]=v;return true}});
function el(id){if(!elmap.has(id))elmap.set(id,{style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},value:'normal',hidden:false,innerHTML:'',textContent:'',addEventListener:noop,querySelector:()=>el('c'),getContext:()=>ctx,getBoundingClientRect:()=>({width:480,height:288,left:0,top:0}),setPointerCapture:noop});return elmap.get(id)}
class FakeImage{complete=true;naturalWidth=336;naturalHeight=448;set src(value){this._src=value;this.naturalWidth=value.includes('_sheet.png?v=44')&&value.includes('nordic/')?1280:value.includes('jarl_v39_atlas')?1024:value.includes('ancient_dragon.png')?512:value.includes('nameless_knight.png')?512:336;this.naturalHeight=value.includes('_sheet.png?v=44')&&value.includes('nordic/')?1280:value.includes('jarl_v39_atlas')?1024:value.includes('ancient_dragon.png')?512:value.includes('nameless_knight.png')?512:448}get src(){return this._src}}
const sandbox={window:{innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'Desktop'},document:{body:el('body'),documentElement:el('html'),getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('q'),createElement:()=>el('c'),addEventListener:noop},Image:FakeImage,performance:{now:()=>1000},requestAnimationFrame:noop,localStorage:{getItem:()=>null,setItem:noop},YG_AUDIO:{play:noop,syncMusic:noop},console,Math,Date,Map,Set,WebSocket:class{},location:{protocol:'https:',host:'test.workers.dev'},setTimeout:noop,clearTimeout:noop};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),sandbox,{timeout:7000});
const run=s=>vm.runInContext(s,sandbox,{timeout:15000});
let samples=0;
for(const [stage,type,fragment] of [[5,'boss','samurai_sheet'],[10,'reuni','reuni_sheet'],[15,'tsukuomi','tsukuomi_sheet'],[20,'pecado','pecado_sheet'],[25,'frostjarl','jarl_v39_atlas'],[35,'nameless','nameless_knight_sheet']]){
 run(`player=createPlayer('loid');player.hp=100000;player.maxHp=100000;stage=${stage};testBossMode=true;spawnStage()`);
 assert.ok(run(`enemies.some(e=>e.type==='${type}')`));
 for(const state of ['idle','walk','windup','strike']){
  const frames=new Set();
  for(let step=0;step<18;step++){
   draws.length=0;
   run(`{const e=enemies.find(e=>e.type==='${type}');e.face='right';e.step=${step*1.17};e.phase=0;e.walking=${state==='walk'};e.move='execution';e.mode='${state==='windup'?'windup':'walk'}';e.windup=${1.45-(step/18)*1.45};e.attackPose=${state==='strike'?0.60-step*.023:0};elapsed=${step*.117};enemySprite(e);}`);
   const sprite=draws.find(d=>d.name.includes(fragment));assert.ok(sprite,`${type} not drawn in ${state}`);
   if(sprite.args.length===8)frames.add(`${sprite.args[0]},${sprite.args[1]}`);
   samples++;
  }
  assert.ok(frames.size>=(state==='idle'&&['boss','reuni','tsukuomi','pecado'].includes(type)?1:2),`${type} sprite is STATIC in ${state} (${frames.size} pose)`);
 }
}
run(`stage=35;player=createPlayer('loid');player.hp=100000;player.maxHp=100000;spawnStage();`);
run(`{let e=enemies.find(e=>e.type==='nameless');e.rage=true;e.hp=e.maxHp*.4;}`);
for(const [mode,move] of [['windup','breath'],['walk','claws'],['walk','wings']]){
 const set=new Set();
 for(let n=0;n<16;n++){
  draws.length=0;
  run(`{let e=enemies.find(e=>e.type==='nameless');e.mode='${mode}';e.move='${move}';e.dragonIntro=0;e.windup=${1.8-n*.1};e.dragonFxMove='${move}';e.dragonFxTime=${1.25-n*.07};elapsed=${n*.16};drawNamelessDragon();}`);
  const sprite=draws.find(d=>d.name.includes('ancient_dragon_sheet'));assert.ok(sprite,`dragon ${move} not drawn`);
  set.add(`${sprite.args[0]},${sprite.args[1]}`);
 }
 assert.ok(set.size>=2,`dragon ${move} stationary`);
}
// Assert the *real files*, page entrypoints and cooperative sprite fields exist.
const g=fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
assert.match(g,/\x27step\x27,\x27walking\x27,\x27mode\x27/,'co-op snapshots must send walking status');
for(const h of ['index.html','game.html'])assert.match(fs.readFileSync(new URL('../public/'+h,import.meta.url),'utf8'),/game\.js\?v=44/);
for(const file of ['nameless_knight_sheet.png','ancient_dragon_sheet.png']){
 const data=fs.readFileSync(new URL('../public/assets/nordic/'+file,import.meta.url));
 assert.ok(data.length>1000000);assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(data.readUInt32BE(16),1280);assert.equal(data.readUInt32BE(20),1280);
}
console.log(`REAL BOSS ANIMATIONS PASS: ${samples} rendered walk/attack states across all six bosses, dragon frames, assets, co-op`);
