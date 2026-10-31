// Plan engine: builds each student's schedule from their chosen subjects, teachers and start hour (saved in this browser)
(function(){
const C=window.CATALOG, ORDER=Object.keys(C);
const PREF='plan6sci-prefs', DONE='plan6sci-v3', NOTICE='plan6sci-notice-alt';
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
  const need={},left={};for(const s of act){const mt=mainOf(s).lists.reduce((a,l)=>a+l.v.reduce((x,v)=>x+v[2],0),0);need[s]=Math.max(1,Math.round(mt/SLOT));left[s]=need[s]}
  const days=[];const d=new Date(START);
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
  // lectures of each subject split over its sessions by video time
  const slots={},used={},cur={};
  days.forEach(x=>x.blocks.forEach(b=>{if(b.s!=='rev')slots[b.s]=(slots[b.s]||0)+1}));
  for(const x of days)for(const b of x.blocks){if(b.s==='rev')continue;const s=b.s,q=Q[s],i=used[s]||0;used[s]=i+1;
    const target=tot[s]*(i+1)/slots[s];let p=cur[s]||0,acc=q.slice(0,p).reduce((a,y)=>a+y.m,0);const out=[];
    while(p<q.length&&(i+1===slots[s]||acc+q[p].m/2<=target)){out.push(q[p]);acc+=q[p].m;p++}cur[s]=p;b.lecs=out}
  // final review week
  const rv=[];const pairs=act.slice();for(let i=0;i<REVIEW_DAYS-1;i++){const a=pairs[(i*2)%pairs.length],b=pairs[(i*2+1)%pairs.length];
    const bl=[{s:a,plain:'مراجعة '+C[a].name+' كاملة وحل أسئلة وزارية'}];if(b&&b!==a)bl.push({s:b,plain:'مراجعة '+C[b].name+' كاملة وحل أسئلة وزارية'});rv.push(bl)}
  rv.push([{s:'rev',plain:'امتحان شامل لنفسك: ورقة وزارية لكل مادة بوقت محدد، وسجّل أخطاءك'}]);
  for(const bl of rv){days.push({d:new Date(d),blocks:bl,review:true});d.setDate(d.getDate()+1)}
  return {act,T,days,tot,slots};
}

/* ---------- render ---------- */
let done={};try{done=JSON.parse(localStorage.getItem(DONE)||'{}')}catch(e){}
const saveDone=()=>{try{localStorage.setItem(DONE,JSON.stringify(done))}catch(e){}};
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
  const host=$('plan');host.innerHTML='';const today=new Date();today.setHours(0,0,0,0);let weekEl=null,wn=0;
  days.forEach((p,i)=>{
    if(i===0||p.d.getDay()===6||(p.review&&!days[i-1].review)){weekEl=document.createElement('div');weekEl.className='week';const h=document.createElement('h3');
      if(p.review)h.innerHTML='<span class="phase">أسبوع المراجعة النهائية</span>';else{wn++;h.textContent='الأسبوع '+ar(wn)}weekEl.appendChild(h);host.appendChild(weekEl)}
    const mins=p.blocks.reduce((a,b)=>a+(b.lecs||[]).reduce((x,l)=>x+l.m,0),0);
    const day=document.createElement('div');day.className='day'+(p.d.getDay()===5?' fri':'');
    const isToday=p.d.getTime()===today.getTime();if(isToday){day.classList.add('today');todayEl=day}
    day.innerHTML=`<div class="date"><span class="dn">${DN[p.d.getDay()]}</span><span class="dd">${ar(p.d.getDate())}</span><span class="dm">${MN[p.d.getMonth()]}</span>${mins?`<span class="hrs">${dur(mins)} فيديو</span>`:''}${isToday?'<span class="tlabel">اليوم</span>':''}</div><div class="subjs"></div>`;
    const box=day.querySelector('.subjs');
    p.blocks.forEach((b,j)=>{
      const el=document.createElement('div');el.className='subj';el.dataset.s=b.s;el.style.setProperty('--c','var('+COLOR[b.s]+')');
      const nm=b.s==='rev'?'مراجعة':C[b.s].name,tm=`<span class="tm">${SESS[j]||SESS[2]}</span>`;
      if(b.plain){const id='p'+kk(p.d)+'-'+j;allIds.push(id);
        el.innerHTML=`<div class="subj-h">${tm}</div><div class="lec"><input type="checkbox" id="${id}"><label for="${id}" class="plain"><span class="subj-h"><span class="s">${nm}</span></span> <span class="t">${esc(b.plain)}</span></label><span></span></div>`;check(el.querySelector('.lec'),id)}
      else{const t=T[b.s],lists=[...new Set(b.lecs.map(l=>l.li))].map(li=>t.lists[li]);const bm=b.lecs.reduce((a,l)=>a+l.m,0);
        const speed=bm>190?' · شغّلها بسرعة ١.٥':bm>150?' · شغّلها بسرعة ١.٢٥':'';
        el.innerHTML=`<div class="subj-h">${tm}<span class="s">${nm}</span><span class="w">${lists.map(l=>esc(l.t)).join(' ← ')} · ${esc(lists[0]&&lists[0].by||t.name)}${speed}</span></div>`;
        b.lecs.forEach(l=>{const L=t.lists[l.li],id='v'+l.v;allIds.push(id);const r=document.createElement('div');r.className='lec';
          r.innerHTML=`<input type="checkbox" id="${id}" aria-label="أنجزت ${esc(l.t)}"><label for="${id}"><a href="${V(l.v,L.id)}" target="_blank" rel="noopener">${esc(l.t)}</a></label><span class="m">${dur(l.m)}</span>`;check(r,id);el.appendChild(r)})}
      box.appendChild(el)});
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
  progress();document.dispatchEvent(new CustomEvent('planbuilt'));
}
function applyFilter(){document.querySelectorAll('.subj').forEach(t=>t.hidden=!(filter==='all'||t.dataset.s===filter));
  document.querySelectorAll('.day').forEach(d=>d.hidden=![...d.querySelectorAll('.subj')].some(t=>!t.hidden))}
function check(row,id){const cb=row.querySelector('input');cb.checked=!!done[id];row.classList.toggle('checked',cb.checked);
  cb.addEventListener('change',()=>{if(cb.checked)done[id]=1;else delete done[id];row.classList.toggle('checked',cb.checked);saveDone();progress();
    document.dispatchEvent(new CustomEvent('plancheck',{detail:{checked:cb.checked}}))})}
function progress(){const n=allIds.filter(i=>done[i]).length,pc=allIds.length?Math.round(100*n/allIds.length):0;
  $('sDone').textContent=ar(pc)+'٪';$('pbar').style.width=pc+'%';window.PLAN_PCT=pc;document.dispatchEvent(new CustomEvent('planprogress',{detail:{pct:pc}}))}

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

// the first-visit card (dream.js) saves the start hour here
window.PLANAPP={setHour(h){if(HOURS.includes(h)){prefs.hour=h;savePrefs();render()}},getHour:()=>prefs.hour,HOURS};
document.addEventListener('dreamsaved',()=>setTimeout(()=>notice(false),900));

render();notice(false);
})();
