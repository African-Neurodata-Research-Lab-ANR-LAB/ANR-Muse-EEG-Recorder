import './styles.css';
import { MuseClient } from 'muse-js';

const FS = 256;
const CHANNELS = ['TP9','AF7','AF8','TP10'];
const COLORS = ['#0b7a5a','#2563eb','#7c3aed','#d97706'];
const DISPLAY_MAX = FS * 8;

const state = {
  client:null, subs:[], connected:false, deviceName:null, battery:null,
  display:[[],[],[],[]], filters:[], recording:false, startedAt:null,
  stoppedAt:null, timer:null, selectedDuration:0,
  recorded:[{values:[],times:[]},{values:[],times:[]},{values:[],times:[]},{values:[],times:[]}],
  events:[], lastRawCsv:null, lastRawName:null,
  autoMarker:{
    enabled:false,
    name:'',
    intervalSec:0,
    timer:null,
    nextAtMs:null,
    count:0
  }
};
const $ = id => document.getElementById(id);

document.querySelector('#app').innerHTML = `
<div class="shell">
  <header class="header">
    <div class="header-main">
      <div class="brand"><div class="logo">ANR</div><div><h1>ANR Muse EEG Recorder</h1><p>Research EEG acquisition & raw-data export</p></div></div>
      <div class="header-actions"><span id="devicePill" class="pill">Muse disconnected</span><span id="recordPill" class="pill warn">Not recording</span></div>
    </div>
    <div class="contactbar"><span>African NeuroData Research Lab</span><a href="https://africanneurodataresearch.org/" target="_blank" rel="noreferrer">ANR Lab website ↗</a><a href="mailto:anrlab.ng@gmail.com">anrlab.ng@gmail.com</a><span>Research use only</span></div>
  </header>

  <nav class="tabs"><button class="tab active" data-view="setup">Setup</button><button class="tab" data-view="record">Record EEG</button></nav>

  <main>
    <section class="view active" id="setup">
      <div class="grid2">
        <article class="panel">
          <div class="eyebrow">DEVICE</div><h2>Connect Muse</h2>
          <p>Connect a Muse headset directly through Chrome or Edge Web Bluetooth. No synthetic EEG is shown.</p>
          <div class="actions"><button id="connectMuse" class="primary">Connect Muse</button><button id="disconnectMuse">Disconnect</button></div>
          <p id="connectMsg" class="download-status">Expected headset: Muse-2E53.</p>
        </article>
        <article class="panel">
          <div class="eyebrow">SESSION METADATA</div><h2>Research session</h2>
          <label>Session / participant code<input id="sessionCode" value="ANR-001" /></label>
          <label>Protocol<select id="protocol"><option>Resting state</option><option>Eyes open / eyes closed</option><option>Oddball</option><option>Stroop</option><option>N-back</option><option>Other research protocol</option></select></label>
          <label>Recording duration<select id="duration"><option value="0">Manual stop</option><option value="30">30 seconds</option><option value="60">60 seconds</option><option value="120">2 minutes</option><option value="300">5 minutes</option></select></label>
        </article>
      </div>
      <article class="panel research-only"><strong>Research use only.</strong> This recorder captures and exports Muse EEG for research. It is not a clinical EEG system or medical diagnostic tool.</article>
      <article class="panel"><div class="eyebrow">WORKFLOW</div><h3>Connect → record → raw CSV</h3><div class="auto-flow"><b>Connect Muse</b><span>→</span><b>Start recording</b><span>→</span><b>Stop / auto-stop</b><span>→</span><b>Raw EEG CSV downloads automatically</b></div></article>
    </section>

    <section class="view" id="record">
      <div class="sectionhead"><div><div class="eyebrow">LIVE ACQUISITION</div><h2>Muse EEG recording</h2><p>Four channels at 256 Hz. The live graph is filtered only for display; exported samples remain raw.</p></div><div class="actions"><button id="startRecording" class="primary">● Start recording</button><button id="stopRecording" class="danger">■ Stop recording</button></div></div>
      <div class="recordbar"><div><span class="eyebrow">ACQUISITION STATE</span><div id="recordState" class="record-state idle">LIVE VIEW ONLY — NOT SAVING</div></div><div class="record-stats"><span id="elapsed">00:00</span><span id="savedSamples">0 samples saved</span><span id="batteryText">Battery —</span></div></div>
      <div class="signal-legend"><span><i style="background:var(--tp9)"></i>TP9</span><span><i style="background:var(--af7)"></i>AF7</span><span><i style="background:var(--af8)"></i>AF8</span><span><i style="background:var(--tp10)"></i>TP10</span></div>
      <div class="chartbox"><canvas id="eegCanvas" width="1200" height="500"></canvas></div>
      <div class="grid2">
        <article class="panel">
          <h3>Electrode contact status</h3>
          <div class="qualitygrid">${CHANNELS.map((c,i)=>`<div id="q${i}" class="qbox q-none"><span>${c}</span><strong>No data</strong></div>`).join('')}</div>
        </article>

        <article class="panel marker-panel">
          <div class="sectionhead marker-head">
            <div>
              <h3>Event markers</h3>
              <p>Mark events manually or schedule a repeated marker during recording.</p>
            </div>
            <span id="autoMarkerBadge" class="marker-badge off">Auto marker off</span>
          </div>

          <div class="marker-config">
            <label>Marker name
              <input id="eventText" placeholder="e.g. Eyes closed, Stimulus, Rest block" />
            </label>
            <label>Auto-generate every
              <div class="seconds-field">
                <input id="markerInterval" type="number" min="1" step="1" value="30" />
                <span>seconds</span>
              </div>
            </label>
          </div>

          <div class="marker-actions">
            <button id="markEvent">＋ Mark now</button>
            <button id="toggleAutoMarker" class="secondary">Enable auto marker</button>
          </div>

          <div id="autoMarkerStatus" class="auto-marker-status">
            Set a marker name and interval, then enable auto marker.
          </div>

          <div id="eventList" class="timeline" style="margin-top:12px"><p class="download-status">No events marked.</p></div>
        </article>
      </div>
      <article id="downloadStatus" class="panel download-card"><strong>No completed recording yet.</strong><div class="download-status">When recording stops, the raw EEG CSV will be generated and downloaded automatically.</div><div class="actions" style="margin-top:10px"><button id="downloadRaw">Download last raw CSV again</button></div></article>
    </section>
  </main>
  <footer class="footer"><strong>African NeuroData Research Lab (ANR)</strong> • Muse EEG Recorder v1.1 • Research use only • <a href="https://africanneurodataresearch.org/" target="_blank" rel="noreferrer">africanneurodataresearch.org</a> • <a href="mailto:anrlab.ng@gmail.com">anrlab.ng@gmail.com</a></footer>
</div>`;

