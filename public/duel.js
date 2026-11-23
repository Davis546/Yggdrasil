// YGGDRASIL PvP 1x1 — a separate mode; does not change co-op's game.js.
// The host is the authority for damage, cooldowns, positions and the outcome.
const $ = id => document.getElementById(id);
const W=960,H=576,MAP_W=1920,MAP_H=1400,HP=11200,ROUND_TIME=180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const nfmt=n=>Math.max(0,Math.round(n)).toLocaleString('pt-BR');
const heroes={loid:{name:'LOID',dmg:128,speed:175,attack:.37,range:97,crit:.09,skill:9,second:20,dash:2.4,color:'#cda4f2'},kris:{name:'KRIS',dmg:158,speed:157,attack:.43,range:109,crit:.08,skill:14,second:8.5,dash:2.8,color:'#6dbbff'},cross:{name:'XANS',dmg:137,speed:174,attack:.40,range:98,crit:.26,skill:6.5,second:9,dash:2.55,color:'#bb74ff'},eve:{name:'EVE LORY',dmg:175,speed:197,attack:.34,range:113,crit:.15,skill:21,second:18,dash:2.2,color:'#916aff'},kali:{name:'KALI',dmg:113,speed:162,attack:.44,range:157,crit:.08,skill:20,second:18,dash:2.6,color:'#dfaafa'}};
const cards={
  heart:['Coração da Raiz','+1.100 de vida máxima.'],blade:['Fio da Ruína','+12% de dano.'],fast:['Dança das Lâminas','+10% de rapidez de ataque.'],speed:['Passos Leves','+8% velocidade de movimento.'],armor:['Casca Ancestral','9% menos dano recebido.'],reach:['Alcance da Raiz','+10% alcance (máximo 25%).'],dodge:['Reflexos Antigos','Esquiva recarrega mais rápido.'],critical:['Olho do Predador','+8% chance de crítico.'],arc:['Corte Crescente','Aumenta o arco do ataque.'],echo:['Eco da Lâmina','12% chance de segundo golpe.'],ancient:['Herança de Yggdrasil','+6% vida, dano e velocidade.'],shadowblade:['Lâmina Sombria','Loid: +14% de dano.'],shadowdash:['Passo Sombrio','Loid: esquiva 18% mais rápida.'],darkburst:['Abismo Desperto','Loid: aura mais forte.'],black:['Fúria Negra','Kris: +25% dano transformado.'],form:['Forma Perfeita','Kris: +3s de transformação.'],awakening:['Despertar','Kris: Q recarrega mais rápido.'],bloodmoon:['Lua do Abismo','Kris: corte transformado causa mais dano.'],mirror:['Reflexo Duplo','Kali: +12% de dano de ilusão.'],mirrorguard:['Espelho Protetor','Kali: defesa ilusória dura mais.'],voidblade:['Espada Voraz','Eve: +12% dano da espada.'],timeward:['Tempo Dilatado','Eve: área de tempo mais duradoura.']
};
const $arena=$('arena'),g=$arena.getContext('2d',{alpha:false});const DUEL_SCALE=Math.min(2,Math.max(1.3,window.devicePixelRatio||1.5));$arena.width=Math.round(W*DUEL_SCALE);$arena.height=Math.round(H*DUEL_SCALE);g.imageSmoothingEnabled=false;let duelCamera={x:0,y:0};
const arena=new Image();arena.src='assets/japanese_arena.webp';
const sprites={};for(const h of Object.keys(heroes)){let im=new Image();im.src=`assets/heroes/${h}_sheet.png`;sprites[h]=im;}
const state={id:null,host:null,code:'',role:'fighter',members:[],offer:[],picks:[],selectedHero:'',started:false,finished:false,scene:'entry',ping:0,online:false};

// Duel soundtrack: the user-supplied OST plays only while an X1 match is active.
// Mobile browsers may require the user to tap ACTIVATE OST before they allow playback.
const duelMusic=document.getElementById('duelMusic');
const duelMusicButton=document.getElementById('duelMusicToggle');
const duelMusicVolume=document.getElementById('duelMusicVolume');
let duelMusicEnabled=false;
duelMusic.volume=.26;
function duelMusicUI(){duelMusicButton.textContent=duelMusicEnabled?'♫ OST LIGADA · DESLIGAR':'♫ ATIVAR OST DO X1';duelMusicButton.setAttribute('aria-pressed',String(duelMusicEnabled));}
function stopDuelMusic(){duelMusic.pause();duelMusic.currentTime=0;}
async function playDuelMusic(){
 if(!duelMusicEnabled || state.scene!=='battle'||state.finished)return;
 try{await duelMusic.play()}catch(e){duelMusicButton.textContent='▶ TOQUE PARA OUVIR A OST';}
}
duelMusicButton.addEventListener('click',()=>{
 duelMusicEnabled=!duelMusicEnabled;
 if(!duelMusicEnabled){stopDuelMusic();}else{playDuelMusic();}
 duelMusicUI();
});
duelMusicVolume.addEventListener('input',()=>{duelMusic.volume=Number(duelMusicVolume.value)/100;});
window.addEventListener('pagehide',()=>duelMusic.pause());

