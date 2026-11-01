// Dream layer: first-visit name + dream, a themed progress meter, streak, quote, "now" card and an interactive background per career family
(function(){
const IG='https://www.instagram.com/_gfya/', TG='';
const KEY='plan6sci-dream', DAYS='plan6sci-days';
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const ar=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const root=document.documentElement;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const svg=(p,vb='0 0 24 24')=>`<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;

// career families: each one is a visual world; departments are the real colleges a scientific-branch student can enter
const FAM={
  doctor:{label:'طب وصحة',icon:'<path d="M2 12h4l2-5 3 10 3-7 2 2h6"/>',depts:[
    ['طب بشري','كلية الطب','د.'],['طب بيطري','كلية الطب البيطري','د.'],['تمريض','كلية التمريض',''],
    ['التقنيات الطبية والصحية','الأشعة والتخدير والبصريات والعلاج الطبيعي',''],['الصحة العامة','كلية العلوم الصحية','']]},
  dentist:{label:'طب أسنان',icon:'<path d="M7 3c-3 0-4 3-3 6 1 2 1 5 2 9 1 3 3 3 3 0l1-4h4l1 4c0 3 2 3 3 0 1-4 1-7 2-9 1-3 0-6-3-6-2 0-3 1-5 1S9 3 7 3z"/>',depts:[
    ['طب الأسنان','كلية طب الأسنان','د.'],['صناعة الأسنان','تقنيات صناعة الأسنان','']]},
  pharma:{label:'صيدلة وتحليلات',icon:'<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M12 8v8"/>',depts:[
    ['صيدلة','كلية الصيدلة','د.'],['التحليلات المرضية','قسم التحليلات المرضية',''],['المختبرات الطبية','تقنيات المختبرات الطبية','']]},
  engineer:{label:'هندسة',icon:'<path d="M12 3l-8 18M12 3l8 18M7 14h10"/><circle cx="12" cy="3" r="1.5"/>',depts:[
    ['هندسة مدنية','كلية الهندسة','م.'],['هندسة معمارية','كلية الهندسة','م.'],['هندسة كهربائية','كلية الهندسة','م.'],['هندسة ميكانيكية','كلية الهندسة','م.'],
    ['هندسة نفط','كلية هندسة النفط','م.'],['هندسة كيمياوية','كلية الهندسة','م.'],['هندسة الاتصالات','كلية الهندسة','م.'],['هندسة طبية','الهندسة الطبية الحياتية','م.'],
    ['هندسة المواد','كلية هندسة المواد','م.'],['هندسة البيئة','كلية الهندسة','م.'],['هندسة المساحة','كلية الهندسة','م.'],['هندسة الطيران','كلية الهندسة','م.']]},
  coder:{label:'حاسوب وبرمجة',icon:'<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',depts:[
    ['هندسة الحاسوب','كلية الهندسة','م.'],['هندسة البرمجيات','كلية الهندسة','م.'],['علوم الحاسوب','كلية علوم الحاسوب',''],
    ['تكنولوجيا المعلومات','كلية تكنولوجيا المعلومات',''],['الذكاء الاصطناعي','قسم الذكاء الاصطناعي',''],['الأمن السيبراني','قسم الأمن السيبراني','']]},
  science:{label:'علوم وزراعة',icon:'<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',depts:[
    ['علوم الكيمياء','كلية العلوم',''],['علوم الفيزياء','كلية العلوم',''],['علوم الرياضيات','كلية العلوم',''],['علوم الحياة','كلية العلوم',''],
    ['علوم الأرض (جيولوجيا)','كلية العلوم',''],['الفلك والفضاء','كلية العلوم',''],['علوم البيئة','كلية العلوم',''],['الزراعة','كلية الزراعة',''],['علوم الأغذية','كلية الزراعة','']]},
  military:{label:'عسكرية وشرطة وطيران',icon:'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',depts:[
    ['الكلية العسكرية','الكلية العسكرية',''],['كلية الشرطة','كلية الشرطة',''],['طيار','كلية القوة الجوية',''],['الكلية البحرية','الكلية البحرية','']]},
  teacher:{label:'تربية وتدريس',icon:'<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20l4-4 4 4"/>',depts:[
    ['تربية - رياضيات','كلية التربية','أ.'],['تربية - فيزياء','كلية التربية','أ.'],['تربية - كيمياء','كلية التربية','أ.'],['تربية - علوم الحياة','كلية التربية','أ.'],
    ['تربية - حاسوب','كلية التربية','أ.'],['تربية - لغة إنكليزية','كلية التربية','أ.'],['التربية البدنية','كلية التربية البدنية وعلوم الرياضة','']]},
  politics:{label:'علوم سياسية',icon:'<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-6 10 6z"/>',depts:[
    ['العلوم السياسية','كلية العلوم السياسية',''],['العلاقات الدولية والدبلوماسية','كلية العلوم السياسية',''],['النظم السياسية والسياسات العامة','كلية العلوم السياسية',''],['الفكر السياسي','كلية العلوم السياسية','']]},
  other:{label:'إنسانية وحلم ثاني',icon:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.9 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',depts:[
    ['القانون','كلية القانون',''],['الإدارة والاقتصاد','كلية الإدارة والاقتصاد',''],['الإعلام','كلية الإعلام',''],['اللغات','كلية اللغات',''],
    ['الفنون الجميلة','كلية الفنون الجميلة',''],['حلم ثاني','','']]}
};

const QUOTES=['كل محاضرة تخلصها خطوة، والخطوات تصير طريق.','اليوم تعبك، وباجر فرحتك.','لا تقارن نفسك بغيرك، قارن نفسك بنفسك البارحة.','المعدل ما يجي بليلة، يجي بأيام مثل اليوم.','خلي الموبايل بعيد، وحلمك قريب.','إذا تعبت استريح، بس لا توكف.','صفحة وحدة زيادة اليوم تفرق بالوزاري.','السادس سنة وحدة، والحلم عمر كامل.','اللي يحل الأسئلة بإيده هو اللي يتذكرها بالامتحان.','ما أحد ولد يعرف، كلنا تعلمنا.','ركز على محاضرة اليوم، مو على كل المنهج.','التعب اللي تحسه هسه تعب مؤقت.','كل يوم ملتزم بيه هو يوم مكسب.','حلمك يستاهل ساعتين زيادة من وقتك.','ابدأ بالمادة الصعبة وذهنك صافي.','النوم الزين جزء من الدراسة.','الغلطة اللي تتعلم منها هسه ما تتكرر بالامتحان.','أهلك ينتظرون فرحتك، وانت كدها.','لا تأجل، المحاضرة اللي تتأجل تتكدس.','شوية كل يوم أحسن من هواية مرة وحدة.'];

let prof=get(KEY);
let pct=window.PLAN_PCT||0, shown=pct;
const dayKey=(d=new Date())=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();

/* ---------- panel ---------- */
const panel=document.createElement('section');panel.className='dream';panel.id='dream';
const header=document.querySelector('header');header.after(panel);
const foot=document.createElement('footer');foot.className='foot';document.querySelector('.wrap').appendChild(foot);
const igIcon=svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".8"/>');
const tgIcon=svg('<path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/><path d="M9 13l10-7"/>');
const shareIcon=svg('<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>');
const SITE='parmna432-eng.github.io/khotta';
const socials=()=>`<a class="chip" href="${IG}" target="_blank" rel="noopener">${igIcon}انستغرام</a>${TG?`<a class="chip" href="${TG}" target="_blank" rel="noopener">${tgIcon}قناة التليكرام</a>`:''}`;
foot.innerHTML=`<span>تابعنا للتحديثات والملازم:</span>${socials()}`;

function famOf(){return prof&&FAM[prof.fam]?prof.fam:'other'}
function goalText(){if(!prof)return'';const d=FAM[famOf()].depts.find(x=>x[0]===prof.dept);if(prof.dept==='حلم ثاني')return prof.custom||'حلمك';return d&&d[1]?prof.dept+' · '+d[1]:prof.dept}
function hello(){if(!prof)return'';const d=FAM[famOf()].depts.find(x=>x[0]===prof.dept);const t=d&&d[2]?d[2]+' ':'';return 'هلا '+t+esc(prof.name)}

function render(){
  if(!prof){panel.innerHTML=`<div class="dream-top"><div><p class="eyebrow">حلمك</p><h2>اكتب اسمك واختار حلمك</h2></div><div class="dream-actions"><button class="chip solid" type="button" id="dStart">ابدأ</button>${socials()}</div></div>`;
    panel.querySelector('#dStart').onclick=()=>openOnb();return}
  panel.innerHTML=`<div class="dream-top"><div><p class="eyebrow">${esc(goalText())}</p><h2>${hello()}، كل محاضرة تقربك من حلمك</h2></div>
    <div class="dream-actions"><button class="chip solid" type="button" id="dShare">${shareIcon}شارك تقدمك</button><button class="chip" type="button" id="dChange">غيّر الحلم</button>${socials()}</div></div>
    <div class="meter" id="meter"></div><p class="milestone" id="mile"></p>
    <div class="minis"><div class="mini" id="mNow"></div><div class="mini" id="mStreak"></div><div class="mini" id="mQuote"></div></div>
    <div class="badges" id="badges"></div>`;
  panel.querySelector('#dChange').onclick=()=>openOnb();
  panel.querySelector('#dShare').onclick=()=>openStory();
  meter(true);nowCard();streakCard();quoteCard();badgeShelf();
}

/* ---------- badges: earned from lectures done, full weeks, streak and finished subjects; drawn with the dream's own icon ---------- */
const SEEN='plan6sci-badges';
let showAll=false;
function badgeList(){
  const S=window.PLAN_STATS||{done:0,total:0,fullWeeks:0},n=streakN(),d=S.done,left=(k,u)=>'باقي '+ar(k)+' '+u,dl=k=>'باقي '+(k===1?'يوم':k===2?'يومين':ar(k)+(k<11?' أيام':' يوم'))+' التزام';
  const L=[
    {id:'first',t:'أول خطوة',s:'خلصت أول محاضرة',ok:d>=1,h:'أشّر أول محاضرة تخلصها'},
    {id:'s3',t:'٣ أيام ورا بعض',s:'التزمت ٣ أيام بدون انقطاع',ok:n>=3,h:dl(3-n)},
    {id:'week',t:'أسبوع كامل',s:'خلصت كل محاضرات أسبوع',ok:S.fullWeeks>=1,h:'خلّص كل محاضرات أسبوع واحد'},
    {id:'l50',t:'٥٠ محاضرة',s:'خلصت ٥٠ محاضرة',ok:d>=50,h:left(50-d,'محاضرة')},
    {id:'s7',t:'أسبوع التزام',s:'التزمت ٧ أيام ورا بعض',ok:n>=7,h:dl(7-n)},
    {id:'l100',t:'١٠٠ محاضرة',s:'خلصت ١٠٠ محاضرة',ok:d>=100,h:left(100-d,'محاضرة')},
    {id:'half',t:'نص الطريق',s:'خلصت نص المنهج',ok:pct>=50,h:left(50-pct,'٪')},
    {id:'w4',t:'شهر كامل',s:'٤ أسابيع كاملة بدون نقص',ok:S.fullWeeks>=4,h:4-S.fullWeeks===1?'باقي أسبوع كامل واحد':'باقي '+ar(4-S.fullWeeks)+' أسابيع كاملة'},
    {id:'s30',t:'٣٠ يوم التزام',s:'التزمت ٣٠ يوم ورا بعض',ok:n>=30,h:dl(30-n)},
    {id:'l250',t:'٢٥٠ محاضرة',s:'خلصت ٢٥٠ محاضرة',ok:d>=250,h:left(250-d,'محاضرة')},
    ...(window.PLAN_SUBJ||[]).map(x=>({id:'sub-'+x.s,t:'خلصت '+x.name,s:'خلصت كل محاضرات '+x.name,ok:x.pct>=100,h:ar(x.pct)+'٪ من '+x.name})),
    {id:'all',t:'خلصت المنهج',s:'خلصت الخطة كلها',ok:pct>=100,h:left(100-pct,'٪')}
  ];
  return L;
}
const medal=(cls='')=>`<span class="medal ${cls}">${svg(FAM[famOf()].icon)}</span>`;
function badgeShelf(){
  const el=document.getElementById('badges');if(!el)return;
  const L=badgeList(),got=L.filter(b=>b.ok),next=L.filter(b=>!b.ok),shown=showAll?L:got.concat(next.slice(0,3));
  el.innerHTML=`<div class="bdg-h"><b>أوسمتك</b><span>${ar(got.length)} من ${ar(L.length)}</span>${L.length>shown.length||showAll?`<button class="linkbtn" type="button" id="bdgAll" aria-expanded="${showAll}">${showAll?'خلي اللي جاي بس':'شوف كل الأوسمة'}</button>`:''}</div>
    <div class="bdg-row">${shown.map(b=>`<div class="bdg${b.ok?' on':''}" title="${esc(b.ok?b.s:b.h)}">${medal()}<b>${esc(b.t)}</b><small>${esc(b.ok?b.s:b.h)}</small></div>`).join('')}</div>`;
  const a=document.getElementById('bdgAll');if(a)a.onclick=()=>{showAll=!showAll;badgeShelf()};
}
function checkBadges(){
  if(!prof)return;
  const got=badgeList().filter(b=>b.ok),seen=get(SEEN);
  if(!Array.isArray(seen)){put(SEEN,got.map(b=>b.id));return} // first visit with this feature: count what's there without a popup
  const fresh=got.filter(b=>!seen.includes(b.id));if(!fresh.length)return;
  put(SEEN,[...new Set(seen.concat(fresh.map(b=>b.id)))]);
  const b=fresh[fresh.length-1];document.querySelector('.bdg-pop')?.remove();
  const box=document.createElement('div');box.className='story-pop bdg-pop';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','وسام جديد');
  box.innerHTML=`<div class="story-card bdg-card">${medal('big')}<p class="eyebrow">وسام جديد</p><h2>${esc(b.t)}</h2><p class="story-s">${esc(b.s)}${fresh.length>1?' (و'+ar(fresh.length-1)+' غيره)':''}. ${esc(hello())}، كمل.</p>
    <div class="story-acts"><button class="chip solid" type="button" data-a="share">${shareIcon}شاركه ستوري</button><button class="chip" type="button" data-a="x">تمام</button></div></div>`;
  document.body.appendChild(box);
  box.addEventListener('click',e=>{if(e.target===box||e.target.closest('[data-a="x"]'))box.remove();else if(e.target.closest('[data-a="share"]')){box.remove();openStory()}});
  box.querySelector('[data-a="share"]').focus();
}

/* ---------- meters ---------- */
const MILES=[[100,'خلصت الخطة كلها. هذا تعبك وهذا حلمك.'],[75,'قربت هواية، بس ثلاث أرباع الطريق خلصت.'],[50,'نص الطريق خلص. هسه لا توكف.'],[25,'ربع الطريق خلص. كمل بنفس الهمة.'],[1,'بديت، وهذا أهم شي.'],[0,'أول محاضرة هي أصعب وحدة. يلا نبدي.']];
function meterHTML(p){
  const f=famOf();
  if(f==='doctor')return `<div class="mon"><div class="mon-h"><span>DREAM · HR</span><span>نبض حلمك</span></div><svg class="ecg" viewBox="0 0 420 56" preserveAspectRatio="none"><path d="M0 30H50l6-4 6 4h10l6-22 7 42 6-26h18l10-6 10 6h40l6-4 6 4h10l6-22 7 42 6-26h18l10-6 10 6h40l6-4 6 4h10l6-22 7 42 6-26h18l10-6 10 6H420"/></svg><div class="mon-v"><b id="num">${ar(p)}</b><small>%</small></div><div class="mon-bar"><i style="width:${p}%"></i></div></div>`;
  if(f==='dentist'){const on=Math.round(p/100*16);let t='';for(let i=0;i<16;i++)t+=`<svg viewBox="0 0 24 28" class="${i<on?'on':''}"><path d="M7 2c-3 0-5 3-4 7 1 3 1 6 2 11 1 4 4 4 4 0l1-4h4l1 4c0 4 3 4 4 0 1-5 1-8 2-11 1-4-1-7-4-7-2 0-3 1-5 1S9 2 7 2z"/></svg>`;
    return `<div class="row"><div class="big"><span id="num">${ar(p)}</span>٪</div><div style="flex:1;min-width:0"><div class="teeth">${t}</div><p class="s" style="margin:6px 0 0;color:var(--muted);font-size:13px">كل سن يتلوّن يعني خلصت جزء من المنهج</p></div></div>`}
  if(f==='pharma'){const h=Math.round(p/100*86);
    return `<div class="row"><svg class="bottle" viewBox="0 0 80 130"><rect x="26" y="2" width="28" height="14" rx="3" fill="var(--accent)"/><path d="M22 16h36v10c8 4 12 10 12 18v74a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10V44c0-8 4-14 12-18z" fill="var(--paper)" stroke="var(--accent)" stroke-width="2"/><clipPath id="bc"><path d="M22 16h36v10c8 4 12 10 12 18v74a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10V44c0-8 4-14 12-18z"/></clipPath><rect class="liq" clip-path="url(#bc)" x="0" y="${128-h}" width="80" height="${h}" fill="var(--accent)" opacity=".85"/><rect x="18" y="60" width="44" height="30" rx="3" fill="var(--card)" stroke="var(--line)"/><text x="40" y="80" text-anchor="middle" font-size="13" fill="var(--ink)" font-weight="600">Rx</text></svg><div><div class="big"><span id="num">${ar(p)}</span>٪</div><p style="margin:0;color:var(--muted)">من الجرعة الكاملة للمنهج</p></div></div>`}
  if(f==='engineer'){let n='';for(let i=0;i<=100;i+=10)n+=`<span class="n" style="right:${i}%">${ar(i)}</span>`;
    return `<div class="ruler">${n}<span class="mk" style="right:${p}%"><span id="num">${ar(p)}</span></span></div><p style="margin:6px 0 0;color:var(--muted);font-size:13px">نسبة إنجاز مشروعك (المنهج)</p>`}
  if(f==='coder'){const k=Math.round(p/5);
    return `<pre class="term"><span class="dim">$</span> build dream --target="${esc(prof.dept==='حلم ثاني'?(prof.custom||'dream'):prof.dept)}"\n[${'#'.repeat(k)}${'.'.repeat(20-k)}] <span id="num">${p}</span>%\n${p>=100?'<span>build succeeded</span>':'<span class="dim">compiling lectures...</span>'}</pre>`}
  if(f==='science'){const h=Math.round(p/100*70);
    return `<div class="row"><svg class="flask" viewBox="0 0 84 120"><clipPath id="fc"><path d="M32 6h20v34l26 66a8 8 0 0 1-7 11H13a8 8 0 0 1-7-11l26-66z"/></clipPath><rect class="liq" clip-path="url(#fc)" x="0" y="${117-h}" width="84" height="${h}" fill="var(--accent)" opacity=".8"/><path d="M32 6h20v34l26 66a8 8 0 0 1-7 11H13a8 8 0 0 1-7-11l26-66z" fill="none" stroke="var(--ink)" stroke-width="2"/><path d="M28 6h28" stroke="var(--ink)" stroke-width="3"/></svg><div><div class="big"><span id="num">${ar(p)}</span>٪</div><p style="margin:0;color:var(--muted)">من تجربتك الكبيرة: المنهج</p></div></div>`}
  if(f==='military'){const C=2*Math.PI*46,off=C*(1-p/100);
    return `<div class="row"><div class="radar"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="#1d2316" stroke="var(--line)"/><circle cx="60" cy="60" r="36" fill="none" stroke="#3c4a2c"/><circle cx="60" cy="60" r="18" fill="none" stroke="#3c4a2c"/><path d="M60 4v112M4 60h112" stroke="#3c4a2c"/><circle cx="60" cy="60" r="46" fill="none" stroke="var(--accent)" stroke-width="5" stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset .8s ease"/><g class="sweep"><path d="M60 60L60 6A54 54 0 0 1 98 22z" fill="var(--accent)" opacity=".18"/></g><text x="60" y="66" text-anchor="middle" font-size="20" font-weight="700" fill="var(--ink)">${p}%</text></svg></div><div><div class="big"><span id="num">${ar(p)}</span>٪</div><p style="margin:0;color:var(--muted)">من مهمتك: الهدف بالرادار</p></div></div>`}
  if(f==='politics'){ // parliament hemicycle: seats fill from left to right as lectures get done
    const seats=[];[44,58,72,86,100].forEach(r=>{const n=Math.round(Math.PI*r/13);for(let i=0;i<n;i++){const a=Math.PI-(i+.5)*Math.PI/n;seats.push({a,x:110+r*Math.cos(a),y:110-r*Math.sin(a)})}});
    seats.sort((p,q)=>q.a-p.a);const on=Math.round(p/100*seats.length);
    return `<div class="row"><svg class="hemi" viewBox="0 0 220 118" aria-hidden="true">${seats.map((s,i)=>`<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="4.6" fill="${i<on?'var(--accent)':'var(--line)'}"/>`).join('')}<text x="110" y="104" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink)">${ar(on)}/${ar(seats.length)}</text></svg><div><div class="big"><span id="num">${ar(p)}</span>٪</div><p style="margin:0;color:var(--muted)">من مقاعد برلمانك: كل محاضرة تخلصها تكسب مقعد</p></div></div>`}
  if(f==='teacher')return `<div class="board"><span style="font-size:13px;opacity:.8">درس اليوم: حلمك</span><span class="chalk"><span id="num">${ar(p)}</span>٪ من المنهج</span><div class="line"><i style="width:${p}%"></i></div></div>`;
  return `<div class="row"><div class="big"><span id="num">${ar(p)}</span>٪</div><div style="flex:1;min-width:160px"><div class="plainbar"><i style="width:${p}%"></i></div></div></div>`;
}
function meter(fresh){
  const el=document.getElementById('meter');if(!el)return;
  el.innerHTML=meterHTML(pct);
  document.getElementById('mile').textContent=MILES.find(m=>pct>=m[0])[1];
  const num=document.getElementById('num');if(!num)return;
  const from=fresh?0:shown,to=pct,fam=famOf();shown=pct;
  if(reduce||from===to){num.textContent=fam==='coder'?to:ar(to);return}
  const t0=performance.now();const step=t=>{const k=Math.min(1,(t-t0)/700),v=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));num.textContent=fam==='coder'?v:ar(v);if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step);
}

