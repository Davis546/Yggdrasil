import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const noop=()=>{};const els=new Map();
function el(id){if(!els.has(id))els.set(id,{id,style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},value:'normal',innerHTML:'',textContent:'',addEventListener:noop,querySelector:()=>el('child'),getContext:()=>new Proxy({},{get:()=>noop}),getBoundingClientRect:()=>({width:480,height:288,left:0,top:0})});return els.get(id)}
const sandbox={window:{innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'Desktop'},document:{body:el('body'),documentElement:el('html'),getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('query'),createElement:()=>el('created'),addEventListener:noop},Image:class{complete=true;naturalWidth=1280;naturalHeight=1280;set src(s){this._src=s}},performance:{now:()=>1000},requestAnimationFrame:noop,localStorage:{getItem:()=>null,setItem:noop},YG_AUDIO:{play:noop,syncMusic:noop},console,Math,Date,Map,Set,WebSocket:class{},location:{protocol:'https:',host:'test.workers.dev'},setTimeout:noop,clearTimeout:noop};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),sandbox,{timeout:5000});
const ev=s=>vm.runInContext(s,sandbox,{timeout:5000});

const evalGame=ev;
// Baseline Q and R must remain available regardless of the card.
evalGame("selectedCampaign='japan';start('eve')");
assert.equal(evalGame('player.cardPower'), '');
assert.equal(evalGame('player.evePrimeTime||0'),0);
evalGame('cardPower()');assert.equal(evalGame('player.evePrimeTime||0'),0);
evalGame('skill()');assert.ok(evalGame('player.skillCd')>0);assert.equal(evalGame('player.evePrimeTime||0'),0);
evalGame('player.ultimateCharge=100;ultimate()');assert.equal(evalGame('player.voidUltimate'),2.5);assert.equal(evalGame('player.ultimateCharge'),0);
// A card drawn in Japan also unlocks F rather than modifying existing inputs.
evalGame("selectedCampaign='japan';start('eve');awardCard(player,cards.find(c=>c.id==='eveprime'));");
assert.equal(evalGame('player.cardPower'),'eveprime');
evalGame('skill()');assert.equal(evalGame('player.evePrimeTime||0'),0);
evalGame('cardPower()');assert.equal(evalGame('player.evePrimeTime'),6);
// With the card, Q still casts void, R remains void expansion, and F activates the time buff.
evalGame("selectedCampaign='nordic';start('eve')");
assert.equal(evalGame('player.cardPower'),'eveprime');assert.equal(evalGame('player.cardPowerUsed'),false);
assert.equal(evalGame('player.cards.length'),5);
evalGame('skill()');assert.ok(evalGame('player.skillCd')>0);assert.equal(evalGame('player.evePrimeTime||0'),0);
evalGame('player.ultimateCharge=100;ultimate()');assert.equal(evalGame('player.voidUltimate'),2.5);
evalGame('cardPower()');assert.equal(evalGame('player.cardPowerUsed'),true);assert.equal(evalGame('player.evePrimeTime'),6);
assert.equal(evalGame("document.getElementById('btnCardPower').querySelector('b').textContent"),'AUGE F');
evalGame('player.dashCd=0;dash()');assert.ok(Math.abs(evalGame('player.dashCd')-evalGame('player.dashDelay')*.35)<1e-6);
evalGame('cardPower()');assert.equal(evalGame('player.evePrimeTime'),6,'F card cannot activate twice');
evalGame('player.voidUltimate=0;update(6)');assert.equal(evalGame('player.evePrimeTime'),0);
// Co-op host: guest Eve's special is executed on that guest, not on host avatar.
evalGame("selectedCampaign='nordic';start('loid');coop.active=true;coop.host=true;coop.id='host';coop.members=[{id:'host',hero:'loid'},{id:'guest',hero:'eve'}];coopInitAllies();");
assert.equal(evalGame("coop.allies.get('guest').cardPower"),'eveprime');
evalGame("coopRemotePress('guest','f')");assert.equal(evalGame("coop.allies.get('guest').evePrimeTime"),6);
assert.equal(evalGame('player.type'),'loid');
evalGame('coop.active=false');
console.log('EVE: Q original, R original, F only with card, one use, 6 s, faster dash, co-op PASS');
