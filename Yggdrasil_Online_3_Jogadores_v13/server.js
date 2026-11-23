'use strict';
// Yggdrasil cooperative test server (zero external dependencies).
// Serves static assets and a small RFC6455 WebSocket relay. One game client
// is authoritative for monsters and damage; the server owns room membership.
const http=require('node:http');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const PORT=Number(process.env.PORT||3000);
const ROOT=path.join(__dirname,'public');
const rooms=new Map();
const players=new Map();
let nextId=1;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.m4a':'audio/mp4','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return;}
  if(pathname==='/health'){res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({ok:true,rooms:rooms.size}));return;}
  const filepath=path.resolve(ROOT,'.'+(pathname==='/'?'/index.html':pathname));
  if(!filepath.startsWith(ROOT+path.sep)){res.writeHead(403).end();return;}
  fs.stat(filepath,(err,st)=>{
    if(err||!st.isFile()){res.writeHead(404).end('Not found');return;}
    res.writeHead(200,{'content-type':types[path.extname(filepath)]||'application/octet-stream','cache-control':pathname.endsWith('.html')||pathname.endsWith('.js')?'no-cache':'public, max-age=86400','x-content-type-options':'nosniff'});
    fs.createReadStream(filepath).pipe(res);
  });
});
function packFrame(text){const buf=Buffer.from(text);let header;if(buf.length<126){header=Buffer.from([0x81,buf.length]);}else if(buf.length<65536){header=Buffer.alloc(4);header[0]=0x81;header[1]=126;header.writeUInt16BE(buf.length,2);}else{header=Buffer.alloc(10);header[0]=0x81;header[1]=127;header.writeBigUInt64BE(BigInt(buf.length),2);}return Buffer.concat([header,buf]);}
function send(client,obj){if(!client||client.socket.destroyed)return;try{client.socket.write(packFrame(JSON.stringify(obj)));}catch{client.socket.destroy();}}
function members(room){return [...room.members].map(m=>({id:m.id,hero:m.hero||null}));}
function notify(room){for(const m of room.members)send(m,{t:'lobby',members:members(room),host:room.host.id,code:room.code,started:room.started});}
function roomCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s;do{s=Array.from({length:6},()=>alphabet[crypto.randomInt(alphabet.length)]).join('')}while(rooms.has(s));return s;}
function joinRoom(c,room){if(c.room)leaveRoom(c);if(room.members.size>=3){send(c,{t:'error',message:'Sala cheia (máximo 3 jogadores).'});return;}if(room.started){send(c,{t:'error',message:'Partida em andamento. Crie outra sala.'});return;}room.members.add(c);c.room=room;c.hero=null;send(c,{t:'welcome',id:c.id,code:room.code,host:room.host.id,members:members(room)});notify(room);}
function leaveRoom(c){const room=c.room;if(!room)return;c.room=null;room.members.delete(c);if(room.host===c){for(const m of room.members){m.room=null;send(m,{t:'closed',message:'O anfitrião saiu da sala.'});}rooms.delete(room.code);return;}
 if(room.members.size===0){rooms.delete(room.code);return;}notify(room);send(room.host,{t:'left',id:c.id});}
function message(c,m){if(!m||typeof m.t!=='string')return;
 if(m.t==='create'){const code=roomCode(),room={code,host:c,members:new Set(),started:false};rooms.set(code,room);joinRoom(c,room);return;}
 if(m.t==='join'){const code=String(m.code||'').trim().toUpperCase();const room=rooms.get(code);if(!room){send(c,{t:'error',message:'Sala não encontrada. Confira o código.'});return;}joinRoom(c,room);return;}
 if(m.t==='leave'){leaveRoom(c);return;}
 const r=c.room;if(!r)return;
 if(m.t==='choose'&&!r.started){const hero=m.hero;if(!['loid','kris','cross'].includes(hero))return;c.hero=hero;notify(r);return;}
 if(m.t==='begin'&&r.host===c&&!r.started){if(r.members.size<2||[...r.members].some(p=>!p.hero)){send(c,{t:'error',message:'São necessários 2 ou 3 jogadores com personagem selecionado.'});return;}r.started=true;const boss=['samurai','reuni','tsukuomi','pecado'].includes(m.boss)?m.boss:null;const diff=m.difficulty==='pecador'?'pecador':'normal';for(const p of r.members)send(p,{t:'begun',id:p.id,host:r.host.id,members:members(r),boss,difficulty:diff});return;}
 if(!r.started)return;
 if(m.t==='input'&&r.host!==c){const x=Number(m.x)||0,y=Number(m.y)||0,a=Number(m.aim)||0;send(r.host,{t:'remoteInput',id:c.id,x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y)),aim:a,attack:!!m.attack});return;}
 if(m.t==='press'&&r.host!==c&&['attack','q','eDown','eUp','dash','ultimate','card','ultimateChoice','f'].includes(m.action)){
   send(r.host,{t:'remotePress',id:c.id,action:m.action,value:String(m.value||'').slice(0,35)});return;}
 if(m.t==='state'&&r.host===c){const json=JSON.stringify(m.data||{});if(json.length>170000)return;for(const p of r.members){if(p!==c)send(p,{t:'state',data:m.data});}return;}
 if(m.t==='signal'&&r.host===c){for(const p of r.members){if(p.id===m.to){send(p,{t:'signal',value:m.value});break;}}return;}
}
function close(c){if(c.closed)return;c.closed=true;leaveRoom(c);players.delete(c.id);try{c.socket.destroy();}catch{}}
server.on('upgrade',(req,socket,head)=>{
 if(new URL(req.url,'http://localhost').pathname!=='/ws'){socket.destroy();return;}
 const key=req.headers['sec-websocket-key'];if(!key||typeof key!=='string'){socket.destroy();return;}
 const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
 socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
 const c={id:String(nextId++),socket,room:null,hero:null,buffer:Buffer.alloc(0),closed:false};players.set(c.id,c);
 const receive=(chunk)=>{c.buffer=Buffer.concat([c.buffer,chunk]);if(c.buffer.length>200000){close(c);return;}while(c.buffer.length>=2){const b=c.buffer,opcode=b[0]&15,masked=!!(b[1]&128),lenCode=b[1]&127;let off=2,len=lenCode;if(lenCode===126){if(b.length<4)return;len=b.readUInt16BE(2);off=4;}else if(lenCode===127){if(b.length<10)return;const big=b.readBigUInt64BE(2);if(big>170000n){close(c);return;}len=Number(big);off=10;}if(!masked){close(c);return;}if(b.length<off+4+len)return;const mask=b.subarray(off,off+4),body=Buffer.from(b.subarray(off+4,off+4+len));for(let i=0;i<body.length;i++)body[i]^=mask[i%4];c.buffer=b.subarray(off+4+len);
  if(opcode===8){close(c);return;}if(opcode===9){const response=Buffer.from([0x8a,body.length,...body]);socket.write(response);continue;}if(opcode!==1)continue;try{message(c,JSON.parse(body.toString('utf8')))}catch{} }
 };
 socket.on('data',receive);socket.on('close',()=>close(c));socket.on('error',()=>close(c));if(head.length)receive(head);
});
server.listen(PORT,'0.0.0.0',()=>console.log('Yggdrasil online listening on '+PORT));
