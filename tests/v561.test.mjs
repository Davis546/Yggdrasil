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
function form(id){run(`start('mimic');enemies=[];projectiles=[];player.mimicBosses=['${id}'];mimicTransform(player,'boss:${id}');player.aim=0;player.invuln=0;player.crit=0;player.echo=0;player.ultimateCharge=100;enemies=[{id:1,type:'walker',hp:10000,maxHp:10000,x:player.x+35,y:player.y,radius:10}]`);}
run("start('mimic');enemies=[];mimicTransform(player,'l0id')");eq('player.damage',102);eq('player.maxHp',180);eq('newDamage(player)',1);eq('player.skillDelay',9);
form('boss');run("mimicPower('E');hurtPlayer(40)");eq('player.mimicGuardUntil',0);eq('player.mimicMarks.length',1);run('elapsed+=.1;tickMimicMarks(player)');assert(run('enemies[0].hp<10000'));
form('reuni');run("mimicPower('E')");eq("shadowClones.filter(s=>s.kind==='mimicOni').length",3);run('drawShadowClone(shadowClones[0])');run("mimicPower('R');elapsed+=2;tickMimicMarks(player)");assert(run('enemies[0].hp<10000'));
form('tsukuomi');run('oldX=player.x;mimicPower("E")');assert(run('player.x>oldX'));run("mimicPower('R')");eq('player.mimicMarks.length',7);
form('frostjarl');run("mimicPower('E')");assert(run('enemies[0].slow>=5&&enemies[0].stunTime>0'));
form('odin');run("mimicPower('Q')");eq('projectiles.length',5);run("mimicPower('E')");eq('player.mimicMarks.length',5);run('elapsed+=2;tickMimicMarks(player)');assert(run('enemies[0].hp<10000'));run("mimicPower('R')");assert(run('player.shield>=player.maxHp*.45&&player.mimicWardUntil>elapsed'));
form('nameless');run('oldX=player.x;mimicPower("E")');assert(run('player.x>oldX'));run("mimicPower('R')");eq('player.mimicMarks.length',3);eq('projectiles.length',7);
form('ancestralDragon');run("mimicPower('Q')");eq("projectiles.filter(b=>b.mimicFx==='fire').length",7);run("mimicPower('R')");eq('player.mimicMarks.length',6);
form('pecado');run("mimicPower('E')");assert(run('enemies[0].corruptTime>=6&&fieldWeakness(enemies[0])>.3'));run("mimicPower('R')");eq("shadowClones.filter(s=>s.kind==='mimicEcho').length",2);eq('player.mimicMarks.length',8);
console.log('PASS V5.6.1: balanceamento, contra-ataque, invocação, teleporte, gelo, runas, investida, fogo e maldição.');