const eegCanvas = $('eegCanvas');
const ctx = eegCanvas.getContext('2d');
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
function showView(id){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.view===id));document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));}

class Biquad{
  constructor(type,fs,f0,q=.707){this.x1=this.x2=this.y1=this.y2=0;const w0=2*Math.PI*f0/fs,c=Math.cos(w0),s=Math.sin(w0),a=s/(2*q);let b0,b1,b2,a0,a1,a2;if(type==='highpass'){b0=(1+c)/2;b1=-(1+c);b2=(1+c)/2;a0=1+a;a1=-2*c;a2=1-a}else if(type==='lowpass'){b0=(1-c)/2;b1=1-c;b2=(1-c)/2;a0=1+a;a1=-2*c;a2=1-a}else{b0=1;b1=-2*c;b2=1;a0=1+a;a1=-2*c;a2=1-a}this.b0=b0/a0;this.b1=b1/a0;this.b2=b2/a0;this.a1=a1/a0;this.a2=a2/a0}
  process(x){const y=this.b0*x+this.b1*this.x1+this.b2*this.x2-this.a1*this.y1-this.a2*this.y2;this.x2=this.x1;this.x1=x;this.y2=this.y1;this.y1=y;return y}
}
function newFilters(){return [new Biquad('highpass',FS,1),new Biquad('notch',FS,50,28),new Biquad('lowpass',FS,40)]}
state.filters=[newFilters(),newFilters(),newFilters(),newFilters()];
function filter(ch,x){let y=x;for(const f of state.filters[ch])y=f.process(y);return y}
function pushBounded(arr,v,max=DISPLAY_MAX){arr.push(v);if(arr.length>max)arr.splice(0,arr.length-max)}
function percentileAbs(arr,p=.98){if(!arr.length)return 1;const a=arr.map(Math.abs).sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*p))]||1}