/* ---------- small cards ---------- */
function nowCard(){
  const el=document.getElementById('mNow');if(!el)return;
  const n=new Date(),t=n.getHours()*60+n.getMinutes(),P=window.PLAN;if(!P)return;
  const w=P.timeline.find(x=>[t,t+1440,t-1440].some(v=>v>=x[0]&&v<x[1]))||[0,0,'وقت حر'];
  let v=w[2]==='practice'?'حل تمارين وأسئلة وزارية لمحاضرات اليوم':w[2]==='review'?'مراجعة ملخص اليوم':w[2],s='';
  const entry=P&&P.plan.find(p=>P.kk(p.d)===dayKey(n));
  if(typeof v==='number'){
    if(!entry){v=n<P.plan[0].d?'الخطة تبدي الأحد ١/١١':'خلصت الخطة';}
    else{const b=entry.blocks[v];if(!b){v='وقت مراجعة';}else{const nm=b.s==='rev'?'مراجعة الأسبوع':P.S[b.s].name;s=b.lecs&&b.lecs.length?'تبدي بـ: '+b.lecs[0].t:(b.plain||'');v='الجلسة '+ar(w[2]+1)+': '+nm}}
  }
  el.innerHTML=`<span class="k">هسه وقت</span><span class="v">${esc(v)}</span>${s?`<span class="s">${esc(s)}</span>`:''}`;
}
function streakN(){
  const days=new Set(get(DAYS)||[]);let n=0;const d=new Date();
  if(!days.has(dayKey(d)))d.setDate(d.getDate()-1);
  while(days.has(dayKey(d))){n++;d.setDate(d.getDate()-1)}
  return n;
}
function streakCard(){
  const el=document.getElementById('mStreak');if(!el)return;
  const n=streakN();
  el.innerHTML=`<span class="k">أيام الالتزام ورا بعض</span><span class="v">${n?ar(n)+(n===1?' يوم':n<11?' أيام':' يوم'):'ابدأ اليوم'}</span><span class="s">${n?'أشّر محاضرة اليوم حتى ما ينقطع العداد':'أشّر أول محاضرة تخلصها'}</span>`;
}
function quoteCard(){
  const el=document.getElementById('mQuote');if(!el)return;
  const s=new Date(),i=Math.floor((s-new Date(s.getFullYear(),0,0))/864e5)%QUOTES.length;
  el.innerHTML=`<span class="k">جملة اليوم</span><span class="v">${QUOTES[i]}</span>`;
}
/* ---------- story image: a 1080x1920 card of the student's progress in their dream colours, to post on Instagram ---------- */
async function drawStory(){
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const cs=getComputedStyle(root),v=(n,f)=>cs.getPropertyValue(n).trim()||f;
  const paper=v('--paper','#111821'),card=v('--card','#17212d'),ink=v('--ink','#e6edf5'),mut=v('--muted','#9aabbe'),acc=v('--accent','#6aa5ec'),line=v('--line','#2a3848');
  const K='"Noto Kufi Arabic", "Segoe UI", Tahoma, sans-serif',B='"IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif';
  try{await Promise.all(['800 60px "Noto Kufi Arabic"','600 40px "IBM Plex Sans Arabic"','500 40px "IBM Plex Sans Arabic"'].map(f=>document.fonts.load(f)))}catch(e){}
  x.fillStyle=paper;x.fillRect(0,0,W,H);
  x.strokeStyle=line;x.globalAlpha=.35;x.lineWidth=2;for(let i=48;i<W;i+=48){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke()}for(let j=48;j<H;j+=48){x.beginPath();x.moveTo(0,j);x.lineTo(W,j);x.stroke()}x.globalAlpha=1;
  x.direction='rtl';x.textBaseline='middle';
  const txt=(s,X,Y,font,col,al='center',max=940)=>{x.font=font;x.fillStyle=col;x.textAlign=al;let f=font;
    while(x.measureText(s).width>max){const m=f.match(/(\d+)px/);if(!m||+m[1]<24)break;f=f.replace(/\d+px/,(+m[1]-4)+'px');x.font=f}x.fillText(s,X,Y)};
  const d=FAM[famOf()].depts.find(z=>z[0]===prof.dept),title=d&&d[2]?d[2]+' ':'';
  txt('خطة السادس العلمي',540,230,'600 42px '+B,mut);
  txt(goalText(),540,320,'600 46px '+B,acc);
  txt(title+prof.name,540,430,'800 112px '+K,ink);
  // progress ring
  const cx=540,cy=740,r=215;x.lineCap='round';
  x.lineWidth=46;x.strokeStyle=line;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.stroke();
  if(pct>0){x.strokeStyle=acc;x.beginPath();x.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*pct/100);x.stroke()}
  txt(ar(pct)+'٪',cx,cy-14,'800 170px '+K,ink);
  txt('من المنهج خلصته',cx,cy+105,'500 42px '+B,mut);
  // streak and exam countdown
  const bits=[],n=streakN();if(n)bits.push(ar(n)+(n===1?' يوم':n<11?' أيام':' يوم')+' ملتزم ورا بعض');if(window.PLAN_EXAM)bits.push('باقي '+ar(window.PLAN_EXAM)+' يوم للامتحان');
  if(bits.length)txt(bits.join('  ·  '),540,1030,'600 40px '+B,acc);
  // latest badges as pills
  const won=badgeList().filter(b=>b.ok).slice(-3).reverse();
  if(won.length){x.font='600 34px '+B;const ws=won.map(b=>x.measureText(b.t).width+92),tw=ws.reduce((a,b)=>a+b,0)+(won.length-1)*18;let px=540+tw/2;
    won.forEach((b,i)=>{const w=ws[i],X=px-w;x.fillStyle=card;x.strokeStyle=acc;x.lineWidth=3;x.beginPath();x.roundRect(X,1082,w,64,32);x.fill();x.stroke();
      x.fillStyle=acc;x.beginPath();x.arc(px-34,1114,15,0,Math.PI*2);x.fill();txt(b.t,px-60,1114,'600 34px '+B,ink,'right',w);px-=w+18})}
  // one bar per subject
  const subj=window.PLAN_SUBJ||[],y0=1200,rowH=Math.min(54,370/Math.max(1,subj.length));
  subj.forEach((s,i)=>{const y=y0+i*rowH,col=v(s.color,acc);
    txt(s.name,960,y,'600 40px '+B,col,'right',220);
    x.fillStyle=line;x.beginPath();x.roundRect(250,y-11,480,22,11);x.fill();
    if(s.pct>0){const w=Math.max(22,480*s.pct/100);x.fillStyle=col;x.beginPath();x.roundRect(730-w,y-11,w,22,11);x.fill()}
    txt(ar(s.pct)+'٪',120,y,'600 38px '+B,mut,'left',120)});
  // call to action
  x.fillStyle=card;x.strokeStyle=acc;x.lineWidth=4;x.beginPath();x.roundRect(110,1600,860,190,28);x.fill();x.stroke();
  txt('سوّي خطتك ببلاش',540,1650,'800 56px '+K,ink);
  x.direction='ltr';txt(SITE,540,1720,'600 38px '+B,acc);txt('@_gfya',540,1765,'500 32px '+B,mut);
  return new Promise(res=>c.toBlob(b=>res(b),'image/png'));
}
async function openStory(){
  const box=document.createElement('div');box.className='story-pop';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','صورة تقدمك');
  box.innerHTML=`<div class="story-card"><p class="story-h">صورتك جاهزة للستوري</p><div class="story-img"><span>لحظة...</span></div>
    <div class="story-acts"><button class="chip solid" type="button" data-a="share" hidden>${shareIcon}شاركها</button><a class="chip solid" data-a="save" download="khotta-progress.png">نزّل الصورة</a><button class="chip" type="button" data-a="x">سد</button></div>
    <p class="story-s">نزّلها وحطها ستوري وأشّر <bdi dir="ltr">@_gfya</bdi> حتى أصدقائك يسوون خطتهم.</p></div>`;
  document.body.appendChild(box);
  const close=()=>{box.remove();if(url)URL.revokeObjectURL(url)};let url='';
  box.addEventListener('click',e=>{if(e.target===box||e.target.closest('[data-a="x"]'))close()});
  document.addEventListener('keydown',function k(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',k)}});
  box.querySelector('[data-a="x"]').focus();
  const blob=await drawStory();if(!blob||!box.isConnected)return;
  url=URL.createObjectURL(blob);
  box.querySelector('.story-img').innerHTML=`<img src="${url}" alt="صورة تقدمك: ${esc(prof.name)}، ${pct}٪">`;
  box.querySelector('[data-a="save"]').href=url;
  const file=new File([blob],'khotta-progress.png',{type:'image/png'});
  const sh=box.querySelector('[data-a="share"]');
  if(navigator.canShare&&navigator.canShare({files:[file]})){sh.hidden=false;sh.onclick=()=>navigator.share({files:[file]}).catch(()=>{})}
}
document.addEventListener('planprogress',e=>{pct=e.detail.pct;meter(false);badgeShelf();checkBadges()});
document.addEventListener('plancheck',e=>{if(e.detail.checked){const a=new Set(get(DAYS)||[]);a.add(dayKey());put(DAYS,[...a].slice(-120));streakCard();badgeShelf();checkBadges()}});
setInterval(nowCard,60000);
document.addEventListener('planbuilt',nowCard);

/* ---------- first visit ---------- */
let onb=null;
function openOnb(){
  if(onb)return;
  let fam=prof?prof.fam:'',dept=prof?prof.dept:'';
  onb=document.createElement('div');onb.className='onb';
  onb.innerHTML=`<form class="onb-card" role="dialog" aria-modal="true" aria-labelledby="onbT" novalidate>
    <p class="eyebrow">خطة السادس العلمي</p><h2 id="onbT">قبل لا نبدي، عرّفنا بنفسك</h2>
    <label for="onbName">اسمك</label><input id="onbName" maxlength="24" autocomplete="given-name" value="${prof?esc(prof.name):''}">
    <p class="lbl">شنو حلمك؟</p>
    <div class="dream-grid">${Object.entries(FAM).map(([k,f])=>`<button type="button" data-f="${k}" aria-pressed="${k===fam}">${svg(f.icon)}<span>${f.label}</span></button>`).join('')}</div>
    <p class="lbl" id="deptL" hidden>اختار القسم</p><div class="dept" id="dept"></div>
    <div id="otherW" hidden><label for="onbOther">اكتب حلمك</label><input id="onbOther" maxlength="30" value="${prof&&prof.custom?esc(prof.custom):''}"></div>
    <p class="lbl">بأي ساعة تبدي دراستك بالعادة؟</p>
    <div class="hours-pick" id="onbHours">${(window.PLANAPP?PLANAPP.HOURS:[7,8,9,10]).map(h=>`<button type="button" data-h="${h}" aria-pressed="${prof&&window.PLANAPP&&PLANAPP.getHour()===h}">${ar(h)} الصبح</button>`).join('')}</div>
    <p class="onb-err" id="onbErr" hidden></p>
    <button type="submit" class="go">يلا نبدي</button>
    ${prof?'<button type="button" class="chip" id="onbX" style="align-self:center">إلغاء</button>':''}</form>`;
  document.body.appendChild(onb);
  const $=s=>onb.querySelector(s);
  const drawDept=()=>{const box=$('#dept');$('#deptL').hidden=!fam;box.innerHTML=fam?FAM[fam].depts.map(d=>`<button type="button" aria-pressed="${d[0]===dept}">${d[0]}</button>`).join(''):'';
    box.querySelectorAll('button').forEach(b=>b.onclick=()=>{dept=b.textContent;box.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));$('#otherW').hidden=dept!=='حلم ثاني'});
    $('#otherW').hidden=dept!=='حلم ثاني'};
  onb.querySelectorAll('.dream-grid button').forEach(b=>b.onclick=()=>{fam=b.dataset.f;dept='';onb.querySelectorAll('.dream-grid button').forEach(x=>x.setAttribute('aria-pressed',x===b));drawDept();previewFam(fam)});
  drawDept();
  let hour=prof&&window.PLANAPP?PLANAPP.getHour():0;
  onb.querySelectorAll('#onbHours button').forEach(b=>b.onclick=()=>{hour=+b.dataset.h;onb.querySelectorAll('#onbHours button').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  if($('#onbX'))$('#onbX').onclick=()=>{closeOnb();applyTheme(famOf())};
  $('form').onsubmit=e=>{e.preventDefault();
    const name=$('#onbName').value.trim(),other=$('#onbOther').value.trim(),err=$('#onbErr');
    const msg=!name?'اكتب اسمك حتى نبدي':!fam?'اختار مجال حلمك':!dept?'اختار القسم اللي تحلم بيه':(dept==='حلم ثاني'&&!other)?'اكتب حلمك':!hour?'اختار الساعة اللي تبدي بيها دراستك':'';
    if(msg){err.textContent=msg;err.hidden=false;return}
    prof={name,fam,dept,custom:dept==='حلم ثاني'?other:''};put(KEY,prof);
    const r=$('.go').getBoundingClientRect();transition(()=>{closeOnb();setFam(fam);if(window.PLANAPP)PLANAPP.setHour(hour);render();document.dispatchEvent(new CustomEvent('dreamsaved'))},r.left+r.width/2,r.top+r.height/2)};
  setTimeout(()=>$('#onbName').focus(),50);
}
function closeOnb(){if(onb){onb.remove();onb=null}}
function previewFam(f){setFam(f)}

/* ---------- theme switching ---------- */
function setFam(f){if(f==='other')delete root.dataset.dream;else root.dataset.dream=f;fx.start(f)}
function transition(run,x,y){
  root.style.setProperty('--vx',x+'px');root.style.setProperty('--vy',y+'px');
  if(document.startViewTransition&&!reduce)document.startViewTransition(run);else run();
}
function applyTheme(f){setFam(f)}

/* ---------- interactive backgrounds ---------- */
const fx=(()=>{
  const cv=document.createElement('canvas');cv.id='bgfx';cv.setAttribute('aria-hidden','true');document.body.prepend(cv);
  const ctx=cv.getContext('2d');let W=0,H=0,dpr=1,mode='',raf=0,st={};
  const ptr={x:-1,y:-1,vx:0,on:false,last:0};
  const size=()=>{dpr=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);st={}};
  addEventListener('resize',size);size();
  addEventListener('pointermove',e=>{const dx=ptr.x<0?0:Math.hypot(e.clientX-ptr.x,e.clientY-ptr.y);ptr.vx=dx;ptr.x=e.clientX;ptr.y=e.clientY;ptr.on=true;ptr.last=performance.now()},{passive:true});
  addEventListener('pointerdown',e=>{ptr.x=e.clientX;ptr.y=e.clientY;ptr.on=true;ptr.last=performance.now();ptr.tap=true},{passive:true});
  const col=n=>getComputedStyle(root).getPropertyValue(n).trim()||'#888';
  const rnd=(a,b)=>a+Math.random()*(b-a);

  function wave(p){if(p<.1)return .12*Math.sin(p/.1*Math.PI);if(p<.16)return 0;if(p<.18)return -.15*((p-.16)/.02);if(p<.21)return -.15+1.15*((p-.18)/.03);if(p<.24)return 1-1.35*((p-.21)/.03);if(p<.27)return -.35+.35*((p-.24)/.03);if(p<.4)return 0;if(p<.55)return .25*Math.sin((p-.4)/.15*Math.PI);return 0}
  const E={
    doctor(){ // monitor trace across the bottom; moving the pointer raises the heart rate
      if(!st.buf){st.buf=new Float32Array(Math.ceil(W));st.x=0;st.ph=0;st.bpm=64;st.c=col('--accent')}
      if(ptr.vx>0){st.bpm=Math.min(150,st.bpm+ptr.vx/25);ptr.vx=0}st.bpm+= (64-st.bpm)*.004;
      const n=st.buf.length;for(let k=0;k<3;k++){st.ph+=st.bpm/60/60/3;if(st.ph>1)st.ph-=1;st.buf[st.x]=wave(st.ph);st.x=(st.x+1)%n}
      ctx.clearRect(0,0,W,H);const y0=H*.84,A=Math.min(70,H*.08);
      ctx.strokeStyle=st.c;ctx.globalAlpha=.28;ctx.lineWidth=2;ctx.beginPath();let pen=false;
      for(let i=0;i<n;i++){if((i-st.x+n)%n<40){pen=false;continue}const y=y0-st.buf[i]*A;if(!pen){ctx.moveTo(i,y);pen=true}else ctx.lineTo(i,y)}
      ctx.stroke();ctx.globalAlpha=.6;ctx.fillStyle=st.c;ctx.beginPath();ctx.arc(st.x,y0-st.buf[(st.x-1+n)%n]*A,3.5,0,7);ctx.fill();
      ctx.globalAlpha=.35;ctx.font='600 12px "IBM Plex Mono",monospace';ctx.fillText(Math.round(st.bpm)+' BPM',16,y0-A-14);ctx.globalAlpha=1},
    engineer(){ // drafting crosshair with live dimensions follows the pointer, drifts on its own when idle
      if(!st.c){st.c=col('--accent');st.x=W/2;st.y=H/2;st.t=0}
      st.t+=.004;const idle=performance.now()-ptr.last>4000||!ptr.on;
      const tx=idle?W/2+Math.sin(st.t*1.3)*W*.3:ptr.x,ty=idle?H/2+Math.sin(st.t*1.9)*H*.25:ptr.y;
      st.x+=(tx-st.x)*.12;st.y+=(ty-st.y)*.12;ctx.clearRect(0,0,W,H);
      const g=ctx.createRadialGradient(st.x,st.y,0,st.x,st.y,160);g.addColorStop(0,'rgba(255,255,255,.10)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      ctx.strokeStyle=st.c;ctx.globalAlpha=.35;ctx.lineWidth=1;ctx.setLineDash([6,6]);
      ctx.beginPath();ctx.moveTo(0,st.y);ctx.lineTo(W,st.y);ctx.moveTo(st.x,0);ctx.lineTo(st.x,H);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(st.x,st.y,14,0,7);ctx.stroke();
      ctx.font='500 11px "IBM Plex Mono",monospace';ctx.fillStyle=st.c;ctx.fillText('X '+Math.round(st.x/4)+' mm',st.x+18,st.y-8);ctx.fillText('Y '+Math.round(st.y/4)+' mm',st.x+18,st.y+16);ctx.globalAlpha=1},
    type(cfg){ // lines that write themselves and fade: code for coders, chalk for teachers
      if(!st.lines){st.lines=[];st.c=col('--accent');st.f=0}
      st.f++;if(ptr.tap){ptr.tap=false;st.lines.push({x:ptr.x,y:ptr.y,t:cfg.words[Math.floor(rnd(0,cfg.words.length))],n:0,a:1})}
      if(st.lines.length<cfg.max&&st.f%90===0)st.lines.push({x:rnd(20,W-260),y:rnd(60,H-40),t:cfg.words[Math.floor(rnd(0,cfg.words.length))],n:0,a:1});
      ctx.clearRect(0,0,W,H);ctx.font=cfg.font;ctx.fillStyle=st.c;ctx.textAlign='left';
      st.lines=st.lines.filter(l=>{if(st.f%cfg.speed===0)l.n++;if(l.n>l.t.length+40)l.a-=.01;ctx.globalAlpha=Math.max(0,l.a)*cfg.alpha;ctx.fillText(l.t.slice(0,l.n)+(l.n<=l.t.length&&cfg.cursor?'▍':''),l.x,l.y);return l.a>0});ctx.globalAlpha=1},
    coder(){E.type({max:7,speed:4,alpha:.22,cursor:true,font:'500 14px "IBM Plex Mono",monospace',words:['while (!dream) study();','if (lecture.done) progress++;','for (const day of plan) focus(day);','git commit -m "محاضرة جديدة"','sleep(8 * HOURS); // مهم','const goal = "'+(prof&&prof.dept||'dream')+'";','return success;','try { solve(exam) } catch { retry() }']})},
    teacher(){E.type({max:6,speed:6,alpha:.2,cursor:false,font:'600 20px "Noto Kufi Arabic",sans-serif',words:['a² + b² = c²','E = mc²','H₂O','ابدأ ولا توكف','∫ x dx = x²/2','6CO₂ + 6H₂O','درس اليوم: الالتزام','ق = ك × ت','sin²θ + cos²θ = 1']})},
    pharma(){ // capsules drifting up; the pointer pushes them away
      if(!st.p){st.c=col('--accent');st.s=col('--accent-soft');st.p=Array.from({length:16},()=>({x:rnd(0,W),y:rnd(0,H),v:rnd(.15,.45),r:rnd(0,6.3),vr:rnd(-.004,.004),s:rnd(.7,1.4)}))}
      ctx.clearRect(0,0,W,H);
      for(const c of st.p){c.y-=c.v;c.r+=c.vr;if(c.y<-40){c.y=H+40;c.x=rnd(0,W)}
        if(ptr.on){const dx=c.x-ptr.x,dy=c.y-ptr.y,d=Math.hypot(dx,dy);if(d<130&&d>0){c.x+=dx/d*2.2;c.y+=dy/d*2.2}}
        ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.r);ctx.scale(c.s,c.s);ctx.globalAlpha=.32;
        ctx.fillStyle=st.c;ctx.beginPath();ctx.roundRect(-22,-9,22,18,[9,0,0,9]);ctx.fill();ctx.fillStyle=st.s;ctx.strokeStyle=st.c;ctx.beginPath();ctx.roundRect(0,-9,22,18,[0,9,9,0]);ctx.fill();ctx.stroke();ctx.restore()}
      ctx.globalAlpha=1},
    dentist(){ // fresh bubbles rising; the pointer leaves a trail of small ones
      if(!st.b){st.c=col('--accent');st.b=Array.from({length:26},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(4,16),v:rnd(.2,.6),w:rnd(0,6)}))}
      if(ptr.vx>2&&st.b.length<70){st.b.push({x:ptr.x,y:ptr.y,r:rnd(2,6),v:rnd(.5,1),w:0,life:1});ptr.vx=0}
      ctx.clearRect(0,0,W,H);ctx.strokeStyle=st.c;ctx.lineWidth=1.4;
      st.b=st.b.filter(b=>{b.y-=b.v;b.w+=.02;const x=b.x+Math.sin(b.w)*6;if(b.life!==undefined)b.life-=.006;
        ctx.globalAlpha=.3*(b.life===undefined?1:Math.max(0,b.life));ctx.beginPath();ctx.arc(x,b.y,b.r,0,7);ctx.stroke();
        ctx.globalAlpha*=.6;ctx.beginPath();ctx.arc(x-b.r*.35,b.y-b.r*.35,b.r*.22,0,7);ctx.stroke();
        if(b.y<-20){if(b.life!==undefined)return false;b.y=H+20;b.x=rnd(0,W)}return b.life===undefined||b.life>0});ctx.globalAlpha=1},
    science(){ // atoms orbiting; they lean toward the pointer
      if(!st.a){st.c=col('--accent');st.k=col('--ink');st.a=Array.from({length:6},()=>({x:rnd(60,W-60),y:rnd(60,H-60),R:rnd(26,46),t:rnd(0,6),v:rnd(.01,.025),dx:rnd(-.15,.15),dy:rnd(-.15,.15)}))}
      ctx.clearRect(0,0,W,H);
      for(const a of st.a){a.t+=a.v;a.x+=a.dx;a.y+=a.dy;if(a.x<40||a.x>W-40)a.dx*=-1;if(a.y<40||a.y>H-40)a.dy*=-1;
        if(ptr.on){a.x+=(ptr.x-a.x)*.002;a.y+=(ptr.y-a.y)*.002}
        ctx.globalAlpha=.25;ctx.strokeStyle=st.k;ctx.lineWidth=1;
        for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(a.x,a.y,a.R,a.R*.38,i*Math.PI/3,0,7);ctx.stroke()}
        ctx.globalAlpha=.55;ctx.fillStyle=st.c;ctx.beginPath();ctx.arc(a.x,a.y,4,0,7);ctx.fill();
        for(let i=0;i<3;i++){const ang=a.t*(1+i*.3)+i*2,rot=i*Math.PI/3,ex=Math.cos(ang)*a.R,ey=Math.sin(ang)*a.R*.38;
          ctx.beginPath();ctx.arc(a.x+ex*Math.cos(rot)-ey*Math.sin(rot),a.y+ex*Math.sin(rot)+ey*Math.cos(rot),2.6,0,7);ctx.fill()}}
      ctx.globalAlpha=1},
    politics(){ // the Iraqi flag drawn in LED dots waving at the top, rockets launching from the bottom; a tap launches one from that spot
      const kufi=!!(document.fonts&&document.fonts.check('800 15px "Noto Kufi Arabic"'));
      if(!st.led||(kufi&&!st.kufi)){st.kufi=kufi;
        const cols=96,rows=64,oc=document.createElement('canvas');oc.width=cols;oc.height=rows;const o=oc.getContext('2d');
        o.fillStyle='#000';o.fillRect(0,0,cols,rows);o.fillStyle='#fff';o.textAlign='center';o.textBaseline='middle';
        o.font='800 15px "Noto Kufi Arabic",sans-serif';o.direction='rtl';o.fillText('الله أكبر',cols/2,rows/2+1);
        const px=o.getImageData(0,0,cols,rows).data;st.led=[];
        for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const band=y<rows/3?0:y<2*rows/3?1:2,txt=band===1&&px[(y*cols+x)*4]>110;
          st.led.push({x,y,c:txt?'#1fae5a':band===0?'#e0263a':band===1?'#f2f4f7':'#3a3f47'})}
        st.cols=cols;st.rows=rows;if(st.t===undefined){st.t=0;st.rk=[];st.sp=[];st.next=60}}
      st.t+=.03;ctx.clearRect(0,0,W,H);
      // flag
      const fw=Math.min(W*.5,520),s=fw/st.cols,x0=W<700?(W-fw)/2:24,y0=W<700?70:86,amp=s*1.6;
      for(const p of st.led){const w=Math.sin(st.t+p.x*.12),y=y0+p.y*s+w*amp;ctx.globalAlpha=.09+.09*(w+1)/2;ctx.fillStyle=p.c;ctx.fillRect(x0+p.x*s,y,s*.72,s*.72)}
      // rockets
      if(--st.next<=0){st.next=70+Math.random()*110;st.rk.push({x:rnd(W*.1,W*.9),y:H+10,vx:rnd(-.6,.6),vy:rnd(-3.4,-2.4)})}
      if(ptr.tap){ptr.tap=false;st.rk.push({x:ptr.x,y:ptr.y,vx:rnd(-.5,.5),vy:-3.6})}
      st.rk=st.rk.filter(r=>{r.x+=r.vx;r.y+=r.vy;r.vy-=.012;
        for(let k=0;k<2;k++)st.sp.push({x:r.x+rnd(-2,2),y:r.y+10,a:.55,s:rnd(2,4)});
        const ang=Math.atan2(r.vy,r.vx)+Math.PI/2;ctx.save();ctx.translate(r.x,r.y);ctx.rotate(ang);ctx.scale(1.8,1.8);ctx.globalAlpha=.8;
        ctx.fillStyle='#d9dee5';ctx.fillRect(-3,-8,6,16);ctx.fillStyle='#e0263a';ctx.beginPath();ctx.moveTo(-3,-8);ctx.lineTo(0,-15);ctx.lineTo(3,-8);ctx.fill();
        ctx.fillStyle='#1fae5a';ctx.fillRect(-6,4,3,5);ctx.fillRect(3,4,3,5);ctx.fillStyle='#ffb347';ctx.fillRect(-2,8,4,4+Math.random()*4);ctx.restore();
        return r.y>-40});
      st.sp=st.sp.filter(p=>{p.a-=.012;p.y+=.25;ctx.globalAlpha=Math.max(0,p.a)*.6;ctx.fillStyle='#ffb347';ctx.fillRect(Math.round(p.x/3)*3,Math.round(p.y/3)*3,p.s,p.s);return p.a>0});
      ctx.globalAlpha=1},
    military(){ // radar in the corner; tapping drops a contact on it
      if(!st.c){st.c=col('--accent');st.t=0;st.blips=[]}
      st.t+=.012;const R=Math.min(W,H)*.42,cx=W-R*.35,cy=H-R*.35;ctx.clearRect(0,0,W,H);
      ctx.strokeStyle=st.c;ctx.lineWidth=1;ctx.globalAlpha=.16;for(let i=1;i<=4;i++){ctx.beginPath();ctx.arc(cx,cy,R*i/4,0,7);ctx.stroke()}
      ctx.beginPath();ctx.moveTo(cx-R,cy);ctx.lineTo(cx+R,cy);ctx.moveTo(cx,cy-R);ctx.lineTo(cx,cy+R);ctx.stroke();
      const g=ctx.createConicGradient?ctx.createConicGradient(st.t,cx,cy):null;
      if(g){g.addColorStop(0,'rgba(214,180,92,.28)');g.addColorStop(.12,'rgba(214,180,92,0)');g.addColorStop(1,'rgba(214,180,92,0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill()}
      if(ptr.tap){ptr.tap=false;st.blips.push({x:ptr.x,y:ptr.y,a:1})}
      if(st.blips.length<4&&Math.random()<.004){const an=rnd(0,6.3),d=rnd(.2,.95)*R;st.blips.push({x:cx+Math.cos(an)*d,y:cy+Math.sin(an)*d,a:1})}
      ctx.fillStyle=st.c;st.blips=st.blips.filter(b=>{b.a-=.004;ctx.globalAlpha=Math.max(0,b.a)*.7;ctx.beginPath();ctx.arc(b.x,b.y,3.5,0,7);ctx.fill();ctx.globalAlpha*=.4;ctx.beginPath();ctx.arc(b.x,b.y,9*(2-b.a),0,7);ctx.stroke();return b.a>0});ctx.globalAlpha=1},
  };
  function loop(){raf=0;if(!E[mode]||document.hidden)return;E[mode]();if(!reduce)raf=requestAnimationFrame(loop)}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!raf)loop()});
  return{start(m){mode=m;st={};ctx.clearRect(0,0,W,H);if(raf)cancelAnimationFrame(raf);raf=0;
    requestAnimationFrame(()=>{st={};if(reduce){if(E[m])for(let i=0;i<120;i++)E[m]()}else loop()})}};
})();

/* ---------- boot ---------- */
setFam(famOf());render();checkBadges();
if(!prof)openOnb();
})();
