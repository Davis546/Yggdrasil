import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
function client(){
const noop=()=>{};const ctx=new Proxy({}, {get:(o,k)=>k==='measureText'?()=>({width:50}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop:noop}):o[k]??noop});
const nodes=new Map();function node(id=''){if(nodes.has(id)&&id)return nodes.get(id);const n={style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},addEventListener:noop,setAttribute(k,v){this[k]=v;},getContext:()=>ctx,getBoundingClientRect:()=>({width:832,height:384,x:0,y:0,left:0,top:0}),querySelector:()=>node(''),appendChild:noop,remove:noop,focus:noop,children:[],value:'normal'};if(id)nodes.set(id,n);return n;}
const storage=new Map();const document={body:node('body'),documentElement:node('root'),getElementById:node,querySelector:()=>node('scene'),querySelectorAll:()=>[],createElement:()=>node('')};
const sandbox={document,window:{matchMedia:()=>({matches:false}),innerWidth:832,innerHeight:384,addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'test'},Image:class{complete=true;naturalWidth=768;naturalHeight=1728;addEventListener(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>0},requestAnimationFrame:noop,YG_AUDIO:new Proxy({}, {get:()=>noop}),console,setTimeout:noop,clearTimeout:noop};
vm.createContext(sandbox);vm.runInContext(src,sandbox);const run=expr=>vm.runInContext(expr,sandbox);return {run,sandbox,nodes};
}


const c=client(),run=c.run;c.sandbox.WebSocket={OPEN:1};c.sandbox.capture=()=>{};
for(let i=0;i<6;i++)assert.equal(run(`registerScreenTap(${i*180})`),false);
assert.equal(run('registerScreenTap(1080)'),true);assert.equal(run('screenTaps.length'),0);
for(let i=0;i<8;i++)assert.equal(run(`registerScreenTap(${4000+i*800})`),false);
run("phase='play';player=createPlayer('kris');keys.add('d');mobileMove={x:1,y:0};setScreenAdjust(true)");assert(run('screenAdjusting'));assert.equal(run('keys.size'),0);assert.equal(run('mobileMove.x'),0);assert.equal(run("$('screenAdjust').hidden"),false);assert(!run("$('gameViewport').content").includes('user-scalable=no'));run('ctrlSettings.scale=1.4;resetScreenScale()');assert.equal(run('ctrlSettings.scale'),1);assert(run("$('gameViewport').content").includes('maximum-scale=1'));
const before=run('elapsed');run('frame(1000)');assert.equal(run('elapsed'),before,'solo simulation paused');run('setScreenAdjust(false)');assert(!run('screenAdjusting'));assert(run("$('gameViewport').content").includes('user-scalable=no'));
run("phase='coop';coop.socket={readyState:1,bufferedAmount:0,send:capture};coopOnMessage({t:'welcome',id:'h',code:'ABC123',host:'h',members:[{id:'h',hero:'kris'},{id:'a',hero:'kali'}],boss:'japan',positions:{h:{x:780,y:490},a:{x:838,y:490}}})");
run("waiting.actors.get('h').x=900;waiting.actors.get('h').y=430;waitingTalk()");const index=run('waiting.dialogIndex.amaterasu');const text=run("$('waitingNpcText').textContent");run('for(let i=0;i<20;i++)waitingTalk();waitingTalk(true)');assert.equal(run('waiting.dialogIndex.amaterasu'),index);assert.equal(run("$('waitingNpcText').textContent"),text);
run('waitingFrame(waiting.dialogUntil-waiting.clock+.01,1000)');assert(run("$('waitingDialog').hidden"));run('waitingTalk()');assert.equal(run('waiting.dialogIndex.amaterasu'),index);run('waitingFrame(.7,2000);waitingTalk()');assert.equal(run('waiting.dialogIndex.amaterasu'),index+1);run('waitingDialogClose()');
for(const hero of ['kris','loid','cross','eve','kali','mollitiam','moretti','l0id']){run(`Object.assign(waiting.actors.get('h'),{type:'${hero}',x:780,y:490});keys.add('d');waitingFrame(.03,3000);keys.clear()`);assert(Math.abs(run("waiting.actors.get('h').x")-785.55)<.001,hero+' walks at same lobby speed');}
run('setScreenAdjust(true)');const clock=run('waiting.clock');const x=run("waiting.actors.get('h').x");run("keys.add('d');waitingFrame(.03,4000);keys.clear()");assert.equal(run("waiting.actors.get('h').x"),x);assert(run('waiting.clock')>clock);run('setScreenAdjust(false)');
run("phase='play';coop.remoteStarted=true;coop.host=true;player=createPlayer('kris');setScreenAdjust(true);globalThis.advanced=0;update=()=>{advanced++};draw=()=>{};coopSendMotion=()=>{};coopSendState=()=>{};frame(5000)");assert.equal(run('advanced'),1,'host continues shared simulation while adjusting screen');run('setScreenAdjust(false)');
for(const file of ['index.html','game.html']){const h=fs.readFileSync(new URL('../public/'+file,import.meta.url),'utf8');for(const id of ['titleAdjust','screenAdjust','screenAdjustDone','screenAdjustReset','gameViewport','settingsAdjust','settingsAudio','settingsVolume'])assert.equal((h.match(new RegExp('id="'+id+'"','g'))||[]).length,1);assert(!h.includes('id="waitingNext"'));assert(h.includes('game.js?v='+JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8')).version.replaceAll('.','')));assert(h.includes('touch-action:pinch-zoom'));assert(h.includes('maximum-scale=1,user-scalable=no')); }
console.log('PASS v499: seven taps, slow taps ignored, solo pause, automatic dialogue and anti-spam, all eight lobby heroes, local lobby pause, markup');
