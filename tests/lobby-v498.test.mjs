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

import {existsSync} from 'node:fs';
const c=client();const run=c.run;
c.sandbox.WebSocket={OPEN:1};c.sandbox.capture=()=>{};
run("phase='coop';coop.socket={readyState:1,bufferedAmount:0,send:capture};coopOnMessage({t:'welcome',id:'h',code:'ABC123',host:'h',members:[{id:'h',hero:'kris'},{id:'a',hero:'kali'}],boss:'japan',positions:{h:{x:780,y:490},a:{x:838,y:490}}})");
assert(run('waitingVisible()'));
for(let i=0;i<5;i++)assert(run(`waitingJapanWalk(waitingSpawn(${i},false).x,waitingSpawn(${i},false).y)`),'valid spawn '+i);
assert(run('waitingJapanWalk(780,490)'));assert(!run('waitingJapanWalk(550,680)'),'river blocks movement');assert(!run('waitingJapanWalk(1088,365)'),'building blocks movement');assert(!run('waitingJapanWalk(914,391)'),'NPC collision');
assert(run('waitingJapanWalk(570,478)'),'bridge walkable');
run("waiting.actors.get('h').x=900;waiting.actors.get('h').y=430;waitingTalk()");assert.equal(run('waiting.dialog.id'),'amaterasu');assert.equal(run("$('waitingDialog').hidden"),false);assert.match(run("$('waitingNpcName').textContent"),/Amaterasu/);const pos=run("waiting.actors.get('h').x");run("keys.add('d');waitingFrame(.03,1000);keys.clear()");assert.equal(run("waiting.actors.get('h').x"),pos);run('waitingTalk(true);waitingDialogClose()');assert(run("$('waitingDialog').hidden"));
run("waiting.actors.get('h').x=980;waiting.actors.get('h').y=465;waitingTalk()");assert.equal(run('waiting.dialog.id'),'caine');assert.match(run("$('waitingNpcName').textContent"),/Caine/);run('waitingDialogClose()');
run("coopMode='nordic';waitingRoster();waitingUI()");assert.equal(run('waitingNearest()'),null);assert.equal(run("waiting.actors.get('h').y"),600);assert.equal(run("$('waitingMapTitle').textContent"),'MIDGARD · REFÚGIO DO NORTE');
run('waitingReset()');assert(!run('waitingVisible()'));assert.equal(run('waiting.actors.size'),0);
for(const f of ['japan.png','amaterasu0.png','amaterasu1.png','amaterasu2.png','amaterasu3.png','caine.png','amaterasu_portrait.webp','caine_portrait.webp'])assert(existsSync(new URL('../public/assets/lobby/'+f,import.meta.url)));
for(const f of ['index.html','game.html']){const markup=fs.readFileSync(new URL('../public/'+f,import.meta.url),'utf8');for(const id of ['waitingMenu','waitingOptions','waitingInteract','waitingDialog','waitingChange','coopRoomCode','coopCopy','coopBegin'])assert.equal((markup.match(new RegExp('id="'+id+'"','g'))||[]).length,1);assert(markup.includes('body.waiting-full'));}
console.log('PASS v498: spawn, water/building/NPC collision, bridge, both private dialogues, local movement lock, realm change, reset, assets, mobile layout markup');
