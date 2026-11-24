import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const noop=()=>{};const els=new Map();
function el(id){if(!els.has(id))els.set(id,{id,style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},value:'normal',innerHTML:'',textContent:'',addEventListener:noop,querySelector:()=>el('child'),getContext:()=>new Proxy({},{get:()=>noop}),getBoundingClientRect:()=>({width:480,height:288,left:0,top:0})});return els.get(id)}
const sandbox={window:{innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'Desktop'},document:{body:el('body'),documentElement:el('html'),getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('query'),createElement:()=>el('created'),addEventListener:noop},Image:class{complete=true;naturalWidth=1280;naturalHeight=1280;set src(s){this._src=s}},performance:{now:()=>1000},requestAnimationFrame:noop,localStorage:{getItem:()=>null,setItem:noop},YG_AUDIO:{play:noop,syncMusic:noop},console,Math,Date,Map,Set,WebSocket:class{},location:{protocol:'https:',host:'test.workers.dev'},setTimeout:noop,clearTimeout:noop};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),sandbox,{timeout:5000});
const ev=s=>vm.runInContext(s,sandbox,{timeout:5000});
const runes=ev('nordicCards.map(c=>({id:c.id,icon:c.icon}))');assert.equal(runes.length,20);assert.equal(new Set(runes.map(c=>c.icon)).size,20);
for(const r of runes){assert.ok(fs.statSync(new URL(`../public/assets/cards/futhark/${r.id.slice(2)}.png`,import.meta.url)).size>1000)}
const heroes=['loid','kris','cross','eve','kali'];const specialIds={loid:'granita',kris:'frog',cross:'gaster',eve:'eveprime',kali:'mirrorguard'};
const seen=new Set();for(let n=0;n<150;n++){
 const hero=heroes[n%5];const p=ev(`selectedCampaign='nordic';start('${hero}');player`);
 assert.equal(ev('stage'),21);assert.equal(p.cards.length,5);assert.equal(new Set(p.cards).size,5);
 assert.equal(p.cards.filter(x=>x.startsWith('n_')).length,4);assert.ok(p.cards.includes(specialIds[hero]),`Missing special for ${hero}`);
 for(const id of p.cards.filter(x=>x.startsWith('n_')))seen.add(id);
 assert.ok(p.maxHp<=p.baseMaxHp*1.45+1e-6);assert.ok(p.damage<=p.baseDamage*1.30+1e-6);
 const original=p.cards.join(',');ev("awardCard(player,nordicCards[0]);");assert.equal(ev('player.cards.join(",")'),original);
 assert.deepEqual([...ev('pickCards().map(c=>c.id)')],['supply_heal','supply_rest','supply_recover']);
}
assert.equal(seen.size,20,'Runic RNG never used some runes');
const a=ev("selectedCampaign='nordic';activeCampaign='nordic';coop.active=true;coop.host=true;coop.id='host';coop.members=[{id:'host',hero:'loid'},{id:'guest',hero:'eve'}];coopInitAllies();coop.allies.get('guest')");assert.equal(a.cards.length,5);assert.ok(a.cards.includes('eveprime'));ev('coop.active=false');
ev("selectedCampaign='japan';start('kris')");assert.equal(ev('player.cards.length'),0);
ev("selectedCampaign='nordic';start('eve');skill()");assert.equal(ev('player.evePrimeTime'),6);assert.ok(ev('player.evePrimeCard'));
ev('update(.5)');assert.ok(ev('player.evePrimeTime')<6);
console.log('FUTHARK 20 symbols, 150 draws, 5 hero specials, caps, co-op and Eve Q PASS');
