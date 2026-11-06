// Page order for "رزنامة اليوم": today first, the rest folded, a small nav. Only moves and folds what plan.js and dream.js render; no plan logic here.
(function(){
const $=id=>document.getElementById(id),q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const wrap=q('.wrap'),header=q('header'),plan=$('plan'),schedule=plan.closest('section'),dream=$('dream');
if(!wrap||!header||!plan)return;

// sections
const section=(cls,title,id)=>{const s=document.createElement('section');s.className=cls;if(id)s.id=id;if(title){const h=document.createElement('h2');h.textContent=title;s.appendChild(h)}return s};
schedule.classList.add('rz-today');schedule.id='rzToday';
const progress=section('rz-progress','تقدمك','rzProgress');
for(const el of [q('.sub',header),q('.stats',header),$('examEdit'),$('examWarn'),q('.bar',header),$('sBars'),q('.autosave',header),$('rescue'),q('.m-entry',header)])if(el)progress.appendChild(el);
const days=section('rz-days','','rzDays'),weeks=document.createElement('div');weeks.className='rz-weeks';
for(const el of [q('.toolbar',schedule),$('filters')])if(el)days.appendChild(el);
days.appendChild(weeks);

// order: wall, today, late box, dream, progress, week report, rest of the plan, then the reference sections
const late=$('lateBox'),report=$('repH')&&$('repH').closest('section');
header.after(schedule);schedule.after(...[late,dream,progress,report,days].filter(Boolean));

// folding
const opened=new Set();
const keyOf=d=>d.dataset.rz||(d.dataset.rz=(q('.dd',d)||d).textContent+'|'+((q('.dm',d)||d).textContent||''));
const setDay=(d,open)=>{d.classList.toggle('rz-fold',!open);const t=q('.date',d);if(t)t.setAttribute('aria-expanded',open)};
function prepDay(d,today){
  if(d.classList.contains('today'))return;
  if(today&&d.compareDocumentPosition(today)&Node.DOCUMENT_POSITION_FOLLOWING)d.classList.add('rz-past');
  if(!q('.rz-sum',d)){const s=document.createElement('span');s.className='rz-sum';s.textContent=[...new Set(qa('.subj-h .s',d).map(x=>x.textContent.trim()))].join(' · ');q('.date',d).after(s)}
  const t=q('.date',d);t.setAttribute('role','button');t.tabIndex=0;
  setDay(d,opened.has(keyOf(d)));
  const flip=e=>{if(e.target.closest('a,input,button,label'))return;const open=d.classList.contains('rz-fold');open?opened.add(keyOf(d)):opened.delete(keyOf(d));setDay(d,open);d.classList.toggle('rz-opened',open)};
  d.addEventListener('click',e=>{if(d.classList.contains('rz-fold')||e.target.closest('.date'))flip(e)});
  t.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip(e)}});
}
function arrange(){
  obs.disconnect();
  weeks.innerHTML='';
  const today=q('.day.today',plan),all=[...plan.children].filter(w=>w.classList.contains('week'));
  const cur=(today&&today.closest('.week'))||all.find(w=>q('.day:not(.past)',w))||all[0];
  qa('.day',plan).forEach(d=>prepDay(d,today));
  if(!today&&cur){const first=q('.day',cur);if(first)setDay(first,true)}
  all.forEach((w,i)=>{if(w===cur)return;
    const h=q(':scope>h3',w),key='w'+i;
    weeks.appendChild(w);w.classList.toggle('rz-closed',!opened.has(key));
    h.setAttribute('role','button');h.tabIndex=0;h.setAttribute('aria-expanded',opened.has(key));
    const flip=()=>{const open=w.classList.contains('rz-closed');open?opened.add(key):opened.delete(key);w.classList.toggle('rz-closed',!open);h.setAttribute('aria-expanded',open)};
    h.addEventListener('click',flip);h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}})});
  obs.observe(plan,{childList:true});
}
const obs=new MutationObserver(arrange);
arrange();

// a subject filter shows every matching day, folded or not
const filters=$('filters');
if(filters)filters.addEventListener('click',()=>setTimeout(()=>{const b=filters.querySelector('button');document.body.classList.toggle('rz-filtered',!!b&&b.getAttribute('aria-pressed')!=='true')}));

// nav
const nav=document.createElement('nav');nav.className='rz-nav';nav.setAttribute('aria-label','أقسام الموقع');
const items=[['today','اليوم'],['days','الأيام'],['exams','الامتحانات'],['teach','المدرسين']];
nav.innerHTML=items.map(([k,t])=>`<button type="button" data-go="${k}">${t}</button>`).join('');
wrap.before(nav);
const inMonthly=()=>document.body.classList.contains('m-view');
const mark=k=>qa('button',nav).forEach(b=>b.setAttribute('aria-current',b.dataset.go===k));
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,behavior=reduce?'auto':'smooth';
const target=k=>k==='today'?(q('.day.today',plan)||schedule):k==='days'?days:$('teachersSec');
function go(k){
  if(k==='exams'){if(!inMonthly())$('mOpen').click();mark(k);scrollTo({top:0,behavior});return}
  const jump=()=>{const y=target(k).getBoundingClientRect().top+scrollY-(innerWidth>=900?64:12);scrollTo({top:k==='today'?0:y,behavior});mark(k)};
  if(inMonthly()){$('mBack').click();setTimeout(jump,120)}else jump();
}
nav.addEventListener('click',e=>{const b=e.target.closest('button');if(b)go(b.dataset.go)});
new MutationObserver(()=>mark(inMonthly()?'exams':'today')).observe(document.body,{attributes:true,attributeFilter:['class']});
mark(inMonthly()?'exams':'today');
})();