async function connectMuse(){
  if(!navigator.bluetooth){$('connectMsg').textContent='Web Bluetooth is unavailable. Use current Chrome/Edge from localhost.';return}
  await disconnectMuse();$('connectMsg').textContent='Choose your Muse in the Bluetooth window…';
  try{const client=new MuseClient();client.enableAux=false;client.enablePpg=false;await client.connect();await client.start();state.client=client;state.connected=true;state.deviceName=client.deviceName||'Muse';$('devicePill').textContent=`Muse: ${state.deviceName}`;$('devicePill').className='pill good';$('connectMsg').textContent=`Connected to ${state.deviceName}.`;state.subs.push(client.eegReadings.subscribe(onEEG));state.subs.push(client.telemetryData.subscribe(t=>{state.battery=t.batteryLevel;updateUI()}));state.subs.push(client.connectionStatus.subscribe(ok=>{if(!ok&&state.connected){state.connected=false;$('devicePill').textContent='Muse disconnected';$('devicePill').className='pill';if(state.recording)finishRecording('connection ended')}}));showView('record')}catch(err){$('connectMsg').textContent=`Muse connection failed/cancelled: ${err?.message||err}`}
}
async function disconnectMuse(){state.subs.forEach(s=>{try{s.unsubscribe()}catch{}});state.subs=[];if(state.client){try{await state.client.pause()}catch{}try{state.client.disconnect()}catch{}}state.client=null;state.connected=false;$('devicePill').textContent='Muse disconnected';$('devicePill').className='pill'}

function onEEG(reading){
  const ch=Number(reading.electrode);if(ch<0||ch>3)return;const samples=Array.from(reading.samples||[],Number).filter(Number.isFinite);if(!samples.length)return;const dt=1000/FS,start=Number(reading.timestamp)-(samples.length-1)*dt;
  for(let i=0;i<samples.length;i++){const raw=samples[i],ts=start+i*dt;pushBounded(state.display[ch],filter(ch,raw));if(state.recording){state.recorded[ch].values.push(raw);state.recorded[ch].times.push(ts)}}if(state.recording)updateUI();
}


function readAutoMarkerConfig(){
  const name=$('eventText').value.trim();
  const intervalSec=Number($('markerInterval').value);
  return {
    name,
    intervalSec:Number.isFinite(intervalSec)?intervalSec:0
  };
}
function updateAutoMarkerUI(){
  const badge=$('autoMarkerBadge'),button=$('toggleAutoMarker'),status=$('autoMarkerStatus');
  if(!badge||!button||!status)return;
  if(!state.autoMarker.enabled){
    badge.textContent='Auto marker off';
    badge.className='marker-badge off';
    button.textContent='Enable auto marker';
    status.textContent='Set a marker name and interval, then enable auto marker.';
    return;
  }
  badge.textContent='Auto marker enabled';
  badge.className='marker-badge on';
  button.textContent='Disable auto marker';

  if(state.recording && state.autoMarker.nextAtMs){
    const remaining=Math.max(0,(state.autoMarker.nextAtMs-Date.now())/1000);
    status.textContent=`“${state.autoMarker.name}” every ${state.autoMarker.intervalSec}s • next marker in ${remaining.toFixed(1)}s • ${state.autoMarker.count} generated`;
  }else{
    status.textContent=`Ready: “${state.autoMarker.name}” every ${state.autoMarker.intervalSec}s. Timing starts when EEG recording starts.`;
  }
}
function toggleAutoMarker(){
  if(state.autoMarker.enabled){
    stopAutoMarkerSchedule(false);
    state.autoMarker.enabled=false;
    updateAutoMarkerUI();
    return;
  }
  const cfg=readAutoMarkerConfig();
  if(!cfg.name){
    $('autoMarkerStatus').textContent='Enter a marker name before enabling auto marker.';
    $('eventText').focus();
    return;
  }
  if(!Number.isFinite(cfg.intervalSec)||cfg.intervalSec<1){
    $('autoMarkerStatus').textContent='Enter an interval of at least 1 second.';
    $('markerInterval').focus();
    return;
  }
  state.autoMarker.enabled=true;
  state.autoMarker.name=cfg.name;
  state.autoMarker.intervalSec=cfg.intervalSec;
  state.autoMarker.count=0;
  if(state.recording) startAutoMarkerSchedule();
  updateAutoMarkerUI();
}
function startAutoMarkerSchedule(){
  stopAutoMarkerSchedule(true);
  if(!state.autoMarker.enabled||!state.recording)return;
  const ms=Math.round(state.autoMarker.intervalSec*1000);
  state.autoMarker.nextAtMs=state.startedAt+ms;
  const tick=()=>{
    if(!state.recording||!state.autoMarker.enabled)return;
    addEvent(state.autoMarker.name,'auto');
    state.autoMarker.count++;
    state.autoMarker.nextAtMs=state.startedAt+(state.autoMarker.count+1)*ms;
    updateAutoMarkerUI();
  };
  state.autoMarker.timer=setInterval(tick,ms);
  updateAutoMarkerUI();
}
function stopAutoMarkerSchedule(preserveEnabled=true){
  if(state.autoMarker.timer)clearInterval(state.autoMarker.timer);
  state.autoMarker.timer=null;
  state.autoMarker.nextAtMs=null;
  if(!preserveEnabled)state.autoMarker.count=0;
  updateAutoMarkerUI();
}
function addEvent(label,source='manual'){
  if(!state.recording)return;
  const timestamp=Date.now();
  const event={
    timestamp,
    elapsed_s:(timestamp-state.startedAt)/1000,
    label,
    source
  };
  state.events.push(event);
  renderEvents();
  if(state.client){
    try{state.client.injectMarker(`${source==='auto'?'AUTO':'MANUAL'}: ${label}`,timestamp)}catch{}
  }
}

