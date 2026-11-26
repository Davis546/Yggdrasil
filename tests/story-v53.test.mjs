import assert from 'node:assert/strict';import fs from 'node:fs';import {WORLD,NPC,walkable,move,HEROS} from '../public/story-world.js';
const root=new URL('../public/',import.meta.url),read=n=>fs.readFileSync(new URL(n,root),'utf8');let areas=0,exits=0;
for(const [id,m] of Object.entries(WORLD)){
 const start=m.gates[0];assert(walkable(m,start.x,start.y),id+' entry');const q=[[start.x,start.y]],seen=new Set([start.x+400*start.y]);
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=a+400*b;if(!seen.has(k)&&walkable(m,a,b)){seen.add(k);q.push([a,b]);}}}
 assert(seen.size>400*260*.58,id+' free area too small '+seen.size);for(const obj of m.objects)assert(!walkable(m,obj.x+obj.w/2,obj.y+obj.h/2),id+' solid '+obj.kind);
 for(const g of m.gates){exits++;assert(seen.has(g.x+400*g.y),id+' exit');if(g.to!=='return')assert(walkable(WORLD[g.to],g.tx,g.ty),id+' spawn');if(g.door)assert(walkable(m,g.x,g.y+12),id+' return');}
 for(const n of [...m.npcs,...(m.civilianSlots||[]).map(([x,y])=>({x,y,id:'villager1'}))]){assert(NPC[n.id]);assert(seen.has(n.x+400*n.y),id+' npc');}
 const asset=fs.readFileSync(new URL('assets/story/'+id+'.webp',root));assert.equal(asset.toString('ascii',8,12),'WEBP');areas++;
 // Across the open central horizontal road, without walls or obstructions.
 if(!['sun','interior','dwarf'].includes(m.theme)){const a={x:10,y:130};move(m,a,380,0);assert(a.x>388,id+' horizontal road');}
}
assert.equal(areas,21);assert.equal(exits,44);assert.equal(Object.keys(HEROS).length,9);const story=read('story.js'),game=read('game.js'),selector=read('hero-select50.js');assert(story.includes('actorsNPC.map(n=>({...n,r:2.2}))'));assert(story.includes('jumpJosue'));assert(story.includes('villagers.splice'));assert(game.includes("if(e.pointerType!=='touch'||screenAdjusting||e.isPrimary===false"));assert(game.includes("if(e.pointerType!=='touch'||screenAdjusting||!a||"));assert(selector.includes("button('Josué','Ir para Josué')"));for(const f of ['index.html','game.html']){const h=read(f);assert(h.includes('id="chooseJosue"'));assert(h.includes('data-coop-hero="josue"'));assert(h.includes('game.js?v=530'));assert(h.includes('hero-select50.js?v=50.3'));}console.log(`PASS v53: ${areas} maps; ${exits} connected exits; solid objects, wide routes, NPC slots, Josué shortcut and touch-only gesture.`);
