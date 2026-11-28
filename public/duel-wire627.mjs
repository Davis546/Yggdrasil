// Self-contained snapshots: no dependency on previously received frames.
const groups=['players','clones','projectiles'];
const visuals=['rings','slashes','timeFields','realityFields','mirrorIllusions','evePortals','xansBlasters','damageFloats'];
function packList(list){
 if(!Array.isArray(list)||list.length<2)return list;
 const schemas=[],costs=[],index=new Map(),rows=[];let saved=0;
 for(const o of list){if(!o||typeof o!=='object'||Array.isArray(o))return list;
  const keys=Object.keys(o).filter(k=>o[k]!==undefined),sig=keys.join('\u001f');let n=index.get(sig);
  if(n===undefined){n=schemas.length;index.set(sig,n);schemas.push(keys);costs.push(keys.reduce((sum,k)=>sum+JSON.stringify(k).length+1,0));}
  if(!keys.length)return list;
  saved+=costs[n]-String(n).length-1;rows.push([n,...keys.map(k=>o[k])]);
 }
 const compact={schemas,rows};return saved>JSON.stringify(schemas).length+20?compact:list;
}
function unpackList(list){
 if(Array.isArray(list)||list===undefined)return list;
 if(!list||!Array.isArray(list.schemas)||!Array.isArray(list.rows)||list.schemas.length>256||list.rows.length>4096)throw Error('Invalid snapshot list');
 for(const keys of list.schemas)if(!Array.isArray(keys)||keys.length>256||keys.some(k=>typeof k!=='string'||['__proto__','constructor','prototype'].includes(k)))throw Error('Invalid schema');
 return list.rows.map(r=>{const keys=list.schemas[r?.[0]];if(!Array.isArray(r)||!keys||r.length!==keys.length+1)throw Error('Invalid row');return Object.fromEntries(keys.map((k,i)=>[k,r[i+1]]));});
}
export function packDuel627(s){const out={...s,wire627:1};for(const k of groups)if(s[k]!==undefined)out[k]=packList(s[k]);if(s.visual){out.visual={...s.visual};for(const k of visuals)if(s.visual[k]!==undefined)out.visual[k]=packList(s.visual[k]);}return out;}
export function unpackDuel627(s){if(s?.wire627!==1)return s;try{const out={...s};delete out.wire627;for(const k of groups)if(s[k]!==undefined)out[k]=unpackList(s[k]);if(s.visual){out.visual={...s.visual};for(const k of visuals)if(s.visual[k]!==undefined)out.visual[k]=unpackList(s.visual[k]);}return out;}catch{return null;}}
