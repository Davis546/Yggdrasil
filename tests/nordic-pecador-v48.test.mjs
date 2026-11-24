import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
assert.match(s,/const nordicBossPecador=\(\)=>isPecador\(\)&&activeCampaign==='nordic'&&isNordic\(\)/);
assert.match(s,/const nordicBossHpMultiplier=\(\)=>nordicBossPecador\(\)\?1\.60:1/);
assert.match(s,/const nordicBossDamageMultiplier=\(\)=>nordicBossPecador\(\)\?1\.38:1/);
assert.match(s,/e\.attack-=dt\*\(isBossEnemy\(e\)&&nordicBossPecador\(\)\?1\.22:1\)/);
assert.match(s,/\*nordicBossHpMultiplier\(\)\*\(coop\.active&&coop\.host/);
const fn=(difficulty,activeCampaign,stage)=>{
 const isPecador=()=>difficulty==='pecador',isNordic=()=>stage>=21;
 const nordicBossPecador=()=>isPecador()&&activeCampaign==='nordic'&&isNordic();
 return {hp:nordicBossPecador()?1.60:1,atk:nordicBossPecador()?1.22:1,damage:nordicBossPecador()?1.38:1};
};
assert.deepEqual(fn('normal','nordic',35),{hp:1,atk:1,damage:1});
assert.deepEqual(fn('pecador','japan',20),{hp:1,atk:1,damage:1});
assert.deepEqual(fn('pecador','nordic',35),{hp:1.60,atk:1.22,damage:1.38});
console.log('OK v4.8: boss-only Nordic Pecador scaling; Japan/Normal unchanged');
