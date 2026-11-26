/* v5.0: independent animated cards, two per page, no change to hero selection rules. */
(function(){
 'use strict';
 const order=['kris','loid','cross','eve','kali','mollitiam','moretti','l0id','josue'];
 const labels={kris:'Kris — Santa Trindade',loid:'Loid — Sombramante',cross:'Xans — O Esqueleto',eve:'Eve Lorey — Portador do Vazio',kali:'Kali — A Rainha de Espadas',mollitiam:'Mollitiam — O Pecador Nórdico',moretti:'Moretti — O Autor da Realidade',l0id:'L0ID — Sombramante Supremo',josue:'Josué — Fúria Espartana'};
 const ids={chooseKris:'kris',chooseLoid:'loid',chooseCross:'cross',chooseEve:'eve',chooseKali:'kali',chooseMollitiam:'mollitiam',chooseMoretti:'moretti',chooseL0id:'l0id',chooseJosue:'josue'};
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const button=(text,label)=>{const b=document.createElement('button');b.type='button';b.className='hs50-arrow';b.textContent=text;b.setAttribute('aria-label',label);return b;};
 function install(grid){
  const tiles=[...grid.querySelectorAll('.new-hero-tile,.duel-hero-portrait')].map(b=>({b,id:b.dataset.coopHero||b.dataset.hero||ids[b.id]})).filter(t=>order.includes(t.id)).sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  if(!tiles.length)return;
  grid.classList.add('hs50');grid.setAttribute('aria-label','Seleção de heróis, dois por página');
  const prev=button('‹','Personagens anteriores'),next=button('›','Próximos personagens');prev.classList.add('hs50-prev');next.classList.add('hs50-next');
  const foot=document.createElement('div');foot.className='hs50-foot';const status=document.createElement('span');status.setAttribute('aria-live','polite');foot.append(status);
  const dots=document.createElement('span');dots.className='hs50-dots';foot.append(dots);
  let page=0,start=null,blockUntil=0;const total=Math.ceil(tiles.length/2);const dotButtons=[];
  for(const t of tiles){
   t.b.classList.add('hs50-card');t.b.dataset.cardHero=t.id;t.b.setAttribute('aria-label','Escolher '+labels[t.id]);
   const img=t.b.querySelector('img');t.img=img;img.removeAttribute('src');img.removeAttribute('loading');img.alt=labels[t.id];img.draggable=false;img.decoding='async';
   if(t.id==='l0id'){const badge=document.createElement('span');badge.className='hs50-secret';badge.textContent='L0ID · SECRETO';t.b.append(badge);}
   grid.append(t.b);
  }
  grid.append(prev,next,foot);
  function asset(t,visible){const src='assets/ui/select50/'+t.id+(reduced.matches?'-still':'')+'.webp';if(visible){if(t.img.getAttribute('src')!==src)t.img.setAttribute('src',src);}else t.img.removeAttribute('src');}
  function show(n){page=Math.max(0,Math.min(total-1,n));tiles.forEach((t,i)=>{const on=Math.floor(i/2)===page;t.b.hidden=!on;asset(t,on&&grid.getClientRects().length>0);});prev.disabled=page===0;next.disabled=page===total-1;status.textContent=`${page+1} / ${total} · Arraste ou use as setas`;dotButtons.forEach((b,i)=>{b.setAttribute('aria-current',i===page?'page':'false');});}
  for(let i=0;i<total;i++){const d=button('◆','Página '+(i+1));d.className='hs50-dot';d.addEventListener('click',()=>show(i));dots.append(d);dotButtons.push(d);}
  prev.addEventListener('click',()=>show(page-1));next.addEventListener('click',()=>show(page+1));
  grid.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();show(page+(e.key==='ArrowRight'?1:-1));(e.key==='ArrowRight'?next:prev).focus();}});
  grid.addEventListener('dragstart',e=>e.preventDefault());
  grid.addEventListener('pointerdown',e=>{if(e.isPrimary===false||e.button!==0||e.target.closest('.hs50-arrow,.hs50-foot'))return;start={id:e.pointerId,x:e.clientX,y:e.clientY,drag:false};});
  grid.addEventListener('pointermove',e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!start.drag&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3){start.drag=true;try{grid.setPointerCapture(e.pointerId);}catch{}}if(start.drag)e.preventDefault();});
  grid.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(start.drag||Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.3){blockUntil=performance.now()+350;if(Math.abs(dx)>35)show(page+(dx<0?1:-1));}start=null;});
  grid.addEventListener('pointercancel',()=>{start=null;});grid.addEventListener('lostpointercapture',()=>{start=null;});
  grid.addEventListener('click',e=>{if(performance.now()<blockUntil&&e.target.closest('.hs50-card')){e.preventDefault();e.stopImmediatePropagation();}},true);
  // Only decode the current pair while the selection is actually displayed.
  const observer=new IntersectionObserver(()=>{const visible=grid.getClientRects().length>0&&grid.checkVisibility?.()!==false;tiles.forEach(t=>asset(t,visible&&!t.b.hidden));});observer.observe(grid);
  const visibility=new MutationObserver(()=>{const visible=grid.getClientRects().length>0;tiles.forEach(t=>asset(t,visible&&!t.b.hidden));});for(let p=grid;p&&p!==document.body;p=p.parentElement)visibility.observe(p,{attributes:true,attributeFilter:['class','hidden','style']});
  reduced.addEventListener?.('change',()=>show(page));show(0);
 }
 document.querySelectorAll('.new-hero-selector,#heroOptions').forEach(install);
})();
