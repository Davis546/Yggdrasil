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

export {packWorld616,unpackWorld616};
