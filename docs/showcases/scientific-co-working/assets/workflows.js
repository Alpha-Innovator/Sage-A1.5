import { CASES } from './casebook.js?v=coworking-cases-4';
import { Visuals } from './visuals.js?v=coworking-science-3';
import { thumbnail } from './thumbnails.js?v=coworking-light-2';
import { readout } from './readouts.js?v=coworking-light-2';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const scene = new Visuals($('scene'));
// Keep the complete 30-unit choreography; the default walkthrough takes 12 seconds.
const SCENE_DURATION = 30;
const DURATION = 12;
const CHAPTER_DURATION = DURATION / 5;
const sceneTime = () => time * SCENE_DURATION / DURATION;
let playbackRate = Number($('playback-speed').value);
const cache = new Map();
let current = CASES[0], data, state = {}, time = 0, playing = false, visible = false;
let frame = 0, previous = 0, generation = 0, lastChapter = -1, controller;
let lastReadout = '';
const setText = (id, text) => { $(id).textContent = text; };
const chapter = () => Math.min(4, Math.floor(time / CHAPTER_DURATION));

$('case-tabs').innerHTML = CASES.map((item, i) => `<button class="case-tab" id="tab-${item.id}" role="tab" aria-selected="false" aria-controls="case-panel" tabindex="-1" data-case="${item.id}" style="--card-accent:${item.accent}"><div class="case-preview"><span class="case-number">${String(i+1).padStart(2,'0')}</span>${thumbnail(item.icon)}</div><span class="case-name">${escape(item.short)}<i>↗</i></span></button>`).join('');
$('case-select').innerHTML = CASES.map((item, i) => `<option value="${item.id}">${String(i+1).padStart(2,'0')} · ${escape(item.short)}</option>`).join('');

function automatic() {
  if(state.explore)return;
  const cue = sceneTime();
  switch(current.id) {
    case 't101': state.mode=cue<9?'placed':cue<18?'clock':'routed';break;
    case 't188': state.index=Math.min(2,Math.floor(cue/10));break;
    case 't093': state.mode=cue<9?'profiles':cue<15?'mesh':'flow';break;
    case 't100': state.mode=cue<12||cue>=26?'page':'objects';break;
    case 't134': state.index=Math.min(2,Math.floor(cue/10));break;
    case 't115': state.index=Math.min(47,Math.floor(cue/SCENE_DURATION*48));break;
    case 't124': state.mode=cue<10?'logic':cue<18?'memory':'all';break;
    case 't141': state.index=Math.max(0,Math.min(2,Math.floor((cue-18)/4)));break;
    case 't026': state.index=Math.min(17,Math.floor(cue/SCENE_DURATION*18));break;
    case 't030': state.mode=cue<18?'probes':'fragments';break;
  }
}
function controlButtons(key, choices) {
  return choices.map(([value,label])=>`<button data-key="${key}" data-value="${value}" aria-pressed="false">${escape(label)}</button>`).join('');
}
function controls() {
  const choices={
    t101:['mode',[['placed','Original placement'],['clock','Clock tree'],['routed','Routed ECO']]],
    t188:['index',[[0,'EMS peak'],[1,'Fire + rescue'],[2,'All-hazards surge']]],
    t093:['mode',[['profiles','Three candidates'],['mesh','Native mesh'],['flow','K17 flow']]],
    t100:['mode',[['page','Released page'],['objects','Object cleanup']]],
    t134:['index',[[0,'Si vacancy'],[1,'C vacancy'],[2,'C antisite']]],
    t124:['mode',[['all','All tiles'],['logic','Logic'],['memory','Memory'],['io','I/O']]],
    t141:['index',[[0,'Infidelity'],[1,'Depth'],[2,'Qualification']]],
    t030:['mode',[['probes','Probe observations'],['fragments','Recovered fragments']]]
  };
  const range=(label,max)=>`<label>${label}<input id="explore-range" type="range" min="0" max="${max}" step="1" value="0" aria-label="${label}"><output id="range-output"></output></label>`;
  $('scene-controls').innerHTML=choices[current.id]?controlButtons(...choices[current.id]):current.id==='t115'?range('Recorded time',47):range('Select request',17);
}
function updateControls() {
  if(current.id==='t093')setText('scene-label',({profiles:'THREE CANDIDATES / RECORDED PROFILES',mesh:'K17 / NATIVE MESH',flow:'K17 / CROSS_12 / STEADY FLOW'})[state.mode]);
  $('scene-controls').querySelectorAll('[data-key]').forEach(el=>el.setAttribute('aria-pressed',String(String(state[el.dataset.key])===el.dataset.value)));
  if($('explore-range')){
    $('explore-range').value=state.index;
    setText('range-output',current.id==='t115'?`${(data.frames[state.index].seconds/3600).toFixed(1)} h`:`${state.index+1} / 18`);
  }
  const values=JSON.stringify(readout(data,state));
  if(values!==lastReadout){
    $('scene-readout').innerHTML=JSON.parse(values).map(([label,value])=>`<div><span>${escape(label)}</span><strong>${escape(value)}</strong></div>`).join('');
    lastReadout=values;
  }
}
function update() {
  if(!data)return;
  automatic();
  const n=chapter(),step=current.steps[n];
  $('seek').value=time;
  setText('clock',`00:${String(Math.floor(time)).padStart(2,'0')} / 00:${DURATION}`);
  $('play').innerHTML=playing?'Ⅱ <span>Pause</span>':'▶ <span>Play workflow</span>';
  $('play').setAttribute('aria-label',playing?'Pause workflow':'Play workflow');
  $('explore-badge').hidden=!state.explore;
  $('stage').style.setProperty('--progress',`${time/DURATION*100}%`);
  setText('stage-label',state.explore?'EXPLORE THE RESULT':time===DURATION?'WALKTHROUGH COMPLETE':'RECORDED WORKFLOW');
  setText('agent-state',state.explore?'Exploring the recorded result':time===DURATION?'End of recorded walkthrough':playing?'Following the recorded run':'Recorded execution');
  if(n!==lastChapter){
    setText('chapter-index',`${String(n+1).padStart(2,'0')} / 05`);
    setText('chapter-title',step.title);setText('chapter-text',step.text);setText('artifact-name',step.file);
    document.querySelectorAll('.agent-step').forEach((el,i)=>{
      el.classList.toggle('active',i===n);el.classList.toggle('done',i<n);
      el.setAttribute('aria-current',String(i===n));el.querySelector('.step-dot').textContent=i<n?'✓':String(i+1).padStart(2,'0');
    });
    lastChapter=n;
  }
  updateControls();scene.draw(state,sceneTime(),n);
}
function schedule() { if(!frame&&data&&visible&&!document.hidden)frame=requestAnimationFrame(tick); }
function tick(now) {
  frame=0;
  if(playing&&previous)time=Math.min(DURATION,time+Math.min(.08,(now-previous)/1000)*playbackRate);
  previous=now;
  if(time>=DURATION)playing=false;
  update();
  if(playing)schedule();else previous=0;
}
function pause() { playing=false;previous=0;update(); }
function explore(key,value) { playing=false;previous=0;time=DURATION;state.explore=true;state[key]=key==='index'?Number(value):value;update(); }

