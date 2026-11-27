import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WORLD,walkable} from '../public/story-world.js';
const publicRoot=new URL('../public/',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,publicRoot));
for(const [f,w,h] of [['mimic_sheet.png',336,448],['mimic_attack.png',224,896]]){const b=read('assets/heroes/'+f);assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);assert.equal(b[25],6);assert(b.length>40000);}
for(const name of ['loid','kris','cross','eve','kali','mollitiam','moretti','l0id','josue','kris_frog'])assert.equal(read('assets/heroes/mimic/'+name+'.webp').toString('ascii',8,12),'WEBP');
assert.equal(read('assets/story/mount1.webp').toString('ascii',8,12),'WEBP');
const m=WORLD.mount1;assert.equal(m.width,600);assert.equal(m.height,400);for(const [x,y] of [[300,200],[300,20],[20,199],[580,199],[300,380],[260,250],[400,180]])assert(walkable(m,x,y),`blocked plaza ${x},${y}`);for(const [x,y] of [[40,30],[560,40],[40,380],[560,380]])assert(!walkable(m,x,y));for(const o of m.objects)assert(!walkable(m,o.x+o.w/2,o.y+o.h/2));
console.log('PASS v551: 16 source frames, 10 crimson sprite files including frog form, mountain plaza and obstacle collisions.');
