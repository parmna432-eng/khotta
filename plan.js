// Plan engine: builds each student's schedule from their chosen subjects, teachers and start hour (saved in this browser)
(function(){
const C=window.CATALOG, ORDER=Object.keys(C);
const PREF='plan6sci-prefs', DONE='plan6sci-v3', NOTICE='plan6sci-notice-alt', HARD='plan6sci-hard';
const DONE_BEFORE=window.PLAN_DONE_BEFORE||{}; // lectures already watched before the plan started, per subject (main teacher only)
const START=new Date(2026,10,1), SLOT=145, REVIEW_DAYS=6;
const HOURS=[7,8,9,10];
const COLOR={math:'--math',phys:'--phys',bio:'--bio',chem:'--chem',eng:'--eng',isl:'--isl',ar:'--ar',rev:'--rev'};
const RANK={math:0,phys:1,chem:2,bio:3,ar:4,eng:5,isl:6}; // hardest first in the day
const DN=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const MN=['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول'];
const ar=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
const dur=m=>m>=60?ar(Math.floor(m/60))+'س'+(m%60?' '+ar(m%60)+'د':''):ar(m)+'د';
const PL=id=>'https://www.youtube.com/playlist?list='+id, V=(v,l)=>'https://www.youtube.com/watch?v='+v+'&list='+l;
const kk=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
const dstr=d=>ar(d.getDate())+'/'+ar(d.getMonth()+1)+'/'+ar(d.getFullYear());
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mainOf=s=>C[s].teachers.find(t=>t.main)||C[s].teachers[0];

function loadPrefs(){
  const p=get(PREF)||{};
  const out={subjects:{},teacher:{},hour:HOURS.includes(p.hour)?p.hour:10};
  for(const s of ORDER){out.subjects[s]=p.subjects&&s in p.subjects?!!p.subjects[s]:true;
    const t=p.teacher&&p.teacher[s];out.teacher[s]=C[s].teachers.some(x=>x.id===t)?t:mainOf(s).id}
  if(p.shift&&p.shift.from)out.shift={from:p.shift.from,mode:p.shift.mode==='fit'?'fit':'extend'};
  if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(p.exam||''))out.exam=p.exam;
  return out;
}
let prefs=loadPrefs();
const savePrefs=()=>put(PREF,prefs);

/* ---------- daily timeline from the chosen start hour ---------- */
function clock(m){m=((m%1440)+1440)%1440;if(m===0)return'١٢:٠٠ منتصف الليل';const h=Math.floor(m/60),mi=m%60,h12=h%12||12;return ar(h12)+':'+ar(String(mi).padStart(2,'0'))+(h<12?'ص':'م')}
function timeline(){
  const b=prefs.hour*60;
  const T=[[b-45,b,'الكعدة، فطور خفيف، ترتيب مكان الدراسة'],[b,b+150,0],[b+150,b+180,'استراحة قصيرة'],[b+180,b+330,1],[b+330,b+405,'غداء، صلاة، استراحة'],
    [b+405,b+555,2],[b+555,b+600,'مشي أو رياضة خفيفة'],[b+600,b+720,'practice'],[b+720,b+780,'عشاء، صلاة، استراحة'],[b+780,b+825,'review'],[b+825,b-45-480+1440,'وقت حر وراحة قبل النوم'],[b-45-480+1440,b-45+1440,'نوم']];
  return T;
}
const range=(a,b)=>clock(a)+' – '+clock(b);

/* ---------- schedule ---------- */
const parseKey=k=>{const [y,m,d]=String(k).split('-').map(Number);return y?new Date(y,m-1,d):null};
// today can be overridden with ?today=2026-11-05 to preview how the plan looks later on
const TODAY=(()=>{const q=new URLSearchParams(location.search).get('today');const d=q&&parseKey(q);const t=d||new Date();t.setHours(0,0,0,0);return t})();
// hand out each subject's sessions day by day from `from` so subjects stay spread evenly, then split its lectures over them by video time
function allocate(act,from,Q,need){
  const left={},tot={};for(const s of act){left[s]=need[s];tot[s]=Q[s].reduce((a,x)=>a+x.m,0)}
  const days=[];const d=new Date(from);
  while(act.some(s=>left[s]>0)){
    const fri=d.getDay()===5,k=fri?2:3,pick=[];
    if(fri&&left.isl>0)pick.push('isl');
    const cand=act.filter(s=>left[s]>0&&!pick.includes(s)).sort((a,b)=>(left[b]/need[b])-(left[a]/need[a])||left[b]-left[a]);
    for(const s of cand){if(pick.length>=k)break;pick.push(s)}
    pick.forEach(s=>left[s]--);
    const blocks=pick.sort((a,b)=>RANK[a]-RANK[b]).map(s=>({s}));
    if(fri)blocks.push({s:'rev',plain:'مراجعة الأسبوع: ارجع لملخصات كل مادة وحل ١٠ أسئلة وزارية منها'});
    days.push({d:new Date(d),blocks});d.setDate(d.getDate()+1);
  }
  const slots={},used={},cur={};
  days.forEach(x=>x.blocks.forEach(b=>{if(b.s!=='rev')slots[b.s]=(slots[b.s]||0)+1}));
  for(const x of days)for(const b of x.blocks){if(b.s==='rev')continue;const s=b.s,q=Q[s],i=used[s]||0;used[s]=i+1;
    const target=tot[s]*(i+1)/slots[s];let p=cur[s]||0,acc=q.slice(0,p).reduce((a,y)=>a+y.m,0);const out=[];
    while(p<q.length&&(i+1===slots[s]||acc+q[p].m/2<=target)){out.push(q[p]);acc+=q[p].m;p++}cur[s]=p;b.lecs=out}
  return days;
}
function build(){
  const act=ORDER.filter(s=>prefs.subjects[s]);
  const T={},Q={},tot={};
  for(const s of act){
    const t=C[s].teachers.find(x=>x.id===prefs.teacher[s])||mainOf(s);T[s]=t;
    Q[s]=[];t.lists.forEach((l,li)=>l.v.forEach(v=>Q[s].push({v:v[0],t:v[1],m:v[2],li})));
    if(t.main&&DONE_BEFORE[s])Q[s].splice(0,DONE_BEFORE[s]);
    tot[s]=Q[s].reduce((a,x)=>a+x.m,0);
  }
  // sessions per subject come from the main teacher, so picking an alternate teacher keeps the same days and only swaps the lectures
  const need={};for(const s of act){const mt=mainOf(s).lists.reduce((a,l)=>a+l.v.reduce((x,v)=>x+v[2],0),0);need[s]=Math.max(1,Math.round(mt/SLOT))}
  let days=allocate(act,START,Q,need);
  const sh=prefs.shift,R=sh&&parseKey(sh.from);
  if(R&&R>START){
    // re-plan from R: past days keep only what was ticked, everything not ticked moves forward in the same order
    const studyEnd=days[days.length-1].d;
    const past=days.filter(x=>x.d<R).map(x=>({d:x.d,past:true,blocks:x.blocks.map(b=>b.s==='rev'?b:{s:b.s,lecs:b.lecs.filter(l=>done['v'+l.v])}).filter(b=>b.s==='rev'||b.lecs.length)}));
    const RQ={},rem={};for(const s of act){RQ[s]=Q[s].filter(l=>!done['v'+l.v]);rem[s]=RQ[s].reduce((a,x)=>a+x.m,0)}
    const live=act.filter(s=>rem[s]>0),need2={};
    let slot=SLOT;
    if(sh.mode==='fit'){let n=0;for(const x=new Date(R);x<=studyEnd;x.setDate(x.getDate()+1))n+=x.getDay()===5?2:3;
      if(n>0)slot=Math.max(SLOT,live.reduce((a,s)=>a+rem[s],0)/n)}
    for(const s of live)need2[s]=Math.max(1,Math.round(need[s]*rem[s]/tot[s]*SLOT/slot));
    days=past.concat(allocate(live,R,RQ,need2));
  }
  const d=new Date(days[days.length-1].d);d.setDate(d.getDate()+1);
  // final review week: subjects with the most lectures marked hard come first, and each review block lists those lectures
  const hardOf={};for(const s of act)hardOf[s]=Q[s].filter(l=>hard['v'+l.v]);
  const rb=s=>({s,plain:'مراجعة '+C[s].name+' كاملة وحل أسئلة وزارية',hard:hardOf[s]});
  const rv=[];const pairs=act.slice().sort((a,b)=>hardOf[b].length-hardOf[a].length);for(let i=0;i<REVIEW_DAYS-1;i++){const a=pairs[(i*2)%pairs.length],b=pairs[(i*2+1)%pairs.length];
    const bl=[rb(a)];if(b&&b!==a)bl.push(rb(b));rv.push(bl)}
  rv.push([{s:'rev',plain:'امتحان شامل لنفسك: ورقة وزارية لكل مادة بوقت محدد، وسجّل أخطاءك'}]);
  for(const bl of rv){days.push({d:new Date(d),blocks:bl,review:true});d.setDate(d.getDate()+1)}
  const slots={};days.forEach(x=>!x.past&&x.blocks.forEach(b=>{if(b.lecs)slots[b.s]=(slots[b.s]||0)+1}));
  const ids=[],idsBy={};for(const s of act){idsBy[s]=Q[s].map(l=>'v'+l.v);ids.push(...idsBy[s])}
  return {act,T,days,tot,slots,ids,idsBy};
}

/* ---------- render ---------- */
let done={};try{done=JSON.parse(localStorage.getItem(DONE)||'{}')}catch(e){}
const saveDone=()=>{try{localStorage.setItem(DONE,JSON.stringify(done))}catch(e){}};
let hard=get(HARD)||{};
const FLAG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>';
let P=null,allIds=[],todayEl=null,filter='all';
const $=id=>document.getElementById(id);

function render(){
  P=build();const {act,T,days}=P;allIds=[];todayEl=null;
  const studyEnd=days.filter(x=>!x.review).slice(-1)[0];
  $('hTitle').textContent='خطة السادس العلمي — من '+dstr(START)+' إلى '+dstr(days[days.length-1].d);
  let L=0,M=0;days.forEach(x=>x.blocks.forEach(b=>(b.lecs||[]).forEach(l=>{L++;M+=l.m})));
  $('sDays').textContent=ar(days.length);$('sLect').textContent=ar(L);$('sHrs').textContent=ar(Math.round(M/60));

  // teachers table with the alternate-teacher choice
  $('tBody').innerHTML=ORDER.map(s=>{const on=prefs.subjects[s],t=C[s].teachers.find(x=>x.id===prefs.teacher[s])||mainOf(s);
    const opts=C[s].teachers.map(x=>`<option value="${x.id}"${x.id===t.id?' selected':''}>${esc(x.name)}${x.main?' (رئيسي)':' (بديل)'}</option>`).join('');
    return `<tr class="${on?'':'off'}"><td><span class="tag" style="--c:var(${COLOR[s]})"><span class="dot"></span>${C[s].name}</span>${on?'':'<br><span class="alt">محذوفة من جدولك</span>'}</td>
      <td><label class="vh" for="tsel-${s}">مدرس ${C[s].name}</label><select class="tsel" id="tsel-${s}" data-s="${s}"${on?'':' disabled'}>${opts}</select></td>
      <td>${t.lists.map(l=>`<a href="${PL(l.id)}" target="_blank" rel="noopener">${esc(l.t)}</a> <span class="alt">(${esc(l.y)} · ${ar(l.v.length)})</span>`).join('<br>')}</td></tr>`}).join('');
  document.querySelectorAll('.tsel').forEach(el=>el.onchange=()=>{prefs.teacher[el.dataset.s]=el.value;savePrefs();rerender('تغيّر مدرس '+C[el.dataset.s].name+'، والجدول تحدّث')});

  // subjects editor
  $('subjBox').innerHTML=ORDER.map(s=>`<label class="sch"><input type="checkbox" data-s="${s}"${prefs.subjects[s]?' checked':''}> <span class="dot" style="--c:var(${COLOR[s]})"></span>${C[s].name} <span class="alt">(${ar(Math.round(C[s].teachers.find(x=>x.id===prefs.teacher[s]).lists.reduce((a,l)=>a+l.v.reduce((y,v)=>y+v[2],0),0)/60))} ساعة)</span></label>`).join('');

  // day timeline
  const TL=timeline();
  $('ttBody').innerHTML=TL.map(([a,b,w])=>{const st=typeof w==='number'||w==='practice'||w==='review';
    const txt=typeof w==='number'?'الجلسة '+ar(w+1)+': المادة '+['الأولى بجدول اليوم (الأصعب، وذهنك صافي)','الثانية','الثالثة'][w]:w==='practice'?'الجلسة ٤: حل تمارين الكتاب والأسئلة الوزارية لمحاضرات اليوم':w==='review'?'مراجعة ملخص اليوم، وتشوف جدول باجر':w;
    return `<tr class="${st?'study':'free'}"><td>${w==='نوم'?clock(a):range(a,b)}</td><td>${txt}</td></tr>`}).join('');
  $('hourBox').innerHTML=HOURS.map(h=>`<button type="button" class="hbtn" data-h="${h}" aria-pressed="${h===prefs.hour}">${ar(h)} الصبح</button>`).join('');
  document.querySelectorAll('.hbtn').forEach(b=>b.onclick=()=>{prefs.hour=+b.dataset.h;savePrefs();rerender('صار يومك يبدي الساعة '+ar(prefs.hour)+' الصبح')});
  const SESS=[0,1,2].map(i=>{const x=TL.find(r=>r[2]===i);return range(x[0],x[1])});
  const PR=TL.find(r=>r[2]==='practice'),RV=TL.find(r=>r[2]==='review');

  // subject summary
  $('weekKey').innerHTML=act.map(s=>`<div class="wk"><b style="color:var(${COLOR[s]})">${C[s].name}</b>${esc(T[s].name)}<br>${ar(P.slots[s]||0)} جلسة · ${ar(Math.round(P.tot[s]/60))} ساعة فيديو</div>`).join('')||'<p class="note">ما اخترت أي مادة. افتح "حدّث المواد" وأشّر المواد اللي تدرسها.</p>';

  // days
  const host=$('plan');host.innerHTML='';const today=TODAY;let weekEl=null,wn=0;
  days.forEach((p,i)=>{
    if(i===0||p.d.getDay()===6||(p.review&&!days[i-1].review)){weekEl=document.createElement('div');weekEl.className='week';const h=document.createElement('h3');
      if(p.review)h.innerHTML='<span class="phase">أسبوع المراجعة النهائية</span>';else{wn++;h.textContent='الأسبوع '+ar(wn)}weekEl.appendChild(h);host.appendChild(weekEl)}
    const mins=p.blocks.reduce((a,b)=>a+(b.lecs||[]).reduce((x,l)=>x+l.m,0),0);
    const day=document.createElement('div');day.className='day'+(p.d.getDay()===5?' fri':'')+(p.past?' past':'');
    const isToday=p.d.getTime()===today.getTime();if(isToday){day.classList.add('today');todayEl=day}
    day.innerHTML=`<div class="date"><span class="dn">${DN[p.d.getDay()]}</span><span class="dd">${ar(p.d.getDate())}</span><span class="dm">${MN[p.d.getMonth()]}</span>${mins?`<span class="hrs">${dur(mins)} فيديو</span>`:''}${isToday?'<span class="tlabel">اليوم</span>':''}</div><div class="subjs"></div>`;
    const box=day.querySelector('.subjs');
    p.blocks.forEach((b,j)=>{
      const el=document.createElement('div');el.className='subj';el.dataset.s=b.s;el.style.setProperty('--c','var('+COLOR[b.s]+')');
      const nm=b.s==='rev'?'مراجعة':C[b.s].name,tm=`<span class="tm">${SESS[j]||SESS[2]}</span>`;
      if(b.plain){const id='p'+kk(p.d)+'-'+j;allIds.push(id);
        el.innerHTML=`<div class="subj-h">${tm}</div><div class="lec"><input type="checkbox" id="${id}"><label for="${id}" class="plain"><span class="subj-h"><span class="s">${nm}</span></span> <span class="t">${esc(b.plain)}</span></label><span></span></div>`;check(el.querySelector('.lec'),id);
        if(b.hard&&b.hard.length){const t=T[b.s],h=document.createElement('div');h.className='hard-list';
          h.innerHTML=`<span class="hl-t">${FLAG}ابدأ بالمحاضرات اللي علّمتها صعبة (${ar(b.hard.length)})</span>`+b.hard.map(l=>`<a href="${V(l.v,t.lists[l.li].id)}" target="_blank" rel="noopener">${esc(l.t)}</a>`).join('');el.appendChild(h)}}
      else{const t=T[b.s],lists=[...new Set(b.lecs.map(l=>l.li))].map(li=>t.lists[li]);const bm=b.lecs.reduce((a,l)=>a+l.m,0);
        const speed=bm>190?' · شغّلها بسرعة ١.٥':bm>150?' · شغّلها بسرعة ١.٢٥':'';
        el.innerHTML=`<div class="subj-h">${tm}<span class="s">${nm}</span><span class="w">${lists.map(l=>esc(l.t)).join(' ← ')} · ${esc(lists[0]&&lists[0].by||t.name)}${speed}</span></div>`;
        b.lecs.forEach(l=>{const L=t.lists[l.li],id='v'+l.v;allIds.push(id);const r=document.createElement('div');r.className='lec';
          r.innerHTML=`<input type="checkbox" id="${id}" aria-label="أنجزت ${esc(l.t)}"><label for="${id}"><a href="${V(l.v,L.id)}" target="_blank" rel="noopener">${esc(l.t)}</a></label><span class="m">${dur(l.m)}</span><button type="button" class="flag" aria-pressed="${!!hard[id]}" aria-label="صعبة عليّ: ${esc(l.t)}" title="صعبة عليّ">${FLAG}</button>`;
          check(r,id);r.querySelector('.flag').onclick=()=>flagHard(id);el.appendChild(r)})}
      box.appendChild(el)});
    if(p.past){const el=document.createElement('div');el.className='subj extra';el.dataset.s='extra';
      el.innerHTML=`<div class="subj-h"><span class="w">${p.blocks.some(b=>b.lecs)?'هذا اللي خلصته بهذا اليوم. الباقي انتقل لقدام.':'ما خلصت محاضرات بهذا اليوم، ومحاضراته انتقلت لقدام.'}</span></div>`;box.appendChild(el);weekEl.appendChild(day);return}
    [[PR,'حل تمارين الكتاب والأسئلة الوزارية لمحاضرات اليوم'],[RV,'مراجعة ملخص اليوم وتشوف جدول باجر']].forEach(([r,w])=>{const el=document.createElement('div');el.className='subj extra';el.dataset.s='extra';
      el.innerHTML=`<div class="subj-h"><span class="tm">${range(r[0],r[1])}</span><span class="w">${w}</span></div>`;box.appendChild(el)});
    weekEl.appendChild(day)});

  // filters
  const fl=$('filters');fl.innerHTML='';if(!act.includes(filter))filter='all';
  [['all','الكل'],...act.map(s=>[s,C[s].name])].forEach(([s,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',s===filter);
    b.onclick=()=>{filter=s;fl.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));applyFilter()};fl.appendChild(b)});
  applyFilter();
  const jump=$('jump');if(!todayEl&&today<START)todayEl=host.querySelector('.day');
  jump.hidden=!todayEl;jump.onclick=()=>todayEl&&todayEl.scrollIntoView({behavior:'smooth',block:'center'});

  window.PLAN={plan:days,S:Object.fromEntries(ORDER.map(s=>[s,{name:C[s].name}])),kk,timeline:TL};
  progress();exam();updateLate();mBanner();document.dispatchEvent(new CustomEvent('planbuilt'));
}

