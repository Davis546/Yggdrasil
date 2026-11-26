import assert from 'node:assert/strict';import fs from 'node:fs';import {WORLD,NPC,walkable,move} from '../public/story-world.js';
const pub=new URL('../public/',import.meta.url),read=n=>fs.readFileSync(new URL(n,pub),'utf8');let gates=0,exteriors=0;
for(const [id,m] of Object.entries(WORLD)){
 const start=m.gates[0],q=[[start.x,start.y]],seen=new Set([start.x+400*start.y]);assert(walkable(m,start.x,start.y),id+' start');
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=a+400*b;if(!seen.has(k)&&walkable(m,a,b)){seen.add(k);q.push([a,b]);}}}
 for(const a of [...m.gates,...m.npcs,...m.enemies,...(m.civilianSlots||[]).map(([x,y])=>({x,y}))])assert(seen.has(a.x+400*a.y),id+' disconnected '+JSON.stringify(a));
 for(const g of m.gates){gates++;if(g.to!=='return')assert(walkable(WORLD[g.to],g.tx,g.ty),id+' arrival');if(g.door)assert(seen.has((g.rx??g.x)+400*(g.ry??g.y+12)),id+' door return');}
 for(const o of m.objects)assert(!walkable(m,o.x+o.w/2,o.y+o.h/2),id+' solid');
 if(!m.interior){exteriors++;const art=fs.readFileSync(new URL('assets/story/'+id+'.webp',pub));assert.equal(art.toString('ascii',8,12),'WEBP');assert(art.length>100000,id+' detailed background');assert(seen.size>17000,id+' usable area');}
}
assert.equal(gates,44);assert.equal(exteriors,11);assert.equal(Object.keys(WORLD).length,21);
for(let i=1;i<=6;i++){assert(NPC['villager'+i]);const png=fs.readFileSync(new URL('assets/story/villager'+i+'.png',pub));assert.equal(png[25],6,'NPC alpha channel');}
const story=read('story.js'),html=read('story.html');assert(story.includes("runHeld||keys.has('shift')"));assert(story.includes('running?1.65:1'));assert(story.includes("if(k===' ')dash()"));assert(story.includes("$('run').onlostpointercapture"));assert(html.includes('id="run"'));assert(html.includes('story.js?v=541'));assert(story.includes('jumpJosue'));assert(story.includes('actorsNPC.map(n=>({...n,r:2.2}))'));
let a={x:190,y:120},b={...a};move(WORLD.city1,a,0,12);move(WORLD.city1,b,0,12*1.65);assert(b.y>a.y+7,'sprint distance');
console.log(`PASS v54: 21 maps, ${exteriors} detailed exterior backgrounds, ${gates} gates, NPC alpha, route connectivity, sprint controls.`);
