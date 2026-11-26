import assert from 'node:assert/strict';import fs from 'node:fs';import {WORLD,NPC,HEROS,walkable,move} from '../public/story-world.js';
assert.equal(Object.keys(HEROS).length,9);assert.equal(HEROS.mollitiam[0],320);assert.equal(HEROS.moretti[1],18);assert.equal(HEROS.l0id[1],85);
const root=new URL('../public/',import.meta.url);let gates=0,monsters=0;
for(const [id,m] of Object.entries(WORLD)){
 if(!m.interior)assert.ok(fs.existsSync(new URL('assets/story/'+id+'.webp',root)),id);
 const first=m.gates[0],seen=new Set([first.x+','+first.y]),q=[[first.x,first.y]];
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){let k=a+','+b;if(!seen.has(k)&&walkable(m,a,b)){seen.add(k);q.push([a,b]);}}}
 for(const g of m.gates){gates++;assert.ok(walkable(m,g.x,g.y),id+' '+g.label);assert.ok(seen.has(g.x+','+g.y),id+' disconnected '+g.label);if(g.to!=='return'){assert.ok(WORLD[g.to],g.to);assert.ok(walkable(WORLD[g.to],g.tx,g.ty),id+' spawn '+g.to);}}
 for(const n of m.npcs||[]){assert.ok(NPC[n.id]);assert.ok(seen.has(n.x+','+n.y),id+' NPC');assert.ok(!['amaterasu','susano','susanoo'].includes(n.id));if(n.id!=='caine'){for(const suffix of ['.png','-portrait.webp'])assert.ok(fs.existsSync(new URL('assets/story/'+n.id+suffix,root)));}}
 for(const e of m.enemies||[]){monsters++;assert.ok(!m.safe);assert.ok(seen.has(e.x+','+e.y),id+' enemy');}
 assert.equal(walkable(m,-10,100),false);assert.equal(walkable(m,0,0),false);
 const a={x:first.x,y:first.y};move(m,a,-500,-500);assert.ok(walkable(m,a.x,a.y));
}
const a={x:190,y:140};move(WORLD.city1,a,0,5,1.6,[{x:190,y:145,r:2}]);assert.ok(a.y<142,'NPC collision');
const reachable=new Set(['city1']),queue=['city1'];for(let i=0;i<queue.length;i++)for(const g of WORLD[queue[i]].gates)if(g.to!=='return'&&!reachable.has(g.to)){reachable.add(g.to);queue.push(g.to);}assert.equal(reachable.size,Object.keys(WORLD).length);
for(const n of ['index.html','game.html']){const html=fs.readFileSync(new URL(n,root),'utf8');assert.match(html,/id="titleStory"/);assert.match(html,/id="nordicRealmBtn" hidden/);assert.ok(html.indexOf('id="titleSelect"')>html.indexOf('id="titleOnline"'));}
console.log('PASS story51: '+reachable.size+' maps; '+gates+' gates, '+monsters+' enemies; collision, NPC assets, level stats, story menu.');
