// First story quest. No changes to survival combat.
export const WAVES=[{name:'Batedores Oni',count:5,hp:55},{name:'Segunda investida',count:7,hp:75},{name:'A horda',count:9,hp:90},{name:'Comandante Oni',count:3,hp:75,boss:true}];
export const freshQuest=done=>({stage:done?'done':'meet',warned:new Set(),supplied:false,wave:-1,delay:0,integrity:100});
export function questTalk(q,id){
 if(q.stage==='meet'&&id==='caine'){q.stage='prepare';return ['Escute. Nossos batedores viram Onis marchando para a vila.','Avise três moradores e procure Lisa para receber suprimentos. Volte a mim quando estiver pronto.'];}
 if(q.stage==='prepare'&&id.startsWith('villager')){if(q.warned.has(id))return ['Já estou a caminho do abrigo. Obrigado!'];q.warned.add(id);return ['Uma invasão?! Vou procurar o abrigo imediatamente.'];}
 if(q.stage==='prepare'&&id==='lisa'){q.supplied=true;return ['Pegue os suprimentos. A unidade XXX vai lutar ao seu lado.'];}
 if(q.stage==='prepare'&&id==='caine'){if(q.warned.size<3||!q.supplied)return ['Ainda não estamos prontos. Avise três moradores e procure Lisa.'];q.stage='brief';return ['Todos em posição! Defenda a praça. Nossa unidade vai cobrir os flancos.','Se os Onis alcançarem o centro, a defesa sofrerá. Derrube o comandante para encerrar a invasão.'];}
 if(q.stage==='victory'&&id==='caine'){q.stage='done';return ['Você salvou a vila. A XXX reconhece sua coragem.','Mas alguém organizou esse ataque. Investigaremos as montanhas depois.'];}
 if(q.stage==='done'&&id==='caine')return ['A vila está segura graças a você.'];
 return null;
}
export function objective(q){return q.stage==='meet'?'Missão 01 · Fale com Caine':q.stage==='prepare'?`Preparação · moradores ${q.warned.size}/3 · suprimentos ${q.supplied?'✓':'0/1'} · volte a Caine`:q.stage==='brief'?'Prepare-se para a invasão':q.stage==='fight'?`Invasão ${q.wave+1}/4 · Defesa ${Math.ceil(q.integrity)}%`:q.stage==='victory'?'Vitória! Fale com Caine':'Missão 01 concluída';}
export function advanceWave(q){q.wave++;if(q.wave>=WAVES.length){q.stage='victory';return null;}return WAVES[q.wave];}
