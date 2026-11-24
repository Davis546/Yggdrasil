import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const noop=()=>{};const elements=new Map();
function el(id){if(!elements.has(id))elements.set(id,{id,style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},dataset:{},value:'normal',textContent:'',hidden:false,innerHTML:'',addEventListener:noop,querySelector:()=>el('child'),getContext:()=>new Proxy({}, {get:()=>noop}),getBoundingClientRect:()=>({width:480,height:288,left:0,top:0})});return elements.get(id);}
const sandbox={window:{innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:noop},navigator:{maxTouchPoints:0,userAgent:'Desktop'},document:{body:el('body'),documentElement:el('html'),getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('query'),createElement:()=>el('created'),addEventListener:noop},Image:class{complete=true;naturalWidth=448;naturalHeight=448;set src(v){this._src=v}get src(){return this._src}},performance:{now:()=>1000},requestAnimationFrame:noop,localStorage:{getItem:()=>null,setItem:noop},YG_AUDIO:{play:noop,syncMusic:noop},console,Math,Date,Map,Set,WebSocket:class{},location:{protocol:'https:',host:'local.test'},setTimeout:noop,clearTimeout:noop};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8'),sandbox,{timeout:5000});
const evaluate=(s)=>vm.runInContext(s,sandbox,{timeout:5000});
const japanese=evaluate('cards.map(c=>({id:c.id,rarity:c.rarity,hero:c.hero}))');
assert.ok(japanese.length>20);
const eligible=new Set(japanese.filter(c=>c.rarity!=='legendary').map(c=>c.id));
let seen=new Set();
for(let j=0;j<150;j++){
 const hero=['loid','kris','cross','eve','kali'][j%5];
 const p=evaluate(`selectedCampaign='nordic';start('${hero}');player`);
 assert.equal(evaluate('stage'),21);assert.equal(p.nordicStarterGranted,true);
 assert.equal(p.cards.length,5);assert.equal(new Set(p.cards).size,5);
 for(const id of p.cards){assert.ok(eligible.has(id),`Non-Japanese or legendary: ${id}`);const c=japanese.find(c=>c.id===id);assert.ok(!c.hero||c.hero===hero);seen.add(id);}
 assert.ok(p.maxHp<=p.baseMaxHp*1.45+1e-6);
 assert.ok(p.damage<=p.baseDamage*1.30+1e-6);
 assert.ok(p.attackDelay>=p.baseAttackDelay*.85-1e-6);
 assert.ok(p.speed<=p.baseSpeed*1.20+1e-6);
 assert.ok(p.reach<=p.baseReach*1.20+1e-6);
 assert.ok(p.armor<=.25+1e-6);assert.ok(p.crit<=.32+1e-6);
 assert.ok(p.echo<=.2+1e-6);assert.ok(p.dodgeChance<=.25+1e-6);
 assert.equal(p.hp,p.maxHp);
 const before=p.cards.join(',');
 const options=evaluate('pickCards().map(c=>c.id)');assert.deepEqual([...options],['supply_heal','supply_rest','supply_recover']);
 evaluate('awardCard(player,nordicSupplies[1])');
 assert.equal(evaluate('player.cards.join(",")'),before);
 evaluate('awardCard(player,cards.find(c=>c.id==="heart"))');
 assert.equal(evaluate('player.cards.join(",")'),before,'Nordic exceeded 5 card cap');
}
assert.ok(seen.size>=10,'Japanese pool too limited');
const a=evaluate("selectedCampaign='nordic';activeCampaign='nordic';coop.active=true;coop.host=true;coop.id='host';coop.members=[{id:'host',hero:'loid'},{id:'guest',hero:'eve'}];coopInitAllies();coop.allies.get('guest')");
assert.equal(a.cards.length,5);assert.ok(a.cards.every(id=>eligible.has(id)));
evaluate("coop.active=false;selectedCampaign='japan';start('kris');");
assert.equal(evaluate('player.cards.length'),0);
assert.ok(evaluate('pickCards().every(c=>!c.id.startsWith("supply_"))'));
assert.equal(evaluate('createPlayer("eve").skillDelay'),17.5);
console.log(`NORDIC BALANCED JAPANESE DECK PASS: 150 5-card draws, ${seen.size} Japanese cards seen, Nordic caps, co-op and supplies`);
