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

// Simulate display callbacks, isolate drawing from game and network workloads.
for(const hz of [30,60,90,120,144]){
 for(const mode of ['auto','leve','desempenho','qualidade']){
  const {run}=client();
  run(`renderMode='${mode}';autoFxTier=2;let testDraws=0,testElapsed=0;draw=()=>testDraws++;update=dt=>testElapsed+=dt;last=1000;`);
  for(let i=1;i<=hz;i++)run(`frame(${1000+i*1000/hz})`);
  assert.equal(run('testDraws'),hz,`${mode} ${hz} Hz`);
  if(hz>=60)assert(Math.abs(run('testElapsed')-1)<1e-8);
 }
}
assert(!src.includes('maxDrawGap'));
assert.match(html,/game\.js\?v=(?:49[5-9]|500|510)/);
console.log('PASS all 4 graphic modes draw every callback at 30, 60, 90, 120, 144 Hz; simulation timing at 60+ Hz');
