import assert from 'node:assert/strict';import fs from 'node:fs';import {WORLD,walkable,move,inspectable,NPC} from '../public/story-world.js';
const root=new URL('../public/',import.meta.url);let gates=0,rooms=0,objects=0;
for(const [id,m] of Object.entries(WORLD)){
 const width=m.width||400,height=m.height||260;const g0=m.gates[0],key=(x,y)=>x+y*width;assert(walkable(m,g0.x,g0.y),id+' gate');const q=[[g0.x,g0.y]],seen=new Set([key(g0.x,g0.y)]);
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=key(a,b);if(!seen.has(k)&&walkable(m,a,b)){seen.add(k);q.push([a,b]);}}}
 for(const g of m.gates){gates++;assert(seen.has(key(g.x,g.y)),id+' disconnected gate');if(g.to!=='return')assert(walkable(WORLD[g.to],g.tx,g.ty),id+' invalid destination');if(g.door)assert(seen.has(key(g.rx??g.x,g.ry??g.y+12)),id+' invalid return');}
 for(const n of [...m.npcs,...m.enemies,...(m.civilianSlots||[]).map(([x,y])=>({x,y}))])assert(seen.has(key(n.x,n.y)),id+' actor');
 if(m.interior){rooms++;assert.equal(width,180);assert.equal(height,120);assert(seen.size>3600,id+' floor area');assert(seen.has(key(90,99)),id+' spawn');assert(!walkable(m,200,130));assert(!walkable(m,4,4));const art=fs.readFileSync(new URL('assets/story/'+id+'.webp',root));assert.equal(art.toString('ascii',8,12),'WEBP');assert(art.length>25000,id+' detailed art');for(const o of m.objects){objects++;assert(o.lines.length);assert(!walkable(m,o.x+o.w/2,o.y+o.h/2));assert(q.some(([x,y])=>inspectable(m,x,y)===o),id+' inaccessible '+o.name);}const a={x:90,y:99};move(m,a,0,14);assert(Math.hypot(a.x-g0.x,a.y-g0.y)<4.5,id+' exit');}
}
assert.equal(gates,44);assert.equal(rooms,10);assert.equal(Object.keys(WORLD).length,21);
for(const id of Object.keys(NPC).filter(x=>x!=='caine')){const p=fs.readFileSync(new URL('assets/story/'+id+'.png',root));assert.equal(p[25],6,id+' RGBA');}
const html=fs.readFileSync(new URL('story.html',root),'utf8'),js=fs.readFileSync(new URL('story.js',root),'utf8');for(const x of ['id="minimap"','id="mapToggle"','id="mapLegend"','story.js?v=551'])assert(html.includes(x));for(const x of ['function drawMinimap()','function nextDialog()','dialogUntil=Infinity','inspectable(map,p.x,p.y)','map.interior?Math.min(w/mw,h/mh)',"if(k==='m')toggleMap()",'ctx.globalAlpha=1','png?v=541'])assert(js.includes(x),x);
console.log(`PASS v55: ${rooms} compact rooms, ${objects} accessible interactive objects, ${gates} gates, minimap, dialog and NPC assets.`);