function startRecording(){
  if(!state.connected){$('connectMsg').textContent='Connect Muse before recording.';showView('setup');return}if(state.recording)return;
  state.recorded=[{values:[],times:[]},{values:[],times:[]},{values:[],times:[]},{values:[],times:[]}];state.events=[];state.startedAt=Date.now();state.stoppedAt=null;state.recording=true;state.selectedDuration=Number($('duration').value)||0;state.lastRawCsv=null;state.lastRawName=null;
  $('recordPill').textContent='● RECORDING';$('recordPill').className='pill warn';$('recordState').textContent='● RECORDING — RAW DATA IS BEING SAVED';$('recordState').className='record-state active';renderEvents();updateUI();
  if(state.autoMarker.enabled){
    const cfg=readAutoMarkerConfig();
    if(cfg.name&&cfg.intervalSec>=1){
      state.autoMarker.name=cfg.name;
      state.autoMarker.intervalSec=cfg.intervalSec;
      state.autoMarker.count=0;
      startAutoMarkerSchedule();
    }
  }
  if(state.selectedDuration>0){clearTimeout(state.timer);state.timer=setTimeout(()=>finishRecording('duration completed'),state.selectedDuration*1000)}
}
function stopRecording(){finishRecording('stopped by researcher')}
function finishRecording(reason){
  if(!state.recording)return;state.recording=false;state.stoppedAt=Date.now();clearTimeout(state.timer);state.timer=null;stopAutoMarkerSchedule(true);$('recordPill').textContent='Recording saved';$('recordPill').className='pill good';$('recordState').textContent='RECORDING COMPLETE — RAW CSV READY';$('recordState').className='record-state idle';const file=buildRawExport(reason);downloadText(file.name,file.csv,'text/csv');$('downloadStatus').innerHTML=`<strong>Raw EEG recording saved.</strong><div class="download-status">${file.name}<br/>${file.rows.toLocaleString()} synchronized EEG rows • ${((state.stoppedAt-state.startedAt)/1000).toFixed(1)} s</div><div class="actions" style="margin-top:10px"><button id="downloadRawAgain">Download raw CSV again</button></div>`;$('downloadRawAgain').addEventListener('click',downloadRaw);updateUI();
}

function markEvent(){
  if(!state.recording){
    $('autoMarkerStatus').textContent='Start EEG recording before adding a marker.';
    return;
  }
  const text=$('eventText').value.trim()||'Research marker';
  addEvent(text,'manual');
}
function renderEvents(){
  const box=$('eventList');
  if(!state.events.length){box.innerHTML='<p class="download-status">No events marked.</p>';return}
  box.innerHTML=state.events.slice().reverse().map(e=>`<div class="event">
    <div class="event-time"><strong>${e.elapsed_s.toFixed(2)} s</strong><span class="event-source ${e.source==='auto'?'auto':'manual'}">${e.source==='auto'?'AUTO':'MANUAL'}</span></div>
    <div>${esc(e.label)}</div>
    <small>${new Date(e.timestamp).toLocaleTimeString()}</small>
  </div>`).join('')
}

