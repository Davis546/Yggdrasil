
'use strict';
const touchUI=window.matchMedia('(pointer:coarse)').matches || (navigator.maxTouchPoints>0 && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)); document.body.classList.toggle('touch-ui',touchUI); let W=(touchUI&&window.innerWidth>window.innerHeight)?Math.round(288*window.innerWidth/window.innerHeight):480,H=touchUI?(window.innerWidth>window.innerHeight?288:720):288;const WORLD_W=1448,WORLD_H=1086,canvas=document.getElementById('game');let ctx=canvas.getContext('2d',{alpha:false});const RENDER_SCALE=touchUI?1.5:2;canvas.width=Math.round(W*RENDER_SCALE);canvas.height=Math.round(H*RENDER_SCALE);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
const $=id=>document.getElementById(id),rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), norm=(x,y)=>{let l=Math.hypot(x,y)||1;return {x:x/l,y:y/l}}, TAU=Math.PI*2;
let phase='title',player=null,enemies=[],projectiles=[],particles=[],slashes=[],rings=[],dashShadows=[],stage=1,essence=0,last=0,elapsed=0,shake=0,flash=0,mouseAim=null,pointerDown=false,attackMobile=false,mobileMove={x:0,y:0},opts=[],nextEnemyId=1,camera={x:0,y:0},shadowClones=[],waveIntro=0,domainFade=0,waveClearTimer=-1,dashGhostTimer=0,footstepClock=0,eclipseTime=0,healthDrops=[];
const keys=new Set();
const coop={active:false,host:false,id:null,hostId:null,room:null,socket:null,members:[],allies:new Map(),actorId:null,executing:false,chosen:false,choices:new Set(),lastSnapshot:0,lastInput:0,selectingUltimate:false,remoteStarted:false,frameAt:0,targetLocal:null,targetAllies:new Map(),lastStage:0};
function coopSend(data){if(coop.socket&&coop.socket.readyState===WebSocket.OPEN)coop.socket.send(JSON.stringify(data));}
function coopNote(message){const n=$('coopNotice');if(n)n.textContent=message;}


const HERO={loid:new Image(),kris:new Image(),cross:new Image()};
HERO.loid.src='assets/heroes/loid_sheet.png';
HERO.kris.src='assets/heroes/kris_sheet.png';
HERO.cross.src='assets/heroes/cross_sheet.png';
const ENEMY_URLS={walker:'assets/enemies/oni_walker.png',runner:'assets/enemies/oni_runner.png',caster:'assets/enemies/oni_caster.png',boss:'assets/enemies/samurai_sheet.png',reuni:'assets/enemies/reuni_sheet.png',tsukuomi:'assets/enemies/tsukuomi_sheet.png',ghost:'assets/enemies/ghost_sheet.png',yokai:'assets/enemies/yokai_sheet.png',beast:'assets/enemies/beast_sheet.png',pecado:'assets/enemies/pecado_sheet.png'};
const FROG=new Image();FROG.src='assets/heroes/kris_frog_sheet.png';
const ARENA=new Image(); ARENA.src='assets/japanese_arena.webp';
let testBossMode=false, hazards=[],bossMessage='',bossMessageTimer=0,difficulty='normal',selectedBoss=null,bonusBeam=null;
const isPecador=()=>difficulty==='pecador';
const isBossEnemy=e=>['boss','reuni','tsukuomi','pecado'].includes(e.type);
const CARD_IMAGES={heart:'assets/cards/heart.png',blade:'assets/cards/blade.png',fast:'assets/cards/fast.png',speed:'assets/cards/speed.png',armor:'assets/cards/armor.png',reach:'assets/cards/reach.png',dodge:'assets/cards/dodge.png',heal:'assets/cards/heal.png',critical:'assets/cards/critical.png',arc:'assets/cards/arc.png',vigor:'assets/cards/vigor.png',echo:'assets/cards/echo.png',shadowblade:'assets/cards/shadowblade.png',shadowdash:'assets/cards/shadowdash.png',darkburst:'assets/cards/darkburst.png',living:'assets/cards/living.png',black:'assets/cards/black.png',form:'assets/cards/form.png',awakening:'assets/cards/awakening.png',bloodmoon:'assets/cards/bloodmoon.png',ancient:'assets/cards/ancient.png',frog:'assets/cards/frog.png',gaster:'assets/cards/gaster.png',granita:'assets/cards/granita.png'};
const ENEMY_ART={};
for(const name of Object.keys(ENEMY_URLS)) {ENEMY_ART[name]=new Image();ENEMY_ART[name].src=ENEMY_URLS[name];}
let movingNow=false;

