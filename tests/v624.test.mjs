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

const {run,nodes}=client();
const eq=(expr,v)=>assert.equal(run(expr),v,expr);
run("start('loid','defense')");eq('tree62.hp',1200);assert(run('enemies.length>=14&&enemies.every(e=>e.type.startsWith("void_"))'));
run('stage=5;spawnStage()');eq('tree62.activeRoot',0);assert(run('enemies.some(e=>e.type==="voidboss_core"&&isBossEnemy(e))'));run('tree62.hp=900;tree62.pulse=0;voidTick624(.8)');eq('tree62.hp',905);
run('stage=10;spawnStage()');eq('tree62.activeRoot',1);assert(run('enemies.some(e=>e.type==="voidboss_herald")'));
run('stage=15;spawnStage()');eq('tree62.activeRoot',2);assert(run('enemies.some(e=>e.type==="voidboss_will")'));
run('stage=20;spawnStage()');eq('tree62.activeRoot',3);assert(run('enemies.some(e=>e.type==="voidboss_devourer")'));assert(run('new Set(enemies.filter(e=>!isBossEnemy(e)).map(e=>e.type)).size===10'));
run('stage=25;spawnStage()');eq('tree62.activeRoot',0);
run('phase="reward";tree62.seiva=1000;tree62.rewardStage=0;voidReward624();globalThis.coins=tree62.seiva;voidReward624()');eq('tree62.seiva',run('coins'));eq('voidBuy624(player,"wall")',true);eq('tree62.builds.length',1);eq('tree62.seiva',run('coins-70'));
run('phase="play";globalThis.wall=tree62.builds[0];globalThis.mob=voidMob624("tank",wall.x,wall.y);mob.attack=0;globalThis.whp=wall.hp;siege62(mob,.1)');assert(run('wall.hp<whp'));eq('voidBuy624(player,"wall")',false);
run('player.x=170;player.y=210;tree62.hp=800;');eq('voidBuy624(player,"repair")',true);eq('tree62.hp',980);eq('voidBuy624(player,"barrier")',true);
run('globalThis.arch=voidMob624("archer",WORLD_W/2,WORLD_H/2-150);arch.attack=0;tree62.builds=[];siege62(arch,.1)');assert(run('projectiles.some(p=>p.voidTree===true)'));run('draw()');
run('start("loid","defense");coop.active=true;coop.host=true;coop.id="host";coop.hostAvatar=player;coop.members=[{id:"host",hero:"loid"},{id:"guest",hero:"kris"}];coop.allies.set("guest",createPlayer("kris"));tree62.seiva=200;phase="reward";coopRemotePress("guest","voidBuy","wall",0,0,0)');eq('tree62.builds.length',1);eq('tree62.seiva',130);run('globalThis.wire=unpackWorld616(packWorld616({tree62,enemies}));');eq('wire.tree62.builds[0].hp',240);eq('wire.enemies[0].type',run('enemies[0].type'));run('coop.active=false;coop.host=false;coop.allies.clear();start("josue","japan")');eq('player.skillDelay',18);eq('player.secondaryDelay',23);run('player.ultimateCharge=0;josueAbility("Q")');eq('player.ultimateCharge',3);
assert(html.includes('id="voidShop624"')&&html.includes('id="voidReward624"'));for(const n of ['arena.webp','crawler.png','runner.png','tank.png','archer.png','mage.png','summoner.png','corruptor.png','bomb.png','assassin.png','spectral.png','core.png','herald.png','will.png','devourer.png'])assert(fs.existsSync(new URL('../public/assets/void624/'+n,import.meta.url)));
console.log('PASS 624: mapa, dez minions, quatro chefes, raízes, economia, barricada destrutível, lojas, flecha e Josué.');
