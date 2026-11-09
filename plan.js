// Plan engine: builds each student's schedule from their chosen subjects, teachers and start hour (saved in this browser)
(function(){
const C=window.CATALOG, ORDER=Object.keys(C);
const PREF='plan6sci-prefs', DONE='plan6sci-v3', NOTICE='plan6sci-notice-alt', HARD='plan6sci-hard';
const DONE_BEFORE=window.PLAN_DONE_BEFORE||{}; // lectures already watched before the plan started, per subject (main teacher only)
const START=new Date(2026,10,1), SLOT=145, REVIEW_DAYS=6;
const HOURS=[7,8,9,10,13,14];
// study sessions a day (two and a half hours each, with a 10-minute break every hour); 4 only fits a morning start
const SESS_N=[2,3,4];
const SESS_L={2:['خفيف','٧ إلى ٨ ساعات'],3:['عادي','٩ إلى ١٠ ساعات'],4:['مكثف','حوالي ١٢ ساعة']};
const SESS_W=k=>k===1?'جلسة وحدة':k===2?'جلستين':ar(k)+' جلسات';
const hourLabel=h=>ar(h>12?h-12:h)+(h>=12?' الظهر':' الصبح');
const COLOR={math:'--math',phys:'--phys',bio:'--bio',chem:'--chem',eng:'--eng',isl:'--isl',ar:'--ar',rev:'--rev'};
const RANK={math:0,phys:1,chem:2,bio:3,ar:4,eng:5,isl:6}; // hardest first in the day
const DN=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const MN=['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول'];
const ar=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
const dur=m=>m>=60?ar(Math.floor(m/60))+'س'+(m%60?' '+ar(m%60)+'د':''):ar(m)+'د';
const PL=id=>'https://www.youtube.com/playlist?list='+id, V=(v,l)=>'https://www.youtube.com/watch?v='+v+'&list='+l;
// links of one lecture slot: the video(s) of whichever teacher the student picked for that chapter
const lnk=l=>l.show.map(x=>`<a href="${V(x.v,x.pl)}${x.start?'&amp;t='+x.start+'s':''}" target="_blank" rel="noopener">${esc(x.t)}${x.cont?' (تكملة)':''}</a>`).join(' + ');
const kk=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
const dstr=d=>ar(d.getDate())+'/'+ar(d.getMonth()+1)+'/'+ar(d.getFullYear());
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mainOf=s=>C[s].teachers.find(t=>t.main)||C[s].teachers[0];
// the teacher shown as main: slots and ticks stay on the first recorded teacher, so a new default never loses progress
const defOf=s=>C[s].teachers.find(t=>t.pick)||mainOf(s);

// strict Y-M-D near the school year: a bad ?today or a year-9999 exam used to loop forever
const parseKey=k=>{if(!/^\d{4}-\d{1,2}-\d{1,2}$/.test(String(k)))return null;const [y,m,d]=String(k).split('-').map(Number);const t=new Date(y,m-1,d);
  return y>=2025&&y<=2028&&t.getMonth()===m-1&&t.getDate()===d?t:null};
function loadPrefs(){
  const p=get(PREF)||{};
  const out={subjects:{},teacher:{},chap:{},hour:HOURS.includes(p.hour)?p.hour:10};
  for(const s of ORDER){out.subjects[s]=p.subjects&&typeof p.subjects==='object'&&s in p.subjects?!!p.subjects[s]:true;
    const t=p.teacher&&p.teacher[s];out.teacher[s]=C[s].teachers.some(x=>x.id===t)?t:defOf(s).id;
    // per-chapter teacher overrides: {chapterIndex: teacherId}
    const ch=p.chap&&p.chap[s]||{};out.chap[s]={};for(const li in ch)if(C[s].teachers.some(x=>x.id===ch[li]&&x.lists[li]))out.chap[s][li]=ch[li]}
  // a plan needs at least one subject
  if(!ORDER.some(s=>out.subjects[s]))ORDER.forEach(s=>out.subjects[s]=true);
  if(p.shift&&parseKey(p.shift.from)){out.shift={from:p.shift.from,mode:p.shift.mode==='fit'?'fit':'extend'};if(parseKey(p.shift.at))out.shift.at=p.shift.at}
  if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(p.exam||''))out.exam=p.exam;
  out.sess=(Array.isArray(p.sess)?p.sess:[]).filter(x=>x&&parseKey(x.from)&&SESS_N.includes(x.k)).map(x=>({from:x.from,k:x.k})).sort((a,b)=>parseKey(a.from)-parseKey(b.from));
  out.mk=SESS_N.includes(p.mk)?p.mk:3;
  out.part={};for(const s of ['eng','ar']){const q=p.part&&p.part[s];if(q&&typeof q==='object'){const o={};for(const k of ['g','l'])if(C[s].teachers.some(x=>x.id===q[k]))o[k]=q[k];if(o.g||o.l)out.part[s]=o}}
  // grammar study: full lectures or a teacher's focused review (only subjects with a review in the catalog)
  out.rev={};for(const s of ORDER)if(C[s].review&&p.rev&&p.rev[s]===true)out.rev[s]=true;
  if(parseKey(p.undoAt))out.undoAt=p.undoAt;
  const sc=p.school,hm=/^([01]\d|2[0-3]):[0-5]\d$/;if(sc&&hm.test(sc.a)&&hm.test(sc.b)&&sc.a<sc.b)out.school={a:sc.a,b:sc.b,from:parseKey(sc.from)?sc.from:''};
  return out;
}
let prefs=loadPrefs();
const savePrefs=()=>put(PREF,prefs);

/* ---------- daily timeline from the chosen start hour ---------- */
function clock(m){m=((m%1440)+1440)%1440;if(m===0)return'١٢:٠٠ منتصف الليل';const h=Math.floor(m/60),mi=m%60,h12=h%12||12;return ar(h12)+':'+ar(String(mi).padStart(2,'0'))+(h<12?'ص':'م')}
/* ---------- school hours: on school days (Sunday to Thursday) study sits around the student's own school times ---------- */
const hhmm=t=>{const [a,b]=t.split(':').map(Number);return a*60+b};
const schoolOn=d=>{const c=prefs.school;if(!c)return false;if(!d)return true;if(typeof isRam==='function'&&isRam(d))return false;
  return d.getDay()!==5&&d.getDay()!==6&&(!c.from||parseKey(c.from)<=d)};
function schoolRows(k){const a=hhmm(prefs.school.a),b=hhmm(prefs.school.b),pm=a>=660,wake=pm?420:a-60,bed=pm?1410:Math.min(1410,wake+1020);
  const wins=(pm?[[wake+45,a-45]]:[]).concat([[b+60,bed]]);
  const place=n=>{const rows=[];let w=0,cur=wins[0][0];
    for(let i=0;i<n;i++){while(w<wins.length&&cur+150>wins[w][1]){w++;if(w<wins.length)cur=wins[w][0]}
      if(w>=wins.length)return null;rows.push([cur,cur+150,i]);cur+=150;if(i<n-1&&cur+20<=wins[w][1]){rows.push([cur,cur+20,'استراحة قصيرة']);cur+=20}}
    while(w<wins.length&&cur+45>wins[w][1]){w++;if(w<wins.length)cur=wins[w][0]}
    if(w>=wins.length)return null;const end=wins[w][1],pr=Math.min(90,end-cur-20);rows.push([cur,cur+pr,'practice'],[cur+pr,cur+pr+20,'review']);cur+=pr+20;
    if(cur<end)rows.push([cur,end,'وقت حر وراحة قبل النوم']);return rows};
  let n=k,rows=null;while(n>=1&&!(rows=place(n)))n--;
  if(!rows){const st=b+60;rows=[[st,st+150,0],[st+150,st+180,'practice'],[st+180,st+195,'review']]}
  const fixed=(pm?[[wake,wake+45,'الكعدة، فطور خفيف، ترتيب مكان الدراسة'],[a-45,a,'تحضير والطريق للمدرسة']]:[[wake,a,'الكعدة، فطور والطريق للمدرسة']]).concat([[a,b,'دوام المدرسة'],[b,b+60,'رجعة من الدوام، غداء وراحة'],[Math.max(bed,rows[rows.length-1][1]),Math.max(bed,rows[rows.length-1][1])+480,'نوم']]);
  return rows.concat(fixed).sort((x,y)=>x[0]-y[0])}
const schoolFit=k=>schoolRows(k).filter(r=>typeof r[2]==='number').length;
const schoolK=(d,k)=>schoolOn(d)?Math.min(k,schoolFit(k)):k;
function timeline(k,d){
  k=k||(d?kOf(d):kNow());if(schoolOn(d))return schoolRows(k);
  const b=prefs.hour*60;
  // afternoon start (after school): same three sessions with shorter breaks, a shorter practice, and sleep right after the review
  if(prefs.hour>=12){const sl=b+660;
    if(k<3)return [[b-60,b,'رجعة من الدوام، غداء وراحة'],[b,b+150,0],[b+150,b+170,'استراحة قصيرة'],[b+170,b+320,1],[b+320,b+365,'عشاء، صلاة، استراحة'],
      [b+365,b+455,'practice'],[b+455,b+485,'review'],[b+485,sl,'وقت حر وتحضير للنوم'],[sl,sl+480,'نوم'],[sl+480,b-60+1440,'دوام المدرسة أو وقت حر']];
    return [[b-60,b,'رجعة من الدوام، غداء وراحة'],[b,b+150,0],[b+150,b+170,'استراحة قصيرة'],[b+170,b+320,1],[b+320,b+365,'عشاء، صلاة، استراحة'],
      [b+365,b+515,2],[b+515,b+530,'استراحة قصيرة'],[b+530,b+620,'practice'],[b+620,b+650,'review'],[b+650,sl,'تحضير للنوم'],[sl,sl+480,'نوم'],[sl+480,b-60+1440,'دوام المدرسة أو وقت حر']]}
  const sl=b-45-480+1440;
  if(k<3)return [[b-45,b,'الكعدة، فطور خفيف، ترتيب مكان الدراسة'],[b,b+150,0],[b+150,b+180,'استراحة قصيرة'],[b+180,b+330,1],[b+330,b+405,'غداء، صلاة، استراحة'],
    [b+405,b+450,'مشي أو رياضة خفيفة'],[b+450,b+570,'practice'],[b+570,b+630,'عشاء، صلاة، استراحة'],[b+630,b+675,'review'],[b+675,sl,'وقت حر وراحة قبل النوم'],[sl,sl+480,'نوم']];
  if(k>3)return [[b-45,b,'الكعدة، فطور خفيف، ترتيب مكان الدراسة'],[b,b+150,0],[b+150,b+180,'استراحة قصيرة'],[b+180,b+330,1],[b+330,b+405,'غداء، صلاة، استراحة'],
    [b+405,b+555,2],[b+555,b+585,'مشي أو رياضة خفيفة'],[b+585,b+735,3],[b+735,b+795,'عشاء، صلاة، استراحة'],[b+795,b+885,'practice'],[b+885,sl,'review'],[sl,sl+480,'نوم']];
  const T=[[b-45,b,'الكعدة، فطور خفيف، ترتيب مكان الدراسة'],[b,b+150,0],[b+150,b+180,'استراحة قصيرة'],[b+180,b+330,1],[b+330,b+405,'غداء، صلاة، استراحة'],
    [b+405,b+555,2],[b+555,b+600,'مشي أو رياضة خفيفة'],[b+600,b+720,'practice'],[b+720,b+780,'عشاء، صلاة، استراحة'],[b+780,b+825,'review'],[b+825,b-45-480+1440,'وقت حر وراحة قبل النوم'],[b-45-480+1440,b-45+1440,'نوم']];
  return T;
}
const range=(a,b)=>clock(a)+' – '+clock(b);
// sessions a day on date d: the last choice made on or before d (3 before any choice); an afternoon start fits 3 at most
const kBase=d=>{let k=3;for(const x of prefs.sess)if(parseKey(x.from)<=d)k=x.k;return k};
const kOf=d=>schoolK(d,kBase(d));
const kNow=()=>kOf(new Date(Math.max(TODAY,START)));
const kDay=d=>d.getDay()===5?Math.max(1,kOf(d)-1):kOf(d);
// a block's time: its first session to its last; the running index restarts on each day
let spanI=0;const spanOf=(T,b)=>{const S=T.filter(r=>typeof r[2]==='number'),a=S[Math.min(Math.floor(spanI),S.length-1)],z=S[Math.min(Math.ceil(spanI+(b.w||1))-1,S.length-1)];spanI+=b.w||1;return range(a[0],z[1])};
const sessOf=TL=>TL.filter(r=>typeof r[2]==='number').map(r=>range(r[0],r[1]));

/* ---------- schedule ---------- */
// today can be overridden with ?today=2026-11-05 to preview how the plan looks later on
const TODAY=(()=>{const q=new URLSearchParams(location.search).get('today');const d=q&&parseKey(q);const t=d||new Date();t.setHours(0,0,0,0);return t})();
// hand out each subject's sessions day by day from `from` so subjects stay spread evenly, then split its lectures over them by video time
function allocate(act,from,Q,need){
  // each subject is cut into sessions first: as even as its session count allows, never more video than a session holds
  const mm=l=>l.dm||l.m,parts={},left={},used={};
  // light lessons run on their own daily line: one Islamic and one literature lesson a day, sharing a session
  const light={isl:act.includes('isl')?Q.isl.slice():[],ar:act.includes('ar')&&PARTS.ar?Q.ar.filter(l=>l.li===1):[]};
  for(const s of act){const all=Q[s],q=s==='isl'?[]:s==='ar'&&PARTS.ar?all.filter(l=>l.li!==1):all,cap=SESS_MIN,out=[];let p=0,rem=q.reduce((a,l)=>a+mm(l),0),tot=all.reduce((a,l)=>a+mm(l),0)||1,n=Math.max(1,Math.round(need[s]*rem/tot));
    for(let i=0;p<q.length;i++){const target=rem/Math.max(1,n-i),b=[];let acc=0;
      while(p<q.length&&(!b.length||(acc+mm(q[p])/2<=target&&acc+mm(q[p])<=cap))){b.push(q[p]);acc+=mm(q[p]);p++}
      rem-=acc;out.push(b)}
    parts[s]=out;left[s]=out.length;used[s]=0}
  // one video longer than a session counts as the sessions it really takes
  const wOf=s=>{const b=parts[s][used[s]];return b.length===1?Math.max(1,Math.ceil(mm(b[0])/(SESS_MIN*1.1))):1};
  const days=[];const d=new Date(from);
  while(act.some(s=>left[s]>0)||light.isl.length||light.ar.length){
    const fri=d.getDay()===5,k0=kDay(d),lt=['isl','ar'].filter(s=>light[s].length),useL=lt.length&&(k0>=2||!act.some(s=>left[s]>0)),k=useL?Math.max(0,k0-1):k0,pick=[];let u=0;const take=s=>{pick.push(s);u+=wOf(s)};
    const cand=act.filter(s=>left[s]>0&&!pick.includes(s)).sort((a,b)=>(left[b]/parts[b].length)-(left[a]/parts[a].length)||left[b]-left[a]);
    for(const s of cand){if(u>=k)break;if(u&&u+wOf(s)>k)continue;take(s)}
    const blocks=pick.sort((a,b)=>RANK[a]-RANK[b]).map(s=>{const w=wOf(s),lecs=parts[s][used[s]];used[s]++;left[s]--;return {s,lecs,w}});
    if(useL)for(const s of lt)blocks.push({s,lecs:[light[s].shift()],w:lt.length>1?.5:1});
    if(fri)blocks.push({s:'rev',plain:'مراجعة الأسبوع: ارجع لملخصات كل مادة وحل ١٠ أسئلة وزارية منها'});
    days.push({d:new Date(d),blocks});d.setDate(d.getDate()+1);
  }
  return days;
}
// the teacher of one chapter: its own choice if the student picked one, otherwise the subject's teacher
const subjTeacher=s=>C[s].teachers.find(x=>x.id===prefs.teacher[s])||defOf(s);
const chapTeacher=(s,li)=>{const id=prefs.chap[s]&&prefs.chap[s][li];const t=id&&C[s].teachers.find(x=>x.id===id&&x.lists[li]);if(t)return t;
  const st=subjTeacher(s);return st.lists[li]?st:mainOf(s)};
// one "teacher" per subject made of each chapter's chosen playlist, so the rest of the plan reads lists[li] as before
// a lecture's part: Arabic has a chapter of its own for literature; English lectures are told apart by their titles
const PARTS={eng:{g:'القواعد',l:'الأدب والإنشاء'},ar:{g:'القواعد',l:'الأدب'}};
const LIT=/ان?شاء|إنشاء|أنشاء|مقال|قطعة|قطع |اسقاط|إسقاط|أسقاط|املاء|إملاء|أملاء|ادب|أدب|رواية|النصائح|موضوع|إيميل|ايميل|passage|essay/i;
const partOf=(s,li,title)=>s==='ar'?(li===1?'l':'g'):LIT.test(title)?'l':'g';
const partTeacher=(s,k)=>{const id=prefs.part[s]&&prefs.part[s][k],t=id&&C[s].teachers.find(x=>x.id===id);return t||subjTeacher(s)};
function partList(s,li){const M=mainOf(s),tg=partTeacher(s,'g'),tl=partTeacher(s,'l');
  const take=(t,k)=>{const L=t.lists[li]||M.lists[li],by=t.lists[li]?t:M;return {by,L,v:L.v.filter(x=>partOf(s,li,x[1])===k).map(x=>[x[0],x[1],x[2],L.id])}};
  const a=take(tg,'g'),b=take(tl,'l'),v=a.v.concat(b.v);
  if(!v.length||!a.v.length&&s==='eng'||!b.v.length&&s==='eng')return null;
  const by=[...new Set([a.by,b.by].filter((t,i)=>[a,b][i].v.length).map(t=>t.name))].join(' و');
  return {...M.lists[li],id:(a.v[0]||b.v[0])[3],y:(a.v.length?a:b).L.y,v,by,tid:a.by.id===b.by.id&&a.by.main?M.id:'part'}}
// focused review: each grammar chapter is the review videos, played as they are (not mapped onto the main teacher's lectures)
const gramH=lists=>Math.round(lists.reduce((a,l,li)=>a+(li===1?0:l.v.reduce((x,v)=>x+v[2],0)),0)/60);
const fullH=s=>gramH(mixBase(s).lists),revH=s=>{const R=C[s].review,b=mixBase(s).lists;return gramH(b.map((l,li)=>R.lists[li]?{v:R.lists[li]}:l))};
const revOn=s=>!!(prefs.rev[s]&&C[s].review);
function mixTeacher(s){const t=mixBase(s);if(!revOn(s))return t;const R=C[s].review,M=mainOf(s);
  return {...t,id:'rev',lists:t.lists.map((l,li)=>R.lists[li]?{t:M.lists[li].t,id:R.id,y:R.y,by:R.by,tid:'rev',direct:true,v:R.lists[li]}:l)}}
function mixBase(s){const n=mainOf(s).lists.length,ts=[];
  if(PARTS[s]&&prefs.part[s]){const base=subjTeacher(s),names=[partTeacher(s,'g').name,partTeacher(s,'l').name];
    const lists=Array.from({length:n},(_,li)=>{const p=partList(s,li);if(p)return p;const t=chapTeacher(s,li),l=t.lists[li];return {...l,by:l.by||t.name,tid:t.id}});
    return {id:'part',name:[...new Set(names)].join(' و'),main:false,lists}}
  const lists=Array.from({length:n},(_,li)=>{const t=chapTeacher(s,li);ts.push(t);const l=t.lists[li];return {...l,by:l.by||t.name,tid:t.id}});
  const one=ts.every(t=>t.id===ts[0].id);
  return {id:one?ts[0].id:'mix',name:one?ts[0].name:[...new Set(ts.map(t=>t.name))].join(' و'),main:ts.every(t=>t.main),lists}}
// re-plan from R: lectures not ticked before R come first, on R itself, and everything after them moves back to make room.
// Sessions and daily limits stay the same and every subject keeps its book order. Lectures ticked before R stay on their days.
function placeMissed(days,missed,R){
  const isLight=b=>b.s==='isl'||(b.s==='ar'&&PARTS.ar&&b.lecs.every(l=>l.li===1));
  const before=days.filter(x=>x.past||x.d<R),future=days.filter(x=>!x.past&&x.d>=R);
  // a day that stays as it is before R (today, when re-planning from tomorrow) takes the earliest lectures, so the book order never runs backwards
  const kind=l=>l.s+(l.li===1&&PARTS.ar&&l.s==='ar'?'L':'');missed=missed.slice();
  for(const x of before){if(x.past)continue;for(const b of x.blocks){if(!b.lecs||!b.lecs.length)continue;const key=kind({...b.lecs[0],s:b.s}),open=b.lecs.filter(l=>!done['v'+l.v]),late=missed.filter(l=>kind(l)===key);if(!open.length||!late.length)continue;
    const all=open.map(l=>({...l,s:b.s})).concat(late).sort((u,v)=>u.qi-v.qi),stay=all.slice(0,open.length),go=all.slice(open.length);
    b.lecs=b.lecs.filter(l=>done['v'+l.v]).concat(stay).sort((u,v)=>u.qi-v.qi);stay.forEach(l=>{if(l.from)l.to=new Date(x.d)});missed=missed.filter(l=>kind(l)!==key).concat(go)}}
  // the coming sessions, oldest first, with the late lectures in front of them
  const heavy=[],light={isl:[],ar:[]},late=[];
  const lateOf=s=>missed.filter(l=>l.s===s);
  for(const s of new Set(missed.map(l=>l.s))){const L=lateOf(s),lit=L.filter(l=>s==='isl'||(s==='ar'&&PARTS.ar&&l.li===1)),rest=L.filter(l=>!lit.includes(l));
    if(lit.length)light[s].push(...lit);let cur=null,acc=0;
    for(const l of rest){const m=l.dm||l.m;if(!cur||acc+m>SESS_MIN){cur={s,lecs:[]};late.push(cur);acc=0}cur.lecs.push(l);acc+=m}}
  for(const x of future)for(const b of x.blocks){if(!b.lecs)continue;if(isLight(b))light[b.s].push(...b.lecs);else heavy.push({s:b.s,lecs:b.lecs.slice()})}
  const queue=late.concat(heavy);
  // each subject back in book order over its sessions, so a day never shows 7, 5, 6
  for(const s of new Set(queue.map(b=>b.s))){const B=queue.filter(b=>b.s===s),all=B.flatMap(b=>b.lecs).sort((a,b)=>a.qi-b.qi);let p=0;for(const b of B){b.lecs=all.slice(p,p+b.lecs.length);p+=b.lecs.length}}
  for(const k in light)light[k].sort((a,b)=>a.qi-b.qi);
  const wOf=b=>b.lecs.length===1?Math.max(1,Math.ceil((b.lecs[0].dm||b.lecs[0].m)/(SESS_MIN*1.1))):1;
  const out=before.slice(),d=new Date(R);
  while(queue.length||light.isl.length||light.ar.length){
    const fri=d.getDay()===5,k0=kDay(d),lt=['isl','ar'].filter(s=>light[s].length),useL=lt.length&&(k0>=2||!queue.length),k=useL?Math.max(0,k0-1):k0,pick=[];let u=0;
    for(let i=0;i<queue.length&&u<k;){const b=queue[i],w=wOf(b);
      if(pick.some(x=>x.s===b.s)||queue.slice(0,i).some(x=>x.s===b.s)||(u&&u+w>k)){i++;continue}
      pick.push({...b,w});u+=w;queue.splice(i,1)}
    const blocks=pick.sort((a,b)=>RANK[a.s]-RANK[b.s]);
    if(useL)for(const s of lt)blocks.push({s,lecs:[light[s].shift()],w:lt.length>1?.5:1});
    if(fri)blocks.push({s:'rev',plain:'مراجعة الأسبوع: ارجع لملخصات كل مادة وحل ١٠ أسئلة وزارية منها'});
    for(const b of blocks)for(const l of b.lecs||[])if(l.from)l.to=new Date(d);
    out.push({d:new Date(d),blocks});d.setDate(d.getDate()+1)}
  return out}
// slot i of a chapter shows the chosen teacher's lectures at the same place in the chapter (a teacher with more lectures shows two
// in some slots, one with fewer repeats a lecture marked "تكملة"), so switching teachers never moves a day or loses a tick
function slotsOf(s,t){const M=mainOf(s),out=[];
  M.lists.forEach((ml,li)=>{const L=t.lists[li],alt=L.tid!==M.id,n=ml.v.length,k=L.v.length;let prev=-1;
    if(L.direct){L.v.forEach(x=>out.push({v:x[0],t:x[1],m:x[2],dm:x[2],li,show:[{v:x[0],t:x[1],m:x[2],pl:L.id}]}));return}
    ml.v.forEach((mv,i)=>{let show;
      if(!alt)show=[{v:mv[0],t:mv[1],m:mv[2],pl:ml.id}];
      else{const a=Math.min(k-1,Math.floor(i*k/n)),b=Math.max(a+1,Math.floor((i+1)*k/n));show=L.v.slice(a,b).map((x,j)=>({v:x[0],t:x[1],m:x[2],pl:x[3]||L.id,cont:a+j<=prev}));prev=b-1}
      out.push({v:mv[0],t:show.map(x=>x.t+(x.cont?' (تكملة)':'')).join(' + '),m:mv[2],dm:show.reduce((a,x)=>a+(x.cont?0:x.m),0)||show[0].m,li,show})})});
  const cut=[];for(const l of out){if(l.show.length===1&&!l.show[0].cont&&l.dm>165){const n=Math.ceil(l.dm/150),p=Math.ceil(l.dm/n);
    for(let i=0;i<n;i++){const part=' (جزء '+ar(i+1)+' من '+ar(n)+')',m=Math.min(p,l.dm-i*p);cut.push({...l,v:i?l.v+'~'+(i+1):l.v,t:l.t+part,m:Math.round(l.m/n),dm:m,show:[{...l.show[0],t:l.show[0].t+part,m,start:i*p*60}]})}}else cut.push(l)}
  return cut}
const MIG=PREF.replace('prefs','slots1');
function build(){
  const act=ORDER.filter(s=>prefs.subjects[s]);
  const T={},Q={},tot={};SIB=new Map();
  for(const s of act){
    const t=mixTeacher(s);T[s]=t;
    Q[s]=slotsOf(s,t);Q[s].forEach((l,i)=>l.qi=i);
    // slots that only repeat the video before them form one group, ticked as one
    {let g=null;Q[s].forEach((l,i)=>{if(i&&l.show.every(x=>x.cont)){g=g||['v'+Q[s][i-1].v];g.push('v'+l.v);for(const id of g)SIB.set(id,g)}else g=null})}
    // once: ticks and hard flags saved on an alternate teacher's videos move to the slots that show those videos
    if(!get(MIG))for(const l of Q[s])if(l.show[0].v!==l.v)for(const k of [done,hard])if(!k['v'+l.v]&&l.show.every(x=>k['v'+x.v]))k['v'+l.v]=1;
    if(chapTeacher(s,0).main&&!revOn(s)&&DONE_BEFORE[s])Q[s].splice(0,DONE_BEFORE[s]);
    tot[s]=Q[s].reduce((a,x)=>a+x.m,0);
  }
  // sessions per subject follow the main teacher's video time, and a longer chosen teacher gets more of them (a shorter one keeps the same days)
  const need={};for(const s of act){const mt=mainOf(s).lists.reduce((a,l)=>a+l.v.reduce((x,v)=>x+v[2],0),0);const qt=Q[s].reduce((a,x)=>a+(x.dm||x.m),0);need[s]=Math.max(1,Math.round((revOn(s)?qt:Math.max(mt,qt))/SLOT))}
  let days=allocate(act,START,Q,need);
  const sh=prefs.shift,R=sh&&parseKey(sh.from);
  // a re-plan saved before the day it was made was kept: "from tomorrow" pressed on Tuesday used to empty Tuesday too
  if(sh&&R&&!sh.at){sh.at=kk(new Date(Math.min(R,TODAY)));savePrefs()}
  const A=R&&(parseKey(sh.at)||R);
  if(R&&A>START){
    // days before the re-plan day keep what was ticked; what was not ticked moves back into its own subject's coming lectures
    // and stays listed on its day with the day it moved to. Today and later are never counted as missed.
    const missed=[];
    days=days.map(x=>{if(x.d>=A)return x;
      const blocks=x.blocks.map(b=>{if(b.s==='rev')return b;const moved=b.lecs.filter(l=>!done['v'+l.v]).map(l=>({...l,s:b.s,from:x.d}));missed.push(...moved);return {s:b.s,lecs:b.lecs.filter(l=>done['v'+l.v]),moved}});
      return {d:x.d,past:true,blocks:blocks.filter(b=>b.s==='rev'||b.lecs.length||b.moved.length)}});
    if(missed.length)days=placeMissed(days,missed,R);
  }
  // monthly exams go into this same plan (see mMerge)
  const base=days;P={act,T,Q,days:base,base};const mon=mPlan(base);days=mMerge(base,mon);
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
  if(!get(MIG)){put(MIG,1);saveDone();put(HARD,hard)}
  return {act,T,Q,days,tot,slots,ids,idsBy,base,mon};
}

/* ---------- render ---------- */
let done={};try{done=JSON.parse(localStorage.getItem(DONE)||'{}')}catch(e){}if(!done||typeof done!=='object'||Array.isArray(done))done={};
const saveDone=()=>{try{localStorage.setItem(DONE,JSON.stringify(done))}catch(e){}};
let hard=get(HARD)||{};
const FLAG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>';
let P=null,allIds=[],todayEl=null,filter='all',mDue=new Map(),SIB=new Map();
const $=id=>document.getElementById(id);

function render(){
  P=build();const {act,T,days}=P;allIds=[];todayEl=null;
  mDue=new Map();for(const e of monthly){const d=parseKey(e.d);if(act.includes(e.s)&&d>=TODAY)for(const l of mLectures(e.s,e.li,e.to,e.r)){const u=new Date(d);u.setDate(u.getDate()-1);mDue.set(l.v,{u,s:e.s})}}
  const studyEnd=days.filter(x=>!x.review).slice(-1)[0];
  $('hTitle').textContent='خطة السادس العلمي — من '+dstr(START)+' إلى '+dstr(days[days.length-1].d);
  let L=0,M=0;days.forEach(x=>x.blocks.forEach(b=>(b.lecs||[]).forEach(l=>{L++;M+=l.m})));
  $('sDays').textContent=ar(days.length);$('sLect').textContent=ar(L);$('sHrs').textContent=ar(Math.round(M/60));

  // teachers table with the alternate-teacher choice
  // the subject select sets every chapter; each chapter's own select overrides it for that chapter only
  $('tBody').innerHTML=ORDER.map(s=>{const on=prefs.subjects[s],t=subjTeacher(s),mix=mixTeacher(s);
    // a chapter's menu lists only the teachers who recorded it; the subject menu marks teachers missing chapters
    const opt=(sel,short,li)=>C[s].teachers.filter(x=>li===undefined||x.lists[li]).map(x=>`<option value="${x.id}"${x.id===sel?' selected':''}>${esc(short?x.name.replace(/^(الأستاذ|الست)\s+/,''):x.name)}${x===defOf(s)?' (رئيسي)':short?'':x.lists.length<mainOf(s).lists.length?' (بديل، بعض الفصول)':' (بديل)'}</option>`).join('');
    return `<tr class="${on?'':'off'}"><td><span class="tag" style="--c:var(${COLOR[s]})"><span class="dot"></span>${C[s].name}</span>${on?'':'<br><span class="alt">محذوفة من جدولك</span>'}</td>
      <td><label class="vh" for="tsel-${s}">مدرس ${C[s].name} لكل الفصول</label><select class="tsel" id="tsel-${s}" data-s="${s}"${on?'':' disabled'}>${opt(t.id)}</select>${mix.id==='mix'?'<span class="alt mixed">فصول بمدرسين مختلفين</span>':''}${PARTS[s]&&on?`<div class="parts">${['g','l'].map(k=>`<label>${PARTS[s][k]}<select class="psel" data-s="${s}" data-k="${k}"${k==='g'&&revOn(s)?' disabled':''}>${opt(partTeacher(s,k).id,true)}</select></label>`).join('')}</div>`:''}${C[s].review&&on?`<div class="parts rev-mode"><label>دراسة القواعد<select class="rsel" data-s="${s}"><option value="full"${revOn(s)?'':' selected'}>محاضرات كاملة (${ar(fullH(s))} ساعة)</option><option value="rev"${revOn(s)?' selected':''}>مراجعة مركزة: ${esc(C[s].review.by.replace(/^(الأستاذ|الست)\s+/,''))} (${ar(revH(s))} ساعة)</option></select></label></div>`:''}</td>
      <td class="chaps">${mix.lists.map((l,li)=>`<div class="chap${l.tid!==t.id?' own':''}"><span class="chap-t"><a href="${PL(l.id)}" target="_blank" rel="noopener">${esc(l.t)}</a> <span class="alt">(${esc(l.y)} · ${ar(l.v.length)})</span></span>
        <label class="vh" for="csel-${s}-${li}">مدرس ${esc(l.t)}</label><select class="csel" id="csel-${s}-${li}" data-s="${s}" data-li="${li}"${on&&!l.direct?'':' disabled'}>${l.direct?`<option selected>${esc(l.by.replace(/^(الأستاذ|الست)\s+/,''))} · مراجعة</option>`:''}${opt(l.tid,true,li)}</select></div>`).join('')}</td></tr>`}).join('');
  document.querySelectorAll('.rsel').forEach(el=>el.onchange=()=>{const s=el.dataset.s,on=el.value==='rev';if(on)prefs.rev[s]=true;else delete prefs.rev[s];savePrefs();
    rerender(on?'قواعد '+C[s].name+' صارت مراجعة مركزة لـ'+C[s].review.by+' ('+ar(revH(s))+' ساعة بدل '+ar(fullH(s))+')، والمحاضرات الكاملة اللي أشّرتها تبقى محفوظة':'قواعد '+C[s].name+' رجعت محاضرات كاملة، وتقدّمك بيها بقى مثل ما هو')});
  document.querySelectorAll('.psel').forEach(el=>el.onchange=()=>{const s=el.dataset.s,k=el.dataset.k,o=prefs.part[s]||(prefs.part[s]={});o[k]=el.value;
    if((o.g||subjTeacher(s).id)===subjTeacher(s).id&&(o.l||subjTeacher(s).id)===subjTeacher(s).id)delete prefs.part[s];savePrefs();rerender(C[s].name+'، '+PARTS[s][k]+' صار على '+C[s].teachers.find(x=>x.id===el.value).name+'، وتقدّمك بقى مثل ما هو')});
  document.querySelectorAll('.tsel').forEach(el=>el.onchange=()=>{const s=el.dataset.s;prefs.teacher[s]=el.value;prefs.chap[s]={};delete prefs.part[s];savePrefs();const st=subjTeacher(s);rerender(st.lists.length<mainOf(s).lists.length?C[s].name+' صارت على '+st.name+'، والفصول اللي بعده ما سجّلها تبقى على '+mainOf(s).name:'صارت كل فصول '+C[s].name+' على '+st.name)});
  document.querySelectorAll('.csel').forEach(el=>el.onchange=()=>{const s=el.dataset.s,li=el.dataset.li,ch=prefs.chap[s]||(prefs.chap[s]={});delete prefs.part[s];
    if(el.value===prefs.teacher[s])delete ch[li];else ch[li]=el.value;savePrefs();
    rerender(C[s].name+'، '+mainOf(s).lists[li].t+'، صار على '+chapTeacher(s,li).name)});

  // subjects editor
  $('subjBox').innerHTML=ORDER.map(s=>`<label class="sch"><input type="checkbox" data-s="${s}"${prefs.subjects[s]?' checked':''}> <span class="dot" style="--c:var(${COLOR[s]})"></span>${C[s].name} <span class="alt">(${ar(Math.round(mixTeacher(s).lists.reduce((a,l)=>a+l.v.reduce((y,v)=>y+v[2],0),0)/60))} ساعة)</span></label>`).join('');

  // day timeline
  const TL=timeline(),SESS_K=kNow();
  $('ttBody').innerHTML=TL.map(([a,b,w])=>{const st=typeof w==='number'||w==='practice'||w==='review';
    const txt=typeof w==='number'?'الجلسة '+ar(w+1)+': المادة '+['الأولى بجدول اليوم (الأصعب، وذهنك صافي)','الثانية','الثالثة','الرابعة'][w]:w==='practice'?'الجلسة '+ar(SESS_K+1)+': حل تمارين الكتاب والأسئلة الوزارية لمحاضرات اليوم':w==='review'?'مراجعة ملخص اليوم، وتشوف جدول باجر':w;
    return `<tr class="${st?'study':'free'}"><td>${w==='نوم'?clock(a):range(a,b)}</td><td>${txt}</td></tr>`}).join('');
  const sc=prefs.school;$('schA').value=sc?sc.a:'';$('schB').value=sc?sc.b:'';$('schClear').hidden=!sc;$('schNote').hidden=!sc;
  if(sc){const k=kBase(new Date(Math.max(TODAY,START))),n=schoolFit(k);$('schNote').textContent=n<k?'بأيام الدوام وقتك يكفي '+SESS_W(n)+' بس، فالجدول ينطيك '+SESS_W(n)+' ويكمل الباقي بالأيام الجاية.':'بأيام الدوام جلساتك كلها برا وقت المدرسة. الجمعة والسبت تمشي على ساعة بدايتك فوق.'}
  if(sc&&studyEnd){const ex=prefs.exam&&parseKey(prefs.exam);$('schNote').textContent+=' بهذا الدوام دروسك تخلص '+dstr(studyEnd.d)+(ex&&studyEnd.d>=ex?'، يعني بعد موعد امتحانك. زيد الجلسات بأيام العطلة أو اختار ساعات أكثر.':'.')}
  $('schSave').onclick=()=>{let a=$('schA').value,b=$('schB').value;if(!a||!b||a===b){toast('اكتب وقت الذهاب ووقت الرجوع');return}const sw=a>b;if(sw)[a,b]=[b,a];
    prefs.school={a,b,from:kk(new Date(Math.max(TODAY,START)))};savePrefs();rerender((sw?'الوقتين چانوا معكوسين فعدّلناهم. ':'')+'انحفظ دوامك، والجدول صار برا أوقات المدرسة من اليوم وجاي')};
  $('schClear').onclick=()=>{delete prefs.school;savePrefs();rerender('انشال الدوام، والجدول رجع على ساعة بدايتك')};
  $('hourBox').innerHTML=HOURS.map(h=>`<button type="button" class="hbtn" data-h="${h}" aria-pressed="${h===prefs.hour}">${hourLabel(h)}</button>`).join('');
  document.querySelectorAll('.hbtn').forEach(b=>b.onclick=()=>{const k4=kNow()>3;prefs.hour=+b.dataset.h;if(k4&&prefs.hour>=12){const f=new Date(Math.max(TODAY,START));prefs.sess=prefs.sess.filter(x=>parseKey(x.from)<f);prefs.sess.push({from:kk(f),k:3})}savePrefs();rerender('صار يومك يبدي الساعة '+hourLabel(prefs.hour)+(k4&&prefs.hour>=12?'، وبالعصر تكفي ٣ جلسات باليوم':''))});
  const SESS=sessOf(TL);
  sessBox($('sessBox'),kBase(new Date(Math.max(TODAY,START))),k=>{const f=new Date(Math.max(TODAY,START)),key=kk(f);prefs.sess=prefs.sess.filter(x=>parseKey(x.from)<f);
    if(kBase(new Date(f.getTime()-864e5))!==k||!prefs.sess.length)prefs.sess.push({from:key,k});savePrefs();
    rerender('صار يومك '+SESS_L[k][1]+' ('+SESS_W(k)+') من '+dstr(f)+'، والأيام اللي فاتت وتقدّمك بقت مثل ما هي')});
  const PR=TL.find(r=>r[2]==='practice'),RV=TL.find(r=>r[2]==='review');

  // subject summary
  $('weekKey').innerHTML=act.map(s=>`<div class="wk"><b style="color:var(${COLOR[s]})">${C[s].name}</b>${esc(T[s].name)}<br>${ar(P.slots[s]||0)} جلسة · ${ar(Math.round(P.tot[s]/60))} ساعة فيديو</div>`).join('')||'<p class="note">ما اخترت أي مادة. افتح "حدّث المواد" وأشّر المواد اللي تدرسها.</p>';

  // days
  const host=$('plan');host.innerHTML='';const today=TODAY;let weekEl=null,wn=0;
  days.forEach((p,i)=>{
    if(i===0||p.d.getDay()===6||(p.review&&!days[i-1].review)){weekEl=document.createElement('div');weekEl.className='week';const h=document.createElement('h3');
      if(p.review)h.innerHTML='<span class="phase">أسبوع المراجعة النهائية</span>';else{wn++;h.textContent='الأسبوع '+ar(wn)}weekEl.appendChild(h);host.appendChild(weekEl)}
    const mins=p.blocks.reduce((a,b)=>a+(b.lecs||[]).reduce((x,l)=>x+(l.dm||l.m),0),0),TD=timeline(kOf(p.d),p.d);spanI=0;
    const day=document.createElement('div');day.className='day'+(p.d.getDay()===5?' fri':'')+(p.past?' past':'');
    const isToday=p.d.getTime()===today.getTime();if(isToday){day.classList.add('today');todayEl=day}
    day.innerHTML=`<div class="date"><span class="dn">${DN[p.d.getDay()]}</span><span class="dd">${ar(p.d.getDate())}</span><span class="dm">${MN[p.d.getMonth()]}</span>${mins?`<span class="hrs">${dur(mins)} فيديو</span>`:''}${isToday?'<span class="tlabel">اليوم</span>':''}</div><div class="subjs"></div>`;
    const box=day.querySelector('.subjs');
    p.blocks.forEach((b,j)=>{
      const el=document.createElement('div');el.className='subj';el.dataset.s=b.s;el.style.setProperty('--c','var('+COLOR[b.s]+')');
      const nm=b.s==='rev'?'مراجعة':C[b.s].name,tm=b.added?'<span class="tm">جلسة إضافية</span>':`<span class="tm">${spanOf(TD,b)}</span>`,mt=b.mtag?'<span class="m-tag">'+esc(b.mtag)+'</span>':'';
      if(b.plain){const id=b.pid||'p'+kk(p.d)+'-'+j;allIds.push(id);
        el.innerHTML=`<div class="subj-h">${tm}${mt}</div><div class="lec"><input type="checkbox" id="${id}"><label for="${id}" class="plain"><span class="subj-h"><span class="s">${nm}</span></span> <span class="t">${esc(b.plain)}</span></label><span></span></div>`;check(el.querySelector('.lec'),id);
        if(b.hard&&b.hard.length){const t=T[b.s],h=document.createElement('div');h.className='hard-list';
          h.innerHTML=`<span class="hl-t">${FLAG}ابدأ بالمحاضرات اللي علّمتها صعبة (${ar(b.hard.length)})</span>`+b.hard.map(l=>lnk(l)).join('');el.appendChild(h)}}
      // a session that ended up with no new lecture (short subjects) becomes a review session instead of an empty box
      else if(!b.lecs.length&&!(b.moved&&b.moved.length)){el.innerHTML=`<div class="subj-h">${tm}<span class="s">${nm}</span><span class="w">ما بيها محاضرة جديدة اليوم: راجع آخر محاضرات ${nm} اللي أخذتها وحل تمارينها</span></div>`}
      else{const t=T[b.s],lists=[...new Set(b.lecs.concat(b.moved||[]).map(l=>l.li))].map(li=>t.lists[li]);const bm=b.lecs.reduce((a,l)=>a+(l.dm||l.m),0);
        const speed=bm>190?' · شغّلها بسرعة ١.٥':bm>150?' · شغّلها بسرعة ١.٢٥':'';
        const from=b.extra?b.lecs.reduce((m,l)=>l.from&&(!m||l.from<m)?l.from:m,null):null;
        el.innerHTML=`<div class="subj-h">${b.extra?'<span class="tm late-tag">تعويض</span>':tm}${mt}<span class="s">${nm}</span><span class="w">${b.extra?'ما لحكت بأيام المادة'+' · ':''}${lists.map(l=>esc(l.t)).join(' ← ')} · ${esc(lists[0]&&lists[0].by||t.name)}${speed}</span></div>`;
        b.lecs.forEach(l=>{const id='v'+l.v;allIds.push(id);const r=document.createElement('div');r.className='lec';
          r.innerHTML=`<input type="checkbox" id="${id}" aria-label="أنجزت ${esc(l.t)}"><label for="${id}">${lnk(l)}${mDue.has(l.v)&&p.d>=mDue.get(l.v).u?' <span class="mv-to">تدرسها قبل امتحان '+C[mDue.get(l.v).s].name+' من جدول الامتحانات</span>':''}</label><span class="m">${dur(l.dm||l.m)}</span><button type="button" class="flag" aria-pressed="${!!hard[id]}" aria-label="صعبة عليّ: ${esc(l.t)}" title="صعبة عليّ">${FLAG}</button>`;
          check(r,id);r.querySelector('.flag').onclick=()=>flagHard(id);el.appendChild(r)});
        (b.moved||[]).forEach(l=>{const r=document.createElement('div');r.className='lec moved';
          r.innerHTML=`<span class="mv-x" aria-hidden="true">↩</span><span>${lnk(l)} <span class="mv-to">ما خلصتها، انتقلت ${l.to?'ليوم '+DN[l.to.getDay()]+' '+ar(l.to.getDate())+'/'+ar(l.to.getMonth()+1):'لأيام التعويض'}</span></span><span class="m">${dur(l.dm||l.m)}</span><span></span>`;el.appendChild(r)})}
      box.appendChild(el)});
    if(p.past){const el=document.createElement('div');el.className='subj extra';el.dataset.s='extra';
      el.innerHTML=`<div class="subj-h"><span class="w">${p.blocks.some(b=>b.lecs&&b.lecs.length)?'هذا اللي خلصته بهذا اليوم، واللي ما خلصته انتقل لأيام نفس المادة الجاية بنفس تسلسله، ومكتوب جنب كل محاضرة وين صارت.':'ما خلصت محاضرات بهذا اليوم، ومحاضراته انتقلت لأيام نفس المادة الجاية بنفس تسلسله، ومكتوب جنب كل محاضرة وين صارت.'}</span></div>`;box.appendChild(el);weekEl.appendChild(day);return}
    [[TD.find(r=>r[2]==='practice'),'حل تمارين الكتاب والأسئلة الوزارية لمحاضرات اليوم'],[TD.find(r=>r[2]==='review'),'مراجعة ملخص اليوم وتشوف جدول باجر']].forEach(([r,w])=>{const el=document.createElement('div');el.className='subj extra';el.dataset.s='extra';
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

// hours-a-day buttons; 4 sessions is off for an afternoon start
function sessBox(el,cur,pick){
  el.innerHTML=SESS_N.map(k=>{const off=k>3&&prefs.hour>=12;return `<button type="button" class="hbtn sbtn" data-k="${k}" aria-pressed="${k===cur}"${off?' disabled title="يحتاج تبدي الصبح"':''}><b>${SESS_L[k][0]}</b> ${SESS_L[k][1]}<span class="alt"> · ${SESS_W(k)}</span></button>`}).join('');
  el.querySelectorAll('.sbtn').forEach(b=>b.onclick=()=>{const k=+b.dataset.k;if(k!==cur)pick(k)});
}

/* ---------- falling behind: offer to re-plan from today or tomorrow ---------- */
let lateManual=false;
function lateList(){return P.days.filter(x=>!x.review&&!x.past&&x.d<TODAY).flatMap(x=>x.blocks.flatMap(b=>(b.lecs||[]).filter(l=>!done['v'+l.v])))}
function updateLate(){
  const box=$('lateBox'),late=lateList(),sh=prefs.shift;
  if(!late.length&&!lateManual&&!sh){box.hidden=true;return}
  box.hidden=false;const mins=late.reduce((a,l)=>a+l.m,0);
  $('lateTitle').textContent=late.length?'عندك '+ar(late.length)+' محاضرة متأخرة من الأيام اللي فاتت ('+dur(mins)+' فيديو)':sh&&!lateManual?'رتبت جدولك من '+dstr(parseKey(sh.from)):'أعد ترتيب جدولك';
  $('lateText').textContent=late.length||lateManual?'المحاضرات اللي ما خلصتها ترجع لأول يوم تختاره بنفس تسلسلها، وباقي الجدول يتأخر وراها. واللي خلصته يبقى بيومه.':'يخلص جدولك هسه '+dstr(P.days[P.days.length-1].d)+'. إذا تريد ترجع للترتيب الأصلي اضغط تراجع.';
  $('lateActs').hidden=!(late.length||lateManual);$('lateUndo').hidden=!sh;
}
function shift(mode){
  const from=new Date(TODAY);if(document.querySelector('input[name="lateFrom"]:checked').value==='tomorrow')from.setDate(from.getDate()+1);
  const oldEnd=P.days[P.days.length-1].d;prefs.shift={from:kk(from),at:kk(TODAY),mode};savePrefs();lateManual=false;render();
  const end=P.days[P.days.length-1].d,diff=Math.round((end-oldEnd)/864e5);
  toast('رتبنا جدولك من '+dstr(from)+(diff>0?'، وطال '+ar(diff)+' يوم':diff<0?'، وقصر '+ar(-diff)+' يوم':'، ونفس تاريخ النهاية'));
  $('plan').querySelector('.day.today')?.scrollIntoView({behavior:'smooth',block:'center'});
}
$('lateExtend').onclick=()=>shift('fit');
$('lateFit').onclick=()=>shift('fit');
$('lateUndo').onclick=()=>{delete prefs.shift;prefs.undoAt=kk(TODAY);savePrefs();lateManual=false;rerender('رجع جدولك للترتيب الأصلي')};
$('lateOpen').onclick=()=>{lateManual=true;updateLate();$('lateBox').scrollIntoView({behavior:'smooth',block:'center'})};
function applyFilter(){document.querySelectorAll('.subj').forEach(t=>t.hidden=!(filter==='all'||t.dataset.s===filter));
  document.querySelectorAll('.day').forEach(d=>d.hidden=![...d.querySelectorAll('.subj')].some(t=>!t.hidden))}
// lectures ticked today stay on today's monthly sheet until tomorrow, so the day doesn't move on while the student is still in it
const DAT=PREF.replace('prefs','doneat2');const doneAt=Object.fromEntries(Object.entries(get(DAT)||{}).filter(([,v])=>v===kk(TODAY)));
function check(row,id){const cb=row.querySelector('input');cb.checked=!!done[id];row.classList.toggle('checked',cb.checked);
  cb.addEventListener('change',()=>{if(cb.checked){done[id]=1;if(row.closest('.day.today'))doneAt[id]=kk(TODAY)}else{delete done[id];delete doneAt[id]}put(DAT,doneAt);
    for(const sid of SIB.get(id)||[]){if(sid===id)continue;if(cb.checked)done[sid]=1;else delete done[sid];document.querySelectorAll('[id="'+sid+'"]').forEach(x=>{x.checked=cb.checked;const r=x.closest('.lec');if(r)r.classList.toggle('checked',cb.checked)})}row.classList.toggle('checked',cb.checked);saveDone();progress();updateLate();if(mView())mCards();
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
  const pad=n=>String(n).padStart(2,'0'),stamp=(d0,m)=>{const d=new Date(d0);d.setDate(d.getDate()+Math.floor(m/1440));m=((m%1440)+1440)%1440;return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(Math.floor(m/60))+pad(m%60)+'00'};
  const e=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
  const enc=new TextEncoder();
  const fold=line=>{let out='',cur='',n=0;for(const ch of line){const b=enc.encode(ch).length;if(n+b>73){out+=cur+'\r\n ';cur='';n=1}cur+=ch;n+=b}return out+cur};
  const now=new Date(),dt=now.getUTCFullYear()+pad(now.getUTCMonth()+1)+pad(now.getUTCDate())+'T'+pad(now.getUTCHours())+pad(now.getUTCMinutes())+'00Z';
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//khotta//plan6sci//AR','CALSCALE:GREGORIAN','X-WR-CALNAME:خطة السادس العلمي'];
  const ev=(d,a,b,title,desc,uid)=>L.push('BEGIN:VEVENT','UID:'+uid+'@khotta','DTSTAMP:'+dt,'DTSTART:'+stamp(d,a),'DTEND:'+stamp(d,b),'SUMMARY:'+e(title),'DESCRIPTION:'+e(desc),
    'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+e(title),'TRIGGER:-PT5M','END:VALARM','END:VEVENT');
  let n=0;
  for(const p of P.days){if(p.past||p.d<TODAY)continue;const k=kk(p.d),TL=timeline(kOf(p.d),p.d),S=TL.filter(r=>typeof r[2]==='number'),PR=TL.find(r=>r[2]==='practice');
    p.blocks.forEach((b,j)=>{const r=S[j]||S[S.length-1],nm=b.s==='rev'?'مراجعة':C[b.s].name;
      const desc=b.plain?b.plain:(b.lecs||[]).map(l=>'- '+l.t+' ('+l.m+' د)\n'+l.show.map(x=>V(x.v,x.pl)).join('\n')).join('\n');
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
  if(!w.hidden)w.textContent='جدولك يخلص '+dstr(end)+'، '+(late?'بعد موعد امتحانك بـ '+(late===1?'يوم':late===2?'يومين':ar(late)+(late<11?' أيام':' يوم')):'بنفس يوم امتحانك')+'. إذا تأخرت محاضرات شغّل المحاضرات بسرعة أعلى حتى تلحك، أو زيد ساعات الدراسة.';
}
$('examBtn').onclick=()=>{const e=$('examEdit');e.hidden=!e.hidden;$('examBtn').setAttribute('aria-expanded',!e.hidden);if(!e.hidden){$('examDate').value=prefs.exam?prefs.exam.split('-').map((x,i)=>i?x.padStart(2,'0'):x).join('-'):'';$('examDate').focus()}};
$('examSave').onclick=()=>{const v=$('examDate').value;if(!v)return;const [y,m,d]=v.split('-').map(Number);prefs.exam=y+'-'+m+'-'+d;savePrefs();$('examEdit').hidden=true;$('examBtn').setAttribute('aria-expanded','false');
  rerender('انحفظ موعد امتحانك '+dstr(new Date(y,m-1,d)))};
$('examClear').onclick=()=>{delete prefs.exam;savePrefs();$('examEdit').hidden=true;$('examBtn').setAttribute('aria-expanded','false');rerender('شلت موعد الامتحان')};

function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,3200)}
function rerender(msg){const y=scrollY;render();scrollTo(0,y);if(msg)toast(msg)}

/* ---------- subjects editor ---------- */
$('subjToggle').onclick=()=>{const box=$('subjEdit');box.hidden=!box.hidden;$('subjToggle').setAttribute('aria-expanded',!box.hidden)};
$('subjApply').onclick=()=>{if(![...document.querySelectorAll('#subjBox input')].some(i=>i.checked)){toast('اختار مادة وحدة على الأقل');return}const before=P.days.length;document.querySelectorAll('#subjBox input').forEach(i=>prefs.subjects[i.dataset.s]=i.checked);savePrefs();
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
// saved exams are re-checked: id goes into markup and li indexes the chapter lists
let monthly=(Array.isArray(get(MKEY))?get(MKEY):[]).filter(e=>e&&Object.prototype.hasOwnProperty.call(C,e.s)&&parseKey(e.d)&&Array.isArray(e.li)&&/^[a-z]+-[0-9-]+$/.test(e.id)&&e.li.every(li=>Number.isInteger(li)&&li>=0&&li<mainOf(e.s).lists.length)).map(e=>{if(e.r!=null){const r={};for(const k of ['f','t'])if(typeof e.r[k]==='string'&&e.r[k])r[k]=e.r[k];if(r.f||r.t)e.r=r;else delete e.r}return e});
const saveM=()=>put(MKEY,monthly);
const mView=()=>document.body.classList.contains('m-view');
const daysWord=n=>n===1?'يوم':n===2?'يومين':ar(n)+(n<11?' أيام':' يوم');
// the subject's lectures in the chosen chapters, from the teacher the student picked
// `to` is the last lecture the exam covers, when it stops partway through a chapter
// MRANGE: a chapter the exam can cover from one lecture to another (Arabic literature); `r` is {f,t}, the first and last lecture
const MRANGE={ar:1};
const baseV=v=>String(v).split('~')[0];
// lectures a..b of L, with every part of a long video cut in pieces kept together
function mSlice(L,f,t){let a=f==null?-1:L.findIndex(l=>String(l.v)===String(f)),b=t==null?-1:L.findIndex(l=>String(l.v)===String(t));
  if(a<0)a=0;if(b<0)b=L.length-1;else while(b+1<L.length&&baseV(L[b+1].v)===baseV(L[b].v))b++;
  if(a>b){const x=a;a=b;b=x}return L.slice(a,b+1)}
// an exam saved before the range existed kept its literature end in `to`: read it as the range end
function mNorm(s,to,r){const k=MRANGE[s];if(k!=null&&to!=null&&P.Q[s].some(l=>l.li===k&&String(l.v)===String(to)))return {to:null,r:r||{t:to}};return {to,r}}
const lecT=(s,v)=>{const l=P.Q[s].find(l=>String(l.v)===String(v));return l?l.t:''};
// what the card says the exam covers: each chapter, with where it starts or stops when the student picked that
function mScope(e,t){const {to,r}=mNorm(e.s,e.to,e.r),k=MRANGE[e.s],main=e.li.filter(li=>li!==k),last=main.length?Math.max(...main):-1;
  return e.li.map(li=>{const c=t.lists[li];if(!c)return '';let x=esc(c.t);
    if(li===k&&r){const f=r.f&&lecT(e.s,r.f),tt=r.t&&lecT(e.s,r.t);x+=(f?' من «'+esc(f)+'»':'')+(tt?' لحد «'+esc(tt)+'»':'')}
    else if(li===last&&to!=null&&lecT(e.s,to))x+=' لحد «'+esc(lecT(e.s,to))+'»';return x}).filter(Boolean).join('، ')}
function mLectures(s,lis,to,r){const k=MRANGE[s],Q=P.Q[s];
  ({to,r}=mNorm(s,to,r));
  const keep=new Set(mSlice(Q.filter(l=>lis.includes(l.li)&&l.li!==k),null,to));
  if(k!=null&&lis.includes(k))mSlice(Q.filter(l=>l.li===k),r&&r.f,r&&r.t).forEach(l=>keep.add(l));
  return Q.filter(l=>keep.has(l))}
// default chapters: the ones the main plan reaches before the exam day
function mDefaultLists(s,ex){const set=new Set();for(const x of P.days){if(x.d>=ex)break;for(const b of x.blocks)if(b.s===s)(b.lecs||[]).forEach(l=>set.add(l.li))}
  return set.size?[...set].sort((a,b)=>a-b):[0]}
// Monthly exams schedule, built on how study specialists recommend preparing: spread over days (spacing), self-testing every day
// (retrieval practice), a timed mock exam two days before, a light review and full sleep the night before, nothing new on exam day,
// and a cap on how much exam work goes into one day so the main plan keeps moving.
const SESS_MIN=150,lm=l=>l.dm||l.m;
// the exams schedule uses the main plan's own sessions, so both pages show the same day
const MK=()=>kNow();
// `base` is the main plan before exams are put into it; its days tell which subjects study on which day
function mPlan(base){base=base||P.base||P.days;
  const from=new Date(Math.max(TODAY,START));
  const ex=monthly.filter(e=>P.act.includes(e.s)).map(e=>({...e,date:parseKey(e.d)})).filter(e=>e.date>=from).sort((a,b)=>a.date-b.date);
  if(!ex.length)return {ex,days:[]};
  const days=[];for(const d=new Date(from);d<=ex[ex.length-1].date;d.setDate(d.getDate()+1))days.push({d:new Date(d),prep:[],exams:[],fri:d.getDay()===5});
  for(const e of ex){
    const n=Math.round((e.date-from)/864e5),L=mLectures(e.s,e.li,e.to,e.r);
    e.R=L.filter(l=>!done['v'+l.v]||doneAt['v'+l.v]);const un=e.R.filter(l=>!done['v'+l.v]);e.total=L.length;e.left=un.length;e.mins=un.reduce((a,l)=>a+lm(l),0);e.n=n;days[n].exams.push(e);
    e.mock=n>=6;e.review=n>=2;e.dlF=n-(e.review?1:0);e.dl=e.dlF-(e.mock?1:0);
    if(e.mock)days[n-2].prep.push({e,plain:'امتحان تجريبي لنفسك: ورقة أسئلة وزارية من '+C[e.s].name+' للفصول المطلوبة بنفس وقت الامتحان الحقيقي، وبعدها صحح أخطاءك واكتبها بدفتر الأخطاء'});
    if(e.review)days[n-1].prep.push({e,plain:'مراجعة خفيفة لـ'+C[e.s].name+': ملخصاتك ودفتر الأخطاء والمحاضرات اللي علّمتها صعبة، بدون محاضرات جديدة. نام ٧ إلى ٨ ساعات، النوم يثبّت اللي حفظته'});
  }
  // exam day belongs to that exam: nothing else is planned on it
  for(const e of ex){if(e.mock&&days[e.n-2].exams.length)e.mock=false;if(e.review&&days[e.n-1].exams.length)e.review=false}
  days.forEach(x=>{if(x.exams.length)x.prep=[]});
  // new lectures go into real sessions: a session holds SESS_MIN of video (one long lecture alone is fine) and what is left takes another
  // session. Monthly exams come first: their lectures take the day's sessions in full (two a day per subject at most, so a subject doesn't fill the whole day; a video longer than a session takes the sessions it needs)
  // and the main plan gets what is left. If that can't finish them, the mock day is used too and every exam subject takes one session before any takes a second, so the nearest exam can't eat the time of the others. What still doesn't fit is told to the student on the card, never squeezed into a session.
  const dayK=d=>kDay(d);
  const hardK=x=>Math.max(1,dayK(x.d)-(x.exams.length?1:0));
  const mins=L=>L.reduce((a,l)=>a+lm(l),0);
  const roomOf=x=>x.exams.length?0:hardK(x)-x.prep.length;
  const fillDay=(i,plan,left,end,full,n0)=>{const room=roomOf(days[i]);
      const held=e=>plan[i].filter(p=>p.e===e).reduce((a,p)=>a+p.span,0);
      for(let n=n0;n<room;n++){
        const cand=ex.filter(e=>i<end(e)&&left.get(e).length),rate=e=>mins(left.get(e))/(end(e)-i);
        // the nearest exam goes first, then the next one, to the last
        const under=cand.filter(e=>held(e)<2),fresh=under.filter(e=>!held(e)),pool=full===2?cand:full&&fresh.length?fresh:under;
        if(!pool.length)break;
        const e=pool.sort((p,q)=>p.date-q.date||rate(q)-rate(p))[0],R=left.get(e);
        const out=[];let acc=0;
        while(R.length&&(!out.length||acc+lm(R[0])<=SESS_MIN)){const l=R.shift();out.push(l);acc+=lm(l)}
        const span=Math.max(1,Math.min(room-n,Math.ceil(acc/(SESS_MIN*1.1))));n+=span-1;
        plan[i].push({e,lecs:out,span,fast:fastOf(acc,span)})}};
  const fastOf=(acc,span)=>acc>SESS_MIN*span*1.25?'١.٥':acc>SESS_MIN*span?'١.٢٥':'';
  // `from` and `left` let a run start partway through, from what is still left on that day
  const run=(full,o={})=>{const i0=o.from||0,left=new Map(ex.map(e=>[e,(o.left?o.left.get(e):e.R).slice()])),plan=days.map(()=>[]),end=e=>full?e.dlF:e.dl;
    days.forEach((x,i)=>{if(i>=i0)fillDay(i,plan,left,end,full,0)});
    return {plan,left,over:[...left.values()].some(L=>L.length)}};
  // normal daily pace: at most two sessions a day per subject
  const normal=o=>{const f=run(0,o);return f.over?run(1,o):f};
  let fit=normal();
  // a subject that can't be finished at the normal pace is behind: it gets a fixed three lectures a day (more when they're short
  // enough to fit one session) inside the student's usual sessions, so study hours stay the same. As soon as what is left fits the
  // normal pace again, the rest of the days go back to the normal plan, and that day tells the student they're back on track.
  const late=ex.filter(e=>fit.left.get(e).length);let back=-1;
  if(late.length){const plan=days.map(()=>[]);let left=new Map(ex.map(e=>[e,e.R.slice()]));
    for(let i=0;i<days.length;i++){
      if(i){const f=normal({from:i,left});if(!f.over){for(let j=i;j<days.length;j++)plan[j]=f.plan[j];left=f.left;back=i;break}}
      const room=roomOf(days[i]);let n=0;
      // nearest exam first, so a behind subject with a later exam never takes the sessions of an earlier one
      for(const e of ex){if(n>=room)break;const R=left.get(e);if(i>=e.dlF||!R.length)continue;const c=late.includes(e);
        const out=[];let acc=0;while(R.length&&(!out.length||(c&&out.length<3)||acc+lm(R[0])<=SESS_MIN)){const l=R.shift();out.push(l);acc+=lm(l)}
        const span=Math.max(1,Math.min(room-n,Math.ceil(acc/(SESS_MIN*1.1))));n+=span;
        plan[i].push({e,lecs:out,span,catchup:c?1:0,fast:fastOf(acc,span)})}
      fillDay(i,plan,left,e=>late.includes(e)?0:e.dlF,1,n)}
    fit={plan,left};
    if(back>0)days[back].back=late.filter(e=>e.n>back)}
  for(const e of ex){e.late=late.includes(e);e.back=e.late&&back>0&&e.n>back?days[back].d:null}
  // no lecture is ever dropped before its exam: what still doesn't fit becomes extra sessions, spread over the study days
  // with the fewest extras, then the subject's lectures go back into book order over all its sessions
  const addN=days.map(()=>0);
  for(const e of ex){const L=fit.left.get(e);e.added=0;if(!L.length)continue;
    const ok=[];for(let i=0;i<Math.min(e.dlF,days.length);i++)if(!days[i].exams.length)ok.push(i);
    if(!ok.length)continue;
    while(L.length){const out=[];let acc=0;while(L.length&&(!out.length||acc+lm(L[0])<=SESS_MIN)){const l=L.shift();out.push(l);acc+=lm(l)}
      const i=ok.reduce((b,j)=>addN[j]<addN[b]?j:b,ok[0]);addN[i]++;e.added++;
      fit.plan[i].push({e,lecs:out,span:1,added:1,fast:fastOf(acc,1)})}
    const B=fit.plan.flatMap(pl=>pl.filter(p=>p.e===e&&p.lecs)),all=B.flatMap(p=>p.lecs).sort((a,b)=>a.qi-b.qi);let k=0;
    for(const p of B){p.lecs=all.slice(k,k+p.lecs.length);k+=p.lecs.length}}
  days.forEach((x,i)=>{x.prep=fit.plan[i].concat(x.prep)});
  for(const e of ex){e.over=fit.left.get(e);const on=days.filter(x=>x.prep.some(p=>p.e===e&&p.lecs));e.studyDays=on.length;e.perDay=on.length?Math.round((e.mins-mins(e.over))/on.length):e.mins}
  // the main plan carries on for subjects with no exam coming; three study sessions a day in total (two on an exam day),
  // so main-plan blocks that don't fit are marked optional instead of piling up
  const main=new Map(base.map(x=>[x.d.getTime(),x]));
  // a lecture an exam covers is studied before that exam, so it never comes back after it
  const scope=new Set(monthly.filter(e=>P.act.includes(e.s)).flatMap(e=>mLectures(e.s,e.li,e.to,e.r).map(l=>l.v)));
  // the other subjects keep the main plan's days, and each takes its next lectures in book order from its own line
  // (Arabic literature has a line of its own). A subject with an exam coming waits until that exam; what has no room waits for after the exams.
  const kind=(s,l)=>s+(s==='ar'&&PARTS.ar&&l.li===1?'L':''),live=l=>!done['v'+l.v]||doneAt['v'+l.v],qs=new Map();
  for(const y of base)if(!y.past&&y.d>=from)for(const b of y.blocks)for(const l of b.lecs||[])if(!scope.has(l.v)&&live(l)){const k=kind(b.s,l);if(!qs.has(k))qs.set(k,[]);qs.get(k).push(l)}
  for(const q of qs.values())q.sort((a,b)=>a.qi-b.qi);
  for(const x of days){const m=main.get(x.d.getTime()),busy=new Set(ex.filter(e=>e.date>=x.d).map(e=>e.s));x.other=[];if(!m||x.exams.length)continue;
    let room=dayK(x.d)-x.prep.reduce((a,p)=>a+(p.added?0:p.span||1),0);
    m.blocks.forEach((b,j)=>{if(b.plain){if(!b.hard)x.other.push({s:b.s,plain:b.plain,j});return}
      if(!b.lecs||!b.lecs.length||busy.has(b.s))return;const w=b.w||1;if(w>room+1e-9)return;
      const lecs=(qs.get(kind(b.s,b.lecs[0]))||[]).splice(0,b.lecs.length);if(!lecs.length)return;room-=w;x.other.push({s:b.s,lecs,w,j})})}
  return {ex,days,from};
}
// one plan: from today to the last monthly exam the main plan shows the exams schedule, and every lecture that schedule
// doesn't reach moves to after the last exam in book order. Nothing is dropped, and both pages show the same days.
function mMerge(base,M){if(!M.days.length)return base;
  const from=M.from,R=new Date(M.days[M.days.length-1].d);R.setDate(R.getDate()+1);
  const used=new Set(),live=l=>!done['v'+l.v]||doneAt['v'+l.v],tag=p=>p.added?'جلسة إضافية حتى تكمل الفصل':p.catchup?'تعويض تأخير · ٣ محاضرات':'تحضير امتحان '+C[p.e.s].name;
  const win=M.days.map(x=>{const blocks=[],src=[];
    x.exams.forEach(e=>{blocks.push({s:e.s,plain:'اليوم امتحان '+C[e.s].name+' الشهري. بالتوفيق، ولا تدرس شي جديد لهالمادة'});src.push(null)});
    x.prep.forEach(p=>{blocks.push(p.lecs?{s:p.e.s,lecs:p.lecs,w:p.span||1,mtag:tag(p),added:p.added}:{s:p.e.s,plain:p.plain,mtag:'امتحان شهري'});src.push(p)});
    x.other.forEach(b=>{const {j,...o}=b;blocks.push(o);src.push(b)});
    blocks.forEach((b,j)=>{(b.lecs||[]).forEach(l=>used.add(l.v+"#"+l.qi));if(b.plain){b.pid='p'+kk(x.d)+'-'+j;if(src[j])src[j].pid=b.pid}});
    return {d:new Date(x.d),blocks}});
  const missed=[];for(const y of base)if(!y.past&&y.d>=from&&y.d<R)for(const b of y.blocks)for(const l of b.lecs||[])if(!used.has(l.v+"#"+l.qi)&&live(l))missed.push({...l,s:b.s});
  const after=base.filter(y=>y.d>=R).map(y=>({...y,blocks:y.blocks.map(b=>b.lecs?{...b,lecs:b.lecs.filter(l=>!used.has(l.v+"#"+l.qi))}:b).filter(b=>!b.lecs||b.lecs.length)}));
  return base.filter(y=>y.d<from).concat(win,missed.length?placeMissed(after,missed,R):after)}
// heavier is fine when the student chose more hours
const mLoad=m=>{const f=MK()/3;return m<=120*f?['مريح','ok']:m<=180*f?['متوسط','mid']:['ثقيل','high']};
// exams that were behind: once one stops being behind, its card says the student is back to the normal daily pace (until that exam passes)
const LKEY='plan6sci-late';
function mCards(){
  const {ex}=mPlan();
  const was=new Set((Array.isArray(get(LKEY))?get(LKEY):[]).filter(id=>ex.some(e=>e.id===id)));
  ex.forEach(e=>{e.reached=!e.late&&was.has(e.id);if(e.late)was.add(e.id)});put(LKEY,[...was]);
  $('mExams').innerHTML=ex.length?ex.map(e=>{const n=Math.round((e.date-TODAY)/864e5),pc=e.total?Math.round(100*(e.total-e.left)/e.total):0,t=P.T[e.s],[lv,cls]=mLoad(e.dl?e.mins/e.dl:e.mins);
    return `<div class="m-card" style="--c:var(${COLOR[e.s]})"><div class="m-top"><b>${C[e.s].name}</b><span class="m-when">${n>0?'بعد '+daysWord(n):'اليوم'} · ${DN[e.date.getDay()]} ${dstr(e.date)}</span>
      <button class="linkbtn" type="button" data-del="${esc(e.id)}">احذف</button></div>
      <span class="alt">${mScope(e,t)}</span>
      <span class="sb-t"><i style="width:${pc}%"></i></span>
      <span>${e.left?`باقي ${ar(e.left)} محاضرة (${dur(e.mins)} فيديو)${e.studyDays?' على '+daysWord(e.studyDays)+'، تقريباً '+dur(e.perDay)+' باليوم':''}`:'خلصت كل محاضراته، ركّز على الأسئلة والمراجعة'}</span>
      ${e.late?`<span class="m-load high">متأخر بهالمادة: بأيام دراستها ياخذ ٣ محاضرات باليوم بنفس جلساتك (${SESS_W(MK())}). الامتحان الأقرب ياخذ دوره أول. شغّل محاضراتها بسرعة ١.٢٥ أو ١.٥ حتى تخلص أسرع وترجع للسير الطبيعي${e.back?'، ويوم '+DN[e.back.getDay()]+' '+dstr(e.back)+' ترجع للسير اليومي الطبيعي':''}</span>`:''}
      ${e.added?'<span class="m-load high">حتى تكمل الفصل كامل قبل الامتحان، ضفنا '+ar(e.added)+' جلسة إضافية فوق جلساتك، لأن ما نتخطى أي محاضرة'+(e.late?'':'. شغّلها بسرعة ١.٢٥ أو ١.٥ حتى تخلص أسرع')+'</span>':''}
      ${e.reached?'<span class="m-load ok">وصلت لحد السير اليومي الطبيعي لهالمادة، كمّل بجدولك العادي</span>':''}
      ${e.left&&!e.late&&!(e.over&&e.over.length)?`<span class="m-load ${cls}">الحمل: ${lv}${cls==='high'?'. شغّل محاضراته بسرعة ١.٢٥ أو ١.٥ بدل ما تسهر، وتأكد من الفصول اللي يشملها الامتحان':''}</span>`:''}
      ${e.over&&e.over.length?`<span class="m-load high">ما تلحق ${ar(e.over.length)} محاضرة (${dur(e.over.reduce((a,l)=>a+lm(l),0))}) قبل الامتحان، تبدي من «${esc(e.over[0].t)}». زيد ساعات الدراسة، أو احذف الفصول اللي ما يشملها الامتحان، أو ركّز على ملخصها وأسئلتها الوزارية</span><button type="button" class="linkbtn m-tojump" data-s="${e.s}">حدد لحد يا محاضرة يوصل الامتحان</button>`:''}
      ${e.mock||e.review?`<span class="alt">${e.mock?'امتحان تجريبي قبله بيومين، و':''}${e.review?'مراجعة خفيفة باليوم اللي قبله':''}</span>`:''}</div>`}).join(''):'<p class="note">ما حددت مواعيد بعد. اكتب موعد امتحان كل مادة فوق واحفظ، والجدول ينبني لحاله.</p>';
  $('mExams').querySelectorAll('.m-tojump').forEach(b=>b.onclick=()=>{const r=document.querySelector('.m-row[data-s="'+b.dataset.s+'"]');if(!r)return;const d=r.querySelector('details');d.open=true;r.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>r.querySelector('.m-to select')?.focus(),400)});
  $('mExams').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{monthly=monthly.filter(e=>e.id!==b.dataset.del);saveM();render();mForm();mRender();toast('انحذف الامتحان')});
}
function mRender(){
  mCards();
  sessBox($('mSess'),kBase(mFrom()),k=>{const f=mFrom();prefs.sess=prefs.sess.filter(x=>parseKey(x.from)<f);if(kBase(new Date(f.getTime()-864e5))!==k||!prefs.sess.length)prefs.sess.push({from:kk(f),k});savePrefs();render();mForm();mRender();toast('صار يومك '+SESS_L[k][1]+' ('+SESS_W(k)+') بالجدولين، وتقدّمك بقى مثل ما هو')});
  const {days}=P.mon;let S,PR,RV;
  const host=$('mPlan');host.innerHTML='';
  if(!days.length){$('mPlanH').hidden=true;$('mWhy').hidden=true;return}
  $('mPlanH').hidden=false;$('mWhy').hidden=false;
  for(const x of days){
    const TX=timeline(kOf(x.d),x.d);S=TX.filter(r=>typeof r[2]==='number');PR=TX.find(r=>r[2]==='practice');RV=TX.find(r=>r[2]==='review');
    const isT=x.d.getTime()===TODAY.getTime(),day=document.createElement('div');day.className='day'+(x.exams.length?' m-exam':'')+(isT?' today':'');
    day.innerHTML=`<div class="date"><span class="dn">${DN[x.d.getDay()]}</span><span class="dd">${ar(x.d.getDate())}</span><span class="dm">${MN[x.d.getMonth()]}</span>${isT?'<span class="tlabel">اليوم</span>':''}</div><div class="subjs"></div>`;
    const box=day.querySelector('.subjs');let k=0;
    x.exams.forEach(e=>{const el=document.createElement('div');el.className='subj m-banner';el.style.setProperty('--c','var('+COLOR[e.s]+')');
      el.innerHTML=`<div class="subj-h"><span class="s">اليوم امتحان ${C[e.s].name} الشهري</span><span class="w">بالتوفيق. اليوم بس لهالمادة: فطور زين، نظرة سريعة على ملخصك، ولا تدرس شي جديد. بعد الامتحان ارتاح.</span></div>`;box.appendChild(el)});
    if(x.back&&x.back.length){const el=document.createElement('div');el.className='subj extra';
      el.innerHTML=`<div class="subj-h"><span class="m-load ok">وصلت لحد السير اليومي الطبيعي لـ${x.back.map(e=>C[e.s].name).join(' و')}، من اليوم جلساتها ترجع عادية</span></div>`;box.appendChild(el)}
    const blocks=x.prep.map(p=>({...p,s:p.e.s,pri:1})).concat(x.other);
    for(const b of blocks){const el=document.createElement('div');el.className='subj'+(b.pri?' m-pri':'')+(b.opt?' m-opt':'');el.dataset.s=b.s;el.style.setProperty('--c','var('+COLOR[b.s]+')');
      const r=b.opt||b.added?null:S[Math.min(k,S.length-1)],r2=r&&S[Math.min(k+(b.span||1)-1,S.length-1)];if(r)k+=b.span||1;const tm=r?`<span class="tm">${range(r[0],r2[1])}</span>`:`<span class="tm">${b.added?'جلسة إضافية':b.opt?'اختياري':'إذا عندك وقت'}</span>`;
      const nm=b.s==='rev'?'مراجعة':C[b.s].name,tag=b.pri?'<span class="m-tag">'+(b.added?'جلسة إضافية حتى تكمل الفصل':b.catchup?'تعويض تأخير · ٣ محاضرات':'امتحان شهري')+'</span>':'',optW=b.opt?'<span class="w">إذا تعبان أجّلها، وترتبها بعدين من «تأخرت؟» بالجدول الرئيسي</span>':'';
      if(b.plain){const id=b.pid||(b.pri?'m'+kk(x.d)+'-'+b.s:'p'+kk(x.d)+'-'+b.j);
        el.innerHTML=`<div class="subj-h">${tm}${tag}${optW}</div><div class="lec"><input type="checkbox" id="${id}"><label for="${id}" class="plain"><span class="subj-h"><span class="s">${nm}</span></span> <span class="t">${esc(b.plain)}</span></label><span></span></div>`;check(el.querySelector('.lec'),id)}
      else{const t=P.T[b.s];el.innerHTML=`<div class="subj-h">${tm}${tag}<span class="s">${nm}</span><span class="w">${esc([...new Set(b.lecs.map(l=>t.lists[l.li].by))].join(' و'))}${b.fast?' · شغّلها بسرعة '+b.fast:b.catchup?' · شغّلها بسرعة ١.٢٥ أو ١.٥ حتى تخلص أسرع':''}</span>${optW}</div>`;
        b.lecs.forEach(l=>{const id='v'+l.v,rw=document.createElement('div');rw.className='lec';
          rw.innerHTML=`<input type="checkbox" id="${id}" aria-label="أنجزت ${esc(l.t)}"><label for="${id}">${lnk(l)}</label><span class="m">${dur(l.dm||l.m)}</span>`;check(rw,id);el.appendChild(rw)})}
      box.appendChild(el)}
    // daily self-test on today's exam lectures, plus a short recall of what was studied three days ago
    const studied=[...new Set(x.prep.filter(p=>p.lecs).map(p=>C[p.e.s].name))];
    if(blocks.length&&!x.exams.length){const el=document.createElement('div');el.className='subj extra';
      el.innerHTML=`<div class="subj-h"><span class="tm">${range(PR[0],PR[1])}</span><span class="w">${studied.length?'حل أسئلة وزارية لمحاضرات '+studied.join(' و')+' اللي درستها اليوم، و١٠ دقايق تسمّع لنفسك بدون ما تفتح الدفتر محاضرات قبل ٣ أيام':'حل تمارين الكتاب والأسئلة الوزارية لمحاضرات اليوم'}</span></div>`;box.appendChild(el)}
    if(blocks.length){const el=document.createElement('div');el.className='subj extra';el.innerHTML=`<div class="subj-h"><span class="tm">${range(RV[0],RV[1])}</span><span class="w">مراجعة ملخص اليوم وتشوف جدول باجر</span></div>`;box.appendChild(el)}
    host.appendChild(day)}
}
// one row per subject: the student types each exam date (empty = no exam) and the chapters it covers, then saves them all at once
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fromIso=v=>{const [y,m,d]=v.split('-').map(Number);return new Date(y,m-1,d)};
const mFrom=()=>new Date(Math.max(TODAY,START));
const mUpcoming=s=>monthly.find(e=>e.s===s&&parseKey(e.d)>=mFrom());
function mForm(){
  const minV=iso(mFrom());
  $('mRows').innerHTML=P.act.map(s=>{const e=mUpcoming(s);
    return `<div class="m-row" data-s="${s}" style="--c:var(${COLOR[s]})"><b>${C[s].name}</b><input type="date" min="${minV}" max="2027-12-31" value="${e?iso(parseKey(e.d)):''}" aria-label="موعد امتحان ${C[s].name} الشهري">
      <details><summary>الفصول والمحاضرات اللي يشملها</summary><div class="sch-box"></div></details></div>`}).join('');
  $('mRows').querySelectorAll('.m-row').forEach(r=>{const s=r.dataset.s,inp=r.querySelector('input[type=date]'),box=r.querySelector('.sch-box'),e=mUpcoming(s);
    // the last lecture is picked from the last chosen chapter; a range chapter (Arabic literature) gets its own from and to
    const k=MRANGE[s],opts=(li,sel)=>P.Q[s].filter(l=>l.li===li&&!String(l.v).includes('~')).map(l=>`<option value="${esc(l.v)}"${String(l.v)===String(sel)?' selected':''}>${esc(l.t)}</option>`).join('');
    const toBox=(li,to,r)=>{const main=li.filter(x=>x!==k),m=main.length?Math.max(...main):k==null?0:-1;
      let h=m<0?'':`<label class="m-to">الامتحان لحد محاضرة: <select class="m-toS" aria-label="آخر محاضرة يشملها امتحان ${C[s].name}"><option value="">نهاية الفصل</option>${opts(m,to)}</select></label>`;
      if(k!=null&&li.includes(k)){const nm=esc(P.T[s].lists[k].t);
        h+=`<label class="m-to">${nm} من محاضرة: <select class="m-rf" aria-label="أول محاضرة من ${nm} يشملها امتحان ${C[s].name}"><option value="">أول الفصل</option>${opts(k,r&&r.f)}</select></label>`+
          `<label class="m-to">${nm} لحد محاضرة: <select class="m-rt" aria-label="آخر محاضرة من ${nm} يشملها امتحان ${C[s].name}"><option value="">نهاية الفصل</option>${opts(k,r&&r.t)}</select></label>`}
      return h};
    const cur=()=>{const g=c=>{const x=box.querySelector(c);return x&&x.value||null};return {to:g('.m-toS'),r:{f:g('.m-rf'),t:g('.m-rt')}}};
    const fill=(li,to,r)=>{box.innerHTML=P.T[s].lists.map((l,i)=>`<label class="sch"><input type="checkbox" value="${i}"${li.includes(i)?' checked':''}> ${esc(l.t)}</label>`).join('')+'<div class="m-toBox">'+toBox(li,to,r)+'</div>'};
    const n0=e?mNorm(s,e.to,e.r):{};
    let edited=!!e;fill(e?e.li:inp.value?mDefaultLists(s,fromIso(inp.value)):[0],n0.to,n0.r);
    // ticking another chapter keeps the literature range already picked
    box.addEventListener('change',ev=>{edited=true;if(ev.target.type==='checkbox'){const c=cur();box.querySelector('.m-toBox').innerHTML=toBox([...box.querySelectorAll('input:checked')].map(i=>+i.value),null,c.r)}});
    inp.onchange=()=>{if(!edited&&inp.value)fill(mDefaultLists(s,fromIso(inp.value)))}});
}
$('mSave').onclick=()=>{const from=mFrom();let n=0,bad=0;
  $('mRows').querySelectorAll('.m-row').forEach(r=>{const s=r.dataset.s,v=r.querySelector('input[type=date]').value;
    monthly=monthly.filter(e=>!(e.s===s&&parseKey(e.d)>=from));if(!v)return;
    const ex=fromIso(v);if(ex<from||!parseKey(kk(ex))){bad++;return}
    const li=[...r.querySelectorAll('.sch-box input:checked')].map(i=>+i.value);
    const val=c=>{const x=r.querySelector(c);return x&&x.value||''},to=val('.m-toS'),rg={};if(val('.m-rf'))rg.f=val('.m-rf');if(val('.m-rt'))rg.t=val('.m-rt');
    monthly.push({id:s+'-'+kk(ex),s,d:kk(ex),li:li.length?li:[0],...(to?{to}:{}),...(rg.f||rg.t?{r:rg}:{})});n++});
  saveM();render();mForm();mRender();
  toast(bad?'في موعد قبل اليوم وما انحفظ، صححه':n?'انحفظت مواعيد '+ar(n)+' امتحانات وترتب الجدول عليها':'ما حددت أي موعد')};
// start over: removes every monthly exam date (asks first, since it can't be undone)
$('mReset').onclick=()=>{if(!monthly.length){toast('ما عندك مواعيد امتحانات محفوظة');return}
  if(!confirm('تمسح كل مواعيد الامتحانات الشهرية وترجع تدخلها من جديد؟'))return;
  monthly=[];saveM();render();mForm();mRender();toast('انمسحت كل المواعيد، دخّلها من جديد')};
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
/* ---------- saving progress: everything lives in this browser, so the student can keep a copy and rebuild quickly if it is lost ---------- */
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
const SITE=PREF.replace('-prefs',''),BK=['prefs','v3','hard','monthly','dream','days','badges','font','slots1'];
$('bkSave').onclick=()=>{const data={};for(const k of BK){try{const v=localStorage.getItem(SITE+'-'+k);if(v!==null)data[k]=v}catch(e){}}
  const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify({site:SITE,v:1,at:kk(new Date()),data})],{type:'application/json'}));a.href=u;a.download=SITE+'-'+kk(new Date())+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);toast('نزلت نسختك، احفظها بمكان أمين')};
$('bkLoad').onclick=()=>$('bkFile').click();
$('bkFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{let o=null;try{o=JSON.parse(r.result)}catch(x){}
  if(!o||o.site!==SITE||!o.data||typeof o.data!=='object'){toast('هذا الملف مو نسخة من هذا الموقع');return}
  for(const k of BK)if(typeof o.data[k]==='string'){try{localStorage.setItem(SITE+'-'+k,o.data[k])}catch(x){}}location.reload()};r.readAsText(f)};
// automatic second copy: nothing to press. If browser storage is lost but this copy survives, the page puts everything back by itself
const mirrorDb=()=>new Promise((ok,no)=>{const r=indexedDB.open(SITE+'-copy',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const snapshot=()=>{const o={};for(const k of BK){try{const v=localStorage.getItem(SITE+'-'+k);if(v!==null)o[k]=v}catch(e){}}return o};
let mirrorT=0;const mirror=()=>{clearTimeout(mirrorT);mirrorT=setTimeout(async()=>{try{const db=await mirrorDb();db.transaction('kv','readwrite').objectStore('kv').put(snapshot(),'all')}catch(e){}},400)};
(async()=>{let keep=null;try{const db=await mirrorDb();keep=await new Promise(ok=>{const q=db.transaction('kv').objectStore('kv').get('all');q.onsuccess=()=>ok(q.result||null);q.onerror=()=>ok(null)})}catch(e){}
  // the dream is set once on the first visit, so its absence next to a saved copy means the browser lost its storage
  let gone=false;try{gone=localStorage.getItem(SITE+'-dream')===null}catch(e){}
  if(keep&&keep.dream&&gone){for(const k in keep)if(BK.includes(k)){try{localStorage.setItem(SITE+'-'+k,keep[k])}catch(e){}}location.reload();return}
  const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){set.call(this,k,v);if(this===localStorage&&String(k).startsWith(SITE+'-'))mirror()};mirror()})();
const rsFill=()=>{const s=$('rsSubj').value;$('rsLec').innerHTML=(P.Q[s]||[]).map((l,i)=>'<option value="'+i+'">'+esc(l.t)+'</option>').join('')};
$('rescue').addEventListener('toggle',()=>{if($('rescue').open&&!$('rsSubj').options.length){$('rsSubj').innerHTML=P.act.map(s=>'<option value="'+s+'">'+C[s].name+'</option>').join('');rsFill()}});
$('rsSubj').onchange=rsFill;
$('rsDays').onclick=()=>{const n=Math.floor(+$('rsDaysN').value);if(!(n>=1&&n<=120)){toast('اكتب عدد الأيام من ١ إلى ١٢٠');return}
  const k=SITE+'-days',set=new Set(Array.isArray(get(k))?get(k):[]),d=new Date();for(let i=0;i<n;i++){set.add(d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate());d.setDate(d.getDate()-1)}put(k,[...set].slice(-120));location.reload()};
$('rsTick').onclick=()=>{const s=$('rsSubj').value,n=+$('rsLec').value;if(!P.Q[s])return;P.Q[s].slice(0,n+1).forEach(l=>{done['v'+l.v]=1});saveDone();rerender('أشّرنا محاضرات '+C[s].name+' لحد اللي اخترته')};
$('rsPast').onclick=()=>{let n=0;for(const x of P.days)if(x.d<TODAY)for(const b of x.blocks)for(const l of b.lecs||[])if(!done['v'+l.v]){done['v'+l.v]=1;n++}saveDone();rerender(n?'أشّرنا '+ar(n)+' محاضرة من الأيام اللي فاتت':'ماكو محاضرات غير مأشرة بالأيام اللي فاتت')};
// a new student starts from the day they sign up: the lectures of the days before move to that day onwards, in book order
const planStart=()=>typeof dates==='function'?dates().s:START;
window.PLANAPP_JOIN={started:()=>TODAY>planStart(),startToday(){if(TODAY>planStart()&&!prefs.shift){prefs.shift={from:kk(TODAY),at:kk(TODAY),mode:'fit'};savePrefs()}}};
window.PLANAPP={kOf,setHour(h){if(HOURS.includes(h)){prefs.hour=h;savePrefs();render()}},getHour:()=>prefs.hour,HOURS,hourLabel};
document.addEventListener('dreamsaved',()=>setTimeout(()=>notice(false),900));

// lectures left from the days before move to today by themselves, in book order, once a day
function autoLate(){const st=typeof dates==='function'?dates().s:START;if(TODAY<=st||prefs.undoAt===kk(TODAY)||!lateList().length)return;
  prefs.shift={from:kk(TODAY),at:kk(TODAY),mode:'fit'};savePrefs();render()}
render();autoLate();notice(false);if(location.hash==='#monthly')mShow(true);
})();
