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

const {run}=client();
run("difficulty='pecador';selectedCampaign='nordic';start('kris','pecadoNordic');enemies=[];waveBalance=coopBalance(1)");
assert.equal(run("addMob('draugr',100,200).hp"),361);
assert.equal(run("addMob('berserker',100,200,true).hp"),675);
assert.equal(run("addMob('beast',100,200,false,true).hp"),140);
run("waveBalance=coopBalance(5);enemies=[]");assert.equal(run("addMob('draugr',100,200).hp"),938);
run("waveBalance=coopBalance(1);enemies=[];pecadoSummon({x:500,y:500},30)");assert.equal(run('enemies.length'),10);
run("enemies=[];Math.random=()=>.99;spawnPecadoEcho({x:500,y:500})");assert.equal(run('enemies[0].hp'),496);
run("difficulty='normal';enemies=[];addMob('draugr',100,200)");assert.equal(run('enemies[0].hp'),125*(2.15+19*.16));
run("difficulty='pecador';activeCampaign='japan';stage=20;enemies=[];addMob('beast',100,200)");assert.equal(run('enemies[0].hp'),88*(1+19*.19)*1.5);
run("difficulty='pecador';selectedCampaign='nordic';start('kris','pecadoNordic')");assert.equal(run("enemies.find(e=>e.type==='pecado').hp"),17500*1.65*1.6);
run("start('josue');enemies=[];player.aim=0;attack();draw()");
const img=fs.readFileSync(new URL('../public/assets/heroes/josue_sheet.png',import.meta.url));assert.equal(img.readUInt32BE(16),336);assert.equal(img.readUInt32BE(20),448);
assert.match(src,/const size=40;ctx.save\(\);ctx.translate/);assert.match(src,/ctx.drawImage\(im,col\*112,row\*112,112,112,-size\/2,-34,size,size\)/);assert.match(html,/game\.js\?v=523/);
console.log('PASS 523: sprite dimensions, rendering, Nordic Pecador mob HP, co-op scale, summons, echo, boss and other modes unchanged');
