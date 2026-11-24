import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const noop=()=>{};const els=new Map();function el(id){if(!els.has(id))els.set(id,{style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},value:'normal',textContent:'',innerHTML:'',addEventListener:noop,querySelector:()=>el('c'),getContext:()=>new Proxy({},{get:()=>noop}),getBoundingClientRect:()=>({width:480,height:288,left:0,top:0})});return els.get(id)}
const sb={window:{innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'Desktop'},document:{body:el('body'),documentElement:el('html'),getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('q'),createElement:()=>el('c'),addEventListener:noop},Image:class{complete=true;naturalWidth=1280;naturalHeight=1280;set src(v){this._src=v}},performance:{now:()=>1000},requestAnimationFrame:noop,localStorage:{getItem:()=>null,setItem:noop},YG_AUDIO:{play:noop,syncMusic:noop},console,Math,Date,Map,Set,WebSocket:class{},location:{protocol:'https:',host:'test.workers.dev'},setTimeout:noop,clearTimeout:noop};vm.createContext(sb);vm.runInContext(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),sb,{timeout:5000});
const ev=s=>vm.runInContext(s,sb,{timeout:16000});
ev("selectedCampaign='nordic';start('eve','odin');player.hp=100000;player.maxHp=100000;");assert.equal(ev('stage'),30);assert.equal(ev("enemies.filter(e=>e.type==='odin').length"),1);
let hp=ev("enemies.find(e=>e.type==='odin').maxHp");assert.ok(hp>6000);ev("for(let i=0;i<750;i++)update(.016)");assert.ok(ev("enemies.find(e=>e.type==='odin').specialIndex")>=3,'Odin did not attack');
ev("selectedCampaign='nordic';start('eve','nameless');player.hp=100000;player.maxHp=100000;");
ev("{const k=enemies.find(e=>e.type==='nameless');k.hp=k.maxHp*.5;update(.016)}");
assert.equal(ev("enemies.filter(e=>e.type==='ancestralDragon').length"),1);assert.ok(ev("enemies.find(e=>e.type==='ancestralDragon').hp")>1000);
assert.ok(ev("enemies.find(e=>e.type==='ancestralDragon').fireCd")>0);
ev("for(let i=0;i<650;i++)update(.016)");
const d=ev("enemies.find(e=>e.type==='ancestralDragon')");assert.ok(d&&d.hp>0);assert.ok(d.fireAngle!==undefined);
// Confirm both have to die. Kill Knight while dragon lives, no premature completion.
ev("{const k=enemies.find(e=>e.type==='nameless');k.hp=0;enemies=enemies.filter(e=>e.hp>0)}");assert.equal(ev("enemies.some(e=>e.type==='ancestralDragon'&&e.hp>0)"),true);
ev('for(let i=0;i<70;i++)update(.016)');assert.equal(ev('phase'),'play');
assert.ok(fs.statSync(new URL('../public/assets/audio/nameless_wave15.m4a',import.meta.url)).size>1000000);
assert.ok(fs.statSync(new URL('../public/assets/nordic/odin_sheet.png',import.meta.url)).size>1000000);
console.log('ODIN PHASES, AUTONOMOUS DRAGON, FIRE ATTACKS, 2-BOSS VICTORY AND AUDIO PASS');
