import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const noop=()=>{};const els=new Map();
function el(id){if(!els.has(id))els.set(id,{id,style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},value:'normal',innerHTML:'',textContent:'',addEventListener:noop,querySelector:()=>el('child'),getContext:()=>new Proxy({},{get:()=>noop}),getBoundingClientRect:()=>({width:480,height:288,left:0,top:0})});return els.get(id)}
const sandbox={window:{innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'Desktop'},document:{body:el('body'),documentElement:el('html'),getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('query'),createElement:()=>el('created'),addEventListener:noop},Image:class{complete=true;naturalWidth=1280;naturalHeight=1280;set src(s){this._src=s}},performance:{now:()=>1000},requestAnimationFrame:noop,localStorage:{getItem:()=>null,setItem:noop},YG_AUDIO:{play:noop,syncMusic:noop},console,Math,Date,Map,Set,WebSocket:class{},location:{protocol:'https:',host:'test.workers.dev'},setTimeout:noop,clearTimeout:noop};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),sandbox,{timeout:5000});
const ev=s=>vm.runInContext(s,sandbox,{timeout:5000});
const runes=ev('nordicCards.map(c=>({id:c.id,icon:c.icon}))');assert.equal(runes.length,20);assert.equal(new Set(runes.map(c=>c.icon)).size,20);
for(const r of runes){assert.ok(fs.statSync(new URL(`../public/assets/cards/futhark/${r.id.slice(2)}.png`,import.meta.url)).size>1000)}
const heroes=['loid','kris','cross','eve','kali'];
const specialIds={loid:'granita',kris:'frog',cross:'gaster',eve:'eveprime',kali:'mirrorguard'};
const seenRunes=new Set(), seenJapan=new Set();
for(let n=0;n<150;n++){
 const hero=heroes[n%5];const p=ev(`selectedCampaign='nordic';start('${hero}');player`);
 assert.equal(ev('stage'),21);assert.equal(p.cards.length,5);assert.equal(new Set(p.cards).size,5);
 assert.equal(p.cards.filter(x=>x.startsWith('n_')).length,0,'Starting cards cannot be Futhark');
 assert.equal(p.runes.length,0,'Runes must be selected AFTER defeating waves');
 assert.ok(!p.cards.includes(specialIds[hero]),`Special should be earned later for ${hero}`);
 for(const id of p.cards)seenJapan.add(id);
 assert.ok(p.maxHp<=p.baseMaxHp*1.45+1e-6);assert.ok(p.damage<=p.baseDamage*1.30+1e-6);
 const offers=ev('pickCards().map(c=>c.id)');assert.equal(offers.length,3);
 assert.equal(new Set(offers).size,3);assert.ok(offers.every(x=>x.startsWith('n_')),'Futhark belongs in wave rewards');
 for(const id of offers)seenRunes.add(id);
 const original=p.cards.join(',');
 for(let i=0;i<5;i++){
   const id=ev('pickCards()[0].id');
   assert.ok(ev(`awardCard(player,nordicCards.find(c=>c.id==='${id}'))`));
 }
 assert.equal(ev('player.runes.length'),5);
 assert.equal(new Set(ev('player.runes')).size,5);
 assert.equal(ev('player.cards.join(",")'),original,'Japanese starters must not be overwritten');
 assert.equal(ev('awardCard(player,nordicCards[0])'),false,'5-rune cap not enforced');
 assert.deepEqual([...ev('pickCards().map(c=>c.id)')],['supply_heal','supply_rest','supply_recover']);
}
assert.equal(seenRunes.size,20,'Some of 20 runes never appear in reward draw');
assert.ok(seenJapan.size>=10,'Japanese deck not used at start');
const a=ev("selectedCampaign='nordic';activeCampaign='nordic';coop.active=true;coop.host=true;coop.id='host';coop.members=[{id:'host',hero:'loid'},{id:'guest',hero:'eve'}];coopInitAllies();coop.allies.get('guest')");
assert.equal(a.cards.length,5);assert.ok(!a.cards.includes('eveprime'));assert.equal(a.runes.length,0);
ev("awardCard(coop.allies.get('guest'),nordicCards[0])");
assert.equal(ev("coop.allies.get('guest').runes.length"),1);
ev('coop.active=false');
ev("selectedCampaign='japan';start('kris')");assert.equal(ev('player.cards.length'),0);
ev("selectedCampaign='nordic';start('eve');skill()");assert.equal(ev('player.evePrimeTime||0'),0);assert.ok(!ev('player.evePrimeCard'));ev('stage=25');assert.ok(ev("pickCards().some(c=>c.id==='eveprime')"));ev("awardCard(player,cards.find(c=>c.id==='eveprime'))");assert.equal(ev('player.cardPower'),'eveprime');ev('cardPower()');assert.equal(ev('player.evePrimeTime'),6);assert.equal(ev('player.cardPowerUsed'),true);ev('update(.5)');assert.ok(ev('player.evePrimeTime')<6);
console.log('FUTHARK rewards, 5 ordinary JAPANESE starters, unlockable specials and Eve F PASS');