const THEMES=[{name:'RAIZ DA MEMÓRIA',floor:'#252337',wall:'#171729',accent:'#9383dc',danger:'#8b70bb'},{name:'RAIZ DA MORTE',floor:'#2b2430',wall:'#1a151f',accent:'#b064a8',danger:'#be668b'},{name:'RAIZ DO TEMPO',floor:'#222e38',wall:'#101f2b',accent:'#6bc3d1',danger:'#66b2e4'},{name:'RAIZ DA VIDA',floor:'#273229',wall:'#18261a',accent:'#8bc078',danger:'#89bf65'},{name:'RAIZ DA VONTADE',floor:'#382924',wall:'#291a17',accent:'#e4a36d',danger:'#d78a72'},{name:'RAIZ DA ESPERANÇA',floor:'#34313a',wall:'#201d2c',accent:'#e5be89',danger:'#f0c994'},{name:'RAIZ DA ALMA',floor:'#282e41',wall:'#161d2d',accent:'#89a7f8',danger:'#a18fed'}];
const cards=[
{id:'heart',name:'Coração da Raiz',desc:'+30 de vida máxima e recupera 30 de vida.',icon:'♥',rarity:'common',effect:p=>{p.maxHp+=30;p.hp=Math.min(p.maxHp,p.hp+30)}},
{id:'blade',name:'Fio da Ruína',desc:'+25% de dano em seus ataques.',icon:'⚔',rarity:'common',effect:p=>p.damage*=1.25},
{id:'fast',name:'Dança das Lâminas',desc:'+20% na velocidade de ataque.',icon:'✧',rarity:'common',effect:p=>p.attackDelay*=.8},
{id:'speed',name:'Passos Leves',desc:'+15% de velocidade de movimento.',icon:'➤',rarity:'common',effect:p=>p.speed*=1.15},
{id:'armor',name:'Casca Ancestral',desc:'Recebe 15% menos dano.',icon:'⬡',rarity:'common',effect:p=>p.armor=1-(1-p.armor)*.85},
{id:'reach',name:'Alcance da Raiz',desc:'+25% de alcance dos ataques.',icon:'⟡',rarity:'common',effect:p=>p.reach*=1.25},
{id:'dodge',name:'Reflexos Antigos',desc:'Esquiva recarrega 25% mais rápido.',icon:'↝',rarity:'common',effect:p=>p.dashDelay*=.75},
{id:'heal',name:'Seiva Vital',desc:'Recupera 4 de vida ao derrotar inimigos.',icon:'✚',rarity:'rare',effect:p=>p.onKillHeal+=4},
{id:'critical',name:'Olho do Predador',desc:'+20% de chance de golpe crítico.',icon:'◉',rarity:'rare',effect:p=>p.crit=Math.min(.8,p.crit+.2)},
{id:'arc',name:'Corte Crescente',desc:'Seus golpes atingem uma área mais ampla.',icon:'☾',rarity:'rare',effect:p=>p.arc=Math.min(3.2,p.arc+.5)},
{id:'vigor',name:'Vigor de Guerra',desc:'Recupera 20 de vida ao terminar cada fase.',icon:'✦',rarity:'rare',effect:p=>p.betweenHeal+=20},
{id:'echo',name:'Eco da Lâmina',desc:'30% de chance de causar dano extra.',icon:'❖',rarity:'rare',effect:p=>p.echo=Math.min(.9,p.echo+.3)},
{id:'shadowblade',name:'Lâmina Sombria',desc:'A adaga de Loid causa +25% de dano.',icon:'☽',rarity:'rare',hero:'loid',effect:p=>p.damage*=1.25},
{id:'shadowdash',name:'Passo Sombrio',desc:'Esquivas 35% mais rápidas e deixam rastros.',icon:'◈',rarity:'rare',hero:'loid',effect:p=>{p.dashDelay*=.65;p.shadowDash=true}},
{id:'darkburst',name:'Abismo Desperto',desc:'A aura de escuridão dura mais e causa mais dano.',icon:'✹',rarity:'rare',hero:'loid',effect:p=>{p.skillAmp*=1.5;p.skillDelay*=.85;p.darkAuraDuration=(p.darkAuraDuration||4.1)+1.5}},
{id:'living',name:'Sombra Viva',desc:'Um espírito sombrio ataca inimigos próximos.',icon:'♟',rarity:'legendary',hero:'loid',effect:p=>{p.orbiters++;p.orbitTimer=0}},
{id:'black',name:'Fúria Negra',desc:'Kris causa +60% de dano transformado.',icon:'♜',rarity:'rare',hero:'kris',effect:p=>p.transformAmp+=.6},
{id:'form',name:'Forma Perfeita',desc:'A transformação dura mais 3 segundos.',icon:'◆',rarity:'rare',hero:'kris',effect:p=>p.transformDuration+=3},
{id:'awakening',name:'Despertar',desc:'Transformação recarrega 30% mais rápido.',icon:'♛',rarity:'rare',hero:'kris',effect:p=>p.skillDelay*=.7},
{id:'bloodmoon',name:'Lua do Abismo',desc:'Ataques transformados geram ondas de energia.',icon:'☯',rarity:'legendary',hero:'kris',effect:p=>p.waveAttack=true},
{id:'frog',name:'Forma do Sapo',desc:'SUBSTITUI Q: uma transformação por partida. Salto elimina Onis e yokais; tira 25% da vida máxima de chefes.',icon:'♠',rarity:'legendary',hero:'kris',effect:p=>{p.frogSkill=true;p.frogUsed=false;p.frogTime=0;p.transformTime=0;p.skillCd=0}},
{id:'gaster',name:'Gaster Blaster',desc:'CROSS · Carta exclusiva: invoque uma caveira colossal que dispara um feixe devastador. F = uso único por partida.',icon:'☠',rarity:'legendary',hero:'cross',effect:p=>{p.cardPower='gaster';p.cardPowerUsed=false;}},
{id:'granita',name:'Descarga de Granita',desc:'LOID · Carta exclusiva: libere uma imensa descarga branco-negra. Consome 50% da carga do Supremo. F = uso único.',icon:'ϟ',rarity:'legendary',hero:'loid',effect:p=>{p.cardPower='granita';p.cardPowerUsed=false;}},
{id:'ancient',name:'Herança de Yggdrasil',desc:'+10% de vida, dano, velocidade e alcance.',icon:'♧',rarity:'legendary',effect:p=>{p.maxHp=Math.ceil(p.maxHp*1.1);p.hp=Math.min(p.maxHp,p.hp+20);p.damage*=1.1;p.speed*=1.1;p.reach*=1.1}},
];
function createPlayer(type){const loid=type==='loid',cross=type==='cross';return {type,x:WORLD_W/2,y:WORLD_H/2+120,face:'down',aim:-Math.PI/2,hp:loid?110:cross?118:135,maxHp:loid?110:cross?118:135,damage:loid?26:cross?29:34,attackDelay:loid?.29:cross?.34:.43,atkTime:0,speed:loid?105:cross?106:91,reach:loid?33:cross?38:43,arc:loid?1.85:cross?1.95:2.15,armor:0,crit:cross?.26:.07,echo:0,onKillHeal:0,betweenHeal:11,dashDelay:loid?2.4:cross?2.55:2.8,dashCd:0,dashTime:0,dashV:{x:0,y:0},invuln:0,skillDelay:loid?9:cross?10.5:14,skillCd:0,skillAmp:1,darkAuraTime:0,darkAuraTick:0,secondaryCd:0,secondaryDelay:loid?20:cross?5.7:8.5,secondaryCharging:false,secondaryCharge:0,transformDuration:6,transformAmp:.55,transformTime:0,shadowDash:false,orbiters:0,orbitTimer:0,waveAttack:false,cardPower:'',cardPowerUsed:false,frogSkill:false,frogUsed:false,frogTime:0,curseTime:0,attackCount:0,ultimateCharge:0,ultimateTime:0,ultimateTick:0,ultimateBuff:'',ultimateBuffTime:0,step:0,cards:[],kills:0};}
function theme(){return stage===20?{name:'TRONO DO PECADO',floor:'#3a0810',wall:'#160408',accent:'#ff253f',danger:'#de1228'}:stage===15?{name:'DOMÍNIO DA LUA',floor:'#1b1730',wall:'#0c0920',accent:'#b98dff',danger:'#995ac8'}:THEMES[Math.min(THEMES.length-1,Math.floor((stage-1)/4))]}
const MOB_STATS={walker:{hp:44,speed:47,radius:10},runner:{hp:31,speed:69,radius:10},caster:{hp:54,speed:32,radius:11},ghost:{hp:42,speed:66,radius:10},yokai:{hp:62,speed:46,radius:11},beast:{hp:88,speed:83,radius:13}};
function waveName(n){if(n===20)return 'PECADO · O DEVORADOR DAS RAÍZES';if(n===15)return 'TSUKUOMI · SENHORA DO ECLIPSE';if(n===10)return 'REUNI · SENHOR DO SANGUE';if(n%5===0)return 'O SAMURAI ONI DESPERTA';const m=n%5;return m===4?'ONDA DOS ESPÍRITOS':m===3?'INVASÃO YOKAI':m===2?'CAÇADA DAS BESTAS':'INVASÃO ONI';}
function randEnemyType(){
 const r=Math.random();
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
 const factor=1+(stage-1)*.19;let hp=base.hp*factor*(isPecador()?1.5:1)*(elite?1.72:1)*(bossSummon?.66:1);
 const e={id:nextEnemyId++,type,x,y,hp,maxHp:hp,elite,bossSummon,
  speed:base.speed*(1+Math.min(stage,24)*.019)*(isPecador()?1.16:1)*(elite?1.12:1),radius:base.radius+(elite?1:0),attack:rand(.85,2.15),hurt:0,step:rand(0,6),face:'down',windup:0,chargeTime:0,chargeDir:{x:0,y:1},hitCharge:false,phase:rand(0,6)};
 enemies.push(e);return e;
}
function spawnStage(){
 enemies=[];projectiles=[];slashes=[];rings=[];particles=[];dashShadows=[];shadowClones=[];hazards=[];healthDrops=[];bonusBeam=null;bossMessage='';bossMessageTimer=0;waveClearTimer=-1;dashGhostTimer=0;eclipseTime=0;
 phase='play';$('rewardScreen').classList.add('hidden');$('gameOverScreen').classList.add('hidden');
 player.x=WORLD_W/2;player.y=WORLD_H/2+120;
 player.dashTime=0;player.darkAuraTime=0;player.ultimateTime=0;player.ultimateBuffTime=0;player.ultimateBuff='';player.frogTime=0;player.curseTime=0;player.invuln=2;
 player.hp=Math.min(player.maxHp,player.hp+player.betweenHeal);
 if(coop.active&&coop.host){for(const [aid,a] of coop.allies){a.x=player.x+((Number(aid)%3)-1)*28;a.y=player.y+35;a.hp=Math.min(a.maxHp,a.hp+a.betweenHeal);a.invuln=2;a.skillCd=0;a.dashCd=0;a.darkAuraTime=0;a.ultimateTime=0;a.ultimateBuffTime=0;a.curseTime=0;a.secondaryCharging=false;}}
 camera.x=clamp(player.x-W/2,0,WORLD_W-W);camera.y=clamp(player.y-H/2,0,WORLD_H-H);
 waveIntro=2.3;YG_AUDIO.play('waveStart',.8);
 const isBoss=stage%5===0;const bossType=stage===20?'pecado':stage===15?'tsukuomi':stage===10?'reuni':'boss';
 const total=testBossMode?0:isBoss?(stage===20?12:stage===15?2:stage===10?4:3):Math.min(isPecador()?23:18,3+Math.floor(stage*1.02)+(isPecador()?3:0));
 for(let i=0;i<total;i++){
  const pos=spawnAroundPlayer(120,270);
  const type=isBoss&&stage===15?(i%2?'beast':'ghost'):randEnemyType();
  const elite=!isBoss&&stage>=7&&Math.random()<Math.min(.33,.06+stage*.014);
  addMob(type,pos.x,pos.y,elite);
 }
 if(isBoss){
  YG_AUDIO.play('bossWarning',1.1);
  const pos=spawnAroundPlayer(120,170);
  const hp=(bossType==='pecado'?11200:bossType==='tsukuomi'?5100:bossType==='reuni'?3600:1500+stage*120)*(isPecador()?1.65:1)*(coop.active&&coop.host?1+0.68*(coop.allies.size):1);
  const e={id:nextEnemyId++,type:bossType,x:pos.x,y:pos.y,hp,maxHp:hp,
   speed:(bossType==='pecado'?86:bossType==='tsukuomi'?77:bossType==='reuni'?100:38+stage*.8)*(isPecador()?1.14:1),
   radius:bossType==='pecado'?25:bossType==='tsukuomi'?19:bossType==='reuni'?20:23,attack:bossType==='pecado'?1.05:bossType==='tsukuomi'?1.12:bossType==='reuni'?1.0:1.35,
   hurt:0,step:0,face:'down',mode:'walk',specialIndex:0,rage:false,guardTime:0,
   chargeTime:0,chargeDir:{x:0,y:1},counterCd:0,summonTimer:bossType==='pecado'?4.8:bossType==='tsukuomi'?5.5:4.1,windup:0,corruptionPhase:0};
  enemies.push(e);
  bossMessage=bossType==='pecado'?'PECADO · O FIM DAS SETE RAÍZES':bossType==='tsukuomi'?'TSUKUOMI · A VOZ DA LUA':bossType==='reuni'?'REUNI · SENHOR DO SANGUE':'DAIMYŌ ONI · SENHOR DOS ONIS';
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
function start(type, bossTest=false, frogTest=false){selectedBoss=null;testBossMode=!!bossTest;player=createPlayer(type);if(type==='kris'&&frogTest){player.frogSkill=true;player.cards.push('frog');}stage=bossTest==='pecado'?20:bossTest==='tsukuomi'?15:(bossTest==='reuni'?10:(bossTest?5:1));essence=0;elapsed=0;flash=0;mouseAim=null;keys.clear();$('titleScreen').classList.add('hidden');$('selectScreen').classList.add('hidden');$('bossScreen').classList.add('hidden');$('supremeScreen').classList.add('hidden');$('bossScreen').classList.add('hidden');$('gameOverScreen').classList.add('hidden');$('hud').style.display='flex';$('mobileControls').style.display='';document.body.classList.add('is-playing');adaptViewport();YG_AUDIO.play('choose');if(coop.active&&coop.host)coopInitAllies();spawnStage();}
function makeParticles(x,y,color,n=8,force=1){if(particles.length>220)return;for(let i=0;i<n;i++){let a=rand(0,TAU),s=rand(18,64)*force;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.2,.65),max:.65,size:rand(1,3),color})}}
function textPop(x,y,str,color='#fff'){particles.push({x,y,vx:rand(-7,7),vy:-27,life:.65,max:.65,text:String(str),color})}
function slash(x,y,ang,r,color){slashes.push({x,y,ang,r,color,life:.15,max:.15});shake=Math.max(shake,1.5)}
function ring(x,y,r,color){rings.push({x,y,r,life:.44,max:.44,color})}
function hitEnemy(e,dmg,chargesSupreme=false,trueDamage=false){if(e.hp<=0)return;let isCrit=!trueDamage&&Math.random()<Math.min(.95,player.crit+(player.type==='cross'&&player.ultimateBuff==='cross'&&player.ultimateBuffTime>0?.27:0)),amount=dmg*(isCrit?1.7:1)*(player.curseTime>0&&!trueDamage?.62:1)*(e.corruptTime>0&&!trueDamage?1.16:1)*(player.type==='cross'&&player.ultimateBuff==='cross'&&player.ultimateBuffTime>0?1.35:1);if(!trueDamage&&Math.random()<player.echo)amount*=1.6;if(isBossEnemy(e)&&!trueDamage)amount=Math.min(amount,e.maxHp*.04);if(!trueDamage&&e.type==='boss'&&e.mode==='guard'&&e.guardTime>0){amount*=.3;if(e.counterCd<=0&&dist(e,player)<62){e.counterCd=1.25;ring(e.x,e.y,60,'#ff5374');bossMessage='CONTRA-ATAQUE DO SHOGUN';bossMessageTimer=.8;hurtPlayer(e.rage?25:18);}}e.hp-=amount;e.hurt=.14;if(player.type==='cross'&&e.hp>0&&e.hp<=e.maxHp*.5&&!e.corruptTime){e.corruptTime=5.5;e.slow=Math.max(e.slow||0,1.2);textPop(e.x,e.y-28,'CORROMPIDO','#c89cff');ring(e.x,e.y,27,'#8344af');}YG_AUDIO.play(isBossEnemy(e)?'heavyHit':'hit',isCrit?1.2:.82);if(chargesSupreme&&player.ultimateTime<=0&&player.ultimateBuffTime<=0)player.ultimateCharge=Math.min(100,player.ultimateCharge+(isBossEnemy(e)?12:9));textPop(e.x,e.y-12,Math.round(amount)+(isCrit?'!':''),isCrit?'#ffd67b':'#f0ccdc');makeParticles(e.x,e.y,player.type==='loid'?'#ae7de3':player.type==='cross'?'#b167ef':'#709cff',4);if(e.hp<=0){YG_AUDIO.play(isBossEnemy(e)?'bossDefeat':'oniDeath',e.type==='boss'?1.2:.65);player.kills++;essence+=isBossEnemy(e)?150:10;makeParticles(e.x,e.y,isBossEnemy(e)?'#e4b7ff':'#b1519d',18,1.3);player.hp=Math.min(player.maxHp,player.hp+player.onKillHeal);if(!isBossEnemy(e)&&Math.random()<.05&&healthDrops.length<35){healthDrops.push({x:e.x,y:e.y,amount:12,life:16,phase:Math.random()*6.28});}if(isBossEnemy(e)){player.hp=player.maxHp;if(coop.active&&coop.host)for(const ally of coop.allies.values())ally.hp=ally.maxHp;textPop(player.x,player.y-31,'VIDA RESTAURADA!','#b5ffad');hazards=[];eclipseTime=0;for(const add of enemies){if(add!==e&&!isBossEnemy(add))add.hp=0;}bossMessage=e.type==='pecado'?'PECADO DERROTADO!':e.type==='tsukuomi'?'TSUKUOMI DERROTADA!':e.type==='reuni'?'REUNI DERROTADO!':'DAIMYŌ ONI DERROTADO!';bossMessageTimer=2.4;}}}

// Card-exclusive, one-use frog form: the next attack performs a shadow-frog leap.
function frogSmash(){
 if(!player||player.type!=='kris'||player.frogTime<=0)return;
 player.frogTime=0;player.atkTime=.7;player.invuln=Math.max(player.invuln,.62);
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

function attack(){if(coop.active&&!coop.host&&!coop.executing){coopAction('attack');return;}if(!player||player.hp<=0||phase!=='play'||player.atkTime>0)return;if(player.type==='kris'&&player.frogTime>0){frogSmash();return;}player.atkTime=player.attackDelay;player.attackCount++;let amp=(player.transformTime>0?1+player.transformAmp:1)*(player.ultimateBuffTime>0&&player.ultimateBuff==='fight'?2:1);let a=player.aim,range=player.reach*(player.transformTime>0?1.18:1),cx=player.x+Math.cos(a)*range*.55,cy=player.y+Math.sin(a)*range*.55;
slash(cx,cy,a,range,player.type==='loid'?'#d9a4ff':player.type==='cross'?'#b97aff':player.transformTime>0?'#ff73ec':'#7592ff');YG_AUDIO.play(player.type==='loid'?'loidSlash':'krisSlash',.95);let struck=0;for(const e of enemies){if(e.hp<=0)continue;let dx=e.x-player.x,dy=e.y-player.y,ed=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(angle-a),Math.cos(angle-a));if(ed<range+e.radius&&Math.abs(diff)<player.arc/2+e.radius/Math.max(20,ed)){hitEnemy(e,player.damage*amp,true);struck++;}}
if(player.type==='kris'&&player.transformTime>0&&player.waveAttack){let vec={x:Math.cos(a),y:Math.sin(a)};projectiles.push({x:player.x+vec.x*15,y:player.y+vec.y*15,vx:vec.x*170,vy:vec.y*170,damage:player.damage*.65,from:'player',r:5,life:1.1,color:'#b572ff'})}
if(player.ultimateBuffTime>0&&player.ultimateBuff==='itens'&&player.type==='kris'){
 // A second synchronized black sword: actual hit registration and an additional visual slash.
 slash(cx+Math.cos(a+1.3)*9,cy+Math.sin(a+1.3)*9,a+.16,range*.95,'#b76fff');
 for(const e of enemies){if(e.hp<=0)continue;let dx=e.x-player.x,dy=e.y-player.y,ed=Math.hypot(dx,dy),diff=Math.atan2(Math.sin(Math.atan2(dy,dx)-a),Math.cos(Math.atan2(dy,dx)-a));if(ed<range+e.radius&&Math.abs(diff)<player.arc/2+e.radius/Math.max(20,ed))hitEnemy(e,player.damage*amp*.75,true);}
 }
 if(player.type==='loid'&&struck)makeParticles(cx,cy,'#924ac8',3);}