/* ---------- falling behind: offer to re-plan from today or tomorrow ---------- */
let lateManual=false;
function lateList(){return P.days.filter(x=>!x.review&&!x.past&&x.d<TODAY).flatMap(x=>x.blocks.flatMap(b=>(b.lecs||[]).filter(l=>!done['v'+l.v])))}
function updateLate(){
  const box=$('lateBox'),late=lateList(),sh=prefs.shift;
  if(!late.length&&!lateManual&&!sh){box.hidden=true;return}
  box.hidden=false;const mins=late.reduce((a,l)=>a+l.m,0);
  $('lateTitle').textContent=late.length?'عندك '+ar(late.length)+' محاضرة متأخرة من الأيام اللي فاتت ('+dur(mins)+' فيديو)':sh&&!lateManual?'رتبت جدولك من '+dstr(parseKey(sh.from)):'أعد ترتيب جدولك';
  $('lateText').textContent=late.length||lateManual?'اختار شلون نرتبها: كل اللي ما أشّرته ينتقل لقدام بنفس ترتيبه، واللي خلصته يبقى بمكانه.':'يخلص جدولك هسه '+dstr(P.days[P.days.length-1].d)+'. إذا تريد ترجع للترتيب الأصلي اضغط تراجع.';
  $('lateActs').hidden=!(late.length||lateManual);$('lateUndo').hidden=!sh;
}
function shift(mode){
  const from=new Date(TODAY);if(document.querySelector('input[name="lateFrom"]:checked').value==='tomorrow')from.setDate(from.getDate()+1);
  const oldEnd=P.days[P.days.length-1].d;prefs.shift={from:kk(from),mode};savePrefs();lateManual=false;render();
  const end=P.days[P.days.length-1].d,diff=Math.round((end-oldEnd)/864e5);
  toast('رتبنا جدولك من '+dstr(from)+(diff>0?'، وطال '+ar(diff)+' يوم':diff<0?'، وقصر '+ar(-diff)+' يوم':'، ونفس تاريخ النهاية'));
  $('plan').querySelector('.day.today')?.scrollIntoView({behavior:'smooth',block:'center'});
}
$('lateExtend').onclick=()=>shift('extend');
$('lateFit').onclick=()=>shift('fit');
$('lateUndo').onclick=()=>{delete prefs.shift;savePrefs();lateManual=false;rerender('رجع جدولك للترتيب الأصلي')};
$('lateOpen').onclick=()=>{lateManual=true;updateLate();$('lateBox').scrollIntoView({behavior:'smooth',block:'center'})};
function applyFilter(){document.querySelectorAll('.subj').forEach(t=>t.hidden=!(filter==='all'||t.dataset.s===filter));
  document.querySelectorAll('.day').forEach(d=>d.hidden=![...d.querySelectorAll('.subj')].some(t=>!t.hidden))}
