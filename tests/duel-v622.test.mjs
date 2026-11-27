import assert from 'node:assert/strict';
import {createDuel,DUEL_HEROES622} from '../src/duel-engine.mjs';
import {createJourneyRuntime622} from '../public/journey-runtime622.mjs';
let clock=0;Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
const advance=(m,n)=>{for(let i=0;i<n&&!m.finished;i++){clock+=50;m.tick();}};
const j=createJourneyRuntime622();
for(const hero of DUEL_HEROES622){const m=createDuel([{id:'a',hero,cards:[]},{id:'b',hero:hero==='loid'?'kris':'loid',cards:[],bot:true}]);const original=j.createPlayer(hero);let p=m.snapshot().players[0];assert.equal(p.maxHp,11500);assert.equal(p.speed,original.speed);advance(m,65);for(const action of ['q','eDown','eUp','dash']){m.action('a',action,'',0);advance(m,4);}for(let i=0;i<80&&!m.finished;i++){m.input('a',{x:0,y:0,aim:0,attack:true},i+1);advance(m,1);}assert.doesNotThrow(()=>JSON.stringify(m.snapshot()));assert(m.snapshot().players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.hp)));assert(!m.input('b',{x:0,y:0}));console.log('PASS runtime Jornada:',hero);}
const m=createDuel([{id:'a',hero:'mimic'},{id:'b',hero:'abloy',bot:true},{id:'c',hero:'moretti',bot:true},{id:'d',hero:'josue',bot:true}]);advance(m,65);m.action('a','mimic','kris',0);assert.equal(m.snapshot().players[0].type,'kris');advance(m,100);assert.equal(m.snapshot().players.length,4);assert.deepEqual(m.snapshot().players.map(p=>p.team),[0,1,0,1]);assert(!m.action('b','q','',0));console.log('PASS 2v2, transformação Mímico, bots e equipes.');
