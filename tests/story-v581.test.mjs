import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync('public/story.js','utf8');
const sprite=code.split('\n').find(s=>s.startsWith('function drawSprite('));
const calls=[];const ctx={save(){},restore(){},translate(){},scale(){},drawImage(...a){calls.push(a)}};
const b={ctx,image:()=>({naturalWidth:768,naturalHeight:1728}),ready:()=>true,form:'l0id',hero:'l0id',p:{face:'down'},clock:0,moving:false,running:false};vm.createContext(b);vm.runInContext(sprite,b);vm.runInContext("drawSprite({x:20,y:20},'player')",b);
assert.deepEqual(calls[0].slice(1,5),[40,96,112,88]);assert.equal(calls[0][8],18);assert.equal(calls[0][7],18*112/88);
b.moving=true;vm.runInContext("drawSprite({x:20,y:20},'player')",b);assert.equal(calls[1][2],480);
b.form='loid';vm.runInContext("drawSprite({x:20,y:20},'player')",b);assert.equal(calls[2][8],15);
for(const name of ['index.html','game.html']){const html=fs.readFileSync('public/'+name,'utf8');assert(html.includes('class="build-label">V5.8.1'));assert(html.includes('game.js?v=561'));}
const html=fs.readFileSync('public/story.html','utf8');assert(html.includes('story.js?v=581'));assert(html.includes('class="story-build">V5.8.1'));console.log('PASS V5.8.1: versão no menu e história, recorte proporcional do Sombramante parado e em movimento.');
