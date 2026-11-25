import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const game=read('public/game.js');
const html=read('public/index.html');
const alt=read('public/game.html');
const worker=read('src/worker.mjs');
const duel=read('src/duel-engine.mjs');
const select = game.slice(game.indexOf('function createPlayer(type)'),game.indexOf('const originalCreatePlayer=createPlayer;'));
assert.ok(select.includes("type==='mollitiam'"),'Mollitiam must have dedicated stats');
const create = new Function('WORLD_W','WORLD_H',`${select}\nreturn createPlayer;`)(1448,1086);
const m=create('mollitiam');
assert.equal(m.hp,320);assert.equal(m.maxHp,320);
assert.equal(m.damage,130);assert.equal(m.damage*m.critMultiplier,200);
assert.ok(m.speed<create('kris').speed);
assert.ok(m.attackDelay>create('kris').attackDelay);
assert.ok(m.skillDelay>10&&m.secondaryDelay>=28);
for(const h of [html,alt]){
 assert.match(h,/id="chooseMollitiam"/);
 assert.match(h,/data-coop-hero="mollitiam"/);
 assert.match(h,/mollitiam_portrait\.png/);
 assert.match(h,/game\.js\?v=(?:49\d*|500|510)/);
}
assert.match(worker,/HEROES\s*=\s*new Set\(\[.*'mollitiam'/);
assert.match(worker,/MAX_COOP_PLAYERS = 5/);
assert.match(game,/id:'mollitiamHeart'/);
assert.match(game,/power==='mollitiamHeart'/);
assert.match(game,/player\.mollitiamHeartTime=8/);
assert.match(game,/player\.skillCd=player\.skillDelay;player\.mollitiamPose=\.82/);
assert.match(game,/player\.secondaryCd=player\.secondaryDelay;player\.mollitiamPose=\.86/);
assert.match(game,/player\.ultimateTime=8;player\.mollitiamPose=1\.0/);
assert.match(game,/player\.type==='mollitiam'&&isBossEnemy\(e\)&&player\.ultimateTime>0\?2:1/);
assert.match(game,/const healRate=\(player\.mollitiamHeartTime>0\?\.35:\.25\)\*\(isNordic\(\)\?1:\.5\)/);
assert.match(game,/player\.cardPower==='mollitiamHeart'\?'CORAÇÃO F'/);
assert.match(duel,/name:'MOLLITIAM'/);
assert.match(read('public/duel.html'),/data-hero="mollitiam"/);
for(const filename of ['public/assets/heroes/mollitiam_sheet.png','public/assets/ui/mollitiam_portrait.png','public/assets/cards/mollitiam_heart.png']){
 const f=new URL(filename,root);
 assert.ok(existsSync(f),`missing ${filename}`);
 const b=readFileSync(f);
 assert.equal(b.subarray(1,4).toString(),'PNG');
 if(filename.includes('sheet'))assert.deepEqual([b.readUInt32BE(16),b.readUInt32BE(20)],[1280,1280]);
}
console.log('OK v4.8: Mollitiam stats, Q/E/R/F, art, solo/coop/X1');
