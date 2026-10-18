// A staged, perspective audit of the recorded 150 fields.
// Tile position, light trails and circuit motifs are presentation, not simulation.
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const x = clamp(value); return x*x*(3-2*x); };
const mix = (a,b,t) => a+(b-a)*t;
const palette = ['#168879','#7c5bb9','#a87326','#387ebd','#b3547e'];
const names = ['RELAY','LADDER','FOLD','EXCHANGE','CORRELATOR'];
const short = ['AR','AL','NF','PE','SC'];
const labels = ['Infidelity','Depth','2Q gates','Duration','Est. success','Qualifies'];
const warm = '#b85d35', ink = '#253851', muted = '#60758c';

function polygon(c, points, fill, stroke, width=1) {
  c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function line(c,points,color,width=1) {
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function point(c,x,y,r,color,halo=false) {
  c.save();
  if(halo){c.shadowBlur=6;c.shadowColor=color;}
  c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();
}
function panel(c,x,y,w,h,fill,stroke) {
  c.beginPath();c.roundRect(x,y,w,h,8);c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
}
function ring(c,x,y,r,color) {
  c.beginPath();c.arc(x,y,r,0,TAU);c.strokeStyle=color;c.lineWidth=1.2;c.stroke();
}
function number(value) {
  const n=Number(value);
  return Number.isFinite(n)?Number(n.toPrecision(7)).toString():value;
}

export function prepareQuantum(data) {
  const mismatches=data.fields.filter(f=>f.within_tolerance==='false');
  const byKey=new Map(data.fields.map(f=>[`${f.workload_id}/${f.approximation_id}/${f.field}`,f]));
  const tiles=data.workloads.map((work,w)=>data.fieldOrder.flatMap((field,row)=>
    Array.from({length:5},(_,col)=>{
      const record=byKey.get(`${work}/APPROX-0${col+1}/${field}`);
      return {record,row,col,order:w*30+col*6+row,mismatch:mismatches.indexOf(record)};
    })));
  const parity=data.fields.filter(f=>f.field==='process_infidelity'&&f.approximation_id!=='APPROX-01')
    .map(f=>({record:f,w:data.workloads.indexOf(f.workload_id),
      claimed:Number(f.claimed_value),reproduced:Number(f.reproduced_value)}));
  return {tiles,parity,mismatches};
}

export function drawQuantum(view,state,time) {
  const c=view.c,q=view.cache.quantum,d=view.d,small=view.small;
  const t=state.explore?30:time,selected=q.mismatches[state.index||0];
  const visited=Math.floor(clamp((t-6)/6)*150);
  const detected=t<18?0:Math.min(3,1+Math.floor((t-18)/2));
  const final=t>=24;
  const font=(text,x,y,size=16,color=muted,align='left')=>{
    c.fillStyle=color;c.font=`${Math.max(small?22:0,size)}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;
    c.textAlign=align;c.textBaseline='alphabetic';c.fillText(String(text),x,y);
  };

  // Slow camera settling and staggered separation give the five plates depth.
  const aura=c.createRadialGradient(500,229,20,500,229,490);
  aura.addColorStop(0,'#483d9a22');aura.addColorStop(1,'#27385900');
  c.fillStyle=aura;c.fillRect(20,45,960,330);
  font('QISKIT',61,79,17,'#342cab');
  font('CIRQ',937,79,17,'#30a69f','right');
  const circuitFade=1-ease((t-12)/5)*.7;
  c.save();c.globalAlpha=circuitFade;
  for(let row=0;row<2;row++){
    const y=62+row*17;
    line(c,[[170,y],[828,y]],'#6d78a041');
    for(let gate=0;gate<5;gate++){
      const x=236+gate*121,color=palette[gate];
      if(gate%2===row)panel(c,x-8,y-6,16,12,'#e9eff8',color+'8c');
      else{line(c,[[x,62],[x,79]],color+'70');point(c,x,y,2.5,color);}
    }
    const travel=(t*.23+row*.48)%1;
    const x=170+travel*658;
    const trail=c.createLinearGradient(x-50,y,x,y);
    trail.addColorStop(0,'#3229ae00');trail.addColorStop(1,'#2929aeb0');
    line(c,[[Math.max(170,x-50),y],[x,y]],trail,2);
    point(c,x,y,2.3,'#3329ae',true);
  }
  c.restore();

  const anchors=[];
  q.tiles.forEach((tiles,w)=>{
    const arrival=ease((t-w*.3+.9)/4.4);
    const settle=ease((t-17)/8);
    const bx=mix(405,55+w*181,arrival);
    const by=138+(1-arrival)*(w-2)*23-Math.sin(t*.35+w)*3*(1-settle);
    const skew=mix(.34,.20,settle),tilt=mix(.19,.105,settle),color=palette[w];
    const project=(x,y,z=0)=>[bx+x+y*skew,by+y*.92-x*tilt-z];
    const plate=[[-7,-8],[133,-8],[133,168],[-7,168]].map(([x,y])=>project(x,y));
    c.save();c.globalAlpha=.16+.84*arrival;
    polygon(c,plate.map(([x,y])=>[x,y+12]),'#c7d4e6e0','#31436166');
    polygon(c,[plate[1],plate[2],[plate[2][0],plate[2][1]+12],[plate[1][0],plate[1][1]+12]],'#cad8eb',color+'35');
    const surface=c.createLinearGradient(bx,by,bx+140,by+155);
    surface.addColorStop(0,'#fcfdff');surface.addColorStop(1,'#e7eef9');
    polygon(c,plate,surface,color+'60');
    font(names[w],bx+72,by-37,small?23:16,color,'center');
    for(const tile of tiles){
      const {row,col,record,order,mismatch}=tile;
      const scanned=order<visited,bad=mismatch>=0&&mismatch<detected;
      const active=bad&&record===selected;
      const sweep=visited<150&&t>=6?clamp(1-Math.abs(order-visited)/8):0;
      const lift=bad?ease((t-18-mismatch*2)/1.2)*(active?17:8):sweep*5;
      const x=col*26,y=row*27;
      const pts=[[x,y],[x+21,y],[x+21,y+21],[x,y+21]].map(([px,py])=>project(px,py,lift));
      const tint=bad?warm:color;
      polygon(c,pts.map(([px,py])=>[px,py+4+lift*.4]),'#b8c9decc');
      const face=c.createLinearGradient(pts[0][0],pts[0][1],pts[2][0],pts[2][1]);
      face.addColorStop(0,bad?'#ffe0c3':scanned?color+'e0':'#e3ebf7');
      face.addColorStop(1,bad?'#d2967e':scanned?color+'60':'#cbd9ed');
      c.save();
      if(bad||sweep>0){c.shadowBlur=active?8:4+sweep*4;c.shadowColor=tint;}
      polygon(c,pts,face,active?'#ad5b37':scanned?tint+'a0':'#61749555',active?1.8:.7);
      c.restore();
      if(sweep>0){
        c.save();c.globalAlpha=sweep;polygon(c,pts,'#d6e7fb80','#347cb8',1.2);c.restore();
      }
      const [cx,cy]=project(x+10.5,y+10.5,lift);
      if(bad){
        line(c,[[cx-3,cy-3],[cx+3,cy+3]],'#663c39',1.8);
        line(c,[[cx+3,cy-3],[cx-3,cy+3]],'#663c39',1.8);
        anchors[mismatch]=[cx,cy];
        view.hits.push({x:cx-17,y:cy-17,w:34,h:34,index:mismatch,
          label:`${short[w]}·${col+1} / ${labels[row]}: ${record.claimed_value} → ${record.reproduced_value}`});
      }
    }
    // A soft light curtain sweeps continuously across each bank of checks.
    if(t>=6&&t<12){
      const scan=clamp((visited-w*30)/30)*130;
      if(visited>=w*30&&visited<(w+1)*30){
        c.save();c.shadowColor=color;c.shadowBlur=7;
        const ribbon=[[scan-7,-5],[scan+5,-5],[scan+5,161],[scan-7,161]].map(([x,y])=>project(x,y,4));
        polygon(c,ribbon,color+'24',null);
        line(c,[project(scan,-5,5),project(scan,161,5)],'#298caec0',2);c.restore();
      }
    }
    for(let col=0;col<5;col++){
      const [x,y]=project(col*26+10,183);
      font(col+1,x,y,small?20:12,muted,'center');
    }
    c.restore();
  });

  // The bus and travelling light join the two-framework motif to the audit.
  line(c,[[63,344],[938,344]],'#63769535');
  if(t<18){
    const x=63+(t*.1%1)*875;
    const beam=c.createLinearGradient(Math.max(63,x-100),344,x+1,344);
    beam.addColorStop(0,'#292bae00');beam.addColorStop(1,'#295bae');
    line(c,[[Math.max(63,x-100),344],[x,344]],beam,2);
    point(c,x,344,3,'#294cae',true);
  }

  // Recreate the legacy parity plot using exact native field values, not animation values.
  const px=92,py=394,side=157;
  const lo=Math.log10(.0035),hi=Math.log10(.65);
  const scale=v=>(Math.log10(v)-lo)/(hi-lo);
  const sx=v=>px+scale(v)*side,sy=v=>py+side-scale(v)*side;
  const graphAlpha=.22+.78*ease((t-11.5)/2);
  c.save();c.globalAlpha=graphAlpha;
  font('CLAIM ↔ REPRODUCTION',64,375,small?23:14,'#496d8d');
  for(const value of [.01,.1]){
    line(c,[[sx(value),py],[sx(value),py+side]],'#516f8524');
    line(c,[[px,sy(value)],[px+side,sy(value)]],'#516f8524');
    font(value===.01?'10⁻²':'10⁻¹',sx(value),py+side+22,small?21:12,muted,'center');
  }
  c.setLineDash([4,5]);line(c,[[px,py+side],[px+side,py]],'#45699270');c.setLineDash([]);
  const reveal=ease((t-12)/5);
  q.parity.forEach(({record,w,claimed,reproduced},i)=>{
    const progress=ease(reveal*2-i/20);
    if(progress<=0||claimed<=0||reproduced<=0)return;
    const x=sx(claimed),y=sy(reproduced);
    const bad=record.within_tolerance==='false'&&detected>0;
    const active=selected.workload_id===record.workload_id&&selected.approximation_id===record.approximation_id;
    c.save();c.globalAlpha*=progress;
    if(bad)line(c,[[x,sy(claimed)],[x,y]],warm,1.7);
    point(c,x,y,active?4:3,palette[w],active||bad);
    if(bad||active)ring(c,x,y,8,bad?warm:'#5c29ae');
    c.restore();
  });
  font('20 non-exact · 5 near-zero',64,600,small?22:13,muted);
  c.restore();

  // Keep the headline legible and the precise mismatch one click away.
  const rx=small?366:386;
  font(final?'147':visited,rx,414,58,final?'#29ad84':'#294fad');
  font('/ 150',rx+126,411,25,muted);
  font(final?'FIELDS REPRODUCED':t<6?'COMPILATION SPACE':'FIELDS SCANNED',rx,438,small?22:13,muted);
  font(detected,906,412,51,detected?warm:'#61768f','right');
  font('EXCEPTIONS',939,438,small?22:13,muted,'right');

  for(let i=0;i<3;i++){
    const f=q.mismatches[i],w=d.workloads.indexOf(f.workload_id);
    const x=rx+i*(small?196:187),y=461,width=small?184:176;
    const shown=i<detected,active=shown&&f===selected;
    panel(c,x,y,width,54,active?'#fff0e6':'#f3f7fc',active?'#ae522990':'#53688038');
    point(c,x+13,y+15,2.7,shown?warm:'#587083',active);
    font(`${short[w]} · ${f.approximation_id.slice(-2)}`,x+25,y+20,small?22:14,shown?warm:'#7890a5');
    font(labels[d.fieldOrder.indexOf(f.field)],x+12,y+42,small?23:16,shown?ink:muted);
    if(shown)view.hits.push({x,y,w:width,h:54,index:i,label:`${f.claimed_value} → ${f.reproduced_value}`});
    if(active&&anchors[i]){
      const [ax,ay]=anchors[i];
      c.save();c.globalAlpha=.45;
      const bend=359;
      c.beginPath();c.moveTo(ax,ay+12);c.bezierCurveTo(ax,bend,x+width/2,bend,x+width/2,y-8);
      c.strokeStyle=warm;c.lineWidth=1.4;c.stroke();c.restore();
      point(c,ax,ay+12,2.2,'#ffe0c3',true);
      point(c,x+width/2,y-8,2.2,'#ffe0c3',true);
    }
  }
  if(detected){
    font('CLAIMED  →  REPRODUCED',rx,553,small?22:12,muted);
    font(`${number(selected.claimed_value)}  →  ${number(selected.reproduced_value)}`,rx,587,small?28:29,'#ae5029');
  }else{
    font(t<12?'25 compilation cells. Six fields each.':'Two frameworks. One independent check.',rx,569,small?24:21,'#486e8e');
  }
}
