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

const {run,nodes}=client();const eq=(expr,v)=>assert.equal(run(expr),v,expr);
run("start('loid','defense');player.x=VOID_NPC625.x;player.y=VOID_NPC625.y+45;voidFinishIntro625();tree62.seiva=2500;player.x=VOID_HOUSES624[1].x;player.y=VOID_HOUSES624[1].y");
for(const k of ['wall','totem','thorn','tower','guard','sentinel','mender'])eq(`voidBuy624(player,'${k}')`,true);
eq('tree62.builds.length',7);eq('tree62.seiva',2500-70-110-125-160-180-165-145);
run('voidStart625();enemies=[];tree62.activeRoot=0;tree62.hp=800;player.hp=50;tree62.pulse=0;voidTick624(.8)');assert(run('tree62.hp>800&&player.hp>50&&tree62.fx626.some(f=>f.kind==="vida")'));
run('tree62.activeRoot=1;tree62.pulse=0;globalThis.e=voidMob624("tank",WORLD_W/2+120,WORLD_H/2);globalThis.ehp=e.hp;voidTick624(.8)');assert(run('e.hp<ehp&&tree62.fx626.some(f=>f.kind==="morte")'));
for(const k of ['thorn','tower','guard','sentinel']){run(`enemies=[];tree62.activeRoot=-1;globalThis.b=tree62.builds.find(b=>b.type==='${k}');globalThis.e=voidMob624('tank',b.x+25,b.y);globalThis.ehp=e.hp;tree62.pulse=0;voidTick624(.8)`);assert(run(`e.hp<ehp&&tree62.fx626.some(f=>f.kind==='${k}')`));}
run("globalThis.b=tree62.builds.find(b=>b.type==='mender');globalThis.w=tree62.builds.find(b=>b.type==='wall');w.x=b.x+30;w.y=b.y;w.hp=100;tree62.pulse=0;voidTick624(.8)");assert(run('w.hp>100&&tree62.fx626.some(f=>f.kind==="mender")'));
run('globalThis.net=unpackWorld616(packWorld616({tree62,enemies}));draw()');eq('net.tree62.builds.length',7);assert(run('net.tree62.fx626.length<=24&&net.tree62.fx626.length>0'));
for(const k of ['tree_idle','tree_vida','tree_morte','tree_vontade','tree_destino','barricada','barreira','totem','raiz','torre','guardiao','sentinela','reparador','loja','merchant','arena'])assert(fs.existsSync(new URL('../public/assets/void624/live626/'+k+'.webp',import.meta.url)));
for(const k of ['tower','guard','sentinel','mender'])assert(html.includes('id="voidBuy624_'+k+'"'));
console.log('PASS 626: compra de 7 defesas, reforços atacam e reparam, cura/morte, sprites, renderização simulada, FX limitados e snapshot cooperativo.');