function contact(arr){const x=arr.slice(-FS);if(x.length<FS/2)return ['No data','q-none'];const rms=Math.sqrt(x.reduce((s,v)=>s+v*v,0)/x.length),pk=percentileAbs(x,.98);if(pk>220||rms>85)return ['Poor / noisy','q-noisy'];if(pk>120||rms>45)return ['Fair','q-fair'];if(rms<.35)return ['Check contact','q-fair'];return ['Good','q-clean']}
function draw(){const W=eegCanvas.width,H=eegCanvas.height,centers=[70,185,300,415];ctx.clearRect(0,0,W,H);ctx.fillStyle='#fbfcfe';ctx.fillRect(0,0,W,H);ctx.font='15px system-ui';for(let ch=0;ch<4;ch++){const y0=centers[ch];ctx.strokeStyle='#e1e6ed';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(78,y0);ctx.lineTo(W-14,y0);ctx.stroke();ctx.fillStyle='#657187';ctx.fillText(CHANNELS[ch],18,y0+5);const arr=state.display[ch],[q,cls]=contact(arr);const qel=$(`q${ch}`);if(qel){qel.className=`qbox ${cls}`;qel.querySelector('strong').textContent=q}if(arr.length<2)continue;const scale=Math.max(25,Math.min(250,percentileAbs(arr.slice(-FS*4),.97)*1.25)),n=Math.min(arr.length,DISPLAY_MAX),st=arr.length-n;ctx.strokeStyle=COLORS[ch];ctx.lineWidth=1.35;ctx.beginPath();for(let i=0;i<n;i++){const x=78+(i/(n-1))*(W-96),y=y0-(arr[st+i]/scale)*43;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();ctx.fillStyle='#8a94a4';ctx.font='11px system-ui';ctx.fillText(`±${Math.round(scale)} µV`,W-70,y0-37);ctx.font='15px system-ui'}if(!state.connected){ctx.fillStyle='#7a8493';ctx.font='21px system-ui';ctx.textAlign='center';ctx.fillText('Connect Muse to begin live EEG',W/2,H/2);ctx.textAlign='left'}requestAnimationFrame(draw)}
draw();

function updateUI(){const saved=state.recorded.reduce((n,c)=>n+c.values.length,0);$('savedSamples').textContent=`${saved.toLocaleString()} channel samples saved`;const elapsed=state.startedAt?(state.recording?Date.now():state.stoppedAt||Date.now())-state.startedAt:0,sec=Math.max(0,Math.floor(elapsed/1000));$('elapsed').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;$('batteryText').textContent=Number.isFinite(state.battery)?`Battery ${Math.round(state.battery)}%`:'Battery —';updateAutoMarkerUI()}
setInterval(updateUI,500);

function nearestEventLabel(ts){let best=null,bestDt=Infinity;for(const e of state.events){const d=Math.abs(e.timestamp-ts);if(d<bestDt&&d<=1000/FS*3){best=e;bestDt=d}}return best?`${best.source==='auto'?'AUTO':'MANUAL'}: ${best.label}`:''}
function csvEscape(v){if(v==null)return '';const s=String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function safeName(s){return String(s||'ANR').replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,60)||'ANR'}
function buildRawExport(reason){
  const n=Math.min(...state.recorded.map(c=>c.values.length));const rows=['timestamp_ms,iso_time,sample_index,session_code,protocol,stop_reason,TP9_uV,AF7_uV,AF8_uV,TP10_uV,event_marker'];
  for(let i=0;i<n;i++){const ts=state.recorded[0].times[i];rows.push([ts,new Date(ts).toISOString(),i,$('sessionCode').value,$('protocol').value,reason,state.recorded[0].values[i],state.recorded[1].values[i],state.recorded[2].values[i],state.recorded[3].values[i],nearestEventLabel(ts)].map(csvEscape).join(','))}
  const stamp=new Date().toISOString().replace(/[:.]/g,'-'),base=`ANR_${safeName($('sessionCode').value)}_${stamp}`,name=`${base}_RAW_EEG.csv`,csv=rows.join('\n');state.lastRawCsv=csv;state.lastRawName=name;return {name,csv,rows:n};
}
function downloadText(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)}
function downloadRaw(){if(state.lastRawCsv)downloadText(state.lastRawName,state.lastRawCsv,'text/csv')}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

$('connectMuse').addEventListener('click',connectMuse);
$('disconnectMuse').addEventListener('click',disconnectMuse);
$('startRecording').addEventListener('click',startRecording);
$('stopRecording').addEventListener('click',stopRecording);
$('markEvent').addEventListener('click',markEvent);
$('toggleAutoMarker').addEventListener('click',toggleAutoMarker);
$('eventText').addEventListener('input',()=>{if(state.autoMarker.enabled&&!state.recording){state.autoMarker.name=$('eventText').value.trim();updateAutoMarkerUI()}});
$('markerInterval').addEventListener('input',()=>{if(state.autoMarker.enabled&&!state.recording){const v=Number($('markerInterval').value);if(v>=1)state.autoMarker.intervalSec=v;updateAutoMarkerUI()}});
$('downloadRaw').addEventListener('click',downloadRaw);
updateAutoMarkerUI();