function check(row,id){const cb=row.querySelector('input');cb.checked=!!done[id];row.classList.toggle('checked',cb.checked);
  cb.addEventListener('change',()=>{if(cb.checked)done[id]=1;else delete done[id];row.classList.toggle('checked',cb.checked);saveDone();progress();updateLate();if(mView())mCards();
    document.dispatchEvent(new CustomEvent('plancheck',{detail:{checked:cb.checked}}))})}
function flagHard(id){const on=!hard[id];if(on)hard[id]=1;else delete hard[id];put(HARD,hard);
  rerender(on?'علّمتها صعبة، وتطلعلك أول شي بأسبوع المراجعة':'شلت علامة الصعبة')}
function progress(){const ids=P?P.ids:[],n=ids.filter(i=>done[i]).length,pc=ids.length?Math.round(100*n/ids.length):0;
  $('sDone').textContent=ar(pc)+'٪';$('pbar').style.width=pc+'%';window.PLAN_PCT=pc;
  // progress per subject, so the student sees where they are behind
  const subj=P?P.act.map(s=>{const a=P.idsBy[s],k=a.filter(i=>done[i]).length;return {s,name:C[s].name,color:COLOR[s],pct:a.length?Math.round(100*k/a.length):0}}):[];
  window.PLAN_SUBJ=subj;
  $('sBars').innerHTML=subj.map(x=>`<div class="sb" style="--c:var(${x.color})"><span class="sb-n">${x.name}</span><span class="sb-t" role="progressbar" aria-label="${x.name}" aria-valuenow="${x.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${x.pct}%"></i></span><span class="sb-p">${ar(x.pct)}٪</span></div>`).join('');
  // numbers the badges in dream.js are earned from: lectures done and weeks finished in full
  let full=0;if(P)for(let ws=weekStart(START);;ws.setDate(ws.getDate()+7)){const we=new Date(ws);we.setDate(we.getDate()+6);if(we>=TODAY)break;const st=weekStats(ws,we);if(st.all&&st.got===st.all)full++}
  window.PLAN_STATS={done:n,total:ids.length,fullWeeks:full};
  report();document.dispatchEvent(new CustomEvent('planprogress',{detail:{pct:pc}}))}

