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

const c=client(),run=c.run;
const eq=(expr,value)=>assert.equal(run(expr),value,expr);
run("secretCode('KR1S');start('mimic');enemies=[];player.aim=0");eq('player.damage',110);eq('player.maxHp',300);eq("mimicTransform(player,'boss:odin')",false);
run("enemies=[{id:1,type:'oni',hp:5000,maxHp:5000,x:player.x+40,y:player.y,radius:10}];skill()");assert(run('enemies[0].hp<5000&&player.skillCd>0'));run('player.hp=100;secondaryDown()');assert(run('player.hp>100&&player.secondaryCd>0'));run('player.ultimateCharge=100;ultimate()');eq('player.ultimateCharge',0);eq('player.ultimateBuffTime',10);eq("mimicTransform(player,'l0id')",false);
run("player.ultimateBuffTime=0;player.hp=150;player.skillCd=4;player.ultimateCharge=48;enemies=[]");eq("mimicTransform(player,'l0id')",true);assert(Math.abs(run('player.damage')-85*2.2)<1e-6);eq('player.maxHp',297);eq('player.hp/player.maxHp',.5);eq('player.skillCd',4);eq('player.ultimateCharge',48);eq('player.skillDelay',5.5);
run("enemies=[{id:2,type:'odin',hp:1,maxHp:1000,x:player.x+20,y:player.y,radius:15}];hitEnemy(enemies[0],100)");eq("player.mimicBosses.includes('odin')",true);eq("mimicTransform(player,'boss:odin')",false);run('elapsed+=9');eq("mimicTransform(player,'boss:odin')",true);eq('player.type','mimic');eq('player.mimicBoss','odin');eq('player.maxHp',420);eq("mimicTransform(player,'boss:reuni')",false);run('player.skillCd=0;player.secondaryCd=0;enemies=[{id:3,type:"oni",hp:10000,maxHp:10000,x:player.x+20,y:player.y,radius:10}];player.aim=0;skill();secondaryDown();heroSprite(player.x,player.y,player.type,player.face,player.step,false,1,player)');assert(run('enemies[0].hp<10000&&player.skillCd>0&&player.secondaryCd>0'));run('elapsed+=9');eq("mimicTransform(player,'mimic')",true);eq('player.mimicBoss',null);eq("player.mimicBosses.includes('odin')",true);
for(const id of ['boss','reuni','tsukuomi','pecado','frostjarl','odin','nameless','ancestralDragon']){run("start('mimic');enemies=[];player.mimicBosses=['"+id+"'];");eq("mimicTransform(player,'boss:"+id+"')",true);run('heroSprite(player.x,player.y,player.type,player.face,player.step,false,1,player);player.skillCd=0;player.secondaryCd=0;skill();secondaryDown();player.ultimateCharge=100;ultimate()');}
run("start('mimic','nordic');updateHud()");eq('player.mimicBosses.length',0);assert.equal(c.nodes.get('nordicCardHUD').style.display,'none');assert(c.nodes.get('counterText').textContent.includes('J5 F0/19'));
for(const name of ['index.html','game.html']){const h=fs.readFileSync(new URL('../public/'+name,import.meta.url),'utf8');assert(h.includes('game.js?v=560'));assert(h.includes('data-mimic-form="boss:odin"'));assert(h.includes('.nordic-card-hud{display:none!important}'));}
console.log('PASS V5.6: poderes Q/E/R, buffs, cooldown, captura, bloqueio e renderização de boss, reinício e HUD compacto.');
