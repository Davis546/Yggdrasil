import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
const harness=fs.readFileSync(new URL('./v626.test.mjs',import.meta.url),'utf8');
const client=Function('vm','src',harness.slice(harness.indexOf('function client('),harness.indexOf('\nconst {run,nodes}=client()'))+';return client;')(vm,src);
const {run,nodes}=client();const eq=(e,v)=>assert.equal(run(e),v,e);
run("start('loid','defense');player.x=VOID_NPC625.x;player.y=VOID_NPC625.y+45;voidFinishIntro625()");eq('tree62.japan628.length',4);eq('tree62.seiva',150);
run('globalThis.u=tree62.japan628.find(a=>a.k==="ureiko");player.x=u.x;player.y=u.y;voidInteract625()');eq('teamDialog628','ureiko');assert.equal(nodes.get('teamDialog628').hidden,false);run('teamClose628();voidStart625();enemies=[];tree62.builds=[]');eq('teamDialog628',null);
// Verify support, skeletons, melee and no guest combat simulation.
run('player.x=1000;player.y=800;u.x=player.x+20;u.y=player.y;player.hp=30;u.cd=0;japanTick628(.1)');assert(run('player.hp>30&&player.japanBuff628>elapsed'));
run('globalThis.l=tree62.japan628.find(a=>a.k==="lady");l.x=450;l.y=600;globalThis.e=voidMob624("tank",l.x+70,l.y);l.cd=0;japanTick628(.1)');eq('tree62.japan628.filter(a=>a.k==="skeleton").length',4);run('l.cd=0;japanTick628(.1)');eq('tree62.japan628.filter(a=>a.k==="skeleton").length',6);
run('globalThis.k=tree62.japan628.find(a=>a.k==="kurohime");globalThis.m=tree62.japan628.find(a=>a.k==="musashi");k.x=300;k.y=500;m.x=300;m.y=520;enemies=[];globalThis.e=voidMob624("tank",320,510);globalThis.old=e.hp;k.cd=0;m.cd=0;japanTick628(.1)');assert(run('e.hp<old&&k.cast===elapsed'));
run('globalThis.pre=JSON.stringify(tree62.japan628);coop.active=true;coop.host=false;japanTick628(1)');eq('JSON.stringify(tree62.japan628)',run('pre'));run('coop.active=false;coop.host=false');
// Enemy notices nearby hero, then remains locked after attacking the tree.
run('tree62.japan628=[];enemies=[];player.x=1100;player.y=700;globalThis.e=voidMob624("crawler",player.x-14,player.y);e.attack=0;player.invuln=0;globalThis.hp=player.hp;globalThis.th=tree62.hp;siege62(e,.1)');assert(run('player.hp<hp&&tree62.hp===th&&!e.treeLock628'));
run('player.x=1200;player.y=850;e.x=WORLD_W/2;e.y=WORLD_H/2-102;e.attack=0;tree62.shield=0;siege62(e,.1)');eq('e.treeLock628',true);run('player.x=e.x+12;player.y=e.y;e.attack=0;globalThis.th=tree62.hp;siege62(e,.1)');assert(run('tree62.hp<th'));
// Sprint is time based and limited to defense.
run('player.stamina628=100;globalThis.factor=sprint628(player,true,true,1)');eq('factor',1.65);eq('player.stamina628',74);run('sprint628(player,true,true,3)');eq('player.stamina628',0);eq('sprint628(player,true,true,.1)',1);run('sprint628(player,false,false,3)');assert(run('player.stamina628>=57'));eq('sprint628(player,true,true,.1)',1.65);
run('tree62.seiva=0;tree62.rewardStage=0;voidReward624()');eq('tree62.seiva',152);run('globalThis.e=voidMob624("crawler",400,400);hitEnemy(e,99999,false,true)');eq('tree62.seiva',155);
run('start("loid","japan")');eq('sprint628(player,true,true,1)',1);
for(const n of ['kurohime','ureiko','lady','musashi'])for(const ext of ['_walk.png','_skill.webp'])assert(fs.existsSync(new URL('../public/assets/void624/japan628/'+n+ext,import.meta.url)));
for(const f of ['index.html','game.html']){const html=fs.readFileSync(new URL('../public/'+f,import.meta.url),'utf8');for(const id of ['btnSprint628','stamina628','teamDialog628','teamArrival628'])assert(html.includes('id="'+id+'"'));}
assert(fs.readFileSync(new URL('../src/worker.mjs',import.meta.url),'utf8').includes('sprint: !!m.sprint'));
console.log('PASS 628: quatro reforços, cura/buff, invocação limitada, ataques, diálogos, autoridade host, aggro, trava da árvore, seiva e sprint.');