/* ---------- weekly report: this week so far and last week (weeks start on Saturday like the plan) ---------- */
const weekStart=d=>{const s=new Date(d);s.setDate(s.getDate()-((s.getDay()+1)%7));s.setHours(0,0,0,0);return s};
function weekStats(from,to){
  const per={};let all=0,got=0;
  for(const x of P.days){if(x.d<from||x.d>to)continue;
    for(const b of x.blocks)for(const l of b.lecs||[]){const k=per[b.s]||(per[b.s]={n:0,d:0});k.n++;all++;if(done['v'+l.v]){k.d++;got++}}}
  const list=Object.entries(per).map(([s,k])=>({s,...k,r:k.d/k.n})).sort((a,b)=>b.r-a.r||b.n-a.n);
  return {all,got,best:list[0],weak:list.length>1?list[list.length-1]:null};
}
function repCard(title,st,soFar){
  if(!st.all)return `<div class="rep"><span class="rep-k">${title}</span><span class="rep-v">ما بيه محاضرات</span></div>`;
  const pc=Math.round(100*st.got/st.all);
  const msg=pc>=90?'ممتاز، كمل هيج.':pc>=60?(soFar?'زين، بس لا تخلي الباقي يتكدس.':'زين، والباقي عوّضه الجمعة.'):soFar?'متأخر شوية، عوّض اليوم أو استعمل «تأخرت؟».':'كان أسبوع ثقيل. استعمل «تأخرت؟» حتى ينرتب الباقي.';
  const nm=x=>C[x.s].name;
  return `<div class="rep"><span class="rep-k">${title}</span><span class="rep-v">${ar(st.got)} من ${ar(st.all)} محاضرة</span>
    <span class="sb-t"><i style="width:${pc}%;background:var(--done)"></i></span>
    ${st.best&&st.best.d?`<span class="rep-l">أقوى مادة: <b style="color:var(${COLOR[st.best.s]})">${nm(st.best)}</b> (${ar(st.best.d)} من ${ar(st.best.n)})</span>`:''}
    ${st.weak&&st.weak.r<1&&st.weak!==st.best?`<span class="rep-l">تحتاج تركيز: <b style="color:var(${COLOR[st.weak.s]})">${nm(st.weak)}</b> (${ar(st.weak.d)} من ${ar(st.weak.n)})</span>`:''}
    <span class="rep-m">${msg}</span></div>`;
}
function report(){
  const el=$('weekRep');if(!P)return;
  if(TODAY<START){el.innerHTML='<p class="sub">التقرير يبدي من أول أسبوع بالخطة.</p>';return}
  const ws=weekStart(TODAY),lw=new Date(ws);lw.setDate(lw.getDate()-7);const lwEnd=new Date(ws);lwEnd.setDate(lwEnd.getDate()-1);
  const cards=[repCard('هذا الأسبوع لحد اليوم',weekStats(ws,TODAY),true)];
  if(lwEnd>=START)cards.push(repCard('الأسبوع الماضي ('+dstr(lw<START?START:lw)+' – '+dstr(lwEnd)+')',weekStats(lw,lwEnd),false));
  el.innerHTML=cards.join('');
}

