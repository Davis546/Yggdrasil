import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const noop=()=>{};const els=new Map();const draws=[];
const ctx=new Proxy({},{get(t,k){if(k==='drawImage')return (img,...args)=>{if(args.length===8){const [x,y,w,h]=args;assert.ok([x,y,w,h].every(Number.isFinite));assert.ok(x>=0&&y>=0&&x+w<=(img.naturalWidth+1)&&y+h<=(img.naturalHeight+1),`${img.src}: bad atlas index ${args}`);}draws.push({url:img.src,args});};return t[k]||noop},set(t,k,v){t[k]=v;return true}});
function el(id){if(!els.has(id))els.set(id,{id,style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},value:'normal',textContent:'',innerHTML:'',addEventListener:noop,querySelector:()=>el('child'),getContext:()=>ctx,getBoundingClientRect:()=>({width:480,height:288,left:0,top:0})});return els.get(id)}
class ImageFake{complete=true;naturalWidth=1280;naturalHeight=1280;set src(v){this._src=v;this.naturalWidth=v.includes('jarl_v39')?1024:v.includes('/nordic/')?1280:v.includes('tsukuomi')?336:1280;this.naturalHeight=v.includes('jarl_v39')?1024:v.includes('/nordic/')?1280:v.includes('tsukuomi')?448:1280;}get src(){return this._src}}
const s={window:{innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'Desktop'},document:{body:el('body'),documentElement:el('html'),getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('q'),createElement:()=>el('created'),addEventListener:noop},Image:ImageFake,performance:{now:()=>1000},requestAnimationFrame:noop,localStorage:{getItem:()=>null,setItem:noop},YG_AUDIO:{play:noop,syncMusic:noop},console,Math,Date,Map,Set,WebSocket:class{},location:{protocol:'https:',host:'local.test'},setTimeout:noop,clearTimeout:noop};
vm.createContext(s);vm.runInContext(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),s,{timeout:5000});const ev=x=>vm.runInContext(x,s,{timeout:7000});
let n=0;
for(const [stage,type,name] of [[30,'odin','odin_sheet'],[35,'nameless','nameless_knight_sheet']]){
 ev(`selectedCampaign='nordic';start('loid',${stage===30?"'odin'":"'nameless'"});`);
 for(const mode of ['idle','walk','windup','attack']){for(let i=0;i<18;i++){
  draws.length=0;ev(`{const e=enemies.find(e=>e.type==='${type}');elapsed=${i*.16};e.step=${i*.9};e.walking=${mode==='walk'};e.mode=${mode==='windup'?"'windup'":"'walk'"};e.move='execution';e.attackPose=${mode==='attack'?.5:0};e.windup=${1.45-i*.045};enemySprite(e);}`);
  const d=draws.find(d=>d.url.includes(name));assert.ok(d,`${name} disappeared: ${mode}:${i}`);assert.equal(d.args[6],type==='odin'?108:88);n++;
 }}
}
ev("selectedCampaign='nordic';start('loid','nameless');let k=enemies.find(e=>e.type==='nameless');k.hp=k.maxHp*.5;update(.016);");
assert.equal(ev("enemies.filter(e=>e.type==='ancestralDragon').length"),1);
for(const mode of ['idle','windup','fire'])for(let i=0;i<20;i++){
 draws.length=0;ev(`{const d=enemies.find(e=>e.type==='ancestralDragon');elapsed=${i*.12};d.mode='${mode}';d.fireTime=${mode==='fire'?.8:0};enemySprite(d);}`);
 const sprite=draws.find(d=>d.url.includes('ancient_dragon_sheet'));assert.ok(sprite,`Dragon vanished ${mode} ${i}`);assert.equal(sprite.args[6],215);n++;
}
for(const file of ['odin_sheet.png','odin_spells.png','ancient_dragon_sheet.png','nameless_knight_sheet.png']){
 const data=fs.readFileSync(new URL('../public/assets/nordic/'+file,import.meta.url));assert.equal(data.readUInt32BE(16),1280);assert.equal(data.readUInt32BE(20),1280);
}
console.log(`ODIN/KNIGHT/DRAGON SPRITE PASS ${n} frames, bounds valid and native pixels preserved`);