function dash(){if(coop.active&&!coop.host&&!coop.executing){coopAction('dash');return;}if(phase!=='play'||player.hp<=0||player.dashCd>0)return;YG_AUDIO.play('dash');let mv=getMove();let v=Math.hypot(mv.x,mv.y)>.1?norm(mv.x,mv.y):{x:Math.cos(player.aim),y:Math.sin(player.aim)};player.dashV=v;player.dashTime=.22;player.dashCd=player.type==='loid'&&player.ultimateTime>0?.07:player.dashDelay;player.invuln=.36;if(player.type==='loid'){dashGhostTimer=0;dashShadows.push({x:player.x,y:player.y,face:player.face,step:player.step,life:.34,max:.34});}makeParticles(player.x,player.y,player.type==='loid'?'#27112f':'#518cff',16);}
function crossTeleport(){
 const targets=enemies.filter(e=>e.hp>0&&e.x>camera.x-15&&e.x<camera.x+W+15&&e.y>camera.y-15&&e.y<camera.y+H+15);
 if(!targets.length){bossMessage='NENHUM INIMIGO À VISTA';bossMessageTimer=1;return false;}
 targets.sort((a,b)=>(isBossEnemy(b)?100000:0)+b.maxHp-(isBossEnemy(a)?100000:0)-a.maxHp);
 const t=targets[0],ox=player.x,oy=player.y;
 const v=norm(t.x-ox,t.y-oy),tx=t.x-v.x*(t.radius+17),ty=t.y-v.y*(t.radius+17);
 makeParticles(ox,oy,'#6a3c9f',24);dashShadows.push({x:ox,y:oy,face:player.face,step:player.step,life:.5,max:.5,cross:true});
 player.x=tx;player.y=ty;player.aim=Math.atan2(t.y-player.y,t.x-player.x);
 slash(tx,ty,player.aim,62,'#e7b1ff');hitEnemy(t,player.damage*2.9,true);
 ring(t.x,t.y,44,'#9b4cff');makeParticles(t.x,t.y,'#a65cf0',20);
 player.x=ox;player.y=oy;player.invuln=Math.max(player.invuln,.43);player.atkTime=.28;
 bossMessage='Q · TELEPORTE CORRUPTO';bossMessageTimer=1.3;return true;
}
function crossBone(){
 const boneTypes=[{name:'branco',color:'#fff9ec',mult:1.5},{name:'azul',color:'#6acbff',mult:1.12},{name:'laranja',color:'#ff9b4b',mult:1.22}];
 const bone=boneTypes[Math.floor(Math.random()*3)];
 let angle=player.aim;
 const visible=enemies.filter(e=>e.hp>0&&e.x>camera.x-30&&e.x<camera.x+W+30&&e.y>camera.y-30&&e.y<camera.y+H+30);
 if(visible.length&&!mouseAim){visible.sort((a,b)=>dist(a,player)-dist(b,player));angle=Math.atan2(visible[0].y-player.y,visible[0].x-player.x);}
 const vx=Math.cos(angle),vy=Math.sin(angle);
 projectiles.push({x:player.x+vx*13,y:player.y+vy*13-9,vx:vx*250,vy:vy*250,damage:player.damage*bone.mult*1.35,from:'player',ownerId:coop.actorId||coop.id,bone:bone.name,r:6,life:1.6,color:bone.color});
 makeParticles(player.x,player.y,'#ac76ff',10);YG_AUDIO.play('oniCast',.95);
 bossMessage='E · OSSO '+bone.name.toUpperCase();bossMessageTimer=1.0;
}
function cardPower(){
 if(coop.active&&!coop.host&&!coop.executing){coopAction('f');return;}if(!player||phase!=='play'||!player.cardPower||player.cardPowerUsed)return;
 if(player.cardPower==='granita'&&player.ultimateCharge<50){bossMessage='GRANITA · PRECISA DE 50% DE ENERGIA';bossMessageTimer=1.5;return;}
 player.cardPowerUsed=true;
 let target=enemies.filter(e=>e.hp>0&&e.x>camera.x-15&&e.x<camera.x+W+15&&e.y>camera.y-15&&e.y<camera.y+H+15).sort((a,b)=>dist(a,player)-dist(b,player))[0];
 let aim=mouseAim?Math.atan2(mouseAim.y-player.y,mouseAim.x-player.x):target?Math.atan2(target.y-player.y,target.x-player.x):player.aim;
 const length=player.cardPower==='gaster'?360:400,width=player.cardPower==='gaster'?38:63;
 const dx=Math.cos(aim),dy=Math.sin(aim),power=player.cardPower;
 if(power==='granita')player.ultimateCharge-=50;
 bonusBeam={x:player.x,y:player.y,a:aim,length,width,life:.88,max:.88,kind:power};
 for(const e of enemies){if(e.hp<=0)continue;const ex=e.x-player.x,ey=e.y-player.y,along=ex*dx+ey*dy,side=Math.abs(ex*dy-ey*dx);if(along>=-10&&along<=length+e.radius&&side<width+e.radius){hitEnemy(e,isBossEnemy(e)?Math.max(player.damage*8,e.maxHp*(power==='gaster'?.18:.16)):e.hp+500,false,true)}}
 YG_AUDIO.play('bossEclipse',1.3);ring(player.x,player.y,88,power==='gaster'?'#b8a0ff':'#f8f8ff');shake=8;
 bossMessage=power==='gaster'?'F · GASTER BLASTER':'F · DESCARGA DE GRANITA';bossMessageTimer=2.4;
 updateHud();
}
function drawCardBeam(){
 if(!bonusBeam||bonusBeam.life<=0)return;
 const b=bonusBeam,f=b.life/b.max;
 ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);ctx.globalAlpha=.23+.75*f;ctx.shadowColor=b.kind==='gaster'?'#a273ff':'#eeeaff';ctx.shadowBlur=19;
 ctx.fillStyle=b.kind==='gaster'?'#6429a9':'#090713';ctx.fillRect(11,-b.width*.71,b.length,b.width*1.42);
 ctx.fillStyle=b.kind==='gaster'?'#d5b6ff':'#f4f4fb';ctx.fillRect(14,-b.width*.33,b.length-4,b.width*.66);
 ctx.fillStyle='#ffffff';ctx.fillRect(16,-b.width*.08,b.length-9,b.width*.16);
 if(b.kind==='gaster'){
  ctx.fillStyle='#f5e9ff';ctx.beginPath();ctx.arc(-20,0,25,0,TAU);ctx.fill();ctx.fillStyle='#321453';ctx.fillRect(-33,-11,11,8);ctx.fillRect(-13,-11,11,8);ctx.fillRect(-23,7,22,7);
 }
 ctx.restore();
}
function skill(){
 if(coop.active&&!coop.host&&!coop.executing){coopAction('q');return;}if(!player||player.hp<=0||phase!=='play'||player.skillCd>0)return;
 if(player.type==='cross'){if(crossTeleport()){player.skillCd=player.skillDelay;updateHud();}return;}
 if(player.type==='kris'&&player.frogSkill){if(player.frogUsed)return;player.frogUsed=true;player.frogTime=12;player.transformTime=0;player.invuln=.6;ring(player.x,player.y,52,'#8dffa0');makeParticles(player.x,player.y,'#9df6bd',28);bossMessage='FORMA DO SAPO · ATAQUE J PARA SALTAR';bossMessageTimer=2.6;updateHud();return;}
 player.skillCd=player.skillDelay;YG_AUDIO.play(player.type==='loid'?'loidAura':'krisForm',1.13);
 if(player.type==='loid'){
  player.darkAuraTime=player.darkAuraDuration||4.1;player.darkAuraTick=0;
  player.invuln=.55;ring(player.x,player.y,70,'#160c25');
  makeParticles(player.x,player.y,'#33213c',24,.9);
 }else{
  player.transformTime=player.transformDuration;player.invuln=.5;
  makeParticles(player.x,player.y,'#7872ff',32,1.4);ring(player.x,player.y,45,'#8969ff');
 }
 updateHud();
}