let ws, battle=null, view=null, rendered=new Map(), gameTime=0,last=performance.now(),lastSend=0,lastSnapshot=0, fps=60, frames=0,fpsTime=0;
const controls={x:0,y:0,aim:0,attack:false};const keySet=new Set();let touchX=0,touchY=0,dragging=false,stickId=null,stickStart={x:0,y:0};
const show=(id,yes)=>$(id).classList.toggle('hidden',!yes);
const note=text=>{$('notice').textContent=text;};
const send=m=>{if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(m));};
function connect(){let proto=location.protocol==='https:'?'wss':'ws';ws=new WebSocket(`${proto}://${location.host}/ws`);
 ws.onopen=()=>{state.online=true;note('Conectado ao Yggdrasil · Crie uma sala X1 ou entre por código.');};
 ws.onclose=()=>{state.online=false;note('Conexão encerrada. Recarregue a página para reconectar.');};
 ws.onerror=()=>note('Não foi possível conectar ao servidor. Confirme que o jogo está publicado no Cloudflare.');
 ws.onmessage=event=>{let m;try{m=JSON.parse(event.data)}catch{return}handleMessage(m);};
}
function handleMessage(m){
 if(m.t==='pong'){state.ping=Math.round(Math.max(0,Date.now()-m.ts));return;}
 if(m.t==='error'){note('⚠ '+m.message);return;}
 if(m.t==='closed'){stopDuelMusic();battle=null;view=null;state.started=false;state.finished=false;state.scene='entry';showScene('entry');note(m.message||'A sala foi fechada.');return;}
 if(m.t==='pvpWelcome'){
   Object.assign(state,{id:m.id,host:m.host,code:m.code,role:m.role,offer:m.offer||[],picks:[],members:m.members||[],started:m.started,finished:m.finished||false});
   $('codeLabel').textContent=state.code;showScene(m.started?'battle':'lobby');refreshLobby();note(m.role==='spectator'?'Modo espectador: você verá o mesmo duelo dos jogadores.':'Você entrou na sala X1. Escolha seu personagem e três cartas.');
   return;
 }
 if(m.t==='pvpLobby'){
   if(m.code!==state.code)return;state.members=m.members;state.started=m.started;state.finished=m.finished||false;
   if(state.scene==='lobby')refreshLobby();return;
 }
 if(m.t==='pvpDraft'){state.picks=m.picks||[];state.offer=m.offer||state.offer;renderDraft();refreshLobby();return;}
 if(m.t==='pvpBegin'){
   state.started=true;state.finished=false;
   if(!state.id)return;
   battle={host:state.id===m.host,fighters:m.fighters,players:[],particles:[],projectiles:[],fx:[],clock:0,remaining:ROUND_TIME,starting:3,resultSent:false};
   for(let i=0;i<m.fighters.length;i++)battle.players.push(makeActor(m.fighters[i],i));
   view=null;rendered.clear();showScene('battle');show('resultOverlay',false);
   show('spectatorMark',state.role==='spectator');show('touchControls',state.role==='fighter');
   $('roundCountdown').textContent='3';playDuelMusic();note(state.role==='spectator'?'Espectando o X1.':'Duelo iniciado!');return;
 }
 if(m.t==='pvpInput'&&battle?.host){const a=battle.players.find(x=>x.id===m.id);if(a)a.input={...m.data};return;}
 if(m.t==='pvpAction'&&battle?.host){const a=battle.players.find(x=>x.id===m.id);if(a)act(a,m.action,m.variant);return;}
 if(m.t==='pvpSnapshot'&&!battle?.host){view=m.data;
   if(!battle){battle={host:false,players:[],fighters:[],clock:0,remaining:ROUND_TIME,starting:0};showScene('battle');}
   if(view?.players){for(const p of view.players){const old=rendered.get(p.id);if(!old||Math.hypot(old.x-p.x,old.y-p.y)>130)rendered.set(p.id,{...p});}}
   return;
 }
 if(m.t==='pvpResult'){
   stopDuelMusic();state.finished=true;const winner=state.members.find(x=>x.id===m.winner);
   $('winnerTitle').textContent=winner?`VITÓRIA DE ${heroes[winner.hero]?.name||'LUTADOR'}!`:'EMPATE!';
   $('winnerNote').textContent=m.reason==='Oponente desconectado'?'O oponente saiu da partida.':'A luta terminou. Vocês podem jogar novamente na mesma sala.';
   show('resultOverlay',true);$('rematch').hidden=state.id!==state.host;
   $('backLobby').hidden=state.id!==state.host;
   return;
 }
 if(m.t==='pvpReset'){
   stopDuelMusic();state.started=false;state.finished=false;state.offer=m.offer||[];state.picks=[];
   battle=null;view=null;rendered.clear();showScene('lobby');renderDraft();refreshLobby();note('Nova disputa: escolham três cartas para a revanche!');return;
 }
}
function showScene(which){state.scene=which;show('entry',which==='entry');show('lobby',which==='lobby');show('battle',which==='battle');}
function refreshLobby(){
 const people=state.members||[];$('codeLabel').textContent=state.code;
 $('participants').replaceChildren(...people.map(p=>{
 const a=document.createElement('div');a.className='person';
 a.textContent=`${p.id===state.id?'VOCÊ · ':''}${p.role==='spectator'?'👁 ESPECTADOR':p.hero?heroes[p.hero]?.name:'ESCOLHENDO'} · ${p.role==='spectator'?'ASSISTINDO':p.ready?'PRONTO ✓':`${p.chosen}/3 CARTAS`}`;return a;
 }));
 const spectator=state.role==='spectator';show('selectArea',!spectator);
 $('roleHint').textContent=spectator?'Você está como espectador. Os dois jogadores escolhem suas cartas antes do início.':'Cada lutador escolhe 1 personagem e 3 cartas entre 6 sorteadas. Os personagens não podem se repetir.';
 const mine=people.find(p=>p.id===state.id);state.selectedHero=mine?.hero||'';
 for(const b of document.querySelectorAll('[data-hero]')){
   b.classList.toggle('chosen',b.dataset.hero===mine?.hero);
   b.disabled=spectator||people.some(p=>p.id!==state.id&&p.role==='fighter'&&p.hero===b.dataset.hero);
 }
 renderDraft();
 const fighters=people.filter(p=>p.role==='fighter');const ready=fighters.length===2&&fighters.every(p=>p.ready)&&fighters[0].hero!==fighters[1].hero;
 $('begin').hidden=state.host!==state.id;$('begin').disabled=!ready;
 $('waitText').textContent=ready?'Ambos prontos! O anfitrião pode começar.':`Lutadores prontos: ${fighters.filter(p=>p.ready).length} / 2 · Espectadores: ${people.filter(p=>p.role==='spectator').length}`;
}
function renderDraft(){let root=$('draftCards');root.replaceChildren();$('chosenCount').textContent=`(${state.picks.length}/3)`;
 for(const id of state.offer){const item=cards[id];if(!item)continue;
  const b=document.createElement('button');b.className='card'+(state.picks.includes(id)?' chosen':'');
  const im=document.createElement('img');im.src=`assets/cards/${id}.png`;im.alt='';const title=document.createElement('strong');title.textContent=item[0];const sub=document.createElement('small');sub.textContent=item[1];b.append(im,title,sub);
  b.disabled=state.picks.includes(id)||state.picks.length>=3||!state.selectedHero;
  b.onclick=()=>send({t:'pvpPick',card:id});root.append(b);
 }
}
function makeActor(p,i){const def=heroes[p.hero]||heroes.loid;
 const a={id:p.id,hero:p.hero,x:i?1160:760,y:710,face:i?'left':'right',step:0,hp:HP,maxHp:HP,damage:def.dmg,speed:def.speed,attackDelay:def.attack,reach:def.range,crit:def.crit,armor:0,echo:0,dashDelay:def.dash,skillDelay:def.skill,eDelay:def.second,extraArc:0,shape:0,aim:i?Math.PI:0,attackCd:0,dashCd:0,qCd:0,eCd:0,invuln:0,dashTime:0,dx:0,dy:0,charge:0,ultCharge:0,ultTimer:0,ultMode:'',aura:0,auraTick:0,shadows:0,shadowsTick:0,corruption:0,slow:0,burn:0,attackFx:0,hitFx:0,blink:0,teleports:[],skullFx:0,transform:0,transAmp:1.5,transDuration:6,defend:0,ultBuff:0,burst:0,stun:0,energy:0,energyCd:0,input:{x:0,y:0,aim:i?Math.PI:0,attack:false},moving:false,orbit:0,mirrorGuard:0,temporalField:0,temporalRadius:0,portalEcho:0,voidUlt:0,mirrorImages:0,dodgeChance:p.hero==='cross'?.12:p.hero==='eve'?.15:0};
 for(const id of p.cards||[]){switch(id){case 'heart':a.maxHp+=1100;a.hp+=1100;break;case 'blade':a.damage*=1.12;break;case 'fast':a.attackDelay*=.9;break;case 'speed':a.speed*=1.08;break;case 'armor':a.armor=1-(1-a.armor)*.91;break;case 'reach':a.reach=Math.min(a.reach*1.1,def.range*1.25);break;case 'dodge':a.dashDelay*=.88;break;case 'critical':a.crit=Math.min(.45,a.crit+.08);break;case 'arc':a.extraArc+=.15;break;case 'echo':a.echo+=.12;break;case 'ancient':a.maxHp=Math.ceil(a.maxHp*1.06);a.hp=a.maxHp;a.damage*=1.06;a.speed*=1.06;break;case 'shadowblade':a.damage*=1.14;break;case 'shadowdash':a.dashDelay*=.82;break;case 'darkburst':a.shape+=.18;break;case 'black':a.transAmp+=.25;break;case 'form':a.transDuration+=3;break;case 'awakening':a.skillDelay*=.85;break;case 'bloodmoon':a.burst+=.25;break;case 'mirror':a.damage*=1.12;break;case 'mirrorguard':a.shape+=.18;break;case 'voidblade':a.damage*=1.12;break;case 'timeward':a.temporalRadius+=22;break;}}
 return a;
}
function enemyOf(a){return battle?.players.find(x=>x.id!==a.id);}
function drawFx(x,y,type,t=0.4,r=25,color='#cf92fc',ex=0,ey=0){if(!battle?.fx)return;battle.fx.push({x,y,type,t,max:t,r,color,ex,ey});if(battle.fx.length>26)battle.fx.shift();}
function hit(a,b,amount,from='hit'){
 if(!b||b.hp<=0||a.hp<=0||b.invuln>0||b.defend>0)return 0; if(b.mirrorGuard>0&&Math.random()<.5){drawFx(b.x,b.y,'ring',.26,25,'#ddbbff');return 0;}if(b.dodgeChance>0&&Math.random()<b.dodgeChance){drawFx(b.x,b.y,'ring',.28,21,'#a2bcff');return 0;}
 let dealt=amount*(1-b.armor);
 const crit=Math.random()<Math.min(.75,a.crit+(a.ultMode==='xans'&&a.ultTimer>0?.27:0));if(crit&&from==='hit')dealt*=1.7;
 if(a.ultMode==='xans'&&a.ultTimer>0)dealt*=1.35;
 if(a.ultMode==='fight'&&a.ultTimer>0&&from==='hit')dealt*=2;
 if(a.transform>0&&from==='hit')dealt*=a.transAmp;
 if(b.corruption>0)dealt*=1.16;
 dealt=Math.round(dealt);
 b.hp=Math.max(0,b.hp-dealt);b.hitFx=.18;
 a.ultCharge=Math.min(100,a.ultCharge+clamp(Math.round(dealt/24),1,16));
 drawFx(b.x,b.y-38,'text',.55,0,crit?'#ffdf81':'#ffe2f4',dealt,0);
 if(a.hero==='cross'&&b.hp<=b.maxHp*.5&&b.hp>0){b.corruption=Math.max(b.corruption,4);b.slow=Math.max(b.slow,1.3);}
 if(b.hp<=0)finish(a.id);
 return dealt;
}
function finish(id){if(!battle||battle.resultSent)return;battle.resultSent=true;state.finished=true;send({t:'pvpResult',winner:id});}
function basic(a){if(a.hp<=0||a.attackCd>0||battle?.starting>0||battle?.resultSent)return;
 const b=enemyOf(a),angle=a.input.aim;a.aim=angle;a.attackCd=a.attackDelay;
 a.attackFx=.15;a.attackAngle=angle;
 if(a.hero==='kali'){battle.projectiles.push({x:a.x,y:a.y-10,vx:Math.cos(angle)*410,vy:Math.sin(angle)*410,damage:a.damage,color:'#e4bfff',from:a.id,life:1.1,kind:3});drawFx(a.x,a.y-12,'ring',.25,14,'#e4bfff');return;}drawFx(a.x+Math.cos(angle)*45,a.y+Math.sin(angle)*45,'slash',.2,a.reach,heroes[a.hero].color,angle,0);
 if(!b||b.hp<=0)return;
 const reach=a.reach;let theta=Math.atan2(b.y-a.y,b.x-a.x),diff=Math.atan2(Math.sin(theta-angle),Math.cos(theta-angle));
 if(dist(a,b)<reach+21&&Math.abs(diff)<.8+a.extraArc){hit(a,b,a.damage,'hit');if(a.echo>0&&Math.random()<a.echo)hit(a,b,a.damage*.5,'hit');if(a.ultMode==='itens'&&a.ultTimer>0)hit(a,b,a.damage*.6,'hit');}
}
function act(a,action,variant){if(!battle?.host||!a||a.hp<=0||battle.starting>0||battle.resultSent)return;
 const b=enemyOf(a);if(action==='dash'){
  if(a.dashCd>0)return;const ang=Math.atan2(a.input.y,a.input.x)||a.aim;
  a.dx=Math.cos(ang);a.dy=Math.sin(ang);a.dashTime=.22;a.dashCd=a.hero==='loid'&&a.ultMode==='loid'&&a.ultTimer>0?.07:a.dashDelay;
  a.invuln=.32;if(a.hero==='eve'){a.dashTime=.32;drawFx(a.x,a.y,'ring',.50,36,'#996dff');}else drawFx(a.x,a.y,'ring',.35,25,heroes[a.hero].color);return;
 }
 if(action==='q'){
  if(a.qCd>0)return;a.qCd=a.skillDelay;
  if(a.hero==='loid'){a.aura=4.1;a.auraTick=0;drawFx(a.x,a.y,'ring',.65,112,'#33204d');}
  else if(a.hero==='kris'){a.transform=a.transDuration;drawFx(a.x,a.y,'ring',.6,70,'#6967fa');}
  else if(a.hero==='eve'&&b&&b.hp>0){drawFx(b.x,b.y,'ring',.5,42,'#4a1a88');hit(a,b,Math.min(540,b.maxHp*.055),'skill');}
  else if(a.hero==='kali'){a.mirrorGuard=4+a.shape;drawFx(a.x,a.y,'ring',1,145,'#e0b6fa');}
  else if(a.hero==='cross'&&b&&b.hp>0){
   const ox=a.x,oy=a.y;a.x=b.x-42*Math.cos(a.aim);a.y=b.y-42*Math.sin(a.aim);
   drawFx(ox,oy,'ring',.5,30,'#ac7fff');drawFx(a.x,a.y,'ring',.5,38,'#bb8dff');
   hit(a,b,a.damage*3.1,'skill');a.x=ox;a.y=oy;a.blink=.4;
   drawFx(ox,oy,'ring',.4,26,'#aa6afa');
  }return;
 }
 if(action==='eDown'&&a.hero==='kris'){if(a.eCd<=0)a.energy=.03;return;}
 if(action==='eUp'&&a.hero==='kris'){
  if(a.eCd>0||a.energy<=0)return;
  const damage=430+clamp(a.energy/1.4,0,1)*500; a.eCd=a.eDelay;
  drawFx(a.x,a.y,'beam',.48,310,'#b4ccff',a.aim,0);
  if(b&&dist(a,b)<330&&Math.abs(Math.atan2(Math.sin(Math.atan2(b.y-a.y,b.x-a.x)-a.aim),Math.cos(Math.atan2(b.y-a.y,b.x-a.x)-a.aim)))<.5)hit(a,b,damage,'skill');
  a.energy=0;return;
 }
 if(action==='e'){
  if(a.eCd>0)return;a.eCd=a.eDelay;
  if(a.hero==='loid'){a.shadows=8;a.shadowsTick=.1;drawFx(a.x,a.y,'ring',.7,75,'#532b82');}
  else if(a.hero==='eve'){a.temporalField=5+a.temporalRadius/22;a.temporalRadius=Math.max(0,a.temporalRadius);drawFx(a.x,a.y,'ring',.8,170+a.temporalRadius,'#84abff');}
  else if(a.hero==='kali'){a.mirrorImages=6;drawFx(a.x,a.y,'ring',.8,170,'#d7b6ff');}
  else if(a.hero==='cross'){
   for(let i=0;i<9;i++){const angle=a.aim+(i-4)*.083;const c=['#eae9ff','#77aafe','#ffb36d'][i%3];
    battle.projectiles.push({x:a.x+Math.cos(angle)*20,y:a.y+Math.sin(angle)*20,vx:Math.cos(angle)*405,vy:Math.sin(angle)*405,r:6,damage:89,color:c,from:a.id,life:1.5,kind:i%3});}
  }return;
 }
 if(action==='r'){
  if(a.ultCharge<100||a.ultTimer>0)return;
  if(a.hero==='kris'&&!['fight','defesa','itens','piedade'].includes(variant))return;
  a.ultCharge=0;a.ultMode=a.hero==='kris'?variant:a.hero;a.ultTimer=a.hero==='loid'?5:a.hero==='eve'?2.5:a.hero==='kali'?6:8;
  if(a.hero==='loid'){a.dashCd=0;drawFx(a.x,a.y,'ring',1,230,'#110b23');}
  if(a.hero==='eve'){a.voidUlt=2.5;drawFx(a.x,a.y,'ring',2,300,'#210e33');if(b&&b.hp>0)hit(a,b,Math.min(1950,b.maxHp*.17),'skill');}
  if(a.hero==='kali'){a.mirrorGuard=6;a.mirrorImages=6;drawFx(a.x,a.y,'ring',2,275,'#dcabff');}
  if(a.hero==='kris'){if(variant==='defesa')a.defend=3;if(variant==='piedade'){a.hp=a.maxHp;a.speed*=1.17;}}
  if(a.hero==='cross'&&b&&b.hp>0){
    for(let i=0;i<5;i++){let theta=i*Math.PI*2/5,px=a.x+Math.cos(theta)*53,py=a.y+Math.sin(theta)*53;
      drawFx(px,py,'skull',.9,24,'#dfd7ff',b.x,b.y);hit(a,b,205,'skill');}
  }return;
 }
}
function sim(dt){if(!battle?.host||battle.resultSent)return;
 battle.clock+=dt; if(battle.starting>0){battle.starting=Math.max(0,battle.starting-dt);return;}
 battle.remaining=Math.max(0,battle.remaining-dt);
 for(const a of battle.players){
  const dec=['attackCd','dashCd','qCd','eCd','invuln','aura','shadows','corruption','slow','burn','attackFx','hitFx','blink','transform','defend','ultTimer','stun','mirrorGuard','temporalField','voidUlt','mirrorImages'];for(const k of dec)a[k]=Math.max(0,a[k]-dt);
  if(a.hp<=0)continue;
  a.aim=Number.isFinite(a.input.aim)?a.input.aim:a.aim;
  const mx=clamp(a.input.x,-1,1),my=clamp(a.input.y,-1,1),len=Math.hypot(mx,my),foe=enemyOf(a),timeSlow=foe?.temporalField>0?.5:1,v=a.speed*(a.slow>0?.75:1)*timeSlow;
  a.moving=len>.08;
  if(a.dashTime>0){a.dashTime=Math.max(0,a.dashTime-dt);a.x+=a.dx*(a.hero==='eve'?790:580)*dt;a.y+=a.dy*(a.hero==='eve'?790:580)*dt;
   if(a.hero==='loid')drawFx(a.x,a.y,'shadow',.24,20,'#44205b');
  }else if(len>.08){a.x+=mx/Math.max(len,1)*v*dt;a.y+=my/Math.max(len,1)*v*dt;}
  a.x=clamp(a.x,55,MAP_W-55);a.y=clamp(a.y,75,MAP_H-55);
  if(len>.08){a.step=(a.step+dt*8)%3; a.face=Math.abs(mx)>Math.abs(my)?mx>0?'right':'left':my>0?'down':'up';}
  if(a.input.attack)basic(a);
  if(a.hero==='kris'&&a.energy>0)a.energy=Math.min(1.4,a.energy+dt);
  const b=enemyOf(a);
  if(b&&b.hp>0){
   if(a.aura>0&&dist(a,b)<120){a.auraTick-=dt;if(a.auraTick<=0){a.auraTick=.35;hit(a,b,94*(1+a.shape),'skill');}}
   if(a.hero==='kali'&&a.mirrorImages>0&&dist(a,b)<220){a.shadowsTick-=dt;if(a.shadowsTick<=0){a.shadowsTick=.85;hit(a,b,62,'skill');}}
   if(a.shadows>0){a.shadowsTick-=dt;if(a.shadowsTick<=0&&dist(a,b)<270){a.shadowsTick=.65;hit(a,b,4*43,'skill');}}
   if(a.ultTimer>0&&a.ultMode==='loid'&&dist(a,b)<230){a.auraTick-=dt;if(a.auraTick<=0){a.auraTick=.32;hit(a,b,160,'skill');}}
   if(a.burn>0&&a.burn%0.7<dt)hit(b,a,70,'burn');
  }
 }
 for(const p of battle.projectiles){let speedMult=1;for(const a of battle.players)if(a.temporalField>0&&a.id!==p.from&&Math.hypot(p.x-a.x,p.y-a.y)<180+a.temporalRadius)speedMult=.38;p.x+=p.vx*dt*speedMult;p.y+=p.vy*dt*speedMult;p.life-=dt;let attacker=battle.players.find(a=>a.id===p.from);let defender=attacker&&enemyOf(attacker);
  if(attacker&&defender&&defender.hp>0&&Math.hypot(defender.x-p.x,defender.y-p.y)<26){hit(attacker,defender,p.damage,'skill');if(p.kind===1)defender.slow=Math.max(defender.slow,1.3);if(p.kind===2)defender.burn=Math.max(defender.burn,1.7);p.life=0;}
 }
 battle.projectiles=battle.projectiles.filter(p=>p.life>0&&p.x>0&&p.x<MAP_W&&p.y>0&&p.y<MAP_H);
 battle.fx=battle.fx.filter(f=>(f.t-=dt)>0);
 if(battle.remaining<=0){let a=battle.players[0],b=battle.players[1];finish(a.hp/a.maxHp>b.hp/b.maxHp?a.id:b.hp/b.maxHp>a.hp/a.maxHp?b.id:null);}
}
function snapshot(){if(!battle?.host)return null;
 return {time:battle.remaining,starting:battle.starting,players:battle.players.map(a=>({id:a.id,hero:a.hero,x:+a.x.toFixed(2),y:+a.y.toFixed(2),face:a.face,step:+a.step.toFixed(2),aim:+a.aim.toFixed(3),hp:Math.ceil(a.hp),maxHp:Math.ceil(a.maxHp),ult:Math.round(a.ultCharge),qCd:+a.qCd.toFixed(1),eCd:+a.eCd.toFixed(1),dashCd:+a.dashCd.toFixed(1),aura:+a.aura.toFixed(2),shadows:+a.shadows.toFixed(2),transform:+a.transform.toFixed(2),defend:+a.defend.toFixed(2),ultTimer:+a.ultTimer.toFixed(2),ultMode:a.ultMode,mirrorGuard:+a.mirrorGuard.toFixed(2),temporalField:+a.temporalField.toFixed(2),voidUlt:+a.voidUlt.toFixed(2),mirrorImages:+a.mirrorImages.toFixed(2),atkFx:+a.attackFx.toFixed(2),atkAngle:a.attackAngle||a.aim,hitFx:+a.hitFx.toFixed(2),blink:+a.blink.toFixed(2),corruption:+a.corruption.toFixed(2)})),
  projectiles:battle.projectiles.map(p=>({x:Math.round(p.x),y:Math.round(p.y),color:p.color})),fx:battle.fx.map(f=>({...f,t:+f.t.toFixed(2)}))};
}
function drawSprite(p){const img=sprites[p.hero];const row={down:0,left:1,right:2,up:3}[p.face]||0;let frame=Math.floor((p.step||0))%3;
 g.save();if(p.defend>0){g.shadowColor='#a9c4ff';g.shadowBlur=15;}if(p.blink>0)g.globalAlpha=.65;
 if(img?.complete&&img.naturalWidth){g.drawImage(img,frame*112,row*112,112,112,p.x-29,p.y-41,58,58);}
 else{g.fillStyle=heroes[p.hero].color;g.beginPath();g.arc(p.x,p.y-13,20,0,Math.PI*2);g.fill();}g.restore();
 g.save();g.fillStyle='#0e0914';g.fillRect(p.x-23,p.y-46,46,5);g.fillStyle=p.hp>0?'#db6683':'#777';g.fillRect(p.x-22,p.y-45,44*clamp(p.hp/p.maxHp,0,1),4);g.font='bold 11px system-ui';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#160b25';g.strokeText(heroes[p.hero]?.name||'JOGADOR',p.x,p.y-52);g.fillStyle='#fff0d8';g.fillText(heroes[p.hero]?.name||'JOGADOR',p.x,p.y-52);g.restore();
 if(p.temporalField>0){g.save();g.fillStyle='#4b6bbb28';g.strokeStyle='#98baff';g.beginPath();g.arc(p.x,p.y,180,0,Math.PI*2);g.fill();g.stroke();g.restore();}if(p.mirrorGuard>0){g.save();g.strokeStyle='#e7b7ff';g.beginPath();g.arc(p.x,p.y,65,0,Math.PI*2);g.stroke();g.restore();}if(p.voidUlt>0){g.save();g.fillStyle='#08000bb8';g.fillRect(0,0,W,H);g.restore();}
 if(p.aura>0||p.ultMode==='loid'&&p.ultTimer>0){g.save();g.strokeStyle=p.ultMode==='loid'&&p.ultTimer>0?'#7e48b2':'#5d2789';g.lineWidth=4;g.globalAlpha=.5;g.beginPath();g.arc(p.x,p.y,p.ultTimer>0&&p.ultMode==='loid'?215:110,0,Math.PI*2);g.stroke();g.restore();}
 if(p.shadows>0){for(let i=0;i<4;i++){let an=i*Math.PI/2+gameTime*1.3;g.fillStyle='#482a6eb0';g.beginPath();g.ellipse(p.x+Math.cos(an)*50,p.y+Math.sin(an)*37,14,18,0,0,Math.PI*2);g.fill();}}
 if(p.atkFx>0){g.save();g.strokeStyle=heroes[p.hero].color;g.lineWidth=5;g.beginPath();g.arc(p.x,p.y,55,p.atkAngle-.75,p.atkAngle+.75);g.stroke();g.restore();}
 if(p.hitFx>0){g.save();g.globalAlpha=.45;g.fillStyle='#ffe4f2';g.beginPath();g.arc(p.x,p.y-15,25,0,Math.PI*2);g.fill();g.restore();}
}
function paint(s,dt){
 g.save();g.setTransform(DUEL_SCALE,0,0,DUEL_SCALE,0,0);g.clearRect(0,0,W,H);g.fillStyle='#211a29';g.fillRect(0,0,W,H);
 const fighters=s?.players||[];
 const focus=fighters.find(p=>p.id===state.id)||(fighters.length?{x:fighters.reduce((n,p)=>n+p.x,0)/fighters.length,y:fighters.reduce((n,p)=>n+p.y,0)/fighters.length}: {x:MAP_W/2,y:MAP_H/2});
 const targetX=clamp(focus.x-W/2,0,MAP_W-W),targetY=clamp(focus.y-H/2,0,MAP_H-H);
 const smooth=Math.min(1,dt*9);duelCamera.x+=(targetX-duelCamera.x)*smooth;duelCamera.y+=(targetY-duelCamera.y)*smooth;
 g.save();g.translate(-Math.round(duelCamera.x),-Math.round(duelCamera.y));
 // Large Japanese arena, tiled at native detail rather than stretching one blurry image.
 if(arena.complete&&arena.naturalWidth){g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';for(let xx=0;xx<MAP_W;xx+=960)for(let yy=0;yy<MAP_H;yy+=700)g.drawImage(arena,xx,yy,960,700);g.imageSmoothingEnabled=false;}
 g.strokeStyle='#e2b88d60';g.lineWidth=5;g.strokeRect(12,12,MAP_W-24,MAP_H-24);
 for(const fx of s?.fx||[]){const alpha=clamp(fx.t/(fx.max||.5),0,1);g.save();g.globalAlpha=alpha;
  if(fx.type==='ring'||fx.type==='shadow'){g.strokeStyle=fx.color;g.lineWidth=fx.type==='shadow'?11:4;g.beginPath();g.arc(fx.x,fx.y,fx.r*(1.35-alpha*.35),0,Math.PI*2);g.stroke();}
  if(fx.type==='slash'){g.strokeStyle=fx.color;g.lineWidth=5;g.beginPath();g.arc(fx.x,fx.y,fx.r/1.6,fx.ex-.85,fx.ex+.85);g.stroke();}
  if(fx.type==='beam'){g.strokeStyle=fx.color;g.lineWidth=18;g.beginPath();g.moveTo(fx.x,fx.y);g.lineTo(fx.x+Math.cos(fx.ex)*fx.r,fx.y+Math.sin(fx.ex)*fx.r);g.stroke();}
  if(fx.type==='skull'){g.fillStyle='#ece0ff';g.font='bold 28px system-ui';g.fillText('☠',fx.x-14,fx.y+7);g.strokeStyle='#d9c5ff';g.lineWidth=9;g.beginPath();g.moveTo(fx.x,fx.y);g.lineTo(fx.ex,fx.ey);g.stroke();}
  if(fx.type==='text'){g.textAlign='center';g.font='bold 18px system-ui';g.fillStyle=fx.color;g.strokeStyle='#170b22';g.lineWidth=3;g.strokeText('-'+nfmt(fx.ex),fx.x,fx.y-20*(1-alpha));g.fillText('-'+nfmt(fx.ex),fx.x,fx.y-20*(1-alpha));}
  g.restore();}
 for(const p of s?.projectiles||[]){g.fillStyle=p.color;g.beginPath();g.arc(p.x,p.y,7,0,Math.PI*2);g.fill();}
 for(const p of s?.players||[])drawSprite(p);
 g.restore();g.fillStyle='#120f23bb';g.fillRect(0,0,W,64);g.fillRect(0,H-25,W,25);
 if(s?.starting>0){g.fillStyle='#0e0a1baa';g.fillRect(0,0,W,H);g.textAlign='center';g.font='bold 74px Georgia';g.fillStyle='#ffe4b6';g.fillText(Math.ceil(s.starting),W/2,H/2);}
 g.restore();
}
function renderHud(s){if(!s||!s.players?.length)return;
 for(let i=0;i<2;i++){const p=s.players[i];if(!p)continue;$(i?'rightName':'leftName').textContent=heroes[p.hero]?.name||'LUTADOR';$(i?'rightHp':'leftHp').style.width=(clamp(p.hp/p.maxHp,0,1)*100)+'%';$(i?'rightNum':'leftNum').textContent=`${nfmt(p.hp)} / ${nfmt(p.maxHp)} · ULT ${p.ult|0}%`;}
 let remain=Math.max(0,s.time||0),secs=Math.ceil(remain);$('timer').textContent=`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
 $('netInfo').textContent=`${fps} FPS · ${state.ping}ms`;
 $('roundCountdown').textContent=s.starting>0?String(Math.ceil(s.starting)):'';
}
function renderGuests(dt){if(!view)return null;
 const out={...view,players:view.players.map(p=>{let smooth=rendered.get(p.id);if(!smooth){smooth={...p};rendered.set(p.id,smooth);}const distance=Math.hypot(smooth.x-p.x,smooth.y-p.y);const a=distance>115?1:Math.min(1,dt*15);
 smooth.x+=(p.x-smooth.x)*a;smooth.y+=(p.y-smooth.y)*a;Object.assign(smooth,Object.fromEntries(Object.entries(p).filter(([k])=>!['x','y'].includes(k))));
 if(p.id===state.id&&state.role==='fighter'&&distance<65){smooth.x+=controls.x*heroes[p.hero].speed*dt*.15;smooth.y+=controls.y*heroes[p.hero].speed*dt*.15;}return smooth;} )};return out;
}
function getControls(){let x=0,y=0;if(keySet.has('w')||keySet.has('arrowup'))y--;if(keySet.has('s')||keySet.has('arrowdown'))y++;if(keySet.has('a')||keySet.has('arrowleft'))x--;if(keySet.has('d')||keySet.has('arrowright'))x++;
 controls.x=clamp(x+touchX,-1,1);controls.y=clamp(y+touchY,-1,1);
 if(keySet.has('j')||keySet.has('mouse'))controls.attack=true;
 else if(!('ontouchstart' in window))controls.attack=false;
 if((navigator.maxTouchPoints>0||'ontouchstart' in window)&&controls.attack){
  const pp=battle?.host?battle.players:view?.players;const me=pp?.find(p=>p.id===state.id),other=pp?.find(p=>p.id!==state.id);
  if(me&&other)controls.aim=Math.atan2(other.y-me.y,other.x-me.x);
 } }
function tick(ms){let dt=clamp((ms-last)/1000,0,.045);last=ms;gameTime+=dt;fpsTime+=dt;frames++;if(fpsTime>=1){fps=Math.round(frames/fpsTime);frames=0;fpsTime=0;}
 if(battle){getControls();if(state.role==='fighter'){
   if(battle.host){const a=battle.players.find(p=>p.id===state.id);if(a)a.input={...controls};}
   else if(performance.now()-lastSend>33){send({t:'pvpInput',...controls});lastSend=performance.now();}
  }
  if(battle.host&&!state.finished){sim(dt);if(ms-lastSnapshot>50){const ss=snapshot();view=ss;if(ws?.bufferedAmount<30000)send({t:'pvpSnapshot',data:ss});lastSnapshot=ms;}}
  const s=battle.host?snapshot():renderGuests(dt);
  if(state.scene==='battle'){paint(s,dt);renderHud(s);}
 }requestAnimationFrame(tick);
}
function action(name,variant){if(state.role!=='fighter'||!state.started||state.finished||!battle)return;
 if(name==='r'){
  const p=(battle.host?battle.players:view?.players)?.find(a=>a.id===state.id);
  if(p?.hero==='kris'&&(p.ultCharge??p.ult??0)>=100){show('krisChoices',true);return;}
 }
 executeAction(name,variant);
}
function executeAction(name,variant){if(battle?.host){const a=battle.players.find(x=>x.id===state.id);if(a)act(a,name,variant)}else{send({t:'pvpAction',action:name,variant:variant||''});}}
function keyAction(e,down){const k=e.key.toLowerCase();if([' ','arrowdown','arrowup','arrowleft','arrowright'].includes(k))e.preventDefault();if(down&&!keySet.has(k)){
 if(k===' '){action('dash');}if(k==='q'||k==='r')action(k);if(k==='e'){const own=(battle?.host?battle.players:view?.players)?.find(a=>a.id===state.id);if(own?.hero==='kris')executeAction('eDown');else action('e');}}
 if(!down&&k==='e'){const own=(battle?.host?battle.players:view?.players)?.find(a=>a.id===state.id);if(own?.hero==='kris')executeAction('eUp');}
 if(down)keySet.add(k);else keySet.delete(k);
}
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;if([' ','q','e','r','j','w','a','s','d'].includes(e.key.toLowerCase()))e.preventDefault();keyAction(e,true);});window.addEventListener('keyup',e=>keyAction(e,false));
$arena.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){const rect=$arena.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width*W+duelCamera.x,y=(e.clientY-rect.top)/rect.height*H+duelCamera.y;const me=(battle?.host?battle.players:view?.players)?.find(a=>a.id===state.id);if(me)controls.aim=Math.atan2(y-me.y,x-me.x);}});
$arena.addEventListener('pointerdown',e=>{if(state.role!=='fighter'||e.pointerType==='touch')return;keySet.add('mouse');});window.addEventListener('pointerup',()=>keySet.delete('mouse'));
const stick=$('moveStick');
function moveStick(e){let rect=stick.getBoundingClientRect(),x=e.clientX-(rect.left+rect.width/2),y=e.clientY-(rect.top+rect.height/2),r=rect.width*.32,l=Math.hypot(x,y)||1;touchX=clamp(x/r,-1,1);touchY=clamp(y/r,-1,1);if(l>r){touchX=x/l;touchY=y/l;}let px=touchX*r,py=touchY*r;$('moveKnob').style.transform=`translate(calc(-50% + ${px}px),calc(-50% + ${py}px))`;}
stick.addEventListener('pointerdown',e=>{stick.setPointerCapture(e.pointerId);stickId=e.pointerId;moveStick(e);});stick.addEventListener('pointermove',e=>{if(e.pointerId===stickId)moveStick(e);});function endStick(e){if(e.pointerId!==stickId)return;stickId=null;touchX=touchY=0;$('moveKnob').style.transform='translate(-50%,-50%)';}stick.addEventListener('pointerup',endStick);stick.addEventListener('pointercancel',endStick);
for(const b of document.querySelectorAll('[data-act]')){
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);const a=b.dataset.act;
 if(a==='attack'){controls.attack=true;const me=(battle?.host?battle.players:view?.players)?.find(x=>x.id===state.id),en=(battle?.host?battle.players:view?.players)?.find(x=>x.id!==state.id);
 if(me&&en)controls.aim=Math.atan2(en.y-me.y,en.x-me.x);
 }else if(a==='e'){const own=(battle?.host?battle.players:view?.players)?.find(x=>x.id===state.id);if(own?.hero==='kris')executeAction('eDown');else action('e');}
 else action(a);
 });b.addEventListener('pointerup',e=>{if(b.dataset.act==='attack')controls.attack=false;if(b.dataset.act==='e'){const own=(battle?.host?battle.players:view?.players)?.find(x=>x.id===state.id);if(own?.hero==='kris')executeAction('eUp');}});b.addEventListener('pointercancel',()=>{if(b.dataset.act==='attack')controls.attack=false;});
}
$('create').onclick=()=>send({t:'pvpCreate'});$('joinFighter').onclick=()=>send({t:'pvpJoin',code:$('roomCode').value,role:'fighter'});$('joinSpectator').onclick=()=>send({t:'pvpJoin',code:$('roomCode').value,role:'spectator'});
for(const b of document.querySelectorAll('[data-hero]'))b.onclick=()=>send({t:'pvpChoose',hero:b.dataset.hero});
$('begin').onclick=()=>send({t:'pvpBegin'});$('leave').onclick=()=>{stopDuelMusic();send({t:'pvpLeave'});state.scene='entry';state.code='';showScene('entry');note('Você saiu da sala.');};
$('copyCode').onclick=async()=>{try{await navigator.clipboard.writeText(state.code);note('Código da sala copiado.')}catch{note('Código: '+state.code)}};
$('rematch').onclick=()=>send({t:'pvpRematch'});$('backLobby').onclick=()=>send({t:'pvpRematch'});
// Kris's ultimate has four original choices; do not replace them with a fixed buff.
const modal=document.createElement('div');modal.id='krisChoices';modal.className='game-over hidden';modal.innerHTML='<div class="panel"><div class="tag">◆ SUPREMO DE KRIS ◆</div><h2>Escolha um poder</h2><div class="flex" style="justify-content:center"><button data-ult="fight">⚔ FIGHT<br><small>+100% dano básico</small></button><button data-ult="defesa">🛡 DEFESA<br><small>3s de imunidade</small></button><button data-ult="itens">⚔⚔ ITENS<br><small>duas espadas</small></button><button data-ult="piedade">💚 PIEDADE<br><small>cura total + rapidez</small></button></div><button id="cancelUlt">CANCELAR</button></div>';
document.querySelector('.arena-shell').append(modal);
for(const b of modal.querySelectorAll('[data-ult]'))b.onclick=()=>{show('krisChoices',false);executeAction('r',b.dataset.ult)};
modal.querySelector('#cancelUlt').onclick=()=>show('krisChoices',false);
setInterval(()=>{if(state.online)send({t:'ping',ts:Date.now()});},4000);
connect();requestAnimationFrame(tick);
