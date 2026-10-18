// Ten native-data scenes, one animation clock. Decorative motion is not solver time.
import { prepareQuantum, drawQuantum } from './quantum.js?v=coworking-light-2';
import { prepareSystem, drawChip, drawFPGA, drawFinancial, drawDNS } from './systems.js?v=coworking-light-2';
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const colors = ['#188b78', '#3d7bc0', '#805bb5', '#b8792d', '#af5278', '#328aa2', '#708f42', '#6c6aab'];
const ink = '#243b53', muted = '#60758c';
const round = (v, n = 2) => Number(v).toFixed(n);
function path(c, points, stroke, width = 1, fill) {
  if (!points.length) return;
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  if (fill) { c.closePath(); c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function box(c, x, y, w, h, fill, stroke, radius = 5) {
  c.beginPath(); c.roundRect(x, y, w, h, radius);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
}
function dot(c, x, y, r, fill, stroke) {
  c.beginPath(); c.arc(x, y, r, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
}
function glow(c, x, y, r, color) {
  c.save(); c.shadowColor = color; c.shadowBlur = 6; dot(c, x, y, r, color); c.restore();
}
function bezier(c, from, to, color, width = 1) {
  c.beginPath(); c.moveTo(...from); c.bezierCurveTo((from[0]+to[0])/2,from[1],(from[0]+to[0])/2,to[1],...to);
  c.lineWidth = width; c.strokeStyle = color; c.stroke();
}
function routeGeometry(points) {
  const unique=points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]),distance=[0];
  for(let i=1;i<unique.length;i++)distance.push(distance.at(-1)+Math.hypot(unique[i][0]-unique[i-1][0],unique[i][1]-unique[i-1][1]));
  return {points:unique,distance,length:distance.at(-1)};
}
function routePosition(route,fraction) {
  if(route.points.length<2)return route.points[0];
  const target=clamp(fraction)*route.length;
  let i=1;while(i<route.distance.length-1&&route.distance[i]<target)i++;
  const f=(target-route.distance[i-1])/(route.distance[i]-route.distance[i-1]||1);
  return route.points[i-1].map((v,k)=>v+(route.points[i][k]-v)*f);
}
export class Visuals {
  constructor(canvas) { this.canvas = canvas; this.c = canvas.getContext('2d', {alpha:false}); this.hits = []; }
  setData(data, images = {}) {
    this.d = data; this.images = images; this.hits = []; this.cache = {};
    if (data.task === 't141') this.cache.quantum=prepareQuantum(data);
    if (['t101','t124','t026','t030'].includes(data.task)) this.cache.system=prepareSystem(data);
    if (data.task === 't188') {
      const bounds = [Infinity,Infinity,-Infinity,-Infinity];
      data.roads.forEach(p => p.forEach(([x,y]) => { bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y); }));
      const longitudeScale=Math.cos((bounds[1]+bounds[3])/2*Math.PI/180);
      const s = Math.min(790/((bounds[2]-bounds[0])*longitudeScale),465/(bounds[3]-bounds[1]));
      this.map = ([x,y]) => [500+(x-(bounds[0]+bounds[2])/2)*longitudeScale*s,305-(y-(bounds[1]+bounds[3])/2)*s];
      this.cache.roads = new Path2D();
      for (const r of data.roads) r.forEach((p,i)=> {const q=this.map(p);i?this.cache.roads.lineTo(...q):this.cache.roads.moveTo(...q);});
      this.cache.routes=data.scenarios.map(sc=>sc.routes.map(r=>routeGeometry(r.points.map(this.map))));
    }
    if (data.task === 't115') {
      this.cache.heat = document.createElement('canvas'); this.cache.heat.width=31;this.cache.heat.height=31;
      this.cache.frame=-1;
    }
  }
  text(s,x,y,size=16,color=muted,align='left') {
    const c=this.c;c.fillStyle=color;c.font=`${Math.max(this.small?19:0,size)}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(String(s),x,y);
  }
  pill(s,x,y,color=ink) {const c=this.c;box(c,x,y,s.length*8+28,29,'#eaf1f9','#c6d5e7',4);this.text(s,x+14,y+20,13,color);}
  line(points,color,width=1,fill){path(this.c,points,color,width,fill);}
  draw(state,time,chapter) {
    if(!this.d)return;
    const b=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    this.small=b.width<500;
    const w=Math.round(b.width*dpr),h=Math.round(b.height*dpr);
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    const c=this.c;c.setTransform(w/1000,0,0,h/620,0,0);
    const g=c.createRadialGradient(500,300,15,500,300,600);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#eef4fb');
    box(c,0,0,1000,620,g);
    c.fillStyle='#7898bc24';for(let x=30;x<1000;x+=36)for(let y=36;y<620;y+=36)c.fillRect(x,y,1,1);
    this.hits=[];this.phase=chapter;this.time=time;this[this.d.task](state,time);
  }
  hit(event) {
    const b=this.canvas.getBoundingClientRect(),x=(event.clientX-b.left)/b.width*1000,y=(event.clientY-b.top)/b.height*620;
    return [...this.hits].reverse().find(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h);
  }
  t101(s,t) {
    drawChip(this,s,t);
  }
  t188(s,t) {
    const c=this.c,sc=this.d.scenarios[s.index||0];
    c.strokeStyle='#4d758252';c.lineWidth=1;c.stroke(this.cache.roads);
    const palette=Object.fromEntries(sc.facilities.map((f,i)=>[f.id,colors[i%colors.length]]));
    for(const [i,route] of sc.routes.entries()){
      const geometry=this.cache.routes[s.index||0][i],pts=geometry.points,color=palette[route.facility]||colors[0];
      if(!pts.length)continue;
      const reveal=s.explore||t>=30?1:clamp((t%10+2)/7);
      const shown=pts.filter((_,j)=>geometry.distance[j]<geometry.length*reveal);
      this.line([...shown,routePosition(geometry,reveal)],color+'aa',2);
      const point=routePosition(geometry,((t*.12+i*.137)%1)*reveal);
      if(this.phase>0||s.explore)glow(c,...point,2.5,color);
      const end=pts.at(-1);dot(c,...end,3,'#517385');
    }
    for(const f of sc.facilities){const p=this.map(f.point);dot(c,...p,15,null,palette[f.id]+'45');glow(c,...p,6,palette[f.id]);this.hits.push({x:p[0]-15,y:p[1]-15,w:30,h:30,label:`${f.id} · ${f.units} units`});}
    this.pill(['EMS PEAK','FIRE + RESCUE','ALL-HAZARDS SURGE'][s.index||0],65,533,colors[1]);
    this.text(`${sc.facilities.length} facilities · ${sc.units} response units`,65,593,18);
    this.text('Simplified route map',925,562,16,muted,'right');
  }
  t093(s,t) {
    const d=this.d,c=this.c;
    if(s.mode==='profiles'){
      ['K17','K42','K88'].forEach((id,i)=>{
        const y=150+i*145,color=colors[i],p=d.profiles[id];
        this.line(p.map(([x,v])=>[210+x*590,y-v*590]),color,2,color+'12');
        this.text(id,70,y+8,27,color);const metric=d.pareto.find(r=>r.candidate_id===id);
        this.text(metric.feasible?'Feasible':'Constraint exceeded',810,y+8,16,metric.feasible?'#399d80':'#ae4b29');
      });
      this.text('Three native profiles. One common scale.',70,587,18);
      return;
    }
    const ex=d.flow.extent,scale=Math.min(890/(ex[1]-ex[0]),440/(ex[3]-ex[2]));
    const width=(ex[1]-ex[0])*scale,height=(ex[3]-ex[2])*scale,left=500-width/2,top=300-height/2;
    const project=([x,y])=>[left+(x-ex[0])*scale,top+(ex[3]-y)*scale];
    c.save();c.beginPath();c.rect(left,top,width,height);c.clip();
    if(s.mode==='flow'&&this.images.main){c.globalAlpha=.8;c.drawImage(this.images.main,left,top,width,height);c.globalAlpha=1;}
    if(s.mode==='mesh')for(const poly of d.flow.mesh)this.line(poly.map(project),'#4084963d',.65);
    if(s.mode==='flow')for(const [i,tr] of d.flow.traces.entries()){
      this.line(tr.map(project),'#3199a535',1);
      for(let k=0;k<2;k++){
        const j=Math.floor(((t*.12+i*.137+k*.5)%1)*(tr.length-1));
        if(tr[j]){const p=project(tr[j]);glow(c,...p,1.8,'#1a6d8a');}
      }
    }
    this.line(d.profiles.K17.map(project),'#315b78',2,'#405e78');
    c.restore();
    this.pill(s.mode==='mesh'?'NATIVE MESH':'STEADY PRESSURE + FLOW',60,550,colors[1]);
    this.text('K17 × CROSS_12',937,575,18,ink,'right');
  }
  t100(s,t) {
    const c=this.c,d=this.d,scale=445/d.page[1],pw=d.page[0]*scale;
    if(s.mode==='page'){
      c.save();c.shadowBlur=16;c.shadowColor='#3455781f';
      box(c,130,82,pw+18,463,'#dce5ef',null,3);c.restore();
      if(this.images.main)c.drawImage(this.images.main,139,91,pw,445);
      for(const [i,r] of d.boxes.entries()){
        if(!s.explore&&i>t*1.1)continue;
        const [x,y,x2,y2]=r.box;
        box(c,139+x*scale,91+y*scale,(x2-x)*scale,(y2-y)*scale,'#c5aff032','#8664b5',0);
      }
      if(!s.explore&&t<12){
        const scan=91+clamp(t/11)*445;
        const beam=c.createLinearGradient(0,scan-30,0,scan);
        beam.addColorStop(0,'#5629ae00');beam.addColorStop(1,'#5629ae35');
        box(c,139,Math.max(91,scan-30),pw,Math.min(30,scan-91),beam,null,0);
        c.save();c.shadowColor='#5529ae';c.shadowBlur=6;
        this.line([[139,scan],[139+pw,scan]],'#5929aebc',1.5);c.restore();
      }
      this.text('OBJECT-LEVEL',620,175,17,'#594294');this.text('Protected.',620,224,42,ink);
      this.text('Rewritten.',620,280,42,ink);this.text('Inspectable.',620,336,42,ink);
      this.pill('1 REVISION',620,398,'#612caa');this.text('Released page only',139,585,17);
    }else{
      this.text('SOURCE CONTAINERS',75,100,17,muted);this.text('SANITIZED RELEASE',650,100,17,'#4a2fa8');
      for(let i=0;i<14;i++){
        const x=80+(i%3)*88,y=145+Math.floor(i/3)*72,removed=s.explore||i<t-9;
        box(c,x,y,66,43,removed?'#f4e8ed':'#e2ecf7',removed?'#856878':'#476a7a',4);
        this.text(String(i+1).padStart(2,'0'),x+33,y+28,17,removed?'#855165':ink,'center');
        if(removed)this.line([[x+18,y+21],[x+48,y+21]],'#964043',2);
        bezier(c,[x+66,y+21],[526,301],removed?'#75556830':'#689bb84a');
      }
      dot(c,526,301,55,'#e9effb','#85769c');this.text('REWRITE',526,308,17,'#5e29ae','center');
      this.line([[581,301],[685,301]],'#614b8b88',2);
      box(c,685,150,205,307,'#f2eff8','#5c449288',9);
      for(let i=0;i<22;i++)box(c,705+i%4*43,174+Math.floor(i/4)*43,28,28,'#7e779c55','#68508655',3);
      this.text('22 live objects',787,496,20,ink,'center');
      this.text('Forms · attachments · metadata',75,565,18);
      this.text('Container diagram',925,595,14,muted,'right');
    }
  }
  t134(s,t) {
    const c=this.c,d=this.d,index=s.index||0,angle=.35+t*.075;
    // One equivalent interior site in the host schematic; the curves retain the native L2/L3 data.
    const species=index===1?'C':'Si';
    const site=d.atoms.filter(a=>a.species===species).reduce((best,a)=>
      a.p.reduce((sum,v)=>sum+(v-.85)**2,0)<best.p.reduce((sum,v)=>sum+(v-.85)**2,0)?a:best);
    const atoms=d.atoms.map(a=>{
      const [x,y,z]=a.p.map(v=>v-.85),u=x*Math.cos(angle)-z*Math.sin(angle),v=x*Math.sin(angle)+z*Math.cos(angle);
      const selected=a===site;
      return {...a,species:selected&&index===2?'C':a.species,selected,missing:selected&&index!==2,x:266+u*102,y:296+y*112+v*30,z:v};
    });
    for(let i=0;i<atoms.length;i++)for(let j=i+1;j<atoms.length;j++){
      const a=atoms[i],b=atoms[j],dist=Math.hypot(...a.p.map((v,k)=>v-b.p[k]));
      if(!a.missing&&!b.missing&&dist<.45)this.line([[a.x,a.y],[b.x,b.y]],'#4b808b45',1);
    }
    atoms.sort((a,b)=>a.z-b.z).forEach(a=>{
      const r=(a.species==='Si'?5:3.8)+(a.z+2)*.6;
      if(a.missing){dot(c,a.x,a.y,r+3,null,'#ae6329');}
      else{
        const shade=c.createRadialGradient(a.x-r*.35,a.y-r*.4,.2,a.x,a.y,r);
        shade.addColorStop(0,'#ffffff');shade.addColorStop(.4,a.species==='Si'?'#a5cee3':'#c8b6e8');
        shade.addColorStop(1,a.species==='Si'?'#5684a3':'#8969ae');
        dot(c,a.x,a.y,r,shade);
        if(a.selected)dot(c,a.x,a.y,r+4,null,'#ae6329');
      }
    });
    const keys=['vac_si','vac_c','anti_csi'],key=keys[s.index||0],series=d.thermo.formation_energies_ev[key],plot={x:565,y:145,w:355,h:290};
    this.text(['Silicon vacancy','Carbon vacancy','Carbon antisite'][s.index||0],565,106,24,ink);
    for(let e=3;e<=8;e++){const y=plot.y+(8-e)/5*plot.h;this.line([[plot.x,y],[920,y]],'#44607444');this.text(e,545,y+5,13,muted,'right');}
    ['L2','L3'].forEach((size,j)=>{
      const points=Object.values(series[size]).map((v,i)=>[plot.x+i*plot.w/4,plot.y+(8-v)/5*plot.h]);
      c.setLineDash(j?[]:[5,6]);this.line(points,j?'#6029ae':'#739dad',2);c.setLineDash([]);
      points.forEach(p=>dot(c,...p,4,j?'#6029ae':'#739dad'));
      this.text(size,825+j*55,480,17,j?'#6029ae':'#739dad');
    });
    this.text('K1',565,466,14);this.text('K5',920,466,14,muted,'right');this.text('Formation energy / eV',565,525,16);
    dot(c,83,502,5,'#5684a3');this.text('Si',96,507,16);
    dot(c,153,502,4,'#8969ae');this.text('C',166,507,16);
    dot(c,218,502,7,null,'#ae6329');this.text(index===2?'C on a Si site':'One vacant site',233,507,16);
    this.text('Single-defect schematic',60,575,16);
    this.pill('REGISTRY: 2 CLAIMS REJECTED',565,556,'#ae5429');
  }
  t115(s,t) {
    const d=this.d,c=this.c,index=s.index||0,frame=d.frames[index],surface=this.cache.heat;
    if(this.cache.frame!==index){
      const ctx=surface.getContext('2d'),img=ctx.createImageData(31,31);
      // One range across all 48 transient fields (observed extent 22.292–47.779°C).
      const stops=[[22,233,241,250],[28.5,173,209,228],[35,120,181,174],[41.5,241,199,125],[48,214,98,67]];
      frame.values.forEach((v,i)=>{
        let k=0;while(k<stops.length-2&&v>stops[k+1][0])k++;
        const a=stops[k],b=stops[k+1],f=clamp((v-a[0])/(b[0]-a[0])),j=((30-Math.floor(i/31))*31+i%31)*4;
        for(let z=0;z<3;z++)img.data[j+z]=a[z+1]+f*(b[z+1]-a[z+1]);img.data[j+3]=255;
      });
      ctx.putImageData(img,0,0);this.cache.frame=index;
    }
    c.save();c.shadowBlur=12;c.shadowColor='#34557820';c.imageSmoothingEnabled=true;c.drawImage(surface,75,95,435,435);c.restore();
    box(c,75,95,435,435,null,'#51857555',0);
    // Square mesh-body boundaries are schematic guides over the native node field.
    for(const v of [75,145])box(c,75+v,95+v,435-2*v,435-2*v,null,'#50865345',0);
    for(const sensor of d.sensors){
      const x=75+(Number(sensor.x_m)+.3)/.6*435,y=95+(.3-Number(sensor.y_m))/.6*435;
      dot(c,x,y,5,'#244d65','#ffffff');
      if(sensor.sensor_id==='TS-D'){dot(c,x,y,12,null,'#2b526c');this.text('TS-D',x-18,y-17,15,'#2b526c','right');}
    }
    this.text(`${round(frame.seconds/3600,1)} h`,78,575,23,ink);this.text('Recorded temperature field',510,575,16,muted,'right');
    this.text('Load → winding hot spot',583,135,22,ink);
    const values=d.derating.map(r=>[Number(r.load_pu),Number(r.hotspot_c)]);
    for(const v of [60,80,100]){const y=430-(v-50)*4;this.line([[590,y],[918,y]],'#53708244');this.text(`${v}°`,578,y+5,14,muted,'right');}
    const points=values.map(([x,y])=>[590+(x-.6)/.7*328,430-(y-50)*4]);
    this.line(points,'#ae6d29',2);points.forEach(p=>dot(c,...p,4,'#ae6d29'));
    this.text('0.6 pu',590,464,15);this.text('1.3 pu',918,464,15,muted,'right');
    this.pill(index<32?'CALIBRATION WINDOW':'HELD-OUT VALIDATION',582,514,index<32?'#ae6f29':'#33a37b');
    this.text('Fixed color scale: 22–48°C',582,575,16);
  }
  t124(s,t) {
    drawFPGA(this,s,t);
  }
  t141(s,t) {
    drawQuantum(this,s,t);
  }
  t026(s,t) {
    drawFinancial(this,s,t);
  }
  t030(s,t) {
    drawDNS(this,s,t);
  }
}
