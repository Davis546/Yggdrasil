import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../public/',import.meta.url), read=n=>fs.readFileSync(new URL(n,root),'utf8');
const order=['kris','loid','cross','eve','kali','mollitiam','moretti','l0id','josue'];
// Minimal DOM harness exercises the actual carousel script, its pointer handlers and original buttons.
class El {
 constructor(tag='div'){this.tag=tag;this.children=[];this.parentElement=null;this.attrs={};this.dataset={};this.hidden=false;this.listeners={};this.classList={add:()=>{}};this.className='';}
 append(...nodes){for(const n of nodes){if(n.parentElement)n.parentElement.children=n.parentElement.children.filter(x=>x!==n);n.parentElement=this;this.children.push(n);}}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
 querySelectorAll(){return this.children.filter(x=>x.dataset.coopHero);}querySelector(s){return this.children.find(x=>x.tag===s);}getClientRects(){return this.hidden?[]:[{}];}
 addEventListener(n,f){(this.listeners[n]??=[]).push(f);}emit(n,e={}){for(const f of this.listeners[n]??[])f(e);}focus(){}setPointerCapture(){}closest(s){return s==='.hs50-card'?this:null;}
}
const grid=new El(),body=new El();body.append(grid);for(const id of [...order].reverse()){const b=new El('button');b.dataset.coopHero=id;b.append(new El('img'));grid.append(b);}
let now=1000,reduce=false,change,visibility;const mq={get matches(){return reduce;},addEventListener(_,cb){change=cb;}};
const context={window:{matchMedia:()=>mq},document:{body,querySelectorAll:()=>[grid],createElement:t=>new El(t)},performance:{now:()=>now},IntersectionObserver:class{constructor(cb){this.cb=cb;}observe(){}},MutationObserver:class{constructor(cb){visibility=cb;}observe(){}}};
vm.runInNewContext(read('hero-select50.js'),context);
const visible=()=>grid.children.filter(x=>x.dataset.cardHero&&!x.hidden).map(x=>x.dataset.cardHero);
const card=id=>grid.children.find(x=>x.dataset.cardHero===id);const next=grid.children.find(x=>x.className.includes('hs50-next')||x.attrs['aria-label']==='Próximos personagens'),prev=grid.children.find(x=>x.attrs['aria-label']==='Personagens anteriores');
assert.deepEqual(visible(),order.slice(0,2));assert.equal(prev.disabled,true);assert.equal(card('cross').querySelector('img').getAttribute('src'),null);
for(let p=1;p<4;p++){next.emit('click');assert.deepEqual(visible(),order.slice(p*2,p*2+2));}assert(!next.disabled);next.emit('click');assert.deepEqual(visible(),['josue']);assert(next.disabled);prev.emit('click');assert.equal(card('l0id').querySelector('img').getAttribute('src'),'assets/ui/select50/l0id.webp');
prev.emit('click');assert.deepEqual(visible(),order.slice(4,6));
const base={pointerId:1,isPrimary:true,button:0,clientY:100,target:card('kali'),preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};
grid.emit('pointerdown',{...base,clientX:200});grid.emit('pointermove',{...base,clientX:130});grid.emit('pointerup',{...base,clientX:130});assert.deepEqual(visible(),order.slice(6,8));
const click={...base};grid.emit('click',click);assert(click.stopped);now+=400;const normal={...base};grid.emit('click',normal);assert(!normal.stopped);
reduce=true;change();assert(card('l0id').querySelector('img').getAttribute('src').endsWith('-still.webp'));
grid.hidden=true;visibility();assert.equal(card('l0id').querySelector('img').getAttribute('src'),null);grid.hidden=false;visibility();assert(card('l0id').querySelector('img').getAttribute('src'));
for(const id of order){for(const ext of ['.webp','-still.webp']){const f=fs.readFileSync(new URL('assets/ui/select50/'+id+ext,root));assert.equal(f.toString('ascii',8,12),'WEBP');if(ext==='.webp')assert(f.includes(Buffer.from('ANIM')));}}
for(const name of ['index.html','game.html','duel.html']){const h=read(name);assert(h.includes('hero-select50.js?v=50'));assert(h.includes('hero-select50.css?v=50'));}
assert(read('index.html').includes('data-secret-l0id'));assert(read('game.js').includes("if(type==='l0id'&&!l0idUnlocked)return"));
console.log('PASS v50: pages, arrows, drag, click suppression, reduced motion, unload hidden cards, nine animated assets, existing selection lock and all entry pages.');
