
'use strict';
const touchUI=window.matchMedia('(pointer:coarse)').matches || (navigator.maxTouchPoints>0 && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)); document.body.classList.toggle('touch-ui',touchUI); let W=(touchUI&&window.innerWidth>window.innerHeight)?Math.round(288*window.innerWidth/window.innerHeight):480,H=touchUI?(window.innerWidth>window.innerHeight?288:720):288;const WORLD_W=1448,WORLD_H=1086,canvas=document.getElementById('game');let ctx=canvas.getContext('2d',{alpha:false});let RENDER_SCALE=touchUI?1.20:1.5;let renderMode="auto",lastRenderAdjust=0,slowSeconds=0,fastSeconds=0;canvas.width=Math.round(W*RENDER_SCALE);canvas.height=Math.round(H*RENDER_SCALE);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
const $=id=>document.getElementById(id),rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), norm=(x,y)=>{let l=Math.hypot(x,y)||1;return {x:x/l,y:y/l}}, TAU=Math.PI*2;
let phase='title',player=null,enemies=[],projectiles=[],particles=[],slashes=[],rings=[],dashShadows=[],stage=1,essence=0,last=0,elapsed=0,shake=0,flash=0,mouseAim=null,pointerDown=false,attackMobile=false,mobileMove={x:0,y:0},opts=[],nextEnemyId=1,camera={x:0,y:0},shadowClones=[],waveIntro=0,domainFade=0,waveClearTimer=-1,dashGhostTimer=0,footstepClock=0,eclipseTime=0,healthDrops=[],damageFloats=[],xansBlasters=[],timeFields=[],mirrorIllusions=[],voidCollapse=0,evePortals=[];
// v2.4: dynamic *visual* budget. All damage, collisions, dash timing and network ticks
// remain unchanged when the canvas renders cheaper effects.
const weakMobileHint=touchUI&&((Number(navigator.deviceMemory)||8)<=4||(Number(navigator.hardwareConcurrency)||8)<=4);
let autoFxTier=weakMobileHint?1:0,drawnFrames=0,callbackFps=60,onlineScaleSaved615=null;let lastHudStamp=0;
const lowFx=()=>renderMode==='desempenho'||renderMode==='leve'||(renderMode==='auto'&&(autoFxTier>=1||coop.active));
const minimalFx=()=>renderMode==='desempenho'||(renderMode==='auto'&&autoFxTier>=2);
if(weakMobileHint){RENDER_SCALE=1.0;canvas.width=Math.round(W*RENDER_SCALE);canvas.height=Math.round(H*RENDER_SCALE);}
const keys=new Set();
// v4.9.9: local screen recovery, never pause the shared simulation.
let screenAdjusting=false,screenTaps=[],screenResetTimer=null;
const screenViewportBase='width=device-width,initial-scale=1,viewport-fit=cover';
function setViewportZoom(allow){$('gameViewport')?.setAttribute('content',screenViewportBase+(allow?'':',minimum-scale=1,maximum-scale=1,user-scalable=no'));document.documentElement.classList.toggle('screen-adjusting',allow);}
function resetScreenScale(){if(!screenAdjusting)return;clearTimeout(screenResetTimer);ctrlSettings.scale=1;$('sizeControl').value='100';applyControlSettings();setViewportZoom(false);adaptViewport(true);screenAdjustLayout();screenResetTimer=setTimeout(()=>{if(!screenAdjusting)return;setViewportZoom(true);screenAdjustLayout();},300);}

function registerScreenTap(now){screenTaps=screenTaps.filter(t=>now-t<=2500);if(screenTaps.length&&now-screenTaps.at(-1)>550)screenTaps=[];screenTaps.push(now);if(screenTaps.length<7)return false;screenTaps=[];return true;}
function screenAdjustLayout(){const v=window.visualViewport,el=$('screenAdjust');if(!el||!screenAdjusting)return;el.style.left=(v?.offsetLeft||0)+'px';el.style.top=(v?.offsetTop||0)+'px';el.style.width=(v?.width||window.innerWidth)+'px';el.style.height=(v?.height||window.innerHeight)+'px';const status=$('screenAdjustScale');if(status)status.textContent='Zoom do navegador: '+Math.round((v?.scale||1)*100)+'%';}
function clearScreenInput(){keys.clear();pointerDown=false;attackMobile=false;mobileMove={x:0,y:0};mouseAim=null;attackManualAim=false;joyPid=null;attackPointer=null;secPid=null;waiting.joy={x:0,y:0};waiting.pid=null;if(player)player.secondaryCharging=false;for(const id of ['knob','waitingKnob']){const n=$(id);if(n){n.style.left='50%';n.style.top='50%';}}}
function setScreenAdjust(open){screenAdjusting=!!open;screenTaps=[];clearTimeout(screenResetTimer);setViewportZoom(open);clearScreenInput();$('screenAdjust').hidden=!open;document.body.classList.toggle('screen-adjusting',open);if(open){waitingDialogClose();$('screenAdjustHint').textContent=coop.active&&coop.remoteStarted?'A partida online continua. Seu personagem permanece vulnerável.':'Ajuste a tela com dois dedos. O combate individual fica pausado.';if(coop.active&&!coop.host&&coop.remoteStarted&&player)coopSend({t:'input',x:0,y:0,aim:player.aim||0,attack:false});screenAdjustLayout();}else{adaptViewport(true);}}

let perfFrames=0,perfStart=0,netPingStart=0,netRtt=null,visibleFps=60,netJitter=0,lastStateArrival=0;
let edgeRtt=null,edgeColo='',netRawRtt=null,netRttSamples=[],cloneAudioAt=-Infinity;
const cloneKey=s=>`${s.ownerId||'solo'}:${s.kind||'loid'}:${s.angle||0}`;
function acceptPing(value){if(!Number.isFinite(value)||value<0||value>30000)return;netRawRtt=value;netRttSamples.push(value);if(netRttSamples.length>5)netRttSamples.shift();netRtt=[...netRttSamples].sort((a,b)=>a-b)[Math.floor(netRttSamples.length/2)];}
async function probeEdge(sock){if(typeof fetch!=='function')return;const start=performance.now();try{const r=await fetch('/net-edge',{cache:'no-store'});if(!r.ok)return;const v=await r.json();if(coop.socket!==sock)return;edgeRtt=Math.round(performance.now()-start);edgeColo=String(v.colo||'');}catch{}}
function cloneWire(s){return {ownerId:s.ownerId,kind:s.kind,angle:s.angle,x:Math.round(s.x*10)/10,y:Math.round(s.y*10)/10,step:Math.round((s.step||0)*10)/10,face:s.face,time:Math.round(s.time*100)/100};}
function mergeGuestClones(incoming){const old=new Map(shadowClones.map(s=>[cloneKey(s),s]));return incoming.map(n=>{const p=old.get(cloneKey(n));if(!p||Math.hypot(n.x-p.x,n.y-p.y)>100)return {...n,tx:n.x,ty:n.y};const x=p.x,y=p.y,step=p.step;return Object.assign(p,n,{x,y,step,tx:n.x,ty:n.y});});}
const coop={lastMotion:0,motionSeq:0,lastMotionSeq:0,networkRx:0,lastMotionArrival:0,networkExpected:50,active:false,host:false,id:null,hostId:null,room:null,socket:null,members:[],allies:new Map(),actorId:null,executing:false,chosen:false,choices:new Set(),lastSnapshot:0,lastInput:0,lastStateStage:0,lastStatePhase:null,selectingUltimate:false,remoteStarted:false,frameAt:0,targetLocal:null,targetAllies:new Map(),lastStage:0,lastStateSeq:0,stateSeq:0,remoteEvents:0,lastCombatPacket:0,enemyTargets:new Map(), projectileTargets:new Map(),serverFeedback:null,hostAvatar:null,guestVisibleHp:null};
Object.assign(coop,{token:null,epoch:1,reconnecting:false,reconnectUntil:0,retryTimer:null,heartbeat:null,lastPong:0,lastCheckpoint:0,lastUrgent:0,lastInputSignature:'',lastInputSent:0,checkpointDirty:false,motionHistory615:new Map(),lastStateBytes615:0,clock615:null,projectileSeq615:0,lastSnapshotAttempt615:0,guestAttackAt615:-Infinity,motionSim615:null,predBlink615:null});
// V6.1.6: independent compact snapshots. No delta dependency; skipped frames are safe.
const WIRE_SECTIONS616=['enemies','projectiles','hazards','healthDrops','rings','slashes','shadowClones','dashShadows','realityFields','timeFields','mirrorIllusions','evePortals','xansBlasters','frostBursts'];
function packWorld616(state){
 const out={...state};let packed=false;
 for(const key of WIRE_SECTIONS616){
  const list=state[key];if(!Array.isArray(list)||list.length<3)continue;
  const schemas=[],schemaCosts=[],byShape=new Map(),rows=[];let saving=0,valid=true;
  for(const item of list){
   if(!item||typeof item!=='object'||Array.isArray(item)){valid=false;break;}
   const keys=Object.keys(item).filter(k=>item[k]!==undefined);const signature=keys.join('\u001f');
   let index=byShape.get(signature);
   if(index===undefined){index=schemas.length;byShape.set(signature,index);schemas.push(keys);const cost=keys.reduce((n,k)=>n+JSON.stringify(k).length+1,0);schemaCosts.push(cost);saving-=cost+4;}
   saving+=schemaCosts[index]-String(index).length-1;rows.push([index,...keys.map(k=>item[k])]);
  }
  if(valid&&saving>48){out[key]={schemas,rows};packed=true;}
 }
 if(packed)out.wire616=1;return out;
}
function unpackWorld616(state){
 if(!state||state.wire616!==1)return state;
 const out={...state};delete out.wire616;
 for(const key of WIRE_SECTIONS616){
  const list=out[key];if(list===undefined||Array.isArray(list))continue;
  if(!list||!Array.isArray(list.schemas)||!Array.isArray(list.rows)||list.schemas.length>512||list.rows.length>4096)return null;
  if(list.schemas.some(keys=>!Array.isArray(keys)||keys.length>256||keys.some(k=>typeof k!=='string'||k.length>128||['__proto__','constructor','prototype'].includes(k))))return null;
  const rows=[];for(const row of list.rows){
   if(!Array.isArray(row)||!Number.isInteger(row[0]))return null;
   const keys=list.schemas[row[0]];if(!keys||row.length!==keys.length+1)return null;
   rows.push(Object.fromEntries(keys.map((k,i)=>[k,row[i+1]])));
  }out[key]=rows;
 }return out;
}

// V6.1.6: discard expendable data before it queues; do not drop discrete controls.
coop.wire616=false;coop.lastInputControls616='';
function wireRound615(k,v){return typeof v==='number'&&Number.isFinite(v)&&!Number.isInteger(v)?Math.round(v*1000)/1000:v;}
function netPacing615(buffered,bytes=0,fps=60){return {motion:buffered>10000?100:50,state:buffered>10000?320:buffered>3000||bytes>32000?200:fps<40?160:120};}
function netPacing616(buffered,bytes=0,fps=60){
 if(buffered>10000)return {motion:100,state:360};
 if(buffered>3000||bytes>25000)return {motion:80,state:250};
 if(fps<40)return {motion:60,state:180};
 return {motion:50,state:bytes>14000?150:125};
}
function coopSend(data){
 const socket=coop.socket;
 if(!socket||socket.readyState!==WebSocket.OPEN)return false;
 // Drop expendable visual updates instead of queueing stale frames behind a slow connection.
 if((data.t==='waitingMove'||data.t==='motion'||data.t==='input')&&socket.bufferedAmount>10000)return false;
 if(data.t==='state'&&socket.bufferedAmount>(data.data?.mandatory?32000:coop.wire616?6000:10000))return false;
 try{
  if(data.t==='state'&&coop.wire616){data={...data,data:packWorld616(data.data)};if(data.checkpoint)data.checkpoint=packWorld616(data.checkpoint);}
  const wire=JSON.stringify(data,data.t==='state'?wireRound615:undefined);socket.send(wire);
  if(data.t==='state'&&(!data.checkpoint||!coop.lastStateBytes615))coop.lastStateBytes615=data.checkpoint?JSON.stringify(data.data,wireRound615).length:wire.length;
  return true;}catch(e){console.warn('Yggdrasil: falha de rede',e);return false;}
}
function coopNote(message){const n=$('coopNotice');if(n)n.textContent=message;}


const HERO={loid:new Image(),kris:new Image(),cross:new Image(),eve:new Image(),kali:new Image(),mollitiam:new Image()};
const EVE_PORTAL_FRAMES=Array.from({length:4},(_,i)=>{const a=new Image();a.src=`assets/effects/void_portal_${i}.png?v=32`;return a;});
const MIRROR_SPRITE=new Image();MIRROR_SPRITE.src='assets/effects/mirror_projectile.png?v=32';
HERO.moretti=new Image();HERO.moretti.src='assets/heroes/moretti_sheet.png?v=49';HERO.l0id=new Image();HERO.l0id.src='assets/heroes/l0id_sheet.png?v=49';HERO.l0idShadow=new Image();HERO.l0idShadow.src='assets/heroes/l0id_shadow_sheet.png?v=49';
HERO.mimic=new Image();HERO.mimic.src='assets/heroes/mimic_sheet.png?v=551';
const MIMIC_ATTACK=new Image();MIMIC_ATTACK.src='assets/heroes/mimic_attack.png?v=551';
const MIMIC_ART={};function getMimicArt(t){if(!MIMIC_ART[t]){const im=new Image();im.src='assets/heroes/mimic/'+t+'.webp?v=551';MIMIC_ART[t]=im;}return MIMIC_ART[t];}
HERO.abloy=new Image();HERO.abloy.src='assets/heroes/abloy_sheet.png?v=614';
const ABLOY_COSMIC=new Image();ABLOY_COSMIC.src='assets/heroes/abloy_cosmic.png?v=614';
HERO.josue=new Image();HERO.josue.src='assets/heroes/josue_sheet.png?v=523';
const SKILL_HEROES=new Set(['loid','kris','cross','eve','kali','mollitiam','moretti','l0id','josue','mimic','abloy']);let lastSkillArt='';
function syncSkillArt(type){if(!SKILL_HEROES.has(type)||lastSkillArt===type)return;lastSkillArt=type; /* Keep original ✦ ✧ ✺ buttons; ability art does not replace their symbols. */}

HERO.loid.src='assets/heroes/loid_sheet.png';
const LOID_SHADE=new Image();LOID_SHADE.src='assets/heroes/loid_shadow_sheet.png';
HERO.kris.src='assets/heroes/kris_sheet.png';
HERO.cross.src='assets/heroes/cross_sheet.png';
HERO.eve.src='assets/heroes/eve_sheet.png?v=33';
HERO.kali.src='assets/heroes/kali_sheet.png?v=33';
HERO.mollitiam.src='assets/heroes/mollitiam_sheet.png?v=48';
const ENEMY_URLS={walker:'assets/enemies/oni_walker.png',runner:'assets/enemies/oni_runner.png',caster:'assets/enemies/oni_caster.png',boss:'assets/enemies/samurai_sheet.png',reuni:'assets/enemies/reuni_sheet.png',tsukuomi:'assets/enemies/tsukuomi_sheet.png',ghost:'assets/enemies/ghost_sheet.png',yokai:'assets/enemies/yokai_sheet.png',beast:'assets/enemies/beast_sheet.png',pecado:'assets/enemies/pecado_sheet.png',draugr:'assets/enemies/nordic_draugr_sheet.png',frostwolf:'assets/enemies/nordic_frostwolf_sheet.png',berserker:'assets/enemies/nordic_berserker_sheet.png',runewitch:'assets/enemies/nordic_runewitch_sheet.png',frostjarl:'assets/enemies/jarl_v39_atlas.png?v=44',nameless:'assets/nordic/nameless_knight_sheet.png?v=45',odin:'assets/nordic/odin_sheet.png?v=45',ancestralDragon:'assets/nordic/ancient_dragon_sheet.png?v=45',runeSeal:'assets/nordic/nameless_knight.png?v=41'};
const FROG=new Image();FROG.src='assets/heroes/kris_frog_sheet.png';
const ARENA=new Image(); ARENA.src='assets/japanese_arena.webp';
const NORDIC_ARENA=new Image();NORDIC_ARENA.src='assets/nordic/frozen_arena.webp?v=37';
let rushMode=false,defense62=false,tree62=null,progressSeen62=0;
const SKINS62={loid:['Imperador das Sombras',265],kris:['Cavaleiro Abissal',90],cross:['Corrupção Carmesim',70],eve:['Senhor do Tempo',175],kali:['Espelho Lunar',160],mollitiam:['Pecado Celestial',195],moretti:['Escritor Proibido',95],l0id:['Eclipse Absoluto',120],josue:['Guerreiro Divino',45],mimic:['Devorador de Deuses',225],abloy:['Anjo Caído',235]};
function rushClamp62(p){p.maxHp=Math.min(p.maxHp,Math.round(p.baseMaxHp*2.25));p.hp=Math.min(p.hp,p.maxHp);p.damage=Math.min(p.damage,p.baseDamage*1.65);p.armor=Math.min(.4,p.armor);p.orbiters=Math.min(3,p.orbiters||0);p.transformDuration=Math.min(15,p.transformDuration||8);p.mirrorAmp=Math.min(1.7,p.mirrorAmp||1);p.mirrorDuration=Math.min(9,p.mirrorDuration||5);p.timeDuration=Math.min(9,p.timeDuration||5);}
const BOOST62=['maxHp','damage','speed','attackDelay','skillDelay','secondaryDelay','dashDelay','armor','crit','reach','onKillHeal','betweenHeal','echo','arc','skillAmp','transformAmp','transformDuration','mirrorAmp','mirrorDuration','timeDuration','darkAuraDuration'];
function applyCard62(p,c){if(!rushMode){c.effect(p);return;}const old={...p};c.effect(p);for(const k of BOOST62){if(Number.isFinite(old[k])&&Number.isFinite(p[k]))p[k]=old[k]+(p[k]-old[k])*1.2;}p.maxHp=Math.round(p.maxHp);p.hp=Math.min(p.maxHp,p.hp+Math.max(0,p.maxHp-old.maxHp-(p.hp-old.hp)));p.attackDelay=Math.max(p.baseAttackDelay*.7,p.attackDelay);p.dashDelay=Math.max(p.baseDashDelay*.7,p.dashDelay);p.speed=Math.min(p.baseSpeed*1.35,p.speed);p.reach=Math.min(p.baseReach*1.25,p.reach);p.crit=Math.min(.45,p.crit);p.echo=Math.min(.35,p.echo);p.skillAmp=Math.min(1.5,p.skillAmp);p.onKillHeal=Math.min(6,p.onKillHeal);p.betweenHeal=Math.min(27,p.betweenHeal);rushClamp62(p);}
function profile62(){try{return JSON.parse(localStorage.getItem('ygg.profile62')||'{}')||{};}catch{return {};}}
function saveProfile62(v){try{localStorage.setItem('ygg.profile62',JSON.stringify(v));}catch{}}
function level62(x){return Math.min(10,1+Math.floor((x||0)/100));}
function record62(){if(!player||testBossMode||cleared60<=progressSeen62)return;const delta=cleared60-progressSeen62;progressSeen62=cleared60;const v=profile62(),h=hero60(player);v.xp=v.xp||{};v.xp[h]=(v.xp[h]||0)+delta*10;v.best=v.best||{};const mode=rankMode60();v.best[mode]=Math.max(v.best[mode]||0,cleared60);v.ach=v.ach||[];const grant=(id,ok)=>{if(ok&&!v.ach.includes(id))v.ach.push(id);};grant('Primeira raiz',cleared60>=1);grant('Guardião da Árvore',defense62&&cleared60>=10);grant('Caçador de deuses',rushMode&&cleared60>=8);grant('Sobrevivente',cleared60>=20);grant('Mestre de combate',player.kills>=100);grant('Curandeiro',player.heal62>=500);grant('Mestre de um herói',level62(v.xp[h])>=10);saveProfile62(v);}
function skin62(p){const v=profile62(),h=hero60(p);return level62(v.xp?.[h])>=3&&v.skins?.[h]===true?1:0;}
function drawProfile62(){const v=profile62(),box=$('profileList62');box.textContent='';for(const [id,[name]] of Object.entries(SKINS62)){const level=level62(v.xp?.[id]),row=document.createElement('div'),b=document.createElement('button');row.textContent=(MIMIC_NAMES[id]||id)+' · Maestria '+level+'/10 · '+(v.xp?.[id]||0)+' XP ';b.textContent=level<3?'🔒 '+name:v.skins?.[id]?'Usando '+name:'Equipar '+name;b.disabled=level<3;b.onclick=()=>{const a=profile62();a.skins=a.skins||{};a.skins[id]=!a.skins[id];saveProfile62(a);drawProfile62();};row.appendChild(b);box.appendChild(row);}$('achievement62').textContent=(v.ach||[]).join(' · ')||'Nenhuma conquista ainda.';$('challenge62').textContent='Defesa 10: '+(v.best?.defense||0)+'/10 · Boss Rush 8: '+(v.best?.rush||0)+'/8 · Sobrevivência 20: '+Math.max(v.best?.japan||0,v.best?.nordic||0)+'/20';}
function endStats62(){if(!player)return;const el=$('stats62');if(!el)return;const team=[player,...(coop.active?coop.allies.values():[])];el.textContent=team.map(a=>(MIMIC_NAMES[hero60(a)]||a.type)+' · Dano '+Math.round(a.damage62||0)+' · Cura de suporte '+Math.round(a.heal62||0)+' · Abates '+(a.kills||0)).join(' | ');}
const SYNERGY62=[['sy_shadow','loid','abloy','Exército das Almas','+8% dano e +4% defesa.'],['sy_kris','kris','cross','Corrupção Dimensional','+8% dano e +5% crítico.'],['sy_time','eve','kali','Reflexo Temporal','-8% recarga Q e E.'],['sy_book','moretti','l0id','Destino Obscuro','+8% dano e +8% velocidade.'],['sy_divine','josue','abloy','Julgamento Divino','+8% dano e +12 vida.']];
function synergyAllowed62(p,id){const t=SYNERGY62.find(a=>a[0]===id);if(!t||!coop.active||p.cards?.includes(id))return false;const h=hero60(p);return (h===t[1]||h===t[2])&&coop.members.some(m=>m.hero===(h===t[1]?t[2]:t[1]));}
function startTree62(){tree62={hp:1200,maxHp:1200,shield:0,roots:0,repair:0};}
function treeHit62(d){if(!tree62||phase!=='play')return;const absorb=Math.min(tree62.shield,d);tree62.shield-=absorb;tree62.hp=Math.max(0,tree62.hp-d+absorb);if(tree62.hp<=0){phase='over';$('endTitle').textContent='YGGDRASIL CAIU';$('endText').textContent='A árvore foi destruída na onda '+stage+'.';$('gameOverScreen').classList.remove('hidden');endStats62();if(coop.active&&coop.host)coop.checkpointDirty=true;}}
function treeWave62(){if(!tree62)startTree62();tree62.hp=Math.min(tree62.maxHp,tree62.hp+60+tree62.repair);tree62.shield=Math.min(400,tree62.shield+40);const n=Math.min(34,6+Math.floor(stage*1.3));const total=Math.round(n*waveBalance.mobCount);for(let i=0;i<total;i++){const a=TAU*i/total+rand(-.2,.2),x=clamp(WORLD_W/2+Math.cos(a)*530,110,WORLD_W-110),y=clamp(WORLD_H/2+Math.sin(a)*380,170,WORLD_H-110);addMob(['walker','runner','beast','caster'][i%4],x,y,stage>=4&&Math.random()<.18);}if(stage%5===0){const types=RUSH_BOSSES;const t=types[(Math.floor(stage/5)-1)%types.length];if(t==='ancestralDragon'){spawnAncestralDragon({});}else addStageBoss(t,{x:WORLD_W/2,y:195},Math.min(stage,40),.7+stage*.025);}bossMessage='DEFESA · PROTEJA YGGDRASIL';bossMessageTimer=3;}
function siege62(e,dt){if(!defense62||!tree62||phase!=='play'||e.stunTime>0)return false;const x=WORLD_W/2,y=WORLD_H/2,d=Math.hypot(x-e.x,y-e.y)||1;const boss=isBossEnemy(e);if(boss){if(d<100){e.siege62=(e.siege62||0)-dt;if(e.siege62<=0){e.siege62=2;treeHit62(35+stage*2);}}return false;}const speed=e.speed*(e.slow>0?.65:1)*(d<125?1-Math.min(.35,tree62.roots*.08):1);if(d>48){e.x+=(x-e.x)/d*speed*dt;e.y+=(y-e.y)/d*speed*dt;e.face=Math.abs(x-e.x)>Math.abs(y-e.y)?(x<e.x?'left':'right'):(y<e.y?'up':'down');e.step+=speed*dt*.24;e.walking=true;}else{e.walking=false;e.attack-=dt;if(e.attack<=0){e.attack=1.25;treeHit62((8+stage*.65)*(e.elite?1.4:1));}}return true;}
function drawTree62(){const x=WORLD_W/2,y=WORLD_H/2;ctx.fillStyle='#152a23';ctx.fillRect(camera.x,camera.y,W,H);for(let yy=Math.floor(camera.y/32)*32;yy<camera.y+H+32;yy+=32)for(let xx=Math.floor(camera.x/32)*32;xx<camera.x+W+32;xx+=32){ctx.fillStyle=((xx+yy)/32)%2===0?'#1c3528':'#20392b';ctx.fillRect(xx,yy,31,31);}ctx.fillStyle='#4a5540';ctx.beginPath();ctx.arc(x,y,108,0,TAU);ctx.fill();ctx.strokeStyle='#a1bd70';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,96,0,TAU);ctx.stroke();ctx.fillStyle='#58412a';for(let i=0;i<8;i++){const a=i*TAU/8;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*95,y+Math.sin(a)*67);ctx.lineWidth=8;ctx.strokeStyle='#6a5434';ctx.stroke();}ctx.fillRect(x-13,y-91,26,98);for(const [dx,dy,r] of [[-35,-80,37],[35,-80,37],[0,-112,43],[0,-65,39]]){ctx.fillStyle='#32624a';ctx.beginPath();ctx.arc(x+dx,y+dy,r,0,TAU);ctx.fill();ctx.fillStyle='#659a59';ctx.beginPath();ctx.arc(x+dx-6,y+dy-7,r*.72,0,TAU);ctx.fill();}ctx.fillStyle='#e5d990';ctx.fillRect(x-4,y-60,8,30);if(tree62){ctx.fillStyle='#1a1514';ctx.fillRect(x-50,y-150,100,7);ctx.fillStyle='#9fda6e';ctx.fillRect(x-50,y-150,100*tree62.hp/tree62.maxHp,7);}}
function eliteTick62(e,dt){if(e.elite62==='regen'&&e.hurt<=0)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.008*dt);}

const RUSH_BOSSES=['boss','reuni','tsukuomi','frostjarl','odin','nameless','ancestralDragon','pecado'];
const RUSH_NAMES={boss:'Daimyō Oni',reuni:'Reuni',tsukuomi:'Tsukuyomi',frostjarl:'Jarl do Gelo',odin:'Odin',nameless:'Cavaleiro Inominável',ancestralDragon:'Dragão Ancestral',pecado:'Pecado'};
const RUSH_PAIRS=[['boss','reuni'],['tsukuomi','frostjarl'],['odin','pecado'],['nameless','ancestralDragon'],['reuni','odin'],['frostjarl','pecado'],['boss','tsukuomi']];
const RUSH_TRIOS=[['boss','reuni','tsukuomi'],['frostjarl','odin','ancestralDragon'],['nameless','ancestralDragon','pecado'],['boss','frostjarl','nameless'],['reuni','odin','pecado'],['tsukuomi','ancestralDragon','boss'],['frostjarl','reuni','nameless'],['odin','tsukuomi','pecado']];
function rushRoster(n){const i=Math.max(0,Math.floor(n)-1);if(i<RUSH_BOSSES.length)return [RUSH_BOSSES[i]];const j=i-RUSH_BOSSES.length;if(j<RUSH_PAIRS.length)return RUSH_PAIRS[j];return RUSH_TRIOS[(j-RUSH_PAIRS.length)%RUSH_TRIOS.length];}
function rushTier(n){return ['','SOLO','DUPLA','TRIO'][rushRoster(n).length];}
function rushScale(n){return (n<=8?.40+.035*(n-1):.67+.095*(n-8)+.003*Math.pow(n-8,1.6))*(isPecador()?1:1.25);}
const isNordic=()=>!rushMode&&!defense62&&stage>=21;const localNordicWave=()=>Math.max(1,stage-20);
let selectedCampaign='japan',activeCampaign='japan';
const isCampaignFinalWave=()=>!rushMode&&!defense62&&(activeCampaign==='nordic'?stage===40:stage===20);
const DRAGON_ART=new Image();DRAGON_ART.src='assets/nordic/ancient_dragon_sheet.png?v=45';
const ODIN_SPELLS=new Image();ODIN_SPELLS.src='assets/nordic/odin_spells.png?v=45';
const JARL_BOSS_ART=new Image();JARL_BOSS_ART.src='assets/nordic/jarl_boss_v38.webp?v=38';
const SAMURAI_BOSS_ART=new Image();SAMURAI_BOSS_ART.src='assets/ui/samurai_boss_v38.webp?v=38';
const NORDIC_VFX={};for(const n of ['ice','rune','rage']){NORDIC_VFX[n]=new Image();NORDIC_VFX[n].src='assets/nordic/vfx_'+n+'.png';}

let currentNordicBossStrike=false;let testBossMode=false, hazards=[],frostBursts=[],bossMessage='',bossMessageTimer=0,difficulty='normal',selectedBoss=null,bonusBeam=null;
const isPecador=()=>difficulty==='pecador';
const nordicBossPecador=()=>isPecador()&&activeCampaign==='nordic'&&isNordic();
const nordicBossHpMultiplier=()=>nordicBossPecador()?1.60:1;
const nordicBossDamageMultiplier=()=>nordicBossPecador()?1.38:1;
// v4.9.1: wave-frozen scaling; roster comes from the room server, not alive actors.
function coopBalance(count){const n=Math.max(0,Math.min(4,Math.floor(Number(count)||1)-1));return {players:n+1,mobHp:(100+75*n)/100,mobDamage:Math.min(130,100+10*n)/100,mobCount:(100+25*n)/100,bossHp:(100+50*n)/100,bossDamage:(100+25*n)/100,bossRate:(100+15*n)/100,bossSpeed:(100+5*n)/100};}
let waveBalance=coopBalance(1),currentCoopEnemy=null;
const coopDamageFactor=kind=>kind==='boss'?waveBalance.bossDamage:kind==='mob'?waveBalance.mobDamage:1;
const isBossEnemy=e=>['boss','reuni','tsukuomi','pecado','frostjarl','nameless','odin','ancestralDragon','soulMirror'].includes(e.type);
const CARD_IMAGES={heart:'assets/cards/heart.png',blade:'assets/cards/blade.png',fast:'assets/cards/fast.png',speed:'assets/cards/speed.png',armor:'assets/cards/armor.png',reach:'assets/cards/reach.png',dodge:'assets/cards/dodge.png',heal:'assets/cards/heal.png',critical:'assets/cards/critical.png',arc:'assets/cards/arc.png',vigor:'assets/cards/vigor.png',echo:'assets/cards/echo.png',shadowblade:'assets/cards/shadowblade.png',shadowdash:'assets/cards/shadowdash.png',darkburst:'assets/cards/darkburst.png',living:'assets/cards/living.png',black:'assets/cards/black.png',form:'assets/cards/form.png',awakening:'assets/cards/awakening.png',bloodmoon:'assets/cards/bloodmoon.png',ancient:'assets/cards/ancient.png',dragonPact:'assets/nordic/nameless_knight.png?v=41',frog:'assets/cards/frog.png',gaster:'assets/cards/gaster.png',granita:'assets/cards/granita.png',mirror:'assets/cards/arc.png',mirrorguard:'assets/cards/armor.png',voidblade:'assets/cards/blade.png',timeward:'assets/cards/fast.png',mollitiamHeart:'assets/cards/mollitiam_heart.png?v=48'};
const ENEMY_ART={};
for(const name of Object.keys(ENEMY_URLS)) {ENEMY_ART[name]=new Image();ENEMY_ART[name].src=ENEMY_URLS[name];}
// Missing sheets must never make bosses vanish. Keep a compatible still-art
// fallback while reporting the missing texture in the console for debugging.
const BOSS_FALLBACKS={
  nameless:'assets/nordic/nameless_knight.png?v=44',
  frostjarl:'assets/enemies/nordic_frostjarl_sheet.png?v=44'
};
for(const [kind,fallback] of Object.entries(BOSS_FALLBACKS)){
  const main=ENEMY_ART[kind];main.onerror=()=>{
    if(main.src.includes(fallback))return;
    console.warn('[Yggdrasil] Sprite animado não carregou:',kind,main.src);
    main.src=fallback;main.datasetFallback=true;
  };
}
const DRAGON_FALLBACK=new Image();DRAGON_FALLBACK.src='assets/nordic/ancient_dragon.png?v=44';
let movingNow=false;

const THEMES=[{name:'RAIZ DA MEMÓRIA',floor:'#252337',wall:'#171729',accent:'#9383dc',danger:'#8b70bb'},{name:'RAIZ DA MORTE',floor:'#2b2430',wall:'#1a151f',accent:'#b064a8',danger:'#be668b'},{name:'RAIZ DO TEMPO',floor:'#222e38',wall:'#101f2b',accent:'#6bc3d1',danger:'#66b2e4'},{name:'RAIZ DA VIDA',floor:'#273229',wall:'#18261a',accent:'#8bc078',danger:'#89bf65'},{name:'RAIZ DA VONTADE',floor:'#382924',wall:'#291a17',accent:'#e4a36d',danger:'#d78a72'},{name:'RAIZ DA ESPERANÇA',floor:'#34313a',wall:'#201d2c',accent:'#e5be89',danger:'#f0c994'},{name:'RAIZ DA ALMA',floor:'#282e41',wall:'#161d2d',accent:'#89a7f8',danger:'#a18fed'}];
const cards=[
{id:'heart',name:'Coração da Raiz',desc:'+30 de vida máxima e recupera 30 de vida.',icon:'♥',rarity:'common',effect:p=>{p.maxHp+=30;p.hp=Math.min(p.maxHp,p.hp+30)}},
{id:'blade',name:'Fio da Ruína',desc:'+12% de dano (limite +65%).',icon:'⚔',rarity:'common',effect:p=>p.damage=Math.min(p.baseDamage*1.65,p.damage*1.12)},
{id:'fast',name:'Dança das Lâminas',desc:'+10% na velocidade de ataque (limite).',icon:'✧',rarity:'common',effect:p=>p.attackDelay=Math.max(p.baseAttackDelay*.7,p.attackDelay*.90)},
{id:'speed',name:'Passos Leves',desc:'+8% de velocidade de movimento.',icon:'➤',rarity:'common',effect:p=>p.speed=Math.min(p.baseSpeed*1.35,p.speed*1.08)},
{id:'armor',name:'Casca Ancestral',desc:'Recebe 9% menos dano (máximo 40%).',icon:'⬡',rarity:'common',effect:p=>p.armor=Math.min(.4,1-(1-p.armor)*.91)},
{id:'reach',name:'Alcance da Raiz',desc:'+10% de alcance (máximo +25%).',icon:'⟡',rarity:'common',effect:p=>p.reach=Math.min(p.baseReach*1.25,p.reach*1.10)},
{id:'dodge',name:'Reflexos Antigos',desc:'Esquiva recarrega 12% mais rápido.',icon:'↝',rarity:'common',effect:p=>p.dashDelay=Math.max(p.baseDashDelay*.7,p.dashDelay*.88)},
{id:'heal',name:'Seiva Vital',desc:'Recupera 2 de vida ao derrotar inimigos (máximo 6).',icon:'✚',rarity:'rare',effect:p=>p.onKillHeal=Math.min(6,p.onKillHeal+2)},
{id:'critical',name:'Olho do Predador',desc:'+8% de chance de golpe crítico (máximo 45%).',icon:'◉',rarity:'rare',effect:p=>p.crit=Math.min(.45,p.crit+.08)},
{id:'arc',name:'Corte Crescente',desc:'Seus golpes ganham +0,2 de arco (limitado).',icon:'☾',rarity:'rare',effect:p=>p.arc=Math.min(2.65,p.arc+.2)},
{id:'vigor',name:'Vigor de Guerra',desc:'Recupera +8 de vida ao terminar cada fase.',icon:'✦',rarity:'rare',effect:p=>p.betweenHeal=Math.min(27,p.betweenHeal+8)},
{id:'echo',name:'Eco da Lâmina',desc:'12% de chance de causar dano extra.',icon:'❖',rarity:'rare',effect:p=>p.echo=Math.min(.35,p.echo+.12)},
{id:'shadowblade',name:'Lâmina Sombria',desc:'A adaga de Loid causa +14% de dano (limite +65%).',icon:'☽',rarity:'rare',hero:'loid',effect:p=>p.damage=Math.min(p.baseDamage*1.65,p.damage*1.12)},
{id:'shadowdash',name:'Passo Sombrio',desc:'Esquivas 18% mais rápidas e deixam rastros.',icon:'◈',rarity:'rare',hero:'loid',effect:p=>{p.dashDelay=Math.max(p.baseDashDelay*.7,p.dashDelay*.82);p.shadowDash=true}},
{id:'darkburst',name:'Abismo Desperto',desc:'A aura de escuridão dura mais e causa mais dano.',icon:'✹',rarity:'rare',hero:'loid',effect:p=>{p.skillAmp=Math.min(1.5,p.skillAmp*1.2);p.skillDelay=Math.max(6,p.skillDelay*.93);p.darkAuraDuration=Math.min(5.3,(p.darkAuraDuration||4.1)+.6)}},
{id:'living',name:'Sombra Viva',desc:'Um espírito sombrio ataca inimigos próximos.',icon:'♟',rarity:'legendary',hero:'loid',effect:p=>{p.orbiters++;p.orbitTimer=0}},
{id:'black',name:'Fúria Negra',desc:'Kris causa +25% de dano transformado.',icon:'♜',rarity:'rare',hero:'kris',effect:p=>p.transformAmp=Math.min(1.1,p.transformAmp+.25)},
{id:'form',name:'Forma Perfeita',desc:'A transformação dura mais 3 segundos.',icon:'◆',rarity:'rare',hero:'kris',effect:p=>p.transformDuration+=3},
{id:'awakening',name:'Despertar',desc:'Transformação recarrega 15% mais rápido.',icon:'♛',rarity:'rare',hero:'kris',effect:p=>p.skillDelay=Math.max(9,p.skillDelay*.85)},
{id:'bloodmoon',name:'Lua do Abismo',desc:'Ataques transformados geram ondas de energia.',icon:'☯',rarity:'legendary',hero:'kris',effect:p=>p.waveAttack=true},
{id:'frog',name:'Forma do Sapo',desc:'F EXCLUSIVO (1x): ativa o salto do sapo. Q mantém a transformação normal e R mantém o supremo. Elimina inimigos comuns atingidos e tira 25% de chefes.',icon:'♠',rarity:'legendary',hero:'kris',effect:p=>{p.frogSkill=true;p.frogUsed=false;p.frogTime=0;p.cardPower='frog';p.cardPowerUsed=false}},
{id:'gaster',name:'Gaster Blaster',desc:'XANS · Carta exclusiva: invoque uma caveira colossal que dispara um feixe devastador. F = uso único por partida.',icon:'☠',rarity:'legendary',hero:'cross',effect:p=>{p.cardPower='gaster';p.cardPowerUsed=false;}},
{id:'mirror',name:'Reflexo Duplo',desc:'Kali: estilhaços causam +15% de dano.',icon:'◇',rarity:'rare',hero:'kali',effect:p=>p.mirrorAmp=(p.mirrorAmp||1)*1.15},
{id:'mirrorguard',name:'Espelho Protetor',desc:'Kali: Q dura 1 segundo a mais.',icon:'✧',rarity:'rare',hero:'kali',effect:p=>p.mirrorDuration=(p.mirrorDuration||5)+1},
{id:'voidblade',name:'Espada Voraz',desc:'Eve: +12% de dano da espada do Vazio.',icon:'✦',rarity:'rare',hero:'eve',effect:p=>p.damage=Math.min(p.baseDamage*1.65,p.damage*1.12)},
{id:'timeward',name:'Tempo Dilatado',desc:'Eve: Campo Temporal dura mais 1 segundo.',icon:'◷',rarity:'rare',hero:'eve',effect:p=>p.timeDuration=(p.timeDuration||5)+1},
{id:'granita',name:'Descarga de Granita',desc:'LOID · Carta exclusiva: raio branco-negro ampliado, mais dano contra chefes. Consome 50% do Supremo. F = uso único.',icon:'ϟ',rarity:'legendary',hero:'loid',effect:p=>{p.cardPower='granita';p.cardPowerUsed=false;}},
{id:'ancient',name:'Herança de Yggdrasil',desc:'+8% de vida e +5% de dano, velocidade e alcance (com limites).',icon:'♧',rarity:'legendary',effect:p=>{p.maxHp=Math.ceil(p.maxHp*1.08);p.hp=Math.min(p.maxHp,p.hp+12);p.damage=Math.min(p.baseDamage*1.65,p.damage*1.05);p.speed=Math.min(p.baseSpeed*1.35,p.speed*1.05);p.reach=Math.min(p.baseReach*1.25,p.reach*1.05)}},
];

for(const [id,a,b,name,desc] of SYNERGY62)cards.push({id,name,desc,icon:'✦',rarity:'rare',effect:p=>{if(id==='sy_time'){p.skillDelay*=.92;p.secondaryDelay*=.92;}else{p.damage=Math.min(p.baseDamage*1.65,p.damage*1.08);if(id==='sy_shadow')p.armor=Math.min(.4,p.armor+.04);if(id==='sy_kris')p.crit=Math.min(.45,p.crit+.05);if(id==='sy_book')p.speed=Math.min(p.baseSpeed*1.35,p.speed*1.08);if(id==='sy_divine'){p.maxHp+=12;p.hp+=12;}}}});
for(const [id,name,desc] of [['tree_repair','Seiva Sagrada','Restaura 180 PV da árvore e +15 cura por onda.'],['tree_shield','Barreira Divina','Concede 180 de escudo à árvore (máximo 400).'],['tree_roots','Raízes Protetoras','Inimigos próximos da árvore ficam 8% mais lentos (máximo 35%).']])cards.push({id,name,desc,icon:'♧',rarity:'rare',effect:p=>{if(!tree62)return;if(id==='tree_repair'){tree62.hp=Math.min(tree62.maxHp,tree62.hp+180);tree62.repair=Math.min(120,tree62.repair+15);}else if(id==='tree_shield')tree62.shield=Math.min(400,tree62.shield+180);else tree62.roots=Math.min(5,tree62.roots+1);}});
// v4.5.2: cinco cartas JAPONESAS ao iniciar a campanha nórdica; as runas
// Futhark são escolhidas SOMENTE nas recompensas entre ondas.
// As cinco cartas iniciais não são substituídas nem contam no limite de runas.
// v4.5.3 — Bênçãos de partida nórdica. Exatamente três escolhas distintas.
const NORDIC_PASSIVES=[
 {id:'odin',rune:'ᚨ',name:'Sabedoria de Odin',desc:'Poderes Q e E recarregam 20% mais rápido.'},
 {id:'tyr',rune:'ᛏ',name:'Fúria de Týr',desc:'+30% de dano base.'},
 {id:'ymir',rune:'ᛉ',name:'Pele de Ymir',desc:'+20% de vida máxima e -8% de dano recebido.'},
 {id:'sleipnir',rune:'ᚱ',name:'Passos de Sleipnir',desc:'+12% de movimento e -15% da recarga do dash.'},
 {id:'eir',rune:'ᛒ',name:'Bênção de Eir',desc:'+5 pontos percentuais de chance de coração; corações curam 50% mais.'},
 {id:'huginn',rune:'ᛈ',name:'Olhos de Huginn',desc:'+10 pontos percentuais de crítico e +10% de dano contra chefes.'}
];
const NORDIC_PASSIVE_IDS=new Set(NORDIC_PASSIVES.map(p=>p.id));
const isNordicEntry=v=>['nordic','frostjarl','odin','nameless','pecadoNordic'].includes(v);
let pendingNordicHero=null,pendingNordicPassives=[],coopPassiveSelection=[],coopMode='japan';
function validNordicPassives(ids){return Array.isArray(ids)&&ids.length===3&&new Set(ids).size===3&&ids.every(id=>NORDIC_PASSIVE_IDS.has(id));}
function applyNordicPassives(p,ids){
 if(!validNordicPassives(ids)||p.nordicPassivesApplied)return false;
 p.nordicPassivesApplied=true;p.passives=ids.slice();
 for(const id of ids){
  switch(id){
   case 'odin':p.skillDelay*=.80;p.secondaryDelay*=.80;break;
   case 'tyr':p.damage*=1.30;break;
   case 'ymir':{const before=p.maxHp;p.maxHp+=Math.round(p.baseMaxHp*.20);p.hp+=p.maxHp-before;p.armor=1-(1-p.armor)*.92;break;}
   case 'sleipnir':p.speed*=1.12;p.dashDelay*=.85;break;
   case 'eir':p.heartBonus=(p.heartBonus||0)+.05;p.healAmp=(p.healAmp||1)*1.5;break;
   case 'huginn':p.crit+=.10;p.bossAmp=(p.bossAmp||1)*1.10;break;
  }
 }
 nordicClamp(p);p.hp=Math.min(p.hp,p.maxHp);return true;
}
function renderPassiveChoices(container,selection,onToggle){
 container.innerHTML='';
 for(const p of NORDIC_PASSIVES){
  const selected=selection.includes(p.id);const btn=document.createElement('button');
  btn.type='button';btn.className='passive-choice'+(selected?' selected':'');btn.disabled=!selected&&selection.length>=3;
  btn.setAttribute('aria-pressed',String(selected));
  btn.innerHTML='<span class="passive-rune">'+p.rune+'</span><span><strong>'+p.name+'</strong><small>'+p.desc+'</small></span><span class="passive-tick">'+(selected?'✓':'○')+'</span>';
  btn.addEventListener('click',()=>onToggle(p.id));container.appendChild(btn);
 }
}
function togglePassiveSelection(selection,id,onChanged){
 if(!NORDIC_PASSIVE_IDS.has(id))return;
 const idx=selection.indexOf(id);
 if(idx>=0)selection.splice(idx,1);
 else if(selection.length<3)selection.push(id);
 onChanged();
}
function openNordicPassiveScreen(hero){
 pendingNordicHero=hero;pendingNordicPassives=[];phase='passives';
 $('selectScreen').classList.add('hidden');$('nordicPassiveScreen').classList.remove('hidden');renderSoloPassives();
}
function renderSoloPassives(){
 renderPassiveChoices($('soloPassiveChoices'),pendingNordicPassives,id=>togglePassiveSelection(pendingNordicPassives,id,renderSoloPassives));
 $('passiveCounter').textContent=pendingNordicPassives.length+' / 3 selecionadas';
 $('passiveConfirm').disabled=!validNordicPassives(pendingNordicPassives);
}
function renderCoopPassives(){
 const area=$('coopPassiveArea');if(!area)return;
 const nordic=isNordicEntry(coopMode);area.hidden=!nordic;
 if(!nordic){$('waitingMenu').textContent='⚙ CONFIGURAÇÕES';return;}
 renderPassiveChoices($('coopPassiveChoices'),coopPassiveSelection,id=>togglePassiveSelection(coopPassiveSelection,id,()=>{
   coopSend({t:'passives',passives:coopPassiveSelection});renderCoopPassives();
 }));
 $('coopPassiveCounter').textContent=coopPassiveSelection.length+' / 3 selecionadas';$('waitingMenu').textContent='⚙ CONFIG. · RUNAS '+coopPassiveSelection.length+'/3';
}

const NORDIC_CARD_CAP=5;
const NORDIC_RUNE_CAP=19; // uma escolha após cada uma das 19 ondas anteriores ao boss final
const NORDIC_LIMITS={hp:1.45,damage:1.30,attackDelay:.85,speed:1.20,reach:1.20,armor:.25,crit:.32,echo:.20,dodge:.25,dashDelay:.85,skillDelay:.85,secondaryDelay:.85};
function nordicClamp(p){
 p.maxHp=Math.min(Math.floor(p.baseMaxHp*NORDIC_LIMITS.hp), p.maxHp);
 p.hp=Math.min(p.maxHp,p.hp);
 p.damage=Math.min(p.baseDamage*NORDIC_LIMITS.damage,p.damage);
 p.attackDelay=Math.max(p.baseAttackDelay*NORDIC_LIMITS.attackDelay,p.attackDelay);
 p.speed=Math.min(p.baseSpeed*NORDIC_LIMITS.speed,p.speed);
 p.reach=Math.min(p.baseReach*NORDIC_LIMITS.reach,p.reach);
 p.armor=Math.min(NORDIC_LIMITS.armor,p.armor);
 p.crit=Math.min(NORDIC_LIMITS.crit,p.crit);
 p.echo=Math.min(NORDIC_LIMITS.echo,p.echo);
 p.dodgeChance=Math.min(NORDIC_LIMITS.dodge,p.dodgeChance);
 p.dashDelay=Math.max(p.baseDashDelay*NORDIC_LIMITS.dashDelay,p.dashDelay);
 p.skillDelay=Math.max(p.baseSkillDelay*(p.passives?.includes('odin')?.80:NORDIC_LIMITS.skillDelay),p.skillDelay);
 p.secondaryDelay=Math.max(p.baseSecondaryDelay*(p.passives?.includes('odin')?.80:NORDIC_LIMITS.secondaryDelay),p.secondaryDelay);
 p.onKillHeal=Math.min(6,p.onKillHeal);p.betweenHeal=Math.min(19,p.betweenHeal);
 p.arc=Math.min(2.65,p.arc);p.skillAmp=Math.min(1.30,p.skillAmp);
 p.timeDuration=Math.min(6,p.timeDuration);p.mirrorDuration=Math.min(6,p.mirrorDuration);
 p.transformDuration=Math.min(9,p.transformDuration);p.transformAmp=Math.min(.80,p.transformAmp);p.bossAmp=Math.min(1.14,p.bossAmp||1);p.heartBonus=Math.min(.08,p.heartBonus||0);
}
const nCard=(id,name,desc,icon,rarity,effect)=>({id:'n_'+id,name,desc,icon,rarity,effect});
const nordicCards=[
 nCard('fehu','ᚠ Fehu','Chance de coração +4 pontos percentuais.','ᚠ','common',p=>{p.heartBonus=(p.heartBonus||0)+.04;}),
 nCard('uruz','ᚢ Uruz','Vida máxima +14 e dano corpo a corpo +4%.','ᚢ','common',p=>{p.maxHp+=14;p.hp+=14;p.damage*=1.04}),
 nCard('thurisaz','ᚦ Thurisaz','Dano contra chefes +8%.','ᚦ','rare',p=>p.bossAmp=(p.bossAmp||1)*1.08),
 nCard('ansuz','ᚨ Ansuz','Recarga Q -8%.','ᚨ','rare',p=>p.skillDelay*=.92),
 nCard('raidho','ᚱ Raidho','Velocidade +7%.','ᚱ','common',p=>p.speed*=1.07),
 nCard('kenaz','ᚲ Kenaz','Golpes têm 8% de chance de queimadura leve.','ᚲ','rare',p=>p.fireChance=(p.fireChance||0)+.08),
 nCard('gebo','ᚷ Gebo','Dano +5%, aura de equipe +4% perto de aliados.','ᚷ','rare',p=>{p.damage*=1.05;p.teamAura=.04}),
 nCard('wunjo','ᚹ Wunjo','Recupera 2 HP ao derrotar um inimigo.','ᚹ','common',p=>p.onKillHeal+=2),
 nCard('hagalaz','ᚺ Hagalaz','Chance 6% de raio pequeno extra ao atacar.','ᚺ','rare',p=>p.stormChance=(p.stormChance||0)+.06),
 nCard('nauthiz','ᚾ Nauthiz','Menos 12% de dano recebido abaixo de 40% da vida.','ᚾ','common',p=>p.lastStand=.12),
 nCard('isa','ᛁ Isa','10% de chance de aplicar gelo por 1,5s.','ᛁ','common',p=>p.iceChance=(p.iceChance||0)+.10),
 nCard('jera','ᛃ Jera','A cada onda vencida +2% dano, até +10%.','ᛃ','rare',p=>p.jeraBonus=0),
 nCard('eihwaz','ᛇ Eihwaz','Defesa +8% contra todos os inimigos.','ᛇ','common',p=>p.armor=1-(1-p.armor)*.92),
 nCard('perthro','ᛈ Perthro','Chance de crítico +7%.','ᛈ','rare',p=>p.crit+=.07),
 nCard('algiz','ᛉ Algiz','Escudo de 16 HP no início de cada onda.','ᛉ','rare',p=>p.runeShield=16),
 nCard('sowilo','ᛋ Sowilo','Dano geral +8%.','ᛋ','rare',p=>p.damage*=1.08),
 nCard('tiwaz','ᛏ Tiwaz','Dano contra chefes +10%.','ᛏ','rare',p=>p.bossAmp=(p.bossAmp||1)*1.10),
 nCard('berkana','ᛒ Berkana','Cura recebida +15% e vida máxima +8.','ᛒ','common',p=>{p.healAmp=(p.healAmp||1)*1.15;p.maxHp+=8;p.hp+=8}),
 nCard('ehwaz','ᛖ Ehwaz','Recarga do dash -8%.','ᛖ','common',p=>p.dashDelay*=.92),
 nCard('mannaz','ᛗ Mannaz','Dano +4%, defesa +4%.','ᛗ','common',p=>{p.damage*=1.04;p.armor=1-(1-p.armor)*.96}),
 nCard('laguz','ᛚ Laguz','Corrente vital: recupera mais 5 HP no começo de cada onda.','ᛚ','common',p=>p.betweenHeal+=5),
 nCard('ingwaz','ᛜ Ingwaz','Eco ancestral: +8 pontos percentuais de chance de golpe ecoado (60% de dano extra).','ᛜ','rare',p=>p.echo+=.08),
 nCard('dagaz','ᛞ Dagaz','Aurora: recarga da habilidade E -10%.','ᛞ','rare',p=>p.secondaryDelay*=.90),
 nCard('othala','ᛟ Othala','Herança ancestral: +4 pontos percentuais de chance de coração e +2 HP por inimigo derrotado.','ᛟ','rare',p=>{p.heartBonus=(p.heartBonus||0)+.04;p.onKillHeal+=2})
];
for(const c of nordicCards)CARD_IMAGES[c.id]=`assets/cards/futhark/${c.id.slice(2)}.png?v=45`;
const nordicSpecials=[
 {id:'frog',hero:'kris'}, {id:'gaster',hero:'cross'}, {id:'granita',hero:'loid'},
 {id:'mirrorguard',hero:'kali'}, {id:'eveprime',hero:'eve'}, {id:'mollitiamHeart',hero:'mollitiam'}, {id:'authorReality',hero:'moretti'}, {id:'godShadow',hero:'l0id'}, {id:'chronosFury',hero:'josue'}, {id:'mimicMastery',hero:'mimic'}
];
cards.push({id:'eveprime',name:'Eve Lorey · Retorno ao Auge',desc:'F (carta exclusiva): volta ao auge por 6s, +100% de dano e velocidade, dash recarrega 65% mais rápido. Uso único por partida. Q e R originais preservados.',icon:'◷',rarity:'legendary',hero:'eve',effect:p=>{p.evePrimeCard=true;p.cardPower='eveprime';p.cardPowerUsed=false;}});
CARD_IMAGES.eveprime=CARD_IMAGES.timeward;
cards.push({id:'mollitiamHeart',name:'Mollitiam · Coração de Yggdrasil',desc:'Carta especial F (1 uso): 8s de poder ancestral; +40% resistência, +30% velocidade de ataque, +50% dano contra chefes, pisão maior e E cura 35%.',icon:'ᛉ',rarity:'legendary',hero:'mollitiam',effect:p=>{p.cardPower='mollitiamHeart';p.cardPowerUsed=false;}});
for(const [id,hero,name,desc] of [['authorReality','moretti','O Autor do Impossível','F: 12s de fortalecimento; dois D20, maior resultado, também nas próximas Q e E.'],['godShadow','l0id','A Sombra que Devorou Deus','F: 10s de cortes extras, 3s de imunidade e dez sombras.']]){cards.push({id,hero,name,desc,icon:'✦',rarity:'legendary',effect:p=>{p.cardPower=id;p.cardPowerUsed=false;}});CARD_IMAGES[id]=`assets/cards/${hero}_special.png?v=49`;}
cards.push({id:'chronosFury',hero:'josue',name:'Josué · Fúria Além do Tempo',desc:'F: 10s de dano +35%, velocidade de ataque +25% e recarga Q/E acelerada. Uso único.',icon:'◷',rarity:'legendary',effect:p=>{p.cardPower='chronosFury';p.cardPowerUsed=false;}});CARD_IMAGES.chronosFury='assets/cards/josue_special.png?v=52';
cards.push({id:'mimicMastery',hero:'mimic',name:'Mímico · Imitação Suprema',desc:'A recarga da troca de forma cai de 8 para 5 segundos.',icon:'◆',rarity:'legendary',effect:p=>{p.mimicMastery=true;}});CARD_IMAGES.mimicMastery='assets/cards/mimic_special.webp?v=551';
// Especiais exclusivas mantêm o poder original, mas têm identidade rúnica própria no Nórdico.
const abloyCards=[
{id:'ab_guard',hero:'abloy',name:'Guardiões do Além',desc:'Aumenta a chance das bolhas surgirem no começo de cada onda; espírito dourado dá mais escudo e o azul cura mais.',icon:'✦',rarity:'rare',effect:p=>{p.abSpiritChanceBonus=Math.min(.30,(p.abSpiritChanceBonus||0)+.08);p.abGuard=Math.min(2.2,(p.abGuard||1)+.30);}},
{id:'ab_ruin',hero:'abloy',name:'Alma da Ruína',desc:'Espíritos aparecem com mais frequência; o violeta causa +25% dano (até +100%).',icon:'✧',rarity:'rare',effect:p=>{p.abSpiritChanceBonus=Math.min(.30,(p.abSpiritChanceBonus||0)+.05);p.abOrbAmp=Math.min(2,(p.abOrbAmp||1)+.25);}},
{id:'ab_nova',hero:'abloy',name:'Constelação Partida',desc:'Explosões Q/E +20% de dano (até +60%) e uma bolha extra pode surgir na onda.',icon:'☼',rarity:'rare',effect:p=>{p.abBurstAmp=Math.min(1.6,(p.abBurstAmp||1)+.2);p.abSpiritExtra=Math.min(1,(p.abSpiritExtra||0)+1);}},
{id:'ab_eternity',hero:'abloy',name:'Coroa das Almas',desc:'Feixe Celestial dura +0,5s (até 4,4s), projétil espiritual extra e garante pelo menos uma bolha por onda.',icon:'♛',rarity:'legendary',effect:p=>{p.abBeamDuration=Math.min(4.4,(p.abBeamDuration||2.4)+.5);p.abCrown=true;p.abSpiritGuarantee=true;}}
];
for(const c of abloyCards){cards.push(c);CARD_IMAGES[c.id]='assets/cards/'+c.id+'.webp?v=614';CARD_IMAGES['n_'+c.id]=CARD_IMAGES[c.id];}
nordicSpecials.push({id:'ab_eternity',hero:'abloy'});
const nordicSpecialRunes=nordicSpecials.map(({id,hero})=>{
 const original=cards.find(c=>c.id===id);
 const rune=({kris:'thurisaz',cross:'hagalaz',loid:'isa',kali:'algiz',eve:'dagaz',mollitiam:'uruz',moretti:'ansuz',l0id:'eihwaz',josue:'tiwaz',mimic:'ansuz',abloy:'ansuz'})[hero];
 const base=nordicCards.find(c=>c.id==='n_'+rune);
 const variant={...original,id:'n_f_'+hero,specialId:id,name:base.name+' · '+original.name,icon:base.icon,rarity:'legendary'};
 CARD_IMAGES[variant.id]=hero==='abloy'?CARD_IMAGES.ab_eternity:hero==='mimic'?CARD_IMAGES.mimicMastery:`assets/cards/futhark/special_${hero}.png?v=496`;
 return variant;
});
function eligibleNordicSpecial(p){return localNordicWave()>=5&&!p.nordicSpecialEarned&&!p.cardPower&&!p.frogSkill;}
function nordicRewardPool(p){
 const owned=p.runes||[];
 if(owned.length>=NORDIC_RUNE_CAP)return [];
 const pool=nordicCards.filter(c=>!owned.includes(c.id));if(p.type==='abloy')for(const c of abloyCards.slice(0,3)){const id='n_'+c.id;if(!owned.includes(id))pool.push({...c,id});}
 const special=eligibleNordicSpecial(p)?nordicSpecialRunes.find(c=>c.hero===(p.mimicOrigin?'mimic':p.type)&&!owned.includes(c.id)):null;
 return special?[...pool,special]:pool;
}
function awardCard(p,c){
 if(!c)return false;
 if(c.rarity==='cursed'){if(testBossMode||localWave60()<3||!awardCurse60(p,c))return false;return true;}
 if(c.id.startsWith('supply_'))return false;
 // Runas têm slots próprios: não ocupam nem alteram as 5 cartas japonesas iniciais.
 if(activeCampaign==='nordic'&&c.id.startsWith('n_')){
  p.runes=p.runes||[];
  const canonical=nordicRewardPool(p).find(x=>x.id===c.id);if(!canonical)return false;
  canonical.effect(p);if(canonical.specialId)p.nordicSpecialEarned=true;
  p.runes.push(canonical.id);nordicClamp(p);return true;
 }
 if(activeCampaign==='nordic'&&nordicSpecials.some(x=>x.id===c.id)){
  // Compatibilidade com o desafio direto e testes antigos; nunca aparece no sorteio.
  if(c.hero!==p.type&&!(c.id==='mimicMastery'&&p.mimicOrigin))return false;
  if(p.nordicSpecialEarned||p.cardPower||p.frogSkill)return false;
  c.effect(p);p.nordicSpecialEarned=true;return true;
 }
 if(activeCampaign==='nordic'&&p.cards.length>=NORDIC_CARD_CAP)return false;
 if(c.id.startsWith('sy_')&&!synergyAllowed62(p,c.id))return false;if(c.id.startsWith('tree_')&&!defense62)return false;applyCard62(p,c);p.cards.push(c.id);
 if(activeCampaign==='nordic')nordicClamp(p);
 return true;
}
function grantNordicStarter(p,directBoss=false){
 if(p.nordicStarterGranted)return p.cards;
 p.runes=[];
 // Jornada normal: 5 cartas japonesas comuns/raras, sem especial gratuito.
 // Desafio direto contra chefe: 4 comuns/raras + uma especial do protagonista.
 // Especiais podem ser conquistadas nas recompensas de ondas posteriores.
 const specialId=nordicSpecials.find(c=>c.hero===p.type)?.id;
 const uniqueSpecials=new Set(nordicSpecials.map(c=>c.id));
 const bag=cards.filter(c=>!c.id.startsWith('tree_')&&!c.id.startsWith('sy_')&&(!c.hero||c.hero===p.type)&&!uniqueSpecials.has(c.id)&&c.rarity!=='legendary');
 for(let i=0;i<NORDIC_CARD_CAP-(directBoss?1:0);i++){
  const index=Math.floor(Math.random()*bag.length),c=bag.splice(index,1)[0];awardCard(p,c);
 }
 const special=cards.find(c=>c.id===specialId);
 if(directBoss&&special)awardCard(p,special);
 p.nordicStarterGranted=true;nordicClamp(p);p.hp=p.maxHp;
 return p.cards;
}

function createPlayer(type){if(type==='mollitiam')return {type,x:WORLD_W/2,y:WORLD_H/2+120,face:'down',aim:-Math.PI/2,hp:320,maxHp:320,damage:130,attackDelay:1.36,atkTime:0,speed:57,reach:67,arc:2.08,armor:.16,crit:.10,critMultiplier:200/130,echo:0,onKillHeal:0,betweenHeal:14,dashDelay:4,dashCd:0,dashTime:0,dashV:{x:0,y:0},invuln:0,skillDelay:11.5,skillCd:0,skillAmp:1,darkAuraTime:0,darkAuraTick:0,secondaryCd:0,secondaryDelay:30,secondaryCharging:false,secondaryCharge:0,transformDuration:8,transformAmp:0,transformTime:0,shadowDash:false,orbiters:0,orbitTimer:0,waveAttack:false,cardPower:'',cardPowerUsed:false,frogSkill:false,frogUsed:false,frogTime:0,ghost:false,dodgeChance:0,mirrorGuard:0,mirrorAmp:1,mirrorDuration:4,timeDuration:5,voidField:0,voidTick:0,voidUltimate:0,voidUltTick:0,crossChain:null,curseTime:0,frostTime:0,attackCount:0,ultimateCharge:0,ultimateTime:0,ultimateTick:0,ultimateBuff:'',ultimateBuffTime:0,step:0,cards:[],kills:0,mollitiamHeartTime:0};const loid=type==='loid',cross=type==='cross',eve=type==='eve',kali=type==='kali';return {type,x:WORLD_W/2,y:WORLD_H/2+120,face:'down',aim:-Math.PI/2,hp:loid?110:cross?118:eve?115:kali?120:135,maxHp:loid?110:cross?118:eve?115:kali?120:135,damage:loid?26:cross?29:eve?42:kali?23:46,attackDelay:loid?.24:cross?.34:eve?.31:kali?.40:.43,atkTime:0,speed:loid?105:cross?106:eve?125:kali?96:91,reach:loid?33:cross?38:eve?53:kali?85:43,arc:loid?1.85:cross?1.95:2.15,armor:0,crit:cross?.26:eve?.13:.07,echo:0,onKillHeal:0,betweenHeal:11,dashDelay:loid?2.4:cross?2.55:eve?2.2:2.8,dashCd:0,dashTime:0,dashV:{x:0,y:0},invuln:0,skillDelay:loid?9:cross?6.5:eve?17.5:kali?20:14,skillCd:0,skillAmp:1,darkAuraTime:0,darkAuraTick:0,secondaryCd:0,secondaryDelay:loid?20:cross?9:eve?15:kali?18:8.5,secondaryCharging:false,secondaryCharge:0,transformDuration:6,transformAmp:.55,transformTime:0,shadowDash:false,orbiters:0,orbitTimer:0,waveAttack:false,cardPower:'',cardPowerUsed:false,frogSkill:false,frogUsed:false,frogTime:0,ghost:false,dodgeChance:(cross?.12:eve?.15:0),mirrorGuard:0,mirrorAmp:1,mirrorDuration:4,timeDuration:5,voidField:0,voidTick:0,voidUltimate:0,voidUltTick:0,crossChain:null,curseTime:0,frostTime:0,attackCount:0,ultimateCharge:0,ultimateTime:0,ultimateTick:0,ultimateBuff:'',ultimateBuffTime:0,step:0,cards:[],kills:0};}
const originalCreatePlayer=createPlayer;createPlayer=function(type){const p=originalCreatePlayer(type);if(type==='cross')Object.assign(p,{speed:145,attackDelay:.18,dashDelay:1.05,reach:34});if(type==='kali')Object.assign(p,{skillDelay:18,mirrorDuration:5});if(type==='moretti')Object.assign(p,{hp:100,maxHp:100,damage:18,critMultiplier:30/18,attackDelay:.65,dashDelay:1.2,speed:155,reach:40,skillDelay:14,secondaryDelay:18});if(type==='l0id')Object.assign(p,{hp:180,maxHp:180,damage:85,critMultiplier:2,attackDelay:.22,dashDelay:.8,speed:190,reach:48,skillDelay:10,secondaryDelay:20});if(type==='josue')Object.assign(p,{hp:155,maxHp:155,damage:58,crit:.12,critMultiplier:1.7,attackDelay:.48,dashDelay:2.2,speed:108,reach:92,arc:2.35,skillDelay:14,secondaryDelay:18});if(type==='mimic')Object.assign(p,{mimicOrigin:true,mimicNext:0,mimicBosses:[],mimicBoss:null,hp:150,maxHp:150,damage:38,speed:110,reach:58,attackDelay:.48,dashDelay:1.4,armor:.12,crit:.12,skillDelay:10,secondaryDelay:12});if(type==='abloy')Object.assign(p,{hp:112,maxHp:112,damage:31,attackDelay:.55,speed:100,reach:245,crit:.10,skillDelay:8,secondaryDelay:13,dashDelay:2.45,abSpirits:3,abOrbAmp:1,abBurstAmp:1,abBeamDuration:2.4,abCosmicUntil:0,abSpiritChanceBonus:0,abSpiritExtra:0,abActiveSpirits:[]});p.baseMaxHp=p.maxHp;p.baseSkillDelay=p.skillDelay;p.baseSecondaryDelay=p.secondaryDelay;p.baseDamage=p.damage;p.baseAttackDelay=p.attackDelay;p.baseSpeed=p.speed;p.baseReach=p.reach;p.baseDashDelay=p.dashDelay;return p;};
// v4.9: all new ability outcomes are computed by the co-op host, not by guests.
let realityFields=[],realityVictory=false,mimicVictory=false;
let l0idUnlocked=false;try{l0idUnlocked=localStorage.getItem('yggdrasil.l0id')==='1';}catch{}
function unlockL0id(){l0idUnlocked=true;try{localStorage.setItem('yggdrasil.l0id','1');}catch{}refreshL0id();}
function refreshL0id(){document.querySelectorAll('[data-secret-l0id]').forEach(b=>{b.classList.toggle('secret-locked',!l0idUnlocked);b.setAttribute('aria-disabled',String(!l0idUnlocked));});}
let mimicUnlocked=false;try{mimicUnlocked=localStorage.getItem('yggdrasil.mimic')==='1';}catch{}
function unlockMimic(){mimicUnlocked=true;try{localStorage.setItem('yggdrasil.mimic','1');}catch{}refreshMimic();}
function refreshMimic(){document.querySelectorAll('[data-secret-mimic]').forEach(b=>{b.classList.toggle('secret-locked',!mimicUnlocked);b.setAttribute('aria-disabled',String(!mimicUnlocked));});}
function secretCode(code){code=String(code).trim().toUpperCase();if(code==='KR1S'){unlockMimic();return true;}if(code==='L0ID'){unlockL0id();return true;}return false;}
const MIMIC_FORMS=['mimic','kris','loid','cross','eve','kali','mollitiam','moretti','l0id','josue','abloy'];
const MIMIC_NAMES={mimic:'Mímico',kris:'Kris',loid:'Loid',cross:'Xans',eve:'Eve Lorey',kali:'Kali',mollitiam:'Mollitiam',moretti:'Moretti',l0id:'L0ID',josue:'Josué',abloy:'Abloy'};
// V5.6: captured boss souls are part of the authoritative actor, not a client unlock.
const MIMIC_BOSSES={boss:{name:'Daimyō Oni',q:'Corte do Eclipse',e:'Postura do Shogun',r:'Chuva de Lâminas',reach:110,color:'#ff5668'},reuni:{name:'Reuni',q:'Perseguição Carmesim',e:'Invocação Oni',r:'Dilúvio Rubro',reach:120,color:'#f82d49'},tsukuomi:{name:'Tsukuomi',q:'Olhar do Vazio',e:'Passo Lunar',r:'Luas Abissais',reach:145,color:'#d57eff'},pecado:{name:'Pecado',q:'Lanças do Pecado',e:'Maldição Suprema',r:'Juízo Final',reach:160,color:'#ff2148'},frostjarl:{name:'Jarl do Gelo',q:'Lanças Glaciais',e:'Congelamento',r:'Chuva de Gelo',reach:135,color:'#a2dbff'},odin:{name:'Odin',q:'Gungnir',e:'Trovões de Asgard',r:'Escudo das Nove Runas',reach:170,color:'#92bfff'},nameless:{name:'Cavaleiro Inominável',q:'Lâmina da Execução',e:'Investida do Condenado',r:'Pacto Dracônico',reach:140,color:'#d7acff'},ancestralDragon:{name:'Dragão Ancestral',q:'Sopro Dracônico',e:'Asas do Cataclismo',r:'Fogo sem Fim',reach:180,color:'#ff8545'}};
function captureMimicBoss(e){bossDrop60(e);if(e.secretKind&&e.hp<=0)secretReward61(e);if(!MIMIC_BOSSES[e.type]||e.hp>0||e.mimicCaptured)return;e.mimicCaptured=true;for(const a of new Set(coop.active&&coop.host?[coop.hostAvatar||player,...coop.allies.values()]:[player])){if(!a?.mimicOrigin)continue;a.mimicBosses=[...new Set([...(a.mimicBosses||[]),e.type])];if(a.hp>0)textPop(a.x,a.y-40,'ALMA · '+MIMIC_BOSSES[e.type].name.toUpperCase(),'#ff8792');}if(coop.active&&coop.host)coop.checkpointDirty=true;}
// V5.6.1: individual boss abilities; friendly effects run on the authoritative actor.
function mimicPower(key){const p=player;if(!p?.mimicOrigin||p.type!=='mimic'||p.hp<=0||phase!=='play')return;const form=p.mimicBoss,profile=MIMIC_BOSSES[form],color=profile?.color||'#ff4058';
 if(key==='Q'){if(p.skillCd>0)return;p.skillCd=p.skillDelay;p.atkTime=Math.max(p.atkTime,.22);}
 else if(key==='E'){if(p.secondaryCd>0)return;p.secondaryCd=p.secondaryDelay;}
 else if(key==='R'){if(p.ultimateCharge<100)return;p.ultimateCharge=0;YG_AUDIO.play('ultimate',1.15);}
 else return;
 const living=()=>enemies.filter(e=>e.hp>0),nearest=()=>living().sort((a,b)=>dist(a,p)-dist(b,p))[0];
 const strike=(e,m,fx='')=>{if(e.hp<=0)return false;hitEnemy(e,p.damage*m*p.skillAmp,key!=='R');if(e.hp>0){if(fx==='ice'){e.slow=Math.max(e.slow||0,5);e.stunTime=Math.max(e.stunTime||0,isBossEnemy(e)?.6:2.2);}if(fx==='curse'){e.corruptTime=Math.max(e.corruptTime||0,6);e.slow=Math.max(e.slow||0,3);}if(fx==='stun')e.stunTime=Math.max(e.stunTime||0,isBossEnemy(e)?.5:1.5);}return true;};
 const area=(x,y,r,m,fx='')=>{ring(x,y,r,color);let n=0;for(const e of living())if(Math.hypot(e.x-x,e.y-y)<=r+e.radius&&strike(e,m,fx))n++;return n;};
 const cone=(r,m,arc=.65,fx='')=>{slash(p.x,p.y,p.aim,r,color);let n=0;for(const e of living()){const d=Math.atan2(e.y-p.y,e.x-p.x)-p.aim;if(dist(e,p)<=r+e.radius&&Math.abs(Math.atan2(Math.sin(d),Math.cos(d)))<=arc&&strike(e,m,fx))n++;}return n;};
 const volley=(n,spread,m,speed=240,fx='',radial=false)=>{for(let i=0;i<n&&projectiles.length<155;i++){const a=radial?p.aim+TAU*i/n:p.aim+(i-(n-1)/2)*spread;projectiles.push({x:p.x+Math.cos(a)*17,y:p.y+Math.sin(a)*17,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:1.65,r:6,damage:p.damage*m*p.skillAmp,from:'player',ownerId:coop.active?actorKey(p):null,color,mimicFx:fx,mimicShot:true,mimicCharge:key!=='R'});}};
 const move=(len)=>{const x=p.x,y=p.y;p.x+=Math.cos(p.aim)*len;p.y+=Math.sin(p.aim)*len;applyBoundaries(p,8);p.invuln=Math.max(p.invuln,.5);slash(x,y,p.aim,len,color);};
 const marks=(n,r,m,fx='',spread=85)=>{const targets=living().sort((a,b)=>dist(a,p)-dist(b,p)).slice(0,n);const center=targets[0]||p;for(let i=0;i<n;i++){const a=TAU*i/n,t=targets[i]||{x:center.x+Math.cos(a)*spread,y:center.y+Math.sin(a)*spread};const x=clamp(t.x,105,WORLD_W-105),y=clamp(t.y,160,WORLD_H-105);p.mimicMarks=(p.mimicMarks||[]).concat({x,y,r,m,fx,color,at:elapsed+.45+i*.15,stage,charge:key!=='R'}).slice(-24);ring(x,y,r,color);}};
 const summon=(n,kind)=>{summonNewClones(p,n,kind);for(const c of shadowClones)if(c.kind===kind&&c.ownerId===(coop.actorId||coop.id)){c.time=7;c.damage=p.damage*.4;}};
 switch(form){
 case 'boss':if(key==='Q')cone(135,2.4,1.05);else if(key==='E'){p.mimicGuardUntil=elapsed+3;p.shield=Math.max(p.shield||0,p.maxHp*.22);ring(p.x,p.y,70,color);}else{volley(12,.2,1.35,255,'',true);cone(150,2,1.2);}break;
 case 'reuni':if(key==='Q'){move(75);if(cone(120,2.1,1.1))supportHeal(p,.07);}else if(key==='E')summon(3,'mimicOni');else{marks(6,34,1.5,'drain');supportHeal(p,.12);}break;
 case 'tsukuomi':if(key==='Q')volley(5,.21,1.2,230);else if(key==='E'){move(105);area(p.x,p.y,75,1.7,'stun');}else{marks(7,40,1.4,'stun');p.mimicVeilUntil=elapsed+5;p.invuln=Math.max(p.invuln,1.5);}break;
 case 'frostjarl':if(key==='Q')volley(5,.18,1.25,210,'ice');else if(key==='E')area(p.x,p.y,125,1.4,'ice');else marks(7,47,1.65,'ice');break;
 case 'odin':if(key==='Q')volley(5,.11,1.45,330);else if(key==='E')marks(5,32,1.8,'stun');else{p.shield=Math.max(p.shield||0,p.maxHp*.45);p.mimicWardUntil=elapsed+6;volley(9,.25,1.15,245,'',true);}break;
 case 'nameless':if(key==='Q')cone(155,2.6,.45);else if(key==='E'){move(115);area(p.x,p.y,82,1.8,'stun');}else{marks(3,60,2,'stun');volley(7,.16,1.1,250,'fire');}break;
 case 'ancestralDragon':if(key==='Q')volley(7,.12,1.05,255,'fire');else if(key==='E'){for(const e of living())if(dist(e,p)<140+e.radius&&!isBossEnemy(e)){const a=Math.atan2(e.y-p.y,e.x-p.x);e.x+=Math.cos(a)*75;e.y+=Math.sin(a)*75;applyBoundaries(e,e.radius);}area(p.x,p.y,145,1.5,'stun');}else{marks(6,45,1.45,'fire',90);}break;
 case 'pecado':if(key==='Q')volley(10,.2,1.15,230,'curse',true);else if(key==='E'){area(p.x,p.y,150,1.1,'curse');realityFields.push({x:p.x,y:p.y,radius:150,until:elapsed+6,power:2});}else{marks(8,40,1.65,'curse');summon(2,'mimicEcho');}break;
 default:if(key==='Q'){cone(110,2.1,1.3);for(const e of living())if(!isBossEnemy(e)&&dist(e,p)<110){e.x+=(p.x-e.x)*.38;e.y+=(p.y-e.y)*.38;applyBoundaries(e,e.radius);}}else if(key==='E'){area(p.x,p.y,115,2,'stun');supportHeal(p,.18);}else{p.ultimateBuff='mimic';p.ultimateBuffTime=10;p.invuln=Math.max(p.invuln,2);supportHeal(p,.25);area(p.x,p.y,190,2.8,'stun');}break;
 }
 makeParticles(p.x,p.y,color,lowFx()?8:18,1.2);textPop(p.x,p.y-34,(profile?profile[key.toLowerCase()]:{Q:'CORRENTE DO ABISMO',E:'DEVORAR ALMAS',R:'ASCENSÃO MIMÉTICA'}[key]).toUpperCase(),color);supportChanged();}
function tickMimicMarks(p){if(!p.mimicMarks?.length)return;const due=p.mimicMarks.filter(v=>v.stage===stage&&v.at<=elapsed);p.mimicMarks=p.mimicMarks.filter(v=>v.stage===stage&&v.at>elapsed);const prior=player;player=p;try{for(const v of due){ring(v.x,v.y,v.r,v.color);let hit=0;for(const e of enemies){if(e.hp<=0||Math.hypot(e.x-v.x,e.y-v.y)>v.r+e.radius)continue;hitEnemy(e,p.damage*v.m*p.skillAmp,v.charge);hit++;if(e.hp<=0)continue;if(v.fx==='ice'){e.slow=Math.max(e.slow||0,5);e.stunTime=Math.max(e.stunTime||0,isBossEnemy(e)?.5:1.6);}if(v.fx==='stun')e.stunTime=Math.max(e.stunTime||0,isBossEnemy(e)?.35:1);if(v.fx==='curse')e.corruptTime=Math.max(e.corruptTime||0,6);if(v.fx==='fire')e.slow=Math.max(e.slow||0,1.1);}if(v.fx==='drain'&&hit)supportHeal(p,.025);}}finally{player=prior;}}
// Actor identity stays stable; copied stats are derived from the selected hero, not stacked.
function mimicTransform(a,type){
 const boss=typeof type==='string'&&type.startsWith('boss:')?type.slice(5):null; if(!a?.mimicOrigin||a.hp<=0||(!boss&&!MIMIC_FORMS.includes(type))||(boss&&(!MIMIC_BOSSES[boss]||!(a.mimicBosses||[]).includes(boss)))||(boss?boss===a.mimicBoss: type===a.type&&!a.mimicBoss)||elapsed<(a.mimicNext||0)||phase!=='play')return false; if(boss)type='mimic';
 if((a.abBeam?.until||0)>elapsed||a.mimicMarks?.some(v=>v.stage===stage&&v.at>elapsed)||a.secondaryCharging||a.coopUltimatePending||a.crossTp||a.frogTime>0||a.ultimateTime>0||a.ultimateBuffTime>0||a.voidUltimate>0||a.dashTime>0||a.evePrimeTime>0||a.mollitiamHeartTime>0)return false;
 const owner=coop.active?actorKey(a):coop.id;shadowClones=shadowClones.filter(c=>c.ownerId!==owner||!c.kind?.startsWith('mimic'));
 const old={...a},fresh=createPlayer(type),owned=(old.cards||[]).slice(),runes=(old.runes||[]).slice();
 if(boss){fresh.mimicBoss=boss;const stats={boss:[52,190,115,.60,7,12],reuni:[48,175,155,.48,8,12],tsukuomi:[44,155,125,.58,7,11],pecado:[64,220,115,.65,9,14],frostjarl:[53,235,95,.73,8,13],odin:[58,195,120,.62,8,12],nameless:[60,220,125,.70,8,12],ancestralDragon:[50,210,105,.68,7,13]}[boss];[fresh.damage,fresh.maxHp,fresh.speed,fresh.attackDelay,fresh.skillDelay,fresh.secondaryDelay]=stats;fresh.hp=fresh.maxHp;fresh.reach=MIMIC_BOSSES[boss].reach*.75;}else if(type!=='mimic'){fresh.damage*=1.20;fresh.skillDelay*=.90;fresh.secondaryDelay*=.90;}for(const [k,v] of Object.entries({Damage:'damage',MaxHp:'maxHp',Speed:'speed',AttackDelay:'attackDelay',Reach:'reach',SkillDelay:'skillDelay',SecondaryDelay:'secondaryDelay',DashDelay:'dashDelay'}))fresh['base'+k]=fresh[v];
 for(const id of owned){const c=cards.find(v=>v.id===id);if(c&&!c.id.startsWith('tree_')&&(!c.hero||c.hero===type)&&!['frog','gaster','granita','eveprime','mollitiamHeart','authorReality','godShadow','chronosFury'].includes(c.id))applyCard62(fresh,c);}
 for(const id of runes){const c=nordicCards.find(v=>v.id===id)||(type==='abloy'?abloyCards.find(v=>'n_'+v.id===id):null);if(c)c.effect(fresh);}
 if(old.passives)applyNordicPassives(fresh,old.passives);
 if(isNordic())nordicClamp(fresh);if(rushMode)rushClamp62(fresh);
 // Keep health fraction, cooldowns, charge, inventory and position. Never regenerate consumable F powers by switching.
 for(const k of ['x','y','face','aim','step','moving','blinkSeq','input','inputAt','lastAttack','kills','attackCount','curseTime','frostTime','invuln','ghost','nordicStarterGranted','nordicSpecialEarned','dragonPact','mimicMastery','mimicUsedPowers','mimicBosses','damage62','heal62','skin62'])if(old[k]!==undefined)fresh[k]=old[k];
 for(const k of ['skillCd','secondaryCd','dashCd','atkTime'])fresh[k]=Math.max(old[k]||0,k==='atkTime'?.2:0);
 fresh.hp=Math.max(1,Math.min(fresh.maxHp,fresh.maxHp*old.hp/old.maxHp));fresh.ultimateCharge=old.ultimateCharge||0;
 fresh.cards=owned;fresh.runes=runes;fresh.mimicOrigin=true;for(const k of ['abActiveSpirits','abOrbAt','abHealAt','abGuardAt'])if(old[k]!==undefined)fresh[k]=old[k];fresh.mimicNext=elapsed+(old.mimicMastery?5:8);
 // Exclusive cards retain ownership and use state; only activate in the matching copied form.
 const used={...(old.mimicUsedPowers||{})};if(old.cardPower&&(old.cardPowerUsed||old.frogUsed))used[old.cardPower]=true;
 const special=owned.map(id=>cards.find(c=>c.id===id)).find(c=>c?.hero===type&&['frog','gaster','granita','eveprime','mollitiamHeart','authorReality','godShadow','chronosFury'].includes(c.id));
 const runeSpecial=runes.map(id=>nordicSpecialRunes.find(c=>c.id===id)).find(c=>c?.hero===type||c?.hero==='mimic');if(special)special.effect(fresh);else if(runeSpecial)runeSpecial.effect(fresh);
 if(fresh.cardPower&&used[fresh.cardPower]){fresh.cardPowerUsed=true;if(fresh.cardPower==='frog')fresh.frogUsed=true;}
 fresh.mimicUsedPowers=used;for(const k of ['coins60','shopStage60','items60','curses60','relics60','equipped60','actions60','bossCount60','events60','awaken60'])if(old[k]!==undefined)fresh[k]=old[k];refreshSpeed60(fresh);
 for(const k of Object.keys(a))delete a[k];Object.assign(a,fresh);
 ring(a.x,a.y,60,'#ff4058');makeParticles(a.x,a.y,'#b71b36',20,1.2);textPop(a.x,a.y-36,'MÍMICO · '+(boss?MIMIC_BOSSES[boss].name:MIMIC_NAMES[type]).toUpperCase(),'#ff8792');return true;
}
function chooseMimicForm(type){if(!player?.mimicOrigin||phase!=='play'||coop.reconnecting)return;if(coop.active&&!coop.host){closeMimicMenu();coopAction('mimic',type);return;}if(mimicTransform(player,type)){closeMimicMenu();updateHud();if(coop.active){coop.checkpointDirty=true;coopSendState(true);}}else{$('mimicNotice62').textContent='Troca indisponível: aguarde a recarga ou o fim da habilidade.';}}
function closeMimicMenu(){const panel=$('mimicForms');if(panel)panel.hidden=true;}
function toggleMimicMenu(mode='hero'){if(!player?.mimicOrigin||phase!=='play'||player.hp<=0||screenAdjusting||coop.reconnecting)return;const panel=$('mimicForms');if(!panel.hidden&&panel.dataset.mode===mode){closeMimicMenu();return;}keys.clear();attackMobile=false;pointerDown=false;panel.dataset.mode=mode;panel.hidden=false;$('mimicNotice62').textContent='';$('mimicHeroSection').hidden=mode==='boss';$('mimicBossSection').hidden=mode!=='boss';panel.querySelectorAll('[data-mimic-form]').forEach(b=>{const form=b.dataset.mimicForm;if(form.startsWith('boss:')){const boss=form.slice(5),owned=(player.mimicBosses||[]).includes(boss);b.disabled=!owned||player.mimicBoss===boss;b.textContent=(owned?'':'🔒 ')+MIMIC_BOSSES[boss].name;}else b.disabled=form===player.type&&!player.mimicBoss;});}
function updateMimicHud(){const b=$('mimicToggle');if(!b)return;const on=!!player?.mimicOrigin&&player.hp>0&&phase==='play';b.hidden=!on;if(!on){const boss=$('mimicBossToggle');if(boss)boss.hidden=true;closeMimicMenu();return;}const cd=Math.max(0,(player.mimicNext||0)-elapsed);b.textContent=cd>0?'TROCA · '+Math.ceil(cd)+'s':'HERÓIS · T';b.disabled=cd>0;const boss=$('mimicBossToggle');if(boss){boss.hidden=!on;boss.disabled=cd>0;boss.textContent='CHEFES · B ('+(player.mimicBosses||[]).length+')';}}

let realityEnemyWeakness=0;function fieldWeakness(e){return Math.min(.65,realityFields.reduce((v,f)=>dist(e,f)<f.radius?Math.max(v,.18*f.power):v,0));}
// All support effects are applied to the authoritative living roster, once per actor.
function newTeam(){return [...new Set(coop.active&&coop.host?[coop.hostAvatar||player,...coop.allies.values()]:[player])].filter(a=>a&&a.hp>0);}
function supportHeal(a,rate,visual=true){if(!a||a.hp<=0)return 0;const gain=Math.max(0,Math.min(a.maxHp-a.hp,a.maxHp*rate));a.hp+=gain;if(player&&gain>0)player.heal62=(player.heal62||0)+gain;if(gain>0&&visual){textPop(a.x,a.y-29,'+'+Math.round(gain),'#a5fac0');ring(a.x,a.y,24,'#98e8b9');}return gain;}
function supportChanged(){if(coop.active&&coop.host){coop.checkpointDirty=true;if(!coop.executing)coopSendState(true);}if(!coop.executing)updateHud();}
function actorKey(a){if(!coop.active)return 'solo';if(a===(coop.hostAvatar||player)&&!coop.actorId)return coop.id;if(a===coop.hostAvatar)return coop.id;for(const [id,hero] of coop.allies)if(hero===a)return id;return coop.id;}
function kaliReflections(caster,team,seconds){const casterId=actorKey(caster);for(const [i,a] of team.entries()){const ownerId=actorKey(a);const old=mirrorIllusions.find(v=>v.casterId===casterId&&v.ownerId===ownerId);if(old){old.life=Math.max(old.life,seconds);old.owner=a;continue;}mirrorIllusions.push({casterId,ownerId,owner:a,x:a.x+Math.cos(i*2.1)*28,y:a.y+Math.sin(i*2.1)*28,life:seconds,attackCd:.2+i*.12});}}
function kaliSupport(key){const p=player,team=newTeam();if(key==='Q'){p.skillCd=p.skillDelay;for(const a of team){a.mirrorGuard=Math.max(a.mirrorGuard||0,p.mirrorDuration||5);supportHeal(a,.10);}ring(p.x,p.y,170,'#e0b8ff');}
else if(key==='E'){p.secondaryCd=p.secondaryDelay;for(const a of team)applyRealityBuff(a,6,1,'mirrorRegen');kaliReflections(p,team,6);ring(p.x,p.y,110,'#d8b5ff');}
else if(key==='R'){p.ultimateTime=10;p.invuln=Math.max(p.invuln,.6);for(const a of team){supportHeal(a,.20);applyRealityBuff(a,10,1,'mirrorSanctuary');}kaliReflections(p,team,10);ring(p.x,p.y,200,'#c8b1fb');}
bossMessage='KALI · '+({Q:'REFLEXO PROTETOR',E:'ESPELHOS DA ALMA',R:'SANTUÁRIO DOS ESPELHOS'}[key]);bossMessageTimer=2;supportChanged();}
function supportStatus(p){const out=[];for(const [k,label] of [['destiny','⚔ Destino'],['distortion','➤ Distorção'],['population','✦ População'],['author','🎲 Autor'],['mirrorRegen','♥ Espelhos'],['mirrorSanctuary','◇ Santuário']]){const n=(p[k+'Until']||0)-elapsed;if(n>0)out.push(label+' '+Math.ceil(n)+'s');}if(p.mirrorGuard>0)out.push('◇ Reflexo '+Math.ceil(p.mirrorGuard)+'s');return out.join(' · ');}

function d20Power(n){return n<=5?.5:n<=10?1:n<=15?1.25:n<=19?1.75:2.5;}
function rollReality(p,ability){const twice=ability==='F'||((ability==='Q'||ability==='E')&&p.realityAdvantage?.includes(ability));const rolls=Array.from({length:twice?2:1},()=>1+Math.floor(Math.random()*20));if(twice&&ability!=='F')p.realityAdvantage=p.realityAdvantage.filter(x=>x!==ability);const value=Math.max(...rolls);p.realityRoll={rolls,value,ability,at:elapsed};p.newPose={row:{Q:4,E:5,R:6,F:7}[ability],until:elapsed+1.1};ring(p.x,p.y,value===20?105:45,value===20?'#ffd57a':'#b76aff');bossMessage=`MORETTI · ${ability} · D20 ${rolls.join(' / ')}${value===20?' · 20 NATURAL!':''}`;bossMessageTimer=2.5;return d20Power(value);}
function applyRealityBuff(p,seconds,power,kind){const old=realityPower(p,kind);p[kind+'Until']=Math.max(p[kind+'Until']||0,elapsed+seconds);p[kind+'Power']=Math.max(old,power);}
function realityPower(p,kind){return (p[kind+'Until']||0)>elapsed?(p[kind+'Power']||0):0;}
function josueFury(p){return p.type==='josue'&&(p.josueFuryUntil||0)>elapsed;}
function josueAscend(p){return p.type==='josue'&&(p.josueAscendUntil||0)>elapsed;}
function josueAbility(key){const p=player;if(key==='Q'){p.skillCd=p.skillDelay;p.josueFuryUntil=elapsed+7;ring(p.x,p.y,88,'#ff6245');for(const e of enemies)if(e.hp>0&&dist(e,p)<112+e.radius)hitEnemy(e,p.damage*.8,true);}
else if(key==='E'){p.secondaryCd=p.secondaryDelay;timeFields.push({x:p.x+Math.cos(p.aim)*70,y:p.y+Math.sin(p.aim)*70,radius:115,life:6,tick:.65,ownerId:actorKey(p)});ring(p.x,p.y,115,'#65e8c8');}
else if(key==='R'){p.ultimateTime=8;ring(p.x,p.y,105,'#ffd47a');}
else if(key==='F'){p.josueAscendUntil=elapsed+10;ring(p.x,p.y,115,'#e4c181');}
if((key==='Q'||key==='E')&&p.ultimateTime<=0)p.ultimateCharge=Math.min(100,p.ultimateCharge+5);bossMessage='JOSUÉ · '+({Q:'FÚRIA ESPARTANA',E:'RUPTURA TEMPORAL',R:'FORA DO TEMPO · 90% ESQUIVA',F:'FÚRIA ALÉM DO TEMPO'}[key]);bossMessageTimer=2.4;supportChanged();}
function newDamage(p){return dmg60(p)*(p.mimicOrigin&&p.ultimateBuff==='mimic'&&p.ultimateBuffTime>0?1.25:1)*(josueFury(p)?1.45:1)*(josueAscend(p)?1.35:1)*(1+.20*realityPower(p,'destiny'))*(1+.25*realityPower(p,'population'))*(1+.15*realityPower(p,'mirrorSanctuary'))*(1+.25*realityPower(p,'author'))*(p.type==='l0id'?(p.ultimateTime>0?2:1)*(p.darkAuraTime>0?1.35:1):1);}
function newAttackDelay(p){return (awake60(p,'josue')?1/1.15:1)/((josueFury(p)?1.2:1)*(josueAscend(p)?1.25:1)*(1+.18*realityPower(p,'destiny'))*(1+.20*realityPower(p,'author'))*(1+.20*realityPower(p,'population'))*(p.type==='l0id'&&p.ultimateTime>0?1.65:1));}
function newSpeed(p){return 1+.25*realityPower(p,'distortion')+.20*realityPower(p,'author');}
function summonNewClones(p,count=10,kind='l0id'){const ownerId=coop.actorId||coop.id;shadowClones=shadowClones.filter(s=>!(s.ownerId===ownerId&&s.kind===kind));for(let i=0;i<count;i++){const angle=TAU*i/count;shadowClones.push({ownerId,kind,x:p.x+Math.cos(angle)*30,y:p.y+Math.sin(angle)*30,angle,step:0,face:'down',time:12,attackCd:.1+i*.07});}}
function newAbility(key){const p=player;if(p.type==='moretti'){
 const power=rollReality(p,key);if((key==='Q'||key==='E')&&p.ultimateTime<=0)p.ultimateCharge=Math.min(100,p.ultimateCharge+8);if(key==='Q'){p.skillCd=p.skillDelay;for(const a of newTeam()){applyRealityBuff(a,8,power,'destiny');supportHeal(a,.08*power);}}
 if(key==='E'){p.secondaryCd=p.secondaryDelay;realityFields.push({x:p.x,y:p.y,radius:135,until:elapsed+8,power});for(const a of newTeam())if(a.hp>0)applyRealityBuff(a,8,power,'distortion');}
 if(key==='R'){p.ultimateTime=10;for(const a of newTeam()){applyRealityBuff(a,10,power,'population');supportHeal(a,.15*power);}summonNewClones(p,4,'population');if(p.realityRoll.value===20)p.rewriteUntil=elapsed+10;}
 if(key==='F'){p.realityAdvantage=['Q','E'];applyRealityBuff(p,12,power,'author');}
 }else{p.newPose={row:{Q:4,E:5,R:6,F:7}[key],until:elapsed+1.1};if(key==='Q'){p.skillCd=p.skillDelay;p.darkAuraTime=6;p.darkAuraTick=0;}if(key==='E'){p.secondaryCd=p.secondaryDelay;summonNewClones(p);}if(key==='R'){p.ultimateTime=10;}if(key==='F'){p.godShadowUntil=elapsed+10;p.invuln=Math.max(p.invuln,3);summonNewClones(p);}ring(p.x,p.y,key==='R'?180:85,'#9b77d7');bossMessage='L0ID · '+({Q:'DOMÍNIO DAS SOMBRAS',E:'LEGIÃO DO ABISMO',R:'ECLIPSE ABSOLUTO',F:'A SOMBRA QUE DEVOROU DEUS'}[key]);bossMessageTimer=2;}
 if(p.type==='moretti')supportChanged();else updateHud();}
function tickNewHero(p,dt){if(p.hp<=0)return;if(p.type==='abloy')tickAbloy(p,dt);if(rel60(p,'nameless')||p.awaken60){const extra=(rel60(p,'nameless')?.064:0)+(p.awaken60?.08:0)+((awake60(p,'eve')||awake60(p,'moretti'))?.176:0);p.skillCd=Math.max(0,p.skillCd-dt*extra);p.secondaryCd=Math.max(0,p.secondaryCd-dt*extra);}tickMimicMarks(p);if(josueAscend(p)){p.skillCd=Math.max(0,p.skillCd-dt*.40);p.secondaryCd=Math.max(0,p.secondaryCd-dt*.40);}const b=realityPower(p,'destiny');if(b){for(const k of ['skillCd','secondaryCd','dashCd'])p[k]=Math.max(0,p[k]-dt*.22*b);}const pop=realityPower(p,'population');const regen=.02*(pop+realityPower(p,'mirrorRegen'));if(regen)supportHeal(p,regen*dt,false);if(p.type==='l0id'&&p.darkAuraTime>0){p.darkAuraTick=(p.darkAuraTick||0)-dt;if(p.darkAuraTick<=0){p.darkAuraTick=.5;const before=player;player=p;try{for(const e of enemies)if(e.hp>0&&dist(e,p)<92+e.radius)hitEnemy(e,p.damage*.55,false);}finally{player=before;}}}}
function newTeleport(p,v){p.blinkSeq=(p.blinkSeq||0)+1;p.dashCd=p.dashDelay*(p.ultimateTime>0?.5:1);p.dashTime=0;p.invuln=Math.max(p.invuln,.36);p.newPose={row:8,until:elapsed+.32};ring(p.x,p.y,24,'#51436d');p.x+=v.x*(p.ultimateTime>0?185:125);p.y+=v.y*(p.ultimateTime>0?185:125);applyBoundaries(p,8);ring(p.x,p.y,32,'#b49be2');}
function theme(){if(defense62)return {name:'SANTUÁRIO DE YGGDRASIL',floor:'#20372a',wall:'#152a23',accent:'#a1bd70',danger:'#fa9764'};if(rushMode)return {name:'BOSS RUSH · ARENA DOS DEUSES',floor:'#24152d',wall:'#160b20',accent:'#e2a7e9',danger:'#ff476c'};if(stage===40)return {name:'NÓRDICO · TRONO FINAL DO PECADO',floor:'#240d24',wall:'#140a1d',accent:'#fc6280',danger:'#ff476c'};if(isNordic())return {name:'REINO NÓRDICO · INVERNO ETERNO',floor:'#142934',wall:'#102032',accent:'#b5f0fc',danger:'#9fc4ff'};return stage===20?{name:'TRONO DO PECADO',floor:'#3a0810',wall:'#160408',accent:'#ff253f',danger:'#de1228'}:stage===15?{name:'DOMÍNIO DA LUA',floor:'#1b1730',wall:'#0c0920',accent:'#b98dff',danger:'#995ac8'}:THEMES[Math.min(THEMES.length-1,Math.floor((stage-1)/4))]}
const MOB_STATS={walker:{hp:44,speed:47,radius:10},runner:{hp:31,speed:69,radius:10},caster:{hp:54,speed:32,radius:11},ghost:{hp:42,speed:66,radius:10},yokai:{hp:62,speed:46,radius:11},beast:{hp:88,speed:83,radius:13},draugr:{hp:125,speed:49,radius:12},frostwolf:{hp:78,speed:92,radius:12},berserker:{hp:180,speed:72,radius:14},runewitch:{hp:107,speed:44,radius:12}};
function waveName(n){if(n>=21)return n===40?'PECADO · TRONO DO INVERNO ETERNO':n===30?'ODIN · SENHOR DAS RUNAS':n===35?'O CAVALEIRO INOMINÁVEL · PACTO DRACÔNICO':n===25?'JARL DO GELO · FÚRIA DA TEMPESTADE':['','FLORESTA DOS DRAUGRS','CAÇADA DOS LOBOS GLACIAIS','BERSERKERS AMALDIÇOADOS','RITUAL DAS FEITICEIRAS'][Math.min(4,n-20)]||'INVERNO ETERNO';if(n===20)return 'PECADO · O DEVORADOR DAS RAÍZES';if(n===15)return 'TSUKUOMI · SENHORA DO ECLIPSE';if(n===10)return 'REUNI · SENHOR DO SANGUE';if(n%5===0)return 'O SAMURAI ONI DESPERTA';const m=n%5;return m===4?'ONDA DOS ESPÍRITOS':m===3?'INVASÃO YOKAI':m===2?'CAÇADA DAS BESTAS':'INVASÃO ONI';}
function randEnemyType(){
 const r=Math.random();
 if(isNordic()){if(localNordicWave()===1)return r<.67?'draugr':'frostwolf';if(localNordicWave()===2)return r<.50?'frostwolf':r<.80?'draugr':'berserker';if(localNordicWave()===3)return r<.42?'berserker':r<.70?'draugr':'runewitch';return r<.35?'runewitch':r<.64?'frostwolf':r<.86?'berserker':'draugr';}
 if(stage<=2)return r<.68?'walker':'runner';
 if(stage<=4)return r<.5?'walker':r<.8?'runner':'caster';
 if(stage<=6)return r<.43?'walker':r<.66?'runner':r<.84?'ghost':'caster';
 if(stage<=9){const m=stage%5;return m===3?(r<.53?'yokai':r<.8?'ghost':'caster'):m===4?(r<.53?'ghost':r<.8?'yokai':'beast'):r<.27?'walker':r<.52?'runner':r<.78?'ghost':'beast';}
 if(stage%5===4)return r<.34?'ghost':r<.67?'yokai':'beast';
 if(stage%5===3)return r<.38?'yokai':r<.64?'caster':r<.84?'ghost':'beast';
 return r<.17?'walker':r<.32?'runner':r<.50?'caster':r<.68?'ghost':r<.84?'beast':'yokai';
}
function addMob(type,x,y,elite=false,bossSummon=false){
 const base=MOB_STATS[type]||MOB_STATS.walker;
 const factor=isNordic()?(2.15+(localNordicWave()-1)*.16):(1+(stage-1)*.19);let hp=base.hp*factor*(isPecador()?1.5:1)*(elite?1.72:1)*(bossSummon?.66:1)*waveBalance.mobHp;
 if(nordicBossPecador())hp=Math.round(base.hp*(1.55+(localNordicWave()-1)*.045)*1.20*(elite?1.30:1)*(bossSummon?.55:1)*(1+.40*(waveBalance.players-1)));
 const e={id:nextEnemyId++,type,x,y,hp,maxHp:hp,elite,bossSummon,
  speed:base.speed*(1+(isNordic()?.09*localNordicWave():Math.min(stage,24)*.019))*(isPecador()?1.16:1)*(elite?1.12:1),radius:base.radius+(elite?1:0),attack:rand(.85,2.15),hurt:0,step:rand(0,6),face:'down',windup:0,chargeTime:0,chargeDir:{x:0,y:1},hitCharge:false,phase:rand(0,6)};
 if(elite&&!bossSummon){e.elite62=['regen','swift','guard','burst'][Math.floor(Math.random()*4)];if(e.elite62==='swift')e.speed*=1.25;if(e.elite62==='guard'){e.hp*=1.35;e.maxHp=e.hp;}}enemies.push(e);return e;
}
function addStageBoss(bossType,pos,bossStage,scale=1){
  const hp=(bossType==='nameless'?7200:bossType==='odin'?6200:bossType==='frostjarl'?(bossStage===30?9500:8200):bossType==='pecado'?(bossStage===40?17500:11200):bossType==='tsukuomi'?5100:bossType==='reuni'?3600:1500+bossStage*120)*(isPecador()?1.65:1)*nordicBossHpMultiplier()*(coop.active&&coop.host?waveBalance.bossHp:1);
  const e={id:nextEnemyId++,type:bossType,x:pos.x,y:pos.y,hp:hp*scale,maxHp:hp*scale,
   speed:(bossType==='nameless'?93:bossType==='odin'?82:bossType==='frostjarl'?65:bossType==='pecado'?86:bossType==='tsukuomi'?77:bossType==='reuni'?100:38+bossStage*.8)*(isPecador()?1.14:1)*(nordicBossPecador()?1.13:1)*waveBalance.bossSpeed,
   radius:bossType==='nameless'?28:bossType==='odin'?23:bossType==='frostjarl'?32:bossType==='pecado'?25:bossType==='tsukuomi'?19:bossType==='reuni'?20:23,attack:bossType==='nameless'?1.3:bossType==='odin'?1.4:bossType==='frostjarl'?1.2:bossType==='pecado'?1.05:bossType==='tsukuomi'?1.12:bossType==='reuni'?1.0:1.35,
   hurt:0,step:0,phase:0,walking:false,attackPose:0,face:'down',mode:'walk',specialIndex:0,rage:false,guardTime:0,
   chargeTime:0,chargeDir:{x:0,y:1},counterCd:0,summonTimer:bossType==='pecado'?4.8:bossType==='tsukuomi'?5.5:4.1,windup:0,corruptionPhase:0};
  enemies.push(e);
 return e;
}
function spawnRush(){
 const roster=rushRoster(stage),scale=rushScale(stage);
 const spacing=roster.length===3?150:110;
 for(let i=0;i<roster.length;i++){
  const type=roster[i],pos={x:clamp(player.x+(i-(roster.length-1)/2)*spacing*(roster.length===2?2:1),190,WORLD_W-190),y:clamp(player.y-120-(roster.length===3&&i===1?35:0),265,WORLD_H-190)};
  let e;
  if(type==='ancestralDragon'){spawnAncestralDragon({});e=enemies.at(-1);Object.assign(e,pos,{hp:e.hp*scale,maxHp:e.maxHp*scale});}
  else{e=addStageBoss(type,pos,({boss:5,reuni:10,tsukuomi:15,frostjarl:25,odin:30,nameless:35,pecado:20})[type],scale);if(type==='nameless'&&roster.length>1)e.dragonSpawned=true;}
 }
 bossMessage='BOSS RUSH · '+rushTier(stage)+' · '+roster.map(t=>RUSH_NAMES[t]).join(' + ');bossMessageTimer=2.5;YG_AUDIO.play('bossWarning',1.1);
}
// V6.0 — additional systems, authoritative in solo/host combat.
let intermission601=null, shopView601='', shopTalkLocal601=false, shopUiSignature601='', shopPos601={x:50,y:82};
let worldEvent60=null, eventChecked60=0, waveMod60='', nextHazard60=0, cleared60=0, rankLast60='', rewardSignature60='';
const curse60=[
{id:'curse_blood',name:'Pacto Carmesim',desc:'+35% dano; recebe +25% dano.',icon:'☠',rarity:'cursed'},
{id:'curse_glass',name:'Alma de Vidro',desc:'+20% crítico nos golpes; recebe +20% dano.',icon:'◇',rarity:'cursed'},
{id:'curse_hunt',name:'Caçador Faminto',desc:'+18% velocidade; -15% dano.',icon:'☽',rarity:'cursed'}
];
const relic60={boss:['Máscara do Shogun','+8% dano contra chefes'],reuni:['Coração Rubro','cura 3% da vida a cada 10 abates'],tsukuomi:['Lua Partida','+8% carga do supremo'],frostjarl:['Gema Glacial','-6% dano recebido'],odin:['Fragmento de Gungnir','+8% dano'],nameless:['Selo do Cavaleiro','-6% recarga Q/E'],ancestralDragon:['Escama Ancestral','+6% velocidade'],pecado:['Raiz do Pecado','+10% dano; +5% dano recebido']};
const items60={blade:['Pedra de amolar','+5% dano',90],boots:['Botas do viajante','+5% velocidade',75],ward:['Amuleto de proteção','-5% dano recebido',90],tonic:['Elixir vital','cura 35% da vida',60]};
const trials60={loid:['Juramento das Sombras','q',15],kris:['Lâmina do Abismo','attack',90],cross:['Passo Corrompido','dash',25],eve:['Relógio do Vazio','q',12],kali:['Espelho Eterno','e',14],mollitiam:['Guardião da Raiz','kills',50],moretti:['Autor do Destino','q',12],l0id:['Noite Absoluta','dash',30],josue:['Guerreiro do Tempo','attack',75],mimic:['Devorador Divino','boss',4]};
const awakenInfo60={loid:['#9a75ff','Aura sombria Q: +25% duração'],kris:['#718fff','Transformação: +20% dano'],cross:['#b47dff','Blink: recarga -15%'],eve:['#78d8ff','Q e E: recarga -15%'],kali:['#b6e4ff','Projéteis e estilhaços: +15% dano'],mollitiam:['#f3ca81','Resistência: -10% dano recebido'],moretti:['#d5a1ff','Poderes Q/E: recarga -15%'],l0id:['#b395d4','+12% velocidade'],josue:['#ff9b71','+15% velocidade de ataque'],mimic:['#ff596b','+10% dano contra chefes']};
const awake60=(p,id)=>p?.awaken60&&hero60(p)===id;
const has60=(p,id)=>(p?.curses60||[]).includes(id), rel60=(p,id)=>(p?.equipped60||[]).includes(id), item60=(p,id)=>(p?.items60||[]).includes(id);
function actors60(){return [...new Set(coop.active&&coop.host?[coop.hostAvatar||player,...coop.allies.values()]:[player])].filter(Boolean);}
trials60.abloy=['Coroa Celestial','q',15];awakenInfo60.abloy=['#e3e9ff','Almas: +dano de despertar e feixe mais longo'];
function hero60(p){return p.mimicOrigin?'mimic':p.type;}
function dmg60(p){return (has60(p,'curse_blood')?1.35:1)*(has60(p,'curse_hunt')?.85:1)*(rel60(p,'odin')?1.08:1)*(rel60(p,'pecado')?1.10:1)*(item60(p,'blade')?1.05:1)*(p.awaken60?1.10:1)*(awake60(p,'kris')&&p.transformTime>0?1.20:1)*(awake60(p,'kali')?1.15:1);}
function hurt60(p){return (has60(p,'curse_blood')?1.25:1)*(has60(p,'curse_glass')?1.20:1)*(rel60(p,'frostjarl')?.94:1)*(rel60(p,'pecado')?1.05:1)*(item60(p,'ward')?.95:1)*(awake60(p,'mollitiam')?.90:1);}
function speed60(p){return (has60(p,'curse_hunt')?1.18:1)*(rel60(p,'ancestralDragon')?1.06:1)*(item60(p,'boots')?1.05:1)*(awake60(p,'l0id')?1.12:1);}
function refreshSpeed60(p){const n=speed60(p);p.speed=p.speed/(p.speedFactor60||1)*n;p.speedFactor60=n;}
function awardCurse60(p,c){if(!curse60.some(v=>v.id===c.id)||has60(p,c.id)||(p.curses60||[]).length>=2)return false;p.curses60=[...(p.curses60||[]),c.id];refreshSpeed60(p);return true;}
function localWave60(){return isNordic()?localNordicWave():stage;}
function merchant60(){return phase==='reward'&&intermission601?.view==='shop';}
function shopActor601(p){return p===player?(coop.id||'solo'):[...coop.allies].find(([,a])=>a===p)?.[0];}
function shopAllowed601(p){const id=shopActor601(p);return merchant60()&&intermission601.talked.includes(id)&&!intermission601.ready.includes(id);}
function shop60(p,id){const item=items60[id];if(!shopAllowed601(p)||!item||p.shopStage60===stage||(p.coins60||0)<item[2]||(id!=='tonic'&&item60(p,id))||p.hp<=0)return false;p.coins60-=item[2];p.shopStage60=stage;if(id==='tonic')supportHeal(p,.35);else{p.items60=[...(p.items60||[]),id];refreshSpeed60(p);}return true;}
function equip60(p,id){if(phase!=='reward'||intermission601||!(p.relics60||[]).includes(id))return false;const equipped=p.equipped60||[];if(equipped.includes(id))p.equipped60=equipped.filter(x=>x!==id);else if(equipped.length<3)p.equipped60=[...equipped,id];else return false;refreshSpeed60(p);return true;}
function bossDrop60(e){if(!relic60[e.type]||e.drop60||e.hp>0)return;e.drop60=true;for(const p of actors60()){p.bossCount60=(p.bossCount60||0)+1;if(!testBossMode&&Math.random()<.12&&!(p.relics60||[]).includes(e.type)){p.relics60=[...(p.relics60||[]),e.type];if((p.equipped60||[]).length<3)p.equipped60=[...(p.equipped60||[]),e.type];refreshSpeed60(p);textPop(p.x,p.y-48,'RELÍQUIA DIVINA!','#ffda80');}}}
function advanceTrial60(p,key){if(!p||p.hp<=0||testBossMode)return;p.actions60=p.actions60||{};p.actions60[key]=(p.actions60[key]||0)+1;}
function checkTrial60(p){const t=trials60[hero60(p)];if(!t||p.awaken60||testBossMode)return;const v=t[1]==='boss'?p.bossCount60||0:t[1]==='kills'?p.kills||0:p.actions60?.[t[1]]||0;if(v>=t[2]&&(p.events60||0)>=2&&(p.bossCount60||0)>=3){p.awaken60=true;refreshSpeed60(p);ring(p.x,p.y,80,'#ffe7a0');textPop(p.x,p.y-55,'DESPERTAR · '+t[0],'#ffe7a0');}}
function setupWave60(){intermission601=null;syncIntermission601();worldEvent60=null;eventChecked60=0;const n=localWave60();waveMod60=!testBossMode&&n>=3?(n%7===3?'meteor':n%7===5?'ice':n%7===0?'curse':''):'';nextHazard60=elapsed+3;}
function eventWalls60(){const cx=WORLD_W/2,cy=WORLD_H/2;return [{x:cx-112,y:cy-185,w:224,h:23},{x:cx-270,y:cy-38,w:96,h:26},{x:cx+174,y:cy-38,w:96,h:26},{x:cx-92,y:cy+45,w:23,h:95},{x:cx+69,y:cy+45,w:23,h:95},{x:cx-235,y:cy+135,w:63,h:24},{x:cx+172,y:cy+135,w:63,h:24}];}
function eventCollision60(o,r){if(!worldEvent60)return;for(const a of eventWalls60()){const l=a.x-r,b=a.x+a.w+r,t=a.y-r,d=a.y+a.h+r;if(o.x<=l||o.x>=b||o.y<=t||o.y>=d)continue;const ds=[o.x-l,b-o.x,o.y-t,d-o.y],i=ds.indexOf(Math.min(...ds));if(i===0)o.x=l;else if(i===1)o.x=b;else if(i===2)o.y=t;else o.y=d;}}
function eventPoints60(){return [{x:WORLD_W/2-170,y:WORLD_H/2-100},{x:WORLD_W/2+170,y:WORLD_H/2-100},{x:WORLD_W/2,y:WORLD_H/2+140}];}
function beginEvent60(force=false){const n=localWave60();if(testBossMode||isCampaignFinalWave()||(!force&&eventChecked60===stage)||n<4)return false;eventChecked60=stage;if(!force&&n%6!==0&&Math.random()>=.16)return false;const kind=['seals','hunt','meteor'][Math.floor(Math.random()*3)];worldEvent60={kind,points:eventPoints60().map(p=>({...p,lit:false})),until:elapsed+18};waveMod60=kind==='meteor'?'meteor':kind==='hunt'?'curse':'ice';nextHazard60=elapsed+2;projectiles=[];hazards=[];healthDrops=[];shadowClones=[];player.x=WORLD_W/2;player.y=WORLD_H/2+220;for(const [i,p] of actors60().entries()){p.x=player.x+(i?i*24:0);p.y=player.y;p.invuln=Math.max(p.invuln,2);}for(let i=0;i<(kind==='hunt'?6:4)+Math.min(4,waveBalance.players-1);i++){const a=TAU*i/(kind==='hunt'?6:4);addMob(isNordic()?'draugr':'yokai',WORLD_W/2+Math.cos(a)*210,WORLD_H/2+Math.sin(a)*160,kind==='hunt');}bossMessage='PORTAL · '+eventLabel60();bossMessageTimer=3;waveClearTimer=-1;return true;}
function eventLabel60(){return worldEvent60?.kind==='seals'?'SANTUÁRIO DOS TRÊS SELOS':worldEvent60?.kind==='hunt'?'CAÇADA DOS GUARDIÕES':'TEMPLO DOS METEOROS';}
function eventReady60(){return !worldEvent60||(worldEvent60.kind==='seals'?worldEvent60.points.every(p=>p.lit):worldEvent60.kind==='meteor'?elapsed>=worldEvent60.until:true);}
function finishEvent60(){if(!worldEvent60)return;for(const p of actors60()){p.coins60=(p.coins60||0)+90;p.events60=(p.events60||0)+1;if(p.hp>0)supportHeal(p,.12);checkTrial60(p);}worldEvent60=null;waveMod60='';hazards=[];}
function tickWorld60(){if(phase!=='play'||!player||testBossMode)return;const alive=actors60().filter(p=>p.hp>0);if(worldEvent60?.kind==='seals')for(const s of worldEvent60.points){if(!s.lit&&alive.some(p=>dist(p,s)<23)){s.lit=true;ring(s.x,s.y,45,'#f3d78b');YG_AUDIO.play('choose');}}
if(!waveMod60||elapsed<nextHazard60||(!enemies.some(e=>e.hp>0)&&eventReady60()))return;nextHazard60=elapsed+(worldEvent60?.kind==='meteor'?2.1:4.8);for(const p of alive){const a=Math.random()*TAU;for(let i=0;i<(waveMod60==='meteor'?2:1);i++){const x=clamp(p.x+(i?Math.cos(a)*65:0),110,WORLD_W-110),y=clamp(p.y+(i?Math.sin(a)*65:0),165,WORLD_H-110);hazards.push({type:waveMod60==='meteor'?'meteor':waveMod60==='ice'?'ice':'sin',x,y,r:waveMod60==='meteor'?31:26,delay:1.2+i*.23,active:.35,done:false});}}}
function drawEvent60(){ctx.fillStyle='#151722';ctx.fillRect(0,0,WORLD_W,WORLD_H);const x0=Math.floor(camera.x/32)*32,y0=Math.floor(camera.y/32)*32;for(let y=y0;y<camera.y+H+32;y+=32)for(let x=x0;x<camera.x+W+32;x+=32){drawR(x,y,31,31,(x/32+y/32)%2===0?'#272b39':'#222635');if((x/32*7+y/32*3)%13===0){drawR(x+4,y+12,18,2,'#3a4050');drawR(x+12,y+14,2,9,'#3a4050');}}const cx=WORLD_W/2,cy=WORLD_H/2;ctx.strokeStyle='#6b557c';ctx.lineWidth=7;ctx.strokeRect(cx-280,cy-240,560,480);ctx.strokeStyle='#bc985f';ctx.lineWidth=2;ctx.strokeRect(cx-270,cy-230,540,460);for(let i=0;i<8;i++){const a=i*TAU/8,x=cx+Math.cos(a)*240,y=cy+Math.sin(a)*200;drawR(x-12,y-12,24,24,'#10121b');drawR(x-9,y-17,18,25,'#565469');drawR(x-5,y-22,10,7,'#caa16c');}for(const a of eventWalls60()){drawR(a.x+4,a.y+6,a.w,a.h,'#0d1018');drawR(a.x,a.y,a.w,a.h,'#3e354c');drawR(a.x,a.y,a.w,5,'#82718d');for(let i=10;i<a.w;i+=22)drawR(a.x+i,a.y+8,1,a.h-8,'#292439');}ctx.strokeStyle='#79618f';ctx.beginPath();ctx.arc(cx,cy,100,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,114,0,TAU);ctx.stroke();for(const s of worldEvent60.points){ctx.fillStyle=s.lit?'#e4c47b':'#473858';ctx.beginPath();ctx.arc(s.x,s.y,16,0,TAU);ctx.fill();ctx.strokeStyle='#ac85bc';ctx.stroke();}ctx.fillStyle='#a58bb8';ctx.font='bold 13px serif';ctx.textAlign='center';ctx.fillText(eventLabel60(),cx,cy-155);}
function completeWave60(){cleared60=Math.max(cleared60,localWave60());for(const p of actors60()){p.coins60=(p.coins60||0)+25;checkTrial60(p);}record62();submitRank60();}
function rankMode60(){return defense62?'defense':rushMode?'rush':isNordic()?'nordic':'japan';}
function submitRank60(){if(testBossMode||!cleared60||!player||typeof fetch!=='function')return;let name='';try{name=localStorage.getItem('ygg.rank.name')||'';}catch{}if(!name)return;const mode=rankMode60(),kind=coop.active?'coop':'solo',hero=hero60(player),key=[name,mode,kind,difficulty,hero,cleared60].join('|');if(key===rankLast60)return;rankLast60=key;fetch('/ranking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mode,kind,difficulty,hero,wave:cleared60})}).then(r=>{if(!r.ok)rankLast60='';}).catch(()=>{rankLast60='';});}
function rewardTools60(){if(intermission601)return;const panel=$('worldReward60');if(!panel||!player)return;panel.hidden=false;const p=player;const sig=JSON.stringify([stage,p.coins60,p.shopStage60,p.items60,p.relics60,p.equipped60,p.awaken60,p.actions60,p.events60,p.bossCount60,p.kills,p.hp<=0,coop.chosen]);if(sig===rewardSignature60)return;rewardSignature60=sig;const section=$('merchant60');section.hidden=true;$('coins60').textContent=(p.coins60||0)+' fragmentos';for(const id of Object.keys(items60)){const b=$('buy60_'+id);b.disabled=coop.chosen||p.hp<=0||p.shopStage60===stage||(p.coins60||0)<items60[id][2]||(id!=='tonic'&&item60(p,id));}const list=$('relicList60');list.innerHTML='';for(const id of p.relics60||[]){if(!relic60[id])continue;const b=document.createElement('button');b.textContent=(rel60(p,id)?'◆ ':'◇ ')+relic60[id][0]+' · '+relic60[id][1];b.disabled=coop.chosen||(!rel60(p,id)&&(p.equipped60||[]).length>=3);b.onclick=()=>rewardAction60('relic',id);list.appendChild(b);}if(!(p.relics60||[]).length)list.textContent='Nenhuma relíquia descoberta.';const t=trials60[hero60(p)];const v=t[1]==='boss'?p.bossCount60||0:t[1]==='kills'?p.kills||0:p.actions60?.[t[1]]||0;$('trial60').textContent=p.awaken60?'DESPERTAR ATIVO · '+t[0]+' · +10% dano · '+awakenInfo60[hero60(p)][1]:`Despertar · ${t[0]} · ${Math.min(v,t[2])}/${t[2]} ${{q:'Q',e:'E',attack:'ataques',dash:'esquivas',kills:'abates',boss:'chefes'}[t[1]]} · eventos ${Math.min(2,p.events60||0)}/2 · chefes ${Math.min(3,p.bossCount60||0)}/3`;}
function rewardAction60(action,id){if(phase!=='reward'||coop.chosen||coop.reconnecting||intermission601)return;if(coop.active&&!coop.host){coopAction(action,id);return;}if((action==='shop'?shop60(player,id):equip60(player,id))){rewardTools60();if(coop.active){coop.checkpointDirty=true;coopSendState(true);}}}
function hud60(){if(!player)return;const e=$('worldMod60');if(!e)return;const label=worldEvent60?eventLabel60()+(worldEvent60.kind==='seals'?' · '+worldEvent60.points.filter(p=>p.lit).length+'/3':worldEvent60.kind==='meteor'?' · '+Math.max(0,Math.ceil(worldEvent60.until-elapsed))+'s':''):({meteor:'☄ METEOROS',ice:'❄ GEADA',curse:'◈ MALDIÇÃO'}[waveMod60]||'');e.textContent=[secretHud61(),portalHud602(),label,player.awaken60?'✦ DESPERTO':'',player.equipped60?.length?'◆ '+player.equipped60.length+'/3':''].filter(Boolean).join(' · ');e.hidden=!e.textContent;}
async function loadRank60(){const panel=$('rankPanel60'),result=$('rankResult60');panel.hidden=false;result.textContent='Carregando…';try{const q=new URLSearchParams({mode:$('rankMode60').value,kind:$('rankKind60').value,difficulty:$('rankDiff60').value});const r=await fetch('/ranking?'+q,{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();result.innerHTML='';for(const [i,v] of data.entries.entries()){const row=document.createElement('div');row.textContent=`${i+1}. ${v.name} · ${MIMIC_NAMES[v.hero]||v.hero} · onda ${v.wave}`;result.appendChild(row);}if(!data.entries.length)result.textContent='Sem recordes nesta categoria.';}catch{result.textContent='Ranking indisponível. Verifique a conexão/deploy.';}}
function wire60(){const b=$('rankOpen60');if(!b)return;b.addEventListener('click',()=>{try{$('rankName60').value=localStorage.getItem('ygg.rank.name')||'';}catch{}loadRank60();});$('rankClose60').addEventListener('click',()=>{$('rankPanel60').hidden=true;});$('rankSave60').addEventListener('click',()=>{const n=$('rankName60').value.trim().slice(0,24);if(n&&!/^[\p{L}\p{N} _.-]+$/u.test(n)){$('rankStatus60').textContent='Nome inválido. Use letras, números, espaço, ponto, hífen ou sublinhado.';return;}try{localStorage.setItem('ygg.rank.name',n);}catch{}$('rankStatus60').textContent=n?'Nome salvo. Recordes das próximas ondas serão enviados.':'Envio desativado.';});for(const id of ['rankMode60','rankKind60','rankDiff60'])$(id).addEventListener('change',loadRank60);for(const id of Object.keys(items60))$('buy60_'+id).addEventListener('click',()=>rewardAction60('shop',id));wire601();}


// V6.0.1: optional shared portals and a separate, peaceful merchant room.
function publish601(){syncIntermission601();if(coop.active&&coop.host){coop.checkpointDirty=true;coopSendState(true);}}
function portalChance602(n,boss,roll){if(n<4)return null;return roll<(boss?.08:.03)?'shop':roll<(boss?.20:.08)?'event':null;}
function offer601(){if(defense62)return false;const n=localWave60();if(testBossMode||isCampaignFinalWave()||eventChecked60===stage||enemies.some(e=>e.hp>0))return false;eventChecked60=stage;const kind=portalChance602(n,rushMode||n%5===0,Math.random());if(!kind)return false;const origin=actors60().find(p=>p.hp>0)||player;const angle=Math.random()*TAU;let x=clamp(origin.x+Math.cos(angle)*170,145,WORLD_W-145),y=clamp(origin.y+Math.sin(angle)*170,200,WORLD_H-145);if(Math.hypot(x-origin.x,y-origin.y)<90){x=clamp(origin.x+(origin.x<WORLD_W/2?170:-170),145,WORLD_W-145);y=clamp(origin.y,200,WORLD_H-145);}completeWave60();waveMod60='';hazards=[];projectiles=[];intermission601={stage,view:'portals',shop:kind==='shop',event:kind==='event',portal602:{x,y,kind,until:elapsed+25},talked:[],ready:[]};phase='play';coop.chosen=false;YG_AUDIO.play('choose',.75);publish601();return true;}
function tickPortal602(){const p=intermission601?.portal602;if(!p||intermission601.view!=='portals'||phase!=='play')return false;if(coop.active&&!coop.host)return true;if(elapsed>=p.until){finishIntermission601();return true;}if(actors60().some(a=>a.hp>0&&dist(a,p)<25))portalChoice601(p.kind);return true;}
function drawPortal602(){const p=intermission601?.portal602;if(!p||intermission601.view!=='portals'||phase!=='play')return;const color=p.kind==='shop'?'#61cfff':'#c68afa';ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#0c1025';ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-14,19,29,0,0,TAU);ctx.fill();ctx.stroke();for(let i=0;i<3;i++){ctx.globalAlpha=.45;ctx.beginPath();ctx.ellipse(0,-14,12+i*4,20+i*4,elapsed*.6+i,0,TAU);ctx.stroke();}ctx.globalAlpha=1;for(let i=0;i<8;i++){const a=elapsed*1.6+i*TAU/8;ctx.fillStyle=color;ctx.fillRect(Math.cos(a)*25-1,Math.sin(a)*33-15,2,2);}ctx.fillStyle=color;ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.strokeStyle='#0b0a14';ctx.lineWidth=3;const text=p.kind==='shop'?'MERCADOR':'EVENTO SECRETO';ctx.strokeText(text,0,-51);ctx.fillText(text,0,-51);ctx.restore();}
function portalHud602(){const p=intermission601?.portal602;if(!p||intermission601.view!=='portals'||phase!=='play')return '';const a=Math.atan2(p.y-player.y,p.x-player.x),dir=['→','↘','↓','↙','←','↖','↑','↗'][(Math.round(a/(Math.PI/4))+8)%8];return `${dir} ${p.kind==='shop'?'PORTAL AZUL':'PORTAL ROXO'} · ${Math.max(0,Math.ceil(p.until-elapsed))}s`;}
function continueIntermission601(){if(!intermission601)return;finishIntermission601();}
function finishIntermission601(){intermission601=null;phase='reward';syncIntermission601();showRewards();publish601();}
function portalChoice601(choice){if(!intermission601||intermission601.view!=='portals'||(coop.active&&!coop.host)||coop.reconnecting)return false;if(choice==='skip'){finishIntermission601();return true;}if(choice==='shop'&&intermission601.shop){phase='reward';intermission601.shop=false;intermission601.portal602=null;intermission601.view='shop';intermission601.talked=[];intermission601.ready=[];publish601();return true;}if(choice==='event'&&intermission601.event){intermission601.event=false;intermission601.portal602=null;intermission601.view='event';phase='play';syncIntermission601();if(!beginEvent60(true)){continueIntermission601();return false;}publish601();return true;}return false;}
function shopRemote601(id,action){if(!merchant60()||intermission601.ready.includes(id))return false;if(action==='shopTalk'){if(!intermission601.talked.includes(id))intermission601.talked.push(id);}else if(action==='shopExit'){intermission601.ready.push(id);}else return false;checkShopExit601();publish601();return true;}
function checkShopExit601(){if(!merchant60()||(coop.active&&!coop.host))return;const ids=coop.active?coop.members.filter(m=>m.id===coop.id||coop.allies.has(m.id)).map(m=>m.id):['solo'];if(ids.length&&ids.every(id=>intermission601.ready.includes(id)))continueIntermission601();}
function shopSend601(action,value){if(!merchant60()||coop.reconnecting)return;if(coop.active&&!coop.host){coopAction(action,value);return;}if(action==='shop'){if(shop60(player,value)){YG_AUDIO.play('choose');publish601();}}else shopRemote601(coop.id||'solo',action);}
function syncIntermission601(){const panel=$('intermission601');if(!panel)return;const view=phase==='reward'&&intermission601?intermission601.view:'';const show=view==='shop';panel.hidden=!show;if(show){$('rewardScreen').classList.add('hidden');$('waitingCards').classList.add('hidden');}if(view!==shopView601){shopView601=view;shopTalkLocal601=false;shopUiSignature601='';shopPos601={x:50,y:82};keys.clear();mobileMove={x:0,y:0};pointerDown=false;attackMobile=false;YG_AUDIO.syncMusic();}if(!show)return;$('portalPanel601').hidden=view!=='portals';$('shopPanel601').hidden=view!=='shop';const can=!coop.active||coop.host;if(view==='portals'){$('portalShop601').hidden=!intermission601.shop;$('portalEvent601').hidden=!intermission601.event;for(const id of ['portalShop601','portalEvent601','portalSkip601'])$(id).disabled=!can;$('portalInfo601').textContent=can?'Escolha um portal ou siga para as cartas.':'O anfitrião escolhe o portal para a equipe.';}else {refreshShop601();paintShopHero601();$('shopPlayer601').style.left=shopPos601.x+'%';$('shopPlayer601').style.top=shopPos601.y+'%';}}
function refreshShop601(){if(!merchant60()||!player)return;const id=coop.id||'solo',ready=intermission601.ready.includes(id);const talked=intermission601.talked.includes(id);const sig=JSON.stringify([player.coins60,player.shopStage60,player.items60,player.hp,ready,talked,shopTalkLocal601,intermission601.ready.length]);if(sig===shopUiSignature601)return;shopUiSignature601=sig;$('shopCoins601').textContent=(player.coins60||0)+' fragmentos';$('shopDialog601').hidden=!shopTalkLocal601||ready;$('shopWait601').hidden=!ready;$('shopInteract601').disabled=ready;$('shopExit601').disabled=ready;$('shopClose601').disabled=ready;for(const id of Object.keys(items60)){$('shop601_'+id).disabled=!talked||ready||player.hp<=0||player.shopStage60===stage||(player.coins60||0)<items60[id][2]||(id!=='tonic'&&item60(player,id));}$('shopStatus601').textContent=player.shopStage60===stage?'Compra concluída. Volte ao portal quando quiser.':'Uma compra por visita. Seus itens duram até o fim da partida.';}
function paintShopHero601(){const cv=$('shopHero601'),type=player?.type||'loid',im=HERO[type];if(!cv||!im?.complete||!im.naturalWidth)return;const c=cv.getContext('2d');if(!c)return;const size=type==='mollitiam'?320:['moretti','l0id'].includes(type)?192:112;const col=['mollitiam','moretti','l0id','mimic'].includes(type)?0:1;c.clearRect(0,0,64,64);c.imageSmoothingEnabled=false;c.drawImage(im,col*size,0,size,size,0,0,64,64);}
function shopNear601(){return Math.hypot(shopPos601.x-57,(shopPos601.y-55)*.8)<15;}
function shopInteract601(){if(!merchant60()||intermission601.ready.includes(coop.id||'solo'))return;if(!shopNear601()){$('shopHint601').textContent='Aproxime-se do mercador: toque nele ou use WASD.';return;}shopTalkLocal601=true;shopSend601('shopTalk');shopUiSignature601='';refreshShop601();}
function shopExitLocal601(){if(!merchant60())return;shopTalkLocal601=false;shopSend601('shopExit');}
function tickShopUI601(dt){if(!merchant60())return;if(shopTalkLocal601||intermission601.ready.includes(coop.id||'solo'))return;const v=getMove();shopPos601.x=clamp(shopPos601.x+v.x*36*dt,9,91);shopPos601.y=clamp(shopPos601.y+v.y*48*dt,53,88);paintShopHero601();const token=$('shopPlayer601');token.style.left=shopPos601.x+'%';token.style.top=shopPos601.y+'%';$('shopHint601').textContent=shopNear601()?'E · conversar com o Mercador':'Toque no caminho ou use WASD para andar.';}
function wire601(){for(const [id,value] of [['portalShop601','shop'],['portalEvent601','event'],['portalSkip601','skip']])$(id).addEventListener('click',()=>portalChoice601(value));$('shopScene601').addEventListener('pointerdown',e=>{if(!merchant60()||shopTalkLocal601||intermission601.ready.includes(coop.id||'solo'))return;const b=$('shopScene601').getBoundingClientRect();shopPos601={x:clamp((e.clientX-b.left)/b.width*100,9,91),y:clamp((e.clientY-b.top)/b.height*100,53,88)};tickShopUI601(0);});$('shopNpc601').addEventListener('click',()=>{shopPos601={x:57,y:57};tickShopUI601(0);shopInteract601();});$('shopInteract601').addEventListener('click',()=>{if(!shopNear601()){shopPos601={x:57,y:57};tickShopUI601(0);}shopInteract601();});$('shopExit601').addEventListener('click',shopExitLocal601);$('shopClose601').addEventListener('click',()=>{shopTalkLocal601=false;shopUiSignature601='';refreshShop601();});for(const id of Object.keys(items60))$('shop601_'+id).addEventListener('click',()=>shopSend601('shop',id));}
// V6.1 — Abloy: three spirits, ranged sorcery, and secret encounters.
function rollAbloySpirits61(p,random=Math.random){
 const bonus=Math.max(0,p.abSpiritChanceBonus||0), picks=[];
 for(const [name,rate] of [['gold',.30],['violet',.35],['blue',.25]])if(random()<Math.min(.85,rate+bonus))picks.push(name);
 if(!picks.length&&p.abSpiritGuarantee)picks.push(['gold','violet','blue'][Math.min(2,Math.floor(random()*3))]);
 if(p.abSpiritExtra&&picks.length<3&&random()<.65){const remain=['gold','violet','blue'].filter(k=>!picks.includes(k));picks.push(remain[Math.min(remain.length-1,Math.floor(random()*remain.length))]);}
 p.abActiveSpirits=picks;p.abOrbAt=0;p.abHealAt=0;p.abGuardAt=0;return picks;
}
function abloyShot(p,angle,damage,blast=0,charge=true){
 if(projectiles.length>=155)return;
 const v={x:Math.cos(angle),y:Math.sin(angle)};projectiles.push({x:p.x+v.x*12,y:p.y+v.y*12-8,vx:v.x*320,vy:v.y*320,life:Math.min(1.6,p.reach/320+.18),r:5,damage,from:'player',color:'#e0dfff',ownerId:coop.active?actorKey(p):null,abShot:true,abBlast:blast,abCharge:charge});
}
function abloyCast(p,kind){
 if(p.hp<=0)return false;const a=p.aim||0,amp=p.abBurstAmp||1;const base=p.damage;
 p.abCosmicUntil=Math.max(p.abCosmicUntil||0,elapsed+(kind==='attack'?.32:.9));const color=p.mimicOrigin?'#ff6985':'#ecedff';
 if(kind==='attack'){abloyShot(p,a,base,16);if(p.abCrown)abloyShot(p,a+.14,base*.35,0,false);YG_AUDIO.play('mirrorCast',.65);return true;}
 if(kind==='Q'){p.skillCd=p.skillDelay;for(const d of [-.18,0,.18])abloyShot(p,a+d,base*1.35*amp,30,true);ring(p.x,p.y,25,color);YG_AUDIO.play('mirrorCast',1);}
 else if(kind==='E'){p.secondaryCd=p.secondaryDelay;const x=clamp(p.x+Math.cos(a)*Math.min(p.reach,165),100,WORLD_W-100),y=clamp(p.y+Math.sin(a)*Math.min(p.reach,165),158,WORLD_H-105);ring(x,y,86,color);makeParticles(x,y,color,30,1.5);for(const e of enemies)if(e.hp>0&&Math.hypot(e.x-x,e.y-y)<86+e.radius){hitEnemy(e,base*2.6*amp,true);if(!isBossEnemy(e)){e.x+=(x-e.x)*.35;e.y+=(y-e.y)*.35;e.stunTime=Math.max(e.stunTime||0,.7);}else e.slow=Math.max(e.slow||0,1);}YG_AUDIO.play('bossEclipse',.85);}
 else if(kind==='R'){p.ultimateCharge=0;const duration=(p.abBeamDuration||2.4)+(awake60(p,'abloy')?.4:0);p.abBeam={until:elapsed+duration,next:elapsed,angle:a,stage};p.abCosmicUntil=elapsed+duration;p.ultimateBuff='abloy';p.ultimateBuffTime=duration;YG_AUDIO.play('ultimate',1.1);}
 else return false;updateHud();return true;
}
function tickAbloy(p,dt){
 const prior=player;player=p;try{
 if(p.abBeam){const b=p.abBeam;if(b.until<=elapsed||b.stage!==stage)p.abBeam=null;else if(elapsed>=b.next){b.next=elapsed+.20;const dx=Math.cos(b.angle),dy=Math.sin(b.angle);for(const e of enemies){if(e.hp<=0)continue;const ex=e.x-p.x,ey=e.y-p.y,along=ex*dx+ey*dy,side=Math.abs(-ex*dy+ey*dx);if(along>=-e.radius&&along<420+e.radius&&side<24+e.radius)hitEnemy(e,p.damage*.85,false);}}}
 const active=p.abActiveSpirits||[];
 const target=enemies.filter(e=>e.hp>0&&dist(e,p)<Math.min(275,p.reach+35)).sort((a,b)=>dist(a,p)-dist(b,p))[0];
 if(active.includes('violet')&&target&&elapsed>=(p.abOrbAt||0)){p.abOrbAt=elapsed+1.65;p.abCosmicUntil=Math.max(p.abCosmicUntil||0,elapsed+.28);abloyShot(p,Math.atan2(target.y-p.y,target.x-p.x),p.damage*.48*(p.abOrbAmp||1),0,false);if(p.abCrown)abloyShot(p,Math.atan2(target.y-p.y,target.x-p.x)+.08,p.damage*.22*(p.abOrbAmp||1),0,false);}
 if(active.includes('blue')&&p.hp<p.maxHp*.78&&elapsed>=(p.abHealAt||0)){p.abHealAt=elapsed+14;p.hp=Math.min(p.maxHp,p.hp+Math.ceil(p.maxHp*.055*(p.abGuard||1)));p.abCosmicUntil=Math.max(p.abCosmicUntil||0,elapsed+.55);ring(p.x,p.y,25,'#a9d8ff');}
 }finally{player=prior;}
}
function drawAbloy61(x,y,face,step,scale,a){
 const cosmic=(a?.abCosmicUntil||0)>elapsed;const im=cosmic?ABLOY_COSMIC:HERO.abloy;const aim=a?.abBeam?.angle??a?.aim;const dir=cosmic&&Number.isFinite(aim)?(Math.abs(Math.cos(aim))>Math.abs(Math.sin(aim))?(Math.cos(aim)<0?'left':'right'):(Math.sin(aim)<0?'up':'down')):face;const row=({down:0,left:1,right:2,up:3})[dir]??0;const col=(a?.moving||a===player&&movingNow)?Math.floor(step)%4:cosmic?3:0;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
 if(im?.complete&&im.naturalWidth)ctx.drawImage(im,col*112,row*112,112,112,-22,-39,44,44);else{ctx.fillStyle='#dbe5ff';ctx.beginPath();ctx.arc(0,-19,12,0,TAU);ctx.fill();}
 const active=a?.abActiveSpirits||[];const order=['gold','violet','blue'];const colors={gold:'#ffd67d',violet:'#c397ff',blue:'#91daff'};const list=order.filter(k=>active.includes(k));
 for(let i=0;i<list.length;i++){const ang=elapsed*1.65+i*TAU/Math.max(1,list.length),ox=Math.cos(ang)*24,oy=-18+Math.sin(ang)*12;ctx.fillStyle=colors[list[i]];ctx.beginPath();ctx.arc(ox,oy,3.2,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=.7;ctx.stroke();}
 ctx.restore();
}
function drawAbloyBeam61(p){const b=p.abBeam;if(!b||b.until<=elapsed||b.stage!==stage||p.hp<=0)return;ctx.save();ctx.translate(p.x,p.y-5);ctx.rotate(b.angle);ctx.strokeStyle='#a8a6ff';ctx.globalAlpha=.35;ctx.lineWidth=49;ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(420,0);ctx.stroke();ctx.globalAlpha=.86;ctx.strokeStyle='#e6e8ff';ctx.lineWidth=25;ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#fff';ctx.lineWidth=7;ctx.stroke();ctx.restore();}
function secretChance61(n,roll){if(n<6)return null;return roll<.035?'divine':roll<.06?'mirror':null;}
function maybeSecret61(force=null){if(testBossMode||rushMode||worldEvent60||enemies.some(e=>e.secretKind))return null;const kind=force||secretChance61(localWave60(),Math.random());if(!kind)return null;
 const pos=spawnAroundPlayer(180,260);let e;if(kind==='divine'){
 const t=isNordic()?'odin':'tsukuomi';e=addStageBoss(t,pos,isNordic()?30:15,1.85+localWave60()*.085);e.secretName=isNordic()?'ODIN · IRA DE ASGARD':'TSUKUYOMI · IRA CELESTIAL';e.secretNext=elapsed+5;e.speed*=1.17;
 }else{const p=actors60().filter(p=>p.hp>0).sort((a,b)=>b.damage*newDamage(b)+b.maxHp*.4-a.damage*newDamage(a)-a.maxHp*.4)[0]||player;e=addStageBoss('soulMirror',pos,localWave60(),1);e.copyHero=p.type;e.copyCards=[...(p.cards||[]),...(p.runes||[])].slice(0,60);e.copyDamage=Math.min(130,Math.max(20,p.damage*newDamage(p)));e.copyArmor=Math.min(.32,p.armor||0);e.copyReach=Math.min(245,p.reach||45);e.copySkillDelay=Math.max(2,Math.min(6,(p.skillDelay||8)*.5));e.hp=e.maxHp=Math.max(2300,p.maxHp*14+e.copyDamage*22)*(isPecador()?1.4:1)*waveBalance.bossHp;e.speed=clamp(p.speed*.85,85,145);e.attack=1.2;e.secretNext=elapsed+5;e.secretName='ESPELHO DA ALMA · '+(MIMIC_NAMES[p.type]||p.type).toUpperCase();}
 e.secretKind=kind;e.secretUntil=elapsed+3;e.radius=Math.max(19,e.radius);bossMessage=kind==='divine'?'UM DEUS ESTÁ IRRITADO!':'SEU REFLEXO DESPERTOU!';bossMessageTimer=3;YG_AUDIO.play('bossWarning',1.15);return e;
}
function secretHud61(){const e=enemies.find(e=>e.secretKind&&e.hp>0);if(!e)return '';return e.secretUntil>elapsed?(e.secretKind==='divine'?'⚠ UM DEUS ESTÁ IRRITADO':'⚠ ESPELHO DA ALMA')+' · '+Math.ceil(e.secretUntil-elapsed)+'s':e.secretName;}
function tickDivine61(e,dt){if(elapsed<(e.secretNext||0))return false;e.secretNext=elapsed+(e.hp<e.maxHp*.5?2.6:3.8);const t=nearestLivingHero(e)||player;for(let i=0;i<5;i++){const ang=i*TAU/5;hazards.push({type:'meteor',x:clamp(t.x+Math.cos(ang)*52,100,WORLD_W-100),y:clamp(t.y+Math.sin(ang)*52,158,WORLD_H-105),r:27,delay:1.15,active:.32,done:false});}hazards.push({type:'sin',x:t.x,y:t.y,r:27,delay:1.15,active:.32,done:false});return false;}
function updateSoulMirror(e,dt,d,dir,spd){
 const ranged=e.copyReach>70,ang=Math.atan2(dir.y,dir.x),target=player;
 if(d>(ranged?105:e.radius+13)){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}else if(ranged&&d<65){e.x-=dir.x*spd*.55*dt;e.y-=dir.y*spd*.55*dt;}
 if(e.attack<=0&&d<(ranged?230:e.radius+27)){e.attack=ranged?.9:.75;e.attackPose=.3;if(ranged)shoot(e,dir,180,Math.min(26,8+e.copyDamage*.13),'#ee82c8');else{hazards.push({type:'void',x:target.x,y:target.y,r:20,delay:.6,active:.32,done:false});slash(e.x,e.y,ang,35,'#ff83ca');}}
 if(elapsed>=(e.secretNext||0)){e.secretNext=elapsed+e.copySkillDelay;const hero=e.copyHero;const n=hero==='cross'?4:hero==='abloy'||hero==='kali'||hero==='eve'?5:hero==='mollitiam'?1:3;
 for(let i=0;i<n;i++){const a=i*TAU/n;hazards.push({type:hero==='cross'||hero==='loid'||hero==='l0id'?'void':hero==='abloy'?'meteor':'blade',x:clamp(target.x+Math.cos(a)*35,100,WORLD_W-100),y:clamp(target.y+Math.sin(a)*35,158,WORLD_H-105),r:hero==='mollitiam'?57:23,delay:.9+i*.11,active:.32,done:false});}if(hero==='cross'||hero==='eve'||hero==='l0id'){ring(e.x,e.y,18,'#f59cff');e.x=clamp(target.x-dir.x*46,115,WORLD_W-115);e.y=clamp(target.y-dir.y*46,175,WORLD_H-120);ring(e.x,e.y,20,'#f59cff');}else if(ranged)for(const a of [-.3,0,.3])shoot(e,{x:Math.cos(ang+a),y:Math.sin(ang+a)},140,Math.min(27,10+e.copyDamage*.1),'#f4a0e0');if(hero==='loid'||hero==='l0id'){for(let i=0;i<2;i++){const a=ang+(i?1:-1)*.85;const m=addMob('ghost',clamp(e.x+Math.cos(a)*35,110,WORLD_W-110),clamp(e.y+Math.sin(a)*35,175,WORLD_H-115),false,true);m.hp=m.maxHp=Math.min(200,m.hp);}}if(hero==='kris'){e.speed=Math.min(160,e.speed*1.03);ring(e.x,e.y,38,'#9c86fc');}}
}
function secretReward61(e){if(e.secretPaid)return;e.secretPaid=true;for(const p of actors60()){p.coins60=(p.coins60||0)+(e.secretKind==='divine'?160:120);p.events60=(p.events60||0)+1;if(e.secretKind==='mirror')p.bossCount60=(p.bossCount60||0)+1;checkTrial60(p);}bossMessage=e.secretKind==='divine'?'IRA DIVINA SUPERADA · +160 FRAGMENTOS':'REFLEXO DESTRUÍDO · +120 FRAGMENTOS';bossMessageTimer=3;}
function drawSecret61(){for(const e of enemies){if(!e.secretKind||e.hp<=0)continue;ctx.save();ctx.strokeStyle=e.secretKind==='divine'?'#ffdd8c':'#e28dfd';ctx.globalAlpha=.65+.3*Math.sin(elapsed*5);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y-4,e.radius+12,11,0,0,TAU);ctx.stroke();ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillStyle=ctx.strokeStyle;ctx.fillText(e.secretUntil>elapsed?'⚠ '+Math.ceil(e.secretUntil-elapsed):e.secretKind==='divine'?'IRA DIVINA':'ESPELHO',e.x,e.y-62);ctx.restore();}}

function spawnStage(){
 setupWave60();
 waveBalance=coopBalance(coop.active&&coop.host?coop.members.length:1);currentCoopEnemy=null;
 enemies=[];projectiles=[];slashes=[];rings=[];particles=[];dashShadows=[];shadowClones=[];hazards=[];frostBursts=[];healthDrops=[];bonusBeam=null;xansBlasters=[],timeFields=[],mirrorIllusions=[],voidCollapse=0;bossMessage='';bossMessageTimer=0;waveClearTimer=-1;dashGhostTimer=0;eclipseTime=0;
 realityFields=[];realityVictory=false;phase='play';damageFloats=[];$('fallenScreen').classList.add('hidden');$('rewardScreen').classList.add('hidden');$('waitingCards').classList.add('hidden');$('gameOverScreen').classList.add('hidden');
 player.x=WORLD_W/2;player.y=WORLD_H/2+120;
 player.crossTp=null;player.crossChain=null;player.abBeam=null;player.abCosmicUntil=0;player.dashTime=0;player.darkAuraTime=0;player.evePrimeTime=0;player.ultimateTime=0;player.ultimateBuffTime=0;player.ultimateBuff='';player.frogTime=0;player.mollitiamHeartTime=0;player.mollitiamPose=0;player.curseTime=0;player.invuln=2;
 player.hp=player.hp<=0?Math.ceil(player.maxHp*.5):Math.min(player.maxHp,player.hp+player.betweenHeal);player.ghost=false;if(isNordic()){player.shield=player.runeShield||0;if((player.runes||[]).includes('n_jera')){player.jeraBonus=Math.min(.10,Math.max(0,(localNordicWave()-1)*.02));}}
 if(coop.active&&coop.host){let teamIndex=0;const allyCount=coop.allies.size;for(const [aid,a] of coop.allies){const angle=(teamIndex+++.5)*Math.PI*2/Math.max(allyCount,1);a.x=player.x+Math.cos(angle)*62;a.y=player.y+Math.sin(angle)*62;a.hp=a.hp<=0?Math.ceil(a.maxHp*.5):Math.min(a.maxHp,a.hp+a.betweenHeal);a.ghost=false;a.crossTp=null;a.crossChain=null;a.abBeam=null;a.abCosmicUntil=0;a.invuln=2;a.skillCd=0;a.dashCd=0;a.darkAuraTime=0;a.ultimateTime=0;a.ultimateBuffTime=0;a.curseTime=0;a.secondaryCharging=false;a.evePrimeTime=0;a.mollitiamHeartTime=0;a.mollitiamPose=0;if(isNordic()){a.shield=a.runeShield||0;a.jeraBonus=(a.runes||[]).includes('n_jera')?Math.min(.10,Math.max(0,(localNordicWave()-1)*.02)):0;}}}
 camera.x=clamp(player.x-W/2,0,WORLD_W-W);camera.y=clamp(player.y-H/2,0,WORLD_H-H);
 waveIntro=2.3;YG_AUDIO.play('waveStart',.8);
 for(const a of actors60())if(a&&a.hp>0&&(a.type==='abloy'||a.mimicOrigin))rollAbloySpirits61(a);
 if(defense62){treeWave62();updateHud();return;}if(rushMode){spawnRush();updateHud();return;}
 const isBoss=stage%5===0;const bossType=stage===40?'pecado':stage===35?'nameless':stage===30?'odin':stage===25?'frostjarl':stage===20?'pecado':stage===15?'tsukuomi':stage===10?'reuni':'boss';
 const baseTotal=testBossMode?0:isNordic()?(isBoss?5:Math.min(isPecador()?19:14,5+localNordicWave()+(isPecador()?3:0))):isBoss?(stage===20?12:stage===15?2:stage===10?4:3):Math.min(isPecador()?23:18,3+Math.floor(stage*1.02)+(isPecador()?3:0));
 const total=Math.round(baseTotal*waveBalance.mobCount);
 for(let i=0;i<total;i++){
  const pos=spawnAroundPlayer(120,270);
  const type=isBoss&&stage===15?(i%2?'beast':'ghost'):randEnemyType();
  const elite=!isBoss&&stage>=7&&Math.random()<Math.min(.33,.06+stage*.014);
  addMob(type,pos.x,pos.y,elite);
 }
 if(!isBoss)maybeSecret61();
 if(isBoss){
  YG_AUDIO.play('bossWarning',1.1);
  let pos=spawnAroundPlayer(120,170);
  if(bossType==='frostjarl'){
   const side=Math.random()<.5?-1:1;
   pos={x:clamp(player.x+side*105,110,WORLD_W-110),y:clamp(player.y+55,180,WORLD_H-110)};
  }
  addStageBoss(bossType,pos,stage);
  bossMessage=stage===40?'PECADO · TRONO DO FIM · NÓRDICO 20':bossType==='nameless'?'O CAVALEIRO CUJO NOME NÃO PODE SER MENCIONADO':bossType==='odin'?'ODIN · O PAI DE TODOS':bossType==='frostjarl'?'JARL DO GELO · O REI DA TEMPESTADE':bossType==='pecado'?'PECADO · O FIM DAS SETE RAÍZES':bossType==='tsukuomi'?'TSUKUOMI · A VOZ DA LUA':bossType==='reuni'?'REUNI · SENHOR DO SANGUE':'DAIMYŌ ONI · SENHOR DOS ONIS';
  bossMessageTimer=3;
 }
 updateHud();
}
function spawnAroundPlayer(minD,maxD){
 let x,y;for(let tries=0;tries<65;tries++){
  let a=rand(0,TAU),d=rand(minD,maxD);
  x=clamp(player.x+Math.cos(a)*d,100,WORLD_W-100);
  y=clamp(player.y+Math.sin(a)*d,160,WORLD_H-105);
  if(Math.hypot(x-player.x,y-player.y)>=minD*.8)break;
 }
 return {x,y};
}
function start(type, bossTest=false, frogTest=false){intermission601=null;syncIntermission601();worldEvent60=null;waveMod60='';cleared60=0;rankLast60='';defense62=bossTest==='defense'||(!bossTest&&selectedCampaign==='defense');tree62=null;progressSeen62=0;if(defense62){bossTest='defense';startTree62();}rushMode=bossTest==='rush'||(!bossTest&&selectedCampaign==='rush');if(rushMode)bossTest='rush';selectedBoss=null;activeCampaign=bossTest==='nordic'||bossTest==='frostjarl'||bossTest==='nameless'||bossTest==='odin'||bossTest==='pecadoNordic'?'nordic':defense62?'defense':bossTest&&bossTest!=='japan'?'japan':selectedCampaign;testBossMode=!!bossTest&&!['nordic','japan','rush','defense'].includes(bossTest);player=createPlayer(type);player.skin62=skin62(player);realityVictory=false;mimicVictory=false;closeMimicMenu();realityFields=[];if(activeCampaign==='nordic'){grantNordicStarter(player,testBossMode);const ids=coop.active?coop.members.find(m=>m.id===coop.id)?.passives:pendingNordicPassives;applyNordicPassives(player,ids);}if(coop.active&&coop.host)coop.hostAvatar=player;if(type==='kris'&&frogTest){player.frogSkill=true;player.cards.push('frog');}stage=bossTest==='pecadoNordic'?40:bossTest==='nordic'?21:bossTest==='frostjarl'?25:bossTest==='nameless'?35:bossTest==='odin'?30:bossTest==='pecado'?20:bossTest==='tsukuomi'?15:(bossTest==='reuni'?10:(bossTest==='samurai'?5:(activeCampaign==='nordic'?21:1)));essence=0;elapsed=0;flash=0;mouseAim=null;keys.clear();$('titleScreen').classList.add('hidden');$('selectScreen').classList.add('hidden');$('bossScreen').classList.add('hidden');$('supremeScreen').classList.add('hidden');$('bossScreen').classList.add('hidden');$('gameOverScreen').classList.add('hidden');$('hud').style.display='flex';$('mobileControls').style.display='';document.body.classList.add('is-playing');adaptViewport();YG_AUDIO.play('choose');if(coop.active&&coop.host)coopInitAllies();
 if(coop.active&&!coop.host){
   phase='play';enemies=[];projectiles=[];hazards=[];healthDrops=[];shadowClones=[];slashes=[];rings=[];
   camera.x=clamp(player.x-W/2,0,WORLD_W-W);camera.y=clamp(player.y-H/2,0,WORLD_H-H);
   waveIntro=0;updateHud();
 }else {spawnStage();if(activeCampaign==='nordic'&&stage===21){bossMessage='5 CARTAS JAPONESAS · FUTHARK NAS RECOMPENSAS · LIMITES ATIVOS';bossMessageTimer=4.2;}}}
function makeParticles(x,y,color,n=8,force=1){
 const cap=minimalFx()?45:lowFx()?100:220;if(particles.length>=cap)return;
 n=Math.min(n,minimalFx()?3:lowFx()?7:22,cap-particles.length);
 for(let i=0;i<n;i++){let a=rand(0,TAU),s=rand(18,64)*force;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.2,.65),max:.65,size:rand(1,3),color});}
}
// Damage numbers are pooled per target and positioned IN THE WORLD, close to
// the damaged actor. They are never screen-centered or allowed to pile up.
function textPop(x,y,str,color='#fff',targetId=null){
 const value=String(str),m=/^([+-]?)(\d+)(!)?$/.exec(value);
 if(m){
  const key=targetId===null?`at:${Math.round(x/19)}:${Math.round(y/19)}`:`target:${targetId}`;
  const now=performance.now(),number=(m[1]==='-'?-1:1)*Number(m[2]);
  let old=damageFloats.find(p=>p.key===key&&now-p.at<145);
  if(old){old.amount+=number;old.crit ||= !!m[3];old.color=color;old.at=now;
   old.life=Math.min(.8,old.life+.07);old.x=x;old.y=y;return;}
  if(damageFloats.length>=18)damageFloats.shift();
  damageFloats.push({key,x,y,dx:rand(-15,15),amount:number,crit:!!m[3],color,life:.72,max:.72,at:now});return;
 }
 if(particles.length<240)particles.push({x,y,vx:rand(-7,7),vy:-27,life:.65,max:.65,text:value,color});
}
function updateDamageFloats(dt){for(let i=damageFloats.length-1;i>=0;i--){damageFloats[i].life-=dt;if(damageFloats[i].life<=0)damageFloats.splice(i,1);}}
function drawDamageFloats(){
 ctx.save();ctx.textAlign='center';ctx.font='bold 10px system-ui';ctx.lineWidth=2.6;ctx.strokeStyle='#130b20';
 for(const n of damageFloats){
  if(n.x<camera.x-30||n.x>camera.x+W+30||n.y<camera.y-45||n.y>camera.y+H+20)continue;
  ctx.globalAlpha=Math.min(1,n.life*2.2);
  const x=n.x+n.dx,y=n.y-(1-n.life/n.max)*26;
  const value=(n.amount<0?'-':'')+Math.round(Math.abs(n.amount))+(n.crit?'!':'');
  ctx.strokeText(value,x,y);ctx.fillStyle=n.color;ctx.fillText(value,x,y);
 }
 ctx.restore();
}
// The host keeps its real avatar even while temporarily resolving a guest's attack.
function coopLivingHeroes(){
 if(!coop.active||!coop.host)return player&&player.hp>0?[player]:[];
 const roster=[coop.hostAvatar||player,...coop.allies.values()];
 return roster.filter(p=>p&&p.hp>0);
}
function nearestLivingHero(e){
 const alive=coopLivingHeroes();let target=null,nearest=Infinity;
 for(const p of alive){const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<nearest){nearest=d;target=p;}}
 return target;
}
function slash(x,y,ang,r,color){slashes.push({x,y,ang,r,color,life:.15,max:.15});shake=Math.max(shake,1.5)}
function ring(x,y,r,color){rings.push({x,y,r,life:.44,max:.44,color})}
function hitEnemy(e,dmg,chargesSupreme=false,trueDamage=false,cloneHit=false){if(e.hp<=0||e.secretUntil>elapsed)return;if(e.type==='nameless'&&(e.dragonIntro||0)>0)return;let isCrit=!trueDamage&&Math.random()<Math.min(.95,player.crit+(has60(player,'curse_glass')?.20:0)+(player.type==='cross'&&player.ultimateBuff==='cross'&&player.ultimateBuffTime>0?.27:0)),amount=dmg*newDamage(player)*(isCrit?(player.critMultiplier||1.7):1)*(isNordic()?(1+(player.jeraBonus||0)):1)*(isBossEnemy(e)?(player.bossAmp||1)*(rel60(player,'boss')?1.08:1)*(awake60(player,'mimic')?1.10:1):1)*(player.evePrimeTime>0?2:1)*(player.type==='mollitiam'&&isBossEnemy(e)&&player.ultimateTime>0?2:1)*(player.type==='mollitiam'&&isBossEnemy(e)&&player.mollitiamHeartTime>0?1.5:1)*(player.curseTime>0&&!trueDamage?.62:1)*(player.dragonPact&&player.ultimateBuffTime>0?1.18:1)*(e.corruptTime>0&&!trueDamage?1.16:1)*(player.type==='cross'&&player.ultimateBuff==='cross'&&player.ultimateBuffTime>0?1.35:1);if(!trueDamage&&Math.random()<player.echo)amount*=1.6;if(e.type==='soulMirror'&&!trueDamage)amount*=1-(e.copyArmor||0);if(isBossEnemy(e)&&!trueDamage)amount=Math.min(amount,e.maxHp*(rushMode?.025:.04));if(!trueDamage&&e.type==='boss'&&e.mode==='guard'&&e.guardTime>0){amount*=.3;if(e.counterCd<=0&&dist(e,player)<62){e.counterCd=1.25;ring(e.x,e.y,60,'#ff5374');bossMessage='CONTRA-ATAQUE DO SHOGUN';bossMessageTimer=.8;hurtPlayer(e.rage?25:18,'boss');}}if(e.type==='nameless'&&(e.pactBroken||0)>0)amount*=1.2;if(e.type==='odin'&&e.odinShield>0)amount*=.70;if(player.teamAura&&coop.active&&[...coop.allies.values()].some(a=>a.hp>0&&Math.hypot(a.x-player.x,a.y-player.y)<130))amount*=1+player.teamAura;player.damage62=(player.damage62||0)+Math.min(e.hp,Math.max(0,amount));e.hp-=amount;e.hurt=.14;if(!trueDamage&&isNordic()&&e.hp>0){if(Math.random()<(player.fireChance||0)){e.burnTime=Math.max(e.burnTime||0,2);e.burnTick=.6;}if(Math.random()<(player.iceChance||0))e.slow=Math.max(e.slow||0,1.5);if(Math.random()<(player.stormChance||0))e.hp-=Math.min(12,e.maxHp*.005);}if(player.type==='cross'&&e.hp>0&&e.hp<=e.maxHp*.5&&!e.corruptTime){e.corruptTime=5.5;e.slow=Math.max(e.slow||0,1.2);textPop(e.x,e.y-28,'CORROMPIDO','#c89cff');ring(e.x,e.y,27,'#8344af');}if(!cloneHit||(elapsed<cloneAudioAt||elapsed-cloneAudioAt>=.075)){YG_AUDIO.play(isBossEnemy(e)?'heavyHit':'hit',isCrit?1.2:.82);if(cloneHit)cloneAudioAt=elapsed;}if(chargesSupreme&&player.ultimateTime<=0&&player.ultimateBuffTime<=0)player.ultimateCharge=Math.min(100,player.ultimateCharge+(rel60(player,'tsukuomi')?1.08:1)*(['moretti','l0id'].includes(player.type)?(isBossEnemy(e)?1.8:1.1):player.type==='loid'?(isBossEnemy(e)?2.2:1.4):player.type==='eve'?(isBossEnemy(e)?4.5:3.0):player.type==='mollitiam'?(isBossEnemy(e)?5:3):player.type==='josue'?(isBossEnemy(e)?4:2.5):player.type==='abloy'?(isBossEnemy(e)?4:2.5):(isBossEnemy(e)?12:9)));textPop(e.x,e.y-12,Math.round(amount)+(isCrit?'!':''),isCrit?'#ffd67b':'#f0ccdc',e.id);makeParticles(e.x,e.y,player.mimicOrigin?'#ff4058':player.type==='loid'?'#ae7de3':player.type==='cross'?'#b167ef':'#709cff',cloneHit&&lowFx()?1:4);if(e.hp<=0){if(e.type==='runeSeal'){const boss=enemies.find(n=>n.type==='nameless'&&n.hp>0);if(boss){boss.sealsBroken=(boss.sealsBroken||0)+1;if(boss.sealsBroken>=3){boss.pactBroken=5;boss.stunTime=5;boss.sealsBroken=0;bossMessage='PACTO QUEBRADO · DRAGÃO SILENCIADO!';bossMessageTimer=3;}}}YG_AUDIO.play(isBossEnemy(e)?'bossDefeat':'oniDeath',e.type==='boss'?1.2:.65);player.kills++;if(e.elite62){player.coins60=(player.coins60||0)+20;if(e.elite62==='burst'){for(const a of actors60())if(a.hp>0&&dist(a,e)<52){const old=player;player=a;hurtPlayer(12);player=old;}ring(e.x,e.y,52,'#ed9a59');}}if(rel60(player,'reuni')&&player.kills%10===0)supportHeal(player,.03);essence+=isBossEnemy(e)?150:10;makeParticles(e.x,e.y,isBossEnemy(e)?'#e4b7ff':'#b1519d',18,1.3);player.hp=Math.min(player.maxHp,player.hp+player.onKillHeal);if(!isBossEnemy(e)&&Math.random()<(isNordic()?Math.min(.22,.14+(player.heartBonus||0)):.05)&&healthDrops.length<35){healthDrops.push({x:e.x,y:e.y,amount:12,life:16,phase:Math.random()*6.28});}if(isBossEnemy(e)){captureMimicBoss(e);if(e.secretKind){secretReward61(e);return;}if(e.type==='nameless'&&!player.dragonPact){player.dragonPact=true;bossMessage='CARTA LENDÁRIA · PACTO DO DRAGÃO';bossMessageTimer=4;}if(enemies.some(other=>other!==e&&other.hp>0&&isBossEnemy(other)))return;player.hp=player.maxHp;if(coop.active&&coop.host){const host=coop.hostAvatar||player;host.hp=host.maxHp;host.ghost=false;for(const ally of coop.allies.values()){ally.hp=ally.maxHp;ally.ghost=false;}}textPop(player.x,player.y-31,'VIDA RESTAURADA!','#b5ffad');hazards=[];eclipseTime=0;for(const add of enemies){if(add!==e&&!isBossEnemy(add))add.hp=0;}bossMessage=e.type==='ancestralDragon'?'PACTO DRACÔNICO ENCERRADO!':e.type==='odin'?'ODIN DERROTADO!':e.type==='nameless'?'CAVALEIRO INOMINÁVEL DERROTADO!':e.type==='frostjarl'?'JARL DO GELO DERROTADO!':e.type==='pecado'?'PECADO DERROTADO!':e.type==='tsukuomi'?'TSUKUOMI DERROTADA!':e.type==='reuni'?'REUNI DERROTADO!':'DAIMYŌ ONI DERROTADO!';bossMessageTimer=2.4;}}}

// Card-exclusive, one-use frog form: the next attack performs a shadow-frog leap.
function frogSmash(){
 if(!player||player.type!=='kris'||player.frogTime<=0)return;
 player.frogTime=0;player.frogSkill=false;player.skillCd=0;player.atkTime=.7;player.invuln=Math.max(player.invuln,.62);
 const a=player.aim;player.x+=Math.cos(a)*58;player.y+=Math.sin(a)*58;applyBoundaries(player,8);
 ring(player.x,player.y,76,'#83ff9c');makeParticles(player.x,player.y,'#62d9a8',40,1.25);
 slash(player.x,player.y,a,72,'#8dffb0');YG_AUDIO.play('bossEclipse',1.2);
 let strikes=0;
 for(const e of enemies){if(e.hp<=0||dist(e,player)>82+e.radius)continue;
  if(isBossEnemy(e))hitEnemy(e,e.maxHp*.25,false,true);
  else hitEnemy(e,e.hp+10000,false,true);
  strikes++;
 }
 bossMessage=strikes?'SALTO DO SAPO · IMPACTO ABSOLUTO':'SALTO DO SAPO · USADO';bossMessageTimer=2.1;
 updateHud();
}

function guestAttackVisual615(sendPress=false){
 if(!player||player.hp<=0||phase!=='play'||player.crossTp||coop.reconnecting||screenAdjusting)return false;
 const now=performance.now(),delay=player.attackDelay*newAttackDelay(player)*(player.type==='mollitiam'?(player.ultimateTime>0?.65:1)*(player.mollitiamHeartTime>0?1/1.30:1):1);
 if(now-coop.guestAttackAt615<delay*1000-5)return false;
 coop.guestAttackAt615=now;player.atkTime=delay;
 if(player.type==='abloy'){player.abCosmicUntil=Math.max(player.abCosmicUntil||0,elapsed+.3);YG_AUDIO.play('mirrorCast',.65);}
 else{if(player.type!=='josue'&&player.type!=='kali'){slash(player.x+Math.cos(player.aim)*player.reach*.55,player.y+Math.sin(player.aim)*player.reach*.55,player.aim,player.reach,player.mimicOrigin?'#ff4058':player.type==='cross'?'#b97aff':player.type==='loid'?'#d9a4ff':'#7592ff');slashes.at(-1).local615=true;}YG_AUDIO.play('hit',.55);}
 if(sendPress)coopAction('attack');return true;
}
function attack(){if(coop.reconnecting||(screenAdjusting&&!coop.executing))return;if(coop.active&&!coop.host&&!coop.executing){guestAttackVisual615(true);return;
 }if(!player||player.hp<=0||phase!=='play'||player.atkTime>0||player.crossTp)return;if(player.type==='kris'&&player.frogTime>0){frogSmash();return;}player.atkTime=player.attackDelay*newAttackDelay(player)*(player.type==='mollitiam'?(player.ultimateTime>0?.65:1)*(player.mollitiamHeartTime>0?1/1.30:1):1);player.attackCount++;advanceTrial60(player,'attack');if(player.type==='abloy'){abloyCast(player,'attack');return;}let amp=(player.transformTime>0?1+player.transformAmp:1)*(player.ultimateBuffTime>0&&player.ultimateBuff==='fight'?2:1);let a=player.aim,range=player.reach*(player.transformTime>0?1.18:1),cx=player.x+Math.cos(a)*range*.55,cy=player.y+Math.sin(a)*range*.55;
if(['moretti','l0id'].includes(player.type))player.newPose={row:3,until:elapsed+Math.min(.35,player.atkTime)};if(player.type!=='kali'&&player.type!=='josue')slash(cx,cy,a,range,player.mimicOrigin?'#ff4058':player.type==='loid'?'#d9a4ff':player.type==='cross'?'#b97aff':player.transformTime>0?'#ff73ec':'#7592ff');YG_AUDIO.play(player.type==='loid'?'loidSlash':'krisSlash',.95);let struck=0;for(const e of enemies){if(e.hp<=0)continue;let dx=e.x-player.x,dy=e.y-player.y,ed=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(angle-a),Math.cos(angle-a));if(player.type!=='kali'&&ed<range+e.radius&&Math.abs(diff)<player.arc/2+e.radius/Math.max(20,ed)){hitEnemy(e,player.damage*amp,true);if(player.type==='l0id'&&player.godShadowUntil>elapsed){slash(cx,cy,a+.2,range*1.2,'#aa8bd0');hitEnemy(e,player.damage*.65,false);}struck++;}}
if(player.type==='kali'){const vec={x:Math.cos(a),y:Math.sin(a)};projectiles.push({x:player.x+vec.x*15,y:player.y+vec.y*15-9,vx:vec.x*300,vy:vec.y*300,damage:player.damage*(player.mirrorAmp||1),from:'player',r:9,life:.86,color:'#e7c4ff',mirror:true,ownerId:coop.active?(coop.actorId||coop.id):null});YG_AUDIO.play('mirrorCast',.76);makeParticles(player.x+vec.x*20,player.y+vec.y*20-9,'#efc4ff',6,.55);}if(player.type==='kris'&&player.transformTime>0&&player.waveAttack){let vec={x:Math.cos(a),y:Math.sin(a)};projectiles.push({x:player.x+vec.x*15,y:player.y+vec.y*15,vx:vec.x*170,vy:vec.y*170,damage:player.damage*.65,from:'player',r:5,life:1.1,color:'#b572ff'})}
if(player.ultimateBuffTime>0&&player.ultimateBuff==='itens'&&player.type==='kris'){
 // A second synchronized black sword: actual hit registration and an additional visual slash.
 slash(cx+Math.cos(a+1.3)*9,cy+Math.sin(a+1.3)*9,a+.16,range*.95,'#b76fff');
 for(const e of enemies){if(e.hp<=0)continue;let dx=e.x-player.x,dy=e.y-player.y,ed=Math.hypot(dx,dy),diff=Math.atan2(Math.sin(Math.atan2(dy,dx)-a),Math.cos(Math.atan2(dy,dx)-a));if(ed<range+e.radius&&Math.abs(diff)<player.arc/2+e.radius/Math.max(20,ed))hitEnemy(e,player.damage*amp*.75,true);}
 }
 if(player.type==='loid'&&struck)makeParticles(cx,cy,'#924ac8',3);if(player.type==='mollitiam'){player.mollitiamPose=.34;ring(cx,cy,player.mollitiamHeartTime>0?39:25,player.mollitiamHeartTime>0?'#f9c65b':'#c8bbae');if(player.mollitiamHeartTime>0){for(const e of enemies){if(e.hp>0&&!isBossEnemy(e)&&Math.hypot(e.x-cx,e.y-cy)<43+e.radius)hitEnemy(e,player.damage*.20);}}}}
function crossBlink(p,v){if(p.crossTp)return false;const ox=p.x,oy=p.y;p.x+=v.x*54;p.y+=v.y*54;applyBoundaries(p,8);p.dashTime=0;p.dashCd=p.dashDelay*(awake60(p,'cross')?.85:1);p.invuln=Math.max(p.invuln,.24);p.blinkSeq=(p.blinkSeq||0)+1;ring(ox,oy,17,'#a36bff');ring(p.x,p.y,20,'#d9adff');makeParticles(ox,oy,'#9a66e8',8);return true;}
function dash(){if(coop.reconnecting||(screenAdjusting&&!coop.executing))return;if(coop.active&&!coop.host&&!coop.executing){
   if(!player||player.hp<=0||phase!=='play'||player.dashCd>0)return;
   const mv=getMove(),a=Math.hypot(mv.x,mv.y)>.1?Math.atan2(mv.y,mv.x):player.aim;
   if(player.type==='cross'){if(crossBlink(player,{x:Math.cos(a),y:Math.sin(a)})){coop.predBlink615={seq:player.blinkSeq,until:performance.now()+Math.min(800,Math.max(300,(netRtt||80)*3))};coopAction('dash');YG_AUDIO.play('dash',.65);}return;}
   if(player.type==='l0id'){newTeleport(player,{x:Math.cos(a),y:Math.sin(a)});coop.predBlink615={seq:player.blinkSeq,until:performance.now()+Math.min(800,Math.max(300,(netRtt||80)*3))};coopAction('dash');return;}player.dashV={x:Math.cos(a),y:Math.sin(a)};player.dashTime=.22;
   player.dashCd=player.type==='loid'&&player.ultimateTime>0?.07:player.type==='eve'&&player.evePrimeTime>0?player.dashDelay*.35:player.dashDelay;
   player.invuln=Math.max(player.invuln,.36);if(player.type==='eve'){const tx=clamp(player.x+Math.cos(a)*129,48,WORLD_W-48),ty=clamp(player.y+Math.sin(a)*129,48,WORLD_H-48);evePortals.push({ox:player.x,oy:player.y,tx,ty,life:1.25,max:1.25});}coopAction('dash');YG_AUDIO.play('dash',.65);return;
 }if(phase!=='play'||player.hp<=0||player.dashCd>0)return;advanceTrial60(player,'dash');YG_AUDIO.play('dash');let mv=getMove();let v=Math.hypot(mv.x,mv.y)>.1?norm(mv.x,mv.y):{x:Math.cos(player.aim),y:Math.sin(player.aim)};if(player.type==='cross'){crossBlink(player,v);return;}if(player.type==='l0id'){if(coop.executing&&player.input&&Math.hypot(player.input.x,player.input.y)>.1)v=norm(player.input.x,player.input.y);newTeleport(player,v);return;}if(player.type==='moretti')player.newPose={row:8,until:elapsed+.3};player.dashV=v;player.dashTime=.22;player.dashCd=player.type==='loid'&&player.ultimateTime>0?.07:player.type==='eve'&&player.evePrimeTime>0?player.dashDelay*.35:player.dashDelay;player.invuln=Math.max(player.invuln,.36);if(player.type==='eve'){const ox=player.x,oy=player.y,tx=clamp(ox+v.x*129,48,WORLD_W-48),ty=clamp(oy+v.y*129,48,WORLD_H-48);evePortals.push({ox,oy,tx,ty,life:1.25,max:1.25});ring(ox,oy,27,'#7145ba');ring(tx,ty,27,'#b285ff');}if(player.type==='loid'){dashGhostTimer=0;dashShadows.push({x:player.x,y:player.y,face:player.face,step:player.step,life:.34,max:.34});}makeParticles(player.x,player.y,player.type==='loid'?'#27112f':'#518cff',16);}
// Xans Q: TRUE blink. Stay at origin, instantly appear at the target, hit,
// then instantly return. No dash interpolation. Clients receive the same phases.
function crossTeleport(){
 const targets=enemies.filter(e=>e.hp>0&&e.x>camera.x-15&&e.x<camera.x+W+15&&e.y>camera.y-15&&e.y<camera.y+H+15);
 if(!targets.length){bossMessage='NENHUM INIMIGO À VISTA';bossMessageTimer=1;return false;}
 targets.sort((a,b)=>(isBossEnemy(b)?100000:0)+b.maxHp-(isBossEnemy(a)?100000:0)-a.maxHp);
 const first=targets.shift(),ids=[first.id];let prev=first;
 while(ids.length<6&&targets.length){targets.sort((a,b)=>dist(a,prev)-dist(b,prev));prev=targets.shift();ids.push(prev.id);}
 player.crossTp={ox:player.x,oy:player.y,tx:player.x,ty:player.y,elapsed:0,total:ids.length*.24+.14,ids,index:0};
 player.invuln=Math.max(player.invuln,player.crossTp.total+.08);player.dashTime=0;
 bossMessage='Q · SEQUÊNCIA CORRUPTA';bossMessageTimer=1.5;return true;
}
function updateCrossTeleport(p,dt){
 const t=p.crossTp;if(!t)return false;t.elapsed=Math.min(t.total,t.elapsed+dt);
 while(t.index<t.ids.length&&t.elapsed>=.08+t.index*.24){const i=t.index++,e=enemies.find(e=>e.id===t.ids[i]&&e.hp>0);if(!e)continue;
 const ox=p.x,oy=p.y,v=norm(e.x-ox,e.y-oy);p.x=e.x-v.x*(e.radius+12);p.y=e.y-v.y*(e.radius+12);applyBoundaries(p,8);t.tx=p.x;t.ty=p.y;p.blinkSeq=(p.blinkSeq||0)+1;
 ring(ox,oy,18,'#9a66e8');ring(p.x,p.y,25,'#b67fff');const prior=player;player=p;try{p.aim=Math.atan2(e.y-p.y,e.x-p.x);slash(p.x,p.y,p.aim,65,'#cc80ff');hitEnemy(e,p.damage*(i===0?2.9:1.15),true);e.stunTime=Math.max(e.stunTime||0,isBossEnemy(e)?.45:1.2);}finally{player=prior;}makeParticles(p.x,p.y,'#c989ff',10);YG_AUDIO.play('loidSlash',1.1);
 }
 if(t.elapsed>=t.total){ring(p.x,p.y,20,'#a36bff');p.x=t.ox;p.y=t.oy;applyBoundaries(p,8);p.blinkSeq=(p.blinkSeq||0)+1;ring(p.x,p.y,25,'#b67fff');p.crossTp=null;}return true;
}
function drawEvePortals(){
 if(!evePortals.length)return;
 evePortals=evePortals.filter(f=>(f.life-=1/Math.max(24,visibleFps||60))>0);
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(const fx of evePortals){const prog=1-fx.life/fx.max,frame=prog<.2?0:prog<.4?1:prog<.8?2:3;const art=EVE_PORTAL_FRAMES[frame];
   const size=76+Math.sin(elapsed*12)*5;
   ctx.globalAlpha=Math.min(.92,fx.life/.18);
   for(const [x,y] of [[fx.ox,fx.oy],[fx.tx,fx.ty]]){
    if(art?.complete&&art.naturalWidth)ctx.drawImage(art,x-size/2,y-size/2,size,size);
    else{ctx.strokeStyle='#a679ff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,size*.28,size*.39,0,0,TAU);ctx.stroke();}
   }
 }
 ctx.restore();
}
function drawXansPortals(){
 const actors=coop.active?[player,...coop.allies.values()]:[player];
 for(const a of actors){if(!a||a.type!=='cross'||!a.crossTp)continue;
  const t=a.crossTp,alpha=Math.min(1,Math.max(0,Math.min(t.elapsed/.08,(t.total-t.elapsed)/.1)));
  ctx.save();ctx.globalAlpha=alpha*.8;
  for(const pos of [[t.ox,t.oy],[t.tx,t.ty]]){
   ctx.strokeStyle='#bd7bff';ctx.lineWidth=2.5;ctx.shadowColor='#8b40d9';ctx.shadowBlur=lowFx()?0:8;
   ctx.beginPath();ctx.ellipse(pos[0],pos[1]-12,16+Math.sin(elapsed*14)*2,21,0,0,TAU);ctx.stroke();
   ctx.beginPath();ctx.ellipse(pos[0],pos[1]-12,7,13,0,0,TAU);ctx.stroke();
  }
  ctx.restore();
 }
}
const CROSS_BONES=[
 {name:'branco',color:'#fff9ec',mult:.62},
 {name:'azul',color:'#6acbff',mult:.48},
 {name:'laranja',color:'#ff9b4b',mult:.54}
];
function crossBone(){
 let angle=player.aim;
 const visible=enemies.filter(e=>e.hp>0&&e.x>camera.x-30&&e.x<camera.x+W+30&&e.y>camera.y-30&&e.y<camera.y+H+30);
 if(visible.length&&!mouseAim){visible.sort((a,b)=>dist(a,player)-dist(b,player));angle=Math.atan2(visible[0].y-player.y,visible[0].x-player.x);}
 // Nine bones are spawned over time, instead of one enormous instantaneous effect.
 player.boneVolley={left:9,next:0,index:0,angle};
 makeParticles(player.x,player.y,'#ac76ff',12);YG_AUDIO.play('oniCast',.95);
 bossMessage='E · CHUVA DE OSSOS';bossMessageTimer=1.1;
}
function updateCrossBones(p,dt,ownerId=coop.id){
 const v=p.boneVolley;if(!v)return;
 v.next-=dt;
 while(v.left>0&&v.next<=0){
  const bone=CROSS_BONES[Math.floor(Math.random()*CROSS_BONES.length)];
  const offset=(v.index-4)*.075+(Math.random()-.5)*.065;
  const a=v.angle+offset;
  const vx=Math.cos(a),vy=Math.sin(a),speed=235+Math.random()*40;
  projectiles.push({x:p.x+vx*13,y:p.y+vy*13-9,vx:vx*speed,vy:vy*speed,damage:p.damage*bone.mult,from:'player',ownerId,bone:bone.name,r:5,life:1.65,color:bone.color});
  v.index++;v.left--;v.next+=.072;
  if(v.index%3===1)makeParticles(p.x,p.y,'#b88af9',3,.6);
 }
 if(v.left<=0)p.boneVolley=null;
}
function cardPower(){if(coop.reconnecting||(screenAdjusting&&!coop.executing))return;
 if(coop.active&&!coop.host&&!coop.executing){coopAction('f');return;}
 if(!player||player.hp<=0||phase!=='play'||!player.cardPower||player.cardPowerUsed)return;
 if(player.cardPower==='granita'&&player.ultimateCharge<50){bossMessage='GRANITA · PRECISA DE 50% DE ENERGIA';bossMessageTimer=1.5;return;}
 player.cardPowerUsed=true;
 const power=player.cardPower;if(power==='chronosFury'&&player.type==='josue'){josueAbility('F');return;}if((power==='authorReality'&&player.type==='moretti')||(power==='godShadow'&&player.type==='l0id')){newAbility('F');return;}
 if(power==='mollitiamHeart'){
  if(player.type!=='mollitiam'){player.cardPowerUsed=false;return;}
  player.mollitiamHeartTime=8;player.invuln=Math.max(player.invuln,.35);
  ring(player.x,player.y,95,'#ffd56a');makeParticles(player.x,player.y,'#e5bb54',minimalFx()?12:35,1.1);
  bossMessage='MOLLITIAM · CORAÇÃO DE YGGDRASIL · 8s';bossMessageTimer=2.4;updateHud();return;
 }
 if(power==='frog'){
  if(player.type!=='kris'||player.frogUsed){player.cardPowerUsed=false;return;}
  player.frogUsed=true;player.frogTime=12;player.invuln=Math.max(player.invuln,.6);
  ring(player.x,player.y,52,'#8dffa0');makeParticles(player.x,player.y,'#9df6bd',minimalFx()?8:22);
  bossMessage='FORMA DO SAPO · F ATIVADO · ATAQUE PARA SALTAR';bossMessageTimer=2.6;updateHud();return;
 }
 // Eve's legendary card is activated ONLY with F. Q keeps the original void attack;
 // R stays the original Expansion of the Void supreme. No boss music or sprites change.
 if(power==='eveprime'){
  if(player.type!=='eve'){player.cardPowerUsed=false;return;}
  player.evePrimeTime=6;
  player.invuln=Math.max(player.invuln,.28);
  ring(player.x,player.y,95,'#f3d8ff');
  makeParticles(player.x,player.y,'#c79dfd',minimalFx()?6:18,.85);
  YG_AUDIO.play('krisForm',.95);
  bossMessage='EVE LOREY · RETORNO AO AUGE · 6s (CARTA F)';bossMessageTimer=2.5;
  updateHud();return;
 }
 const target=enemies.filter(e=>e.hp>0&&e.x>camera.x-15&&e.x<camera.x+W+15&&e.y>camera.y-15&&e.y<camera.y+H+15).sort((a,b)=>dist(a,player)-dist(b,player))[0];
 const aim=mouseAim?Math.atan2(mouseAim.y-player.y,mouseAim.x-player.x):target?Math.atan2(target.y-player.y,target.x-player.x):player.aim;
 if(power==='granita')player.ultimateCharge-=50;
 const length=power==='gaster'?470:420,width=power==='gaster'?44:63;
 // Gaster has a visible skull summoning phase and a separate beam firing phase.
 bonusBeam={x:player.x,y:player.y,a:aim,length,width,life:power==='gaster'?1.72:1.05,max:power==='gaster'?1.72:1.05,kind:power,ownerId:coop.actorId||coop.id,applied:false,windup:power==='gaster'?.40:.09};
 YG_AUDIO.play('bossEclipse',1.3);ring(player.x,player.y,88,power==='gaster'?'#b8a0ff':'#f8f8ff');shake=7;
 bossMessage=power==='gaster'?'GASTER BLASTER · CAVEIRA INVOCADA':'F · DESCARGA DE GRANITA';bossMessageTimer=2.2;
 updateHud();
}
function updateCardBeam(dt){
 if(!bonusBeam)return;
 const b=bonusBeam;
 b.life=Math.max(0,b.life-dt);
 if(!b.applied&&b.max-b.life>=b.windup){
  b.applied=true;
  const previous=player;if(coop.active&&coop.host&&b.ownerId&&b.ownerId!==coop.id)player=coop.allies.get(b.ownerId)||player;
  const dx=Math.cos(b.a),dy=Math.sin(b.a);
  for(const e of enemies){if(e.hp<=0)continue;
   const ex=e.x-b.x,ey=e.y-b.y,along=ex*dx+ey*dy,side=Math.abs(ex*dy-ey*dx);
   if(along>=-25&&along<=b.length+e.radius&&side<b.width+e.radius){
    hitEnemy(e,isBossEnemy(e)?Math.max(player.damage*8,e.maxHp*(b.kind==='gaster'?.18:.23)):e.hp+500,false,true);
   }
  }
  player=previous;
  makeParticles(b.x,b.y,b.kind==='gaster'?'#d1a8ff':'#fafafa',20,1.1);
  shake=8;
 }
 if(b.life<=0)bonusBeam=null;
}
const GASTER_SKULL=new Image();GASTER_SKULL.src='assets/effects/gaster_skull.png';
function drawCardBeam(){
 if(!bonusBeam)return;
 const b=bonusBeam,age=b.max-b.life,fire=age>=b.windup;
 const f=Math.min(1,b.life/.35),pulse=.92+Math.sin(elapsed*28)*.08;
 ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);
 // Skull spawns BEHIND Cross and remains visible throughout the attack.
 const skullSize=b.kind==='gaster'?95:0;
 if(b.kind==='gaster'){
  ctx.save();ctx.translate(-43,-23);
  ctx.globalAlpha=Math.min(1,age/.17)*Math.min(1,b.life/.23);
  ctx.shadowColor='#b25dff';ctx.shadowBlur=9;
  if(GASTER_SKULL.complete&&GASTER_SKULL.naturalWidth)ctx.drawImage(GASTER_SKULL,-skullSize/2,-skullSize/2,skullSize,skullSize);
  ctx.restore();
 }
 if(fire){
  ctx.globalAlpha=f;
  ctx.shadowColor=b.kind==='gaster'?'#ab68ff':'#eeeaff';ctx.shadowBlur=15;
  ctx.fillStyle=b.kind==='gaster'?'#6130a0':'#17101c';
  ctx.fillRect(10,-b.width*.82,b.length,b.width*1.64);
  ctx.fillStyle=b.kind==='gaster'?'#d5b6ff':'#f4f4fb';
  ctx.fillRect(12,-b.width*.44,b.length-3,b.width*.88*pulse);
  ctx.fillStyle='#ffffff';ctx.fillRect(14,-b.width*.16,b.length-8,b.width*.32);
  ctx.shadowBlur=0;
  for(let j=0;j<9;j++){const pos=(j/9*b.length+elapsed*195)%b.length;
   ctx.fillStyle=j%2?'#d1aaff':'#f6f1ff';ctx.fillRect(20+pos,-b.width*.52+(j%3)*b.width*.5,7,3);
  }
 }else if(b.kind==='gaster'){
  ctx.globalAlpha=.6;ctx.strokeStyle='#b386fd';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(-15,0,32+Math.sin(elapsed*20)*4,0,TAU);ctx.stroke();
 }
 ctx.restore();
}

// V26: World-affecting abilities are calculated on the authoritative host.
function applyTimeFields(dt){
 for(let i=timeFields.length-1;i>=0;i--){const t=timeFields[i];t.life-=dt;if(t.life<=0){timeFields.splice(i,1);continue;}
  t.tick=(t.tick??.65)-dt;
  const pulse=t.tick<=0;if(pulse)t.tick+=.9;
  for(const e of enemies)if(e.hp>0&&Math.hypot(e.x-t.x,e.y-t.y)<t.radius){
   e.timeSlow=Math.max(e.timeSlow||0,0.10);
   if(pulse){const prev=player;player=(coop.active&&coop.host&&t.ownerId&&t.ownerId!==coop.id)?(coop.allies.get(t.ownerId)||player):player;hitEnemy(e,Math.min(6,player.damage*.12),false,true);player=prev;}
  }
  for(const p of projectiles)if(p.from==='enemy'&&Math.hypot(p.x-t.x,p.y-t.y)<t.radius){p.timeSlow=0.25;}
 }
 for(const e of enemies)if(e.timeSlow!==undefined){e.timeSlow=Math.max(0,e.timeSlow-dt*0.8);}
 for(const p of projectiles)if(p.timeSlow!==undefined){p.timeSlow=Math.min(1,(p.timeSlow||0)+dt*0.8);}
}
function updateMirrorIllusions(dt){for(let i=mirrorIllusions.length-1;i>=0;i--){const v=mirrorIllusions[i];v.life-=dt;v.attackCd-=dt;
 if(coop.active&&coop.host&&v.ownerId)v.owner=v.ownerId===coop.id?(coop.hostAvatar||player):coop.allies.get(v.ownerId);
 if(v.life<=0||!v.owner||v.owner.hp<=0){mirrorIllusions.splice(i,1);continue;}
 // No sorting or target scanning every frame; at most one bounded scan per strike.
 if(v.attackCd>0)continue;v.attackCd=.8;let target=null,best=205**2;
 for(const e of enemies){if(e.hp<=0)continue;const d=(e.x-v.x)**2+(e.y-v.y)**2;if(d<best){target=e;best=d;}}
 if(target){const prev=player;player=v.owner;try{hitEnemy(target,player.damage*.35,true);}finally{player=prev;}ring(target.x,target.y,14,'#f8a6f5');}
 }}
function kaliMirrorAttack(){const visible=enemies.filter(e=>e.hp>0&&dist(e,player)<210).sort((a,b)=>dist(a,player)-dist(b,player));
 const e=visible[0];if(e){hitEnemy(e,player.damage*(player.mirrorAmp||1),true);slash(e.x,e.y,Math.atan2(e.y-player.y,e.x-player.x),36,'#dfbaff');}
}
function eveVoidCast(){const near=enemies.filter(e=>e.hp>0&&dist(e,player)<155).sort((a,b)=>dist(a,player)-dist(b,player))[0];
 const cx=near?near.x:player.x+Math.cos(player.aim)*68,cy=near?near.y:player.y+Math.sin(player.aim)*68;
 ring(cx,cy,42,'#3a1769');for(const e of enemies){if(e.hp<=0||Math.hypot(e.x-cx,e.y-cy)>45+e.radius)continue;
 if(isBossEnemy(e)){hitEnemy(e,Math.min(e.maxHp*.065,player.damage*23),true,true);}else{hitEnemy(e,e.hp+5,true,true);}}
 makeParticles(cx,cy,'#8b43e9',minimalFx()?3:16);
}
function castEveUltimate(){player.voidUltimate=2.5;player.voidUltTick=0;player.invuln=2.5;voidCollapse=2.5;
 bossMessage='EXPANSÃO DO VAZIO · O MUNDO DESAPARECE';bossMessageTimer=3.0;
 YG_AUDIO.play('bossEclipse',.92);shake=Math.max(shake,4);
 ring(player.x,player.y,230,'#27113a');makeParticles(player.x,player.y,'#9e6aff',minimalFx()?7:28,.85);}

function tickEveUltimate(dt){if(!player||player.type!=='eve'||player.voidUltimate<=0)return;
 player.voidUltimate=Math.max(0,player.voidUltimate-dt);
 if(player.voidUltimate>0&&player.voidUltimate<1.1&&!player.voidUltTick){player.voidUltTick=1;
 let removed=0;
 for(const e of enemies){if(e.hp<=0)continue;
   if(isBossEnemy(e))hitEnemy(e,e.maxHp*.20,true,true);
   else{removed++;makeParticles(e.x,e.y,'#9d69ee',minimalFx()?3:10,.9);hitEnemy(e,e.hp+1,true,true);}
 }
 bossMessage=removed?`EXPANSÃO DO VAZIO · ${removed} CRIATURAS DESINTEGRADAS`:'EXPANSÃO DO VAZIO · IMPACTO NO CHEFE';
 bossMessageTimer=2.2;YG_AUDIO.play('bossDefeat',.6);

 }}
function skill(){if(coop.reconnecting||(screenAdjusting&&!coop.executing))return;
 if(coop.active&&!coop.host&&!coop.executing){coopAction('q');return;}if(!player||player.hp<=0||phase!=='play'||player.skillCd>0||player.crossTp)return;
 advanceTrial60(player,'q');if(player.type==='abloy'){abloyCast(player,'Q');return;}if(player.type==='mimic'){mimicPower('Q');return;}if(player.type==='josue'){josueAbility('Q');return;}if(['moretti','l0id'].includes(player.type)){newAbility('Q');return;}
 if(player.type==='mollitiam'){
  player.skillCd=player.skillDelay;player.mollitiamPose=.82;
  const radius=player.mollitiamHeartTime>0?149:112;
  ring(player.x,player.y,radius,'#e4c381');makeParticles(player.x,player.y,'#d5b36c',minimalFx()?10:35,1.0);
  for(const e of enemies){if(e.hp<=0||Math.hypot(e.x-player.x,e.y-player.y)>radius+e.radius)continue;
   hitEnemy(e,isBossEnemy(e)?76:e.hp+1,true);}
  shake=Math.max(shake,5);bossMessage='MOLLITIAM · PISÃO DE GUERRA';bossMessageTimer=1.4;updateHud();return;
 }
 if(player.type==='cross'){if(crossTeleport()){player.skillCd=player.skillDelay;updateHud();}return;}
 if(player.type==='kali'){kaliSupport('Q');return;}
 if(player.type==='eve'){player.skillCd=player.skillDelay;eveVoidCast();return;}
 player.skillCd=player.skillDelay;YG_AUDIO.play(player.type==='loid'?'loidAura':'krisForm',1.13);
 if(player.type==='loid'){
  player.darkAuraTime=(player.darkAuraDuration||4.1)*(awake60(player,'loid')?1.25:1);player.darkAuraTick=0;
  player.invuln=.55;ring(player.x,player.y,70,'#160c25');
  makeParticles(player.x,player.y,'#33213c',24,.9);
 }else{
  player.transformTime=player.transformDuration;player.invuln=.5;
  makeParticles(player.x,player.y,'#7872ff',32,1.4);ring(player.x,player.y,45,'#8969ff');
 }
 updateHud();
}

// E — Loid summons exactly four hostile dark duplicates. Kris holds E to charge a long-range dimensional slash.
function secondaryDown(){if(coop.reconnecting||(screenAdjusting&&!coop.executing))return;
 if(coop.active&&!coop.host&&!coop.executing){coopAction('eDown');return;}if(!player||player.hp<=0||phase!=='play'||player.secondaryCd>0)return;
 advanceTrial60(player,'e');if(player.type==='abloy'){abloyCast(player,'E');return;}if(player.type==='mimic'){mimicPower('E');return;}if(player.type==='josue'){josueAbility('E');return;}if(['moretti','l0id'].includes(player.type)){newAbility('E');return;}
 if(player.type==='mollitiam'){
  player.secondaryCd=player.secondaryDelay;player.mollitiamPose=.86;
  const team=coop.active&&coop.host?[coop.hostAvatar||player,...coop.allies.values()]:[player];
  for(const ally of team){if(ally.hp<=0)continue;const healRate=(player.mollitiamHeartTime>0?.35:.25)*(isNordic()?1:.5);const heal=Math.round(ally.maxHp*healRate);const beforeHeal62=ally.hp;ally.hp=Math.min(ally.maxHp,ally.hp+heal);player.heal62=(player.heal62||0)+Math.max(0,ally.hp-beforeHeal62);textPop(ally.x,ally.y-29,'+'+heal+' RAIZ','#b9f8a8');ring(ally.x,ally.y,36,'#a6df83');}
  makeParticles(player.x,player.y,'#a4dd84',minimalFx()?12:26,1.2);bossMessage='MOLLITIAM · RAÍZES VITAIS · CURA DO GRUPO';bossMessageTimer=1.9;updateHud();
 }
 else if(player.type==='cross'){player.secondaryCd=player.secondaryDelay;crossBone();}
 else if(player.type==='eve'){player.secondaryCd=player.secondaryDelay;timeFields.push({x:player.x+Math.cos(player.aim)*85,y:player.y+Math.sin(player.aim)*85,radius:105,life:player.timeDuration||5,tick:.65,ownerId:coop.actorId||coop.id});ring(player.x,player.y,120,'#65baff');}
 else if(player.type==='kali'){kaliSupport('E');}
 else if(player.type==='loid'){
   player.secondaryCd=player.secondaryDelay;shadowClones=shadowClones.filter(s=>s.ownerId!==(coop.actorId||coop.id)||s.kind);
   for(let i=0;i<4;i++){
     const a=TAU*i/4+Math.PI/4;
     shadowClones.push({ownerId:coop.actorId||coop.id,x:clamp(player.x+Math.cos(a)*24,110,WORLD_W-110),y:clamp(player.y+Math.sin(a)*24,161,WORLD_H-108),angle:a,step:0,face:'down',time:8,attackCd:.16+i*.13});
   }
   ring(player.x,player.y,68,'#7c43bb');makeParticles(player.x,player.y,'#412156',30,1.1);
   bossMessage='E · QUATRO SOMBRAS INVOCADAS';bossMessageTimer=1.6;
   YG_AUDIO.play('loidAura',.9);
 }else if(!player.secondaryCharging){
   player.secondaryCharging=true;player.secondaryCharge=0;
   bossMessage='SEGURE E · CORTE DIMENSIONAL';bossMessageTimer=1.1;
 }
 updateHud();
}
function secondaryUp(){if(coop.reconnecting||(screenAdjusting&&!coop.executing)||player?.type==='mimic')return;
 if(coop.active&&!coop.host&&!coop.executing){coopAction('eUp');return;}if(!player||player.type!=='kris'||!player.secondaryCharging)return;
 const fraction=clamp(player.secondaryCharge/1.6,0,1);
 player.secondaryCharging=false;player.secondaryCharge=0;
 if(phase!=='play'||fraction<.09)return;
 player.secondaryCd=player.secondaryDelay;
 player.atkTime=Math.max(player.atkTime,.34);
 const a=player.aim,length=92+132*fraction,width=17+15*fraction;
 const dirx=Math.cos(a),diry=Math.sin(a);
 let hits=0;
 for(const e of enemies){
   if(e.hp<=0)continue;
   const dx=e.x-player.x,dy=e.y-player.y;
   const along=dx*dirx+dy*diry,perp=Math.abs(dx*diry-dy*dirx);
   if(along>=-4&&along<=length+e.radius&&perp<=width+e.radius){
     hitEnemy(e,player.damage*(1.1+5.7*fraction),true);
     hits++;
   }
 }
 slash(player.x+dirx*length*.58,player.y+diry*length*.58,a,length,'#9bc8ff');
 ring(player.x+dirx*length,player.y+diry*length,width+8,'#b57df5');
 for(let i=0;i<Math.min(50,24+fraction*30);i++){
   let t=rand(0,length), side=rand(-width,width);
   makeParticles(player.x+dirx*t-diry*side,player.y+diry*t+dirx*side,'#9a74fa',1,.9);
 }
 player.invuln=Math.max(player.invuln,.17);
 shake=Math.max(shake,4+fraction*3);YG_AUDIO.play('bossEclipse',1.13);
 bossMessage=hits?`CORTE DIMENSIONAL · ${hits} ALVO(S)`:'CORTE DIMENSIONAL';bossMessageTimer=1.4;
 updateHud();
}
function updateClones(dt){
 const liveById=new Map();for(const e of enemies)if(e.hp>0)liveById.set(e.id,e);
 for(let i=shadowClones.length-1;i>=0;i--){
   const s=shadowClones[i];const originalPlayer=player;const cloneOwner=coop.active&&coop.host&&s.ownerId!==coop.id?coop.allies.get(s.ownerId):null;if(cloneOwner)player=cloneOwner;s.time-=dt;
   if(s.time<=0){shadowClones.splice(i,1);player=originalPlayer;continue;}
   s.attackCd-=dt;s.step+=dt*10;
   let closest=liveById.get(s.targetId);if(closest?.hp<=0)closest=null;let near=closest?dist(s,closest):Infinity;s.retarget=(s.retarget||0)-dt;if(!closest||s.retarget<=0){s.retarget=.18+(i%5)*.025;closest=null;near=Infinity;for(const e of enemies){const d=(e.x-s.x)**2+(e.y-s.y)**2;if(e.hp>0&&d<near){near=d;closest=e;}}near=Math.sqrt(near);s.targetId=closest?.id;}
   if(closest){
     const v=norm(closest.x-s.x,closest.y-s.y);
     if(near>22){const speed=s.kind==='l0id'?230:158;s.x+=v.x*speed*dt;s.y+=v.y*speed*dt;}
     s.face=Math.abs(v.x)>Math.abs(v.y)?(v.x<0?'left':'right'):(v.y<0?'up':'down');
     if(near<36&&s.attackCd<=0){
       s.attackCd=(.72+Math.random()*.18)*(s.kind==='l0id'&&player.ultimateTime>0?.65:1);
       slash(s.x+v.x*12,s.y+v.y*12,Math.atan2(v.y,v.x),25,'#7c3aaa');
       hitEnemy(closest,s.damage??player.damage*(s.kind==='l0id'?.52:s.kind==='population'?.35:.52),!s.kind?.startsWith('mimic')&&s.kind!=='l0id',false,true);if(!lowFx())makeParticles(closest.x,closest.y,'#6a3a9d',3);
     }
   }else{
     const follow={x:player.x+Math.cos(s.angle+elapsed*.8)*38,y:player.y+Math.sin(s.angle+elapsed*.8)*32};
     const v=norm(follow.x-s.x,follow.y-s.y);
     if(Math.hypot(follow.x-s.x,follow.y-s.y)>8){s.x+=v.x*100*dt;s.y+=v.y*100*dt;}
   }
   applyBoundaries(s,8);player=originalPlayer;
 }
}
function drawShadowClone(s){
 if(s.kind==='mimicOni'||s.kind==='mimicEcho'){ctx.save();ctx.globalAlpha=Math.min(.8,s.time*.5);ctx.filter='sepia(.5) saturate(1.8) drop-shadow(0 0 2px #ff3855)';enemySprite({type:s.kind==='mimicOni'?'runner':'ghost',x:s.x,y:s.y,face:s.face,step:s.step,walking:true,hp:1,maxHp:1,radius:11,mode:'walk',mimicVisual:true});ctx.restore();return;}
 const modern=!!s.kind,im=modern?HERO[s.kind==='l0id'?'l0idShadow':'moretti']:LOID_SHADE;if(!im.complete||!im.naturalWidth)return;
 const step=Math.floor(s.step||0),x=Math.round(s.x),y=Math.round(s.y);ctx.save();ctx.globalAlpha=Math.min(modern?.67:.82,Math.max(0,s.time)*.45);
 if(modern){const size=(s.kind==='l0id'?82:62)*.85;const row=s.kind==='l0id'?2:1,col=step%4;ctx.translate(x,y);if(s.face==='left')ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(im,col*192,row*192,192,192,-size/2,-size+size/24,size,size);}
 else{const row={down:0,left:1,right:2,up:3}[s.face]??0,col=[1,0,1,2][step%4];ctx.drawImage(im,col*112,row*112,112,112,x-20,y-34,40,40);}
 ctx.restore();
 if(!modern&&!lowFx()){ctx.save();ctx.strokeStyle='#7d50ad88';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y-16,15+Math.sin(elapsed*5+(s.angle||0))*2,0,TAU);ctx.stroke();ctx.restore();}
}
function drawDimensionalCharge(){
 if(!player||player.type!=='kris'||!player.secondaryCharging)return;
 let f=clamp(player.secondaryCharge/1.6,0,1),a=player.aim,len=94+130*f;
 ctx.save();ctx.translate(player.x,player.y);
 ctx.strokeStyle=f>=1?'#c5eeff':'#9f84ee';ctx.lineWidth=3+4*f;
 ctx.shadowColor='#7a76ff';ctx.shadowBlur=9+14*f;
 ctx.setLineDash([9,3]);ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(Math.cos(a)*len,Math.sin(a)*len-8);ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.strokeStyle='#fff1fc';ctx.lineWidth=2;ctx.arc(0,-13,22,-Math.PI/2,-Math.PI/2+TAU*f);ctx.stroke();ctx.restore();
}
// Responsive renderer: mobile portrait stays tall; landscape gets the correct wide camera and buttons.
function adaptViewport(force=false){
 const scene=document.querySelector('.scene');
 const rect=scene.getBoundingClientRect();
 const wide=touchUI&&window.innerWidth>window.innerHeight;
 // Logical viewport follows the scene's actual aspect ratio; no canvas stretch in portrait.
 const displayW=Math.max(1,rect.width||window.innerWidth);
 const displayH=Math.max(1,rect.height||(wide?window.innerHeight*.85:window.innerHeight*.72));
 const nextH=touchUI?(wide?300:Math.min(720,Math.max(420,Math.round(480*displayH/displayW)))):288;
 const nextW=touchUI?Math.min(860,Math.max(240,Math.round(nextH*displayW/displayH))):480;
 if(force||W!==nextW||H!==nextH){
   W=nextW;H=nextH;canvas.width=Math.round(W*RENDER_SCALE);canvas.height=Math.round(H*RENDER_SCALE);
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   if(player){camera.x=clamp(player.x-W/2,0,Math.max(0,WORLD_W-W));camera.y=clamp(player.y-H/2,0,Math.max(0,WORLD_H-H));}
 }
 document.body.classList.toggle('landscape',wide);
}
window.addEventListener('resize',adaptViewport,{passive:true});
window.addEventListener('orientationchange',()=>requestAnimationFrame(adaptViewport));

// Xans ultimate: 5 skulls surround him, lock on to the strongest living enemy,
// and fire together. Damage is computed by the host only and replicated to all peers.
function summonXansSkulls(){
 const targets=enemies.filter(e=>e.hp>0);
 targets.sort((a,b)=>(isBossEnemy(b)?100000:0)+b.maxHp-(isBossEnemy(a)?100000:0)-a.maxHp);
 const target=targets[0];
 xansBlasters.push({ownerId:coop.actorId||coop.id,ox:player.x,oy:player.y,
   targetId:target?.id??null,tx:target?.x??player.x+Math.cos(player.aim)*230,
   ty:target?.y??player.y+Math.sin(player.aim)*230,
   life:1.85,max:1.85,windup:.55,applied:false});
 if(xansBlasters.length>4)xansBlasters.shift();
 ring(player.x,player.y,72,'#b36dff');
 makeParticles(player.x,player.y,'#ae72f3',renderMode==='desempenho'?8:18);
}
function updateXansSkulls(dt){
 for(let i=xansBlasters.length-1;i>=0;i--){
  const v=xansBlasters[i];v.life=Math.max(0,v.life-dt);
  const target=enemies.find(e=>e.id===v.targetId&&e.hp>0);
  if(target){v.tx=target.x;v.ty=target.y;}
  if(!v.applied&&v.max-v.life>=v.windup){
    v.applied=true;
    const owner=coop.active&&coop.host&&v.ownerId!==coop.id?coop.allies.get(v.ownerId):player;
    if(target&&owner&&owner.hp>0){const prior=player;player=owner;
      for(let b=0;b<5&&target.hp>0;b++){
        hitEnemy(target,isBossEnemy(target)?target.maxHp*.013:owner.damage*1.05,false,true);
      }
      player=prior;
    }
    makeParticles(v.tx,v.ty,'#d4b0ff',renderMode==='desempenho'?8:22);
    ring(v.tx,v.ty,45,'#af67ff');
  }
  if(v.life<=0)xansBlasters.splice(i,1);
 }
}
function drawXansSkulls(){
 for(const v of xansBlasters){
  const age=v.max-v.life,firing=age>=v.windup;
  const fade=Math.min(1,age/.2,v.life/.22);
  if(fade<=0)continue;
  ctx.save();ctx.globalAlpha=fade;
  for(let i=0;i<5;i++){
   const theta=(i/5)*TAU-Math.PI/2;
   const sx=v.ox+Math.cos(theta)*42,sy=v.oy-15+Math.sin(theta)*31;
   const angle=Math.atan2(v.ty-sy,v.tx-sx),range=Math.hypot(v.tx-sx,v.ty-sy);
   if(firing){ctx.save();ctx.translate(sx,sy);ctx.rotate(angle);
    ctx.strokeStyle='#9d56ff';ctx.lineWidth=8;ctx.globalAlpha=fade*.64;
    ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(range,0);ctx.stroke();
    ctx.strokeStyle='#f5eaff';ctx.lineWidth=3;ctx.globalAlpha=fade;
    ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(range,0);ctx.stroke();ctx.restore();}
   ctx.save();ctx.translate(sx,sy);ctx.rotate(firing?angle+Math.PI/2:0);
   if(GASTER_SKULL.complete&&GASTER_SKULL.naturalWidth){
     ctx.drawImage(GASTER_SKULL,-18,-19,36,36);
   }else{ctx.fillStyle='#e7dcff';ctx.fillRect(-10,-12,20,22);ctx.fillStyle='#52208f';ctx.fillRect(-5,-4,4,5);ctx.fillRect(3,-4,4,5);}
   ctx.restore();
  }
  ctx.restore();
 }
}
function ultimate(){if(coop.reconnecting||(screenAdjusting&&!coop.executing))return;
 if(coop.active&&!coop.host&&!coop.executing){coopAction('ultimate');return;}if(!player||player.hp<=0||phase!=='play'||player.ultimateCharge<100)return;
 if(player.type==='mimic'){mimicPower('R');return;}if(player.type==='abloy'){abloyCast(player,'R');return;}player.ultimateCharge=0;YG_AUDIO.play('ultimate',1.24);if(player.type==='josue'){josueAbility('R');return;}if(['moretti','l0id'].includes(player.type)){newAbility('R');return;}
 if(player.type==='mollitiam'){player.ultimateTime=8;player.mollitiamPose=1.0;player.invuln=.7;ring(player.x,player.y,120,'#ffcc76');makeParticles(player.x,player.y,'#f6c25b',lowFx()?16:42,1.3);bossMessage='MOLLITIAM · TITÃ RÚNICO · 8s';bossMessageTimer=2.2;}
 else if(player.type==='eve'){castEveUltimate();}
 else if(player.type==='kali'){kaliSupport('R');}
 else if(player.type==='cross'){player.ultimateBuff='cross';player.ultimateBuffTime=8;player.invuln=.4;makeParticles(player.x,player.y,'#bb79fa',20,1.5);summonXansSkulls();bossMessage='SUPREMO · RUPTURA CORRUPTA · 5 CAVEIRAS';bossMessageTimer=2.2;}
 else if(player.type==='loid'){
  player.ultimateTime=5;player.ultimateTick=0;player.invuln=.65;domainFade=1;
  ring(player.x,player.y,184,'#5b347c');makeParticles(player.x,player.y,'#6c3987',32,1.6);
  bossMessage='SUPREMO · DOMÍNIO DA ESCURIDÃO';bossMessageTimer=1.9;
 }else{
  phase='ultimate';keys.clear();attackMobile=false;pointerDown=false;
  $('supremeScreen').classList.remove('hidden');
 }
 updateHud();
}
function chooseUltimate(kind){if(coop.reconnecting||(screenAdjusting&&!coop.executing))return;
 if(coop.active&&!coop.host&&!coop.executing){coopAction('ultimateChoice',kind);coop.selectingUltimate=false;$('supremeScreen').classList.add('hidden');phase='play';return;}if(!player||player.type!=='kris'||phase!=='ultimate')return;
 const effects={fight:9,defesa:3,itens:11,piedade:9};
 if(!(kind in effects))return;
 player.ultimateBuff=kind;player.ultimateBuffTime=effects[kind];YG_AUDIO.play('krisForm',1.18);
 if(kind==='piedade'){player.hp=player.maxHp;makeParticles(player.x,player.y,'#94ffce',28,1.2);}
 if(kind==='defesa'){player.invuln=Math.max(player.invuln,.45);ring(player.x,player.y,35,'#7edcff');}
 if(kind==='itens'){makeParticles(player.x,player.y,'#b871ff',27,1.2);}
 if(kind==='fight'){makeParticles(player.x,player.y,'#ff5d7f',28,1.2);}
 bossMessage='SUPREMO · '+({fight:'FIGHT',defesa:'DEFESA',itens:'ITENS',piedade:'PIEDADE'}[kind]);bossMessageTimer=1.5;
 $('supremeScreen').classList.add('hidden');phase='play';updateHud();
}
function hurtPlayer(d,coopSource=currentCoopEnemy){
 // Dead co-op heroes are spectators. Damage can ONLY affect alive bodies.
 if(phase==='play'&&player?.type==='josue'&&player.hp>0&&player.ultimateTime>0&&Math.random()<.90){textPop(player.x,player.y-25,'FORA DO TEMPO','#9bf8db');return;}
 if(player&&player.mirrorGuard>0&&Math.random()<.5){textPop(player.x,player.y-25,'REFLEXO','#dfbbff');return;}
 if(player&&player.dodgeChance>0&&Math.random()<player.dodgeChance){textPop(player.x,player.y-25,'DODGE','#b4eeff');return;}

 if(phase!=='play'||!player||player.hp<=0||player.invuln>0||player.godShadowUntil-7>elapsed||
   (player.type==='loid'&&player.dashTime>0)||
   (player.ultimateBuff==='defesa'&&player.ultimateBuffTime>0))return;
 if(player.type==='abloy'&&(player.abActiveSpirits||[]).includes('gold')&&elapsed>=(player.abGuardAt||0)){player.abGuardAt=elapsed+12;player.shield=Math.max(player.shield||0,Math.round(15*(player.abGuard||1)));player.abCosmicUntil=Math.max(player.abCosmicUntil||0,elapsed+.55);ring(player.x,player.y,24,'#ffe4a4');}if(player.mimicGuardUntil>elapsed){player.mimicGuardUntil=0;player.mimicMarks=(player.mimicMarks||[]).concat({x:player.x,y:player.y,r:85,m:2.3,fx:'stun',color:'#ff5668',at:elapsed+.05,stage,charge:true});textPop(player.x,player.y-25,'CONTRA-ATAQUE','#ff8792');d*=.35;}if(player.mimicWardUntil>elapsed)d*=.70;if(player.mimicVeilUntil>elapsed)d*=.60;
 d=Math.max(1,d*hurt60(player)*coopDamageFactor(coopSource)*(currentNordicBossStrike?nordicBossDamageMultiplier():1)*(isPecador()?1.38:1)*(player.type==='mollitiam'&&player.mollitiamHeartTime>0?.60:1)*(1-player.armor)*(player.lastStand&&player.hp/player.maxHp<.4?1-player.lastStand:1));if(player.shield>0){const absorbed=Math.min(player.shield,d);player.shield-=absorbed;d-=absorbed;if(d<=0){textPop(player.x,player.y-20,'ESCUDO','#9ddfff');return;}}
 d*=(1-.35*realityPower(player,'mirrorSanctuary'))*(1-realityEnemyWeakness)*(1-Math.min(.65,.20*realityPower(player,'population')));player.hp=Math.max(0,player.hp-d);
 YG_AUDIO.play('hurt');player.invuln=player.type==='mollitiam'&&!isNordic()?.18:.76;
 // Never flash the host's camera for an attack on a distant guest.
 if(!coop.active||!coop.host||player===(coop.hostAvatar||player)){shake=4;flash=.12;}
 textPop(player.x,player.y-20,'-'+Math.ceil(d),'#ff738c','hero:'+ (coop.actorId||player.type));
 makeParticles(player.x,player.y,'#f2597e',8);
 if(player.hp<=0){
  player.hp=0;player.ghost=true;player.crossTp=null;player.dashTime=0;
  player.secondaryCharging=false;player.frogTime=0;player.darkAuraTime=0;
  player.ultimateTime=0;
  if(coop.active&&coop.host&&coopLivingHeroes().length>0){
   player.invuln=0;
   bossMessage='HERÓI CAÍDO · AGORA É FANTASMA';bossMessageTimer=1.7;
   if(player===coop.hostAvatar)updateHud();return;
  }
  YG_AUDIO.play('defeat');phase='over';
  $('endTitle').textContent='A RAIZ RESISTE';
  $('endText').textContent=`${coop.active?'A equipe':player.type==='loid'?'Loid':player.type==='cross'?'Xans':'Kris'} chegou à onda ${stage}. Uma nova tentativa pode começar.`;
  $('gameOverScreen').classList.remove('hidden');
 }
 if(!coop.active||!coop.host||player===coop.hostAvatar)updateHud();
}
function getMove(){if(coop.active&&coop.host&&coop.actorId){const a=coop.allies.get(coop.actorId);return a?norm(a.input.x,a.input.y):{x:0,y:0};}let x=mobileMove.x,y=mobileMove.y;if(keys.has('w')||keys.has('arrowup'))y-=1;if(keys.has('s')||keys.has('arrowdown'))y+=1;if(keys.has('a')||keys.has('arrowleft'))x-=1;if(keys.has('d')||keys.has('arrowright'))x+=1;return norm(x,y)}
function applyBoundaries(o,r=9){o.x=clamp(o.x,90+r,WORLD_W-90-r);o.y=clamp(o.y,148+r,WORLD_H-95-r);if(!enemies.includes(o))eventCollision60(o,r)}
function update(dt){elapsed+=dt;waveIntro=Math.max(0,waveIntro-dt);bossMessageTimer=Math.max(0,bossMessageTimer-dt);for(let i=frostBursts.length-1;i>=0;i--){frostBursts[i].life-=dt;if(frostBursts[i].life<=0)frostBursts.splice(i,1);}eclipseTime=Math.max(0,eclipseTime-dt);flash=Math.max(0,flash-dt);shake=Math.max(0,shake-dt*14);
for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;if(p.life<=0)particles.splice(i,1)}for(let i=slashes.length-1;i>=0;i--){slashes[i].life-=dt;if(slashes[i].life<=0)slashes.splice(i,1)}for(let i=rings.length-1;i>=0;i--){rings[i].life-=dt;if(rings[i].life<=0)rings.splice(i,1)}
for(let i=dashShadows.length-1;i>=0;i--){dashShadows[i].life-=dt;if(dashShadows[i].life<=0)dashShadows.splice(i,1)}
updateDamageFloats(dt);
if(phase!=='play'){if(merchant60()&&(!coop.active||coop.host))checkShopExit601();return;}
tickWorld60();
updateCardBeam(dt);updateXansSkulls(dt);applyTimeFields(dt);updateMirrorIllusions(dt);tickEveUltimate(dt);voidCollapse=Math.max(0,voidCollapse-dt);if(player.crossChain){player.crossChain.time-=dt;if(player.crossChain.time<=0)player.crossChain=null;}player.mirrorGuard=Math.max(0,(player.mirrorGuard||0)-dt);player.frogTime=Math.max(0,player.frogTime-dt);if(player.type==='kris'&&player.frogSkill&&player.frogUsed&&player.frogTime<=0){player.frogSkill=false;player.skillCd=0;}player.curseTime=Math.max(0,player.curseTime-dt);player.frostTime=Math.max(0,(player.frostTime||0)-dt);player.atkTime=Math.max(0,player.atkTime-dt);player.dashCd=Math.max(0,player.dashCd-dt);player.skillCd=Math.max(0,player.skillCd-dt);player.secondaryCd=Math.max(0,player.secondaryCd-dt);if(player.type==='kris'&&player.secondaryCharging)player.secondaryCharge=Math.min(1.6,player.secondaryCharge+dt);if(player.type==='cross')updateCrossBones(player,dt,coop.id);player.evePrimeTime=Math.max(0,(player.evePrimeTime||0)-dt);player.mollitiamHeartTime=Math.max(0,(player.mollitiamHeartTime||0)-dt);player.mollitiamPose=Math.max(0,(player.mollitiamPose||0)-dt);if(player.type==='mollitiam'&&player.mollitiamHeartTime>0){player.frostTime=0;player.curseTime=0;}player.ultimateTime=Math.max(0,player.ultimateTime-dt);player.ultimateBuffTime=Math.max(0,player.ultimateBuffTime-dt);player.invuln=Math.max(0,player.invuln-dt);player.transformTime=Math.max(0,player.transformTime-dt);player.darkAuraTime=Math.max(0,player.darkAuraTime-dt);
tickNewHero(player,dt);realityFields=realityFields.filter(f=>f.until>elapsed);let m=getMove(),moving=!!(mobileMove.x||mobileMove.y||['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].some(k=>keys.has(k)));
movingNow=moving||player.dashTime>0;footstepClock-=dt;if(moving&&player.dashTime<=0&&footstepClock<=0){footstepClock=.33;YG_AUDIO.play('footstep',.32);}
if(player.type==='cross'&&player.crossTp){updateCrossTeleport(player,dt);}
else if(player.dashTime>0){player.dashTime=Math.max(0,player.dashTime-dt);player.x+=player.dashV.x*(player.type==='eve'?590:340)*dt;player.y+=player.dashV.y*(player.type==='eve'?590:340)*dt;if(player.type==='loid'){dashGhostTimer-=dt;if(dashGhostTimer<=0){dashGhostTimer=.035;if(dashShadows.length>18)dashShadows.shift();dashShadows.push({x:player.x,y:player.y,face:player.face,step:player.step,life:.30,max:.30});}if(Math.random()<.75)makeParticles(player.x+rand(-6,6),player.y+rand(-8,4),'#301739',2,.5);}else if(player.shadowDash&&Math.random()<.5)makeParticles(player.x,player.y,'#ab6bf2',2)}else if(moving&&(player.hp>0||(coop.active&&coop.host))){let haste=player.type==='loid'&&player.ultimateTime>0?1.65:player.ultimateBuff==='piedade'&&player.ultimateBuffTime>0?1.5:1;const moveSpeed=player.hp<=0?116:player.speed*haste*newSpeed(player)*(player.evePrimeTime>0?2:1)*(player.curseTime>0?.78:1)*(player.frostTime>0?.72:1);player.x+=m.x*moveSpeed*dt;player.y+=m.y*moveSpeed*dt;player.step+=dt*11;player.aim=Math.atan2(m.y,m.x);}
if(moving){if(Math.abs(m.x)>Math.abs(m.y))player.face=m.x<0?'left':'right';else player.face=m.y<0?'up':'down';}
if(touchUI&&attackMobile&&!attackManualAim)mobileAutoAim(false);
if(mouseAim){player.aim=Math.atan2(mouseAim.y-player.y,mouseAim.x-player.x);}
applyBoundaries(player,8);camera.x+=((clamp(player.x-W/2,0,WORLD_W-W))-camera.x)*Math.min(1,dt*9);camera.y+=((clamp(player.y-H/2,0,WORLD_H-H))-camera.y)*Math.min(1,dt*9);
if(player.hp>0&&!player.crossTp&&(keys.has('j')||pointerDown||attackMobile))attack();
if(coop.active&&coop.host){for(const a of coop.allies.values())a.mirrorGuard=Math.max(0,(a.mirrorGuard||0)-dt);coopAdvance(dt);}
if(shadowClones.length)updateClones(dt);
if(player.hp>0&&player.type==='loid'&&player.darkAuraTime>0){
 player.darkAuraTick-=dt;
 if(player.darkAuraTick<=0){player.darkAuraTick=.47;
  for(const e of enemies){if(e.hp>0&&dist(e,player)<77+e.radius){hitEnemy(e,player.damage*.55*player.skillAmp);e.slow=Math.max(e.slow||0,.65);}}
  if(Math.random()<.6)makeParticles(player.x,player.y,'#30203e',4,.6);
 }
}
if(player.hp>0&&player.type==='loid'&&player.ultimateTime>0){
 player.ultimateTick-=dt;
 if(player.ultimateTick<=0){player.ultimateTick=.24;
  for(const e of enemies){if(e.hp>0&&dist(e,player)<185+e.radius){hitEnemy(e,player.damage*1.18*player.skillAmp);e.slow=Math.max(e.slow||0,.23);}}
  if(Math.random()<.45)makeParticles(player.x+rand(-90,90),player.y+rand(-60,60),'#21142e',2,.6);
 }
}
player.orbitTimer+=dt;if(player.hp>0&&player.orbiters>0&&player.orbitTimer>1.25){player.orbitTimer=0;let targets=enemies.filter(e=>e.hp>0&&dist(e,player)<98).sort((a,b)=>dist(a,player)-dist(b,player));for(let i=0;i<Math.min(player.orbiters,targets.length);i++){hitEnemy(targets[i],player.damage*.8);ring(targets[i].x,targets[i].y,13,'#a872f7');}}
for(const e of enemies){if(e.hp<=0)continue;eliteTick62(e,dt);if(siege62(e,dt)){e.hurt=Math.max(0,e.hurt-dt);e.slow=Math.max(0,(e.slow||0)-dt);continue;}if(phase!=='play')break;const previousX=e.x,previousY=e.y;const __hostPlayer=player;const liveTarget=nearestLivingHero(e);if(!liveTarget)continue;player=liveTarget;e.hurt=Math.max(0,e.hurt-dt);e.slow=Math.max(0,(e.slow||0)-dt);e.corruptTime=Math.max(0,(e.corruptTime||0)-dt);e.burnTime=Math.max(0,(e.burnTime||0)-dt);if(e.burnTime>0){e.burnTick=(e.burnTick||0)-dt;if(e.burnTick<=0){e.burnTick=.65;hitEnemy(e,player.damage*.23);}}if(e.hp<=0){player=__hostPlayer;continue;}e.attack-=dt*(isBossEnemy(e)&&nordicBossPecador()?1.22:1)*(isBossEnemy(e)?waveBalance.bossRate:1);if(e.stunTime>0){e.stunTime-=dt;player=__hostPlayer;continue;}let dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1,dir={x:dx/d,y:dy/d},spd=e.speed*(1-Math.min(.75,realityFields.reduce((v,f)=>dist(e,f)<f.radius?Math.max(v,.25*f.power):v,0)))*(e.slow>0?.4:e.corruptTime>0?.68:1)*(e.timeSlow>0?(isBossEnemy(e)?.7:.3):1);if(!Number.isFinite(e.step))e.step=0;if(!Number.isFinite(e.phase))e.phase=0;if(isBossEnemy(e))e.attackPose=Math.max(0,(e.attackPose||0)-dt);if(isBossEnemy(e)&&e.mode!=='charge'){e.face=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
e.face=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');currentNordicBossStrike=isBossEnemy(e)&&nordicBossPecador();currentCoopEnemy=isBossEnemy(e)?'boss':'mob';realityEnemyWeakness=fieldWeakness(e);if(e.secretUntil>elapsed){/* warning phase */}else if(e.secretKind==='divine'&&tickDivine61(e,dt)){/* celestial strike */}else if(e.type==='caster'){if(d>100){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt}else if(d<75){e.x-=dir.x*spd*dt}if(e.attack<=0){e.attack=rand(1.7,2.55);shoot(e,dir,85+stage*.9,13+stage*1.1,'#c586ff')}}
else if(e.type==='soulMirror'){updateSoulMirror(e,dt,d,dir,spd);}
else if(e.type==='boss'){updateSamurai(e,dt,d,dir,spd);}
else if(e.type==='reuni'){updateReuni(e,dt,d,dir,spd);}
else if(e.type==='tsukuomi'){updateTsukuomi(e,dt,d,dir,spd);}
else if(e.type==='pecado'){updatePecado(e,dt,d,dir,spd);}
else if(e.type==='pecadoEcho'){if(d>58){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.attack=1.6;if(d<64)hurtPlayer(isPecador()?13:9);slash(e.x,e.y,Math.atan2(dir.y,dir.x),44,'#f56d82');}}else if(e.attack<=0){e.windup=.55;ring(e.x,e.y,40,'#ff99ab');}if(d>125&&e.attack<=0){e.attack=2.4;shoot(e,dir,105,isPecador()?9:6,'#ff758f');}}
else if(e.type==='frostjarl'){updateFrostJarl(e,dt,d,dir,spd);}
else if(e.type==='nameless'){updateNameless(e,dt,d,dir,spd);}
else if(e.type==='odin'){updateOdin(e,dt,d,dir,spd);}
else if(e.type==='ancestralDragon'){updateAncestralDragon(e,dt,d,dir,spd);}
else if(e.type==='runeSeal'){e.attack=999;e.speed=0;}
else if(e.type==='runewitch'){if(d>145){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}else if(d<96){e.x-=dir.x*spd*.7*dt;e.y-=dir.y*spd*.7*dt;}if(e.attack<=0){e.attack=rand(1.7,2.6);const a=Math.atan2(dir.y,dir.x);for(const da of [-.26,0,.26])shoot(e,{x:Math.cos(a+da),y:Math.sin(a+da)},100+localNordicWave()*7,13+localNordicWave()*1.6,'#a5e7ff');ring(e.x,e.y,24,'#9bbfff');}}
else if(e.type==='frostwolf'){if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.chargeTime=.24;e.chargeDir=dir;e.hitCharge=false;}}else if(e.chargeTime>0){e.chargeTime-=dt;e.x+=e.chargeDir.x*spd*3.25*dt;e.y+=e.chargeDir.y*spd*3.25*dt;if(!e.hitCharge&&d<e.radius+12){e.hitCharge=true;hurtPlayer(17+localNordicWave()*1.9);}}else{if(d>32){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}if(e.attack<=0&&d<165){e.attack=1.8;e.windup=.43;ring(e.x,e.y,18,'#a6e8ff');}}}
else if(e.type==='berserker'){let furious=e.hp/e.maxHp<.47;if(furious)spd*=1.33;if(d>e.radius+10){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}if(d<e.radius+17&&e.attack<=0){e.attack=furious?.6:1.05;slash(e.x,e.y,Math.atan2(dir.y,dir.x),39,'#ff7665');hurtPlayer((furious?27:21)+localNordicWave()*2);}}
else if(e.type==='draugr'){if(d>e.radius+9){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}if(d<e.radius+15&&e.attack<=0){e.attack=1.48;e.windup=.14;slash(e.x,e.y,Math.atan2(dir.y,dir.x),32,'#c6eafb');hurtPlayer(16+localNordicWave()*1.5);}}
else if(e.type==='ghost'){
 // Ghosts glide through obstacles, retreat while shooting and appear/disappear subtly.
 const sway=Math.sin(elapsed*2.1+e.phase)*.42;
 if(d>77){e.x+=(dir.x-dir.y*sway)*spd*dt;e.y+=(dir.y+dir.x*sway)*spd*dt;}
 else if(d<54){e.x-=dir.x*spd*.6*dt;e.y-=dir.y*spd*.6*dt;}
 if(e.attack<=0){e.attack=rand(1.7,2.4);shoot(e,dir,110+stage,11+stage*.58,'#b28dff');}
}
else if(e.type==='yokai'){
 const side=Math.sin(elapsed*1.25+e.phase);
 if(d>98){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}
 else if(d<75){e.x-=dir.x*spd*.65*dt;e.y-=dir.y*spd*.65*dt;}
 e.x+=-dir.y*side*spd*.36*dt;e.y+=dir.x*side*spd*.36*dt;
 if(e.attack<=0){e.attack=rand(2.25,3.0);const ang=Math.atan2(dir.y,dir.x);for(const off of [-.21,0,.21])shoot(e,{x:Math.cos(ang+off),y:Math.sin(ang+off)},93+stage*.8,10+stage*.55,'#ef78dc');}
}
else if(e.type==='beast'){
 if(e.chargeTime>0){e.chargeTime-=dt;e.x+=e.chargeDir.x*spd*3.5*dt;e.y+=e.chargeDir.y*spd*3.5*dt;if(!e.hitCharge&&d<e.radius+12){e.hitCharge=true;hurtPlayer(14+stage*.75+(e.elite?7:0));}}
 else if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.chargeDir=dir;e.chargeTime=.26;e.hitCharge=false;ring(e.x,e.y,19,'#ae4bb8');}}
 else{if(d>27){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}if(e.attack<=0&&d<175){e.attack=rand(1.9,2.6);e.windup=.52;ring(e.x,e.y,21,'#a85ac7');}}
}
else{if(d>e.radius+8){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt}if(d<e.radius+12&&e.attack<=0){e.attack=e.type==='runner'?.95:1.3;hurtPlayer((e.type==='runner'?9+stage*.65:12+stage*.7)*(e.elite?1.4:1))}}
currentNordicBossStrike=false;currentCoopEnemy=null;realityEnemyWeakness=0;applyBoundaries(e,e.radius);const moved=Math.hypot(e.x-previousX,e.y-previousY);e.walking=moved>.12;if(e.walking)e.step+=Math.min(moved,10)*.24;player=__hostPlayer;}
if(phase==='over'){updateHud();return;}updateBossHazards(dt);for(let i=0;i<enemies.length;i++){let a=enemies[i];if(a.hp<=0)continue;for(let j=i+1;j<enemies.length;j++){let b=enemies[j];if(b.hp<=0)continue;let dx=b.x-a.x,dy=b.y-a.y,min=a.radius+b.radius+1;if(Math.abs(dx)>=min||Math.abs(dy)>=min)continue;let d=Math.hypot(dx,dy)||1;if(d<min){let push=(min-d)*.15;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push}}}
for(let i=projectiles.length-1;i>=0;i--){let b=projectiles[i];const td=b.from==='enemy'?(b.timeSlow??1):1;b.x+=b.vx*dt*td;b.y+=b.vy*dt*td;b.life-=dt;if(b.life<0||b.x<92||b.x>WORLD_W-92||b.y<148||b.y>WORLD_H-97){projectiles.splice(i,1);continue}if(b.from==='enemy'&&player.hp>0&&Math.hypot(b.x-player.x,b.y-player.y)<b.r+7){if(isNordic()&&b.color==='#a5e7ff'||isNordic()&&b.color==='#98eaff')player.frostTime=Math.max(player.frostTime||0,1.7);hurtPlayer(b.damage,null);makeParticles(b.x,b.y,b.color,7);projectiles.splice(i,1)}else if(b.from==='enemy'&&coop.active&&coop.host){const target=[...coop.allies.values()].find(p=>p.hp>0&&Math.hypot(b.x-p.x,b.y-p.y)<b.r+7);if(target){const old=player;player=target;if(isNordic()&&(b.color==='#98eaff'||b.color==='#a5e7ff'))target.frostTime=Math.max(target.frostTime||0,1.7);hurtPlayer(b.damage,null);player=old;makeParticles(b.x,b.y,b.color,7);projectiles.splice(i,1);}}else if(b.from==='player'){let hit=enemies.find(e=>e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.radius);if(hit){const prior=player;if(coop.active&&coop.host&&b.ownerId&&b.ownerId!==coop.id){player=coop.allies.get(b.ownerId)||player;}hitEnemy(hit,b.damage,b.abShot?!!b.abCharge:!b.mimicShot||b.mimicCharge);if(b.abBlast){ring(hit.x,hit.y,b.abBlast,'#e4e9ff');makeParticles(hit.x,hit.y,'#e8eaff',10);for(const other of enemies)if(other!==hit&&other.hp>0&&dist(other,hit)<b.abBlast+other.radius)hitEnemy(other,b.damage*.55,false);}if(b.mimicFx==='ice'&&hit.hp>0){hit.slow=Math.max(hit.slow||0,4);hit.stunTime=Math.max(hit.stunTime||0,isBossEnemy(hit)?.35:1.4);}if(b.mimicFx==='curse'&&hit.hp>0)hit.corruptTime=Math.max(hit.corruptTime||0,6);if(b.mimicFx==='fire'&&hit.hp>0&&player.mimicOrigin){ring(hit.x,hit.y,20,b.color);if(!(player.mimicMarks||[]).some(v=>v.fireId===hit.id&&v.stage===stage)){player.mimicMarks=(player.mimicMarks||[]).concat([.5,1.1].map(t=>({x:hit.x,y:hit.y,r:25,m:.35,fx:'fire',color:b.color,at:elapsed+t,stage,charge:false,fireId:hit.id}))).slice(-24);}}player=prior;if(b.mirror){YG_AUDIO.play('mirrorHit',.85);ring(b.x,b.y,28,'#e7c9ff');makeParticles(b.x,b.y,'#c8a2f4',12,.65);makeParticles(b.x,b.y,'#f7e7ff',6,.45);}if(b.bone==='azul'){hit.slow=Math.max(hit.slow||0,1.9);}if(b.bone==='laranja'){hit.burnTime=3.3;hit.burnTick=.3;}if(b.bone){makeParticles(hit.x,hit.y,b.color,12);ring(hit.x,hit.y,22,b.color);}projectiles.splice(i,1)}}}
for(const e of enemies)if(e.hp<=0&&isBossEnemy(e))captureMimicBoss(e);enemies=enemies.filter(e=>e.hp>0);
for(let i=healthDrops.length-1;i>=0;i--){const h=healthDrops[i];h.life-=dt;if(h.life<=0){healthDrops.splice(i,1);continue;}const target=(coop.active&&coop.host?[player,...coop.allies.values()]:[player]).find(p=>p.hp>0&&Math.hypot(h.x-p.x,h.y-p.y)<16);if(target){let gain=Math.min(Math.round(h.amount*(target.healAmp||1)),target.maxHp-target.hp);target.hp+=gain;if(gain>0){textPop(target.x,target.y-22,'+'+Math.round(gain)+' VIDA','#9af8a7');YG_AUDIO.play('card',.5);}healthDrops.splice(i,1);}}
// After killing the final Oni the player can explore for three real seconds.
// No countdown overlay appears; projectiles/hazards are removed for safety.
if(tickPortal602()){updateHud();return;}
if(enemies.length===0&&phase==='play'&&eventReady60()){
 if(waveClearTimer<0){waveClearTimer=3;projectiles=[];hazards=[];}
 else {waveClearTimer=Math.max(0,waveClearTimer-dt);if(waveClearTimer===0){waveClearTimer=-1;if(worldEvent60){finishEvent60();if(intermission601){continueIntermission601();updateHud();return;}}else if(offer601()){updateHud();return;}completeWave60();if(isCampaignFinalWave()){if(activeCampaign==='japan'&&isPecador()&&!testBossMode){realityVictory=true;unlockL0id();}if(activeCampaign==='nordic'&&!testBossMode){mimicVictory=true;unlockMimic();}phase='over';player.hp=player.maxHp;$('endTitle').textContent=activeCampaign==='nordic'?'REINO NÓRDICO CONQUISTADO!':'JAPÃO CONQUISTADO!';$('endText').textContent=activeCampaign==='nordic'?'Você derrotou Pecado no trono nórdico! O reino foi conquistado após vinte ondas.':'Você derrotou Pecado e concluiu a campanha do Japão! Escolha o Reino Nórdico pelo menu para outra jornada.';$('gameOverScreen').classList.remove('hidden');}else{phase='reward';showRewards();}}}
}
updateHud();}
// Boss state machine. Boss damages only when the visible warning resolves and the hitbox connects.
function startSamuraiMove(e){
 const moves=['eclipse','oni','blades','guard']; const type=moves[e.specialIndex++%moves.length];
 e.mode='windup';e.move=type;e.windup=e.rage?.58:.82;e.attack=e.rage?1.25:1.85;
 e.lockX=player.x;e.lockY=player.y;e.angle=Math.atan2(e.lockY-e.y,e.lockX-e.x);
 const labels={eclipse:'CORTE DO ECLIPSE',oni:'INVESTIDA ONI',blades:'CHUVA DE LÂMINAS',guard:'POSTURA DO SHOGUN'};
 bossMessage=labels[type];bossMessageTimer=1.4;YG_AUDIO.play('bossWarning',.95);
 if(type==='blades'){
  const spots=[{x:player.x,y:player.y},{x:player.x-46,y:player.y+19},{x:player.x+43,y:player.y-20},{x:player.x+12,y:player.y+49}];
  if(e.rage)spots.push({x:player.x-45,y:player.y-45},{x:player.x+49,y:player.y+39});
  for(const s of spots)hazards.push({type:'blade',x:clamp(s.x,100,WORLD_W-100),y:clamp(s.y,148,WORLD_H-100),r:e.rage?21:19,delay:e.windup,active:.33,done:false});
 }
 if(type==='guard'){YG_AUDIO.play('bossGuard');e.mode='guard';e.guardTime=e.rage?1.15:1.55; e.attack=e.guardTime+1.4;}
}
function updateSamurai(e,dt,d,dir,spd){
 if(!e.rage&&e.hp<e.maxHp*.49){e.rage=true;e.speed*=1.28;YG_AUDIO.play('bossRage',1.22);bossMessage='SEGUNDA FASE · IRA DO DAIMYŌ';bossMessageTimer=2.4;ring(e.x,e.y,57,'#ff396d');makeParticles(e.x,e.y,'#f34b87',38,1.5)}
 e.counterCd=Math.max(0,e.counterCd-dt);
 if(e.mode==='guard'){e.guardTime-=dt;if(e.guardTime<=0){e.mode='walk';e.attack=1.0;}return;}
 if(e.mode==='windup'){
  e.windup-=dt;
  if(e.windup<=0){
   e.attackPose=.78;
   if(e.move==='eclipse'){YG_AUDIO.play('bossEclipse',1.22);
    const dx=player.x-e.x,dy=player.y-e.y,distp=Math.hypot(dx,dy),ang=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(ang-e.angle),Math.cos(ang-e.angle));
    slash(e.x+Math.cos(e.angle)*21,e.y+Math.sin(e.angle)*21,e.angle,e.rage?84:71,'#ff3d67');ring(e.x,e.y,23,'#cf3d64');
    if(distp<(e.rage?86:75)&&Math.abs(diff)<1.02)hurtPlayer(e.rage?27:20);
    e.mode='walk';e.attack=.95;
   }else if(e.move==='oni'){YG_AUDIO.play('bossCharge',1.13);
    e.mode='charge';e.chargeTime=e.rage?.38:.32;e.chargeDir={x:Math.cos(e.angle),y:Math.sin(e.angle)};e.hitCharge=false;
   }else if(e.move==='blades'){YG_AUDIO.play('bossRain',1.12);e.mode='walk';e.attack=e.rage?1.1:1.4;}
  }
  return;
 }
 if(e.mode==='charge'){
  e.chargeTime-=dt;
  const travel=(e.rage?365:310)*dt;
  e.x+=e.chargeDir.x*travel;e.y+=e.chargeDir.y*travel;
  if(Math.hypot(player.x-e.x,player.y-e.y)<e.radius+8&&!e.hitCharge){e.hitCharge=true;hurtPlayer(e.rage?28:20)}
  if(Math.random()<.8)makeParticles(e.x,e.y,'#d73b70',1,1);
  if(e.chargeTime<=0){e.mode='walk';e.attack=1.05;ring(e.x,e.y,15,'#dc648c');}
  return;
 }
 if(d>47){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt}
 if(e.attack<=0)startSamuraiMove(e);
}

// REUNI: wave 10 unique blood boss. Fully deterministic behavior on main thread, capped summon count.
function spawnReuniOnis(e,count){
 let alive=enemies.filter(x=>x.hp>0&&['walker','runner','caster'].includes(x.type)).length;
 let free=Math.min(count,(isPecador()?13:9)-alive);if(free<=0)return;
 for(let i=0;i<free;i++){
  const ang=TAU*(i+.32)/Math.max(1,free)+elapsed*.18;
  const x=clamp(e.x+Math.cos(ang)*(39+i%3*9),104,WORLD_W-104);
  const y=clamp(e.y+Math.sin(ang)*(34+i%3*8),160,WORLD_H-106);
  const type=(i%4===3)?'caster':(i%2?'runner':'walker');
  const hp=(type==='runner'?38:type==='caster'?57:66)*(isPecador()?1.38:1)*waveBalance.mobHp;
  enemies.push({id:nextEnemyId++,type,x,y,hp,maxHp:hp,
   speed:(type==='runner'?84:type==='caster'?38:55)*(isPecador()?1.2:1),radius:11,
   attack:1.2+Math.random()*.7,hurt:0,step:0,face:'down'});
  ring(x,y,22,'#ed4164');makeParticles(x,y,'#db304f',7,.75);
 }
 YG_AUDIO.play('bossRage',.82);
}
function beginReuniAttack(e){
 const attacks=['claws','dash','rain','summon'];
 const type=attacks[e.specialIndex++%attacks.length];
 e.move=type;e.mode='windup';e.windup=e.rage?.42:.62;
 e.angle=Math.atan2(player.y-e.y,player.x-e.x);
 e.attack=e.rage?.8:1.28;
 const labels={claws:'GARRAS DE SANGUE',dash:'PERSEGUIÇÃO CARMESIM',rain:'DILÚVIO RUBRO',summon:'INVOCAÇÃO ONI'};
 bossMessage='REUNI · '+labels[type];bossMessageTimer=1.25;
 YG_AUDIO.play('bossWarning',1.0);
 if(type==='rain'){
  const targets=[{x:player.x,y:player.y}];
  const n=e.rage?(isPecador()?9:7):(isPecador()?6:4);
  for(let i=1;i<n;i++){
   const a=(i/n)*TAU+elapsed*.5,r=27+(i%3)*23;
   targets.push({x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r});
  }
  for(const p of targets)hazards.push({type:'blood',x:clamp(p.x,103,WORLD_W-103),y:clamp(p.y,160,WORLD_H-106),r:e.rage?22:19,delay:e.windup+.22+(Math.random()*.17),active:.28,done:false});
 }
}
function updateReuni(e,dt,d,dir,spd){
 if(!e.rage&&e.hp<e.maxHp*.48){
  e.rage=true;e.speed*=1.27;
  bossMessage='REUNI · FASE 2 — FÚRIA RUBRA';bossMessageTimer=3.0;
  ring(e.x,e.y,85,'#fa2346');makeParticles(e.x,e.y,'#ed234b',48,1.5);
  YG_AUDIO.play('bossRage',1.4);spawnReuniOnis(e,isPecador()?5:3);
 }
 e.summonTimer-=dt*waveBalance.bossRate;
 if(e.summonTimer<=0){e.summonTimer=e.rage?(isPecador()?5.1:6.3):(isPecador()?6.3:8.0);spawnReuniOnis(e,e.rage?(isPecador()?4:3):2);}
 if(e.mode==='windup'){
  e.windup-=dt;
  // The marked attack does not hurt the player before the visible warning finishes.
  if(e.windup<=0){
   e.attackPose=.78;
   if(e.move==='claws'){
    YG_AUDIO.play('bossEclipse',1.15);
    let ang=e.angle,r=e.rage?71:59;
    slash(e.x+Math.cos(ang)*22,e.y+Math.sin(ang)*22,ang,r,'#f93155');
    ring(e.x,e.y,22,'#c61d43');
    let diff=Math.atan2(Math.sin(Math.atan2(player.y-e.y,player.x-e.x)-ang),Math.cos(Math.atan2(player.y-e.y,player.x-e.x)-ang));
    if(d<r+9&&Math.abs(diff)<.9)hurtPlayer(e.rage?26:20);
    e.mode='walk';e.attack=e.rage?.5:.78;
   }else if(e.move==='dash'){
    e.mode='charge';e.chargeTime=e.rage?.47:.37;
    e.chargeDir={x:Math.cos(e.angle),y:Math.sin(e.angle)};e.hitCharge=false;YG_AUDIO.play('bossCharge',1.2);
   }else if(e.move==='rain'){
    e.mode='walk';e.attack=.9;YG_AUDIO.play('bossRain',1.15);
   }else if(e.move==='summon'){
    spawnReuniOnis(e,e.rage?(isPecador()?5:4):(isPecador()?4:3));
    e.mode='walk';e.attack=e.rage?.55:.9;
   }
  }
  return;
 }
 if(e.mode==='charge'){
  e.chargeTime-=dt;
  const step=(e.rage?430:355)*(isPecador()?1.12:1)*dt;
  e.x+=e.chargeDir.x*step;e.y+=e.chargeDir.y*step;
  if(Math.random()<.8)makeParticles(e.x,e.y,'#e72a56',2,.8);
  if(Math.hypot(player.x-e.x,player.y-e.y)<e.radius+8&&!e.hitCharge){e.hitCharge=true;hurtPlayer(e.rage?32:24);}
  if(e.chargeTime<=0){e.mode='walk';e.attack=.65;ring(e.x,e.y,17,'#f43f62');}
  return;
 }
 // He constantly pursues the player; there is no passive stationary phase.
 if(d>34){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}
 if(e.attack<=0)beginReuniAttack(e);
}


// TSUKUOMI — wave 15. Her lethal spells are always telegraphed; summons are capped.
function summonTsukuomi(e,n){
 const alive=enemies.filter(a=>a.hp>0&&!isBossEnemy(a)).length;
 const maxSummons=isPecador()?11:8;
 const num=Math.min(n,Math.max(0,maxSummons-alive));
 for(let i=0;i<num;i++){
  const a=TAU*(i+.2)/Math.max(1,num)+elapsed*.4;
  const x=clamp(e.x+Math.cos(a)*(51+(i%2)*22),100,WORLD_W-100);
  const y=clamp(e.y+Math.sin(a)*(48+(i%2)*19),155,WORLD_H-100);
  addMob(i%3===0?'beast':i%2?'yokai':'ghost',x,y,false,true);
  ring(x,y,28,'#bb83f9');makeParticles(x,y,'#a761e7',8,.85);
 }
}
function beginTsukuomiAttack(e){
 const choices=['gaze','void','summon','eclipse'];
 const move=choices[e.specialIndex++%choices.length];
 e.move=move;e.mode='windup';e.windup=e.rage?.57:.85;
 e.angle=Math.atan2(player.y-e.y,player.x-e.x);
 e.attack=e.rage?.9:1.6;
 bossMessage='TSUKUOMI · '+({gaze:'OLHAR DO VAZIO',void:'LUAS ABISSAIS',summon:'CORO FANTASMA',eclipse:'MANTO NOTURNO'}[move]);
 bossMessageTimer=1.6;YG_AUDIO.play('bossWarning',1);
 if(move==='void'){
  const n=e.rage?(isPecador()?10:7):(isPecador()?7:5);
  for(let i=0;i<n;i++){
   let angle=TAU*i/n+elapsed*.5;
   let r=i===0?0:33+(i%3)*24;
   hazards.push({type:'void',x:clamp(player.x+Math.cos(angle)*r,104,WORLD_W-104),y:clamp(player.y+Math.sin(angle)*r,155,WORLD_H-100),r:e.rage?24:20,delay:e.windup+i*.085,active:.34,done:false});
  }
 }
}
function updateTsukuomi(e,dt,d,dir,spd){
 if(!e.rage&&e.hp<e.maxHp*.5){
  e.rage=true;e.speed*=1.24;
  bossMessage='TSUKUOMI · FASE 2 — LUA ETERNA';bossMessageTimer=3;
  eclipseTime=5;ring(e.x,e.y,120,'#ac64ff');makeParticles(e.x,e.y,'#cda7ff',40,1.5);YG_AUDIO.play('bossRage',1.35);
  summonTsukuomi(e,isPecador()?5:3);
 }
 e.summonTimer-=dt*waveBalance.bossRate;
 if(e.summonTimer<=0){e.summonTimer=e.rage?(isPecador()?7:9):(isPecador()?10:12);summonTsukuomi(e,e.rage?3:2);}
 if(e.mode==='windup'){
  e.windup-=dt;
  if(e.windup<=0){
   e.attackPose=.78;
   if(e.move==='gaze'){
    const spread=e.rage?7:5;
    for(let i=0;i<spread;i++){
     const angle=e.angle+(i-(spread-1)/2)*(e.rage?.17:.21);
     shoot(e,{x:Math.cos(angle),y:Math.sin(angle)},(e.rage?168:145)*(isPecador()?1.08:1),e.rage?21:16,'#be83fd');
    }
    ring(e.x,e.y,52,'#bb73fb');
   }else if(e.move==='summon'){summonTsukuomi(e,e.rage?4:3);}
   else if(e.move==='eclipse'){
    eclipseTime=e.rage?6.2:4.7;
    for(let i=0;i<(e.rage?5:3);i++){
     const a=TAU*i/(e.rage?5:3)+elapsed;
     const x=clamp(player.x+Math.cos(a)*55,105,WORLD_W-105);
     const y=clamp(player.y+Math.sin(a)*50,155,WORLD_H-100);
     hazards.push({type:'void',x,y,r:23,delay:.55+i*.13,active:.35,done:false});
    }
   }
   e.mode='walk';e.attack=e.rage?.65:1.05;
  }
  return;
 }
 // Floats, retreats when too close and occasionally teleports a short distance.
 if(d>103){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}
 else if(d<75){e.x-=dir.x*spd*.68*dt;e.y-=dir.y*spd*.68*dt;}
 e.x+=(-dir.y)*Math.sin(elapsed*1.3)*spd*.28*dt;
 e.y+=(dir.x)*Math.sin(elapsed*1.3)*spd*.28*dt;
 if(e.attack<=0)beginTsukuomiAttack(e);
}


// PECADO — final wave 20; curses can reduce player damage & movement for 6s.
function applyCurse(seconds=6){if(player.invuln>0||(player.type==='loid'&&player.dashTime>0)||(player.ultimateBuff==='defesa'&&player.ultimateBuffTime>0))return;
 player.curseTime=Math.max(player.curseTime,seconds);textPop(player.x,player.y-40,'FRAQUEZA','#ff4a68');YG_AUDIO.play('bossWarning',.8);}
function pecadoSummon(e,n){
 const tuned=nordicBossPecador()&&stage===40;const count=enemies.filter(x=>x.hp>0&&!isBossEnemy(x)).length,cap=tuned?10:isPecador()?18:14;
 n=Math.max(0,Math.min(n,cap-count));
 for(let i=0;i<n;i++){
  let a=TAU*(i+.45)/Math.max(n,1)+elapsed*.3;
  const x=clamp(e.x+Math.cos(a)*(65+(i%2)*25),104,WORLD_W-106);
  const y=clamp(e.y+Math.sin(a)*(61+(i%2)*23),160,WORLD_H-105);
  addMob(i%3===0?'beast':i%3===1?'ghost':'yokai',x,y,i%5===0,true);
  ring(x,y,31,'#f13b48');
 }
}
// Ecos de antigos chefes: presentes SOMENTE na onda 20 do Nórdico.
// Eles são inimigos independentes com 25% da vida do chefe imitado.
function spawnPecadoEcho(e){
 if(stage!==40||!isNordic()||enemies.some(x=>x.hp>0&&x.type==='pecadoEcho'))return false;
 const choices=[['boss',2500],['reuni',3600],['tsukuomi',5100],['frostjarl',8200],['odin',6200]];
 const [echoBossType,originalHp]=choices[Math.floor(Math.random()*choices.length)];
 const a=rand(0,TAU),x=clamp(e.x+Math.cos(a)*85,104,WORLD_W-106),y=clamp(e.y+Math.sin(a)*85,160,WORLD_H-105);
 const hp=Math.round(originalHp*(nordicBossPecador()?.08*(1+.40*(waveBalance.players-1)):.25*(isPecador()?1.35:1)*waveBalance.mobHp));
 enemies.push({id:nextEnemyId++,type:'pecadoEcho',echoBossType,x,y,hp,maxHp:hp,speed:58,radius:14,
  attack:1.5,hurt:0,step:0,phase:0,face:'down',walking:false,elite:false,mode:'walk',windup:0});
 ring(x,y,44,'#ff526f');bossMessage='PECADO · ECO DE '+echoBossType.toUpperCase();bossMessageTimer=2.5;
 return true;
}
function pecadoMove(e){
 const cycle=['curse','bloodstorm','spear','summon','doom'];
 e.move=cycle[e.specialIndex++%cycle.length];e.mode='windup';e.windup=e.corruptionPhase===2?.48:e.corruptionPhase===1?.64:.85;
 e.angle=Math.atan2(player.y-e.y,player.x-e.x);e.attack=e.corruptionPhase===2?.5:.85;
 bossMessage='PECADO · '+({curse:'MALDIÇÃO DA FRAQUEZA',bloodstorm:'SANGUE CORROMPIDO',spear:'LANÇAS DO PECADO',summon:'SERVOS AMALDIÇOADOS',doom:'JUÍZO FINAL'}[e.move]);bossMessageTimer=1.8;YG_AUDIO.play('bossWarning',1.2);
 if(e.move==='bloodstorm'||e.move==='doom'){
  const n=e.move==='doom'?12:8;
  for(let i=0;i<n;i++){
   const a=TAU*i/n+(elapsed*.33),rad=i===0?0:36+(i%3)*29;
   hazards.push({type:'sin',x:clamp(player.x+Math.cos(a)*rad,110,WORLD_W-106),y:clamp(player.y+Math.sin(a)*rad,160,WORLD_H-104),r:e.move==='doom'?26:23,delay:e.windup+.08*i,active:.34,done:false});
  }
 }
}
function updatePecado(e,dt,d,dir,spd){
 const ratio=e.hp/e.maxHp;
 if(e.corruptionPhase<1&&ratio<=.70){e.corruptionPhase=1;e.speed*=1.18;e.rage=true;bossMessage='PECADO · SEGUNDA FASE · CORRUPÇÃO';bossMessageTimer=3;makeParticles(e.x,e.y,'#ff243e',55,1.9);ring(e.x,e.y,142,'#ff143d');YG_AUDIO.play('bossRage',1.4);pecadoSummon(e,nordicBossPecador()&&stage===40?4:isPecador()?7:5);if(stage===40)spawnPecadoEcho(e);}
 if(e.corruptionPhase<2&&ratio<=.35){e.corruptionPhase=2;e.speed*=1.24;bossMessage='PECADO · FASE FINAL · FIM DAS RAÍZES';bossMessageTimer=3.5;makeParticles(e.x,e.y,'#fd173b',70,2.2);ring(e.x,e.y,174,'#ff122f');YG_AUDIO.play('bossRage',1.55);pecadoSummon(e,nordicBossPecador()&&stage===40?6:isPecador()?10:7);if(stage===40)spawnPecadoEcho(e);}
 if(stage===40&&e.corruptionPhase>0){e.echoTimer=(e.echoTimer??17)-dt;if(e.echoTimer<=0){spawnPecadoEcho(e);e.echoTimer=isPecador()?14:19;}}
 e.summonTimer-=dt*waveBalance.bossRate;
 if(e.summonTimer<=0){const tuned=nordicBossPecador()&&stage===40;e.summonTimer=tuned?(e.corruptionPhase===2?8.5:e.corruptionPhase===1?10.5:13):(e.corruptionPhase===2?5.5:e.corruptionPhase===1?7.5:10.5);pecadoSummon(e,tuned?(e.corruptionPhase===2?3:2):(e.corruptionPhase===2?5:3));}
 if(e.mode==='windup'){
  e.windup-=dt;
  if(e.windup<=0){
   e.attackPose=.78;
   if(e.move==='curse'){
    let diff=Math.atan2(Math.sin(Math.atan2(player.y-e.y,player.x-e.x)-e.angle),Math.cos(Math.atan2(player.y-e.y,player.x-e.x)-e.angle));
    if(d<210&&Math.abs(diff)<.58){applyCurse(6.8);hurtPlayer(e.corruptionPhase===2?29:18);}
    for(let j=-2;j<=2;j++){let a=e.angle+j*.23;shoot(e,{x:Math.cos(a),y:Math.sin(a)},155+e.corruptionPhase*23,16+e.corruptionPhase*4,'#ff2146');}
   }else if(e.move==='spear'){
    const count=e.corruptionPhase===2?14:e.corruptionPhase===1?11:8;
    for(let j=0;j<count;j++){const a=TAU*j/count+(elapsed*.2);shoot(e,{x:Math.cos(a),y:Math.sin(a)},155+e.corruptionPhase*20,14+e.corruptionPhase*3,'#e32044');}
   }else if(e.move==='summon')pecadoSummon(e,nordicBossPecador()&&stage===40?(e.corruptionPhase===2?4:3):(e.corruptionPhase===2?8:5));
   else if(e.move==='doom'){const a=e.angle;slash(e.x+Math.cos(a)*40,e.y+Math.sin(a)*40,a,134,'#ff1737');if(d<130){applyCurse(8);hurtPlayer(26+e.corruptionPhase*10);}}
   e.mode='walk';e.attack=e.corruptionPhase===2?.45:.82;
  }
  return;
 }
 const s=Math.sin(elapsed*2+e.step);
 if(d>112){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}else if(d<73){e.x-=dir.x*spd*.54*dt;e.y-=dir.y*spd*.54*dt;}
 e.x-=dir.y*s*spd*.22*dt;e.y+=dir.x*s*spd*.22*dt;
 if(e.attack<=0)pecadoMove(e);
}

// NORDIC WAVE 15 (internal stage 35) — The Nameless Knight and his ancestral dragon.
// All hazards share the existing host-authoritative arena and warning renderer.
function namelessSeal(e){
 for(let i=0;i<3;i++){
  const a=i*TAU/3, x=clamp(e.x+Math.cos(a)*140,106,WORLD_W-106),y=clamp(e.y+Math.sin(a)*130,155,WORLD_H-105);
  enemies.push({id:nextEnemyId++,type:'runeSeal',x,y,hp:250,maxHp:250,speed:0,radius:17,step:0,phase:0,face:'down',attack:999,walking:false,hurt:0,mode:'idle'});
 }
}
// Odin — wave 10 Nordic (stage 30). Real timed spear/rune/crow attacks.
function updateOdin(e,dt,d,dir,spd){
 if(!e.rage&&e.hp<e.maxHp*.5){e.rage=true;e.speed*=1.16;ring(e.x,e.y,115,'#6ccaff');bossMessage='ODIN · O OLHO DAS NOVE RUNAS';bossMessageTimer=3;YG_AUDIO.play('bossRage',1.2);}
 if(e.mode==='windup'){
  e.windup-=dt;if(e.windup>0)return;
  e.attackPose=.78;
  const ang=e.angle,vx=Math.cos(ang),vy=Math.sin(ang);
  const num=e.rage?7:5;
  if(e.move==='spear'){for(let i=-Math.floor(num/2);i<=Math.floor(num/2);i++){const q=ang+i*.16;shoot(e,{x:Math.cos(q),y:Math.sin(q)},210,e.rage?21:16,'#6ccfff');}}
  else if(e.move==='thunder'){for(let i=0;i<(e.rage?7:4);i++){const a=i*TAU/(e.rage?7:4),r=i%2?50:90;hazards.push({type:'odin',x:clamp(player.x+Math.cos(a)*r,104,WORLD_W-104),y:clamp(player.y+Math.sin(a)*r,154,WORLD_H-104),r:25,delay:.65+i*.12,active:.34,done:false});}}
  else if(e.move==='raven'){for(let i=-2;i<=2;i++){const a=ang+i*.25;shoot(e,{x:Math.cos(a),y:Math.sin(a)},155,17,'#93acff');}}
  else if(e.move==='ward'){e.odinShield=3.5;ring(e.x,e.y,85,'#8aceff');}
  else if(e.move==='charge'){e.x=clamp(e.x+vx*110,104,WORLD_W-104);e.y=clamp(e.y+vy*110,155,WORLD_H-105);slash(e.x,e.y,ang,97,'#90c7ff');if(Math.hypot(player.x-e.x,player.y-e.y)<62)hurtPlayer(28);}
  e.odinFx=e.move;e.odinFxTime=.7;
  e.mode='walk';e.attack=.85;return;
 }
 e.odinFxTime=Math.max(0,(e.odinFxTime||0)-dt);
 e.odinShield=Math.max(0,(e.odinShield||0)-dt);
 if(d>95){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}else if(d<58){e.x-=dir.x*spd*.6*dt;e.y-=dir.y*spd*.6*dt;}
 if(e.attack<=0){e.move=['spear','thunder','raven','charge','ward'][e.specialIndex++%5];e.mode='windup';e.windup=e.rage?.72:1.0;e.angle=Math.atan2(dir.y,dir.x);e.attack=1.5;bossMessage='ODIN · '+({spear:'GUNGNIR',thunder:'TROVÕES DE ASGARD',raven:'CORVOS DE HUGINN E MUNINN',charge:'INVESTIDA DO PAI DE TODOS',ward:'ESCUDO DAS RUNAS'}[e.move]);bossMessageTimer=1.7;YG_AUDIO.play('bossWarning',1);}
}
function spawnAncestralDragon(knight){
 if(knight.dragonSpawned)return;
 knight.dragonSpawned=true;
 const hp=(isPecador()?3100:2150)*nordicBossHpMultiplier()*(coop.active&&coop.host?waveBalance.bossHp:1);
 const x=clamp(player.x+Math.min(45,W*.16),190,WORLD_W-190),y=clamp(player.y-100,265,WORLD_H-190);
 enemies.push({id:nextEnemyId++,type:'ancestralDragon',x,y,hp,maxHp:hp,radius:68,speed:0,attack:0,mode:'idle',phase:0,step:0,face:'left',walking:false,fireCd:2.2,fireTime:0,fireAngle:0,fireWindup:0,attackPose:0,hurt:0,rage:true,dragonIntro:2.7});
 ring(x,y,100,'#f97842');bossMessage='O DRAGÃO É UMA CRIATURA · FOGO SEM FIM';bossMessageTimer=3.4;
}
// Dragon is an actual independent boss actor: HP, collider, animation, attack timing,
// replicated by host. Constant volleys of fire, but never unavoidable damage.
function updateAncestralDragon(e,dt,d,dir,spd){
 e.dragonIntro=Math.max(0,(e.dragonIntro||0)-dt);
 e.fireTime=Math.max(0,(e.fireTime||0)-dt);
 if(e.dragonIntro>0)return;
 if((e.fireWindup||0)>0){
  e.fireWindup-=dt;if(e.fireWindup>0)return;
  e.mode='fire';e.fireTime=1.4;e.attackPose=.85;
  const aim=e.fireAngle;
  // A line of flame projectiles crosses the arena in repeated, dodgeable pulses.
  for(let i=-2;i<=2;i++){const ang=aim+i*.115;shoot({x:e.x,y:e.y-82},{x:Math.cos(ang),y:Math.sin(ang)},185+(isPecador()?28:0),14,'#ff7c32');}
  e.fireCd=e.hp/e.maxHp<.35?2.25:3.0;YG_AUDIO.play('bossRain',.9);
 }
 const knight=enemies.find(b=>b.type==='nameless'&&b.hp>0);if((knight?.pactBroken||0)>0){e.mode='idle';e.fireTime=0;e.fireWindup=0;e.fireCd=Math.max(e.fireCd||0,1.5);return;}
 e.fireCd=(e.fireCd||0)-dt*waveBalance.bossRate;
 if(e.fireCd<=0&&e.mode!=='windup'){
  e.mode='windup';e.fireWindup=1.05;e.fireAngle=Math.atan2(dir.y,dir.x);
  bossMessage='DRAGÃO ANCESTRAL · SOPRO DE FOGO!';bossMessageTimer=1.2;YG_AUDIO.play('bossWarning',.75);
 }
 if(e.mode==='fire'&&e.fireTime<=0)e.mode='idle';
}
function updateNameless(e,dt,d,dir,spd){
 if(!Number.isFinite(e.specialCd))e.specialCd=2.3;
 if(!Number.isFinite(e.pactBroken))e.pactBroken=0;
 e.pactBroken=Math.max(0,e.pactBroken-dt);
 e.dragonFxTime=Math.max(0,(e.dragonFxTime||0)-dt);
 if(!e.rage&&e.hp<=e.maxHp*.5){
  e.rage=true;e.dragonIntro=4.5;e.specialCd=4.5;e.speed*=1.12;
  bossMessage='O PACTO DESPERTA · DRAGÃO ANCESTRAL!';bossMessageTimer=4.5;
  ring(e.x,e.y,150,'#87d9ff');makeParticles(e.x,e.y,'#a3bdff',60,2);YG_AUDIO.play('bossRage',1.4);
  namelessSeal(e);spawnAncestralDragon(e);
 }
 if(!e.enraged&&e.hp<=e.maxHp*.15){e.enraged=true;e.speed*=1.15;bossMessage='ÚLTIMO JURAMENTO · FÚRIA DO DRAGÃO!';bossMessageTimer=3;YG_AUDIO.play('bossRage',1.5);ring(e.x,e.y,160,'#c2adff');}
 if((e.dragonIntro||0)>0){e.dragonIntro-=dt;return;}
 if(e.mode==='windup'){
  e.windup-=dt;
  if(e.windup>0)return;
  const move=e.move, a=e.angle, vx=Math.cos(a),vy=Math.sin(a);
  e.attackPose=.65;
  if(e.rage&&['breath','claws','marks','wings'].includes(move)){e.dragonFxMove=move;e.dragonFxTime=move==='breath'?1.0:1.25;}
  YG_AUDIO.play('bossCharge',1);
  if(move==='charge'){e.x=clamp(e.x+vx*112,102,WORLD_W-102);e.y=clamp(e.y+vy*112,155,WORLD_H-105);slash(e.x,e.y,a,105,'#ad9bff');if(Math.hypot(player.x-e.x,player.y-e.y)<85)hurtPlayer(34);}
  else if(move==='execution'){slash(e.x,e.y,a,126,'#e5d3ff');if(d<132&&Math.abs(Math.atan2(Math.sin(Math.atan2(dir.y,dir.x)-a),Math.cos(Math.atan2(dir.y,dir.x)-a)))<.6)hurtPlayer(48);}
  else if(move==='stomp'){ring(e.x,e.y,77,'#c1b5ff');if(d<77)hurtPlayer(22);}
  else if(move==='marks'||move==='claws'){
   for(let i=0;i<(move==='claws'?5:3);i++){const tx=clamp(player.x+rand(-85,85),105,WORLD_W-105),ty=clamp(player.y+rand(-80,80),155,WORLD_H-105);hazards.push({type:'dragon',x:tx,y:ty,r:move==='claws'?34:26,delay:.65+i*.16,active:.33,done:false});}
  }
  else if(move==='breath'){
   for(let i=-3;i<=3;i++){const z=a+i*.15;shoot(e,{x:Math.cos(z),y:Math.sin(z)},e.rage?160:125,32,'#9ac9ff');}
  }
  else if(move==='wings'){
   for(let i=0;i<9;i++){const z=TAU*i/9;shoot(e,{x:Math.cos(z),y:Math.sin(z)},125,14,'#bdb0ff');}
  }
  else if(move==='summon'){if(enemies.filter(n=>n.hp>0&&!isBossEnemy(n)&&n.type!=='runeSeal').length<9){for(let i=0;i<2;i++)addMob('draugr',clamp(e.x+rand(-85,85),105,WORLD_W-105),clamp(e.y+rand(-85,85),155,WORLD_H-105));}}
  e.mode='walk';e.attack=.85;e.specialCd=e.enraged?1.9:e.rage?2.7:3.6;return;
 }
 if(d>e.radius+33){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}
 else if(e.attack<=0){slash(e.x,e.y,Math.atan2(dir.y,dir.x),65,'#b4a0ff');hurtPlayer(e.rage?23:18);e.attack=1.25;e.attackPose=.65;}
 e.specialCd-=dt*waveBalance.bossRate;
 if(e.specialCd<=0){
  const moves=e.rage?['charge','claws','breath','execution','marks','wings','stomp','summon']:['charge','execution','stomp','marks'];
  e.move=moves[(e.specialIndex++)%moves.length];e.angle=Math.atan2(dir.y,dir.x);e.mode='windup';e.windup=e.move==='execution'?1.45:e.move==='breath'?1.8:1.05;
  bossMessage='INOMINÁVEL · '+({charge:'INVESTIDA DO CONDENADO',execution:'LÂMINA DA EXECUÇÃO',stomp:'PISOTEIO DE GUERRA',marks:'MARCAS DO JULGAMENTO',claws:'GARRAS CELESTES',breath:'SOPRO DRACÔNICO',wings:'ASAS DO CATACLISMO',summon:'CHAMADO DOS CONDENADOS'}[e.move]);bossMessageTimer=1.7;
  YG_AUDIO.play('bossWarning',1.2);
 }
}

// Stage 25 — Frozen Jarl. Attacks are telegraphed and synced by the host in co-op.
function updateFrostJarl(e,dt,d,dir,spd){
 if(!Number.isFinite(e.specialCd))e.specialCd=1.7; else e.specialCd-=dt*waveBalance.bossRate;
 const fury=e.hp<e.maxHp*.45;
 if(fury&&!e.rage){e.rage=true;e.speed*=1.18;bossMessage='JARL DO GELO · SEGUNDA FASE: INVERNO ETERNO';bossMessageTimer=3;ring(e.x,e.y,105,'#80dfff');makeParticles(e.x,e.y,'#bdf4ff',30,1.7);YG_AUDIO.play('bossRage',1.15);}
 if(e.mode==='windup'){
  e.windup-=dt;
  if(e.windup<=0){
   const move=e.move;e.attackPose=.75;frostBursts.push({x:e.x,y:e.y,angle:e.angle||0,kind:move,life:.66,max:.66});
   if(move==='blizzard'){for(let i=0;i<(e.rage?9:6);i++){let a=i*TAU/(e.rage?9:6)+e.phase;hazards.push({type:'ice',x:clamp(e.x+Math.cos(a)*rand(60,125),103,WORLD_W-103),y:clamp(e.y+Math.sin(a)*rand(60,125),154,WORLD_H-102),r:27,delay:.18+i*.045,active:.32,done:false});}YG_AUDIO.play('bossRain',.85);}
   else if(move==='shards'){let a=e.angle;for(let i=-2;i<=2;i++){const an=a+i*.23;shoot(e,{x:Math.cos(an),y:Math.sin(an)},e.rage?155:134,e.rage?24:19,'#98eaff');}YG_AUDIO.play('oniCast',1.15);}
   else if(move==='crush'){let count=e.rage?6:4;for(let i=0;i<count;i++){const ang=TAU*i/count;hazards.push({type:'ice',x:clamp(player.x+Math.cos(ang)*38,104,WORLD_W-104),y:clamp(player.y+Math.sin(ang)*38,154,WORLD_H-104),r:22,delay:.22+i*.12,active:.33,done:false});}YG_AUDIO.play('bossEclipse',.8);}
   else if(move==='summon'){let count=enemies.filter(a=>a.hp>0&&!isBossEnemy(a)).length;for(let i=0;i<(e.rage?3:2)&&count<14;i++){let a=rand(0,TAU);addMob(i%2?'draugr':'frostwolf',clamp(e.x+Math.cos(a)*75,102,WORLD_W-102),clamp(e.y+Math.sin(a)*75,156,WORLD_H-106));count++;}YG_AUDIO.play('bossRage',.7);}
   e.mode='walk';e.attack=e.rage?.8:1.2;ring(e.x,e.y,45,'#b8f1ff');
  }
  return;
 }
 if(d>e.radius+27){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt;}
 else if(e.attack<=0){hurtPlayer(e.rage?29:22);e.attack=.75;e.attackPose=.55;frostBursts.push({x:e.x,y:e.y,angle:Math.atan2(dir.y,dir.x),kind:'melee',life:.36,max:.36});slash(e.x,e.y,Math.atan2(dir.y,dir.x),74,'#b7efff');}
 if(e.specialCd<=0){e.specialCd=e.rage?1.9:2.6;e.move=['shards','blizzard','crush','summon'][e.specialIndex++%4];e.angle=Math.atan2(dir.y,dir.x);e.mode='windup';e.windup=e.rage?.58:.90;e.attackPose=.45;e.attack=1.6;bossMessage='JARL DO GELO · '+({shards:'LANÇAS GLACIAIS',blizzard:'CHUVA DE GELO',crush:'RUÍNA RÚNICA',summon:'CHAMADO DOS DRAUGRS'}[e.move]);bossMessageTimer=1.6;YG_AUDIO.play('bossWarning',1);}
}
function updateBossHazards(dt){
 for(let i=hazards.length-1;i>=0;i--){
  const h=hazards[i];h.delay-=dt;
  if(h.delay<=0){
   if(!h.done){h.done=true;h.active=.32;slash(h.x,h.y-Math.min(17,h.r),Math.PI/2,h.r*.9,h.type==='dragon'?'#91cfff':h.type==='ice'?'#8ce8ff':h.type==='sin'?'#ff1747':h.type==='void'?'#c38bff':h.type==='blood'?'#f8173e':'#f94b7f');makeParticles(h.x,h.y,h.type==='dragon'?'#aabfff':h.type==='ice'?'#c0f4ff':'#ff537d',8);for(const t of coop.active&&coop.host?[player,...coop.allies.values()]:[player]){if(t.hp<=0||Math.hypot(h.x-t.x,h.y-t.y)>=h.r+6)continue;const original=player;player=t;if(h.type==='sin')applyCurse(5);if(h.type==='ice'){t.frostTime=Math.max(t.frostTime||0,2.3);textPop(t.x,t.y-34,'GELADO','#c1f5ff');}hurtPlayer(h.type==='meteor'?(isPecador()?34:23):h.type==='sin'?(isPecador()?36:26):h.type==='void'?(isPecador()?30:22):h.type==='blood'?(isPecador()?25:20):h.type==='dragon'?35*nordicBossDamageMultiplier():h.type==='ice'&&isNordic()?((15+stage*.45)*nordicBossDamageMultiplier()):(15+stage*.45),'boss');player=original;}
   }
   h.active-=dt;if(h.active<=0)hazards.splice(i,1);
  }
 }
}
function drawBossWarnings(){
 if(phase!=='play')return;
 // Large readable strike VFX, visible on top of the arena floor for the full impact.
 for(const b of frostBursts){
  const t=1-b.life/b.max,opacity=Math.min(1,b.life/.15);
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle||0);ctx.globalAlpha=opacity;
  ctx.strokeStyle='#e6fcff';ctx.lineWidth=3;ctx.shadowColor='#79dfff';ctx.shadowBlur=lowFx()?0:13;
  const radius=b.kind==='melee'?75:b.kind==='crush'?95:120;
  ctx.beginPath();ctx.arc(0,0,radius*(.5+t*.5),-.64,.64);ctx.stroke();
  ctx.strokeStyle='#51bcff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,radius*(.42+t*.52),-.45,.45);ctx.stroke();
  if(b.kind==='crush'||b.kind==='blizzard'){ctx.strokeStyle='#b9f5ff';for(let j=-2;j<=2;j++){ctx.beginPath();ctx.moveTo(10,j*16);ctx.lineTo((80+t*40),j*29);ctx.stroke();}}
  ctx.restore();
 }

 for(const h of hazards){
  ctx.save();ctx.strokeStyle=h.type==='dragon'?'#8fceff':h.type==='ice'?'#a1edff':h.type==='sin'?'#ff153c':h.type==='void'?'#c48bff':h.type==='blood'?'#ff1e45':h.done?'#fff0e7':'#ff5476';ctx.fillStyle=h.type==='dragon'?'#9c8aff70':h.type==='ice'?'#8bcdf455':h.type==='sin'?'#df001c66':h.type==='void'?'#7030a34c':h.type==='blood'?'#a909324a':h.done?'#ff5a8666':'#f74a6047';ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,TAU);ctx.fill();ctx.stroke();
  if(h.type==='meteor'){ctx.strokeStyle='#ffc36a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,h.y,h.r*Math.max(.05,Math.min(1,h.delay/1.2)),0,TAU);ctx.stroke();if(h.done){ctx.fillStyle='#ff9b49';ctx.beginPath();ctx.arc(h.x,h.y,h.r*.65,0,TAU);ctx.fill();}}
  if(h.done){ctx.strokeStyle='#fff2f5';ctx.beginPath();ctx.moveTo(h.x-8,h.y-17);ctx.lineTo(h.x,h.y+16);ctx.lineTo(h.x+8,h.y-17);ctx.stroke();}
  ctx.restore();
 }
 for(const e of enemies){if(!isBossEnemy(e)||e.mode!=='windup')continue;
  ctx.save();ctx.fillStyle='#f3385652';ctx.strokeStyle='#fe6284';ctx.lineWidth=1.6;
  if(e.type==='ancestralDragon'){ctx.fillStyle='#ff793b48';ctx.strokeStyle='#ffc46e';const r=270;ctx.beginPath();ctx.moveTo(e.x,e.y-75);ctx.arc(e.x,e.y-75,r,e.fireAngle-.28,e.fireAngle+.28);ctx.closePath();ctx.fill();ctx.stroke();}
  else if(e.type==='odin'){ctx.fillStyle='#4fbcff33';ctx.strokeStyle='#a6eaff';ctx.lineWidth=2.7;ctx.beginPath();ctx.arc(e.x,e.y,100,0,TAU);ctx.fill();ctx.stroke();}
  else if(e.type==='frostjarl'){
   ctx.fillStyle='#80dcff42';ctx.strokeStyle='#bdf4ff';ctx.lineWidth=3;
   const radius=e.move==='blizzard'?135:e.move==='crush'?105:85;
   ctx.beginPath();ctx.arc(e.x,e.y,radius,0,TAU);ctx.fill();ctx.stroke();
   if(e.move==='shards'){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,185,e.angle-.52,e.angle+.52);ctx.closePath();ctx.fill();ctx.stroke();}
   if(e.move==='crush'){ctx.strokeStyle='#e4fdff';ctx.beginPath();ctx.arc(player.x,player.y,72,0,TAU);ctx.stroke();}
  }
  else if(e.type==='nameless'){ctx.fillStyle='#7b6ee455';ctx.strokeStyle='#c2aaff';ctx.lineWidth=3;if(e.move==='charge'||e.move==='execution'||e.move==='breath'){const r=e.move==='breath'?245:170;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,r,e.angle-(e.move==='execution'?.38:.5),e.angle+(e.move==='execution'?.38:.5));ctx.closePath();ctx.fill();ctx.stroke();}else{ctx.beginPath();ctx.arc(e.x,e.y,e.move==='stomp'?80:120,0,TAU);ctx.fill();ctx.stroke();}}
  else if(e.move==='curse'){const r=210;ctx.fillStyle='#f5193e55';ctx.strokeStyle='#ff5367';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,r,e.angle-.58,e.angle+.58);ctx.closePath();ctx.fill();ctx.stroke();}
  else if(e.move==='gaze'){const r=165;ctx.fillStyle='#8c43bf55';ctx.strokeStyle='#d59bfa';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,r,e.angle-.52,e.angle+.52);ctx.closePath();ctx.fill();ctx.stroke();}
  else if(e.move==='eclipse'&&e.type==='tsukuomi'){ctx.strokeStyle='#a37be5';ctx.beginPath();ctx.arc(e.x,e.y,125,0,TAU);ctx.stroke();}
  else if(e.move==='claws'){const r=e.rage?71:59;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,r,e.angle-.9,e.angle+.9);ctx.closePath();ctx.fill();ctx.stroke();}
  else if(e.move==='dash'){const px=Math.cos(e.angle),py=Math.sin(e.angle),nx=-py*16,ny=px*16,len=e.rage?150:135;ctx.beginPath();ctx.moveTo(e.x+nx,e.y+ny);ctx.lineTo(e.x+px*len+nx,e.y+py*len+ny);ctx.lineTo(e.x+px*len-nx,e.y+py*len-ny);ctx.lineTo(e.x-nx,e.y-ny);ctx.closePath();ctx.fill();ctx.stroke();}
  else if(e.move==='eclipse'){
   const r=e.rage?86:75;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,r,e.angle-1.02,e.angle+1.02);ctx.closePath();ctx.fill();ctx.stroke();
  }else if(e.move==='oni'){
   const a=e.angle,px=Math.cos(a),py=Math.sin(a),nx=-py*17,ny=px*17,len=135;ctx.beginPath();ctx.moveTo(e.x+nx,e.y+ny);ctx.lineTo(e.x+px*len+nx,e.y+py*len+ny);ctx.lineTo(e.x+px*len-nx,e.y+py*len-ny);ctx.lineTo(e.x-nx,e.y-ny);ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.restore();}
}

function shoot(e,vec,speed,damage,color){if(projectiles.length>155)return;YG_AUDIO.play('oniCast',.56);projectiles.push({x:e.x,y:e.y,vx:vec.x*speed,vy:vec.y*speed,life:3,r:3.5,damage:damage*coopDamageFactor(isBossEnemy(e)?'boss':currentCoopEnemy||'mob')*(1-fieldWeakness(e))*(isBossEnemy(e)?nordicBossDamageMultiplier():1),from:'enemy',color});}
function drawR(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function drawMap(){if(defense62&&player){drawTree62();return;}if(worldEvent60){drawEvent60();return;}
 const activeArena=isNordic()?NORDIC_ARENA:ARENA;
 if(activeArena.complete&&activeArena.naturalWidth){
  const sx=Math.round(camera.x),sy=Math.round(camera.y);
  ctx.drawImage(activeArena,sx,sy,W,H,sx,sy,W,H);
  ctx.fillStyle=isNordic()?'rgba(5,22,43,.15)':stage===20?'rgba(142,0,8,.66)':'#07071126';ctx.fillRect(sx,sy,W,H);
  if(stage===20){ctx.fillStyle='rgba(255,25,40,.09)';ctx.fillRect(sx,sy,W,H);}
 }else{
  ctx.fillStyle='#211e30';ctx.fillRect(0,0,WORLD_W,WORLD_H);
 }
 // Sparse drifting snow in the Nordic kingdom, falling leaves in Japan.
 for(let i=0;i<(coop.active&&lowFx()?8:24);i++){
  const px=(123+i*127+Math.sin(elapsed*.45+i)*10)%WORLD_W;
  const py=(187+i*151+elapsed*11)%WORLD_H;
  if(px<camera.x-10||px>camera.x+W+10||py<camera.y-10||py>camera.y+H+10)continue;
  ctx.globalAlpha=.48;drawR(px,py,2,2,isNordic()?(i%2?'#bdeafa':'#e9faff'):(i%2?'#c33d56':'#e9a58a'));
 }
 ctx.globalAlpha=1;
}
function shiftColor(hex,step){let n=parseInt(hex.slice(1),16),r=clamp((n>>16)+step,0,255),g=clamp(((n>>8)&255)+step,0,255),b=clamp((n&255)+step,0,255);return `rgb(${r},${g},${b})`}
function spritePixel(x,y,a,b=1,c=1){if(typeof a==='string')drawR(x,y,b,c,a);else drawR(x,y,a,b,c)}
function heroSprite(x,y,type,face='down',step=0,transform=false,scale=1,actor=null){
 const shown=actor||player;
 if(type==='abloy'){ctx.save();if(shown?.mimicOrigin)ctx.filter='sepia(.5) saturate(2) hue-rotate(315deg)';drawAbloy61(x,y,face,step,scale,shown);ctx.restore();return;}
 if(type==='mimic'&&shown?.mimicBoss&&MIMIC_BOSSES[shown.mimicBoss]){ctx.save();ctx.translate(x,y);const size=shown.mimicBoss==='ancestralDragon'?.37:shown.mimicBoss==='frostjarl'?.55:.75;ctx.scale(size*scale,size*scale);ctx.filter='sepia(.35) saturate(1.5) drop-shadow(0 0 3px #ff4058)';enemySprite({type:shown.mimicBoss,x:0,y:0,face,step,walking:!!shown.moving,attackPose:shown.atkTime||0,mode:'idle',radius:20,hp:1,maxHp:1,mimicVisual:true});ctx.restore();return;}
 const frogActive=type==='kris'&&shown&&shown.frogTime>0;const copied=shown?.mimicOrigin&&shown.type===type&&type!=='mimic';const alt=copied?getMimicArt(frogActive?'kris_frog':type):null;const im=alt?.complete&&alt.naturalWidth?alt:(frogActive?FROG:HERO[type]);if(!im||!im.complete||!im.naturalWidth)return;
 if(copied){ctx.save();ctx.strokeStyle='#ff304b';ctx.globalAlpha*=.75;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y-2,17*scale,6*scale,0,0,TAU);ctx.stroke();ctx.restore();}
 if(type==='mimic'){
  const a=shown?.type==='mimic'?shown:{};const duration=(a.attackDelay||.48)*newAttackDelay(a),age=Math.max(0,duration-(a.atkTime||0)),attacking=(a.atkTime||0)>0&&age<.24;
  const aim=Number.isFinite(a.aim)?a.aim:({down:Math.PI/2,up:-Math.PI/2,left:Math.PI,right:0}[face]??0);
  const attackFace=Math.abs(Math.cos(aim))>Math.abs(Math.sin(aim))?(Math.cos(aim)<0?'left':'right'):(Math.sin(aim)<0?'up':'down');
  const row=({down:0,left:1,right:2,up:3}[attacking?attackFace:face]??0);
  const walking=a===player?movingNow:typeof a.moving==='boolean'?a.moving:a._renderStep!==undefined&&a._renderStep!==step;a._renderStep=step;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
  if(attacking&&MIMIC_ATTACK.complete&&MIMIC_ATTACK.naturalWidth){const size=224*40/112;ctx.drawImage(MIMIC_ATTACK,0,row*224,224,224,-size/2,-184*40/112,size,size);}
  else{const col=walking?[0,1,0,2][Math.floor(step)%4]:0;ctx.drawImage(im,col*112,row*112,112,112,-20,-35,40,40);}
  ctx.restore();return;
 }
 if(type==='josue'){
  const a=shown||{},duration=(a.attackDelay||.48)*newAttackDelay(a),age=Math.max(0,duration-(a.atkTime||0)),attacking=(a.atkTime||0)>0&&age<.27;
  const walking=a===player?movingNow:typeof a.moving==='boolean'?a.moving:a._renderStep!==step;a._renderStep=step;
  const aim=Number.isFinite(a.aim)?a.aim:({down:Math.PI/2,up:-Math.PI/2,left:Math.PI,right:0}[face]??0);
  const attackFace=Math.abs(Math.cos(aim))>Math.abs(Math.sin(aim))?(Math.cos(aim)<0?'left':'right'):(Math.sin(aim)<0?'up':'down');
  const row=({down:0,left:1,right:2,up:3}[attacking?attackFace:face]??0),col=attacking?1:walking?[1,0,1,2][Math.floor(step)%4]:1;
  const size=40;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(im,col*112,row*112,112,112,-size/2,-34,size,size);
  if(attacking){const t=Math.min(1,age/.27),extension=.18+.82*Math.sin(Math.PI*t),reach=(a.reach||92)*extension;
   for(const side of [-1,1]){const ang=aim+(t-.5)*1.35+side*.23,hx=Math.cos(aim+side*Math.PI/2)*6,hy=-12+Math.sin(aim+side*Math.PI/2)*4,ex=Math.cos(ang)*Math.max(8,reach-13),ey=-12+Math.sin(ang)*Math.max(8,reach-13),bend=side*9*Math.sin(Math.PI*t);
    ctx.strokeStyle='#201c21';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo((hx+ex)/2+Math.cos(ang+Math.PI/2)*bend,(hy+ey)/2+Math.sin(ang+Math.PI/2)*bend,ex,ey);ctx.stroke();ctx.strokeStyle='#c8c3b8';ctx.lineWidth=1.7;ctx.setLineDash([3,2]);ctx.stroke();ctx.setLineDash([]);
    ctx.save();ctx.translate(ex,ey);ctx.rotate(ang);ctx.fillStyle='#ddd8cb';ctx.strokeStyle='#3b3036';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-2.8);ctx.lineTo(13,0);ctx.lineTo(0,2.8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
   }
  }
  if(a.ultimateTime>0||josueFury(a)||josueAscend(a)){ctx.strokeStyle=a.ultimateTime>0?'#7df9d9':'#f0774d';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,-5,14,5,0,0,TAU);ctx.stroke();}ctx.restore();return;
 }
 if(type==='moretti'||type==='l0id'||type==='l0idShadow'){const a=shown||{},pose=a.newPose;const moving=a===player?movingNow:typeof a.moving==='boolean'?a.moving:a.clone||a._renderStep!==a.step;a._renderStep=a.step;const row=pose&&pose.until>elapsed?pose.row:moving?(a.dashTime>0||type.startsWith('l0id')?2:1):0;const col=Math.floor((pose&&pose.until>elapsed?elapsed*12:moving?step:elapsed*3)%4);ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(face==='left'?-scale:scale,scale);ctx.imageSmoothingEnabled=false;const size=type==='moretti'?62:82;ctx.drawImage(im,col*192,row*192,192,192,-size/2,-size+size/24,size,size);ctx.restore();return;}
 if(type==='mollitiam'){
  const shownActor=shown||{},actorWalking=shownActor===player?movingNow:!!shownActor.moving;const row=shownActor.mollitiamPose>0?(shownActor.ultimateTime>0||shownActor.mollitiamHeartTime>0?3:2):shownActor.ultimateTime>0||shownActor.mollitiamHeartTime>0?3:actorWalking?1:0;
  const col=shownActor.mollitiamPose>0?Math.min(3,Math.floor((1-shownActor.mollitiamPose)*7)%4):actorWalking?Math.floor(step*.7)%4:Math.floor(elapsed*2.2)%4;
  const giant=shownActor.ultimateTime>0;const size=giant?102:78;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(im,col*320,row*320,320,320,-size/2,-size+10,size,size);ctx.imageSmoothingEnabled=true;
  if(giant||shownActor.mollitiamHeartTime>0){ctx.strokeStyle=giant?'#ffc261':'#adf17b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-size*.42,size*.43,size*.48,0,0,TAU);ctx.stroke();}
  ctx.restore();return;
 }
 const row={down:0,left:1,right:2,up:3}[face]??0;
 const walk=(shown===player?movingNow:!!shown?.moving)&&(phase==='play'||phase==='coop');const sequence=[1,0,1,2];
 const col=walk?sequence[Math.floor(step*1.15)%sequence.length]:1;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
 if(transform&&!lowFx()){
   ctx.shadowBlur=18;ctx.shadowColor='#9a52ff';ctx.fillStyle='#6a2db588';
   ctx.beginPath();ctx.ellipse(0,-13,17,20,0,0,TAU);ctx.fill();ctx.shadowBlur=0;
 }
 // Loid retains the original sprite; Kris now uses the corrected slim-legged 12-frame sheet.
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(im,col*112,row*112,112,112,frogActive?-23:-20,frogActive?-39:-34,frogActive?46:40,frogActive?46:40);ctx.imageSmoothingEnabled=true;
 if(frogActive){ctx.restore();return;}
 if(shown&&shown.type==='cross'&&shown.ultimateBuff==='cross'&&shown.ultimateBuffTime>0){ctx.shadowColor='#b375ff';ctx.shadowBlur=lowFx()?0:14;ctx.strokeStyle='#ab76ed';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-15,25,28,0,0,TAU);ctx.stroke();ctx.shadowBlur=0;}
 if(shown&&shown.type==='kris'&&shown.ultimateBuffTime>0){
  const k=shown.ultimateBuff;
  ctx.strokeStyle=k==='defesa'?'#99e6ff':k==='piedade'?'#91f9c5':k==='fight'?'#ff617d':'#b47dff';ctx.lineWidth=2;
  if(k==='defesa'){ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(0,-17,21,25,0,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
  if(k==='itens'){
   // Two blades beside the character, rather than replacing the sprite animation.
   ctx.strokeStyle='#24172b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-11,-27);ctx.lineTo(-24,-43);ctx.moveTo(11,-27);ctx.lineTo(24,-43);ctx.stroke();
   ctx.strokeStyle='#ac72fa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-11,-27);ctx.lineTo(-24,-43);ctx.moveTo(11,-27);ctx.lineTo(24,-43);ctx.stroke();
  }
 }

 if(transform){
   ctx.strokeStyle='#b573ff';ctx.lineWidth=2;ctx.beginPath();
   ctx.moveTo(-9,-26);ctx.lineTo(-16,-43);ctx.lineTo(-3,-34);
   ctx.moveTo(9,-26);ctx.lineTo(16,-43);ctx.lineTo(3,-34);ctx.stroke();
   ctx.globalAlpha=.6;ctx.strokeStyle='#dd7dff';ctx.beginPath();
   ctx.arc(0,-17,22,elapsed*2,elapsed*2+1.8);ctx.stroke();
 }
 ctx.restore();
}
function safeWalkFrame(e,cols=3,mult=1){
 const count=Math.max(1,Math.floor(cols));
 const step=Number.isFinite(e.step)?e.step:0;
 const phase=Number.isFinite(e.phase)?e.phase:0;
 const raw=Math.floor(step*mult+phase);
 return ((raw%count)+count)%count;
}
// Each boss has a separate visible attack pose. The Japan sheets contain
// three drawn frames per direction (not dedicated attack sheets), so we pair
// the existing poses with a physical lunge and weapon FX. The knight, Jarl,
// and dragon use their original dedicated attack frames instead.
function bossAttackActive(e){return e.mode==='windup'||e.mode==='charge'||e.mode==='guard'||(e.attackPose||0)>0;}
function japaneseBossFrame(e){
 if(e.mode==='windup')return [1,2,0,2][Math.floor(elapsed*9)%4];
 if(e.mode==='charge')return [2,1,0][Math.floor(elapsed*15)%3];
 if((e.attackPose||0)>0)return [2,0,1][Math.floor(elapsed*11)%3];
 if(e.walking)return [0,1,2,1][safeWalkFrame(e,4,1.35)];
 return 1;
}
function bossVisualLunge(e){
 if(e.mode==='charge')return 5;
 if(e.mode==='windup')return -3;
 if((e.attackPose||0)>0)return Math.sin(elapsed*23)*3.8;
 return 0;
}
// Both sprites use 4×4 atlases with independently bounded 320×320 cells.
// This routine never samples outside a frame, even on an incomplete network snapshot.
function drawNordicAtlasFrame(img,frame,x,y,w,h=w){
 if(!img||!img.complete||!img.naturalWidth||!img.naturalHeight)return false;
 // Only the real atlas is divided into 16 pieces. If its optional fallback
 // is in use, paint the whole image rather than cropping a nonexistent grid.
 if(img.naturalWidth!==1280||img.naturalHeight!==1280){
   ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight,x,y,w,h);
   return true;
 }
 const index=((Math.floor(Number.isFinite(frame)?frame:0)%16)+16)%16;
 const fw=320,fh=320;
 ctx.drawImage(img,(index%4)*fw,Math.floor(index/4)*fh,fw,fh,x,y,w,h);
 return true;
}
// Explicit pose timing: attack animation follows the real attack progress,
// not a global clock that can show random idle frames during a strike.
function namelessKnightFrame(e){
 if((e.dragonIntro||0)>0)return 12+Math.min(3,Math.floor((4.5-e.dragonIntro)/1.125));
 if(e.mode==='windup'){
  const duration=e.move==='execution'?1.45:e.move==='breath'?1.8:1.05;
  const progress=clamp(1-(e.windup||0)/duration,0,.999);
  return 8+Math.floor(progress*4);
 }
 if((e.attackPose||0)>0)return 8+Math.min(3,Math.floor((1-(e.attackPose||0)/.65)*4));
 if(e.walking)return 4+safeWalkFrame(e,4,1.5);
 return Math.floor(elapsed*2.5)%4;
}
function namelessDragonFrame(e){
 if((e.dragonIntro||0)>0)return Math.min(3,Math.floor((4.5-e.dragonIntro)/1.125));
 if(e.mode==='windup'&&e.move==='breath')return 8+Math.min(1,Math.floor(clamp(1-e.windup/1.8,0,.999)*2));
 if((e.dragonFxTime||0)>0){
  if(e.dragonFxMove==='breath')return 10+Math.min(1,Math.floor(clamp(1-e.dragonFxTime/1.0,0,.999)*2));
  if(e.dragonFxMove==='claws'||e.dragonFxMove==='marks')return 12+Math.min(2,Math.floor(clamp(1-e.dragonFxTime/1.25,0,.999)*3+1e-8));
  if(e.dragonFxMove==='wings')return 4+Math.min(3,Math.floor(clamp(1-e.dragonFxTime/1.25,0,.999)*4));
 }
 return Math.floor(elapsed*3.7)%8;
}
function drawNamelessDragon(){
 // Giant dragon is rendered as a real enemy in enemySprite, sorted by feet.
}
function enemySprite(e){
 if(e.type==='soulMirror'){ctx.save();ctx.filter='brightness(.75) saturate(1.4) drop-shadow(0 0 4px #ff4f8c)';heroSprite(e.x,e.y,e.copyHero||'loid',e.face,e.step,false,1.25,{type:e.copyHero,moving:e.walking,abCosmicUntil:elapsed+.3});ctx.restore();return;}
 const img=ENEMY_ART[e.echoBossType||e.type];
 if(isBossEnemy(e)&&(!img||!img.complete||!img.naturalWidth)){
  // A missing upload should never turn an enemy into an invisible hitbox.
  ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#361e4f';ctx.strokeStyle='#e5a8ff';
  ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-32,25,37,0,0,TAU);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffffff';ctx.font='bold 9px system-ui';ctx.textAlign='center';
  ctx.fillText('BOSS',0,-31);ctx.restore();return;
 }
 if(e.type==='pecadoEcho'&&(!img||!img.complete||!img.naturalWidth)){ctx.save();ctx.fillStyle='#fc6689';ctx.beginPath();ctx.arc(e.x,e.y-20,15,0,TAU);ctx.fill();ctx.restore();return;}
 if(img&&img.complete&&img.naturalWidth){
  ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y));
  if(e.type==='pecadoEcho'){
   const sz=54,row={down:0,left:1,right:2,up:3}[e.face||'down']??0;
   ctx.fillStyle='#0b0c19bb';ctx.beginPath();ctx.ellipse(0,0,19,5,0,0,TAU);ctx.fill();
   ctx.imageSmoothingEnabled=false;
   if(e.echoBossType==='odin')drawNordicAtlasFrame(img,e.walking?4+safeWalkFrame(e,4,1):0,-sz/2,-sz+8,sz,sz);
   else if(e.echoBossType==='frostjarl')ctx.drawImage(img,(e.walking?safeWalkFrame(e,4,1):0)*256,0,256,256,-sz/2,-sz+8,sz,sz);
   else ctx.drawImage(img,(e.walking?safeWalkFrame(e,3,1):0)*112,row*112,112,112,-sz/2,-sz+8,sz,sz);
   ctx.imageSmoothingEnabled=true;ctx.strokeStyle='#ff607f';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(0,-22,24,27,0,0,TAU);ctx.stroke();
  }else if(e.type==='ancestralDragon'){
   const sz=touchUI?clamp(Math.min(W*.82,H*.65),160,215):215;
   ctx.fillStyle='#120e1d93';ctx.beginPath();ctx.ellipse(0,-5,85,22,0,0,TAU);ctx.fill();
   const frm=e.mode==='windup'?8+Math.floor(elapsed*5)%2:e.fireTime>0?10+Math.floor(elapsed*7)%2:(e.dragonIntro||0)>0?Math.min(3,Math.floor((2.7-e.dragonIntro)/.675)):Math.floor(elapsed*3)%8;
   drawNordicAtlasFrame(DRAGON_ART.complete&&DRAGON_ART.naturalWidth?DRAGON_ART:DRAGON_FALLBACK,frm,-sz/2,-sz+10,sz,sz);
   if(e.fireTime>0){ctx.save();ctx.globalAlpha=.8;ctx.strokeStyle='#ff9a35';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,-sz*.52,65,elapsed*7,elapsed*7+1.35);ctx.stroke();ctx.restore();}
  }else if(e.type==='odin'){
   const sz=108,frame=e.mode==='windup'?8+Math.min(3,Math.floor(elapsed*9)%4):(e.attackPose||0)>0?8+Math.floor(elapsed*11)%4:e.walking?4+safeWalkFrame(e,4,1):Math.floor(elapsed*2.2)%4;
   ctx.fillStyle='#0b1f3288';ctx.beginPath();ctx.ellipse(0,0,34,11,0,0,TAU);ctx.fill();
   ctx.save();if(e.face==='left')ctx.scale(-1,1);drawNordicAtlasFrame(img,frame,-sz/2,-sz+8,sz,sz);ctx.restore();
   if(e.odinFxTime>0&&ODIN_SPELLS.complete&&ODIN_SPELLS.naturalWidth){const idx=e.odinFx==='thunder'?7:e.odinFx==='raven'?8:e.odinFx==='ward'?14:0;ctx.globalAlpha=Math.min(.85,e.odinFxTime/.5);drawNordicAtlasFrame(ODIN_SPELLS,idx,-70,-132,140,140);ctx.globalAlpha=1;}
  }else if(e.type==='nameless'){
   // Human-sized knight, unlike the colossal dragon at the back of the arena.
   const sz=88, bob=e.walking?Math.abs(Math.sin((e.step||0)*.9))*2.1:Math.sin(elapsed*2)*.65;
   ctx.fillStyle='#080a1aa0';ctx.beginPath();ctx.ellipse(0,0,26,8,0,0,TAU);ctx.fill();
   ctx.save();if(e.face==='left')ctx.scale(-1,1);
   if(e.rage){ctx.shadowColor='#8ebaff';ctx.shadowBlur=lowFx()?0:13;}
   drawNordicAtlasFrame(img,namelessKnightFrame(e),-sz/2,-sz+9-bob,sz,sz);
   ctx.restore();
   if(e.mode==='windup'){ctx.strokeStyle='#b9e8ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-39,45,elapsed*4,elapsed*4+1.6);ctx.stroke();}
  }else if(e.type==='runeSeal'){ctx.strokeStyle='#a5f1ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-15,21,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(-10,-16);ctx.lineTo(0,-35);ctx.lineTo(10,-16);ctx.lineTo(0,5);ctx.closePath();ctx.stroke();}
  else if(e.type==='frostjarl'){
   // 4×4 atlas: frames 0–7 idle/walk, 8–11 axe swings, 12–15 ice magic.
   // Never use e.phase directly; some network snapshots omit it.
   const attack=e.mode==='windup'||(e.attackPose||0)>0;
   const magic=['shards','blizzard','crush','summon'].includes(e.move);
   const frame=e.mode==='windup'?(magic?12:8)+(Math.floor(elapsed*8)%4):
     (e.attackPose||0)>0?(magic?12:8)+(Math.floor(elapsed*12)%4):
     e.walking?safeWalkFrame(e,8,.85):Math.floor(elapsed*2)%4;
   const sz=136;
   ctx.fillStyle='#0c1426a0';ctx.beginPath();ctx.ellipse(0,-2,49,13,0,0,TAU);ctx.fill();
   if(e.rage||attack){ctx.shadowColor='#73d9ff';ctx.shadowBlur=lowFx()?0:(e.rage?21:11);}
   ctx.save();if(e.face==='left'){ctx.scale(-1,1);}
   ctx.imageSmoothingEnabled=false;
   ctx.drawImage(img,(frame%4)*256,Math.floor(frame/4)*256,256,256,-sz/2,-sz+10,sz,sz);
   ctx.imageSmoothingEnabled=true;ctx.restore();ctx.shadowBlur=0;
   if(e.rage){ctx.strokeStyle='#88ddff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-49,68+Math.sin(elapsed*5)*3,71,0,0,TAU);ctx.stroke();}
   if(e.hurt>0){ctx.globalAlpha=Math.min(.22,e.hurt*2);ctx.fillStyle='#fff';ctx.fillRect(-55,-120,110,121);}
  }else if(isNordic()&&['draugr','frostwolf','berserker','runewitch'].includes(e.type)){
   const row={down:0,left:1,right:2,up:3}[e.face||'down']??0;
   const col=e.walking?safeWalkFrame(e,3,1.1):0;
   const sz=e.type==='frostwolf'?48:e.type==='berserker'?52:e.type==='runewitch'?48:45;
   ctx.imageSmoothingEnabled=false;ctx.drawImage(img,col*112,row*112,112,112,-sz/2,-sz+9,sz,sz);ctx.imageSmoothingEnabled=true;
   if(e.rage){ctx.strokeStyle='#a4e9ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-sz*.36,sz*.55+Math.sin(elapsed*5)*3,0,TAU);ctx.stroke();}
   if(e.hurt>0){ctx.globalAlpha=Math.min(.27,e.hurt*2);ctx.fillStyle='#fff';ctx.fillRect(-sz/2,-sz+9,sz,sz);}
  }else if(isBossEnemy(e)){
   const row={down:0,left:1,right:2,up:3}[e.face||'down']??0;
   const col=japaneseBossFrame(e);
   const attacking=bossAttackActive(e);
   if(attacking){
     const angle=e.face==='left'?Math.PI:e.face==='up'?-Math.PI/2:e.face==='down'?Math.PI/2:0;
     const lunge=bossVisualLunge(e);
     ctx.translate(Math.cos(angle)*lunge,Math.sin(angle)*lunge);
     // Attack pulse remains visible even for sprites without special frames.
     ctx.strokeStyle=e.type==='tsukuomi'?'#b99cff':e.type==='pecado'?'#ff365a':e.type==='reuni'?'#ff7992':'#eeb3a7';
     ctx.lineWidth=1.8;ctx.globalAlpha=.9;
     ctx.beginPath();ctx.arc(0,-25,30+Math.sin(elapsed*16)*3,elapsed*5,elapsed*5+1.0);ctx.stroke();ctx.globalAlpha=1;
   }
   if(e.rage){ctx.shadowColor=e.type==='pecado'?'#f10d2c':e.type==='tsukuomi'?'#9f59ea':e.type==='reuni'?'#fa1e3e':'#f7367c';ctx.shadowBlur=lowFx()?0:10;ctx.fillStyle='#9e1d5166';ctx.beginPath();ctx.ellipse(0,-10,23,25,0,0,TAU);ctx.fill();ctx.shadowBlur=0;}
   if(e.mode==='guard'&&e.type==='boss'){ctx.strokeStyle='#fa607f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-12,32,0,TAU);ctx.stroke();}
   if(e.mode==='windup'){ctx.shadowColor=e.type==='tsukuomi'?'#ae78ff':'#f46c92';ctx.shadowBlur=lowFx()?0:10;}
   ctx.imageSmoothingEnabled=false;ctx.drawImage(img,col*112,row*112,112,112,e.type==='pecado'?-37:e.type==='tsukuomi'?-31:e.type==='reuni'?-28:-32,e.type==='pecado'?-78:e.type==='tsukuomi'?-63:e.type==='reuni'?-54:-53,e.type==='pecado'?74:e.type==='tsukuomi'?62:e.type==='reuni'?56:64,e.type==='pecado'?90:e.type==='tsukuomi'?70:e.type==='reuni'?62:64);ctx.imageSmoothingEnabled=true;ctx.shadowBlur=0;
   if(e.hurt>0){ctx.fillStyle='#fff';ctx.globalAlpha=Math.min(.25,e.hurt*2);ctx.fillRect(-21,-46,42,42);}
  }else{
   const col={down:0,left:1,up:2,right:3}[e.face||'down']??0;
   const size=e.type==='runner'?30:e.type==='beast'?39:e.type==='yokai'?36:e.type==='ghost'?35:33;
   // Older Oni sprites have one pose per direction. Animate the pose with a
   // rhythmic walking cycle and foot-shadow instead of freezing while moving.
   if(e.walking){const stride=Math.sin(e.step*.83+e.phase);const bob=Math.abs(stride)*1.6;ctx.fillStyle='#05030a70';ctx.beginPath();ctx.ellipse(0,0,size*.37,3,0,0,TAU);ctx.fill();ctx.translate(stride*1.25,-bob);ctx.rotate(stride*.037);}
   if(e.type==='ghost'){ctx.globalAlpha=.72+.18*Math.sin(elapsed*4+e.phase);ctx.translate(0,Math.sin(elapsed*3+e.phase)*3);}
   if(e.elite&&!lowFx()){ctx.shadowColor='#ffad66';ctx.shadowBlur=12;}
   ctx.drawImage(img,col*96,0,96,96,-size/2,-size+8,size,size);ctx.shadowBlur=0;
   if(e.hurt>0){ctx.globalAlpha=Math.min(.3,e.hurt*3);ctx.fillStyle='#fff';ctx.fillRect(-size/2,-size+8,size,size);}
  }
  ctx.restore();
 }else{ctx.fillStyle='#4f274d';ctx.fillRect(e.x-8,e.y-18,16,18)}
 if(e.corruptTime>0){ctx.save();ctx.strokeStyle='#bb58f7';ctx.globalAlpha=.72;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y-12,e.radius+6,e.radius+11,0,0,TAU);ctx.stroke();ctx.restore();}
 if(e.type==='pecadoEcho'){drawR(e.x-26,e.y-58,52,5,'#210b19');drawR(e.x-25,e.y-57,50*Math.max(0,e.hp/e.maxHp),3,'#ff6781');}
 if(isBossEnemy(e)&&!e.mimicVisual){
  const width=e.type==='ancestralDragon'?155:e.type==='nameless'?88:e.type==='odin'?95:e.type==='frostjarl'?104:74, top=e.y-(e.type==='ancestralDragon'?(touchUI?clamp(Math.min(W*.82,H*.65),160,215):215)+8:e.type==='nameless'?94:e.type==='odin'?118:e.type==='frostjarl'?140:54);
  drawR(e.x-width/2,top,width,7,'#160c18');
  drawR(e.x-width/2+1,top+1,(width-2)*Math.max(0,e.hp/e.maxHp),5,e.type==='ancestralDragon'?'#ff9c53':e.type==='odin'?'#83dcff':e.type==='nameless'?'#d2b7ff':e.type==='frostjarl'?'#9deaff':e.type==='pecado'?'#ff243b':e.type==='tsukuomi'?'#bc80ff':e.type==='reuni'?'#f61943':e.rage?'#f52d56':'#d97687');
 }
}
function drawTsukuomiNight(){
 if(eclipseTime<=0||phase!=='play')return;
 ctx.save();
 const alpha=Math.min(.63,.22+eclipseTime*.065);
 ctx.fillStyle=`rgba(9,2,26,${alpha})`;
 ctx.fillRect(camera.x,camera.y,W,H);
 const t=enemies.find(e=>e.type==='tsukuomi'&&e.hp>0);
 if(t){ctx.strokeStyle=`rgba(184,127,255,${Math.min(.7,eclipseTime*.14)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(t.x,t.y,71+Math.sin(elapsed*4)*5,0,TAU);ctx.stroke();}
 ctx.restore();
}
// Reuse high-quality gradient textures rather than rebuilding large radial gradients
// every frame. Keeps the same artwork on strong devices while preventing Loid R/Q
// from stalling weaker phones. Cache is never part of the multiplayer packets.
function cachedRadial(r,stops,inner){
 const cvs=document.createElement('canvas'),dpr=1.6;
 cvs.width=cvs.height=Math.ceil((r*2+6)*dpr);
 const c=cvs.getContext('2d',{alpha:true});
 c.scale(dpr,dpr);
 const center=cvs.width/(2*dpr);
 const gradient=c.createRadialGradient(center,center,inner,center,center,r);
 for(const [stop,color] of stops)gradient.addColorStop(stop,color);
 c.fillStyle=gradient;c.beginPath();c.arc(center,center,r,0,TAU);c.fill();
 return {canvas:cvs,offset:center,r};
}
let loidHaloCache=null;
function getLoidHalo(kind){
 if(!loidHaloCache)loidHaloCache={
  domain:cachedRadial(180,[[0,'rgba(2,1,7,.95)'],[.70,'rgba(3,2,9,.92)'],[.92,'rgba(10,3,20,.85)'],[1,'rgba(14,4,26,0)']],12),
  aura:cachedRadial(75,[[0,'rgba(8,5,13,.83)'],[.48,'rgba(16,8,22,.68)'],[.83,'rgba(22,9,35,.36)'],[1,'rgba(19,7,25,0)']],7)
 };
 return loidHaloCache[kind];
}
function drawDarkDomain(){if(voidCollapse>0){ctx.save();ctx.fillStyle='rgba(3,0,12,.79)';ctx.fillRect(camera.x,camera.y,W,H);ctx.restore();}
 if(!player||player.type!=='loid'||player.ultimateTime<=0)return;
 const radius=177,small=minimalFx();
 // Simple one-fill fallback on weak phones; no blur, filters or radial shaders.
 ctx.save();
 if(small){ctx.fillStyle='rgba(3,2,10,.82)';ctx.beginPath();ctx.arc(player.x,player.y,radius,0,TAU);ctx.fill();}
 else {const t=getLoidHalo('domain');ctx.drawImage(t.canvas,player.x-radius,player.y-radius,radius*2,radius*2);}
 ctx.strokeStyle='#683f95';ctx.globalAlpha=.72;ctx.lineWidth=small?1.5:3;
 ctx.beginPath();ctx.arc(player.x,player.y,radius-6,0,TAU);ctx.stroke();
 if(!lowFx()){ctx.strokeStyle='#b273e6';ctx.globalAlpha=.28;ctx.lineWidth=1;
 ctx.beginPath();ctx.arc(player.x,player.y,radius-15,elapsed*.35,elapsed*.35+4.4);ctx.stroke();}
 ctx.restore();
}
function drawDarkAura(){
 if(!player||player.type!=='loid'||player.darkAuraTime<=0)return;
 ctx.save();
 if(minimalFx()){ctx.fillStyle='rgba(12,6,22,.52)';ctx.beginPath();ctx.arc(player.x,player.y-9,70,0,TAU);ctx.fill();}
 else {const t=getLoidHalo('aura');ctx.drawImage(t.canvas,player.x-75,player.y-9-75,150,150);}
 if(!lowFx()){
  ctx.strokeStyle='#15101f';ctx.lineWidth=3;ctx.globalAlpha=.75;
  for(let i=0;i<3;i++){
   const a=elapsed*(.5+i*.2)+i*TAU/3;
   ctx.beginPath();ctx.arc(player.x,player.y-9,45+i*7,a,a+1.6);ctx.stroke();
  }
 }
 ctx.restore();
}
function drawDashShadows(){
 if(!player||player.type!=='loid'||!dashShadows.length)return;
 for(let i=0;i<dashShadows.length;i++){
  if(minimalFx()&&i%3!==0)continue;
  const ghost=dashShadows[i];
  const a=Math.pow(Math.max(0,ghost.life/ghost.max),1.2);
  ctx.save();ctx.globalAlpha=a*.28;ctx.fillStyle='#13091c';
  ctx.beginPath();ctx.ellipse(ghost.x,ghost.y-10,12+7*(1-a),20,0,0,TAU);ctx.fill();
  ctx.globalAlpha=a*.5;
  if(!lowFx()){ctx.filter='brightness(0)';heroSprite(ghost.x,ghost.y,'loid',ghost.face,ghost.step,false,.96);ctx.filter='none';}
  else {ctx.fillStyle='#110a1c';ctx.beginPath();ctx.ellipse(ghost.x,ghost.y-12,11,18,0,0,TAU);ctx.fill();}
  ctx.globalAlpha=a*.36;ctx.strokeStyle='#61376f';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(ghost.x,ghost.y-13,9+(1-a)*13,0,TAU);ctx.stroke();ctx.restore();
 }
}
function drawNewFields(){ctx.save();for(const t of timeFields){ctx.globalAlpha=.22;ctx.fillStyle='#3f61ac';ctx.beginPath();ctx.arc(t.x,t.y,t.radius,0,TAU);ctx.fill();ctx.globalAlpha=.7;ctx.strokeStyle='#9ccaff';ctx.lineWidth=2;ctx.stroke();}for(const v of mirrorIllusions){if(v.x<camera.x-80||v.x>camera.x+W+80||v.y<camera.y-80||v.y>camera.y+H+80)continue;ctx.globalAlpha=Math.min(.5,v.life*.5);heroSprite(v.x,v.y,v.owner?.type||'kali','down',elapsed*12,false,.85,v.owner);}ctx.restore();}
function drawReality(){ctx.save();const team=[player,...coop.allies.values()].filter(Boolean);if(team.some(p=>p.type==='l0id'&&p.ultimateTime>0||p.rewriteUntil>elapsed)){ctx.fillStyle=team.some(p=>p.rewriteUntil>elapsed)?'#52248655':'#07040d99';ctx.fillRect(camera.x,camera.y,W,H);}for(const f of realityFields){if(f.x+f.radius<camera.x||f.x-f.radius>camera.x+W||f.y+f.radius<camera.y||f.y-f.radius>camera.y+H)continue;ctx.fillStyle='#a84dce33';ctx.strokeStyle='#b980ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,f.radius,0,TAU);ctx.fill();ctx.stroke();for(let i=0;i<8;i++){const t=i*TAU/8+elapsed*.2;ctx.beginPath();ctx.moveTo(f.x+Math.cos(t)*f.radius*.7,f.y+Math.sin(t)*f.radius*.7);ctx.quadraticCurveTo(f.x+Math.cos(t+.3)*f.radius,f.y+Math.sin(t+.3)*f.radius,f.x+Math.cos(t)*f.radius*1.1,f.y+Math.sin(t)*f.radius*1.1);ctx.stroke();}}for(const p of team){if(p.type==='l0id'&&p.darkAuraTime>0){ctx.fillStyle='#1a102d88';ctx.strokeStyle='#a48bdc';ctx.beginPath();ctx.arc(p.x,p.y,92+Math.sin(elapsed*5)*3,0,TAU);ctx.fill();ctx.stroke();}const r=p.realityRoll;if(r&&elapsed-r.at<2.5){const age=elapsed-r.at;const value=age<.65?1+Math.floor(age*83)%20:r.value;ctx.save();ctx.translate(p.x,p.y-64);ctx.fillStyle='#241135';ctx.strokeStyle=r.value===20&&age>=.65?'#ffd477':'#c392ff';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<6;i++){const a=TAU*i/6-Math.PI/2;ctx.lineTo(Math.cos(a)*16,Math.sin(a)*16);}ctx.closePath();ctx.fill();ctx.stroke();ctx.font='bold 14px system-ui';ctx.fillStyle=r.value===20&&age>=.65?'#ffd477':'#fff';ctx.textAlign='center';ctx.fillText(String(value),0,5);if(age>=.65&&r.rolls.length===2){ctx.font='8px system-ui';ctx.fillText(r.rolls.join(' / '),0,24);}ctx.restore();}}ctx.restore();}
function drawEffects(){drawNewFields();drawSecret61();for(const a of [player,...coop.allies.values()])if(a?.type==='abloy')drawAbloyBeam61(a);for(const a of [player,...coop.allies.values()]){if(!a||a.hp<=0)continue;ctx.save();for(const v of a.mimicMarks||[]){if(v.stage!==stage||v.at<=elapsed)continue;ctx.globalAlpha=.65;ctx.strokeStyle=v.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(v.x,v.y,v.r,0,TAU);ctx.stroke();}if(a.mimicWardUntil>elapsed||a.mimicGuardUntil>elapsed||a.mimicVeilUntil>elapsed){ctx.globalAlpha=.65;ctx.strokeStyle=MIMIC_BOSSES[a.mimicBoss]?.color||'#ff4058';ctx.beginPath();ctx.arc(a.x,a.y-9,28,0,TAU);ctx.stroke();}ctx.restore();}for(const b of projectiles){if(coop.active&&(b.x<camera.x-50||b.x>camera.x+W+50||b.y<camera.y-50||b.y>camera.y+H+50))continue;if(b.mimicShot){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));ctx.fillStyle=b.color;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-8,-4);ctx.lineTo(-5,0);ctx.lineTo(-8,4);ctx.closePath();ctx.fill();ctx.restore();continue;}if(b.mirror){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(elapsed*10);ctx.shadowColor='#d6a7ff';ctx.shadowBlur=lowFx()?0:7;if(MIRROR_SPRITE.complete&&MIRROR_SPRITE.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(MIRROR_SPRITE,-15,-15,30,30);ctx.imageSmoothingEnabled=true;}else{ctx.fillStyle='#ae70d8';ctx.fillRect(-8,-8,16,16);}ctx.restore();continue;}if(isNordic()&&b.from==='enemy'&&(b.color==='#a5e7ff'||b.color==='#98eaff')){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);ctx.fillStyle='#e6fcff';ctx.strokeStyle='#77cfff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(5,2);ctx.lineTo(0,9);ctx.lineTo(-5,2);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}else{ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();}if(b.bone){ctx.strokeStyle='#fff9f4';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=b.color;ctx.fillRect(b.x-7,b.y-2,14,4);}drawR(b.x-1,b.y-1,2,2,'#f4d8ff')}
for(const s of slashes){if(coop.active&&(s.x+s.r<camera.x||s.x-s.r>camera.x+W||s.y+s.r<camera.y||s.y-s.r>camera.y+H))continue;ctx.save();ctx.globalAlpha=s.life/s.max;ctx.strokeStyle=s.color;ctx.lineWidth=6;ctx.beginPath();ctx.arc(s.x,s.y,s.r*.62,s.ang-1.25,s.ang+1.25);ctx.stroke();ctx.strokeStyle='#faf2fe';ctx.lineWidth=1;ctx.stroke();ctx.restore()}
for(const ring of rings){if(coop.active&&(ring.x+ring.r*1.35<camera.x||ring.x-ring.r*1.35>camera.x+W||ring.y+ring.r*1.35<camera.y||ring.y-ring.r*1.35>camera.y+H))continue;ctx.save();ctx.globalAlpha=ring.life/ring.max;ctx.strokeStyle=ring.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(ring.x,ring.y,ring.r*(1.35-ring.life/ring.max*.35),0,TAU);ctx.stroke();ctx.restore()}
for(const p of particles){if(lowFx()&&(p.x<camera.x-15||p.x>camera.x+W+15||p.y<camera.y-15||p.y>camera.y+H+15))continue;ctx.save();ctx.globalAlpha=Math.min(1,p.life/p.max);if(p.text){ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillStyle='#17111c';ctx.fillText(p.text,p.x+1,p.y+1);ctx.fillStyle=p.color;ctx.fillText(p.text,p.x,p.y)}else{drawR(p.x,p.y,p.size,p.size,p.color)}ctx.restore()}}

function drawHealthDrops(){
 for(const h of healthDrops){if(h.x<camera.x-20||h.x>camera.x+W+20||h.y<camera.y-20||h.y>camera.y+H+20)continue;
  ctx.save();ctx.translate(h.x,h.y-6+Math.sin(elapsed*5+h.phase)*3);
  let k=1+Math.sin(elapsed*7+h.phase)*.13;ctx.scale(k,k);
  ctx.shadowBlur=lowFx()?0:8;ctx.shadowColor='#ff5e89';ctx.fillStyle='#6d1839';ctx.fillRect(-7,-3,14,11);ctx.shadowBlur=0;
  ctx.fillStyle='#ff6a85';ctx.fillRect(-7,-5,5,7);ctx.fillRect(2,-5,5,7);ctx.fillRect(-5,0,10,6);ctx.fillRect(-3,6,6,4);ctx.fillRect(-1,10,2,2);ctx.fillStyle='#ffe4da';ctx.fillRect(-4,-4,2,3);ctx.restore();
 }
}

function drawSpiritAura(p){
 ctx.save();ctx.globalAlpha=.44;ctx.strokeStyle='#a6e9ff';ctx.lineWidth=1.5;
 ctx.beginPath();ctx.ellipse(p.x,p.y-17,16,23,0,0,TAU);ctx.stroke();
 ctx.fillStyle='#80d7f333';ctx.beginPath();ctx.ellipse(p.x,p.y-17,13,21,0,0,TAU);ctx.fill();ctx.restore();
}
function draw(){
 ctx.setTransform(RENDER_SCALE,0,0,RENDER_SCALE,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.save();
 if(!coop.active&&shake>0&&phase==='play')ctx.translate(rand(-shake,shake),rand(-shake,shake));
 ctx.save();ctx.translate(-Math.round(camera.x),-Math.round(camera.y));
 drawMap();drawPortal602();drawNamelessDragon();drawBossWarnings();
 if(phase!=='select'){
  // Sort actors by their feet for an understandable top-down overlap.
  const actors=enemies.filter(e=>e.x>camera.x-110&&e.x<camera.x+W+110&&e.y>camera.y-120&&e.y<camera.y+H+120).map(e=>({y:e.y,kind:'enemy',e}));
  if(player)actors.push({y:player.y,kind:'player'});if(coop.active)for(const [id,a] of coop.allies)if(a.x>camera.x-130&&a.x<camera.x+W+130&&a.y>camera.y-140&&a.y<camera.y+H+140)actors.push({y:a.y,kind:'ally',a,id});for(const s of shadowClones){if(s.x>camera.x-60&&s.x<camera.x+W+60&&s.y>camera.y-60&&s.y<camera.y+H+60)actors.push({y:s.y,kind:'clone',s});}
  actors.sort((a,b)=>a.y-b.y);
  drawTsukuomiNight();drawDarkDomain();drawDarkAura();drawReality();
  if(coop.active)for(const ally of coop.allies.values()){
    if(ally.type!=='loid'||ally.hp<=0)continue;
    const r=ally.ultimateTime>0?178:ally.darkAuraTime>0?70:0;
    if(!r)continue;
    ctx.save();ctx.fillStyle=ally.ultimateTime>0?(minimalFx()?'#08030b9c':'#08030bcb'):'#130d21a3';ctx.beginPath();ctx.arc(ally.x,ally.y,r,0,TAU);ctx.fill();
    if(!minimalFx()){ctx.strokeStyle='#8552a6';ctx.lineWidth=2;ctx.stroke();}ctx.restore();
  }drawDashShadows();drawXansPortals();drawEvePortals();drawDimensionalCharge();
  for(const a of actors){
   if(a.kind==='enemy'){const e=a.e;if(e.elite62){ctx.save();ctx.strokeStyle=({regen:'#74d799',swift:'#81caff',guard:'#f1cb77',burst:'#ff9365'})[e.elite62]||'#ffcc77';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(e.x,e.y, e.radius+7,6,0,0,TAU);ctx.stroke();ctx.restore();}enemySprite(e);}else if(a.kind==='clone')drawShadowClone(a.s);else if(a.kind==='ally'){const p=a.a;ctx.save();if(p.hp<=0){drawSpiritAura(p);ctx.globalAlpha=.46;}else if(p.awaken60){const col=awakenInfo60[hero60(p)]?.[0]||'#f1cb77';ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y+3,22+Math.sin(elapsed*3)*2,0,TAU);ctx.stroke();if(!lowFx())ctx.filter='brightness(1.13) saturate(1.2) drop-shadow(0 0 3px '+col+')';}if(p.skin62)ctx.filter='hue-rotate('+(SKINS62[hero60(p)]?.[1]||120)+'deg) saturate(1.4)';heroSprite(p.x,p.y,p.type,p.face,p.step,p.transformTime>0,1,p);ctx.restore();ctx.save();ctx.textAlign='center';ctx.font='bold 8px system-ui';ctx.fillStyle='#f7e3fd';ctx.strokeStyle='#160921';ctx.lineWidth=2;const name=p.type==='cross'?'XANS':p.type.toUpperCase();ctx.strokeText(name,p.x,p.y-45);ctx.fillText(name,p.x,p.y-45);ctx.fillStyle='#311524';ctx.fillRect(p.x-17,p.y-40,34,3);ctx.fillStyle=p.hp>0?'#d15d83':'#9ee9f6';ctx.fillRect(p.x-17,p.y-40,p.hp>0?34*Math.max(0,p.hp/p.maxHp):34,3);ctx.restore();}
   else if(player){
    if(player.orbiters){for(let i=0;i<player.orbiters;i++){let t=elapsed*2+i*TAU/player.orbiters;ctx.fillStyle='#7e4bbb';ctx.beginPath();ctx.arc(player.x+Math.cos(t)*23,player.y+Math.sin(t)*13,4,0,TAU);ctx.fill()}}
    if(player.awaken60){ctx.strokeStyle=awakenInfo60[hero60(player)]?.[0]||'#f1cb77';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(player.x,player.y+3,22+Math.sin(elapsed*3)*2,0,TAU);ctx.stroke();}if(player.transformTime>0){ctx.globalAlpha=.26;ctx.fillStyle='#a452ff';ctx.beginPath();ctx.arc(player.x,player.y-8,18+Math.sin(elapsed*10)*3,0,TAU);ctx.fill();ctx.globalAlpha=1}
    ctx.save();if(player.hp<=0){drawSpiritAura(player);ctx.globalAlpha=.46;}else if(player.type!=='josue'&&player.invuln>0&&Math.floor(elapsed*18)%2!==0)ctx.globalAlpha=.5;
    if(player.awaken60&&player.hp>0&&!lowFx())ctx.filter='brightness(1.13) saturate(1.2) drop-shadow(0 0 3px '+(awakenInfo60[hero60(player)]?.[0]||'#f1cb77')+')';if(player.skin62)ctx.filter='hue-rotate('+(SKINS62[hero60(player)]?.[1]||120)+'deg) saturate(1.4)';heroSprite(player.x,player.y,player.type,player.face,player.step,player.transformTime>0);ctx.restore();
   }
  }
  drawEffects();drawDamageFloats();drawCardBeam();drawXansSkulls();drawHealthDrops();
  if(player&&player.curseTime>0){ctx.save();ctx.strokeStyle='#ff1c50';ctx.globalAlpha=.6;ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y-12,23+Math.sin(elapsed*8)*3,0,TAU);ctx.stroke();ctx.restore();}
 }
 ctx.restore();
 if(phase==='select'){ctx.fillStyle='#100e1c44';ctx.fillRect(0,0,W,H)}
 if(bossMessageTimer>0&&phase==='play'){
  ctx.save();ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffe1cc';ctx.strokeStyle='#170d1d';ctx.lineWidth=3;ctx.strokeText(bossMessage,W/2,18,Math.min(250,W*.42));ctx.fillText(bossMessage,W/2,18,Math.min(250,W*.42));ctx.restore();
 }
 if(flash>0){ctx.fillStyle=`rgba(255,60,105,${flash*(coop.active?.45:.95)})`;ctx.fillRect(0,0,W,H)}
 ctx.restore();
}
function updateHud(){
 if(!player||coop.executing)return;
 // Throttle all visual DOM updates, not just health bars.
 const now=performance.now();if((touchUI||coop.active)&&phase==='play'&&now-lastHudStamp<100)return;lastHudStamp=now;
 hud60();updateMimicHud();const treeHud=$('treeHud62');treeHud.hidden=!defense62;if(defense62&&tree62)treeHud.textContent='YGGDRASIL '+Math.ceil(tree62.hp)+' / '+tree62.maxHp+' PV · Escudo '+Math.ceil(tree62.shield);if(phase==='over')endStats62();
 const runeHud=$('nordicCardHUD');if(runeHud)runeHud.style.display='none';
 syncSkillArt(player.type);$('secondaryName').textContent=player.type==='loid'?'SOMBRAS':player.type==='cross'?'OSSOS':player.type==='eve'?'TEMPO':player.type==='kali'?'ILUSÕES':player.type==='mollitiam'?'RAÍZES':player.type==='moretti'?'DISTORÇÃO':player.type==='l0id'?'LEGIÃO':player.type==='josue'?'TEMPO':'CORTE';
 $('btnSecondary').querySelector('b').textContent=player.type==='loid'?'SOMBRAS E':player.type==='cross'?'OSSOS E':player.type==='eve'?'TEMPO E':player.type==='kali'?'ESPELHOS E':player.type==='mollitiam'?'CURA E':player.type==='moretti'?'REALIDADE E':player.type==='l0id'?'LEGIÃO E':player.type==='josue'?'TEMPO E':'CORTE E';
 $('playerName').textContent=(player.type==='loid'?'LOID · ESCURIDÃO':player.type==='cross'?'XANS · CORRUPÇÃO':player.type==='eve'?'EVE LOREY · VAZIO':player.type==='kali'?'KALI · ESPELHOS':player.type==='mollitiam'?'MOLLITIAM · TITÃ DA RAIZ':player.type==='moretti'?'MORETTI · REALIDADE':player.type==='l0id'?'L0ID · SOMBRAMANTE':player.type==='josue'?'JOSUÉ · FÚRIA ESPARTANA':player.frogSkill?'KRIS · FORMA DO SAPO':'KRIS · SANTA TRINDADE')+(player.curseTime>0?' · ⚠ FRAQUEZA '+Math.ceil(player.curseTime)+'s':'');
 const supportHud=$('supportBuffHUD');if(supportHud){const status=supportStatus(player);if(supportHud.textContent!==status)supportHud.textContent=status;supportHud.style.display=status?'block':'none';}
 if(player.mimicOrigin)$('playerName').textContent='MÍMICO · '+(MIMIC_BOSSES[player.mimicBoss]?.name||MIMIC_NAMES[player.type]).toUpperCase();if(player.type==='mimic'){const b=MIMIC_BOSSES[player.mimicBoss];$('secondaryName').textContent=b?b.e:'DEVORAR';$('btnSecondary').querySelector('b').textContent=b?'BOSS E':'ALMAS E';$('btnSkill').querySelector('b').textContent=b?'BOSS Q':'CORRENTE Q';$('btnSkill').title=b?b.q:'Corrente do Abismo';$('btnSecondary').title=b?b.e:'Devorar Almas';$('btnUltimate').title=b?b.r:'Ascensão Mimética';}else{$('btnSkill').querySelector('b').textContent='PODER Q';$('btnSkill').title='Poder Q';$('btnSecondary').title='Poder E';$('btnUltimate').title='Supremo R';}
 if(player.type==='abloy'){if(!player.mimicOrigin)$('playerName').textContent='ABLOY · MANIPULADOR DE ALMAS';$('secondaryName').textContent='EXPLOSÃO';$('btnSecondary').querySelector('b').textContent='EXPLOSÃO E';$('btnSkill').querySelector('b').textContent='RAJADA Q';$('btnSkill').title='Rajada de Almas';$('btnSecondary').title='Explosão Espiritual';$('btnUltimate').title='Feixe Celestial';}
 $('hpFill').style.width=Math.max(0,player.hp/player.maxHp*100)+'%';
 $('hpText').textContent=`${Math.ceil(player.hp)} / ${player.maxHp}`;
 const skillPct=Math.max(0,100*(1-player.skillCd/player.skillDelay));
 $('powerFill').style.width=skillPct+'%';
 $('powerText').textContent=player.skillCd>0?`Q · ${player.skillCd.toFixed(1)} s`:'Q · PODER PRONTO';
 const charge=Math.max(0,Math.min(100,player.ultimateCharge));
 $('ultimateFill').style.width=charge+'%';
 $('ultimateText').textContent=player.type==='mollitiam'&&player.ultimateTime>0?'TITÃ RÚNICO ATIVO':player.type==='cross'&&player.ultimateBuff==='cross'&&player.ultimateBuffTime>0?'RUPTURA ATIVA':player.ultimateTime>0?'DOMÍNIO '+player.ultimateTime.toFixed(1)+'s':player.ultimateBuffTime>0?'SUPREMO ATIVO':charge>=100?'R · SUPREMO PRONTO':`R · CARGA ${Math.floor(charge)}%`;
 $('btnUltimate').classList.toggle('cool',charge<100);
 $('btnSkill').classList.toggle('cool',player.skillCd>0);
 $('btnDash').classList.toggle('cool',player.dashCd>0);
 $('btnSecondary').classList.toggle('cool',player.secondaryCd>0&&!player.secondaryCharging);
 $('btnSkill').dataset.timer=player.skillCd>0?player.skillCd.toFixed(1)+'s':'';
 $('btnDash').dataset.timer=player.dashCd>0?player.dashCd.toFixed(1)+'s':'';
 $('btnUltimate').dataset.timer=charge<100?Math.floor(charge)+'%':'';
 $('btnSecondary').dataset.timer=player.secondaryCd>0?player.secondaryCd.toFixed(1)+'s':'';
 $('btnSkill').style.setProperty('--readiness',skillPct+'%');
 const bCard=$('btnCardPower');bCard.style.display=player.cardPower?'flex':'none';bCard.classList.toggle('cool',player.cardPowerUsed||player.cardPower==='granita'&&player.ultimateCharge<50);bCard.querySelector('b').textContent=player.cardPower==='frog'?'SAPO F':player.cardPower==='gaster'?'GASTER F':player.cardPower==='eveprime'?'AUGE F':player.cardPower==='mollitiamHeart'?'CORAÇÃO F':player.cardPower==='authorReality'?'AUTOR F':player.cardPower==='godShadow'?'ABISMO F':player.cardPower==='chronosFury'?'TEMPO F':'GRANITA F';bCard.title=player.cardPower==='frog'?'Forma do Sapo (F) — 1 uso':player.cardPower==='eveprime'?'Retorno ao Auge (F) — 6 segundos':player.cardPower==='gaster'?'Gaster Blaster (F)':player.cardPower==='mollitiamHeart'?'Coração de Yggdrasil (F) — 8 segundos':player.cardPower==='authorReality'?'O Autor do Impossível (F)':player.cardPower==='godShadow'?'A Sombra que Devorou Deus (F)':player.cardPower==='chronosFury'?'Fúria Além do Tempo (F)':'Granita (F)';bCard.dataset.timer=player.cardPower==='mollitiamHeart'&&player.mollitiamHeartTime>0?Math.ceil(player.mollitiamHeartTime)+'s':player.cardPower==='eveprime'&&player.evePrimeTime>0?Math.ceil(player.evePrimeTime)+'s':player.cardPowerUsed?'USADO':player.cardPower==='granita'&&player.ultimateCharge<50?'50%':'';
 $('btnDash').style.setProperty('--readiness',Math.max(0,100*(1-player.dashCd/player.dashDelay))+'%');
 $('btnUltimate').style.setProperty('--readiness',charge+'%');
 $('cooldownSkill').textContent=player.skillCd>0?player.skillCd.toFixed(1)+'s':'PRONTO';
 $('cooldownDash').textContent=player.dashCd>0?player.dashCd.toFixed(1)+'s':'PRONTO';
 $('cooldownUltimate').textContent=charge>=100?'PRONTO':Math.floor(charge)+'%';
 $('cooldownSkillSlot').style.setProperty('--readiness',skillPct+'%');
 $('cooldownSecondary').textContent=player.secondaryCharging?'CARREGANDO '+Math.round(player.secondaryCharge/1.6*100)+'%':player.secondaryCd>0?player.secondaryCd.toFixed(1)+'s':'PRONTO';
 $('cooldownSecondarySlot').style.setProperty('--readiness', (player.secondaryCharging?player.secondaryCharge/1.6*100:Math.max(0,100*(1-player.secondaryCd/player.secondaryDelay)))+'%');
 $('btnSecondary').style.setProperty('--readiness', (player.secondaryCharging?player.secondaryCharge/1.6*100:Math.max(0,100*(1-player.secondaryCd/player.secondaryDelay)))+'%');
 $('cooldownDashSlot').style.setProperty('--readiness',Math.max(0,100*(1-player.dashCd/player.dashDelay))+'%');
 $('cooldownUltimateSlot').style.setProperty('--readiness',charge+'%');
 $('stageText').textContent=defense62?'DEFESA · ONDA '+stage:rushMode?'BOSS RUSH · '+String(stage).padStart(2,'0')+(' · '+rushTier(stage)):(isNordic()?'NÓRDICO '+String(localNordicWave()).padStart(2,'0'):'JAPÃO '+String(stage).padStart(2,'0'))+(stage===40?' · PECADO':isNordic()?'':stage===20?' · PECADO':stage===15?' · TSUKUOMI':stage===10?' · REUNI':stage%5===0?' · CHEFE':'')+(isPecador()?' ✦ PECADOR':'');
 $('themeText').textContent=theme().name;
 $('counterText').textContent=`INIMIGOS ${enemies.filter(e=>e.hp>0).length} · ESSÊNCIA ${essence}`+(isNordic()?' · J'+(player.cards||[]).length+' F'+(player.runes||[]).length+'/'+NORDIC_RUNE_CAP:'')+(coop.active?` · ONLINE ${coop.members.length}/5 · ESCALA ${waveBalance.players}P`:'');
}

function pickCardsBase60(){if(isNordic()){
 const available=nordicRewardPool(player),special=available.find(c=>c.specialId),regular=available.filter(c=>!c.specialId),chosen=[];
 while(chosen.length<(special?2:3)&&regular.length){const idx=Math.floor(Math.random()*regular.length);chosen.push(regular.splice(idx,1)[0]);}
 if(special)chosen.push(special);return chosen;
 }const pool=cards;let valid=pool.filter(c=>!c.id.startsWith('tree_')&&(!c.id.startsWith('sy_')||synergyAllowed62(player,c.id))).filter(c=>(!c.hero||c.hero===player.type||(c.id==='mimicMastery'&&player.mimicOrigin))&&!(c.id==='mimicMastery'&&player.mimicMastery)&&!(c.id==='gaster'&&player.cardPower)&&!(c.id==='granita'&&player.cardPower)&&!(c.id==='eveprime'&&player.cardPower)&&!(['mollitiamHeart','authorReality','godShadow','chronosFury'].includes(c.id)&&player.cardPower)&&!(c.id==='frog'&&(player.frogSkill||player.frogUsed))&&!(player.frogSkill&&['black','form','awakening','bloodmoon'].includes(c.id))),selected=[];while(selected.length<3&&valid.length){let index=Math.floor(Math.random()*valid.length),c=valid.splice(index,1)[0],weight=rushMode?(c.rarity==='legendary'?.20:c.rarity==='rare'?.65:1):c.rarity==='legendary'?.11:c.rarity==='rare'?.45:1;if(Math.random()<weight||valid.length<3-selected.length)selected.push(c)}if(!isNordic()&&player.type==='kris'&&!player.frogSkill&&stage===8&&!selected.some(c=>c.id==='frog')){selected[1]=cards.find(c=>c.id==='frog');}if(!isNordic()&&player.type==='cross'&&!player.cardPower&&stage===8&&!selected.some(c=>c.id==='gaster'))selected[1]=cards.find(c=>c.id==='gaster');if(!isNordic()&&player.type==='mollitiam'&&!player.cardPower&&stage===10&&!selected.some(c=>c.id==='mollitiamHeart'))selected[1]=cards.find(c=>c.id==='mollitiamHeart');if(!isNordic()&&player.type==='loid'&&!player.cardPower&&stage===11&&!selected.some(c=>c.id==='granita'))selected[1]=cards.find(c=>c.id==='granita');if(!player.cardPower&&stage===8&&['moretti','l0id'].includes(player.type)){const c=cards.find(c=>c.hero===player.type&&['authorReality','godShadow'].includes(c.id));if(!selected.includes(c))selected[1]=c;}return selected.slice(0,3)}
function pickCards(){const selected=pickCardsBase60();if(defense62&&selected.length>=3)selected[2]=cards.find(c=>c.id===['tree_repair','tree_shield','tree_roots'][(stage-1)%3]);else if(coop.active&&!isNordic()&&selected.length>=3&&Math.random()<.35){const sy=cards.find(c=>synergyAllowed62(player,c.id));if(sy)selected[2]=sy;}if(!testBossMode&&localWave60()>=3&&selected.length>=3&&(player.curses60||[]).length<2&&Math.random()<.24){const pool=curse60.filter(c=>!has60(player,c.id));if(pool.length)selected[0]=pool[Math.floor(Math.random()*pool.length)];}return selected;}
const rarLabel={common:'COMUM',rare:'RARA',legendary:'LENDÁRIA',cursed:'AMALDIÇOADA'};
function showRewards(){if(intermission601){syncIntermission601();return;}rewardSignature60='';$('worldReward60').open=false;if(coop.active)coop.chosen=false;YG_AUDIO.play('waveClear',1.17);opts=pickCards();let gg=$('rewardGrid');gg.innerHTML='';for(let i=0;i<opts.length;i++){const c=opts[i],b=document.createElement('button');b.className='upgrade '+c.rarity+(isNordic()?' nordic-card':'');b.innerHTML=`<span class="num">0${i+1}</span><div class="iconbox"><img class="card-art" alt="" src="${CARD_IMAGES[c.id]||'assets/cards/cursed60.svg'}"></div><strong>${c.name}</strong><span class="rar">◆ ${rarLabel[c.rarity]}</span><div class="desc">${c.desc}${rushMode?'<br>✦ BOSS RUSH: efeitos numéricos elegíveis +20%, com limites.':''}</div>`;b.onclick=()=>chooseCard(i);gg.appendChild(b)}$('rewardSubtitle').textContent=rushMode?'◆ BOSS RUSH · RECOMPENSA SUPREMA ◆':(isNordic()?'❄ NÓRDICO · ONDA '+String(localNordicWave()).padStart(2,'0')+' · '+'ESCOLHA UMA RUNA FUTHARK'+' ❄':'◆ ONDA '+String(stage).padStart(2,'0')+' VENCIDA ◆');$('rewardScreen').classList.remove('hidden');rewardTools60();updateHud()}
function chooseCard(i){if(intermission601)return;if(coop.reconnecting||(screenAdjusting&&!coop.executing))return;if(phase!=='reward'||!opts[i])return;let c=opts[i];YG_AUDIO.play('card',1.15);if(coop.active){if(coop.chosen)return;coop.chosen=true;$('rewardScreen').classList.add('hidden');if(coop.host){if(!awardCard(player,c)){coop.chosen=false;showRewards();return;}coop.choices.add(coop.id);showWaitingCards();coopTryWave();coop.checkpointDirty=true;coopSendState(true);}else {showWaitingCards();coopAction('card',c.id);}return;}if(!awardCard(player,c))return;makeParticles(player.x,player.y,'#dfb9ff',25);testBossMode=false;stage++;spawnStage();}
function restart(){intermission601=null;syncIntermission601();worldEvent60=null;waveMod60='';closeMimicMenu();$('mimicToggle').hidden=true;$('mimicBossToggle').hidden=true;if(coop.active){if(coop.host){coopSend({t:'rematch'});coopNote('Voltando à mesma sala...');}else{coopSend({t:'rematchRequest'});coopNote('Solicitação de revanche enviada ao anfitrião.');$('retry').textContent='AGUARDANDO ANFITRIÃO...';}return;}YG_AUDIO.play('menu',.75);phase='title';rushMode=false;defense62=false;tree62=null;testBossMode=false;waveClearTimer=-1;dashShadows=[];shadowClones=[];hazards=[];frostBursts=[];bossMessageTimer=0;player=null;keys.clear();mouseAim=null;pointerDown=false;attackMobile=false;mobileMove={x:0,y:0};enemies=[];particles=[];slashes=[];$('titleScreen').classList.remove('hidden');$('selectScreen').classList.add('hidden');$('worldScreen').classList.add('hidden');$('supremeScreen').classList.add('hidden');$('rewardScreen').classList.add('hidden');$('waitingCards').classList.add('hidden');$('gameOverScreen').classList.add('hidden');$('coopScreen').classList.add('hidden');$('hud').style.display='none';$('mobileControls').style.display='none';document.body.classList.remove('is-playing');adaptViewport()}
function frame(time){
 if(coop.active&&player){const death=$('fallenScreen');if(death){const hidden=!(phase==='play'&&player.hp<=0);if(death.classList.contains('hidden')!==hidden)death.classList.toggle('hidden',hidden);}}
 perfFrames++;if(!perfStart)perfStart=time;
 if(time-perfStart>1000){
  const fps=Math.round(perfFrames*1000/(time-perfStart));callbackFps=fps;
  const drawnFps=Math.round(drawnFrames*1000/(time-perfStart));visibleFps=drawnFps;
  if(renderMode==='auto'&&(touchUI||coop.active)&&phase==='play'){
   if(fps<43){slowSeconds+=shadowClones.length>=8?2:1;fastSeconds=0;}else if(fps>56){fastSeconds++;slowSeconds=0;}else{slowSeconds=fastSeconds=0;}
   // Escalate GPU savings if the phone struggles; restore only after sustained stability.
   if(slowSeconds>=2){
    if(autoFxTier<2)autoFxTier++;
    if(coop.active&&RENDER_SCALE>1&&autoFxTier>=2){onlineScaleSaved615??=RENDER_SCALE;RENDER_SCALE=1;canvas.width=Math.round(W*RENDER_SCALE);canvas.height=Math.round(H*RENDER_SCALE);}
    slowSeconds=0;
   }else if(fastSeconds>=14){
    if(autoFxTier>0)autoFxTier--;
    if(onlineScaleSaved615!==null&&autoFxTier<2){RENDER_SCALE=onlineScaleSaved615;onlineScaleSaved615=null;canvas.width=Math.round(W*RENDER_SCALE);canvas.height=Math.round(H*RENDER_SCALE);}
    fastSeconds=0; // preserve render resolution
   }
  }
  const el=$('performanceMeter');if(el){const ms=netRtt===null?'CONECTANDO':Math.round(netRtt)+' ms';const loss=coop.active&&coop.remoteStarted&&!coop.host&&time-(coop.lastMotionArrival||0)>1500?' · SINAL FRACO':'';
   const visual=renderMode==='auto'&&(touchUI||coop.active)?(autoFxTier===2?' · AUTO DESEMP.':autoFxTier===1||coop.active?' · AUTO LEVE':' · AUTO HD'):renderMode==='desempenho'?' · DESEMP.':'';
   el.textContent='FPS '+drawnFps+' · '+(!coop.active?'OFFLINE':'PING '+ms+' · EDGE '+(edgeRtt===null?'--':edgeRtt+'ms')+' · J '+Math.round(netJitter)+' · '+coop.networkRx+'/s'+loss)+visual;el.title='PING: mediana WebSocket até lobby. EDGE: HTTP até Worker '+edgeColo+'. J: variação das chegadas. Não é perda de pacotes.';
  }
  coop.networkRx=0;perfFrames=0;drawnFrames=0;perfStart=time;
 }
 if(coop.active&&!coop.heartbeat&&coop.socket?.readyState===WebSocket.OPEN&&time-netPingStart>3500){netPingStart=time;coopSend({t:'ping',ts:Date.now()});}
 if(!last)last=time;const dt=Math.min(Math.max(0,(time-last)/1000),coop.active?.064:.032);last=time;
 if(waitingVisible()){if(!coop.reconnecting)waitingFrame(dt,time);drawnFrames++;requestAnimationFrame(frame);return;}
 if(screenAdjusting&&!coop.active){if(player)draw();requestAnimationFrame(frame);return;}
 if(coop.reconnecting){if(player)draw();requestAnimationFrame(frame);return;}
 if(coop.active&&!coop.host){
  if(touchUI&&attackMobile&&!attackManualAim)mobileAutoAim(false);
  elapsed+=dt;flash=Math.max(0,flash-dt);shake=0;
  if(player){predictGuest(dt,time);coopGuestVisualUpdate(dt);if(keys.has('j')||pointerDown||attackMobile)guestAttackVisual615(false);}
  coopSendInput(time);
 }else{
  if(coop.active&&coop.host&&dt>.032){update(dt/2);update(dt/2);}else update(dt);
  if(coop.active&&coop.host){
   const buffered=coop.socket?.bufferedAmount||0;
   const pace=(coop.wire616?netPacing616:netPacing615)(buffered,coop.lastStateBytes615,callbackFps);if(phase!=='play'){pace.motion=Math.max(200,pace.motion);pace.state=Math.max(350,pace.state);}
   if(time-coop.lastMotion>=pace.motion){coop.lastMotion=time;coopSendMotion();}
   if(time-coop.lastSnapshotAttempt615>=pace.state){coop.lastSnapshotAttempt615=time;coopSendState();}
  }
 }
 tickShopUI601(dt);
 // No artificial FPS cap: draw on every browser animation callback in all modes.
 // Adaptive effects and network pacing remain independent of rendering.
 draw();drawnFrames++;
 requestAnimationFrame(frame);
}
// Guest prediction stays local: never pull a moving player back toward a stale snapshot.
function predictGuest(dt,time){
 if(touchUI&&attackMobile&&!attackManualAim)mobileAutoAim(false);
 let mx=mobileMove.x,my=mobileMove.y;
 if(keys.has('w')||keys.has('arrowup'))my-=1;
 if(keys.has('s')||keys.has('arrowdown'))my+=1;
 if(keys.has('a')||keys.has('arrowleft'))mx-=1;
 if(keys.has('d')||keys.has('arrowright'))mx+=1;
 const active=phase==='play'&&Math.hypot(mx,my)>.09;
 movingNow=active;
 const d=active?norm(mx,my):{x:0,y:0};
 const speed=player.hp<=0?116:player.speed*newSpeed(player)*(player.evePrimeTime>0?2:1)*(player.type==='loid'&&player.ultimateTime>0?1.65:1)*(player.curseTime>0?.78:1)*(player.frostTime>0?.72:1);
 if(active&&!player.crossTp&&!player.dashTime){
  player.x+=d.x*speed*dt;player.y+=d.y*speed*dt;
  player.face=Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down';player.step+=dt*11;
  if(!mouseAim)player.aim=Math.atan2(d.y,d.x);
 }
 if(coop.predBlink615&&time>=coop.predBlink615.until)coop.predBlink615=null;
 if(!coop.predBlink615&&coop.targetLocal&&!player.crossTp&&!player.dashTime&&time-(coop.targetLocal.at??coop.lastMotionArrival)<400){
  const target=coop.targetLocal;
  const age=clamp((time-(target.at??time))/1000+Math.min(.16,(netRtt||60)/2000+(target.hostRtt||0)/2000),0,.24);
  const tx=target.x+clamp((target.vx||0)*age,-50,50),ty=target.y+clamp((target.vy||0)*age,-50,50);
  const ex=tx-player.x,ey=ty-player.y,error=Math.hypot(ex,ey);
  if(error>230){player.x=tx;player.y=ty;}
  else if(!active||error>30){const gain=1-Math.exp(-dt*(active?3:10));const cap=(active?speed*.32:Math.max(150,speed*1.5))*dt;const k=Math.min(gain,cap/Math.max(1,error));player.x+=ex*k;player.y+=ey*k;}
 }
 applyBoundaries(player,8);
 for(const [id,target] of coop.targetAllies){
  const a=coop.allies.get(id);if(!a)continue;
  const lead=clamp((time-(target.at??time))/1000+Math.min(.12,((netRtt||0)+(target.hostRtt||0))/2000),0,.25);
  const tx=target.x+clamp((target.vx||0)*lead,-42,42),ty=target.y+clamp((target.vy||0)*lead,-42,42);
  const ex=tx-a.x,ey=ty-a.y,e=Math.hypot(ex,ey);
  const k=e>230?1:1-Math.exp(-dt*(e>45?12:9));
  a.x+=ex*k;a.y+=ey*k;applyBoundaries(a,8);
  a.moving=Math.hypot(target.vx||0,target.vy||0)>3||e>2;
  if(target.face)a.face=target.face;
  if(a.moving)a.step=(a.step||0)+dt*11;
 }
 camera.x+=(clamp(player.x-W/2,0,Math.max(0,WORLD_W-W))-camera.x)*Math.min(1,dt*12);
 camera.y+=(clamp(player.y-H/2,0,Math.max(0,WORLD_H-H))-camera.y)*Math.min(1,dt*12);
}
// Guest receives ONE authoritative combat world. Never run combat AI or apply
// damage on the guest. Predict the local player, interpolate the replicated world.
function coopGuestVisualUpdate(dt){
 if(!player)return;
 player.atkTime=Math.max(0,(player.atkTime||0)-dt);
 for(const a of [player,...coop.allies.values()])for(const k of ['invuln','curseTime','frostTime','ultimateTime','ultimateBuffTime','evePrimeTime','transformTime','darkAuraTime','frogTime'])a[k]=Math.max(0,(a[k]||0)-dt);
 waveIntro=Math.max(0,waveIntro-dt);bossMessageTimer=Math.max(0,bossMessageTimer-dt);
 player.dashCd=Math.max(0,(player.dashCd||0)-dt);
 const recovery=1+.22*realityPower(player,'destiny');player.skillCd=Math.max(0,(player.skillCd||0)-dt*recovery);
 player.secondaryCd=Math.max(0,(player.secondaryCd||0)-dt*recovery);player.dashCd=Math.max(0,player.dashCd-dt*(recovery-1));player.mirrorGuard=Math.max(0,(player.mirrorGuard||0)-dt);
 if(player.dashTime>0){
  player.dashTime=Math.max(0,player.dashTime-dt);
  player.x+=player.dashV.x*(player.type==='eve'?590:340)*dt;player.y+=player.dashV.y*(player.type==='eve'?590:340)*dt;
  if(player.type==='loid'&&Math.random()<.5&&dashShadows.length<20)
    dashShadows.push({x:player.x,y:player.y,face:player.face,step:player.step,life:.30,max:.30});
 }
 for(let i=slashes.length-1;i>=0;i--){slashes[i].life-=dt;if(slashes[i].life<=0)slashes.splice(i,1);}
 for(let i=rings.length-1;i>=0;i--){rings[i].life-=dt;if(rings[i].life<=0)rings.splice(i,1);}
 for(let i=dashShadows.length-1;i>=0;i--){dashShadows[i].life-=dt;if(dashShadows[i].life<=0)dashShadows.splice(i,1);}
 updateDamageFloats(dt);
 const age=performance.now()-coop.lastCombatPacket;
 const tau=Math.min(.22,Math.max(0,age/1000));
 for(const e of enemies){
  const t=coop.enemyTargets.get(e.id);if(!t)continue;
  const tx=t.x+clamp(t.vx*tau,-45,45),ty=t.y+clamp(t.vy*tau,-45,45);
  const err=Math.hypot(tx-e.x,ty-e.y);
  const k=err>230?1:1-Math.exp(-dt*(err>40?13:9));
  e.x+=(tx-e.x)*k;e.y+=(ty-e.y)*k;
  if(e.walking)e.step=(e.step||0)+dt*(e.speed||45)*.18;
 }
 const visualNow=performance.now();
 for(const b of projectiles){const vX=Number(b.vx||0),vY=Number(b.vy||0),t=b._netTarget615;if(!t){b.x+=vX*dt;b.y+=vY*dt;continue;}
  const age=Math.max(0,(visualNow-t.at)/1000),lead=Math.min(.30,age),k=1-Math.exp(-dt*16);
  // Stop extrapolating after the short prediction window; never run ahead indefinitely.
  if(age<=.30){b.x+=vX*dt;b.y+=vY*dt;}b.x+=(t.x+vX*lead-b.x)*k;b.y+=(t.y+vY*lead-b.y)*k;
 }
 for(const s of shadowClones){if(Number.isFinite(s.tx)){const k=1-Math.exp(-dt*16);s.x+=(s.tx-s.x)*k;s.y+=(s.ty-s.y)*k;}s.step=(s.step||0)+dt*10;s.time=Math.max(0,s.time-dt);}
 // Host alone decides damage, cooldowns and wave progression.
 updateHud();
}
function drawPortrait(id,type){
 let c=$(id),ct=c.getContext('2d'),oc=ctx;
 const paint=()=>{
  ct.imageSmoothingEnabled=false;ct.clearRect(0,0,90,90);
  ct.fillStyle=type==='loid'?'#291326':'#121a33';ct.fillRect(0,0,90,90);
  ct.fillStyle=type==='loid'?'#57233c':'#254776';ct.fillRect(4,4,82,82);
  ct.strokeStyle=type==='loid'?'#ca6489':'#6e9deb';ct.lineWidth=2;
  ct.beginPath();ct.arc(45,47,31,0,Math.PI*2);ct.stroke();
  ctx=ct;heroSprite(45,87,type,'down',0,false,1.45);ctx=oc;
 };
 if(HERO[type].complete&&HERO[type].naturalWidth) paint(); else HERO[type].addEventListener('load',paint,{once:true});
}
// v2.3 — assisted targeting is TOUCH ONLY, and optional in settings.
// Use world-space positions so the identical aim is sent to the host in multiplayer.
let attackManualAim=false;
function mobileFindTarget(strong=false){
 if(!touchUI||!player||phase!=='play')return null;
 const living=enemies.filter(e=>e.hp>0);
 if(!living.length)return null;
 const inView=living.filter(e=>e.x>=camera.x-35&&e.x<=camera.x+W+35&&e.y>=camera.y-35&&e.y<=camera.y+H+35);
 const pool=inView.length?inView:living.filter(e=>dist(e,player)<520);
 if(!pool.length)return null;
 if(strong){return pool.reduce((best,e)=>{
  const power=t=>(isBossEnemy(t)?10000000:0)+(t.elite?100000:0)+(t.maxHp||t.hp||0);
  return !best||power(e)>power(best)?e:best;
 },null);}
 return pool.reduce((best,e)=>!best||dist(e,player)<dist(best,player)?e:best,null);
}
function mobileAutoAim(strong=false){
 if(!touchUI||!ctrlSettings.aimAssist||!player||phase!=='play'||player.hp<=0||attackManualAim)return false;
 const target=mobileFindTarget(strong);if(!target)return false;
 player.aim=Math.atan2(target.y-player.y,target.x-player.x);
 mouseAim={x:target.x,y:target.y};return true;
}
function mobilePreparePowerAim(){
 if(touchUI){attackManualAim=false;mobileAutoAim(true);}
}
// Input: full keyboard, mouse aim, and touch virtual controls.
window.addEventListener('keydown',e=>{
 if(screenAdjusting){if(e.key==='Escape')setScreenAdjust(false);return;}
 if(coop.reconnecting)return;
 const key=e.key.toLowerCase(); if(!['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target?.tagName)&&[' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))e.preventDefault();
 if(phase==='ultimate'){if(['1','2','3','4'].includes(key))chooseUltimate(['fight','defesa','itens','piedade'][Number(key)-1]);return;}
 if(phase==='reward'){if(intermission601){if(merchant60()){if(key==='e'&&!e.repeat)shopInteract601();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))keys.add(key);}return;}if(['1','2','3'].includes(key))chooseCard(Number(key)-1);return;}
 if(phase==='title'){if(key==='enter')openSelection();return;}
 if(phase==='coop'&&waitingVisible()&&!['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName)){if(key==='e'&&!e.repeat){waitingTalk();return;}if(key==='escape'){waitingDialogClose();waitingMenuClose();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))keys.add(key);return;}
 if(phase!=='play')return;
 if(key==='t'&&!e.repeat){toggleMimicMenu('hero');return;}if(key==='b'&&!e.repeat){toggleMimicMenu('boss');return;}if(key==='escape'){closeMimicMenu();return;}
 keys.add(key);
 if(key===' ')dash();if(key==='q')skill();if(key==='e'&&!e.repeat)secondaryDown();if(key==='r')ultimate();if(key==='f')cardPower();if(key==='j')attack();
});
window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k);if(k==='e')secondaryUp();});window.addEventListener('blur',()=>{if(player)player.secondaryCharging=false;keys.clear();attackMobile=false;pointerDown=false;mobileMove={x:0,y:0}});
function canvasPos(e){let b=canvas.getBoundingClientRect();return {x:(e.clientX-b.left)/b.width*W+camera.x,y:(e.clientY-b.top)/b.height*H+camera.y}}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&phase==='play')mouseAim=canvasPos(e)});
canvas.addEventListener('pointerdown',e=>{if(phase!=='play')return;e.preventDefault();let p=canvasPos(e);mouseAim=p;pointerDown=true;attack();canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointerup',()=>{pointerDown=false});canvas.addEventListener('pointercancel',()=>{pointerDown=false});
const joy=$('joystick'),knob=$('knob');let joyPid=null;
function joyPosition(e){
 const b=joy.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;
 const dx=e.clientX-cx,dy=e.clientY-cy,rad=Math.max(16,b.width*.29),len=Math.hypot(dx,dy);
 const factor=Math.min(1,rad/Math.max(len,.001));
 const px=dx*factor,py=dy*factor;
 knob.style.left=`calc(50% + ${px}px)`;knob.style.top=`calc(50% + ${py}px)`;
 const strength=len/rad;
 // Small movement is a deadzone, not an accidental walk. Diagonals never exceed magnitude 1.
 const usable=strength<=.14?0:Math.min(1,(strength-.14)/.86);
 mobileMove=usable?{x:dx/len*usable,y:dy/len*usable}:{x:0,y:0};
 // Moving the left thumb does not cancel right-thumb manual targeting.
 if(!attackMobile&&touchUI)mouseAim=null;
}
joy.addEventListener('pointerdown',e=>{e.preventDefault();if(joyPid!==null)return;joyPid=e.pointerId;joy.setPointerCapture(e.pointerId);joyPosition(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyPid)joyPosition(e)});function joyEnd(e){if(e.pointerId!==joyPid)return;joyPid=null;mobileMove={x:0,y:0};knob.style.left='50%';knob.style.top='50%'}joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);joy.addEventListener('lostpointercapture',joyEnd);
let attackStick=false,attackPointer=null;const attackButton=$('btnAttack');
function attackAim(e){
 if(!attackStick||attackPointer!==e.pointerId||!player)return;
 const r=attackButton.getBoundingClientRect();
 const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
 if(Math.hypot(dx,dy)>12){
  attackManualAim=true;
  player.aim=Math.atan2(dy,dx);
  mouseAim={x:player.x+Math.cos(player.aim)*220,y:player.y+Math.sin(player.aim)*220};
 }
}
attackButton.addEventListener('pointerdown',e=>{
 e.preventDefault();if(attackPointer!==null)return;
 attackMobile=true;attackPointer=e.pointerId;attackManualAim=false;
 attackButton.setPointerCapture(e.pointerId);
 // Tap = target automatically. Drag the attack joystick = aim manually.
 if(touchUI)mobileAutoAim(false);
 attackAim(e);attack();
});
attackButton.addEventListener('pointermove',attackAim);
function attackEnd(e){if(e.pointerId!==attackPointer)return;attackMobile=false;attackPointer=null;attackManualAim=false;if(touchUI)mouseAim=null;}
for(const event of ['pointerup','pointercancel','lostpointercapture'])attackButton.addEventListener(event,attackEnd);
$('btnCardPower').addEventListener('pointerdown',e=>{e.preventDefault();mobilePreparePowerAim();cardPower()});$('btnDash').addEventListener('pointerdown',e=>{e.preventDefault();dash()});$('btnSkill').addEventListener('pointerdown',e=>{e.preventDefault();mobilePreparePowerAim();skill()});$('btnUltimate').addEventListener('pointerdown',e=>{e.preventDefault();mobilePreparePowerAim();ultimate()});
const secBtn=$('btnSecondary');let secPid=null;secBtn.addEventListener('pointerdown',e=>{e.preventDefault();secPid=e.pointerId;secBtn.setPointerCapture(e.pointerId);mobilePreparePowerAim();secondaryDown();});for(const event of ['pointerup','pointercancel','lostpointercapture'])secBtn.addEventListener(event,e=>{if(e.pointerId!==secPid)return;secPid=null;mobilePreparePowerAim();secondaryUp();});
function setDifficulty(val){difficulty=val==='pecador'?'pecador':'normal';document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===difficulty;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});}
function openSelection(bossId=null){
 YG_AUDIO.play('menu');phase='select';selectedBoss=bossId;
 $('titleScreen').classList.add('hidden');$('bossScreen').classList.add('hidden');$('selectScreen').classList.remove('hidden');
 $('selectionTitle').textContent=bossId?'ESCOLHA QUEM ENFRENTA O CHEFE':'ESCOLHA SEU HERÓI';
 const names={nordic:'REINO NÓRDICO · 1ª ONDA',frostjarl:'JARL DO GELO · ONDA 25',nameless:'CAVALEIRO INOMINÁVEL · ONDA 35 (NÓRDICA 15)',pecadoNordic:'PECADO · ONDA 40 (NÓRDICA 20)',odin:'ODIN · ONDA 30 (NÓRDICA 10)',samurai:'DAIMYŌ ONI · ONDA 5',reuni:'REUNI · ONDA 10',tsukuomi:'TSUKUOMI · ONDA 15',pecado:'PECADO · ONDA 20'};
 $('selectionIntro').textContent=bossId?'TESTE IMEDIATO: '+names[bossId]+' — escolha um dos oito protagonistas.':(selectedCampaign==='defense'?'DEFESA · Proteja a árvore sagrada.':selectedCampaign==='rush'?'BOSS RUSH · Oito chefes, sete duplas e trios infinitos.':selectedCampaign==='nordic'?'REINO NÓRDICO · 20 ondas independentes. Escolha seu herói.':'JAPÃO · 20 ondas independentes. Escolha seu herói.');
 $('selectionBack').textContent=bossId?'← VOLTAR AOS CHEFES':'← ESCOLHER OUTRO REINO';
}
function openBossList(){selectedCampaign='japan';$('worldScreen').classList.add('hidden');YG_AUDIO.play('menu');phase='bosslist';$('titleScreen').classList.add('hidden');$('selectScreen').classList.add('hidden');$('bossScreen').classList.remove('hidden');}
function launchHero(type){if(type==='mimic'&&!mimicUnlocked)return;if(type==='l0id'&&!l0idUnlocked)return;if(isNordicEntry(selectedBoss)||(selectedBoss===null&&selectedCampaign==='nordic')){openNordicPassiveScreen(type);return;}start(type,selectedBoss,false);}
function openWorldSelect(){YG_AUDIO.play('menu');phase='world';$('titleScreen').classList.add('hidden');$('selectScreen').classList.add('hidden');$('worldScreen').classList.remove('hidden');}
function chooseWorld(world){selectedCampaign=world==='defense'?'defense':world==='rush'?'rush':world==='nordic'?'nordic':'japan';$('worldScreen').classList.add('hidden');openSelection();}
$('worldDefense62').addEventListener('click',()=>chooseWorld('defense'));$('profileOpen62').addEventListener('click',()=>{$('profilePanel62').hidden=false;drawProfile62();});$('profileClose62').addEventListener('click',()=>{$('profilePanel62').hidden=true;});
$('worldRush').addEventListener('click',()=>chooseWorld('rush'));
$('worldJapan').addEventListener('click',()=>chooseWorld('japan'));
$('worldNordic').addEventListener('click',()=>chooseWorld('nordic'));
$('worldBack').addEventListener('click',()=>{phase='title';$('worldScreen').classList.add('hidden');$('titleScreen').classList.remove('hidden');});
$('titleStart').addEventListener('click',openWorldSelect);
$('nordicRealmBtn').addEventListener('click',()=>{selectedCampaign='nordic';openSelection('nordic');});
$('titleSelect').addEventListener('click',openBossList);
$('bossBack').addEventListener('click',()=>{$('bossScreen').classList.add('hidden');openWorldSelect();});
$('passiveBack').addEventListener('click',()=>{$('nordicPassiveScreen').classList.add('hidden');$('selectScreen').classList.remove('hidden');phase='select';});
$('passiveConfirm').addEventListener('click',()=>{if(!validNordicPassives(pendingNordicPassives)||!pendingNordicHero)return;const hero=pendingNordicHero;$('nordicPassiveScreen').classList.add('hidden');start(hero,selectedBoss,false);});
$('selectionBack').addEventListener('click',()=>{if(selectedBoss&&selectedBoss!=='nordic')openBossList();else openWorldSelect();});
for(const b of document.querySelectorAll('[data-boss]'))b.addEventListener('click',()=>openSelection(b.dataset.boss));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setDifficulty(b.dataset.mode)));setDifficulty('normal');
for(const btn of document.querySelectorAll('[data-supreme]'))btn.addEventListener('click',()=>chooseUltimate(btn.dataset.supreme));
$('chooseLoid').addEventListener('click',()=>launchHero('loid'));
$('chooseKris').addEventListener('click',()=>launchHero('kris'));
$('chooseCross').addEventListener('click',()=>launchHero('cross'));$('chooseEve').addEventListener('click',()=>launchHero('eve'));$('chooseKali').addEventListener('click',()=>launchHero('kali'));$('chooseMollitiam').addEventListener('click',()=>launchHero('mollitiam'));
$('restart').onclick=restart;$('retry').onclick=restart;

// -- Multiplayer test: one host-authoritative game, two remote players, 10 snapshots/s. --
function coopRemember(){try{if(coop.token&&coop.room)sessionStorage.setItem('ygg.coop.resume',JSON.stringify({token:coop.token,code:coop.room}));else sessionStorage.removeItem('ygg.coop.resume');}catch{}}
function coopReconnectUI(message){const el=$('networkRecovery');if(!el)return;el.classList.toggle('hidden',!coop.reconnecting);if(coop.reconnecting){$('networkRecoveryText').textContent=message||'Tentando recuperar sua vaga e seu progresso...';$('networkRecoveryTime').textContent=Math.ceil(Math.max(0,coop.reconnectUntil-Date.now())/1000)+' s';}}
function coopStopTimers(){clearTimeout(coop.retryTimer);coop.retryTimer=null;if(coop.heartbeat){clearInterval(coop.heartbeat);coop.heartbeat=null;}}
function coopResetSeq(epoch){coop.epoch=epoch||1;coop.lastStateSeq=0;coop.lastMotionSeq=0;coop.stateSeq=0;coop.motionSeq=0;coop.lastCheckpoint=0;coop.lastUrgent=0;coop.lastStateStage=0;coop.lastStatePhase=null;coop.checkpointDirty=true;coop.lastMotionArrival=0;coop.lastInputSignature='';coop.lastInputControls616='';coop.lastInputSent=0;coop.lastInput=0;coop.motionHistory615.clear();coop.targetAllies.clear();coop.targetLocal=null;coop.lastStateBytes615=0;coop.lastSnapshotAttempt615=0;coop.clock615=null;coop.motionSim615=null;coop.guestAttackAt615=-Infinity;coop.predBlink615=null;netJitter=0;}
function coopRecoveryFailed(message){coopLeave();coopNote(message||'Tempo de reconexão encerrado.');restart();}
function coopScheduleResume(){
 if(!coop.reconnecting)return;coopReconnectUI();clearTimeout(coop.retryTimer);
 if(Date.now()>=coop.reconnectUntil){coopRecoveryFailed('Reserva expirada.');return;}
 coop.retryTimer=setTimeout(()=>{if(coop.reconnecting)coopOpenSocket({t:'resume',code:coop.room,token:coop.token});},3000);
}
function coopLost(){
 if(!coop.token||!coop.room){coop.active=false;coopNote('Servidor indisponível. Tente novamente.');return;}
 if(!coop.reconnecting){coop.reconnecting=true;coop.reconnectUntil=Date.now()+120000;keys.clear();pointerDown=false;attackMobile=false;mobileMove={x:0,y:0};}
 coopScheduleResume();
}
function coopOpenSocket(initial){
 if(coop.socket){const old=coop.socket;coop.socket=null;try{old.close();}catch{}}
 coopStopTimers();let sock;try{sock=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws?mode=coop');}catch{coopLost();return;}
 coop.socket=sock;coop.wire616=false;coop.lastPong=Date.now();netRtt=null;netRttSamples=[];netRawRtt=null;edgeRtt=null;edgeColo='';
 sock.onopen=()=>{if(coop.socket!==sock)return;coop.lastPong=Date.now();coop.lastEdgeProbe=Date.now();coopSend({...initial,wire616:1});coopSend({t:'ping',ts:Date.now(),mono:performance.now()});probeEdge(sock);};
 sock.onmessage=e=>{if(coop.socket!==sock)return;let m;try{m=JSON.parse(e.data)}catch{return;}coopOnMessage(m);};
 sock.onerror=()=>{if(coop.socket===sock)coopNote('Conexão instável.');};
 sock.onclose=()=>{if(coop.socket!==sock)return;coop.socket=null;coopStopTimers();coopLost();};
 coop.heartbeat=setInterval(()=>{if(coop.socket!==sock)return;coopReconnectUI();if(coop.reconnecting&&Date.now()>=coop.reconnectUntil){coopRecoveryFailed('Reserva expirada.');return;}if(Date.now()-coop.lastPong>11000){coop.socket=null;try{sock.close();}catch{}coopStopTimers();coopLost();return;}if(sock.readyState===WebSocket.OPEN){coopSend({t:'ping',ts:Date.now(),mono:performance.now()});if(!edgeRtt||Date.now()-(coop.lastEdgeProbe||0)>15000){coop.lastEdgeProbe=Date.now();probeEdge(sock);}}},3000);
}
function coopConnect(action, code=''){
 if(location.protocol==='file:'){coopNote('Abra pelo link publicado para jogar online.');return;}
 if(!window.WebSocket){coopNote('Este navegador não suporta WebSocket.');return;}
 coopLeave(false);$('coopScreen').classList.remove('hidden');phase='coop';coopNote('Conectando à sala...');
 coopOpenSocket(action==='create'?{t:'create',boss:$('coopCreateMode').value||'japan'}:{t:'join',code});
}
function coopFinishResume(){coop.reconnecting=false;clearTimeout(coop.retryTimer);coop.retryTimer=null;coopReconnectUI();coopRemember();}
function coopRestoreCheckpoint(cp){
 if(!cp?.actors?.[coop.id])return false;
 
 const restoreActor=(a)=>Object.assign(createPlayer(a.type),a,{input:{x:0,y:0,aim:a.aim||0,attack:false},inputAt:performance.now(),secondaryCharging:false});
 player=restoreActor(cp.actors[coop.id]);coop.hostAvatar=player;coop.allies=new Map();
 for(const m of coop.members){if(m.id!==coop.id&&cp.actors[m.id])coop.allies.set(m.id,restoreActor(cp.actors[m.id]));}
 stage=cp.stage;phase=cp.phase;intermission601=cp.intermission601||null;worldEvent60=cp.worldEvent60||null;eventChecked60=cp.eventChecked60||0;waveMod60=cp.waveMod60||'';nextHazard60=cp.nextHazard60||0;cleared60=cp.cleared60||0;difficulty=cp.difficulty;activeCampaign=cp.activeCampaign;selectedCampaign=activeCampaign;rushMode=!!cp.rushMode;defense62=!!cp.defense62;tree62=cp.tree62||null;testBossMode=!!cp.testBossMode;selectedBoss=cp.selectedBoss;essence=cp.essence;elapsed=cp.elapsed;waveBalance=coopBalance(cp.wavePlayers);nextEnemyId=cp.nextEnemyId;waveClearTimer=cp.waveClearTimer;waveIntro=cp.waveIntro;eclipseTime=cp.eclipseTime;voidCollapse=cp.voidCollapse;bossMessage=cp.bossMessage;bossMessageTimer=cp.bossMessageTimer;realityVictory=!!cp.realityVictory;mimicVictory=!!cp.mimicVictory;if(mimicVictory)unlockMimic();
 enemies=cp.enemies||[];projectiles=cp.projectiles||[];coop.projectileSeq615=Math.max(0,...projectiles.map(p=>Number(p.netId615)||0));hazards=cp.hazards||[];frostBursts=cp.frostBursts||[];healthDrops=cp.healthDrops||[];rings=cp.rings||[];slashes=cp.slashes||[];shadowClones=(cp.shadowClones||[]).filter(v=>!v.ownerId||coop.members.some(m=>m.id===v.ownerId));realityFields=cp.realityFields||[];dashShadows=cp.dashShadows||[];bonusBeam=cp.bonusBeam||null;xansBlasters=cp.xansBlasters||[];timeFields=cp.timeFields||[];evePortals=cp.evePortals||[];mirrorIllusions=(cp.mirrorIllusions||[]).map(v=>({...v,owner:v.ownerId===coop.id?player:coop.allies.get(v.ownerId)})).filter(v=>v.owner);
 particles=[];damageFloats=[];coop.choices=new Set((cp.choices||[]).filter(id=>coop.members.some(m=>m.id===id)));coop.chosen=coop.choices.has(coop.id);coop.selectingUltimate=false;
 coop.enemyTargets.clear();coop.targetAllies.clear();coop.targetLocal=null;coop.guestVisibleHp=player.hp;camera.x=clamp(player.x-W/2,0,WORLD_W-W);camera.y=clamp(player.y-H/2,0,WORLD_H-H);
 for(const id of ['rewardScreen','waitingCards','supremeScreen','gameOverScreen','fallenScreen'])$(id).classList.add('hidden');
 if(phase==='reward'){if(coop.chosen)showWaitingCards();else{showRewards();}}
 if(phase==='ultimate'){phase='play';player.coopUltimatePending=false;} // host-only menu cannot block migrated combat
 if(phase==='over'){$('gameOverScreen').classList.remove('hidden');$('endTitle').textContent=realityVictory?'JAPÃO CONQUISTADO!':'FIM DA PARTIDA';$('endText').textContent='A equipe chegou à onda '+stage+'.';}
 updateHud();return true;
}
function coopResumeStart(m){
 coop.active=true;coop.id=m.id;coop.token=m.token;coop.room=m.code;coop.hostId=m.host;coop.host=m.host===m.id;coop.members=m.members;coopMode=m.startInfo?.boss||m.boss||'japan';coopResetSeq(m.epoch);
 if(!m.started){phase='coop';coop.remoteStarted=false;waitingReset();waitingRoster(m.positions);coopPassiveSelection=(m.members.find(p=>p.id===m.id)?.passives||[]).slice();waiting.editing=false;$('titleScreen').classList.add('hidden');$('coopScreen').classList.remove('hidden');coopRenderLobby();coopFinishResume();return;}
 const cp=m.checkpoint;if(!cp){coopRecoveryFailed('Partida sem checkpoint.');return;}
 if(m.actor)cp.actors[m.id]=m.actor;if(m.chosenStage===cp.stage&&cp.phase==='reward'&&!cp.choices.includes(m.id))cp.choices.push(m.id);
 const wasPlaying=coop.remoteStarted&&!!player;
 if(!wasPlaying){difficulty=m.startInfo?.difficulty||'normal';selectedCampaign=cp.activeCampaign||'japan';const host=coop.host;coop.host=false;start(m.actor?.type||cp.actors[m.id]?.type||'loid',coopMode,false);coop.host=host;}
 coop.remoteStarted=true;$('coopScreen').classList.add('hidden');
 if(coop.host){if(!coopRestoreCheckpoint(cp)){coopRecoveryFailed('Checkpoint inválido.');return;}if(m.returning&&!player.reconnectProtected&&player.hp>0){player.invuln=Math.max(player.invuln||0,3);player.reconnectProtected=true;}coopFinishResume();coopSendState(true);coopTryWave();}
 else{for(const id of ['rewardScreen','waitingCards','supremeScreen','gameOverScreen','fallenScreen'])$(id).classList.add('hidden');phase='play';coop.selectingUltimate=false;coop.chosen=false;const visual={...cp,seq:1,actors:Object.fromEntries(Object.entries(cp.actors).filter(([id])=>coop.members.some(p=>p.id===id)))};coopApplyState(visual);coop.lastStateSeq=0;if(cp.choices?.includes(coop.id)&&phase==='reward'){coop.chosen=true;$('rewardScreen').classList.add('hidden');showWaitingCards(cp.choices.length,coop.members.length);}coopFinishResume();}
 coopNote('Conexão recuperada.');
}
// Lobby uses separate visual actors: no combat state, cards, or cooldowns are carried into wave 1.
const WAIT_JP_POLYS=[[[650,345],[1184,345],[1200,570],[1150,620],[1100,675],[925,675],[870,620],[780,620],[710,670],[650,595],[620,535],[620,460]],[[330,505],[650,490],[665,565],[330,575]],[[205,575],[335,505],[350,575],[265,680],[255,750],[295,825],[330,900],[302,946],[217,850],[185,735],[180,650]]];
const WAIT_NPCS=[{id:'amaterasu',x:914,y:391},{id:'caine',x:1015,y:463}];
function waitingJapanWalk(x,y){const px=(x-244)*1448/960,py=(y-180)*1086/600;return WAIT_JP_POLYS.some(poly=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside;}return inside;})&&!WAIT_NPCS.some(n=>Math.hypot(x-n.x,y-n.y)<18);}
function waitingSpawn(i,nordic){return {x:nordic?584+(i%5)*70:780+(i%5)*58,y:nordic?600:490,face:'down',moving:false};}
const waitingJapanMap=new Image();waitingJapanMap.src='assets/lobby/japan.png?v=498';
const waitingNpcArt={};for(const id of ['amaterasu','caine']){waitingNpcArt[id]=Array.from({length:id==='amaterasu'?4:1},(_,i)=>{const im=new Image();im.src='assets/lobby/'+(id==='caine'?'caine':id+i)+'.png?v=498';return im;});}
const WAIT_DIALOGS={amaterasu:["Ah! Que alegria receber vocês! Sejam bem-vindos ao meu pequeno templo. Espero que estejam se sentindo em casa!","Estão esperando seus companheiros? Aproveitem para descansar. Até os guerreiros mais fortes precisam de um momento de paz.","O Caine parece assustador, não é? Mas ele é um amorzinho! Só não contem a ele que eu disse isso, hehe!","Loid carrega um enorme peso sobre seus ombros. Espero que, algum dia, ele encontre um motivo para sorrir de verdade.","Não importa o tamanho da escuridão que encontrarem. Uma pequena luz ainda é capaz de iluminar o caminho.","Voltaram para conversar comigo? Que fofos! Já estava começando a sentir saudades.","Vocês já comeram hoje? Não quero ninguém enfrentando criaturas terríveis de barriga vazia!","Prometam que vão cuidar uns dos outros, está bem? Que minha luz acompanhe cada um de vocês."],caine:["Alto! Identifiquem-se... Haha! Estou brincando. Se fossem inimigos, já teriam percebido.","Sua Majestade, o rei Loid, confia em mim. Espero que isso seja suficiente para vocês entenderem o quanto sou competente.","Mantenham a formação, protejam seus companheiros e tentem não morrer. Principalmente essa última parte.","Estamos esperando reforços? Ótimo. Finalmente uma desculpa para não trabalhar.","Boa sorte, recrutas. Voltem inteiros. Não estou com vontade de preencher relatórios."]};
function waitingNearest(){if(isNordicEntry(coopMode))return null;const a=waiting.actors.get(coop.id);if(!a)return null;return WAIT_NPCS.map(n=>({n,d:Math.hypot(n.x-a.x,n.y-a.y)})).filter(v=>v.d<70).sort((a,b)=>a.d-b.d)[0]?.n||null;}
function waitingDialogClose(){if(waiting.dialog)waiting.dialogCooldown[waiting.dialog.id]=waiting.clock+.65;waiting.dialog=null;waiting.dialogUntil=0;$('waitingDialog').hidden=true;}
function waitingDialogueDuration(line){return Math.max(3.5,Math.min(12,1.8+line.length/17));}
function waitingTalk(next=false){if(!waitingVisible()||screenAdjusting||waiting.dialog||waiting.menu||next)return;const n=waitingNearest();if(!n||(waiting.dialogCooldown[n.id]||0)>waiting.clock)return;const lines=WAIT_DIALOGS[n.id];let i=waiting.dialogIndex[n.id]||0;const line=n.id==='amaterasu'&&Math.random()<.05?'Posso contar um segredinho? Mesmo sendo a deusa do Sol, às vezes também tenho medo da escuridão.':lines[i%lines.length];waiting.dialogIndex[n.id]=i+1;waiting.dialog=n;waiting.dialogUntil=waiting.clock+waitingDialogueDuration(line);waiting.joy={x:0,y:0};keys.clear();$('waitingNpcName').textContent=n.id==='caine'?'Caine · Capitão da Guarda Real':'Amaterasu · Deusa do Sol';$('waitingPortrait').src='assets/lobby/'+n.id+'_portrait.webp';$('waitingPortrait').alt=n.id;$('waitingNpcText').textContent=line;$('waitingDialog').hidden=false;}
function waitingMenuClose(){waiting.menu=false;$('waitingOptions').classList.remove('is-open');}
const waiting={menu:false,dialog:null,dialogUntil:0,dialogCooldown:{},dialogIndex:{},realm:null,actors:new Map(),editing:false,clock:0,lastSend:0,lastSig:'',joy:{x:0,y:0},pid:null};
function waitingVisible(){return coop.active&&!coop.remoteStarted&&phase==='coop'&&!$('waitingMap').hidden;}
function waitingReset(){waitingDialogClose();waitingMenuClose();waiting.realm=null;waiting.dialogCooldown={};document.body.classList.remove('waiting-full');waiting.actors.clear();waiting.editing=false;waiting.lastSend=0;waiting.lastSig='';waiting.joy={x:0,y:0};waiting.pid=null;keys.clear();$('waitingMap').hidden=true;}
function waitingRoster(positions={}){
 const realm=isNordicEntry(coopMode);if(waiting.realm!==realm){waiting.actors.clear();waiting.realm=realm;waitingDialogClose();}
 const ids=new Set(coop.members.filter(m=>m.hero).map(m=>m.id));
 for(const id of waiting.actors.keys())if(!ids.has(id))waiting.actors.delete(id);
 let i=0;for(const m of coop.members){if(!m.hero)continue;const pos=positions?.[m.id]||waitingSpawn(i,realm);i++;
  const old=waiting.actors.get(m.id);if(!old||old.type!==m.hero){waiting.actors.set(m.id,{type:m.hero,x:pos.x,y:pos.y,tx:pos.x,ty:pos.y,face:pos.face||'down',moving:false,step:0});}else if(m.id!==coop.id&&positions?.[m.id])waitingReceive({id:m.id,...pos});
 }
}
function waitingReceive(m){const a=waiting.actors.get(m.id);if(!a||m.id===coop.id||!Number.isFinite(m.x)||!Number.isFinite(m.y))return;a.tx=m.x;a.ty=m.y;a.face=m.face;a.moving=!!m.moving;a.received=waiting.clock;}
function waitingUI(){
 const mine=coop.members.find(m=>m.id===coop.id);const show=!!mine?.hero&&!waiting.editing&&!coop.remoteStarted;
 document.body.classList.toggle('waiting-full',show);if(!show){waitingDialogClose();waitingMenuClose();}
 const wasHidden=$('waitingMap').hidden;$('waitingMap').hidden=!show;$('waitingChooseLabel').hidden=show;if(show&&wasHidden&&!touchUI)$('waitingCanvas').focus({preventScroll:true});
 const grid=document.querySelector('#coopLobby .new-hero-selector');if(grid)grid.hidden=show;
 const secret=document.querySelector('#coopLobby .secret-code');if(secret)secret.hidden=show;
 $('waitingMapTitle').textContent=isNordicEntry(coopMode)?'MIDGARD · REFÚGIO DO NORTE':'TEMPLO DO JAPÃO';
 $('waitingStatus').textContent=coop.host?'Compartilhe o código. Inicie quando todos estiverem prontos.':'Caminhe e aguarde o anfitrião iniciar a jornada.';
 if(!show){keys.clear();waiting.joy={x:0,y:0};}
}
function waitingFrame(dt,time){
 waiting.clock+=dt;if(waiting.dialog&&waiting.clock>=waiting.dialogUntil)waitingDialogClose();const a=waiting.actors.get(coop.id);if(!a)return;
 let mx=waiting.joy.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),my=waiting.joy.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
 const len=Math.hypot(mx,my);if(len>1){mx/=len;my/=len;}a.moving=len>.03;
 if(screenAdjusting||waiting.dialog||waiting.menu||!$('settingsScreen').classList.contains('hidden')&&$('settingsScreen').classList.contains('waiting-settings-active')){mx=0;my=0;a.moving=false;}
 if(a.moving){const oldX=a.x,oldY=a.y;const speed=185;const nx=clamp(a.x+mx*speed*dt,360,1088),ny=clamp(a.y+my*speed*dt,365,760);if(isNordicEntry(coopMode)||waitingJapanWalk(nx,a.y))a.x=nx;if(isNordicEntry(coopMode)||waitingJapanWalk(a.x,ny))a.y=ny;a.face=Math.abs(mx)>Math.abs(my)?(mx<0?'left':'right'):(my<0?'up':'down');a.moving=Math.hypot(a.x-oldX,a.y-oldY)>.01;if(a.moving)a.step+=dt*10;}
 const sig=[Math.round(a.x),Math.round(a.y),a.face,a.moving].join(':');
 if(time-waiting.lastSend>=75&&(sig!==waiting.lastSig||time-waiting.lastSend>=1000)){if(coopSend({t:'waitingMove',x:Math.round(a.x),y:Math.round(a.y),face:a.face,moving:a.moving})){waiting.lastSend=time;waiting.lastSig=sig;}}
 for(const [id,b] of waiting.actors){if(id===coop.id)continue;const d=Math.hypot(b.tx-b.x,b.ty-b.y);const k=Math.min(1,dt*13);b.x+=(b.tx-b.x)*k;b.y+=(b.ty-b.y)*k;b.moving=d>1.5||(b.moving&&waiting.clock-(b.received||0)<.23);if(b.moving)b.step+=dt*10;}
 const nearest=waitingNearest();const interact=$('waitingInteract'),hideInteract=!nearest||!!waiting.dialog||waiting.menu||screenAdjusting||(waiting.dialogCooldown[nearest?.id]||0)>waiting.clock;if(interact.hidden!==hideInteract)interact.hidden=hideInteract;if(nearest){const text='CONVERSAR · '+(nearest.id==='caine'?'CAINE':'AMATERASU');if(interact.textContent!==text)interact.textContent=text;}
 const surface=$('waitingCanvas'),c=surface.getContext('2d');if(!c)return;
 const rect=surface.getBoundingClientRect(),ratio=Math.max(.4,Math.min(4,(rect.width||960)/(rect.height||600)));const cw=ratio>=1?960:Math.round(600*ratio),ch=ratio>=1?Math.round(960/ratio):600;if(surface.width!==cw||surface.height!==ch){surface.width=cw;surface.height=ch;}
 const prior=ctx,wasMoving=movingNow,oldElapsed=elapsed;ctx=c;elapsed=waiting.clock;
 c.save();try{c.setTransform(1,0,0,1,0,0);c.fillStyle='#151324';c.fillRect(0,0,cw,ch);const nordic=isNordicEntry(coopMode),map=nordic?NORDIC_ARENA:waitingJapanMap;
 const zoom=Math.max(1,cw/960,ch/600)*1.12,vw=cw/zoom,vh=ch/zoom,sx=clamp(a.x-vw/2,244,1204-vw),sy=clamp(a.y-vh/2,180,780-vh);c.scale(zoom,zoom);c.translate(-sx,-sy);
 if(map.complete&&map.naturalWidth){if(nordic)c.drawImage(map,244,180,960,600,244,180,960,600);else c.drawImage(map,244,180,960,600);}
 const drawList=[...waiting.actors].map(([id,b])=>({id,b,y:b.y}));if(!nordic)for(const n of WAIT_NPCS)drawList.push({npc:n,y:n.y});
 for(const item of drawList.sort((a,b)=>a.y-b.y)){if(item.npc){const n=item.npc,frames=waitingNpcArt[n.id],talking=waiting.dialog?.id===n.id;const im=frames[n.id==='caine'?0:talking?2+Math.floor(waiting.clock*2)%2:(Math.floor(waiting.clock*2)%8===7?1:0)];if(im.complete&&im.naturalWidth){const h=n.id==='caine'?58:78,w=h*im.naturalWidth/im.naturalHeight;c.drawImage(im,n.x-w/2,n.y-h,w,h);}c.font='bold 12px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#14101b';c.fillStyle='#ffdc9f';const label=n.id==='caine'?'Caine':'Amaterasu';c.strokeText(label,n.x,n.y-83);c.fillText(label,n.x,n.y-83);continue;}
 const {id,b}=item;movingNow=b.moving;heroSprite(b.x,b.y,b.type,b.face,b.step,false,1.05,b);c.textAlign='center';c.font='bold 12px system-ui';c.lineWidth=3;c.strokeStyle='#14101b';c.fillStyle=id===coop.id?'#ffdf93':'#eee2ff';const text=b.type.toUpperCase()+(id===coop.hostId?' · HOST':'');c.strokeText(text,b.x,b.y-(b.type==='mollitiam'?86:65));c.fillText(text,b.x,b.y-(b.type==='mollitiam'?86:65));}
 }finally{c.restore();ctx=prior;movingNow=wasMoving;elapsed=oldElapsed;}
}
function coopRenderLobby(){
 if(coop.remoteStarted)return;
 waitingRoster();waitingUI();
 $('coopConnect').hidden=true;$('coopLobby').hidden=false;
 $('coopRoomCode').textContent=coop.room||'------';
 $('coopPeople').textContent=coop.members.length+' de 5 jogadores: '+coop.members.map(m=>(m.id===coop.id?'VOCÊ':m.id===coop.hostId?'ANFITRIÃO':'ALIADO')+' — '+(m.hero||'escolhendo')+(isNordicEntry(coopMode)?' · '+((m.passives||[]).length)+'/3 passivas':'')).join(' · ');
 const balance=coopBalance(coop.members.length),scale=$('coopScale');if(scale)scale.textContent=`ESCALA COOPERATIVA · ${balance.players}P · Chefes: ${Math.round(balance.bossHp*100)}% VIDA · ${Math.round(balance.bossDamage*100)}% DANO`;
 $('coopHostOptions').hidden=!coop.host;$('coopBegin').hidden=!coop.host;
 if(coop.host){const d=$('coopDifficulty');if(d&&!d.dataset.touched)d.value=difficulty;const b=$('coopBoss');if(b)b.value=coopMode;}renderCoopPassives();
 document.querySelectorAll('[data-coop-hero]').forEach(b=>{const mine=coop.members.some(m=>m.id===coop.id&&m.hero===b.dataset.coopHero);const occupied=coop.members.some(m=>m.id!==coop.id&&m.hero===b.dataset.coopHero);b.classList.toggle('selected',mine);b.disabled=occupied;b.classList.toggle('secret-locked',(b.dataset.coopHero==='l0id'&&!l0idUnlocked)||(b.dataset.coopHero==='mimic'&&!mimicUnlocked));b.title=occupied?'Já escolhido por outro jogador':'';});
 $('coopBegin').disabled=!coop.host||coop.members.length<2||coop.members.some(m=>!m.hero)||new Set(coop.members.map(m=>m.hero)).size!==coop.members.length||(isNordicEntry(coopMode)&&coop.members.some(m=>!validNordicPassives(m.passives)));
}
function coopOnMessage(m){
 switch(m.t){
 case 'pong':coop.lastPong=Date.now();acceptPing(Number.isFinite(m.mono)?performance.now()-m.mono:Date.now()-Number(m.ts||Date.now()));return;
 case 'welcome':
   coop.wire616=m.wire616===1;waitingReset();coop.active=true;coop.id=m.id;coop.token=m.token||null;coopResetSeq(m.epoch);coop.room=m.code;coopRemember();coop.hostId=m.host;coop.host=m.host===m.id;coop.members=m.members;coopMode=m.boss||'japan';coopPassiveSelection=[];coop.allies.clear();coop.choices.clear();coop.chosen=false;waitingRoster(m.positions);coopRenderLobby();coopNote('Conectado! Escolha seu herói e compartilhe o código.');return;
 case 'resumed':coop.wire616=m.wire616===1;coopResumeStart(m);return;
 case 'resumeDenied':coopRecoveryFailed('A vaga não está mais disponível.');return;
 case 'resumeWait':{const old=coop.socket;coop.socket=null;try{old?.close();}catch{}coopStopTimers();coopScheduleResume();return;}
 case 'hostChanged':{
   coop.hostId=m.host;coop.host=m.host===coop.id;coop.members=m.members;coopResetSeq(m.epoch);
   if(m.started&&coop.host){if(!coopRestoreCheckpoint(m.checkpoint)){coopRecoveryFailed('Não foi possível recuperar a partida.');return;}coopSendState(true);coopTryWave();}
   if(m.started){bossMessage='NOVO ANFITRIÃO · PARTIDA RECUPERADA';bossMessageTimer=3;}else coopRenderLobby();return;}
 case 'rejoined':if(coop.host&&m.actor){const a=Object.assign(createPlayer(m.actor.type),m.actor,{input:{x:0,y:0,aim:m.actor.aim||0,attack:false},inputAt:performance.now(),secondaryCharging:false});if(!a.reconnectProtected&&a.hp>0){a.invuln=Math.max(a.invuln||0,3);a.reconnectProtected=true;}coop.allies.set(m.id,a);if(m.chosenStage===stage&&phase==='reward')coop.choices.add(m.id);coop.checkpointDirty=true;coopSendState(true);coopTryWave();}return;
 case 'lobby':
   coop.room=m.code;coop.hostId=m.host;coop.host=m.host===coop.id;coop.members=m.members;coopMode=m.boss||'japan';if(!m.started){const before=waiting.actors.get(coop.id)?.type;const after=m.members.find(p=>p.id===coop.id)?.hero;if(after&&before!==after)waiting.editing=false;waitingRoster(m.positions);coopRenderLobby();}return;
 case 'waitingMove':if(!coop.remoteStarted)waitingReceive(m);return;
 case 'error':coopNote(m.message||'Erro na sala.');return;
 case 'rematchRequest':if(coop.host)coopNote('Um aliado pediu revanche. Clique em Reiniciar para voltar à mesma sala.');return;
 case 'lobbyReset':{waitingReset();coopPassiveSelection=[];coopMode='japan';coop.active=true;coop.remoteStarted=false;coop.chosen=false;coop.choices.clear();coop.selectingUltimate=false;coop.allies.clear();coop.targetAllies.clear();coop.targetLocal=null;coop.guestVisibleHp=null;coop.hostAvatar=null;phase='coop';player=null;enemies=[];projectiles=[];healthDrops=[];shadowClones=[];waveClearTimer=-1;keys.clear();pointerDown=false;attackMobile=false;document.body.classList.remove('is-playing');$('hud').style.display='none';$('mobileControls').style.display='none';for(const id of ['gameOverScreen','rewardScreen','waitingCards','fallenScreen','supremeScreen','titleScreen'])$(id).classList.add('hidden');$('coopScreen').classList.remove('hidden');$('coopConnect').hidden=true;$('coopLobby').hidden=false;$('retry').textContent='TENTAR NOVAMENTE / MESMA SALA';coopRenderLobby();coopNote('Mesma sala! Escolham o personagem e iniciem novamente.');return;}
 case 'closed':coopRecoveryFailed(m.message||'Sala fechada.');return;
 case 'left':{coop.members=coop.members.filter(p=>p.id!==m.id);const actor=coop.allies.get(m.id);if(actor&&m.reserved)coopSend({t:'detached',id:m.id,actor,chosenStage:phase==='reward'&&coop.choices.has(m.id)?stage:null});coop.allies.delete(m.id);coop.choices.delete(m.id);shadowClones=shadowClones.filter(v=>v.ownerId!==m.id);mirrorIllusions=mirrorIllusions.filter(v=>v.owner!==actor&&v.ownerId!==m.id&&v.casterId!==m.id);if(coop.host&&coop.remoteStarted){coop.checkpointDirty=true;coopTryWave();coopSendState(true);}return;}
 case 'begun':{
   waitingReset();coop.active=true;coopResetSeq(m.epoch);coop.hostId=m.host;coop.host=m.host===coop.id;coop.members=m.members;waveBalance=coopBalance(m.playerCount||m.members.length);
   coop.lastStateSeq=0;coop.stateSeq=0;coop.lastMotionSeq=0;coop.motionSeq=0;coop.guestVisibleHp=null;
   coop.enemyTargets.clear();coop.lastCombatPacket=0;
   const mine=m.members.find(p=>p.id===coop.id);const hero=mine?.hero||'loid';
   difficulty=m.difficulty==='pecador'?'pecador':'normal';coopMode=m.boss||'japan';selectedCampaign=m.boss==='nordic'||m.boss==='frostjarl'||m.boss==='nameless'||m.boss==='odin'||m.boss==='pecadoNordic'?'nordic':'japan';coop.chosen=false;coop.choices.clear();coop.remoteStarted=true;
   $('coopScreen').classList.add('hidden');start(hero,m.boss||false,false);
   if(!coop.host){coop.allies=new Map();let i=0;const others=m.members.filter(mp=>mp.id!==coop.id);for(const mp of others){const a=createPlayer(mp.hero);if(activeCampaign==='nordic'){grantNordicStarter(a,!!testBossMode);applyNordicPassives(a,mp.passives);}const angle=(i+++0.5)*Math.PI*2/Math.max(others.length,1);a.x=player.x+Math.cos(angle)*62;a.y=player.y+Math.sin(angle)*62;coop.allies.set(mp.id,a);}coopNote('Online iniciado.');}else coopSendState(true);
   return;}
 case 'remoteInput':if(coop.host){const a=coop.allies.get(m.id);if(a){a.input={x:m.x||0,y:m.y||0,aim:Number(m.aim)||0,attack:!!m.attack};a.inputAt=performance.now();}}return;
 case 'remotePress':if(coop.host)coopRemotePress(m.id,m.action,m.value,m.aim,m.dx,m.dy);return;
 case 'signal':if(!coop.host&&m.value==='ultimate'){
     coop.selectingUltimate=true;phase='ultimate';$('supremeScreen').classList.remove('hidden');
   }return;
 case 'motion':if(!coop.host&&(m.epoch===undefined||m.epoch===coop.epoch)){coop.networkRx++;coopApplyMotion(m); }return;
 case 'state':if(!coop.host&&(m.epoch===undefined||m.epoch===coop.epoch)){coop.networkRx++;lastStateArrival=performance.now();coopApplyState(m.data);}return;
 }
}
function coopInitAllies(){
 coop.allies.clear();
 let allyIndex=0;const allyTotal=Math.max(1,coop.members.length-1);for(const m of coop.members){if(m.id===coop.id)continue;
   const a=createPlayer(m.hero||'loid');if(activeCampaign==='nordic'){grantNordicStarter(a,!!testBossMode);applyNordicPassives(a,m.passives);}const angle=(allyIndex+++.5)*Math.PI*2/allyTotal;a.x=WORLD_W/2+Math.cos(angle)*62;a.y=WORLD_H/2+120+Math.sin(angle)*62;
   a.input={x:0,y:0,aim:-Math.PI/2,attack:false};a.inputAt=performance.now();a.lastAttack=0;
   coop.allies.set(m.id,a);
 }
}
function coopAction(action,value){
 if(!coop.active||!player)return;
 const move=getMove();
 const aim=mouseAim?Math.atan2(mouseAim.y-player.y,mouseAim.x-player.x):player.aim;
 coopSend({t:'press',action,value,aim,dx:move.x,dy:move.y});
}
function coopRemotePress(id,action,value,aim,dx,dy){
 const a=coop.allies.get(id);if(!a||phase==='over')return;
 if(Number.isFinite(aim))a.aim=aim;
 if(Number.isFinite(dx)&&Number.isFinite(dy)){
  a.input=a.input||{x:0,y:0,aim:a.aim,attack:false};
  a.input.x=clamp(dx,-1,1);a.input.y=clamp(dy,-1,1);a.input.aim=a.aim;
  a.inputAt=performance.now();
 }
 if(action==='shopTalk'||action==='shopExit'){shopRemote601(id,action);return;}
 if(action==='shop'||action==='relic'){if(phase==='reward'&&!coop.choices.has(id)&&(action==='shop'?shop60(a,value):equip60(a,value))){coop.checkpointDirty=true;coopSendState(true);}return;}
 if(action==='card'){
   if(phase!=='reward'||intermission601||coop.choices.has(id))return;
   const c=[...(isNordic()?nordicRewardPool(a):cards),...curse60].find(c=>c.id===value&&(!c.hero||c.hero===a.type||(c.id==='mimicMastery'&&a.mimicOrigin)));if(!c||c.id==='mimicMastery'&&a.mimicMastery)return;
   if((c.id==='frog'&&a.frogSkill)||(['gaster','granita','eveprime','mollitiamHeart','authorReality','godShadow'].includes(c.id)&&a.cardPower))return;
   if(!awardCard(a,c))return;coop.choices.add(id);coopTryWave();coop.checkpointDirty=true;coopSendState(true);return;
 }
 if(action==='ultimateChoice'){
   if(a.type!=='kris'||!a.coopUltimatePending)return;
   if(!['fight','defesa','itens','piedade'].includes(value))return;
   a.coopUltimatePending=false;a.ultimateBuff=value;a.ultimateBuffTime={fight:9,defesa:3,itens:11,piedade:9}[value];
   if(value==='piedade')a.hp=a.maxHp;
   ring(a.x,a.y,50,'#bd84ff');return;
 }
 if(phase!=='play'||a.hp<=0)return;
 if(action==='mimic'){if(mimicTransform(a,value)){coop.checkpointDirty=true;coopSendState(true);}return;}
 // Held attack is checked every frame; skip no-op strikes before expensive camera/actor setup.
 if(action==='attack'&&a.atkTime>0)return;
 if(action==='ultimate'&&a.type==='kris'){
   if(a.ultimateCharge>=100&&!a.coopUltimatePending){a.ultimateCharge=0;a.coopUltimatePending=true;coopSend({t:'signal',to:id,value:'ultimate'});}return;
 }
 const actionCanExecute=action!=='attack'||a.atkTime<=0;
 const before=player,cam={...camera},hostMouseAim=mouseAim;
 coop.actorId=id;coop.executing=true;player=a;mouseAim=null;
 camera.x=clamp(a.x-W/2,0,WORLD_W-W);camera.y=clamp(a.y-H/2,0,WORLD_H-H);
 try{
   if(action==='attack')attack();
   if(action==='q')skill();
   if(action==='eDown')secondaryDown();
   if(action==='eUp')secondaryUp();
   if(action==='dash')dash();
   if(action==='ultimate')ultimate();
   if(action==='f')cardPower();
 }finally{
  player=before;mouseAim=hostMouseAim;coop.actorId=null;coop.executing=false;
  camera.x=cam.x;camera.y=cam.y;
 }
 // Immediately replicate actions, not 125ms later; this makes a remote strike,
 // dash and power visible to EVERY client, including their effects and enemy HP.
  if(coop.active&&coop.host&&actionCanExecute&&action!=='attack'){updateHud();coopSendState(true);coopSendMotion();}
 
}
function coopAdvance(dt){
 for(const [id,a] of coop.allies){
   for(const k of ['dashCd','skillCd','secondaryCd','invuln','curseTime','frostTime','atkTime','darkAuraTime','ultimateTime','ultimateBuffTime','evePrimeTime','mollitiamHeartTime','mollitiamPose','transformTime','frogTime'])a[k]=Math.max(0,(a[k]||0)-dt);
   tickNewHero(a,dt);if(a.secondaryCharging)a.secondaryCharge=Math.min(1.6,a.secondaryCharge+dt);
   if(a.type==='cross')updateCrossBones(a,dt,id);
   // V3.4: a guest's Eve Lorey ultimate must tick on the HOST as well.
   // Previously only the local host hero entered tickEveUltimate(), so a remote
   // Eve cast the darkness effect but never actually desintegrated the Onis.
   if(a.type==='eve'&&a.voidUltimate>0){
     const previous=player; player=a;
     try{tickEveUltimate(dt);}finally{player=previous;}
   }

   const inp=a.input||{x:0,y:0,aim:-Math.PI/2,attack:false};
   if(a.hp<=0){
    // Free-roaming spirit: movement is replicated, but attacks cannot fire.
    if(performance.now()-(a.inputAt||0)<850){const ghostDir=norm(inp.x,inp.y);
     if(Math.hypot(inp.x,inp.y)>.08){a.x+=ghostDir.x*116*dt;a.y+=ghostDir.y*116*dt;
      a.step+=dt*8;a.face=Math.abs(ghostDir.x)>Math.abs(ghostDir.y)?ghostDir.x<0?'left':'right':ghostDir.y<0?'up':'down';}}
    a.moving=Math.hypot(inp.x,inp.y)>.08&&performance.now()-(a.inputAt||0)<850;a.ghost=true;applyBoundaries(a,8);continue;
   }
   if(performance.now()-(a.inputAt||0)>850){inp.x=0;inp.y=0;inp.attack=false;}
   const dir=norm(inp.x,inp.y);const active=Math.hypot(inp.x,inp.y)>.08;a.moving=active||a.dashTime>0||!!a.crossTp;
   if(a.type==='cross'&&a.crossTp){updateCrossTeleport(a,dt);}
   else if(a.dashTime>0){a.dashTime=Math.max(0,a.dashTime-dt);a.x+=a.dashV.x*(a.type==='eve'?590:340)*dt;a.y+=a.dashV.y*(a.type==='eve'?590:340)*dt;}
   else if(active){a.x+=dir.x*a.speed*newSpeed(a)*(a.evePrimeTime>0?2:1)*(a.type==='loid'&&a.ultimateTime>0?1.65:1)*(a.curseTime>0?.78:1)*(a.frostTime>0?.72:1)*dt;
     a.y+=dir.y*a.speed*newSpeed(a)*(a.evePrimeTime>0?2:1)*(a.type==='loid'&&a.ultimateTime>0?1.65:1)*(a.curseTime>0?.78:1)*(a.frostTime>0?.72:1)*dt;a.step+=dt*11;
     a.face=Math.abs(dir.x)>Math.abs(dir.y)?dir.x<0?'left':'right':dir.y<0?'up':'down';}
   if(Number.isFinite(inp.aim))a.aim=inp.aim;
   applyBoundaries(a,8);
   if(inp.attack){coopRemotePress(id,'attack');}
   if(a.type==='loid'&&a.darkAuraTime>0){a.darkAuraTick=(a.darkAuraTick||0)-dt;
     if(a.darkAuraTick<=0){a.darkAuraTick=.47;const original=player;player=a;for(const e of enemies){if(e.hp>0&&dist(e,a)<77+e.radius){hitEnemy(e,a.damage*.55*a.skillAmp);e.slow=Math.max(e.slow||0,.65);}}player=original;}}
   if(a.type==='loid'&&a.ultimateTime>0){a.ultimateTick=(a.ultimateTick||0)-dt;
     if(a.ultimateTick<=0){a.ultimateTick=.24;const original=player;player=a;for(const e of enemies){if(e.hp>0&&dist(e,a)<185+e.radius)hitEnemy(e,a.damage*1.18*a.skillAmp);}player=original;}}
 }
}
function showWaitingCards(count=coop.choices.size,total=coop.members.length){const el=$('waitingCards');if(!el)return;el.classList.remove('hidden');$('waitingProgress').textContent=`${count} / ${total} jogadores escolheram`; }
function coopTryWave(){
 if(!coop.active||!coop.host||phase!=='reward'||intermission601)return;
 if(coop.members.every(m=>coop.choices.has(m.id))){$('waitingCards').classList.add('hidden');coop.chosen=false;coop.choices.clear();testBossMode=false;stage++;spawnStage();}
}
function coopSendInput(t){
 if(!coop.active||coop.host||phase!=='play'||!player)return;
 let mx=mobileMove.x,my=mobileMove.y;
 if(keys.has('w')||keys.has('arrowup'))my-=1;if(keys.has('s')||keys.has('arrowdown'))my+=1;
 if(keys.has('a')||keys.has('arrowleft'))mx-=1;if(keys.has('d')||keys.has('arrowright'))mx+=1;
 const v=norm(mx,my);let aim=player.aim;
 if(mouseAim)aim=Math.atan2(mouseAim.y-player.y,mouseAim.x-player.x);
 else if(Math.hypot(mx,my)>.1)aim=Math.atan2(my,mx);
 const packet={t:'input',x:Math.hypot(mx,my)>.05?Math.round(v.x*100)/100:0,y:Math.hypot(mx,my)>.05?Math.round(v.y*100)/100:0,aim:Math.round(aim*100)/100,attack:keys.has('j')||pointerDown||attackMobile};const controls=[packet.x,packet.y,Number(packet.attack)].join(',');
 const signature=controls+','+packet.aim;
 const changed=controls!==coop.lastInputControls616;
 // Direction, stop and attack transitions bypass the aim-only throttle.
 if(!changed&&t-coop.lastInputSent<(signature===coop.lastInputSignature?180:40))return;
 // The next animation frame retries the latest controls when the socket was congested.
 if(coopSend(packet)){coop.lastInputControls616=controls;coop.lastInputSignature=signature;coop.lastInputSent=t;coop.lastInput=t;}
}
// 20 Hz movement-only channel: ~300 bytes instead of retransmitting projectiles,
// cards and particles every time. World/combat remains authoritative at the host.
function coopSendMotion(){
 if(!coop.active||!coop.host||!player)return;
 const actors={};
 const capture=(p,id)=>{const old=coop.motionHistory615.get(id),gap=old?elapsed-old.at:0;const blink=p.blinkSeq||0;
  const valid=old&&old.stage===stage&&old.blink===blink&&gap>.005&&gap<.5&&!p.crossTp;
  const vx=valid?clamp((p.x-old.x)/gap,-650,650):0,vy=valid?clamp((p.y-old.y)/gap,-650,650):0;
  coop.motionHistory615.set(id,{x:p.x,y:p.y,at:elapsed,stage,blink});
  return {x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10,face:p.face,step:Math.round((p.step||0)*10)/10,hp:Math.round(p.hp*10)/10,blinkSeq:blink,blinking:!!p.crossTp,vx:Math.round(vx),vy:Math.round(vy)};};
 actors[coop.id]=capture(player,coop.id);
 for(const [id,a] of coop.allies)actors[id]=capture(a,id);
 coopSend({t:'motion',epoch:coop.epoch,seq:++coop.motionSeq,stage,sim:Math.round(elapsed*1000)/1000,hostRtt:Math.round(netRtt||0),actors});
}
// A remote client must SEE when it takes damage. Previously the health bar
// could jump to zero with no local hit indicator because only the host simulated hurtPlayer.
function coopGuestHealthChange(nextHp){
 if(!Number.isFinite(nextHp)||!player)return;
 const prev=coop.guestVisibleHp;
 if(prev!==null&&nextHp<prev-.7&&phase==='play'){
  textPop(player.x,player.y-28,'-'+Math.ceil(prev-nextHp),'#ff728c','hero:'+coop.id);
  flash=Math.max(flash,.07);
  YG_AUDIO.play('hurt',.55);
 }else if(prev!==null&&nextHp>prev+.7&&phase==='play'){textPop(player.x,player.y-28,'+'+Math.round(nextHp-prev),'#a5fac0','hero:'+coop.id);}
 coop.guestVisibleHp=nextHp;
}
function coopApplyMotion(m){
 if(!m||!m.actors||m.seq<=coop.lastMotionSeq||Number.isInteger(m.stage)&&m.stage!==stage)return;
 coop.lastMotionSeq=m.seq;
 const now=performance.now();
 if(coop.lastMotionArrival){const gap=now-coop.lastMotionArrival;const expected=Number.isFinite(m.sim)&&Number.isFinite(coop.motionSim615)?clamp((m.sim-coop.motionSim615)*1000,25,500):50;netJitter=netJitter*.86+Math.abs(gap-expected)*.14;}
 coop.lastMotionArrival=now;coop.motionSim615=m.sim;
 const sample=(target,prev)=>{const gap=prev?.at!==undefined?(now-prev.at)/1000:0;const valid=gap>=.025&&gap<.35&&Math.hypot(target.x-prev.x,target.y-prev.y)<80;return {...target,at:now,hostRtt:Math.min(500,Math.max(0,m.hostRtt||0)),vx:Number.isFinite(target.vx)?target.vx:valid?clamp((target.x-prev.x)/gap,-260,260):0,vy:Number.isFinite(target.vy)?target.vy:valid?clamp((target.y-prev.y)/gap,-260,260):0};};
 const mine=m.actors[coop.id];
 if(mine&&Number.isFinite(mine.x)&&Number.isFinite(mine.y)){
  coop.targetLocal=sample(mine,coop.targetLocal);
  if(player){const seq=mine.blinkSeq||0,pred=coop.predBlink615;if(pred&&seq>=pred.seq){coop.predBlink615=null;player._netBlinkSeq=seq;if(seq>pred.seq||Math.hypot(player.x-mine.x,player.y-mine.y)>100){player.x=mine.x;player.y=mine.y;}}else if(!pred&&seq!==(player._netBlinkSeq||0)){player.x=mine.x;player.y=mine.y;player._netBlinkSeq=seq;}coopGuestHealthChange(Number(mine.hp));player.hp=mine.hp;if(mine.face&&!movingNow)player.face=mine.face;}
 }
 for(const [id,target] of Object.entries(m.actors)){
  if(id===coop.id||!Number.isFinite(target.x)||!Number.isFinite(target.y))continue;
  coop.targetAllies.set(id,sample(target,coop.targetAllies.get(id)));
  const a=coop.allies.get(id);if(a){const seq=target.blinkSeq||0;if(seq!==(a._netBlinkSeq||0)){a.x=target.x;a.y=target.y;a._netBlinkSeq=seq;}a.hp=target.hp;}
 }
}
function coopSendState(force=false){
 if(!coop.active||!coop.host||!player||coop.reconnecting||coop.socket?.bufferedAmount>32000)return;
 const now=performance.now();const changed=coop.lastStateStage!==stage||coop.lastStatePhase!==phase;
 if(force&&!changed&&now-coop.lastUrgent<100)return;if(force)coop.lastUrgent=now;if(!changed&&(coop.socket?.bufferedAmount||0)>(coop.wire616?6000:10000))return;
 const actors={};actors[coop.id]=player;for(const [id,a] of coop.allies)actors[id]=a;
 // IMPORTANT: every peer receives the COMPLETE arena, not the host camera's view.
 // No random per-client enemy selection or culled mobs; boss HP and hit registration
 // are calculated only here, on the host.
 const slim=(e)=>{const o={};for(const k of [
  'id','type','echoBossType','x','y','hp','maxHp','radius','face','step','walking','mode','move',
  'phase','rage','hurt','attack','attackPose','attackTime','atkTime','windup','charge','chargeTime',
  'chargeDir','guardTime','guardCd','corruptTime','corrupted','slow','speed',
  'counterCd','summonTimer','bossPhase','specialIndex','corruptionPhase','isElite',
  'dragonIntro','dragonFxMove','dragonFxTime','pactBroken','fireCd','fireTime','fireWindup','fireAngle','dragonSpawned','odinFx','odinFxTime','odinShield',
  'elite','elite62','stunTime','timeSlow','burnTime','burnTick','angle','r','color','vx','vy','bone','life',
  'max','from','damage','netId615','ownerId','mirror','mimicShot','mimicFx','mimicCharge','abShot','abBlast','abCharge','secretKind','secretUntil','secretName','copyHero','copyCards','copyDamage','copyArmor','copyReach','copySkillDelay','lockX','lockY','time','telegraph'
 ])if(e[k]!==undefined)o[k]=e[k];return o;};
 const mandatory=coop.lastStateStage!==stage||coop.lastStatePhase!==phase;
 const sendActors={};for(const [id,p] of Object.entries(actors)){
  const o={};for(const [k,v] of Object.entries(p)){
   if(typeof v==='function'||k==='input'||k==='inputAt'||k==='lastAttack'||k==='cards'||k==='runes'||k==='lastX'||k==='lastY'||k==='_renderStep')continue;
   o[k]=v;
  }if(p.cards)o.cards=p.cards.slice();if(p.runes)o.runes=p.runes.slice();sendActors[id]=o;
 }
 for(const p of projectiles)if(!p.netId615)p.netId615=++coop.projectileSeq615;
 const packet={t:'state',epoch:coop.epoch,data:{seq:++coop.stateSeq,actors:sendActors,
  stage,phase,difficulty,rushMode,defense62,tree62,essence,testBossMode,intermission601,worldEvent60,eventChecked60,waveMod60,nextHazard60,cleared60,wavePlayers:waveBalance.players,choicesCount:coop.choices.size,choiceIds:[...coop.choices],
  memberCount:coop.members.length,
  enemies:enemies.filter(e=>e.hp>0).map(slim),
  projectiles:projectiles.slice(-160).map(slim),
  hazards:hazards.slice(-60),healthDrops:healthDrops,
  rings:rings.slice(-20),slashes:slashes.slice(-20),
  shadowClones:shadowClones.slice(-64).map(cloneWire),realityFields,realityVictory,mimicVictory,dashShadows:dashShadows.slice(-18),
  bonusBeam,xansBlasters:xansBlasters.slice(-4),timeFields:timeFields.slice(-3).map(t=>({...t})),mirrorIllusions:mirrorIllusions.slice(-25).map(v=>({x:v.x,y:v.y,life:v.life,ownerType:v.owner?.type||'kali'})),voidCollapse,evePortals:evePortals.slice(-5),waveIntro,eclipseTime,bossMessage,bossMessageTimer,elapsed,mandatory
 }};
 // A complete authoritative checkpoint is kept by the room server only, not broadcast to all guests.
 const checkpointDue=mandatory||(coop.checkpointDirty&&now-coop.lastCheckpoint>=500)||now-coop.lastCheckpoint>=3000;
 if(checkpointDue){const ownerId=v=>Object.entries(actors).find(([,a])=>a===v.owner)?.[0];packet.checkpoint={...packet.data,actors:sendActors,activeCampaign,testBossMode,selectedBoss,nextEnemyId,waveClearTimer,choices:[...coop.choices],enemies,projectiles,hazards,frostBursts,shadowClones,mirrorIllusions:mirrorIllusions.map(v=>({x:v.x,y:v.y,life:v.life,attackCd:v.attackCd,ownerId:v.ownerId||ownerId(v),casterId:v.casterId})),evePortals:evePortals.filter(p=>!p.local)};}
 if(coopSend(packet)){coop.lastStateStage=stage;coop.lastStatePhase=phase;coop.lastSnapshot=now;coop.lastSnapshotAttempt615=now;if(checkpointDue){coop.lastCheckpoint=now;coop.checkpointDirty=false;}}
}
function coopApplyState(s){
 s=unpackWorld616(s);
 if(!s||!s.actors||!s.actors[coop.id])return;
 if(Number.isFinite(s.seq)&&s.seq<=coop.lastStateSeq)return;
 if(Number.isFinite(s.seq))coop.lastStateSeq=s.seq;
 const receivedAt=performance.now();coop.lastCombatPacket=receivedAt;
 const target=s.actors[coop.id];
 if(!player||player.type!==target.type){player=createPlayer(target.type);coop.guestVisibleHp=null;}
 coopGuestHealthChange(Number(target.hp));
 const wasIntermission601=!!intermission601;const wasStage=stage,wasX=player.x,wasY=player.y,localAim=player.aim,localStep=player.step;const newStage=wasStage!==s.stage||!coop.clock615;
 if(newStage){coop.targetAllies.clear();coop.targetLocal=null;coop.lastMotionArrival=0;coop.motionSim615=null;coop.guestAttackAt615=-Infinity;coop.predBlink615=null;}
 const ownSkin62=player.skin62||0;Object.assign(player,target);player.skin62=ownSkin62||skin62(player);
 // Local aim belongs to the player holding the controls; network snapshots
 // must not constantly replace it with an older direction from the host.
 if(Number.isFinite(localAim))player.aim=localAim;
 if(coop.predBlink615&&receivedAt<coop.predBlink615.until){player.blinkSeq=Math.max(player.blinkSeq||0,coop.predBlink615.seq);player.dashCd=Math.max(player.dashCd||0,.12);}
 if(!newStage&&receivedAt-coop.guestAttackAt615<player.attackDelay*newAttackDelay(player)*1000){player.atkTime=Math.max(player.atkTime||0,player.attackDelay*newAttackDelay(player)-(receivedAt-coop.guestAttackAt615)/1000);}
 if(newStage||receivedAt-coop.lastMotionArrival>350)coop.targetLocal={x:target.x,y:target.y,at:receivedAt,vx:0,vy:0};
 if(!newStage&&((target.blinkSeq||0)===(player._netBlinkSeq||0)||coop.predBlink615&&(target.blinkSeq||0)<=coop.predBlink615.seq)&&Math.hypot(wasX-target.x,wasY-target.y)<230){player.x=wasX;player.y=wasY;player.step=localStep;}else{player._netBlinkSeq=target.blinkSeq||0;}
 const nextAllies=new Map(),nextTargets=new Map();
 for(const [id,hero] of Object.entries(s.actors)){
  if(id===coop.id)continue;const old=coop.allies.get(id);if(old?.cards&&!hero.cards)hero.cards=old.cards;if(old?.runes&&!hero.runes)hero.runes=old.runes;
  if(old&&!newStage&&(hero.blinkSeq||0)===(old._netBlinkSeq||0)&&Math.hypot(old.x-hero.x,old.y-hero.y)<230){nextAllies.set(id,{...hero,x:old.x,y:old.y,step:old.step,_netBlinkSeq:old._netBlinkSeq,moving:old.moving});}
  else nextAllies.set(id,{...hero,_netBlinkSeq:hero.blinkSeq||0});
  if(newStage||receivedAt-coop.lastMotionArrival>350)nextTargets.set(id,{x:hero.x,y:hero.y,at:receivedAt,vx:0,vy:0});else nextTargets.set(id,coop.targetAllies.get(id)||{x:hero.x,y:hero.y,at:receivedAt});
 }
 coop.allies=nextAllies;coop.targetAllies=nextTargets;
 stage=s.stage;testBossMode=!!s.testBossMode;intermission601=s.intermission601||null;worldEvent60=s.worldEvent60||null;waveMod60=s.waveMod60||'';cleared60=s.cleared60||0;rushMode=!!s.rushMode;defense62=!!s.defense62;tree62=s.tree62||null;activeCampaign=defense62?'defense':!rushMode&&stage>=21?'nordic':'japan';difficulty=s.difficulty||'normal';waveBalance=coopBalance(s.wavePlayers||coop.members.length);essence=s.essence;if(coop.chosen&&s.phase==='reward')showWaitingCards(s.choicesCount,s.memberCount);
 // Reuse visible enemy objects by ID, smoothly tracking the server's version.
 const oldEnemies=new Map((newStage?[]:enemies).map(e=>[e.id,e]));
 const nextEnemyTargets=new Map();
 enemies=(s.enemies||[]).map(incoming=>{
  const old=oldEnemies.get(incoming.id);
  if(!old)return {...incoming,walking:!!incoming.walking,_serverX:incoming.x,_serverY:incoming.y,_serverAt615:s.elapsed,_receivedAt:receivedAt};
  incoming.walking=Math.hypot(incoming.x-(old._serverX??old.x),incoming.y-(old._serverY??old.y))>.25;
  const delta=clamp(Number.isFinite(s.elapsed)&&Number.isFinite(old._serverAt615)?s.elapsed-old._serverAt615:(receivedAt-(old._receivedAt||receivedAt-125))/1000,.035,.45);
  const vx=clamp((incoming.x-(old._serverX??old.x))/delta,-260,260);
  const vy=clamp((incoming.y-(old._serverY??old.y))/delta,-260,260);
  const x=old.x,y=old.y,step=old.step;
  // Visual confirmation for remote hits (never applies damage locally).
  const damageSeen=Number(old.hp)-Number(incoming.hp);
  if(Number.isFinite(damageSeen)&&damageSeen>0.9&&phase==='play'){
    textPop(incoming.x,incoming.y-19,Math.round(damageSeen),'#f7d0ff',incoming.id);
  }
  Object.assign(old,incoming);
  old._receivedAt=receivedAt;old._serverX=incoming.x;old._serverY=incoming.y;old._serverAt615=s.elapsed;
  if(Math.hypot(x-incoming.x,y-incoming.y)<230){old.x=x;old.y=y;old.step=step;}
  nextEnemyTargets.set(incoming.id,{x:incoming.x,y:incoming.y,vx,vy});
  return old;
 });
 for(const incoming of s.enemies||[]){if(!nextEnemyTargets.has(incoming.id))nextEnemyTargets.set(incoming.id,{x:incoming.x,y:incoming.y,vx:0,vy:0});}
 coop.enemyTargets=nextEnemyTargets;
 const oldShots=new Map((newStage?[]:projectiles).filter(p=>p.netId615).map(p=>[p.netId615,p]));
 projectiles=(s.projectiles||[]).map(p=>{const old=oldShots.get(p.netId615);return old&&Math.hypot(old.x-p.x,old.y-p.y)<140?{...p,x:old.x,y:old.y,_netTarget615:{x:p.x,y:p.y,at:receivedAt}}:{...p,_netTarget615:{x:p.x,y:p.y,at:receivedAt}};});hazards=s.hazards||[];
 healthDrops=s.healthDrops||[];rings=s.rings||[];const localSlashes=newStage?[]:slashes.filter(v=>v.local615&&v.life>0);slashes=[...(s.slashes||[]),...localSlashes.filter(v=>!(s.slashes||[]).some(h=>Math.hypot(v.x-h.x,v.y-h.y)<18&&Math.abs(v.ang-h.ang)<.35))];shadowClones=wasStage===s.stage?mergeGuestClones(s.shadowClones||[]):(s.shadowClones||[]);realityFields=s.realityFields||[];if(s.realityVictory)unlockL0id();if(s.mimicVictory)unlockMimic();dashShadows=s.dashShadows||[];
 bonusBeam=s.bonusBeam||null;xansBlasters=s.xansBlasters||[];timeFields=s.timeFields||[];mirrorIllusions=(s.mirrorIllusions||[]).map(v=>({...v,owner:{type:v.ownerType}}));voidCollapse=s.voidCollapse||0;if(Array.isArray(s.evePortals)&&s.evePortals.length){const old=evePortals.filter(x=>x.local);evePortals=[...old,...s.evePortals.map(p=>({...p}))].slice(-7);}waveIntro=s.waveIntro||0;eclipseTime=s.eclipseTime||0;
 if(Number.isFinite(s.elapsed)){if(newStage||Math.abs(s.elapsed-elapsed)>.65)elapsed=s.elapsed;else elapsed+=clamp(s.elapsed-elapsed,-.035,.035);coop.clock615={at:receivedAt,elapsed:s.elapsed};}bossMessage=s.bossMessage||'';bossMessageTimer=s.bossMessageTimer||0;
 if(!coop.selectingUltimate){
   if(s.phase==='reward'&&phase!=='reward'){phase='reward';coop.chosen=false;showRewards();}
   else if(s.phase==='play'&&phase!=='play'){phase='play';$('waitingCards').classList.add('hidden');coop.chosen=false;$('rewardScreen').classList.add('hidden');$('supremeScreen').classList.add('hidden');}
   else if(s.phase==='over'&&phase!=='over'){phase='over';$('gameOverScreen').classList.remove('hidden');$('endTitle').textContent='FIM DA PARTIDA';$('endText').textContent='A equipe chegou à onda '+stage+'.';}
 }
 if(s.phase==='reward'&&wasIntermission601&&!intermission601&&!coop.chosen)showRewards();syncIntermission601();if(s.phase==='reward'&&!coop.chosen&&!intermission601){rewardTools60();}if(s.phase==='reward'||s.phase==='over'){record62();submitRank60();}if(s.phase==='reward'&&Array.isArray(s.choiceIds)&&s.choiceIds.includes(coop.id)){coop.chosen=true;$('rewardScreen').classList.add('hidden');showWaitingCards(s.choicesCount,s.memberCount);}updateHud();const death=$('fallenScreen');if(death)death.classList.toggle('hidden',!(coop.active&&phase==='play'&&player.hp<=0));
}
function coopLeave(sendLeave=true){
 if(onlineScaleSaved615!==null){RENDER_SCALE=onlineScaleSaved615;onlineScaleSaved615=null;canvas.width=Math.round(W*RENDER_SCALE);canvas.height=Math.round(H*RENDER_SCALE);}
 intermission601=null;syncIntermission601();waitingReset();
 if(coop.socket){if(sendLeave)coopSend({t:'leave'});const old=coop.socket;coop.socket=null;try{old.close();}catch{}}
 coopStopTimers();coop.reconnecting=false;coop.token=null;coopRemember();coopReconnectUI();coop.remoteStarted=false;
 coop.active=false;coop.host=false;coop.id=null;coop.hostId=null;coop.room=null;coop.socket=null;
 coop.members=[];coopPassiveSelection=[];coopMode='japan';coop.motionHistory615.clear();coop.clock615=null;coop.allies.clear();coop.targetAllies.clear();coop.targetLocal=null;coop.hostAvatar=null;coop.guestVisibleHp=null;coop.choices.clear();coop.chosen=false;coop.actorId=null;coop.executing=false;coop.selectingUltimate=false;
 $('coopScreen').classList.add('hidden');$('coopConnect').hidden=false;$('coopLobby').hidden=true;
}
$('titleOnline').addEventListener('click',()=>{
 phase='coop';$('titleScreen').classList.add('hidden');$('coopScreen').classList.remove('hidden');$('coopConnect').hidden=false;$('coopLobby').hidden=true;coopNote('Crie uma sala ou entre com o código de um amigo.');
});
$('coopCreate').addEventListener('click',()=>coopConnect('create'));
$('coopJoin').addEventListener('click',()=>coopConnect('join',$('coopCode').value));
$('coopBack').addEventListener('click',()=>{coopLeave();phase='title';$('titleScreen').classList.remove('hidden');});
$('coopCopy').addEventListener('click',()=>{if(coop.room&&navigator.clipboard)navigator.clipboard.writeText(coop.room).then(()=>coopNote('Código copiado!')).catch(()=>coopNote('Código da sala: '+coop.room));});
$('waitingChange').addEventListener('click',()=>{waiting.editing=true;waitingUI();});
$('waitingMenu').addEventListener('click',()=>{waitingDialogClose();$('waitingAudio').textContent=$('toggleAudio').textContent;$('waitingVolume').value=$('audioVolume').value;waiting.menu=true;keys.clear();waiting.joy={x:0,y:0};$('waitingOptions').classList.add('is-open');});
$('waitingOptionsClose').addEventListener('click',waitingMenuClose);
$('waitingControls').addEventListener('click',()=>{waitingMenuClose();openControlSettings();$('settingsScreen').classList.add('waiting-settings-active');});
$('waitingAudio').addEventListener('click',()=>{$('toggleAudio').click();$('waitingAudio').textContent=$('toggleAudio').textContent;});$('waitingVolume').addEventListener('input',e=>{YG_AUDIO.setVolume(e.target.value);});
$('waitingInteract').addEventListener('click',()=>waitingTalk());$('waitingDialogClose').addEventListener('click',waitingDialogClose);
// NPC interaction is explicit (button or E), never a random tap on the map.
for(const b of document.querySelectorAll('[data-coop-hero]'))b.addEventListener('click',()=>{if((b.dataset.coopHero==='l0id'&&!l0idUnlocked)||(b.dataset.coopHero==='mimic'&&!mimicUnlocked))return;waiting.editing=false;waitingUI();coopSend({t:'choose',hero:b.dataset.coopHero});});
const waitingStick=$('waitingStick'),waitingKnob=$('waitingKnob');
function waitingTouch(e){const box=waitingStick.getBoundingClientRect(),r=box.width*.32;let x=e.clientX-box.left-box.width/2,y=e.clientY-box.top-box.height/2;const l=Math.hypot(x,y);if(l>r){x*=r/l;y*=r/l;}waiting.joy={x:x/r,y:y/r};waitingKnob.style.left=`calc(50% + ${x}px)`;waitingKnob.style.top=`calc(50% + ${y}px)`;}
waitingStick.addEventListener('pointerdown',e=>{e.preventDefault();if(waiting.pid!==null)return;waiting.pid=e.pointerId;waitingStick.setPointerCapture(e.pointerId);waitingTouch(e);});
waitingStick.addEventListener('pointermove',e=>{if(e.pointerId===waiting.pid)waitingTouch(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])waitingStick.addEventListener(event,e=>{if(e.pointerId!==waiting.pid)return;waiting.pid=null;waiting.joy={x:0,y:0};waitingKnob.style.left='50%';waitingKnob.style.top='50%';});
window.addEventListener('blur',()=>{waiting.joy={x:0,y:0};});
$('coopBoss').addEventListener('change',e=>{coopMode=e.target.value;coopSend({t:'mode',boss:coopMode});coopRenderLobby();});
$('coopDifficulty').addEventListener('change',e=>{e.target.dataset.touched='1';setDifficulty(e.target.value);});
$('coopBegin').addEventListener('click',()=>{if(isNordicEntry(coopMode)&&coop.members.some(m=>!validNordicPassives(m.passives))){coopNote('Cada jogador precisa escolher 3 passivas antes de começar.');return;}const selected=$('coopDifficulty').value;setDifficulty(selected);coopSend({t:'begin',boss:$('coopBoss').value||'japan',difficulty:selected});});


// Mobile UI preferences; only CSS sizes change, never the original artwork.
const ctrlSettings={scale:1,attackStick:false,aimAssist:true};
function applyControlSettings(){document.documentElement.style.setProperty('--control-zoom',ctrlSettings.scale);attackStick=ctrlSettings.attackStick;const t=$('attackModeLabel');if(t)t.textContent=attackStick?'JOYSTICK DE ATAQUE':'BOTÃO DE ATAQUE';const b=$('btnAttack');if(b)b.classList.toggle('aim-stick',attackStick);}
function openControlSettings(){$('settingsAudio').textContent=$('toggleAudio').textContent;$('settingsVolume').value=$('audioVolume').value;$('settingsScreen').classList.remove('hidden');$('sizeControl').value=String(Math.round(ctrlSettings.scale*100));$('stickControl').checked=ctrlSettings.attackStick;$('assistControl').checked=ctrlSettings.aimAssist;}
$('openSettings').addEventListener('click',openControlSettings);
$('closeSettings').addEventListener('click',()=>{$('settingsScreen').classList.add('hidden');$('settingsScreen').classList.remove('waiting-settings-active');});
$('sizeControl').addEventListener('input',e=>{ctrlSettings.scale=Number(e.target.value)/100;applyControlSettings();});
$('stickControl').addEventListener('change',e=>{ctrlSettings.attackStick=e.target.checked;applyControlSettings();});
$('assistControl').addEventListener('change',e=>{ctrlSettings.aimAssist=e.target.checked;if(!e.target.checked&&touchUI){mouseAim=null;attackManualAim=false;}});
$('renderControl').addEventListener('change',e=>{
 renderMode=e.target.value;onlineScaleSaved615=null;
 autoFxTier=renderMode==='auto'?(weakMobileHint?1:0):0;slowSeconds=fastSeconds=0;
 RENDER_SCALE=renderMode==='desempenho'?.64:renderMode==='leve'?.88:renderMode==='qualidade'?(touchUI?2.0:2.35):(weakMobileHint?1.0:1.2);
 adaptViewport(true);
 try{localStorage.setItem('ygg_render_mode_v19',renderMode);}catch{}
});
try{const saved=localStorage.getItem('ygg_render_mode_v19');if(['auto','leve','qualidade','desempenho'].includes(saved)){$('renderControl').value=saved;renderMode=saved;RENDER_SCALE=renderMode==='desempenho'?.64:renderMode==='leve'?.88:renderMode==='qualidade'?(touchUI?2.0:2.35):(weakMobileHint?1.0:1.2);autoFxTier=renderMode==='auto'?(weakMobileHint?1:0):0;adaptViewport(true);}}catch{}
applyControlSettings();

requestAnimationFrame(frame);

$('chooseMimic').addEventListener('click',()=>launchHero('mimic'));$('mimicToggle').addEventListener('click',()=>toggleMimicMenu('hero'));$('mimicBossToggle').addEventListener('click',()=>toggleMimicMenu('boss'));$('mimicClose').addEventListener('click',closeMimicMenu);document.querySelectorAll('[data-mimic-form]').forEach(b=>b.addEventListener('click',()=>chooseMimicForm(b.dataset.mimicForm)));refreshMimic();
$('chooseAbloy')?.addEventListener('click',()=>launchHero('abloy'));$('chooseJosue').addEventListener('click',()=>launchHero('josue'));$('chooseMoretti').addEventListener('click',()=>launchHero('moretti'));$('chooseL0id').addEventListener('click',()=>launchHero('l0id'));document.querySelectorAll('[data-secret-code]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const field=form.querySelector('input');form.querySelector('output').textContent=secretCode(field.value)?(field.value.trim().toUpperCase()==='KR1S'?'Mímico desbloqueado!':'L0ID desbloqueado!'):'Código inválido';}));refreshL0id();

$('networkRecoveryCancel')?.addEventListener('click',()=>coopRecoveryFailed('Reconexão cancelada.'));
try{const saved=JSON.parse(sessionStorage.getItem('ygg.coop.resume')||'null');if(saved?.token&&saved?.code&&window.WebSocket&&location.protocol!=='file:'){coop.room=saved.code;coop.token=saved.token;coop.active=true;coop.reconnecting=true;coop.reconnectUntil=Date.now()+120000;coopReconnectUI();coopOpenSocket({t:'resume',code:coop.room,token:coop.token});}}catch{}

// Seven rapid taps on the playfield/background; action buttons do not count.
let screenTapStart=null;
const screenTapExcluded=e=>e.target?.closest?.('button,a,input,select,textarea,#waitingStick,#joystick,.actions,#waitingDialog,#settingsScreen,#waitingOptions,#studioIntro,#networkRecovery');
window.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||screenAdjusting||e.isPrimary===false||screenTapExcluded(e)){screenTapStart=null;return;}screenTapStart={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};},true);
window.addEventListener('pointercancel',()=>{screenTapStart=null;},true);
window.addEventListener('pointerup',e=>{const a=screenTapStart;screenTapStart=null;const now=performance.now();if(e.pointerType!=='touch'||screenAdjusting||!a||a.id!==e.pointerId||screenTapExcluded(e)||now-a.t>350||Math.hypot(e.clientX-a.x,e.clientY-a.y)>20)return;if(registerScreenTap(now))setScreenAdjust(true);},true);
window.visualViewport?.addEventListener('resize',screenAdjustLayout);window.visualViewport?.addEventListener('scroll',screenAdjustLayout);
$('screenAdjustReset').addEventListener('click',resetScreenScale);
$('screenAdjustDone').addEventListener('click',()=>setScreenAdjust(false));$('titleAdjust').addEventListener('click',()=>setScreenAdjust(true));
$('settingsAdjust').addEventListener('click',()=>{$('settingsScreen').classList.add('hidden');$('settingsScreen').classList.remove('waiting-settings-active');setScreenAdjust(true);});
$('settingsAudio').addEventListener('click',()=>{$('toggleAudio').click();$('settingsAudio').textContent=$('toggleAudio').textContent;});
$('settingsVolume').addEventListener('input',e=>{$('audioVolume').value=e.target.value;YG_AUDIO.setVolume(e.target.value);});$('settingsTest').addEventListener('click',()=>$('audioTest').click());

wire60();
