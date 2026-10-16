(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const data = window.COWORKING_DATA;
  const aero = data.aerodynamics, quantum = data['quantum-compilation'];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (n, digits=3) => Number(n).toFixed(digits);
  const title = s => s.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  const colors = ['#2563eb','#ae6955','#298c80'];
  const svgText = (x,y,text,size=12,color='#526278',extra='') => `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" ${extra}>${escape(text)}</text>`;
  const svgWrap = (content,w=520,h=270) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Recorded scientific evidence">${content}</svg>`;
  const pathFrom = (rows, x, y) => rows.map((row,i)=>(i?'L':'M')+x(row,i).toFixed(2)+','+y(row,i).toFixed(2)).join(' ');
  const sources = Object.create(null);
  let current='aerodynamics', candidate='K17', cellIndex=0, time=0, playing=false, frame=0, previous=0;
  let workspaceRequest=0, workspaceFiles=[], fileIndex=0;

  const studies = {
    aerodynamics: {
      eyebrow:'AERODYNAMIC DESIGN / NATIVE SU2', title:'Nine CFD evaluations. One design freeze.',
      summary:'Compare three duct candidates under cruise and crosswind conditions. Use the recorded engineering limits to select a configuration for prototyping.',
      brief:'Determine whether a duct design can be frozen for prototyping. Respect the staged catalog, operating conditions, solver policy and selection rules; deliver a consistent native evidence package.',
      metrics:[[`${aero.catalog.length} × ${aero.conditions.length}`,'candidate–condition evaluations'],[String(aero.certification.iterations),'certification iterations'],[`${aero.feasibleCount} / ${aero.catalog.length}`,'feasible candidates'],[fmt(aero.score),'recorded task score']],
      evidenceTitle:'See why K17 was selected.', evidenceLead:'Compare the complete candidate set, including the infeasible design, and inspect the recorded convergence history.',
      deliveryTitle:'A design freeze with its native evidence.', deliveryCopy:'Configuration, mesh, restart solution, history, candidate comparison and design freeze.',
      figures:[['duct-geometry.png','Candidate profiles from the staged mesh data.'],['trade-study.png','Recorded candidate trade-offs.'],['convergence.png','Certification convergence history.'],['freeze-metrics.png','Frozen configuration against its engineering limits.']],
      steps:[
        ['Study the brief','Three designs, one governed study.','The scientist supplies candidate meshes, flight conditions and the rules for a valid design freeze.','3 candidates · 3 conditions · 4 engineering limits','geometry'],
        ['Run native tools','Execute the full CFD matrix.','The agent drives SU2 for every candidate–condition pair and retains the numerical outputs.','SU2 · INC_EULER · FGMRES · CFL 20','runs'],
        ['Check constraints','Keep the failed candidate visible.','K42 exceeds the crossload and pressure recovery limits. K17 and K88 remain feasible across the study.','K42: 0.198 N crossload against a 0.180 N limit','constraints'],
        ['Inspect convergence','Trace all 414 iterations.','Inspect the native certification history for K17 at CROSS_12. The log pressure residual reaches −8.010.','K17 × CROSS_12 · recorded history.csv','convergence'],
        ['Deliver the decision','Freeze K17 for prototyping.','The selected design stays within all four limits. The delivered package links the decision to its configuration, mesh and solver outputs.','FREEZE_FOR_PROTOTYPE · K17','freeze']
      ]
    },
    'quantum-compilation': {
      eyebrow:'QUANTUM COMPUTING / QISKIT + CIRQ', title:'A compilation claim, independently checked.',
      summary:'Reproduce a five-by-five compilation study from the supplied case package, compare 150 claimed values and locate the three cells whose claims do not reproduce.',
      brief:'Rebuild approximate-compilation results for five workloads using the supplied IBM Torino calibration data. Check each claimed field against fixed tolerances and deliver a reproducibility verdict.',
      metrics:[[String(quantum.verdict.total_cells),'compilation cells'],[String(quantum.discrepancyRows),'claimed values compared'],[String(quantum.verdict.mismatched_cells),'mismatched cells'],[fmt(quantum.score),'recorded task score']],
      evidenceTitle:'Find the three mismatched cells.', evidenceLead:'Claim agreement and circuit qualification are different checks. This matrix marks agreement with the supplied claims.',
      deliveryTitle:'A reproducibility verdict you can inspect.', deliveryCopy:'Native circuit artifacts, reproduced metrics, claim comparisons, failure strata and the final verdict.',
      figures:[['claim-matrix.png','Claim comparison from the supplied handoff.'],['fidelity-landscape.png','Process infidelity across approximation settings.'],['source-circuit.png','Source workload structure for Anisotropic Relay.']],
      steps:[
        ['Study the brief','Start from the supplied claims.','Five workloads and five approximation degrees define the study. Calibration data and a reproduction profile establish the comparison.','5 workloads × 5 approximation degrees','workloads'],
        ['Run native tools','Rebuild the compilation evidence.','The agent produces native Qiskit and Cirq artifacts and records gate count, depth, infidelity, duration and estimated success.','QPY · OpenQASM 3 · Cirq JSON','compile'],
        ['Measure the trade-off','Less circuit cost, more error.','Each workload is evaluated from exact synthesis to stronger approximation. The reproduced values expose the fidelity trade-off.','Approximation degree: 1.000 → 0.940','infidelity'],
        ['Compare the claims','Three mismatches remain.','One process infidelity value, one circuit depth and one qualification flag disagree with the supplied claims.','25 cells · 150 compared fields · 3 mismatches','claims'],
        ['Deliver the decision','Report a claim that does not reproduce.','The final verdict preserves the discrepancies and links them to the native circuit evidence and complete comparison tables.','CLAIM_NOT_REPRODUCED · 1 qualification disagreement','verdict']
      ]
    }
  };

  function geometrySvg(selected='K17', width=580, height=230) {
    const sy=500, sx=width-90, cy=height*.54;
    let s=svgText(28,23,'RECORDED WALL PROFILES',10);
    s+=`<path d="M35 ${cy}H${width-25}" stroke="#dbe3ef" stroke-dasharray="4 5"/>`;
    Object.entries(aero.heroDucts).forEach(([key,rows],i)=>{
      const active=key===selected;
      s+=`<path d="${pathFrom(rows,p=>45+p[0]*sx,p=>cy-p[1]*sy)}" fill="${active?'#e4edfc':'none'}" fill-opacity=".7" stroke="${colors[i]}" stroke-width="${active?2.5:1.2}" opacity="${active?1:.38}"/>`;
    });
    s+=svgText(35,height-20,'0',10)+svgText(width-45,height-20,'1.0',10)+svgText(width/2,height-20,'Normalized axial coordinate',10,'#526278','text-anchor="middle"');
    return s;
  }
  function matrixSvg(marked=true, w=520,h=270,progress=1) {
    const startX=140, startY=54, dx=(w-160)/5,dy=(h-85)/5;
    let s=svgText(18,20,'CLAIM AGREEMENT / 25 CELLS',10);
    quantum.approximations.forEach((a,i)=>s+=svgText(startX+i*dx+dx/2,startY-14,a.replace('APPROX-','A'),10,'#526278','text-anchor="middle"'));
    quantum.workloads.forEach((work,i)=>{
      const label=title(work).split(' ');
      label.forEach((word,j)=>s+=svgText(18,startY+i*dy+12+j*11,word,9));
      quantum.approximations.forEach((a,j)=>{
        const mismatch=marked&&quantum.mismatchRows.some(r=>r.workload_id===work&&r.approximation_id===a);
        const revealed=i*5+j<Math.ceil(progress*25), fill=revealed?(mismatch?'#fae3dd':'#deeee7'):'#edf1f7';
        const x=startX+j*dx,y=startY+i*dy;
        s+=`<rect x="${x}" y="${y}" width="${dx-6}" height="${dy-6}" rx="4" fill="${fill}"/>`;
        if(revealed&&marked) s+=svgText(x+(dx-6)/2,y+(dy-6)/2+4,mismatch?'×':'✓',13,mismatch?'#ae4637':'#167560','text-anchor="middle"');
      });
    });
    return s;
  }
  function lineChart(xs,ys,{w=580,h=260,xLabel='Iteration',yLabel='log₁₀ rms[P]',minY=-8.5,maxY=-3,target=-8,selected=null}={}) {
    const left=55, right=w-22,top=32,bottom=h-43,minX=Math.min(...xs),maxX=Math.max(...xs);
    const x=v=>left+(v-minX)/(maxX-minX||1)*(right-left),y=v=>bottom-(v-minY)/(maxY-minY)*(bottom-top);
    let s=svgText(left,15,yLabel,11);
    for(let i=0;i<=4;i++) {
      const val=minY+(maxY-minY)*i/4, py=y(val);
      s+=`<path d="M${left} ${py}H${right}" stroke="#e6ebf3"/>`+svgText(left-8,py+4,fmt(val,1),10,'#64748b','text-anchor="end"');
    }
    if(target!==null)s+=`<path d="M${left} ${y(target)}H${right}" stroke="#7a96bf" stroke-dasharray="5 4"/>`;
    [minX,(minX+maxX)/2,maxX].forEach(v=>s+=svgText(x(v),bottom+20,Number.isInteger(v)?v:fmt(v,3),10,'#64748b','text-anchor="middle"'));
    s+=svgText((left+right)/2,h-5,xLabel,10,'#64748b','text-anchor="middle"');
    s+=`<path d="${ys.map((v,i)=>(i?'L':'M')+x(xs[i]).toFixed(2)+','+y(v).toFixed(2)).join(' ')}" fill="none" stroke="#2563eb" stroke-width="2"/>`;
    if(selected!==null) {
      const i=Math.min(selected,ys.length-1);
      s+=`<path d="M${x(xs[i])} ${top}V${bottom}" stroke="#9fb4d4" stroke-dasharray="3 5"/><circle cx="${x(xs[i])}" cy="${y(ys[i])}" r="4" fill="#2563eb" stroke="white" stroke-width="2"/>`;
    }
    return s;
  }
  function renderHero() {
    const shape=aero.duct;
    let s=svgText(25,30,'01 / AERODYNAMICS',10,'#2563eb')+svgText(290,30,'02 / QUANTUM COMPUTING',10,'#2563eb');
    s+=`<path d="M260 50V238" stroke="#d4dfef"/><path d="${pathFrom(shape,p=>28+p[0]*205,p=>126-p[1]*460)}" fill="#e0eafa" stroke="#2563eb" stroke-width="2"/>`;
    s+=svgText(27,216,'K17',25,'#0f172a')+svgText(27,239,'Selected for prototyping',11);
    quantum.matrix.forEach((r,i)=>{
      const fail=quantum.mismatchRows.some(m=>m.workload_id===r.workload_id&&m.approximation_id===r.approximation_id);
      s+=`<rect x="${290+(i%5)*38}" y="${60+Math.floor(i/5)*25}" width="30" height="17" rx="3" fill="${fail?'#edb9ac':'#cce4de'}"/>`;
    });
    s+=svgText(290,216,'3 / 25',25,'#0f172a')+svgText(290,239,'Cells with claim mismatches',11);
    $('hero-art').innerHTML=s;
  }
  function renderCandidate(id) {
    candidate=id;
    const c=aero.pareto.find(x=>x.candidate_id===id), meta=aero.catalog.find(x=>x.candidate_id===id);
    $('geometry-chart').innerHTML=geometrySvg(id);
    document.querySelectorAll('[data-candidate]').forEach(b=>{b.classList.toggle('active',b.dataset.candidate===id);b.setAttribute('aria-pressed',String(b.dataset.candidate===id));});
    $('geometry-note').textContent=`${id}: ${fmt(meta.installed_mass_g,0)} g installed mass · ${fmt(meta.base_electrical_power_w,0)} W base power. Profiles use the supplied mesh coordinates.`;
    $('constraint-title').textContent=`${id} / Constraint check`;
    const metrics=[['Net thrust margin',c.minimum_net_thrust_margin_n,aero.limits.minNetThrustMarginN,'N',true,3],['Crossload',c.maximum_crossload_n,aero.limits.maxCrossloadN,'N',false,3],['Electrical power',c.maximum_electrical_power_w,aero.limits.maxElectricalPowerW,'W',false,2],['Pressure recovery index',c.maximum_pressure_recovery_index,aero.limits.maxPressureRecoveryIndex,'',false,3]];
    $('constraints').innerHTML=metrics.map(([label,v,limit,unit,lower,digits])=>{
      const pass=lower?v>=limit:v<=limit;
      return `<div class="metric"><div class="metric-head"><span>${label}</span><strong>${fmt(v,digits)} ${unit}</strong></div><div class="metric-track"><div class="metric-fill${pass?'':' fail'}" style="width:${Math.min(100,v/(limit*1.3)*100)}%"></div></div><div class="small">${pass?'Within limit':'Outside limit'} · ${lower?'minimum':'maximum'} ${limit} ${unit}</div></div>`;
    }).join('');
    const decision=$('candidate-decision');decision.classList.toggle('fail',!c.feasible);
    decision.textContent=id==='K17'?'Selected. Feasible under all four limits, with lower peak power than K88.':id==='K42'?'Infeasible. Crossload and pressure recovery exceed the engineering limits.':'Feasible. Peak power is higher than the selected K17 configuration.';
    $('candidate-table').innerHTML=table(['Candidate','Condition','Iterations','Thrust margin / N','Crossload / N','Power / W','Recovery index'],c.condition_results.map(r=>[id,r.condition_id,r.iterations,fmt(r.net_thrust_margin_n),fmt(r.crossload_n),fmt(r.electrical_power_w,2),fmt(r.pressure_recovery_index)]),`${id} / All recorded operating conditions`);
  }
  function table(headers,rows,caption='') {return `<table>${caption?`<caption>${escape(caption)}</caption>`:''}<thead><tr>${headers.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>'<tr>'+row.map(c=>`<td>${escape(c)}</td>`).join('')+'</tr>').join('')}</tbody></table>`;}
  function renderResidual(index) {
    const i=Number(index);$('residual-chart').innerHTML=lineChart(aero.hist.iters,aero.hist.rmsP,{selected:i});
    $('residual-readout').textContent=`Iteration ${aero.hist.iters[i]} / ${aero.certification.iterations-1} · log₁₀ rms[P] ${fmt(aero.hist.rmsP[i],6)}`;
  }
  function renderQuantumMatrix() {
    $('claim-matrix').innerHTML='<span></span>'+quantum.approximations.map(a=>`<span class="column-label">${a.replace('APPROX-','A')}</span>`).join('')+quantum.workloads.map((work,i)=>`<span class="row-label">${title(work)}</span>`+quantum.approximations.map((a,j)=>{
      const fail=quantum.mismatchRows.some(r=>r.workload_id===work&&r.approximation_id===a),idx=i*5+j;
      return `<button data-cell="${idx}" class="${fail?'mismatch':''}" aria-label="${escape(title(work))}, ${a}: ${fail?'claim mismatch':'claims match'}" aria-pressed="${idx===cellIndex}">${fail?'×':'✓'}</button>`;
    }).join('')).join('');
    renderCell(cellIndex);
  }
  function renderCell(index) {
    cellIndex=Number(index);const r=quantum.matrix[cellIndex];
    document.querySelectorAll('[data-cell]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.cell)===cellIndex)));
    const miss=quantum.mismatchRows.find(x=>x.workload_id===r.workload_id&&x.approximation_id===r.approximation_id);
    const fields=[['Process infidelity',Number(r.process_infidelity).toPrecision(6)],['Native two-qubit gates',r.native_two_qubit_count],['Circuit depth',r.depth],['Serial duration',`${r.serial_duration_ns} ns`],['Estimated success',fmt(r.estimated_success,6)],['Qualifies',r.qualifies==='true'?'Yes':'No']];
    $('cell-details').innerHTML=`<h4>${escape(title(r.workload_id))} / ${r.approximation_id}</h4><dl>${fields.map(([k,v])=>`<dt>${k}</dt><dd>${escape(v)}</dd>`).join('')}</dl><p class="chart-note">${miss?`${escape(miss.field)} mismatch: claimed ${escape(miss.claimed_value)}, reproduced ${escape(miss.reproduced_value)}.`:'All six claims agree within the supplied comparison tolerances.'}</p>`;
  }
  function renderInfidelity(workload) {
    const rows=quantum.matrix.filter(x=>x.workload_id===workload);
    $('infidelity-chart').innerHTML=lineChart(rows.map(r=>Number(r.approximation_degree)),rows.map(r=>Number(r.process_infidelity)),{w:480,h:280,xLabel:'Approximation degree',yLabel:'Process infidelity',minY:0,maxY:.55,target:null});
  }
  function filmVisual(type,progress) {
    if(type==='geometry')return svgWrap(geometrySvg('K17',520,270));
    if(type==='runs') {
      let s=svgText(22,25,'THE COMPLETE CFD STUDY',11);
      ['CRUISE','CROSS_06','CROSS_12'].forEach((c,i)=>s+=svgText(170+i*112,62,c,10,'#526278','text-anchor="middle"'));
      aero.pareto.forEach((c,i)=>{
        s+=svgText(28,103+i*58,c.candidate_id,17,'#0f172a');
        c.condition_results.forEach((r,j)=>{
          const done=i*3+j<Math.ceil(progress*9),x=121+j*112,y=79+i*58;
          s+=`<rect x="${x}" y="${y}" width="97" height="44" rx="5" fill="${done?'#e0eafb':'#edf1f7'}"/>`+svgText(x+48,y+26,done?`${r.iterations} iters`:'···',11,done?'#2563eb':'#9aabc2','text-anchor="middle"');
        });
      });return svgWrap(s);
    }
    if(type==='constraints') {
      let s=svgText(22,25,'CANDIDATES / FEASIBILITY',11);
      aero.pareto.forEach((c,i)=>{
        const y=51+i*65;
        s+=`<rect x="22" y="${y}" width="476" height="51" rx="6" fill="${c.feasible?'#e6f2ec':'#f9e9e5'}"/>`+svgText(39,y+31,c.candidate_id,18,'#0f172a')+svgText(133,y+31,c.feasible?'Within all four limits':'Crossload + recovery exceed limits',12,c.feasible?'#167560':'#ae4637');
      });return svgWrap(s);
    }
    if(type==='convergence') {
      const n=Math.max(2,Math.ceil(progress*414));
      return svgWrap(lineChart(aero.hist.iters.slice(0,n),aero.hist.rmsP.slice(0,n),{w:520,h:270,selected:n-1}));
    }
    if(type==='freeze') {
      let s=svgText(25,28,'DESIGN FREEZE / RECORDED RESULT',11,'#167560')+svgText(25,87,'K17',50,'#0f172a')+svgText(160,84,'× CROSS_12',21);
      const rows=[['Minimum thrust margin',`${fmt(aero.freeze.minNetThrustMarginN)} N`],['Maximum crossload',`${fmt(aero.freeze.maxCrossloadN)} N`],['Maximum power',`${fmt(aero.freeze.maxElectricalPowerW,2)} W`],['Pressure recovery index',fmt(aero.freeze.maxPressureRecoveryIndex)]];
      rows.forEach(([label,value],i)=>s+=svgText(25,134+i*32,label,13)+svgText(495,134+i*32,value,15,'#0f172a','text-anchor="end"'));
      return svgWrap(s);
    }
    if(type==='workloads'||type==='compile')return svgWrap(matrixSvg(false,520,270,type==='compile'?progress:1));
    if(type==='infidelity') {
      const rows=quantum.matrix.filter(r=>r.workload_id==='PHASED_EXCHANGE');
      return svgWrap(lineChart(rows.map(r=>Number(r.approximation_degree)),rows.map(r=>Number(r.process_infidelity)),{w:520,h:270,xLabel:'Approximation degree / Phased Exchange',yLabel:'Reproduced process infidelity',minY:0,maxY:.55,target:null}));
    }
    if(type==='claims')return svgWrap(matrixSvg(true,520,270,progress));
    return svgWrap(svgText(25,30,'REPRODUCIBILITY VERDICT',11,'#ae4637')+svgText(25,88,'Claim not reproduced.',29,'#0f172a')+svgText(25,150,'25',42,'#2563eb')+svgText(192,150,'3',42,'#ae4637')+svgText(365,150,'1',42,'#ae4637')+svgText(25,179,'compiled cells',12)+svgText(192,179,'mismatched cells',12)+svgText(365,179,'qualification flip',12)+svgText(25,234,'Native circuits + comparison tables + verdict',13));
  }
  function renderFilm(t) {
    time=Math.max(0,Math.min(30,Number(t)));
    const idx=Math.min(4,Math.floor(time/6)),step=studies[current].steps[idx],progress=Math.min(1,(time-idx*6)/4+.05);
    $('film-kicker').textContent=`0${idx+1} / ${step[0].toUpperCase()}`;$('film-title').textContent=step[1];$('film-body').textContent=step[2];$('film-caption').textContent=step[3];
    $('film-visual').innerHTML=filmVisual(step[4],progress);
    $('film-seek').value=time;$('film-time').textContent=`00:${String(Math.floor(time)).padStart(2,'0')} / 00:30`;
    if(!playing){$('film-play').textContent=time>=30?'Replay':'Play';$('film-play').setAttribute('aria-label',time>=30?'Replay workflow':'Play workflow replay');}
    document.querySelectorAll('[data-chapter]').forEach(b=>{const active=Number(b.dataset.chapter)===idx;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'step':'false');});
  }
  function stop() {playing=false;cancelAnimationFrame(frame);$('film-play').textContent=time>=30?'Replay':'Play';$('film-play').setAttribute('aria-label',time>=30?'Replay workflow':'Play workflow replay');}
  function tick(now) {if(!playing)return;const dt=previous?(now-previous)/1000:0;previous=now;renderFilm(time+dt);if(time>=30){stop();return;}frame=requestAnimationFrame(tick);}
  function play() {if(playing){stop();return;}if(time>=30)renderFilm(0);playing=true;previous=0;$('film-play').textContent='Pause';$('film-play').setAttribute('aria-label','Pause workflow replay');frame=requestAnimationFrame(tick);}

  function renderFiles() {
    const query=$('file-search').value.trim().toLowerCase();
    const files=workspaceFiles.map((f,i)=>({f,i})).filter(({f})=>(f.path+' '+f.title).toLowerCase().includes(query));
    $('file-list').innerHTML=files.length?files.map(({f,i})=>`<button data-file="${i}" class="${fileIndex===i?'active':''}" aria-pressed="${fileIndex===i}">${escape(f.name)}</button>`).join(''):'<p class="small">No matching files.</p>';
  }
  function selectFile(index) {
    fileIndex=Number(index);const f=workspaceFiles[fileIndex];if(!f)return;
    $('file-preview').innerHTML=`<h3>${escape(f.path)}</h3><p>${escape(f.title||'')} · ${Number(f.bytes).toLocaleString('en-US')} bytes</p><pre>${escape(f.text||f.preview||'This large binary input is represented by its metadata in the handoff.')}</pre><p class="small">SHA-256: ${escape(f.sha256||'Not supplied')}</p>`;renderFiles();
  }
  async function loadWorkspace(name) {
    const request=++workspaceRequest;workspaceFiles=[];$('file-list').innerHTML='<p class="small">Loading input files…</p>';$('file-preview').innerHTML='<p class="small">Loading the scientific handoff…</p>';
    try {
      if(!sources[name]) {const response=await fetch(`assets/data/${name}/workspace.json`);if(!response.ok)throw Error('Input files unavailable');sources[name]=(await response.json()).files;}
      if(request!==workspaceRequest)return;
      workspaceFiles=sources[name];fileIndex=0;selectFile(0);
    } catch(error) {if(request!==workspaceRequest)return;$('file-list').innerHTML='';$('file-preview').innerHTML=`<p>Input preview could not be loaded. <a href="assets/data/${name}/workspace.json" download>Download the input-file listing</a>.</p>`;}
  }
  function setStudy(name,{url=true}={}) {
    if(!studies[name])name='aerodynamics';stop();current=name;
    const s=studies[name],d=data[name],isAero=name==='aerodynamics';
    document.querySelectorAll('[data-study]').forEach(b=>{const active=b.dataset.study===name;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    $('study').setAttribute('aria-labelledby','tab-'+name);
    ['eyebrow','title','summary','brief'].forEach(key=>$('study-'+key).textContent=s[key]);
    $('study-tools').textContent=`TOOLS / ${d.software}`;
    $('stats').innerHTML=s.metrics.map(([value,label])=>`<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
    $('replay-meta').textContent=`Recorded run: ${d.durationMin} min · ${d.exchanges} model exchanges`;
    $('replay-label').textContent=`${isAero?'AERODYNAMICS':'QUANTUM COMPUTING'} / WORKFLOW REPLAY`;
    $('evidence-title').textContent=s.evidenceTitle;$('evidence-lead').textContent=s.evidenceLead;
    $('aerodynamics-evidence').hidden=!isAero;$('quantum-evidence').hidden=isAero;
    $('chapters').innerHTML=s.steps.map((step,i)=>`<button data-chapter="${i}" aria-label="Chapter ${i+1}: ${step[0]}">0${i+1} / ${step[0]}</button>`).join('');
    $('figure-gallery').innerHTML=s.figures.map(([file,caption])=>`<figure><a href="assets/images/${name}/${file}" target="_blank" rel="noopener"><img src="assets/images/${name}/${file}" alt="${escape(caption)}" loading="lazy"></a><figcaption>${escape(caption)}</figcaption></figure>`).join('');
    $('delivery-title').textContent=s.deliveryTitle;$('delivery-copy').textContent=s.deliveryCopy;
    $('download-artifacts').href=`assets/data/${name}/research-artifacts.zip`;$('download-data').href=`assets/data/${name}/run-data.json`;
    $('run-details').textContent=`${d.model} · ${d.harness} · ${d.runDate} · ${d.durationMin} minutes · ${d.exchanges} model exchanges. One recorded attempt (${isAero?'t093':'t141'}, attempt-01). Recorded task score: ${fmt(d.score)} out of 1.000, as supplied in the run-data handoff. Scores refer to these individual runs. The supplied summary values are preserved; listed output hashes have been checked against the extracted artifacts.`;
    $('hashes').innerHTML=Object.entries(d.hashes).map(([file,hash])=>`<div><strong>${escape(file)}</strong><br><code>${escape(hash)}</code></div>`).join('');
    $('file-search').value='';loadWorkspace(name);renderFilm(0);
    if(url){const u=new URL(location.href);u.searchParams.set('study',name);history.replaceState(null,'',u);}
  }

  document.querySelectorAll('[data-study]').forEach((b,i,buttons)=>{
    b.addEventListener('click',()=>setStudy(b.dataset.study));
    b.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight'||event.key==='ArrowLeft')next=1-i;else if(event.key==='Home')next=0;else if(event.key==='End')next=1;else return;event.preventDefault();buttons[next].focus();setStudy(buttons[next].dataset.study);});
  });
  document.querySelectorAll('[data-candidate]').forEach(b=>b.addEventListener('click',()=>renderCandidate(b.dataset.candidate)));
  $('iteration').addEventListener('input',e=>renderResidual(e.target.value));
  $('claim-matrix').addEventListener('click',e=>{const b=e.target.closest('[data-cell]');if(b)renderCell(b.dataset.cell);});
  $('workload').innerHTML=quantum.workloads.map(w=>`<option value="${w}">${title(w)}</option>`).join('');
  $('workload').addEventListener('change',e=>renderInfidelity(e.target.value));
  $('film-play').addEventListener('click',play);$('film-restart').addEventListener('click',()=>{stop();renderFilm(0);});
  $('film-seek').addEventListener('input',e=>{stop();renderFilm(e.target.value);});
  $('chapters').addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b){stop();renderFilm(Number(b.dataset.chapter)*6);}});
  $('file-search').addEventListener('input',renderFiles);$('file-list').addEventListener('click',e=>{const b=e.target.closest('[data-file]');if(b)selectFile(b.dataset.file);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();$('overview-video').pause();}});
  $('overview-video').addEventListener('play',stop);
  document.querySelector('.video-details').addEventListener('toggle',e=>{if(!e.target.open)$('overview-video').pause();});
  window.addEventListener('popstate',()=>setStudy(new URLSearchParams(location.search).get('study'),{url:false}));
  renderHero();renderCandidate(candidate);renderResidual(413);renderQuantumMatrix();renderInfidelity(quantum.workloads[0]);
  $('freeze-summary').textContent=`Minimum thrust margin: ${fmt(aero.freeze.minNetThrustMarginN)} N. Peak electrical power: ${fmt(aero.freeze.maxElectricalPowerW,2)} W. All four engineering limits satisfied.`;
  $('mismatch-table').innerHTML=table(['Workload','Setting','Field','Claimed','Reproduced','Absolute difference'],quantum.mismatchRows.map(r=>[title(r.workload_id),r.approximation_id,r.field,r.claimed_value,r.reproduced_value,r.absolute_delta===''?'Boolean disagreement':Number(r.absolute_delta).toPrecision(4)]),'The three recorded claim mismatches');
  setStudy(new URLSearchParams(location.search).get('study'),{url:false});
})();