async function select(id,push=true) {
  const item=CASES.find(c=>c.id===id)||CASES[0],request=++generation;
  controller?.abort();controller=new AbortController();
  if(frame)cancelAnimationFrame(frame);frame=0;previous=0;
  current=item;data=null;time=0;playing=false;lastChapter=-1;state={mode:'all',index:0,explore:false};
  lastReadout='';$('scene-readout').replaceChildren();
  document.documentElement.style.setProperty('--accent',item.accent);
  $('case-panel').setAttribute('aria-busy','true');$('case-panel').setAttribute('aria-labelledby',`tab-${item.id}`);
  $('loading').hidden=false;$('load-error').hidden=true;$('details').open=false;
  ['play','restart','seek'].forEach(key=>$(key).disabled=true);
  $('case-tabs').querySelectorAll('button').forEach(el=>{const selected=el.dataset.case===item.id;el.setAttribute('aria-selected',String(selected));el.tabIndex=selected?0:-1;});
  $('case-select').value=item.id;
  const tab=$(`tab-${item.id}`),tabs=$('case-tabs');
  if(tabs.scrollWidth>tabs.clientWidth)tabs.scrollTo({left:tab.offsetLeft-tabs.offsetLeft-2,behavior:reduced.matches?'instant':'smooth'});
  $('detailed-evidence').hidden=!['t093','t141'].includes(item.id);
  $('detailed-evidence').href=`two-study-evidence.html?study=${item.slug}#evidence`;
  setText('case-domain',`${String(CASES.indexOf(item)+1).padStart(2,'0')} / ${item.domain}`);
  for(const [element,value] of Object.entries({'case-title':item.title,'case-brief':item.brief,'toolchain':item.toolchain,'scene-label':item.scene,'scene-counter':'','outcome-title':item.result,'outcome-copy':item.copy,'case-background':item.background,'case-approach':item.approach,'interaction-hint':item.hint}))setText(element,value);
  $('case-deliverables').innerHTML=item.deliverables.map(([label,description])=>`<li><strong>${escape(label)}</strong> — ${escape(description)}</li>`).join('');
  $('scene').setAttribute('aria-label',`${item.short}. ${item.hint} Equivalent controls are below the visual.`);
  $('metrics').innerHTML=item.metrics.map(([value,label])=>`<div class="metric"><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join('');
  $('agent-steps').innerHTML=item.steps.map((s,i)=>`<button class="agent-step" data-step="${i}" aria-label="Chapter ${i+1}: ${escape(s.title)}"><span class="step-dot">${i+1}</span><span class="step-copy"><strong>${escape(s.title)}</strong><small>${escape(s.tool)}</small></span></button>`).join('');
  $('next-case').setAttribute('aria-label',`Next case: ${CASES[(CASES.indexOf(item)+1)%CASES.length].short}`);
  controls();
  if(push){const url=new URL(location.href);url.searchParams.set('study',item.slug);history.pushState(null,'',url);}
  try {
    let bundle=cache.get(id);
    if(!bundle){
      const response=await fetch(`assets/professional/${id}.json`,{signal:controller.signal});
      if(!response.ok)throw new Error(`Display data could not be loaded (${response.status}).`);
      const payload=await response.json(),images={};
      if(payload.image){const image=new Image();image.src=payload.image;await image.decode();images.main=image;}
      bundle={payload,images};cache.set(id,bundle);
    }
    if(request!==generation)return;
    data=bundle.payload;scene.setData(data,bundle.images);
    $('loading').hidden=true;$('case-panel').setAttribute('aria-busy','false');
    ['play','restart','seek'].forEach(key=>$(key).disabled=false);
    time=reduced.matches?DURATION:0;playing=!reduced.matches;
    update();schedule();
  }catch(error){
    if(request!==generation||error.name==='AbortError')return;
    $('loading').hidden=true;$('case-panel').setAttribute('aria-busy','false');
    setText('load-error',`${error.message} Refresh to retry this workflow.`);$('load-error').hidden=false;
  }
}

$('case-tabs').addEventListener('click',event=>{const tab=event.target.closest('[data-case]');if(tab)select(tab.dataset.case);});
$('case-select').addEventListener('change',event=>select(event.target.value));
$('case-tabs').addEventListener('keydown',event=>{
  const tabs=[...$('case-tabs').querySelectorAll('button')],i=tabs.indexOf(event.target),columns=matchMedia('(max-width: 650px)').matches?1:5;
  if(i<0)return;
  const next={ArrowRight:(i+1)%10,ArrowLeft:(i+9)%10,ArrowDown:(i+columns)%10,ArrowUp:(i+10-columns)%10,Home:0,End:9}[event.key];
  if(next===undefined)return;event.preventDefault();tabs[next].focus();select(tabs[next].dataset.case);
});
$('agent-steps').addEventListener('click',event=>{const el=event.target.closest('[data-step]');if(!el||!data)return;time=Number(el.dataset.step)*CHAPTER_DURATION+.01;state.explore=false;pause();});
$('play').addEventListener('click',()=>{if(!data)return;if(playing)pause();else{if(time>=DURATION)time=0;state.explore=false;playing=true;previous=0;update();schedule();}});
$('restart').addEventListener('click',()=>{if(!data)return;time=0;state.explore=false;playing=!reduced.matches;previous=0;lastChapter=-1;update();schedule();});
$('seek').addEventListener('input',event=>{const value=Number(event.target.value);time=value;state.explore=false;pause();});
$('playback-speed').addEventListener('change',event=>{playbackRate=Number(event.target.value);previous=0;});
$('next-case').addEventListener('click',()=>select(CASES[(CASES.indexOf(current)+1)%CASES.length].id));
$('scene-controls').addEventListener('click',event=>{const el=event.target.closest('[data-key]');if(el&&data)explore(el.dataset.key,el.dataset.value);});
$('scene-controls').addEventListener('input',event=>{if(event.target.id==='explore-range'&&data)explore('index',event.target.value);});
$('scene').addEventListener('pointermove',event=>{
  if(!data)return;const h=scene.hit(event);$('scene').style.cursor=h?'pointer':'default';setText('scene-counter',h?.label||'');
});
$('scene').addEventListener('pointerleave',()=>setText('scene-counter',''));
$('scene').addEventListener('click',event=>{const hit=scene.hit(event);if(hit?.index!==undefined)explore('index',hit.index);});
$('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}
  catch{setText('scene-counter','Full screen is unavailable in this browser.');}
});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit full screen':'Enter full screen');update();});
new ResizeObserver(()=>{if(data)update();}).observe($('scene'));
new IntersectionObserver(entries=>$('case-tabs').classList.toggle('in-view',entries[0].isIntersecting),{threshold:.02}).observe($('case-tabs'));
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;previous=0;if(visible)schedule();else if(frame){cancelAnimationFrame(frame);frame=0;}},{threshold:.08}).observe($('stage'));
document.addEventListener('visibilitychange',()=>{previous=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
reduced.addEventListener('change',()=>{if(reduced.matches){time=DURATION;state.explore=false;pause();}});
function selectURL() {
  const value=new URL(location.href).searchParams.get('study');
  const found=CASES.find(c=>c.slug===value||c.id===value);
  $('retired-note').hidden=!['gravitational-waves','astronomy','earth-observation'].includes(value);
  select((found||CASES[0]).id,false);
}
window.addEventListener('popstate',selectURL);
selectURL();