// E — Loid summons exactly four hostile dark duplicates. Kris holds E to charge a long-range dimensional slash.
function secondaryDown(){
 if(coop.active&&!coop.host&&!coop.executing){coopAction('eDown');return;}if(!player||player.hp<=0||phase!=='play'||player.secondaryCd>0)return;
 if(player.type==='cross'){player.secondaryCd=player.secondaryDelay;crossBone();}
 else if(player.type==='loid'){
   player.secondaryCd=player.secondaryDelay;shadowClones=[];
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
function secondaryUp(){
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
 for(let i=shadowClones.length-1;i>=0;i--){
   const s=shadowClones[i];const originalPlayer=player;const cloneOwner=coop.active&&coop.host&&s.ownerId!==coop.id?coop.allies.get(s.ownerId):null;if(cloneOwner)player=cloneOwner;s.time-=dt;
   if(s.time<=0){shadowClones.splice(i,1);player=originalPlayer;continue;}
   s.attackCd-=dt;s.step+=dt*10;
   let closest=null,near=Infinity;
   for(const e of enemies){const d=Math.hypot(e.x-s.x,e.y-s.y);if(e.hp>0&&d<near){near=d;closest=e;}}
   if(closest){
     const v=norm(closest.x-s.x,closest.y-s.y);
     if(near>22){s.x+=v.x*158*dt;s.y+=v.y*158*dt;}
     s.face=Math.abs(v.x)>Math.abs(v.y)?(v.x<0?'left':'right'):(v.y<0?'up':'down');
     if(near<36&&s.attackCd<=0){
       s.attackCd=.72+Math.random()*.18;
       slash(s.x+v.x*12,s.y+v.y*12,Math.atan2(v.y,v.x),25,'#7c3aaa');
       hitEnemy(closest,player.damage*.52,true);makeParticles(closest.x,closest.y,'#6a3a9d',3);
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
 const im=HERO.loid;if(!im.complete||!im.naturalWidth)return;
 const row={down:0,left:1,right:2,up:3}[s.face]??0,col=[1,0,1,2][Math.floor(s.step)%4];
 ctx.save();ctx.translate(Math.round(s.x),Math.round(s.y));
 ctx.globalAlpha=Math.min(.82,s.time*.45);
 ctx.shadowBlur=8;ctx.shadowColor='#6f32a7';
 ctx.filter='brightness(0.17) sepia(1) saturate(2) hue-rotate(218deg)';
 ctx.drawImage(im,col*112,row*112,112,112,-20,-34,40,40);
 ctx.restore();
 ctx.save();ctx.strokeStyle='#7d50ad88';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(s.x,s.y-16,15+Math.sin(elapsed*5+s.angle)*2,0,TAU);ctx.stroke();ctx.restore();
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
function adaptViewport(){
 const wide=touchUI&&window.innerWidth>window.innerHeight;
 const nextH=touchUI?(wide?288:720):288;
 const nextW=wide?Math.min(820,Math.round(288*window.innerWidth/window.innerHeight)):480;
 if(W!==nextW||H!==nextH){
   W=nextW;H=nextH;canvas.width=Math.round(W*RENDER_SCALE);canvas.height=Math.round(H*RENDER_SCALE);
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   if(player){camera.x=clamp(player.x-W/2,0,WORLD_W-W);camera.y=clamp(player.y-H/2,0,WORLD_H-H);}
 }
 document.body.classList.toggle('landscape',wide);
}
window.addEventListener('resize',adaptViewport,{passive:true});
window.addEventListener('orientationchange',()=>requestAnimationFrame(adaptViewport));

function ultimate(){
 if(coop.active&&!coop.host&&!coop.executing){coopAction('ultimate');return;}if(!player||player.hp<=0||phase!=='play'||player.ultimateCharge<100)return;
 player.ultimateCharge=0;YG_AUDIO.play('ultimate',1.24);
 if(player.type==='cross'){player.ultimateBuff='cross';player.ultimateBuffTime=8;player.invuln=.4;makeParticles(player.x,player.y,'#bb79fa',34,1.5);ring(player.x,player.y,71,'#b17bff');bossMessage='SUPREMO · RUPTURA CORRUPTA';bossMessageTimer=2.2;}
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
function chooseUltimate(kind){
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
function hurtPlayer(d){if(phase!=='play'||player.invuln>0||(player.type==='loid'&&player.dashTime>0)||(player.ultimateBuff==='defesa'&&player.ultimateBuffTime>0))return;d=Math.max(1,d*(isPecador()?1.38:1)*(1-player.armor));player.hp-=d;YG_AUDIO.play('hurt');player.invuln=.76;shake=4;flash=.12;textPop(player.x,player.y-20,'-'+Math.ceil(d),'#ff738c');makeParticles(player.x,player.y,'#f2597e',12);if(player.hp<=0){player.hp=0;if(coop.active&&coop.host&&([player,...coop.allies.values()].some(p=>p.hp>0))){player.invuln=999;bossMessage='ALIADO CAÍDO · SOBREVIVA ATÉ A PRÓXIMA ONDA';bossMessageTimer=2;updateHud();return;}YG_AUDIO.play('defeat');phase='over';$('endTitle').textContent='A RAIZ RESISTE';$('endText').textContent=`${player.type==='loid'?'Loid':player.type==='cross'?'Cross':'Kris'} chegou à onda ${stage}, derrotou ${player.kills} inimigos e obteve ${player.cards.length} cartas. Um novo ciclo pode começar.`;$('gameOverScreen').classList.remove('hidden');}updateHud();}
function getMove(){if(coop.active&&coop.host&&coop.actorId){const a=coop.allies.get(coop.actorId);return a?norm(a.input.x,a.input.y):{x:0,y:0};}let x=mobileMove.x,y=mobileMove.y;if(keys.has('w')||keys.has('arrowup'))y-=1;if(keys.has('s')||keys.has('arrowdown'))y+=1;if(keys.has('a')||keys.has('arrowleft'))x-=1;if(keys.has('d')||keys.has('arrowright'))x+=1;return norm(x,y)}
function applyBoundaries(o,r=9){o.x=clamp(o.x,90+r,WORLD_W-90-r);o.y=clamp(o.y,148+r,WORLD_H-95-r)}
function update(dt){elapsed+=dt;waveIntro=Math.max(0,waveIntro-dt);bossMessageTimer=Math.max(0,bossMessageTimer-dt);eclipseTime=Math.max(0,eclipseTime-dt);flash=Math.max(0,flash-dt);shake=Math.max(0,shake-dt*14);
for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;if(p.life<=0)particles.splice(i,1)}for(let i=slashes.length-1;i>=0;i--){slashes[i].life-=dt;if(slashes[i].life<=0)slashes.splice(i,1)}for(let i=rings.length-1;i>=0;i--){rings[i].life-=dt;if(rings[i].life<=0)rings.splice(i,1)}
for(let i=dashShadows.length-1;i>=0;i--){dashShadows[i].life-=dt;if(dashShadows[i].life<=0)dashShadows.splice(i,1)}
if(phase!=='play')return;
if(bonusBeam){bonusBeam.life-=dt;if(bonusBeam.life<=0)bonusBeam=null;}player.frogTime=Math.max(0,player.frogTime-dt);player.curseTime=Math.max(0,player.curseTime-dt);player.atkTime=Math.max(0,player.atkTime-dt);player.dashCd=Math.max(0,player.dashCd-dt);player.skillCd=Math.max(0,player.skillCd-dt);player.secondaryCd=Math.max(0,player.secondaryCd-dt);if(player.type==='kris'&&player.secondaryCharging)player.secondaryCharge=Math.min(1.6,player.secondaryCharge+dt);player.ultimateTime=Math.max(0,player.ultimateTime-dt);player.ultimateBuffTime=Math.max(0,player.ultimateBuffTime-dt);player.invuln=Math.max(0,player.invuln-dt);player.transformTime=Math.max(0,player.transformTime-dt);player.darkAuraTime=Math.max(0,player.darkAuraTime-dt);
let m=getMove(),moving=!!(mobileMove.x||mobileMove.y||['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].some(k=>keys.has(k)));
movingNow=moving||player.dashTime>0;footstepClock-=dt;if(moving&&player.dashTime<=0&&footstepClock<=0){footstepClock=.33;YG_AUDIO.play('footstep',.32);}
if(player.dashTime>0){player.dashTime=Math.max(0,player.dashTime-dt);player.x+=player.dashV.x*340*dt;player.y+=player.dashV.y*340*dt;if(player.type==='loid'){dashGhostTimer-=dt;if(dashGhostTimer<=0){dashGhostTimer=.035;if(dashShadows.length>18)dashShadows.shift();dashShadows.push({x:player.x,y:player.y,face:player.face,step:player.step,life:.30,max:.30});}if(Math.random()<.75)makeParticles(player.x+rand(-6,6),player.y+rand(-8,4),'#301739',2,.5);}else if(player.shadowDash&&Math.random()<.5)makeParticles(player.x,player.y,'#ab6bf2',2)}else if(moving&&player.hp>0){let haste=player.type==='loid'&&player.ultimateTime>0?1.65:player.ultimateBuff==='piedade'&&player.ultimateBuffTime>0?1.5:1;player.x+=m.x*player.speed*haste*(player.curseTime>0?.78:1)*dt;player.y+=m.y*player.speed*haste*(player.curseTime>0?.78:1)*dt;player.step+=dt*11;player.aim=Math.atan2(m.y,m.x);}
if(moving){if(Math.abs(m.x)>Math.abs(m.y))player.face=m.x<0?'left':'right';else player.face=m.y<0?'up':'down';}
if(mouseAim){player.aim=Math.atan2(mouseAim.y-player.y,mouseAim.x-player.x);}
applyBoundaries(player,8);camera.x+=((clamp(player.x-W/2,0,WORLD_W-W))-camera.x)*Math.min(1,dt*9);camera.y+=((clamp(player.y-H/2,0,WORLD_H-H))-camera.y)*Math.min(1,dt*9);
if(player.hp>0&&(keys.has('j')||pointerDown||attackMobile))attack();
if(coop.active&&coop.host)coopAdvance(dt);
if(shadowClones.length)updateClones(dt);
if(player.type==='loid'&&player.darkAuraTime>0){
 player.darkAuraTick-=dt;
 if(player.darkAuraTick<=0){player.darkAuraTick=.47;
  for(const e of enemies){if(e.hp>0&&dist(e,player)<77+e.radius){hitEnemy(e,player.damage*.55*player.skillAmp);e.slow=Math.max(e.slow||0,.65);}}
  if(Math.random()<.6)makeParticles(player.x,player.y,'#30203e',4,.6);
 }
}
if(player.type==='loid'&&player.ultimateTime>0){
 player.ultimateTick-=dt;
 if(player.ultimateTick<=0){player.ultimateTick=.24;
  for(const e of enemies){if(e.hp>0&&dist(e,player)<185+e.radius){hitEnemy(e,player.damage*1.18*player.skillAmp);e.slow=Math.max(e.slow||0,.23);}}
  if(Math.random()<.45)makeParticles(player.x+rand(-90,90),player.y+rand(-60,60),'#21142e',2,.6);
 }
}
player.orbitTimer+=dt;if(player.orbiters>0&&player.orbitTimer>1.25){player.orbitTimer=0;let targets=enemies.filter(e=>e.hp>0&&dist(e,player)<98).sort((a,b)=>dist(a,player)-dist(b,player));for(let i=0;i<Math.min(player.orbiters,targets.length);i++){hitEnemy(targets[i],player.damage*.8);ring(targets[i].x,targets[i].y,13,'#a872f7');}}
for(const e of enemies){if(e.hp<=0)continue;const __hostPlayer=player;if(coop.active&&coop.host){for(const ally of coop.allies.values())if(ally.hp>0&&dist(e,ally)<dist(e,player))player=ally;}e.hurt=Math.max(0,e.hurt-dt);e.slow=Math.max(0,(e.slow||0)-dt);e.corruptTime=Math.max(0,(e.corruptTime||0)-dt);e.burnTime=Math.max(0,(e.burnTime||0)-dt);if(e.burnTime>0){e.burnTick=(e.burnTick||0)-dt;if(e.burnTick<=0){e.burnTick=.65;hitEnemy(e,player.damage*.23);}}e.attack-=dt;let dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1,dir={x:dx/d,y:dy/d},spd=e.speed*(e.slow>0?.4:e.corruptTime>0?.68:1);e.step+=dt*spd*.2;if(isBossEnemy(e)&&e.mode!=='charge'){e.face=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
e.face=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');if(e.type==='caster'){if(d>100){e.x+=dir.x*spd*dt;e.y+=dir.y*spd*dt}else if(d<75){e.x-=dir.x*spd*dt}if(e.attack<=0){e.attack=rand(1.7,2.55);shoot(e,dir,85+stage*.9,13+stage*1.1,'#c586ff')}}
else if(e.type==='boss'){updateSamurai(e,dt,d,dir,spd);}
else if(e.type==='reuni'){updateReuni(e,dt,d,dir,spd);}
else if(e.type==='tsukuomi'){updateTsukuomi(e,dt,d,dir,spd);}
else if(e.type==='pecado'){updatePecado(e,dt,d,dir,spd);}
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
applyBoundaries(e,e.radius);player=__hostPlayer;}
updateBossHazards(dt);for(let i=0;i<enemies.length;i++){let a=enemies[i];if(a.hp<=0)continue;for(let j=i+1;j<enemies.length;j++){let b=enemies[j];if(b.hp<=0)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,min=a.radius+b.radius+1;if(d<min){let push=(min-d)*.15;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push}}}
for(let i=projectiles.length-1;i>=0;i--){let b=projectiles[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<0||b.x<92||b.x>WORLD_W-92||b.y<148||b.y>WORLD_H-97){projectiles.splice(i,1);continue}if(b.from==='enemy'&&Math.hypot(b.x-player.x,b.y-player.y)<b.r+7){hurtPlayer(b.damage);makeParticles(b.x,b.y,b.color,7);projectiles.splice(i,1)}else if(b.from==='enemy'&&coop.active&&coop.host){const target=[...coop.allies.values()].find(p=>p.hp>0&&Math.hypot(b.x-p.x,b.y-p.y)<b.r+7);if(target){const old=player;player=target;hurtPlayer(b.damage);player=old;makeParticles(b.x,b.y,b.color,7);projectiles.splice(i,1);}}else if(b.from==='player'){let hit=enemies.find(e=>e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.radius);if(hit){const prior=player;if(coop.active&&coop.host&&b.ownerId&&b.ownerId!==coop.id){player=coop.allies.get(b.ownerId)||player;}hitEnemy(hit,b.damage,true);player=prior;if(b.bone==='azul'){hit.slow=Math.max(hit.slow||0,1.9);}if(b.bone==='laranja'){hit.burnTime=3.3;hit.burnTick=.3;}if(b.bone){makeParticles(hit.x,hit.y,b.color,12);ring(hit.x,hit.y,22,b.color);}projectiles.splice(i,1)}}}
enemies=enemies.filter(e=>e.hp>0);
for(let i=healthDrops.length-1;i>=0;i--){const h=healthDrops[i];h.life-=dt;if(h.life<=0){healthDrops.splice(i,1);continue;}const target=(coop.active&&coop.host?[player,...coop.allies.values()]:[player]).find(p=>p.hp>0&&Math.hypot(h.x-p.x,h.y-p.y)<16);if(target){let gain=Math.min(h.amount,target.maxHp-target.hp);target.hp+=gain;if(gain>0){textPop(target.x,target.y-22,'+'+Math.round(gain)+' VIDA','#9af8a7');YG_AUDIO.play('card',.5);}healthDrops.splice(i,1);}}
// After killing the final Oni the player can explore for three real seconds.
// No countdown overlay appears; projectiles/hazards are removed for safety.
if(enemies.length===0&&phase==='play'){
 if(waveClearTimer<0){waveClearTimer=3;projectiles=[];hazards=[];}
 else {waveClearTimer=Math.max(0,waveClearTimer-dt);if(waveClearTimer===0){waveClearTimer=-1;if(stage===20){phase='over';player.hp=player.maxHp;$('endTitle').textContent='PECADO FOI DERROTADO';$('endText').textContent='Os heróis resistiram ao fim das raízes. Você venceu a batalha final na onda 20!';$('gameOverScreen').classList.remove('hidden');}else{phase='reward';showRewards();}}}
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
  const hp=(type==='runner'?38:type==='caster'?57:66)*(isPecador()?1.38:1);
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
 e.summonTimer-=dt;
 if(e.summonTimer<=0){e.summonTimer=e.rage?(isPecador()?5.1:6.3):(isPecador()?6.3:8.0);spawnReuniOnis(e,e.rage?(isPecador()?4:3):2);}
 if(e.mode==='windup'){
  e.windup-=dt;
  // The marked attack does not hurt the player before the visible warning finishes.
  if(e.windup<=0){
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
 e.summonTimer-=dt;
 if(e.summonTimer<=0){e.summonTimer=e.rage?(isPecador()?7:9):(isPecador()?10:12);summonTsukuomi(e,e.rage?3:2);}
 if(e.mode==='windup'){
  e.windup-=dt;
  if(e.windup<=0){
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
 const count=enemies.filter(x=>x.hp>0&&!isBossEnemy(x)).length,cap=isPecador()?18:14;
 n=Math.max(0,Math.min(n,cap-count));
 for(let i=0;i<n;i++){
  let a=TAU*(i+.45)/Math.max(n,1)+elapsed*.3;
  const x=clamp(e.x+Math.cos(a)*(65+(i%2)*25),104,WORLD_W-106);
  const y=clamp(e.y+Math.sin(a)*(61+(i%2)*23),160,WORLD_H-105);
  addMob(i%3===0?'beast':i%3===1?'ghost':'yokai',x,y,i%5===0,true);
  ring(x,y,31,'#f13b48');
 }
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
 if(e.corruptionPhase<1&&ratio<=.70){e.corruptionPhase=1;e.speed*=1.18;e.rage=true;bossMessage='PECADO · SEGUNDA FASE · CORRUPÇÃO';bossMessageTimer=3;makeParticles(e.x,e.y,'#ff243e',55,1.9);ring(e.x,e.y,142,'#ff143d');YG_AUDIO.play('bossRage',1.4);pecadoSummon(e,isPecador()?7:5);}
 if(e.corruptionPhase<2&&ratio<=.35){e.corruptionPhase=2;e.speed*=1.24;bossMessage='PECADO · FASE FINAL · FIM DAS RAÍZES';bossMessageTimer=3.5;makeParticles(e.x,e.y,'#fd173b',70,2.2);ring(e.x,e.y,174,'#ff122f');YG_AUDIO.play('bossRage',1.55);pecadoSummon(e,isPecador()?10:7);}
 e.summonTimer-=dt;
 if(e.summonTimer<=0){e.summonTimer=e.corruptionPhase===2?5.5:e.corruptionPhase===1?7.5:10.5;pecadoSummon(e,e.corruptionPhase===2?5:3);}
 if(e.mode==='windup'){
  e.windup-=dt;
  if(e.windup<=0){
   if(e.move==='curse'){
    let diff=Math.atan2(Math.sin(Math.atan2(player.y-e.y,player.x-e.x)-e.angle),Math.cos(Math.atan2(player.y-e.y,player.x-e.x)-e.angle));
    if(d<210&&Math.abs(diff)<.58){applyCurse(6.8);hurtPlayer(e.corruptionPhase===2?29:18);}
    for(let j=-2;j<=2;j++){let a=e.angle+j*.23;shoot(e,{x:Math.cos(a),y:Math.sin(a)},155+e.corruptionPhase*23,16+e.corruptionPhase*4,'#ff2146');}
   }else if(e.move==='spear'){
    const count=e.corruptionPhase===2?14:e.corruptionPhase===1?11:8;
    for(let j=0;j<count;j++){const a=TAU*j/count+(elapsed*.2);shoot(e,{x:Math.cos(a),y:Math.sin(a)},155+e.corruptionPhase*20,14+e.corruptionPhase*3,'#e32044');}
   }else if(e.move==='summon')pecadoSummon(e,e.corruptionPhase===2?8:5);
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

function updateBossHazards(dt){
 for(let i=hazards.length-1;i>=0;i--){
  const h=hazards[i];h.delay-=dt;
  if(h.delay<=0){
   if(!h.done){h.done=true;h.active=.32;slash(h.x,h.y-Math.min(17,h.r),Math.PI/2,h.r*.9,h.type==='sin'?'#ff1747':h.type==='void'?'#c38bff':h.type==='blood'?'#f8173e':'#f94b7f');makeParticles(h.x,h.y,'#ff537d',8);for(const t of coop.active&&coop.host?[player,...coop.allies.values()]:[player]){if(t.hp<=0||Math.hypot(h.x-t.x,h.y-t.y)>=h.r+6)continue;const original=player;player=t;if(h.type==='sin')applyCurse(5);hurtPlayer(h.type==='sin'?(isPecador()?36:26):h.type==='void'?(isPecador()?30:22):h.type==='blood'?(isPecador()?25:20):(15+stage*.45));player=original;}
   }
   h.active-=dt;if(h.active<=0)hazards.splice(i,1);
  }
 }
}
function drawBossWarnings(){
 if(phase!=='play')return;
 for(const h of hazards){
  ctx.save();ctx.strokeStyle=h.type==='sin'?'#ff153c':h.type==='void'?'#c48bff':h.type==='blood'?'#ff1e45':h.done?'#fff0e7':'#ff5476';ctx.fillStyle=h.type==='sin'?'#df001c66':h.type==='void'?'#7030a34c':h.type==='blood'?'#a909324a':h.done?'#ff5a8666':'#f74a6047';ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,TAU);ctx.fill();ctx.stroke();
  if(h.done){ctx.strokeStyle='#fff2f5';ctx.beginPath();ctx.moveTo(h.x-8,h.y-17);ctx.lineTo(h.x,h.y+16);ctx.lineTo(h.x+8,h.y-17);ctx.stroke();}
  ctx.restore();
 }
 for(const e of enemies){if(!isBossEnemy(e)||e.mode!=='windup')continue;
  ctx.save();ctx.fillStyle='#f3385652';ctx.strokeStyle='#fe6284';ctx.lineWidth=1.6;
  if(e.move==='curse'){const r=210;ctx.fillStyle='#f5193e55';ctx.strokeStyle='#ff5367';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,r,e.angle-.58,e.angle+.58);ctx.closePath();ctx.fill();ctx.stroke();}
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

function shoot(e,vec,speed,damage,color){if(projectiles.length>155)return;YG_AUDIO.play('oniCast',.56);projectiles.push({x:e.x,y:e.y,vx:vec.x*speed,vy:vec.y*speed,life:3,r:3.5,damage,from:'enemy',color});}
function drawR(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function drawMap(){
 if(ARENA.complete&&ARENA.naturalWidth){
  const sx=Math.round(camera.x),sy=Math.round(camera.y);
  ctx.drawImage(ARENA,sx,sy,W,H,sx,sy,W,H);
  ctx.fillStyle=stage===20?'rgba(142,0,8,.66)':'#07071126';ctx.fillRect(sx,sy,W,H);
  if(stage===20){ctx.fillStyle='rgba(255,25,40,.09)';ctx.fillRect(sx,sy,W,H);}
 }else{
  ctx.fillStyle='#211e30';ctx.fillRect(0,0,WORLD_W,WORLD_H);
 }
 // Sparse decorative falling leaves; only draw ones close to the camera.
 for(let i=0;i<24;i++){
  const px=(123+i*127+Math.sin(elapsed*.45+i)*10)%WORLD_W;
  const py=(187+i*151+elapsed*11)%WORLD_H;
  if(px<camera.x-10||px>camera.x+W+10||py<camera.y-10||py>camera.y+H+10)continue;
  ctx.globalAlpha=.48;drawR(px,py,2,2,i%2?'#c33d56':'#e9a58a');
 }
 ctx.globalAlpha=1;
}
function shiftColor(hex,step){let n=parseInt(hex.slice(1),16),r=clamp((n>>16)+step,0,255),g=clamp(((n>>8)&255)+step,0,255),b=clamp((n&255)+step,0,255);return `rgb(${r},${g},${b})`}
function spritePixel(x,y,a,b=1,c=1){if(typeof a==='string')drawR(x,y,b,c,a);else drawR(x,y,a,b,c)}
function heroSprite(x,y,type,face='down',step=0,transform=false,scale=1){
 const frogActive=type==='kris'&&player&&player.frogTime>0;const im=frogActive?FROG:HERO[type];if(!im||!im.complete||!im.naturalWidth)return;
 const row={down:0,left:1,right:2,up:3}[face]??0;
 const walk=movingNow&&phase==='play';const sequence=[1,0,1,2];
 const col=walk?sequence[Math.floor(step*1.15)%sequence.length]:1;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
 if(transform){
   ctx.shadowBlur=18;ctx.shadowColor='#9a52ff';ctx.fillStyle='#6a2db588';
   ctx.beginPath();ctx.ellipse(0,-13,17,20,0,0,TAU);ctx.fill();ctx.shadowBlur=0;
 }
 // Loid retains the original sprite; Kris now uses the corrected slim-legged 12-frame sheet.
 ctx.imageSmoothingEnabled=true;
 ctx.drawImage(im,col*112,row*112,112,112,frogActive?-23:-20,frogActive?-39:-34,frogActive?46:40,frogActive?46:40);
 if(frogActive){ctx.restore();return;}
 if(player&&player.type==='cross'&&player.ultimateBuff==='cross'&&player.ultimateBuffTime>0){ctx.shadowColor='#b375ff';ctx.shadowBlur=14;ctx.strokeStyle='#ab76ed';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-15,25,28,0,0,TAU);ctx.stroke();ctx.shadowBlur=0;}
 if(player&&player.type==='kris'&&player.ultimateBuffTime>0){
  const k=player.ultimateBuff;
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
function enemySprite(e){
 const img=ENEMY_ART[e.type];
 if(img&&img.complete&&img.naturalWidth){
  ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y));
  if(isBossEnemy(e)){
   const row={down:0,left:1,right:2,up:3}[e.face||'down']??0;
   const col=Math.floor(elapsed*(e.mode==='charge'?15:6))%3;
   if(e.rage){ctx.shadowColor=e.type==='pecado'?'#f10d2c':e.type==='tsukuomi'?'#9f59ea':e.type==='reuni'?'#fa1e3e':'#f7367c';ctx.shadowBlur=10;ctx.fillStyle='#9e1d5166';ctx.beginPath();ctx.ellipse(0,-10,23,25,0,0,TAU);ctx.fill();ctx.shadowBlur=0;}
   if(e.mode==='guard'&&e.type==='boss'){ctx.strokeStyle='#fa607f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-12,32,0,TAU);ctx.stroke();}
   ctx.drawImage(img,col*112,row*112,112,112,e.type==='pecado'?-37:e.type==='tsukuomi'?-31:e.type==='reuni'?-28:-32,e.type==='pecado'?-78:e.type==='tsukuomi'?-63:e.type==='reuni'?-54:-53,e.type==='pecado'?74:e.type==='tsukuomi'?62:e.type==='reuni'?56:64,e.type==='pecado'?90:e.type==='tsukuomi'?70:e.type==='reuni'?62:64);
   if(e.hurt>0){ctx.fillStyle='#fff';ctx.globalAlpha=Math.min(.25,e.hurt*2);ctx.fillRect(-21,-46,42,42);}
  }else{
   const col={down:0,left:1,up:2,right:3}[e.face||'down']??0;
   const size=e.type==='runner'?30:e.type==='beast'?39:e.type==='yokai'?36:e.type==='ghost'?35:33;
   // The three new Oni types use a four-direction sprite sheet.
   if(e.type==='ghost'){ctx.globalAlpha=.72+.18*Math.sin(elapsed*4+e.phase);ctx.translate(0,Math.sin(elapsed*3+e.phase)*3);}
   if(e.elite){ctx.shadowColor='#ffad66';ctx.shadowBlur=12;}
   ctx.drawImage(img,col*96,0,96,96,-size/2,-size+8,size,size);ctx.shadowBlur=0;
   if(e.hurt>0){ctx.globalAlpha=Math.min(.3,e.hurt*3);ctx.fillStyle='#fff';ctx.fillRect(-size/2,-size+8,size,size);}
  }
  ctx.restore();
 }else{ctx.fillStyle='#4f274d';ctx.fillRect(e.x-8,e.y-18,16,18)}
 if(e.corruptTime>0){ctx.save();ctx.strokeStyle='#bb58f7';ctx.globalAlpha=.72;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y-12,e.radius+6,e.radius+11,0,0,TAU);ctx.stroke();ctx.restore();}
 if(isBossEnemy(e)){
  drawR(e.x-37,e.y-54,74,6,'#160c18');
  drawR(e.x-36,e.y-53,72*Math.max(0,e.hp/e.maxHp),4,e.type==='pecado'?'#ff243b':e.type==='tsukuomi'?'#bc80ff':e.type==='reuni'?'#f61943':e.rage?'#f52d56':'#d97687');
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
function drawDarkDomain(){
 if(!player||player.type!=='loid'||player.ultimateTime<=0)return;
 ctx.save();const r=177+Math.sin(elapsed*4)*3;
 // Dark field is opaque in the centre, translucent at the edge, leaving characters readable.
 const g=ctx.createRadialGradient(player.x,player.y,12,player.x,player.y,r);
 g.addColorStop(0,'rgba(2,1,7,.95)');g.addColorStop(.7,'rgba(3,2,9,.92)');g.addColorStop(.92,'rgba(10,3,20,.85)');g.addColorStop(1,'rgba(14,4,26,0)');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(player.x,player.y,r,0,TAU);ctx.fill();
 ctx.strokeStyle='#683f95';ctx.globalAlpha=.9;ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,r-6,0,TAU);ctx.stroke();
 ctx.strokeStyle='#b273e6';ctx.globalAlpha=.28;ctx.lineWidth=1;ctx.beginPath();ctx.arc(player.x,player.y,r-15,elapsed*.35,elapsed*.35+4.4);ctx.stroke();
 ctx.restore();
}
function drawDarkAura(){
 if(!player||player.type!=='loid'||player.darkAuraTime<=0)return;
 ctx.save();
 const pulse=Math.sin(elapsed*7)*4,r=70+pulse;
 const g=ctx.createRadialGradient(player.x,player.y-9,7,player.x,player.y-9,r);
 g.addColorStop(0,'rgba(8,5,13,.83)');g.addColorStop(.48,'rgba(16,8,22,.68)');g.addColorStop(.83,'rgba(22,9,35,.36)');g.addColorStop(1,'rgba(19,7,25,0)');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(player.x,player.y-9,r,0,TAU);ctx.fill();
 ctx.strokeStyle='#15101f';ctx.lineWidth=3;ctx.globalAlpha=.75;
 for(let i=0;i<3;i++){
  const a=elapsed*(.5+i*.2)+i*TAU/3;
  ctx.beginPath();ctx.arc(player.x,player.y-9,45+i*7,a,a+1.6);ctx.stroke();
 }
 ctx.restore();
}
function drawDashShadows(){
 if(!player||player.type!=='loid'||!dashShadows.length)return;
 for(const ghost of dashShadows){
  const a=Math.pow(Math.max(0,ghost.life/ghost.max),1.2);
  ctx.save();ctx.globalAlpha=a*.28;ctx.fillStyle='#13091c';
  ctx.beginPath();ctx.ellipse(ghost.x,ghost.y-10,12+7*(1-a),20,0,0,TAU);ctx.fill();
  ctx.globalAlpha=a*.5;ctx.filter='brightness(0)';
  heroSprite(ghost.x,ghost.y,'loid',ghost.face,ghost.step,false,.96);
  ctx.filter='none';ctx.globalAlpha=a*.36;ctx.strokeStyle='#61376f';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(ghost.x,ghost.y-13,9+(1-a)*13,0,TAU);ctx.stroke();ctx.restore();
 }
}
function drawEffects(){for(const b of projectiles){ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();if(b.bone){ctx.strokeStyle='#fff9f4';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=b.color;ctx.fillRect(b.x-7,b.y-2,14,4);}drawR(b.x-1,b.y-1,2,2,'#f4d8ff')}
for(const s of slashes){ctx.save();ctx.globalAlpha=s.life/s.max;ctx.strokeStyle=s.color;ctx.lineWidth=6;ctx.beginPath();ctx.arc(s.x,s.y,s.r*.62,s.ang-1.25,s.ang+1.25);ctx.stroke();ctx.strokeStyle='#faf2fe';ctx.lineWidth=1;ctx.stroke();ctx.restore()}
for(const ring of rings){ctx.save();ctx.globalAlpha=ring.life/ring.max;ctx.strokeStyle=ring.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(ring.x,ring.y,ring.r*(1.35-ring.life/ring.max*.35),0,TAU);ctx.stroke();ctx.restore()}
for(const p of particles){ctx.save();ctx.globalAlpha=Math.min(1,p.life/p.max);if(p.text){ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillStyle='#17111c';ctx.fillText(p.text,p.x+1,p.y+1);ctx.fillStyle=p.color;ctx.fillText(p.text,p.x,p.y)}else{drawR(p.x,p.y,p.size,p.size,p.color)}ctx.restore()}}

function drawHealthDrops(){
 for(const h of healthDrops){if(h.x<camera.x-20||h.x>camera.x+W+20||h.y<camera.y-20||h.y>camera.y+H+20)continue;
  ctx.save();ctx.translate(h.x,h.y-6+Math.sin(elapsed*5+h.phase)*3);
  let k=1+Math.sin(elapsed*7+h.phase)*.13;ctx.scale(k,k);
  ctx.shadowBlur=8;ctx.shadowColor='#ff5e89';ctx.fillStyle='#6d1839';ctx.fillRect(-7,-3,14,11);ctx.shadowBlur=0;
  ctx.fillStyle='#ff6a85';ctx.fillRect(-7,-5,5,7);ctx.fillRect(2,-5,5,7);ctx.fillRect(-5,0,10,6);ctx.fillRect(-3,6,6,4);ctx.fillRect(-1,10,2,2);ctx.fillStyle='#ffe4da';ctx.fillRect(-4,-4,2,3);ctx.restore();
 }
}

function draw(){
 ctx.setTransform(RENDER_SCALE,0,0,RENDER_SCALE,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.save();
 if(shake>0&&phase==='play')ctx.translate(rand(-shake,shake),rand(-shake,shake));
 ctx.save();ctx.translate(-Math.round(camera.x),-Math.round(camera.y));
 drawMap();drawBossWarnings();
 if(phase!=='select'){
  // Sort actors by their feet for an understandable top-down overlap.
  const actors=enemies.filter(e=>e.x>camera.x-110&&e.x<camera.x+W+110&&e.y>camera.y-120&&e.y<camera.y+H+120).map(e=>({y:e.y,kind:'enemy',e}));
  if(player)actors.push({y:player.y,kind:'player'});if(coop.active)for(const [id,a] of coop.allies)actors.push({y:a.y,kind:'ally',a,id});for(const s of shadowClones){if(s.x>camera.x-60&&s.x<camera.x+W+60&&s.y>camera.y-60&&s.y<camera.y+H+60)actors.push({y:s.y,kind:'clone',s});}
  actors.sort((a,b)=>a.y-b.y);
  drawTsukuomiNight();drawDarkDomain();drawDarkAura();
  if(coop.active)for(const ally of coop.allies.values()){
    if(ally.type!=='loid'||ally.hp<=0)continue;
    const r=ally.ultimateTime>0?178:ally.darkAuraTime>0?70:0;
    if(!r)continue;
    ctx.save();ctx.fillStyle=ally.ultimateTime>0?'#08030bcb':'#130d21a3';ctx.beginPath();ctx.arc(ally.x,ally.y,r,0,TAU);ctx.fill();
    ctx.strokeStyle='#8552a6';ctx.lineWidth=2;ctx.stroke();ctx.restore();
  }drawDashShadows();drawDimensionalCharge();
  for(const a of actors){
   if(a.kind==='enemy')enemySprite(a.e);else if(a.kind==='clone')drawShadowClone(a.s);else if(a.kind==='ally'){const p=a.a;ctx.save();if(p.hp<=0)ctx.globalAlpha=.38;heroSprite(p.x,p.y,p.type,p.face,p.step,p.transformTime>0);ctx.restore();ctx.save();ctx.textAlign='center';ctx.font='bold 8px system-ui';ctx.fillStyle='#f7e3fd';ctx.strokeStyle='#160921';ctx.lineWidth=2;const name=p.type.toUpperCase();ctx.strokeText(name,p.x,p.y-45);ctx.fillText(name,p.x,p.y-45);ctx.fillStyle='#311524';ctx.fillRect(p.x-17,p.y-40,34,3);ctx.fillStyle='#d15d83';ctx.fillRect(p.x-17,p.y-40,34*Math.max(0,p.hp/p.maxHp),3);ctx.restore();}
   else if(player){
    if(player.orbiters){for(let i=0;i<player.orbiters;i++){let t=elapsed*2+i*TAU/player.orbiters;ctx.fillStyle='#7e4bbb';ctx.beginPath();ctx.arc(player.x+Math.cos(t)*23,player.y+Math.sin(t)*13,4,0,TAU);ctx.fill()}}
    if(player.transformTime>0){ctx.globalAlpha=.26;ctx.fillStyle='#a452ff';ctx.beginPath();ctx.arc(player.x,player.y-8,18+Math.sin(elapsed*10)*3,0,TAU);ctx.fill();ctx.globalAlpha=1}
    ctx.save();if(player.invuln>0&&Math.floor(elapsed*18)%2!==0)ctx.globalAlpha=.5;
    heroSprite(player.x,player.y,player.type,player.face,player.step,player.transformTime>0);ctx.restore();
   }
  }
  drawEffects();drawCardBeam();drawHealthDrops();
  if(player&&player.curseTime>0){ctx.save();ctx.strokeStyle='#ff1c50';ctx.globalAlpha=.6;ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y-12,23+Math.sin(elapsed*8)*3,0,TAU);ctx.stroke();ctx.restore();}
 }
 ctx.restore();
 if(phase==='select'){ctx.fillStyle='#100e1c44';ctx.fillRect(0,0,W,H)}
 if(waveIntro>0&&phase==='play'){
  ctx.save();ctx.globalAlpha=Math.min(1,waveIntro,2.3-waveIntro+.45);
  ctx.fillStyle='#160e22d8';ctx.fillRect(W/2-103,H/2-27,206,54);
  ctx.strokeStyle='#b981a4';ctx.strokeRect(W/2-103,H/2-27,206,54);
  ctx.font='bold 18px Georgia';ctx.textAlign='center';ctx.fillStyle='#ffe6ca';
  ctx.fillText('ONDA '+String(stage).padStart(2,'0'),W/2,H/2-5);
  ctx.font='10px Georgia';ctx.fillStyle='#edb7c8';ctx.fillText(waveName(stage),W/2,H/2+13);ctx.restore();
 }
 if(bossMessageTimer>0&&phase==='play'){
  ctx.save();ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.fillStyle='#170d1de0';ctx.fillRect(W/2-140,32,280,21);ctx.strokeStyle='#db7b8e';ctx.strokeRect(W/2-140,32,280,21);ctx.fillStyle='#ffe1cc';ctx.fillText(bossMessage,W/2,46);ctx.restore();
 }
 if(flash>0){ctx.fillStyle=`rgba(255,60,105,${flash*.95})`;ctx.fillRect(0,0,W,H)}
 ctx.restore();
}
function updateHud(){
 if(!player)return;
 $('secondaryName').textContent=player.type==='loid'?'SOMBRAS':player.type==='cross'?'OSSOS':'CORTE';
 $('btnSecondary').querySelector('b').textContent=player.type==='loid'?'SOMBRAS E':player.type==='cross'?'OSSOS E':'CORTE E';
 $('playerName').textContent=(player.type==='loid'?'LOID · ESCURIDÃO':player.type==='cross'?'CROSS · CORRUPÇÃO':player.frogSkill?'KRIS · FORMA DO SAPO':'KRIS · ESPADA NEGRA')+(player.curseTime>0?' · ⚠ FRAQUEZA '+Math.ceil(player.curseTime)+'s':'');
 $('hpFill').style.width=Math.max(0,player.hp/player.maxHp*100)+'%';
 $('hpText').textContent=`${Math.ceil(player.hp)} / ${player.maxHp}`;
 const skillPct=player.frogSkill?(player.frogUsed?0:100):Math.max(0,100*(1-player.skillCd/player.skillDelay));
 $('powerFill').style.width=skillPct+'%';
 $('powerText').textContent=player.frogSkill?(player.frogTime>0?'Q · SAPO ATIVO · ATAQUE J':player.frogUsed?'Q · SAPO UTILIZADO':'Q · SAPO PRONTO (1x)'):player.skillCd>0?`Q · ${player.skillCd.toFixed(1)} s`:'Q · PODER PRONTO';
 const charge=Math.max(0,Math.min(100,player.ultimateCharge));
 $('ultimateFill').style.width=charge+'%';
 $('ultimateText').textContent=player.type==='cross'&&player.ultimateBuff==='cross'&&player.ultimateBuffTime>0?'RUPTURA ATIVA':player.ultimateTime>0?'DOMÍNIO '+player.ultimateTime.toFixed(1)+'s':player.ultimateBuffTime>0?'SUPREMO ATIVO':charge>=100?'R · SUPREMO PRONTO':`R · CARGA ${Math.floor(charge)}%`;
 $('btnUltimate').classList.toggle('cool',charge<100);
 $('btnSkill').classList.toggle('cool',player.frogSkill?player.frogUsed:player.skillCd>0);
 $('btnDash').classList.toggle('cool',player.dashCd>0);
 $('btnSecondary').classList.toggle('cool',player.secondaryCd>0&&!player.secondaryCharging);
 $('btnSkill').dataset.timer=player.frogSkill?(player.frogUsed?'USADO':'SAPO'):player.skillCd>0?player.skillCd.toFixed(1)+'s':'';
 $('btnDash').dataset.timer=player.dashCd>0?player.dashCd.toFixed(1)+'s':'';
 $('btnUltimate').dataset.timer=charge<100?Math.floor(charge)+'%':'';
 $('btnSecondary').dataset.timer=player.secondaryCd>0?player.secondaryCd.toFixed(1)+'s':'';
 $('btnSkill').style.setProperty('--readiness',skillPct+'%');
 const bCard=$('btnCardPower');bCard.style.display=player.cardPower?'flex':'none';bCard.classList.toggle('cool',player.cardPowerUsed||player.cardPower==='granita'&&player.ultimateCharge<50);bCard.querySelector('b').textContent=player.cardPower==='gaster'?'GASTER F':'GRANITA F';bCard.dataset.timer=player.cardPowerUsed?'USADO':player.cardPower==='granita'&&player.ultimateCharge<50?'50%':'';
 $('btnDash').style.setProperty('--readiness',Math.max(0,100*(1-player.dashCd/player.dashDelay))+'%');
 $('btnUltimate').style.setProperty('--readiness',charge+'%');
 $('cooldownSkill').textContent=player.frogSkill?(player.frogUsed?'USADO':'SAPO 1x'):player.skillCd>0?player.skillCd.toFixed(1)+'s':'PRONTO';
 $('cooldownDash').textContent=player.dashCd>0?player.dashCd.toFixed(1)+'s':'PRONTO';
 $('cooldownUltimate').textContent=charge>=100?'PRONTO':Math.floor(charge)+'%';
 $('cooldownSkillSlot').style.setProperty('--readiness',skillPct+'%');
 $('cooldownSecondary').textContent=player.secondaryCharging?'CARREGANDO '+Math.round(player.secondaryCharge/1.6*100)+'%':player.secondaryCd>0?player.secondaryCd.toFixed(1)+'s':'PRONTO';
 $('cooldownSecondarySlot').style.setProperty('--readiness', (player.secondaryCharging?player.secondaryCharge/1.6*100:Math.max(0,100*(1-player.secondaryCd/player.secondaryDelay)))+'%');
 $('btnSecondary').style.setProperty('--readiness', (player.secondaryCharging?player.secondaryCharge/1.6*100:Math.max(0,100*(1-player.secondaryCd/player.secondaryDelay)))+'%');
 $('cooldownDashSlot').style.setProperty('--readiness',Math.max(0,100*(1-player.dashCd/player.dashDelay))+'%');
 $('cooldownUltimateSlot').style.setProperty('--readiness',charge+'%');
 $('stageText').textContent='ONDA '+String(stage).padStart(2,'0')+(stage===20?' · PECADO':stage===15?' · TSUKUOMI':stage===10?' · REUNI':stage%5===0?' · CHEFE':'')+(isPecador()?' ✦ PECADOR':'');
 $('themeText').textContent=theme().name;
 $('counterText').textContent=`INIMIGOS ${enemies.filter(e=>e.hp>0).length} · ESSÊNCIA ${essence}`+(coop.active?` · ONLINE ${coop.members.length}/3`:'');
}

function pickCards(){let valid=cards.filter(c=>(!c.hero||c.hero===player.type)&&!(c.id==='gaster'&&player.cardPower)&&!(c.id==='granita'&&player.cardPower)&&!(c.id==='frog'&&(player.frogSkill||player.frogUsed))&&!(player.frogSkill&&['black','form','awakening','bloodmoon'].includes(c.id))),selected=[];while(selected.length<3&&valid.length){let index=Math.floor(Math.random()*valid.length),c=valid.splice(index,1)[0],weight=c.rarity==='legendary'?.11:c.rarity==='rare'?.45:1;if(Math.random()<weight||valid.length<3-selected.length)selected.push(c)}if(player.type==='kris'&&!player.frogSkill&&stage===8&&!selected.some(c=>c.id==='frog')){selected[1]=cards.find(c=>c.id==='frog');}if(player.type==='cross'&&!player.cardPower&&stage===8&&!selected.some(c=>c.id==='gaster'))selected[1]=cards.find(c=>c.id==='gaster');if(player.type==='loid'&&!player.cardPower&&stage===11&&!selected.some(c=>c.id==='granita'))selected[1]=cards.find(c=>c.id==='granita');return selected.slice(0,3)}
const rarLabel={common:'COMUM',rare:'RARA',legendary:'LENDÁRIA'};
function showRewards(){if(coop.active)coop.chosen=false;YG_AUDIO.play('waveClear',1.17);opts=pickCards();let gg=$('rewardGrid');gg.innerHTML='';for(let i=0;i<opts.length;i++){const c=opts[i],b=document.createElement('button');b.className='upgrade '+c.rarity;b.innerHTML=`<span class="num">0${i+1}</span><div class="iconbox"><img class="card-art" alt="" src="${CARD_IMAGES[c.id]}"></div><strong>${c.name}</strong><span class="rar">◆ ${rarLabel[c.rarity]}</span><div class="desc">${c.desc}</div>`;b.onclick=()=>chooseCard(i);gg.appendChild(b)}$('rewardSubtitle').textContent='◆ ONDA '+String(stage).padStart(2,'0')+' VENCIDA ◆';$('rewardScreen').classList.remove('hidden');updateHud()}
function chooseCard(i){if(phase!=='reward'||!opts[i])return;let c=opts[i];YG_AUDIO.play('card',1.15);if(coop.active){if(coop.chosen)return;coop.chosen=true;$('rewardScreen').classList.add('hidden');if(coop.host){c.effect(player);player.cards.push(c.id);coop.choices.add(coop.id);coopTryWave();}else coopAction('card',c.id);return;}c.effect(player);player.cards.push(c.id);makeParticles(player.x,player.y,'#dfb9ff',25);testBossMode=false;stage++;spawnStage();}
function restart(){if(coop.active)coopLeave();YG_AUDIO.play('menu',.75);phase='title';testBossMode=false;waveClearTimer=-1;dashShadows=[];shadowClones=[];hazards=[];bossMessageTimer=0;player=null;keys.clear();mouseAim=null;pointerDown=false;attackMobile=false;mobileMove={x:0,y:0};enemies=[];particles=[];slashes=[];$('titleScreen').classList.remove('hidden');$('selectScreen').classList.add('hidden');$('supremeScreen').classList.add('hidden');$('rewardScreen').classList.add('hidden');$('gameOverScreen').classList.add('hidden');$('coopScreen').classList.add('hidden');$('hud').style.display='none';$('mobileControls').style.display='none';document.body.classList.remove('is-playing');adaptViewport()}
function frame(time){if(!last)last=time;let dt=Math.min((time-last)/1000,.032);last=time;if(coop.active&&!coop.host){elapsed+=dt;if(player&&coop.targetLocal){const k=Math.min(1,dt*17);player.x+=(coop.targetLocal.x-player.x)*k;player.y+=(coop.targetLocal.y-player.y)*k;for(const [id,target] of coop.targetAllies){const a=coop.allies.get(id);if(a){a.x+=(target.x-a.x)*k;a.y+=(target.y-a.y)*k;}}}if(player){camera.x+=(clamp(player.x-W/2,0,WORLD_W-W)-camera.x)*Math.min(1,dt*9);camera.y+=(clamp(player.y-H/2,0,WORLD_H-H)-camera.y)*Math.min(1,dt*9);}coopSendInput(time);}else{update(dt);if(coop.active&&coop.host&&time-coop.lastSnapshot>85){coop.lastSnapshot=time;coopSendState();}}draw();requestAnimationFrame(frame)}
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
// Input: full keyboard, mouse aim, and touch virtual controls.
window.addEventListener('keydown',e=>{
 const key=e.key.toLowerCase(); if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))e.preventDefault();
 if(phase==='ultimate'){if(['1','2','3','4'].includes(key))chooseUltimate(['fight','defesa','itens','piedade'][Number(key)-1]);return;}
 if(phase==='reward'){if(['1','2','3'].includes(key))chooseCard(Number(key)-1);return;}
 if(phase==='title'){if(key==='enter')openSelection();return;}
 if(phase!=='play')return;
 keys.add(key);
 if(key===' ')dash();if(key==='q')skill();if(key==='e'&&!e.repeat)secondaryDown();if(key==='r')ultimate();if(key==='f')cardPower();if(key==='j')attack();
});
window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k);if(k==='e')secondaryUp();});window.addEventListener('blur',()=>{if(player)player.secondaryCharging=false;keys.clear();attackMobile=false;pointerDown=false;mobileMove={x:0,y:0}});
function canvasPos(e){let b=canvas.getBoundingClientRect();return {x:(e.clientX-b.left)/b.width*W+camera.x,y:(e.clientY-b.top)/b.height*H+camera.y}}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&phase==='play')mouseAim=canvasPos(e)});
canvas.addEventListener('pointerdown',e=>{if(phase!=='play')return;e.preventDefault();let p=canvasPos(e);mouseAim=p;pointerDown=true;attack();canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointerup',()=>{pointerDown=false});canvas.addEventListener('pointercancel',()=>{pointerDown=false});
const joy=$('joystick'),knob=$('knob');let joyPid=null;
function joyPosition(e){let b=joy.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2,dx=e.clientX-cx,dy=e.clientY-cy,rad=b.width*.29,l=Math.hypot(dx,dy)||1;let px=dx*(Math.min(1,rad/l)),py=dy*Math.min(1,rad/l);knob.style.left=`calc(50% + ${px}px)`;knob.style.top=`calc(50% + ${py}px)`;mobileMove={x:clamp(dx/rad,-1,1),y:clamp(dy/rad,-1,1)};mouseAim=null;}
joy.addEventListener('pointerdown',e=>{e.preventDefault();joyPid=e.pointerId;joy.setPointerCapture(e.pointerId);joyPosition(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyPid)joyPosition(e)});function joyEnd(e){if(e.pointerId!==joyPid)return;joyPid=null;mobileMove={x:0,y:0};knob.style.left='50%';knob.style.top='50%'}joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
$('btnAttack').addEventListener('pointerdown',e=>{e.preventDefault();attackMobile=true;attack();$('btnAttack').setPointerCapture(e.pointerId)});for(let event of ['pointerup','pointercancel','lostpointercapture'])$('btnAttack').addEventListener(event,()=>attackMobile=false);
$('btnCardPower').addEventListener('pointerdown',e=>{e.preventDefault();cardPower()});$('btnDash').addEventListener('pointerdown',e=>{e.preventDefault();dash()});$('btnSkill').addEventListener('pointerdown',e=>{e.preventDefault();skill()});$('btnUltimate').addEventListener('pointerdown',e=>{e.preventDefault();ultimate()});
const secBtn=$('btnSecondary');let secPid=null;secBtn.addEventListener('pointerdown',e=>{e.preventDefault();secPid=e.pointerId;secBtn.setPointerCapture(e.pointerId);secondaryDown();});for(const event of ['pointerup','pointercancel','lostpointercapture'])secBtn.addEventListener(event,e=>{if(e.pointerId!==secPid)return;secPid=null;secondaryUp();});
function setDifficulty(val){difficulty=val==='pecador'?'pecador':'normal';document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===difficulty;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});}
function openSelection(bossId=null){
 YG_AUDIO.play('menu');phase='select';selectedBoss=bossId;
 $('titleScreen').classList.add('hidden');$('bossScreen').classList.add('hidden');$('selectScreen').classList.remove('hidden');
 $('selectionTitle').textContent=bossId?'ESCOLHA QUEM ENFRENTA O CHEFE':'ESCOLHA SEU HERÓI';
 const names={samurai:'DAIMYŌ ONI · ONDA 5',reuni:'REUNI · ONDA 10',tsukuomi:'TSUKUOMI · ONDA 15',pecado:'PECADO · ONDA 20'};
 $('selectionIntro').textContent=bossId?'TESTE IMEDIATO: '+names[bossId]+' — escolha um dos três protagonistas.':'Enfrente ondas de Onis, yokais e fantasmas; escolha uma carta de poder após cada onda.';
 $('selectionBack').textContent=bossId?'← VOLTAR AOS CHEFES':'← VOLTAR À ABERTURA';
}
function openBossList(){YG_AUDIO.play('menu');phase='bosslist';$('titleScreen').classList.add('hidden');$('selectScreen').classList.add('hidden');$('bossScreen').classList.remove('hidden');}
function launchHero(type){start(type,selectedBoss,false);}
$('titleStart').addEventListener('click',()=>openSelection());
$('titleSelect').addEventListener('click',openBossList);
$('bossBack').addEventListener('click',()=>{phase='title';$('bossScreen').classList.add('hidden');$('titleScreen').classList.remove('hidden')});
$('selectionBack').addEventListener('click',()=>{if(selectedBoss)openBossList();else{phase='title';$('selectScreen').classList.add('hidden');$('titleScreen').classList.remove('hidden')}});
for(const b of document.querySelectorAll('[data-boss]'))b.addEventListener('click',()=>openSelection(b.dataset.boss));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setDifficulty(b.dataset.mode)));setDifficulty('normal');
for(const btn of document.querySelectorAll('[data-supreme]'))btn.addEventListener('click',()=>chooseUltimate(btn.dataset.supreme));
$('chooseLoid').addEventListener('click',()=>launchHero('loid'));
$('chooseKris').addEventListener('click',()=>launchHero('kris'));
$('chooseCross').addEventListener('click',()=>launchHero('cross'));
$('restart').onclick=restart;$('retry').onclick=restart;

// -- Multiplayer test: one host-authoritative game, two remote players, 10 snapshots/s. --
function coopConnect(action, code=''){
 if(location.protocol==='file:'){coopNote('Online precisa abrir pelo servidor: execute npm start e acesse o link publicado.');return;}
 if(!window.WebSocket){coopNote('Este navegador não suporta WebSocket.');return;}
 if(coop.socket){try{coop.socket.close();}catch{}}
 const sock=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws');coop.socket=sock;
 coopNote('Conectando à sala...');
 sock.onopen=()=>coopSend(action==='create'?{t:'create'}:{t:'join',code});
 sock.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return;}coopOnMessage(m)};
 sock.onerror=()=>coopNote('Erro de conexão. É necessário um servidor Node.js com WebSocket.');
 sock.onclose=()=>{if(coop.active){coop.active=false;coopNote('A conexão caiu. Volte ao menu para entrar novamente.');}else coopNote('Servidor indisponível. Confira se o projeto está rodando no Node.');};
}
function coopRenderLobby(){
 $('coopConnect').hidden=true;$('coopLobby').hidden=false;
 $('coopRoomCode').textContent=coop.room||'------';
 $('coopPeople').textContent=coop.members.length+' de 3 jogadores: '+coop.members.map(m=>(m.id===coop.id?'VOCÊ':m.id===coop.hostId?'ANFITRIÃO':'ALIADO')+' — '+(m.hero||'escolhendo')).join(' · ');
 $('coopHostOptions').hidden=!coop.host;
 document.querySelectorAll('[data-coop-hero]').forEach(b=>b.classList.toggle('selected',coop.members.some(m=>m.id===coop.id&&m.hero===b.dataset.coopHero)));
 $('coopBegin').disabled=!coop.host||coop.members.length<2||coop.members.some(m=>!m.hero);
}
function coopOnMessage(m){
 switch(m.t){
 case 'welcome':
   coop.active=true;coop.id=m.id;coop.room=m.code;coop.hostId=m.host;coop.host=m.host===m.id;coop.members=m.members;coop.allies.clear();coop.choices.clear();coop.chosen=false;coopRenderLobby();coopNote('Conectado! Escolha seu herói e compartilhe o código.');return;
 case 'lobby':
   coop.room=m.code;coop.hostId=m.host;coop.host=m.host===coop.id;coop.members=m.members;coopRenderLobby();return;
 case 'error':coopNote(m.message||'Erro na sala.');return;
 case 'closed':coop.active=false;coopNote(m.message||'Sala fechada.');restart();return;
 case 'left':coop.allies.delete(m.id);coop.choices.delete(m.id);return;
 case 'begun':{
   coop.active=true;coop.hostId=m.host;coop.host=m.host===coop.id;coop.members=m.members;
   const mine=m.members.find(p=>p.id===coop.id);const hero=mine?.hero||'loid';
   difficulty=m.difficulty==='pecador'?'pecador':'normal';coop.chosen=false;coop.choices.clear();coop.remoteStarted=true;
   $('coopScreen').classList.add('hidden');start(hero,m.boss||false,false);
   if(!coop.host){coop.allies=new Map();for(const mp of m.members){if(mp.id===coop.id)continue;const a=createPlayer(mp.hero);a.x=player.x+30;a.y=player.y-15;coop.allies.set(mp.id,a);}coopNote('Online iniciado.');}
   return;}
 case 'remoteInput':if(coop.host){const a=coop.allies.get(m.id);if(a){a.input={x:m.x||0,y:m.y||0,aim:Number(m.aim)||0,attack:!!m.attack};a.inputAt=performance.now();}}return;
 case 'remotePress':if(coop.host)coopRemotePress(m.id,m.action,m.value);return;
 case 'signal':if(!coop.host&&m.value==='ultimate'){
     coop.selectingUltimate=true;phase='ultimate';$('supremeScreen').classList.remove('hidden');
   }return;
 case 'state':if(!coop.host)coopApplyState(m.data);return;
 }
}
function coopInitAllies(){
 coop.allies.clear();
 for(const m of coop.members){if(m.id===coop.id)continue;
   const a=createPlayer(m.hero||'loid');a.x=WORLD_W/2+(Number(m.id)%3-1)*30;a.y=WORLD_H/2+155;
   a.input={x:0,y:0,aim:-Math.PI/2,attack:false};a.inputAt=performance.now();a.lastAttack=0;
   coop.allies.set(m.id,a);
 }
}
function coopAction(action,value){coopSend({t:'press',action,value});}
function coopRemotePress(id,action,value){
 const a=coop.allies.get(id);if(!a||phase==='over')return;
 if(action==='card'){
   if(phase!=='reward'||coop.choices.has(id))return;
   const c=cards.find(c=>c.id===value&&(!c.hero||c.hero===a.type));if(!c)return;
   if((c.id==='frog'&&a.frogSkill)||(['gaster','granita'].includes(c.id)&&a.cardPower))return;
   c.effect(a);a.cards.push(c.id);coop.choices.add(id);coopTryWave();return;
 }
 if(action==='ultimateChoice'){
   if(a.type!=='kris'||!a.coopUltimatePending)return;
   if(!['fight','defesa','itens','piedade'].includes(value))return;
   a.coopUltimatePending=false;a.ultimateBuff=value;a.ultimateBuffTime={fight:9,defesa:3,itens:11,piedade:9}[value];
   if(value==='piedade')a.hp=a.maxHp;
   ring(a.x,a.y,50,'#bd84ff');return;
 }
 if(phase!=='play'||a.hp<=0)return;
 if(action==='ultimate'&&a.type==='kris'){
   if(a.ultimateCharge>=100&&!a.coopUltimatePending){a.ultimateCharge=0;a.coopUltimatePending=true;coopSend({t:'signal',to:id,value:'ultimate'});}return;
 }
 const before=player,cam={...camera};coop.actorId=id;coop.executing=true;player=a;
 camera.x=clamp(a.x-W/2,0,WORLD_W-W);camera.y=clamp(a.y-H/2,0,WORLD_H-H);
 try{
   if(action==='attack')attack();
   if(action==='q')skill();
   if(action==='eDown')secondaryDown();
   if(action==='eUp')secondaryUp();
   if(action==='dash')dash();
   if(action==='ultimate')ultimate();
   if(action==='f')cardPower();
 }finally{player=before;coop.actorId=null;coop.executing=false;camera.x=cam.x;camera.y=cam.y;}
}
function coopAdvance(dt){
 for(const [id,a] of coop.allies){
   for(const k of ['dashCd','skillCd','secondaryCd','invuln','curseTime','atkTime','darkAuraTime','ultimateTime','ultimateBuffTime','transformTime','frogTime'])a[k]=Math.max(0,(a[k]||0)-dt);
   if(a.secondaryCharging)a.secondaryCharge=Math.min(1.6,a.secondaryCharge+dt);
   if(a.hp<=0)continue;
   const inp=a.input||{x:0,y:0,aim:-Math.PI/2,attack:false};
   if(performance.now()-(a.inputAt||0)>850){inp.x=0;inp.y=0;inp.attack=false;}
   const dir=norm(inp.x,inp.y);const active=Math.hypot(inp.x,inp.y)>.08;
   if(a.dashTime>0){a.dashTime=Math.max(0,a.dashTime-dt);a.x+=a.dashV.x*340*dt;a.y+=a.dashV.y*340*dt;}
   else if(active){a.x+=dir.x*a.speed*(a.type==='loid'&&a.ultimateTime>0?1.65:1)*(a.curseTime>0?.78:1)*dt;
     a.y+=dir.y*a.speed*(a.type==='loid'&&a.ultimateTime>0?1.65:1)*(a.curseTime>0?.78:1)*dt;a.step+=dt*11;
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
function coopTryWave(){
 if(!coop.active||!coop.host||phase!=='reward')return;
 if(coop.members.every(m=>coop.choices.has(m.id))){coop.chosen=false;coop.choices.clear();testBossMode=false;stage++;spawnStage();}
}
function coopSendInput(t){
 if(!coop.active||coop.host||phase==='over'||t-coop.lastInput<50||!player)return;
 coop.lastInput=t;
 let mx=mobileMove.x,my=mobileMove.y;
 if(keys.has('w')||keys.has('arrowup'))my-=1;if(keys.has('s')||keys.has('arrowdown'))my+=1;
 if(keys.has('a')||keys.has('arrowleft'))mx-=1;if(keys.has('d')||keys.has('arrowright'))mx+=1;
 const v=norm(mx,my);let aim=player.aim;
 if(mouseAim)aim=Math.atan2(mouseAim.y-player.y,mouseAim.x-player.x);
 else if(Math.hypot(mx,my)>.1)aim=Math.atan2(my,mx);
 coopSend({t:'input',x:Math.hypot(mx,my)>.05?v.x:0,y:Math.hypot(mx,my)>.05?v.y:0,aim,attack:keys.has('j')||pointerDown||attackMobile});
}
function coopSendState(){
 if(!coop.active||!coop.host||!player)return;
 const actors={};actors[coop.id]=player;for(const [id,a] of coop.allies)actors[id]=a;
 // Host controls all enemy simulation and boss AI; peers render synchronized snapshots.
 coopSend({t:'state',data:{actors,stage,phase,difficulty,essence,enemies,projectiles,hazards,healthDrops,rings,slashes,shadowClones,bonusBeam,waveIntro,eclipseTime,bossMessage,bossMessageTimer,elapsed}});
}
function coopApplyState(s){
 if(!s||!s.actors||!s.actors[coop.id])return;
 const target=s.actors[coop.id];
 if(!player||player.type!==target.type)player=createPlayer(target.type);
 const wasStage=stage,wasX=player.x,wasY=player.y;
 Object.assign(player,target);coop.targetLocal={x:target.x,y:target.y};
 if(wasStage===s.stage&&Math.hypot(wasX-target.x,wasY-target.y)<130){player.x=wasX;player.y=wasY;}
 const nextAllies=new Map(),nextTargets=new Map();
 for(const [id,hero] of Object.entries(s.actors)){
  if(id===coop.id)continue;const old=coop.allies.get(id);
  if(old&&wasStage===s.stage&&Math.hypot(old.x-hero.x,old.y-hero.y)<130){nextAllies.set(id,{...hero,x:old.x,y:old.y});}
  else nextAllies.set(id,hero);
  nextTargets.set(id,{x:hero.x,y:hero.y});
 }
 coop.allies=nextAllies;coop.targetAllies=nextTargets;
 stage=s.stage;difficulty=s.difficulty||'normal';essence=s.essence;
 enemies=s.enemies||[];projectiles=s.projectiles||[];hazards=s.hazards||[];
 healthDrops=s.healthDrops||[];rings=s.rings||[];slashes=s.slashes||[];shadowClones=s.shadowClones||[];
 bonusBeam=s.bonusBeam||null;waveIntro=s.waveIntro||0;eclipseTime=s.eclipseTime||0;
 bossMessage=s.bossMessage||'';bossMessageTimer=s.bossMessageTimer||0;
 if(!coop.selectingUltimate){
   if(s.phase==='reward'&&phase!=='reward'){phase='reward';coop.chosen=false;showRewards();}
   else if(s.phase==='play'&&phase!=='play'){phase='play';coop.chosen=false;$('rewardScreen').classList.add('hidden');$('supremeScreen').classList.add('hidden');}
   else if(s.phase==='over'&&phase!=='over'){phase='over';$('gameOverScreen').classList.remove('hidden');$('endTitle').textContent='FIM DA PARTIDA';$('endText').textContent='A equipe chegou à onda '+stage+'.';}
 }
 updateHud();
}
function coopLeave(){
 if(coop.socket){coopSend({t:'leave'});try{coop.socket.close();}catch{}}
 coop.active=false;coop.host=false;coop.id=null;coop.hostId=null;coop.room=null;coop.socket=null;
 coop.members=[];coop.allies.clear();coop.targetAllies.clear();coop.targetLocal=null;coop.choices.clear();coop.chosen=false;coop.actorId=null;coop.executing=false;coop.selectingUltimate=false;
 $('coopScreen').classList.add('hidden');$('coopConnect').hidden=false;$('coopLobby').hidden=true;
}
$('titleOnline').addEventListener('click',()=>{
 phase='coop';$('titleScreen').classList.add('hidden');$('coopScreen').classList.remove('hidden');$('coopConnect').hidden=false;$('coopLobby').hidden=true;coopNote('Crie uma sala ou entre com o código de um amigo.');
});
$('coopCreate').addEventListener('click',()=>coopConnect('create'));
$('coopJoin').addEventListener('click',()=>coopConnect('join',$('coopCode').value));
$('coopBack').addEventListener('click',()=>{coopLeave();phase='title';$('titleScreen').classList.remove('hidden');});
$('coopCopy').addEventListener('click',()=>{if(coop.room&&navigator.clipboard)navigator.clipboard.writeText(coop.room).then(()=>coopNote('Código copiado!')).catch(()=>coopNote('Código da sala: '+coop.room));});
for(const b of document.querySelectorAll('[data-coop-hero]'))b.addEventListener('click',()=>coopSend({t:'choose',hero:b.dataset.coopHero}));
$('coopBegin').addEventListener('click',()=>coopSend({t:'begin',boss:$('coopBoss').value,difficulty}));

requestAnimationFrame(frame);
