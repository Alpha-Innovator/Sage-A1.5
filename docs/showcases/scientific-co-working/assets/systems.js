// Native layouts and recorded decisions, with illustrative assembly/light motion.
// Light is not electrical simulation, live packet traffic or database telemetry.
const TAU=Math.PI*2;
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{const x=clamp(v);return x*x*(3-2*x);};
const mix=(a,b,f)=>a+(b-a)*f;
const ink='#243b53',muted='#60758c',mint='#188775',blue='#347bbb',warm='#b76b32';
const poly=(c,pts,fill,stroke,width=1)=>{
  if(!pts.length)return;
  c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  if(fill){c.closePath();c.fillStyle=fill;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
};
const rect=(c,x,y,w,h,fill,stroke,r=5)=>{
  c.beginPath();c.roundRect(x,y,w,h,r);
  if(fill){c.fillStyle=fill;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
};
function dot(c,x,y,r,color,glow=false) {
  c.save();if(glow){c.shadowColor=color;c.shadowBlur=6;}
  c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();c.restore();
}
function ring(c,x,y,r,color,start=0,end=TAU,width=1) {
  c.beginPath();c.arc(x,y,r,start,end);c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function text(v,s,x,y,size=18,color=muted,align='left') {
  v.text(s,x,y,Math.max(v.small?22:0,size),color,align);
}
function gradient(c,x,y,w,h,a,b) {
  const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;
}
function halo(c,x,y,r,color) {
  const g=c.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,color+'22');g.addColorStop(1,color+'00');
  rect(c,x-r,y-r,r*2,r*2,g);
}
function bezierPoint(a,b,f) {
  const mid=(a[0]+b[0])/2,u=1-f;
  return [u*u*u*a[0]+3*u*u*f*mid+3*u*f*f*mid+f*f*f*b[0],
    u*u*u*a[1]+3*u*u*f*a[1]+3*u*f*f*b[1]+f*f*f*b[1]];
}
function bridge(c,a,b,color,phase,bright=true) {
  const points=Array.from({length:31},(_,i)=>bezierPoint(a,b,i/30));
  poly(c,points,null,color+(bright?'65':'20'),bright?1.5:1);
  if(!bright)return;
  const f=((phase%1)+1)%1;
  const tail=Array.from({length:9},(_,i)=>bezierPoint(a,b,Math.max(0,f-.14+i*.0175)));
  poly(c,tail,null,color+'bb',2.3);dot(c,...bezierPoint(a,b,f),3,color,true);
}
function pathGeometry(points) {
  const distance=[0];
  for(let i=1;i<points.length;i++)distance.push(distance.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  return {points,distance,length:distance.at(-1)};
}
function pathPoint(path,f) {
  const target=clamp(f)*path.length;
  let i=1;while(i<path.distance.length-1&&path.distance[i]<target)i++;
  if(path.points.length<2)return path.points[0];
  const fraction=(target-path.distance[i-1])/(path.distance[i]-path.distance[i-1]||1);
  return path.points[i-1].map((x,k)=>mix(x,path.points[i][k],fraction));
}
function partial(path,f) {
  if(f>=1)return path.points;
  const target=clamp(f)*path.length;
  return [...path.points.filter((_,i)=>path.distance[i]<target),pathPoint(path,f)];
}
function badge(v,label,x,y,color=mint) {
  const w=Math.max(120,label.length*10+26);
  rect(v.c,x,y,w,31,'#eaf2f9',color+'5a');
  text(v,label,x+13,y+22,14,color);
}

export function prepareSystem(data) {
  if(data.task==='t101')return {
    routes:data.routes.map(r=>({...r,...pathGeometry(r.points)})),
    before:[...data.before].sort((a,b)=>a.x+a.y-b.x-b.y),
    after:[...data.after].sort((a,b)=>a.x+a.y-b.x-b.y)
  };
  if(data.task==='t124')return {
    maxX:Math.max(...data.tiles.map(t=>t.x)),maxY:Math.max(...data.tiles.map(t=>t.y)),
    tiles:[...data.tiles].sort((a,b)=>b.y-a.y||a.x-b.x),
    timing:Object.values(data.fmax)[0]
  };
  if(data.task==='t030')return {
    max:Math.max(...data.packets.map(p=>p.time)),
    ordered:data.transactions.filter(r=>r.status==='accepted').sort((a,b)=>a.sequence-b.sequence),
    excluded:data.transactions.filter(r=>r.status!=='accepted').length
  };
  return {};
}

export function drawChip(v,s,t) {
  const c=v.c,q=v.cache.system,d=v.d,after=s.mode!=='placed',clock=s.mode==='clock';
  const ready=s.explore?30:t,arrival=ease(ready/5);
  const origin=93+(1-arrival)*14;
  const project=([x,y],z=0)=>[490+(x-y)*4.35,origin+(x+y)*2.34-z];
  const boundary=[[0,0],[80,0],[80,80],[0,80]];
  halo(c,490,309,365,'#3a9c8c');
  // The substrate assembles from separated layers, then remains behind native cells.
  for(let layer=3;layer>=0;layer--){
    const z=-9-layer*(6+(1-arrival)*9);
    const face=boundary.map(p=>project(p,z));
    poly(c,face,'#cfdeeb',layer===0?'#5b8c9655':'#314f6560');
  }
  const die=boundary.map(p=>project(p));
  poly(c,die,gradient(c,140,90,690,385,'#f5fbff','#ddebf3'),'#4b8b8685',1.2);
  for(let i=0;i<=80;i+=8){
    poly(c,[project([i,0]),project([i,80])],null,'#759aab20');
    poly(c,[project([0,i]),project([80,i])],null,'#759aab20');
  }
  // Presentation-only corner brackets, distinct from real DEF/LEF geometry.
  for(const p of [[0,0],[80,0],[80,80],[0,80]]){
    const [x,y]=project(p,-8);poly(c,[[x-11,y],[x,y+6],[x+11,y]],null,'#399d8e78',1.4);
  }
  const cells=after?q.after:q.before;
  for(const cell of cells){
    const built=s.explore?1:ease((ready*37-cell.x-cell.y+18)/36);
    const z=(1-built)*23;
    const shape=[[cell.x,cell.y],[cell.x+cell.w,cell.y],[cell.x+cell.w,cell.y+cell.h],[cell.x,cell.y+cell.h]].map(p=>project(p,z));
    const color=cell.eco?warm:cell.target?mint:after?'#537f99':'#668ba4';
    c.save();c.globalAlpha=.18+.82*built;
    poly(c,shape.map(([x,y])=>[x,y+3]),'#bfd1e1');
    poly(c,shape,color+(cell.eco||cell.target?'bc':'72'),color+'88',.5);
    c.restore();
    const p=project([cell.x,cell.y],z);
    if(after&&cell.target){ring(c,...p,5,'#29ae804a');}
    if(after&&cell.eco){dot(c,...p,4,warm,true);ring(c,...p,11,warm+'80');}
    v.hits.push({x:p[0]-5,y:p[1]-7,w:17,h:17,label:`${cell.name} · ${cell.master}`});
  }
  if(after){
    const z=clock?19:10;
    // Clock routes are genuine segments; layer separation only improves visibility.
    for(const [i,route] of q.routes.entries()){
      if(clock&&!route.clock)continue;
      const show=s.explore?1:route.clock?ease((t-9-i%7*.1)/6):ease((t-18-i%13*.09)/7);
      if(show<=0||!route.points.length)continue;
      const pts=partial(route,show).map(p=>project(p,route.clock?z:3));
      poly(c,pts,null,route.clock?'#29ae8ac0':'#3e739838',route.clock?1.9:.75);
      if(route.clock){
        const f=(t*.24+i*.137)%1,p=project(pathPoint(route,Math.min(show,f)),z);
        if(show>f)dot(c,...p,2.6,'#078e71',true);
        if(i%4===0)poly(c,[project(route.points[0]),project(route.points[0],z)],null,'#379f8b4b');
      }
    }
  }
  if(!s.explore&&t<9){
    const n=clamp(t/8)*160;
    const a=[Math.max(0,n-80),Math.min(80,n)],b=[Math.min(80,n),Math.max(0,n-80)];
    c.save();c.shadowColor=mint;c.shadowBlur=7;
    poly(c,[project(a,7),project(b,7)],null,'#29ae8fb0',2);c.restore();
  }
  text(v,'NATIVE PHYSICAL LAYOUT',67,76,14,muted);
  text(v,clock?'CLOCK TREE':after?'ROUTED ECO':'PLACEMENT',935,76,16,after?mint:blue,'right');
  badge(v,clock?'CLOCK NETWORK':after?'ROUTED ECO':'BASELINE PLACEMENT',65,535,after?mint:blue);
  if(after)badge(v,'DEF + SPEF',775,535,blue);
  text(v,after?`Clock gate → ${d.after.filter(cell=>cell.target).length} capture registers`:'From placed cells to a routed clock network',65,594,20,ink);
}

function cylinder(v,x,y,color,fill,active,label) {
  const c=v.c,w=67,h=103;
  halo(c,x,y+50,99,color);
  // Arc samples keep the metal body and its top lid on the same perspective.
  const ellipse=(yy,ry=20)=>Array.from({length:49},(_,i)=>[x+Math.cos(i/48*TAU)*w,yy+Math.sin(i/48*TAU)*ry]);
  const outline=[[x-w,y],[x-w,y+h],...Array.from({length:25},(_,i)=>{
    const a=Math.PI-i/24*Math.PI;return [x+Math.cos(a)*w,y+h+Math.sin(a)*20];
  }),[x+w,y]];
  poly(c,outline,gradient(c,x-w,y,w*2,0,'#e4eff8','#c5dfd7'),color+'6f');
  for(let row=0;row<4;row++){
    const yy=y+24+row*23;
    const arc=Array.from({length:25},(_,i)=>{const a=Math.PI-i/24*Math.PI;return[x+Math.cos(a)*w,yy+Math.sin(a)*15];});
    poly(c,arc,null,row/4<fill?color+'9c':'#64879932',row/4<fill?1.5:1);
  }
  poly(c,ellipse(y),gradient(c,x-w,y-20,w*2,40,'#f2f9fc','#d7e7f2'),color+'a0');
  if(active){ring(c,x,y,9,color,0,TAU,1.2);dot(c,x,y,3,color,true);}
  text(v,label,x,y+h+51,24,ink,'center');
}

export function drawFinancial(v,s,t) {
  const c=v.c,d=v.d,index=s.index||0,req=d.requests[index],ready=s.explore?30:t;
  const final=ready>=27&&!s.explore;
  const completed=s.explore||final?d.requests.length:Math.min(d.requests.length,index+(t% (30/18)>.85?1:0));
  const accepted=d.requests.filter(r=>r.accepted).length;
  const written=d.requests.slice(0,completed).filter(r=>r.accepted).length;
  const tone=req.accepted?mint:warm;
  text(v,'SOURCE REQUESTS',61,89,16,muted);text(v,'POLICY',524,89,16,muted,'center');text(v,'PUBLISH',839,89,16,muted,'center');
  halo(c,524,283,160,mint);
  // Faint paths remain visible as a provenance map; only the selected request flows.
  for(let i=0;i<d.requests.length;i++){
    const x=65+i%3*88,y=122+Math.floor(i/3)*59;
    bridge(c,[x+65,y+22],[454,283],d.requests[i].accepted?mint:warm,t*.62+i*.16,i===index&&!final);
  }
  for(const [i,r] of d.requests.entries()){
    const x=65+i%3*88,base=122+Math.floor(i/3)*59;
    const active=i===index&&!final,y=base-(active?5:0),done=i<completed;
    const color=r.accepted?mint:warm;
    rect(c,x+3,y+4,66,42,'#d4e1ee','#35506255',4);
    rect(c,x,y,66,42,gradient(c,x,y,66,42,active?'#e1f2ed':'#f8fbff','#e5eef8'),active?color:done?color+'66':'#4b6d8055',4);
    poly(c,[[x+9,y+9],[x+38,y+9]],null,done?color+'85':'#69889b55',1.5);
    text(v,r.id.startsWith('M-OPTIONAL')?'OPT':r.id.startsWith('M-REQUIRED')?'REQ':r.id,x+8,y+32,14,active?ink:'#4d7189');
    if(done)dot(c,x+56,y+10,2.5,color,active);
    v.hits.push({x,y,w:69,h:46,index:i,label:`${r.metric} · ${r.accepted?'Selected':'Rejected'}`});
  }
  const phase=t*.62,rotation=t*.32;
  ring(c,524,283,79,'#7597a533');ring(c,524,283,66,'#29ae804a');
  ring(c,524,283,79,mint+'bc',rotation,rotation+2.1,2);
  ring(c,524,283,88,blue+'71',-rotation,-rotation+1.5,1.5);
  const hex=Array.from({length:6},(_,i)=>[524+Math.cos(i/6*TAU)*59,283+Math.sin(i/6*TAU)*54]);
  poly(c,hex.map(([x,y])=>[x,y+9]),'#d6e2ef','#48677966');
  poly(c,hex,gradient(c,465,235,118,105,'#f3fcf9','#e0eff0'),mint+'85');
  text(v,'RESOLVE',524,277,18,ink,'center');text(v,'& ROUTE',524,301,14,mint,'center');
  for(let i=0;i<3;i++){
    const a=rotation+i*TAU/3;dot(c,524+Math.cos(a)*79,283+Math.sin(a)*79,2.8,mint,true);
  }
  const publishing=req.accepted||final;
  for(const [i,label] of ['SQLite','DuckDB'].entries()){
    const y=152+i*210;
    bridge(c,[598,283],[766,y+43],mint,phase+i*.3,publishing);
    cylinder(v,836,y,i?blue:mint,written/accepted,publishing,label);
  }
  bridge(c,[524,347],[524,439],warm,phase,!req.accepted&&!final);
  rect(c,453,438,143,40,'#fcf0e7',!req.accepted?warm+'9c':'#755b5c55',6);
  text(v,'REJECTED',524,464,14,!req.accepted?warm:'#927f81','center');
  if(final){
    badge(v,`${accepted} SELECTED`,65,531,mint);
    text(v,`${d.requests.length-accepted} rejected · Two matching warehouses`,274,554,23,ink);
    text(v,'Auditable facts. Rebuildable delivery.',274,590,18,muted);
  }else{
    badge(v,req.accepted?'SELECTED':'REJECTED',65,531,tone);
    text(v,req.metric.replaceAll('_',' '),260,554,23,ink);
    text(v,req.accepted?`${req.unit} · eligible source fact`:req.reason.replaceAll('_',' ').toLowerCase(),260,590,16,muted);
  }
}

export function drawFPGA(v,s,t) {
  const c=v.c,d=v.d,q=v.cache.system,ready=s.explore?30:t;
  const size=13,w=(q.maxX+1)*size,h=(q.maxY+1)*size;
  const settled=ease(ready/5);
  const project=(x,y,z=0)=>[155+x+y*.25,119+y*.86-x*.10-z];
  const outline=[[-14,-14],[w+14,-14],[w+14,h+14],[-14,h+14]];
  halo(c,386,300,280,'#2d76aa');
  // Layered package edge and pins are decorative; tile coordinates stay native.
  for(let layer=3;layer>=0;layer--)poly(c,outline.map(([x,y])=>project(x,y,-8-layer*(5+(1-settled)*5))),'#ccd9e8','#54799450');
  poly(c,outline.map(([x,y])=>project(x,y)),gradient(c,155,120,430,370,'#f5faff','#dde9f7'),'#447a9276',1.4);
  for(let i=0;i<25;i++){
    const yy=6+i*16;
    poly(c,[project(-15,yy),project(-27,yy,-1)],null,'#49708d6a',3);
    poly(c,[project(w+15,yy),project(w+27,yy,-1)],null,'#49708d6a',3);
  }
  const scan=clamp(ready/18)*h;
  const kindOf=tile=>tile.kind==='logic_tile'?'logic':tile.kind.startsWith('ram')?'memory':tile.kind==='io_tile'?'io':'other';
  const colors={logic:'#328da5',memory:'#7c60b9',io:'#b27a30',other:'#456691'};
  for(const tile of q.tiles){
    const kind=kindOf(tile),color=colors[kind],active=s.mode==='all'||s.mode===kind;
    const x=tile.x*size,y=(q.maxY-tile.y)*size;
    const built=s.explore?1:ease((scan-y+45)/50);
    const lift=active&&tile.bits?3:0;
    const pts=[[x,y],[x+10,y],[x+10,y+10],[x,y+10]].map(([a,b])=>project(a,b,lift+(1-built)*12));
    c.save();c.globalAlpha=active?(.16+.84*built)*(tile.bits?.85:.22):.08;
    poly(c,pts.map(([a,b])=>[a,b+3]),'#c7d7e8');
    poly(c,pts,gradient(c,pts[0][0],pts[0][1],13,13,color,'#b2c8e1'),color+'a0',.55);c.restore();
    const center=project(x+5,y+5,lift);
    if(active&&tile.bits&&Math.abs(scan-y)<14&&ready<18&&tile.x%4===0)dot(c,...center,1.8,'#13829b',true);
    v.hits.push({x:center[0]-7,y:center[1]-7,w:15,h:15,label:`${kind} (${tile.x}, ${tile.y}) · ${tile.bits} set bits`});
  }
  if(ready<18){
    c.save();c.shadowColor=blue;c.shadowBlur=7;
    poly(c,[project(0,scan,9),project(w,scan,9)],null,'#298baebb',2);c.restore();
  }
  const right=727;
  text(v,'PicoRV32',right,113,33,ink);text(v,'RTL → BITSTREAM',right,143,15,blue);
  for(const [i,label] of ['LOGIC','MEMORY','I/O'].entries()){
    const key=['logic','memory','io'][i],color=colors[key],active=s.mode==='all'||s.mode===key;
    const y=177+i*65;
    rect(c,right+3,y+5,199,46,'#dce6f1','#2e4d6955');
    rect(c,right,y,199,46,active?'#e0edfc':'#f4f7fc',active?color+'85':'#44607444',6);
    rect(c,right+13,y+14,16,16,active?color:'#d0deef',null,2);
    text(v,label,right+43,y+30,18,active?ink:muted);
    if(active&&ready>8)bridge(c,project(w+25,85+i*107),[right,y+23],color,t*.24+i*.3,true);
  }
  const packed=ease((ready-18)/6);
  rect(c,right,397,199,106,gradient(c,right,397,199,106,'#f9fcff','#ecf4fa'),mint+'55',8);
  text(v,ready>=24?'BITSTREAM READY':'PACK CONFIG',right+99,424,14,ready>=24?mint:muted,'center');
  for(let i=0;i<17;i++){
    const x=right+14+i*10,on=i/17<packed;
    rect(c,x,442,5,24+(i%3)*7,on?mint+'a0':'#44647655',null,1);
  }
  text(v,'Native iCE40 configuration',66,580,19,ink);
  if(ready>=24){
    badge(v,'TIMING MET',right,535,mint);
    text(v,`${q.timing.achieved.toFixed(2)} MHz`,right+99,597,23,ink,'center');
  }else text(v,'Build · route · pack',right,559,16,muted);
}

function probeLanes(v,t,opacity=1,compact=false) {
  const c=v.c,d=v.d,q=v.cache.system,x=value=>91+value/q.max*816;
  const ys=compact?[103,149]:[183,344],ready=t>=30?1:ease(t/14);
  c.save();c.globalAlpha=opacity;
  for(const [i,label] of ['EDGE PROBE','RESOLVER PROBE'].entries()){
    const y=ys[i],color=i?mint:blue;
    if(!compact)text(v,label,67,y-52,18,color);
    rect(c,78,y-15,845,30,color+'08',color+'25',6);
    poly(c,[[81,y],[920,y]],null,color+'45',1.2);
  }
  for(const [i,packet] of d.packets.entries()){
    const px=x(packet.time),seen=packet.time/q.max<=ready;
    if(packet.edge&&packet.resolver)poly(c,[[px,ys[0]],[px+5,ys[0]+24],[px-5,ys[1]-24],[px,ys[1]]],null,mint+(seen?'25':'0b'));
    if(packet.edge)rect(c,px-3,ys[0]-10,6,20,seen?blue:'#c6d6e8',null,2);
    if(packet.resolver)rect(c,px-3,ys[1]-10,6,20,seen?mint:'#c6d6e8',null,2);
    if(seen&&!compact&&Math.abs(packet.time/q.max-ready)<.04){
      if(packet.edge)dot(c,px,ys[0],3,'#2879bd',true);
      if(packet.resolver)dot(c,px,ys[1],3,'#13856a',true);
    }
  }
  if(t<18&&!compact){
    const cursor=x(q.max*ready);
    const beam=gradient(c,cursor-40,0,40,0,'#297fae00','#297fae30');
    rect(c,cursor-40,ys[0]-28,40,ys[1]-ys[0]+56,beam,null,0);
    poly(c,[[cursor,ys[0]-28],[cursor,ys[1]+28]],null,'#31a5a2a0',1.5);
  }
  c.restore();return {x,ys};
}

export function drawDNS(v,s,t) {
  const c=v.c,d=v.d,q=v.cache.system,ready=s.explore?30:t,fragments=s.mode==='fragments';
  halo(c,490,292,350,'#399d91');
  if(!fragments){
    const {x}=probeLanes(v,ready);
    const reveal=ease((ready-9)/8);
    text(v,'CORRELATE THE OBSERVATIONS',66,80,16,muted);
    text(v,'CORRECTED TIMELINE',927,80,16,blue,'right');
    for(const [i,tx] of d.transactions.entries()){
      const px=x(tx.time),color=tx.status==='accepted'?mint:warm;
      if(tx.time/q.max>reveal)continue;
      bridge(c,[px,357],[px+1,443],color,t*.35+i*.16,i%4===0);
      poly(c,[[px,432],[px+6,440],[px,448],[px-6,440]],color+'bb',null);
      v.hits.push({x:px-6,y:432,w:12,h:16,label:`Transaction ${tx.id} · ${tx.status}`});
    }
    text(v,'Two probes. One reconstructed stream.',67,517,29,ink);
    badge(v,`${q.ordered.length} ACCEPTED`,67,550,mint);
    text(v,`${q.excluded} excluded`,289,574,19,warm);
    text(v,`0 → ${q.max.toFixed(2)} s`,925,574,21,muted,'right');
    return;
  }
  // Tiles physically travel from native transaction-time positions into sequence order.
  const assembly=s.explore?1:ease((t-18)/7);
  probeLanes(v,30,.35*(1-assembly),true);
  text(v,'REASSEMBLE BY SEQUENCE',67,89,17,muted);
  text(v,'ACCEPTED FRAGMENTS',927,89,16,mint,'right');
  for(const [i,tx] of q.ordered.entries()){
    const f=s.explore?1:ease((t-18-i*.075)/4.9);
    const destination=[76+i%8*108,155+Math.floor(i/8)*96];
    const source=[91+tx.time/q.max*816,120+(i%2)*35];
    const x=mix(source[0],destination[0],f),y=mix(source[1],destination[1],f);
    const w=mix(8,84,f),h=mix(16,68,f),color=mint;
    if(f<1&&f>0)poly(c,[[source[0]+4,source[1]],[x+w/2,y+h/2]],null,color+'25');
    rect(c,x+4,y+6,w,h,'#d3e0ea','#45697940',6);
    rect(c,x,y,w,h,gradient(c,x,y,w,h,'#f3fcf8','#d9eae6'),color+(f>.95?'99':'50'),6);
    if(f>.55){
      text(v,String(tx.sequence).padStart(2,'0'),x+w/2,y+43,28,ink,'center');
      poly(c,[[x+12,y+56],[x+29,y+56]],null,color+'80',2);
    }
    if(f>.95&&f<1)dot(c,x+w-10,y+11,3,'#078e71',true);
    v.hits.push({x,y,w,h,label:`Sequence ${tx.sequence} · Transaction ${tx.id} · ${tx.time} s`});
  }
  const packed=ease((ready-24)/5);
  if(packed>0){
    c.save();c.globalAlpha=packed;
    const railY=461;
    poly(c,[[115,440],[115,railY],[885,railY],[885,440]],null,mint+'6f',1.5);
    for(let i=0;i<3;i++)bridge(c,[220+i*280,railY],[499,492],mint,t*.4+i*.3,true);
    rect(c,316,493,368,71,gradient(c,316,493,368,71,'#f2faf6','#e5f1ef'),mint+'9c',8);
    text(v,'{ }',345,539,30,mint);
    text(v,'gzip → JSON',410,534,27,ink);
    text(v,'REASSEMBLED',664,552,12,mint,'right');
    c.restore();
  }
  text(v,`${q.ordered.length} ordered fragments`,67,598,19,mint);
  text(v,'Payload contents omitted',927,598,16,muted,'right');
}
