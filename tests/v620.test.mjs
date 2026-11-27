import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
function client(source=src){
let clock=0;
const noop=()=>{};const ctx=new Proxy({}, {get:(o,k)=>k==='measureText'?()=>({width:50}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop:noop}):o[k]??noop});
const nodes=new Map();function node(id=''){if(nodes.has(id)&&id)return nodes.get(id);const n={style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},addEventListener:(event,cb)=>{n.handlers??={};n.handlers[event]=cb;},setAttribute:noop,getContext:()=>ctx,getBoundingClientRect:()=>({width:832,height:384,x:0,y:0,left:0,top:0}),querySelector:()=>node(''),appendChild:noop,remove:noop,focus:noop,children:[],value:'normal'};if(id)nodes.set(id,n);return n;}
const storage=new Map();const document={body:node('body'),documentElement:node('root'),getElementById:node,querySelector:()=>node('scene'),querySelectorAll:()=>[],createElement:()=>node('')};
const sandbox={document,window:{matchMedia:()=>({matches:false}),innerWidth:832,innerHeight:384,addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'test'},Image:class{complete=true;naturalWidth=768;naturalHeight=1728;addEventListener(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>clock},requestAnimationFrame:noop,YG_AUDIO:new Proxy({}, {get:()=>noop}),console,setTimeout:noop,clearTimeout:noop};
vm.createContext(sandbox);vm.runInContext(source,sandbox);const run=expr=>vm.runInContext(expr,sandbox);return {run,sandbox,nodes,at:t=>{clock=t}};
}

const {run,nodes}=client(); const eq=(e,v)=>assert.equal(run(e),v,e);
run("start('loid','rush'); globalThis.base=player.baseMaxHp; awardCard(player,cards.find(c=>c.id==='heart'))");eq('player.maxHp',run('base+36'));run("for(let i=0;i<200;i++){awardCard(player,cards.find(c=>c.id==='heart'));awardCard(player,cards.find(c=>c.id==='blade'));}");assert(run('player.maxHp<=Math.round(base*2.25)&&player.damage<=player.baseDamage*1.65'));assert(run('newDamage(player)<2'));assert(run('rushScale(30)>rushScale(20)'));
run("start('abloy','defense');");eq('defense62',true);eq('tree62.hp',1200);assert(run('enemies.length>=6'));run("globalThis.mob=enemies[0];mob.x=WORLD_W/2;mob.y=WORLD_H/2;mob.attack=0;tree62.shield=0;siege62(mob,.1)");assert(run('tree62.hp<1200'));run("awardCard(player,cards.find(c=>c.id==='tree_repair'))");eq('tree62.hp',1200);run('stage=21;spawnStage()');eq('isNordic()',false);eq('isCampaignFinalWave()',false);assert(run('enemies.length>20'));run('treeHit62(2000)');eq('phase','over');eq('tree62.hp',0);
run("start('loid','japan');coop.active=true;coop.host=true;coop.id='host';coop.members=[{id:'host',hero:'loid'},{id:'g',hero:'abloy'}];coop.allies.set('g',createPlayer('abloy'));");eq("synergyAllowed62(player,'sy_shadow')",true);eq("awardCard(player,cards.find(c=>c.id==='sy_shadow'))",true);eq("awardCard(player,cards.find(c=>c.id==='sy_shadow'))",false);eq("awardCard(player,cards.find(c=>c.id==='tree_repair'))",false);run('coop.active=false;coop.host=false;completeWave60();');eq('profile62().xp.loid',10);run('completeWave60()');eq('profile62().xp.loid',10);
run("start('mimic','rush');enemies=[];globalThis.b=addStageBoss('reuni',{x:200,y:200},10);b.hp=0;captureMimicBoss(b);mimicTransform(player,'boss:reuni');");eq('player.mimicBoss','reuni');run('draw()');
assert(html.includes('game.js?v=623')&&html.indexOf('id="profileClose62"')<html.indexOf('game.js?v=623'));console.log('PASS 620: limites de cartas, defesa, árvore, sinergia, maestria e transformação.');
