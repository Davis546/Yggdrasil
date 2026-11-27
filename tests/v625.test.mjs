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

const {run,nodes,at}=client();
const eq=(expr,v)=>assert.equal(run(expr),v,expr);
run("start('loid','defense')");eq('tree62.hp',1200);eq('tree62.prep',true);eq('tree62.intro',true);eq('enemies.length',0);eq('voidStart625()',false);
run('update(.5);player.x=VOID_NPC625.x;player.y=VOID_NPC625.y+45;voidInteract625()');eq('voidDialog625',0);assert(!nodes.get('voidDialog625').hidden);run('voidNext625();voidNext625();voidNext625()');eq('tree62.intro',false);eq('tree62.prep',true);eq('tree62.seiva',150);eq('enemies.length',0);
run('player.x=WORLD_W/2;player.y=WORLD_H/2;applyBoundaries(player,8)');assert(run('dist(player,{x:WORLD_W/2,y:WORLD_H/2})>=103.99'));
run('player.x=VOID_HOUSES624[0].cx;player.y=VOID_HOUSES624[0].cy;applyBoundaries(player,8)');assert(run('dist(player,{x:VOID_HOUSES624[0].cx,y:VOID_HOUSES624[0].cy})>=87.99'));
run('player.x=724;player.y=800;tree62.seiva=1000');eq('voidBuy624(player,"wall")',false);
run('player.x=VOID_HOUSES624[1].x;player.y=VOID_HOUSES624[1].y;voidInteract625()');eq('voidShopOpen625',true);assert(!nodes.get('voidShop624').hidden);eq('voidBuy624(player,"repair")',false);eq('voidBuy624(player,"wall")',true);eq('tree62.builds.length',1);eq('tree62.seiva',930);
run('player.x=tree62.builds[0].x;player.y=tree62.builds[0].y;applyBoundaries(player,8)');assert(run('dist(player,tree62.builds[0])>=25.99'));
run('player.x=VOID_HOUSES624[0].x;player.y=VOID_HOUSES624[0].y;tree62.hp=800');eq('voidBuy624(player,"repair")',true);eq('tree62.hp',980);eq('voidBuy624(player,"wall")',false);
run('voidStart625()');eq('tree62.prep',false);assert(run('enemies.length>=14&&enemies.every(e=>e.type.startsWith("void_"))'));eq('voidBuy624(player,"repair")',false);eq('voidStart625()',false);
run('globalThis.wall=tree62.builds[0];globalThis.mob=voidMob624("tank",wall.x,wall.y);mob.attack=0;globalThis.whp=wall.hp;siege62(mob,.1)');assert(run('wall.hp<whp'));
run('enemies=[];waveClearTimer=0;update(.01)');eq('phase','reward');run('chooseCard(0)');eq('stage',2);eq('tree62.prep',true);eq('enemies.length',0);run('update(4)');eq('stage',2);eq('phase','play');eq('enemies.length',0);
run('stage=4;spawnStage()');assert(run('!!tree62.roamer'));run('player.x=tree62.roamer.x;player.y=tree62.roamer.y;player.hp=1;tree62.seiva=500');eq('voidBuyExtra625(player,"tonic")',true);assert(run('player.hp>1'));eq('tree62.seiva',415);
for(const [wave,root,boss] of [[5,0,'core'],[10,1,'herald'],[15,2,'will'],[20,3,'devourer'],[25,0,'core']]){run(`stage=${wave};spawnStage();voidStart625()`);eq('tree62.activeRoot',root);assert(run(`enemies.some(e=>e.type==='voidboss_${boss}'&&isBossEnemy(e))`));assert(run('tree62.cinematicUntil>elapsed'));at(wave*1000);run('updateHud()');assert(!nodes.get('voidCinematic625').hidden);run('globalThis.life=tree62.hp;treeHit62(99)');eq('tree62.hp',run('life'));run('elapsed=tree62.cinematicUntil+.1;updateHud()');}
run('tree62.hp=900;tree62.pulse=0;voidTick624(.8)');eq('tree62.hp',905);run('globalThis.arch=voidMob624("archer",WORLD_W/2,WORLD_H/2-175);arch.attack=0;tree62.builds=[];siege62(arch,.1)');assert(run('projectiles.some(p=>p.voidTree===true)'));run('draw()');
// Host-only next wave and authoritative remote purchases.
run('start("loid","defense");coop.active=true;coop.host=true;coop.id="host";coop.hostAvatar=player;coop.members=[{id:"host",hero:"loid"},{id:"guest",hero:"kris"}];coop.allies.set("guest",createPlayer("kris"));player.x=VOID_NPC625.x;player.y=VOID_NPC625.y+45;voidFinishIntro625();tree62.seiva=200;globalThis.a=coop.allies.get("guest");a.x=VOID_HOUSES624[1].x;a.y=VOID_HOUSES624[1].y;coopRemotePress("guest","voidBuy","wall",0,0,0)');eq('tree62.builds.length',1);eq('tree62.seiva',130);run('a.x=700;a.y=800;coopRemotePress("guest","voidBuy","wall",0,0,0)');eq('tree62.builds.length',1);run('coop.host=false');eq('voidStart625()',false);run('coop.host=true;voidStart625();a.x=VOID_HOUSES624[1].x;a.y=VOID_HOUSES624[1].y;coopRemotePress("guest","voidBuy","wall",0,0,0)');eq('tree62.builds.length',1);run('globalThis.wire=unpackWorld616(packWorld616({tree62,enemies}));');eq('wire.tree62.builds[0].hp',240);eq('wire.tree62.prep',false);eq('wire.enemies[0].type',run('enemies[0].type'));
run('coop.active=false;coop.host=false;coop.allies.clear();start("josue","japan")');eq('player.skillDelay',18);eq('player.secondaryDelay',23);
assert(html.includes('id="voidStart625"')&&html.includes('id="voidCinematic625"')&&html.includes('id="voidDialog625"'));assert(fs.existsSync(new URL('../public/assets/void624/arena625.webp',import.meta.url)));
console.log('PASS 625: introdução, preparação sem timer, colisões da árvore/casas/barricadas, lojas físicas, comerciante ambulante, ondas, quatro cutscenes, autoridade do host, compras remotas e compactação.');
