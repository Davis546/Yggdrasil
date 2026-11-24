import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const noop=()=>{};const m=new Map();const cx=new Proxy({},{get:(t,k)=>t[k]||noop,set:(t,k,v)=>(t[k]=v,true)});
function el(id){if(!m.has(id))m.set(id,{style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop},dataset:{},value:'normal',hidden:false,innerHTML:'',textContent:'',addEventListener:noop,querySelector:()=>el('c'),getContext:()=>cx,getBoundingClientRect:()=>({width:480,height:288,left:0,top:0})});return m.get(id)}
const sb={window:{innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'Desktop'},document:{body:el('body'),documentElement:el('html'),getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('q'),createElement:()=>el('c'),addEventListener:noop},Image:class{complete=true;naturalWidth=1280;naturalHeight=1280;set src(v){this._src=v}get src(){return this._src}},performance:{now:()=>1000},requestAnimationFrame:noop,localStorage:{getItem:()=>null,setItem:noop},YG_AUDIO:{play:noop,syncMusic:noop},console,Math,Date,Map,Set,WebSocket:class{},location:{protocol:'https:',host:'local.test'},setTimeout:noop,clearTimeout:noop};
vm.createContext(sb);vm.runInContext(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),sb,{timeout:5000});
const ev=s=>vm.runInContext(s,sb,{timeout:5000});
ev("selectedCampaign='nordic';start('loid','nameless');player.hp=50000;player.maxHp=50000;");
assert.equal(ev('stage'),35);
const boss=ev('enemies.find(e=>e.type==="nameless")');
assert.ok(boss);
for(const [move,duration] of [['charge',1.05],['execution',1.45],['breath',1.8]]){
 let frames=[];
 for(let i=0;i<4;i++)frames.push(ev(`namelessKnightFrame({mode:'windup',move:'${move}',windup:${duration}*(1-${i}/4)})`));
 assert.deepEqual(frames,[8,9,10,11],`Knight ${move} lacked 4 attack frames`);
}
assert.deepEqual([0,1,2,3].map(i=>ev(`namelessKnightFrame({dragonIntro:4.5-${i}*1.125})`)),[12,13,14,15]);
assert.deepEqual([0,1,2,3].map(i=>ev(`namelessDragonFrame({dragonIntro:4.5-${i}*1.125})`)),[0,1,2,3]);
assert.deepEqual([0,1,2].map(i=>ev(`namelessDragonFrame({dragonIntro:0,mode:'idle',dragonFxMove:'claws',dragonFxTime:1.25*(1-${i}/3)})`)),[12,13,14]);
assert.deepEqual([0,1].map(i=>ev(`namelessDragonFrame({dragonIntro:0,mode:'idle',dragonFxMove:'breath',dragonFxTime:1*(1-${i}/2)})`)),[10,11]);
assert.match(fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),/game\.js\?v=49/);
assert.match(fs.readFileSync(new URL('../public/game.html',import.meta.url),'utf8'),/game\.js\?v=49/);
assert.ok(fs.statSync(new URL('../public/assets/nordic/nameless_knight_sheet.png',import.meta.url)).size>100000);
assert.ok(fs.statSync(new URL('../public/assets/nordic/ancient_dragon_sheet.png',import.meta.url)).size>100000);
console.log('BOSS 15 FRAME PROGRESS / V43 CACHE / ORIGINAL SPRITES PASS');