/* ---------- calendar file: every study session from today as an event with a reminder ---------- */
function icsText(){
  const TL=timeline(),S=[0,1,2].map(i=>TL.find(r=>r[2]===i)),PR=TL.find(r=>r[2]==='practice');
  const pad=n=>String(n).padStart(2,'0'),stamp=(d,m)=>d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(Math.floor(m/60))+pad(m%60)+'00';
  const e=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
  const enc=new TextEncoder();
  const fold=line=>{let out='',cur='',n=0;for(const ch of line){const b=enc.encode(ch).length;if(n+b>73){out+=cur+'\r\n ';cur='';n=1}cur+=ch;n+=b}return out+cur};
  const now=new Date(),dt=now.getUTCFullYear()+pad(now.getUTCMonth()+1)+pad(now.getUTCDate())+'T'+pad(now.getUTCHours())+pad(now.getUTCMinutes())+'00Z';
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//khotta//plan6sci//AR','CALSCALE:GREGORIAN','X-WR-CALNAME:خطة السادس العلمي'];
  const ev=(d,a,b,title,desc,uid)=>L.push('BEGIN:VEVENT','UID:'+uid+'@khotta','DTSTAMP:'+dt,'DTSTART:'+stamp(d,a),'DTEND:'+stamp(d,b),'SUMMARY:'+e(title),'DESCRIPTION:'+e(desc),
    'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+e(title),'TRIGGER:-PT5M','END:VALARM','END:VEVENT');
  let n=0;
  for(const p of P.days){if(p.past||p.d<TODAY)continue;const k=kk(p.d);
    p.blocks.forEach((b,j)=>{const r=S[j]||S[2],nm=b.s==='rev'?'مراجعة':C[b.s].name;
      const desc=b.plain?b.plain:(b.lecs||[]).map(l=>'- '+l.t+' ('+l.m+' د)\n'+V(l.v,P.T[b.s].lists[l.li].id)).join('\n');
      ev(p.d,r[0],r[1],'دراسة: '+nm,desc,k+'-'+j);n++});
    if(!p.review){ev(p.d,PR[0],PR[1],'حل تمارين وأسئلة وزارية','حل تمارين الكتاب والأسئلة الوزارية لمحاضرات اليوم',k+'-p');n++}}
  L.push('END:VCALENDAR');
  return {text:L.map(fold).join('\r\n')+'\r\n',n};
}
$('icsBtn').onclick=()=>{const {text,n}=icsText();if(!n){toast('ماكو أيام جاية بجدولك');return}
  const url=URL.createObjectURL(new Blob([text],{type:'text/calendar;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='khotta-plan.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  toast('نزل ملف بيه '+ar(n)+' جلسة. افتحه حتى ينضاف لتقويم جوالك')};

/* ---------- exam countdown ---------- */
function exam(){
  const end=P.days[P.days.length-1].d,ex=prefs.exam&&parseKey(prefs.exam),to=ex||end,n=Math.round((to-TODAY)/864e5);
  $('sExam').textContent=n>0?ar(n):ex&&n===0?'اليوم':'—';
  $('sExamL').textContent=ex?(n>=0?'يوم للامتحان':'الامتحان فات، بالتوفيق'):'يوم لنهاية خطتك';
  $('examBtn').textContent=ex?'غيّر الموعد':'حدد موعد امتحانك';
  window.PLAN_EXAM=ex&&n>0?n:null;
  const late=ex?Math.round((end-ex)/864e5):0,w=$('examWarn');w.hidden=!(late>=0&&ex&&n>0);
  if(!w.hidden)w.textContent='جدولك يخلص '+dstr(end)+'، '+(late?'بعد موعد امتحانك بـ '+(late===1?'يوم':late===2?'يومين':ar(late)+(late<11?' أيام':' يوم')):'بنفس يوم امتحانك')+'. إذا تأخرت محاضرات اختار «وزّعها على الأيام الباقية» بدل «طوّل الجدول»، وشغّل المحاضرات بسرعة أعلى حتى تلحك.';
}
$('examBtn').onclick=()=>{const e=$('examEdit');e.hidden=!e.hidden;$('examBtn').setAttribute('aria-expanded',!e.hidden);if(!e.hidden){$('examDate').value=prefs.exam?prefs.exam.split('-').map((x,i)=>i?x.padStart(2,'0'):x).join('-'):'';$('examDate').focus()}};
$('examSave').onclick=()=>{const v=$('examDate').value;if(!v)return;const [y,m,d]=v.split('-').map(Number);prefs.exam=y+'-'+m+'-'+d;savePrefs();$('examEdit').hidden=true;$('examBtn').setAttribute('aria-expanded','false');
  rerender('انحفظ موعد امتحانك '+dstr(new Date(y,m-1,d)))};
$('examClear').onclick=()=>{delete prefs.exam;savePrefs();$('examEdit').hidden=true;$('examBtn').setAttribute('aria-expanded','false');rerender('شلت موعد الامتحان')};

function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,3200)}
function rerender(msg){const y=scrollY;render();scrollTo(0,y);if(msg)toast(msg)}

/* ---------- subjects editor ---------- */
$('subjToggle').onclick=()=>{const box=$('subjEdit');box.hidden=!box.hidden;$('subjToggle').setAttribute('aria-expanded',!box.hidden)};
$('subjApply').onclick=()=>{const before=P.days.length;document.querySelectorAll('#subjBox input').forEach(i=>prefs.subjects[i.dataset.s]=i.checked);savePrefs();
  render();const diff=P.days.length-before;$('subjEdit').hidden=true;$('subjToggle').setAttribute('aria-expanded','false');
  toast(diff>0?'الجدول طال '+ar(diff)+' يوم':diff<0?'الجدول قصر '+ar(-diff)+' يوم':'الجدول تحدّث')};

/* ---------- notice about alternate teachers ---------- */
function notice(force){if(!force&&get(NOTICE))return;if(!force&&!get('plan6sci-dream'))return;$('notice').hidden=false}
$('noticeGo').onclick=()=>{$('notice').hidden=true;put(NOTICE,1);$('teachersSec').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>{const s=document.querySelector('.tsel:not([disabled])');s&&s.focus()},500)};
$('noticeX').onclick=()=>{$('notice').hidden=true;put(NOTICE,1)};
$('bell').onclick=()=>notice(true);

/* ---------- font size (saved in this browser, applied before paint by the inline script) ---------- */
function fontSize(z,say){document.documentElement.style.setProperty('--zoom',z);document.querySelectorAll('.fontsz button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.z===z));
  try{localStorage.setItem('plan6sci-font',z)}catch(e){}if(say)toast(z>1?'كبّرنا الخط':'رجع الخط لحجمه العادي')}
document.querySelectorAll('.fontsz button').forEach(b=>b.onclick=()=>fontSize(+b.dataset.z,true));
fontSize((()=>{const z=+get('plan6sci-font');return [1,1.12,1.25].includes(z)?z:1})(),false);

/* ---------- monthly exams: a separate page whose schedule puts each exam's chapters first and keeps the main plan going for the other subjects ---------- */
const MKEY='plan6sci-monthly';
let monthly=(get(MKEY)||[]).filter(e=>e&&C[e.s]&&parseKey(e.d)&&Array.isArray(e.li));
const saveM=()=>put(MKEY,monthly);
const mView=()=>document.body.classList.contains('m-view');
const daysWord=n=>n===1?'يوم':n===2?'يومين':ar(n)+(n<11?' أيام':' يوم');
// the subject's lectures in the chosen chapters, from the teacher the student picked
function mLectures(s,lis){const t=P.T[s],ok=new Set(P.idsBy[s]),out=[];
  lis.forEach(li=>{const L=t.lists[li];if(L)L.v.forEach(v=>{if(ok.has('v'+v[0]))out.push({v:v[0],t:v[1],m:v[2],li})})});return out}
// default chapters: the ones the main plan reaches before the exam day
function mDefaultLists(s,ex){const set=new Set();for(const x of P.days){if(x.d>=ex)break;for(const b of x.blocks)if(b.s===s)(b.lecs||[]).forEach(l=>set.add(l.li))}
  return set.size?[...set].sort((a,b)=>a-b):[0]}
function mPlan(){
  const from=new Date(Math.max(TODAY,START));
  const ex=monthly.filter(e=>P.act.includes(e.s)).map(e=>({...e,date:parseKey(e.d)})).filter(e=>e.date>=from).sort((a,b)=>a.date-b.date);
  if(!ex.length)return {ex,days:[]};
  const days=[];for(const d=new Date(from);d<=ex[ex.length-1].date;d.setDate(d.getDate()+1))days.push({d:new Date(d),prep:[],exams:[]});
  for(const e of ex){
    const n=Math.round((e.date-from)/864e5),L=mLectures(e.s,e.li),R=L.filter(l=>!done['v'+l.v]);
    e.total=L.length;e.left=R.length;e.mins=R.reduce((a,l)=>a+l.m,0);days[n].exams.push(e);
    // the day before is for review when there are at least 3 days; the rest share the remaining lectures by video time
    const review=n>=3,study=days.slice(0,review?n-1:n);e.studyDays=study.length;
    e.perDay=study.length?Math.round(e.mins/study.length):e.mins;
    let p=0,acc=0;study.forEach((x,i)=>{const target=e.mins*(i+1)/study.length,out=[];
      while(p<R.length&&(i+1===study.length||acc+R[p].m/2<=target)){out.push(R[p]);acc+=R[p].m;p++}if(out.length)x.prep.push({e,lecs:out})});
    if(review)days[n-1].prep.push({e,plain:'مراجعة '+C[e.s].name+' كاملة للامتحان: ملخصاتك، الأسئلة الوزارية، والمحاضرات اللي علّمتها صعبة'});
  }
  // the main plan carries on for every subject that has no exam coming in these days
  const main=new Map(P.days.map(x=>[x.d.getTime(),x]));
  for(const x of days){const m=main.get(x.d.getTime()),busy=new Set(ex.filter(e=>e.date>=x.d).map(e=>e.s));x.other=m?m.blocks.map((b,j)=>({...b,j})).filter(b=>!busy.has(b.s)):[]}
  return {ex,days};
}
function mCards(){
  const {ex}=mPlan();
  $('mExams').innerHTML=ex.length?ex.map(e=>{const n=Math.round((e.date-TODAY)/864e5),pc=e.total?Math.round(100*(e.total-e.left)/e.total):0,t=P.T[e.s];
    const heavy=e.perDay>240;
    return `<div class="m-card" style="--c:var(${COLOR[e.s]})"><div class="m-top"><b>${C[e.s].name}</b><span class="m-when">${n>0?'بعد '+daysWord(n):'اليوم'} · ${DN[e.date.getDay()]} ${dstr(e.date)}</span>
      <button class="linkbtn" type="button" data-del="${e.id}">احذف</button></div>
      <span class="alt">${e.li.map(li=>t.lists[li]?esc(t.lists[li].t):'').filter(Boolean).join('، ')}</span>
      <span class="sb-t"><i style="width:${pc}%"></i></span>
      <span>${e.left?`باقي ${ar(e.left)} محاضرة (${dur(e.mins)} فيديو)${e.studyDays?' على '+daysWord(e.studyDays)+'، يعني تقريباً '+dur(e.perDay)+' باليوم':''}`:'خلصت كل محاضراته، ركّز على المراجعة والأسئلة'}</span>
      ${heavy?`<span class="m-heavy">الحمل ثقيل. شغّل المحاضرات بسرعة ١.٥ أو قلل الفصول إذا الامتحان ما يشملها.</span>`:''}</div>`}).join(''):'<p class="note">ما ضفت امتحانات بعد. اختار المادة والموعد والفصول وضيفه، والجدول ينبني لحاله.</p>';
  $('mExams').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{monthly=monthly.filter(e=>e.id!==b.dataset.del);saveM();mRender();mBanner();toast('انحذف الامتحان')});
}
function mRender(){
  mCards();
  const {days}=mPlan(),TL=timeline(),slots=[0,1,2].map(i=>TL.find(r=>r[2]===i)).concat([TL.find(r=>r[2]==='practice')]),RV=TL.find(r=>r[2]==='review');
  const host=$('mPlan');host.innerHTML='';
  if(!days.length){host.innerHTML='';$('mPlanH').hidden=true;return}
  $('mPlanH').hidden=false;
  for(const x of days){
    const day=document.createElement('div');day.className='day'+(x.exams.length?' m-exam':'')+(x.d.getTime()===TODAY.getTime()?' today':'');
    day.innerHTML=`<div class="date"><span class="dn">${DN[x.d.getDay()]}</span><span class="dd">${ar(x.d.getDate())}</span><span class="dm">${MN[x.d.getMonth()]}</span>${x.d.getTime()===TODAY.getTime()?'<span class="tlabel">اليوم</span>':''}</div><div class="subjs"></div>`;
    const box=day.querySelector('.subjs');let k=0;
    const slot=()=>{const r=slots[k++];return r?`<span class="tm">${range(r[0],r[1])}</span>`:'<span class="tm">إذا عندك وقت</span>'};
    x.exams.forEach(e=>{const el=document.createElement('div');el.className='subj m-banner';el.style.setProperty('--c','var('+COLOR[e.s]+')');
      el.innerHTML=`<div class="subj-h"><span class="s">اليوم امتحان ${C[e.s].name} الشهري</span><span class="w">بالتوفيق. راجع ملخصك الصبح وادخل الامتحان مرتاح.</span></div>`;box.appendChild(el)});
    const blocks=x.prep.map(p=>({...p,s:p.e.s,pri:1})).concat(x.other);
    for(const b of blocks){const el=document.createElement('div');el.className='subj'+(b.pri?' m-pri':'');el.dataset.s=b.s;el.style.setProperty('--c','var('+COLOR[b.s]+')');
      const nm=b.s==='rev'?'مراجعة':C[b.s].name,tag=b.pri?'<span class="m-tag">امتحان شهري</span>':'';
      if(b.plain){const id=b.pri?'m'+kk(x.d)+'-'+b.s:'p'+kk(x.d)+'-'+b.j;
        el.innerHTML=`<div class="subj-h">${slot()}${tag}</div><div class="lec"><input type="checkbox" id="${id}"><label for="${id}" class="plain"><span class="subj-h"><span class="s">${nm}</span></span> <span class="t">${esc(b.plain)}</span></label><span></span></div>`;check(el.querySelector('.lec'),id)}
      else{const t=P.T[b.s];el.innerHTML=`<div class="subj-h">${slot()}${tag}<span class="s">${nm}</span><span class="w">${esc(t.name)}</span></div>`;
        b.lecs.forEach(l=>{const id='v'+l.v,r=document.createElement('div');r.className='lec';
          r.innerHTML=`<input type="checkbox" id="${id}" aria-label="أنجزت ${esc(l.t)}"><label for="${id}"><a href="${V(l.v,t.lists[l.li].id)}" target="_blank" rel="noopener">${esc(l.t)}</a></label><span class="m">${dur(l.m)}</span>`;check(r,id);el.appendChild(r)})}
      box.appendChild(el)}
    if(blocks.length){const el=document.createElement('div');el.className='subj extra';el.innerHTML=`<div class="subj-h"><span class="tm">${range(RV[0],RV[1])}</span><span class="w">مراجعة ملخص اليوم وتشوف جدول باجر</span></div>`;box.appendChild(el)}
    host.appendChild(day)}
}
// add-exam form
function mFormLists(){const s=$('mSubj').value,v=$('mDate').value;if(!s){$('mLists').innerHTML='';return}
  const t=P.T[s],ex=v?parseKey(v.split('-').map(Number).join('-')):null,def=ex?mDefaultLists(s,ex):[0];
  $('mLists').innerHTML=t.lists.map((l,i)=>`<label class="sch"><input type="checkbox" value="${i}"${def.includes(i)?' checked':''}> ${esc(l.t)}</label>`).join('')}
function mForm(){
  const sel=$('mSubj'),cur=sel.value;sel.innerHTML='<option value="">اختار المادة</option>'+P.act.map(s=>`<option value="${s}">${C[s].name}</option>`).join('');
  if(P.act.includes(cur))sel.value=cur;const t=new Date(Math.max(TODAY,START));$('mDate').min=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');mFormLists()}
$('mSubj').onchange=mFormLists;$('mDate').onchange=mFormLists;
$('mAdd').onclick=()=>{const s=$('mSubj').value,v=$('mDate').value,li=[...$('mLists').querySelectorAll('input:checked')].map(i=>+i.value);
  if(!s){toast('اختار المادة');$('mSubj').focus();return}if(!v){toast('اختار موعد الامتحان');$('mDate').focus();return}if(!li.length){toast('أشّر الفصول اللي يشملها الامتحان');return}
  const d=v.split('-').map(Number).join('-'),ex=parseKey(d);if(ex<new Date(Math.max(TODAY,START))){toast('الموعد لازم يكون من اليوم وبعده');return}
  monthly=monthly.filter(e=>!(e.s===s&&e.d===d));monthly.push({id:Date.now().toString(36),s,d,li});saveM();mRender();mBanner();
  toast('انضاف امتحان '+C[s].name+' '+dstr(ex)+'، والجدول ترتب عليه')};
// main page banner and switching between the two pages
function mBanner(){const {ex}=mPlan(),b=$('mBanner'),n=ex.length;$('mCount').textContent=n?ar(n):'';$('mCount').hidden=!n;
  if(!n){b.hidden=true;return}const e=ex[0],d=Math.round((e.date-TODAY)/864e5);b.hidden=false;
  b.querySelector('span').textContent=(d>0?'امتحان '+C[e.s].name+' الشهري بعد '+daysWord(d):'اليوم امتحان '+C[e.s].name+' الشهري')+(e.left?'، باقي '+ar(e.left)+' محاضرة':'');}
function mShow(on){document.body.classList.toggle('m-view',on);if(on){mForm();mRender()}else render();scrollTo(0,0)}
const mHash=()=>mShow(location.hash==='#monthly');
// opening pushes a history entry so the phone's back button returns to the main plan; a page opened straight on #monthly just drops the hash
let mPushed=false;
const mGo=()=>{mPushed=true;location.hash='monthly'};
$('mOpen').onclick=mGo;$('mBannerGo').onclick=mGo;
$('mBack').onclick=()=>{if(mPushed){mPushed=false;history.back()}else{history.replaceState(null,'',location.pathname+location.search);mShow(false)}};
addEventListener('hashchange',mHash);

// the first-visit card (dream.js) saves the start hour here
window.PLANAPP={setHour(h){if(HOURS.includes(h)){prefs.hour=h;savePrefs();render()}},getHour:()=>prefs.hour,HOURS};
document.addEventListener('dreamsaved',()=>setTimeout(()=>notice(false),900));

render();notice(false);if(location.hash==='#monthly')mShow(true);
})();
