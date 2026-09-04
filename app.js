const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const fmt=n=>'$'+Math.round(Number(n)||0).toLocaleString('zh-TW');
let cur={y:2026,m:9};
const defaults=[['先生生活費',12000,'必要'],['孝親費',12000,'必要'],['保險',16500,'必要'],['信貸(1)',7000,'債務'],['信貸(2)',6000,'債務'],['信貸(3)',7500,'債務'],['分期／卡費',9390,'債務'],['補習與英文',17100,'小孩'],['ETC 與加油',9000,'交通'],['電話',4000,'必要'],['長照',1500,'必要'],['捐款與 ETF',1600,'可調整']];
const CATS=['必要','可調整','債務','小孩','交通','其他'];
const CAT_ICON={必要:'M12 3l7 4v5c0 4.8-3 8-7 9-9-2-7-9-7-9V7l7-4z',可調整:'M4 7h16M7 7v13h10V7M9 4h6l1 3H8l1-3z',債務:'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 4h6M8 12h8M8 16h5',小孩:'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-6 8a6 6 0 0 1 12 0',交通:'M5 17h14l-1-7a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2l-1 7zm2 0v2m10-2v2M7 13h10',其他:'M12 5v14M5 12h14'};
const catIcon=c=>`<svg class="catIcon" viewBox="0 0 24 24"><path d="${CAT_ICON[c]||CAT_ICON.其他}"/></svg>`;
const key=(y=cur.y,m=cur.m)=>`liyunjia-${y}-${String(m).padStart(2,'0')}`;
const fresh=()=>({income:{husband:67000,wife:33000,other:8000},expenses:defaults.map(([name,amount,category])=>({name,amount,category})),ledger:[],finished:false,bufferTarget:null,step:1});
function loadMonth(y=cur.y,m=cur.m){let x=null;try{x=JSON.parse(localStorage.getItem(key(y,m))||'null')}catch(e){}
  if(!x)x=fresh();
  if(!x.income)x.income=fresh().income;
  ['husband','wife','other'].forEach(k=>{if(x.income[k]===undefined||x.income[k]===null)x.income[k]=fresh().income[k]});
  if(Number(x.income.husband)+Number(x.income.wife)+Number(x.income.other)===0)x.income=fresh().income;
  if(!Array.isArray(x.expenses)||!x.expenses.length)x.expenses=fresh().expenses;
  if(x.expenses.every(e=>(+e.amount||0)===0))x.expenses=fresh().expenses;
  x.expenses=x.expenses.map((e,i)=>({...e,amount:+e.amount||0,category:e.category||defaults[i]?.[2]||'其他'}));
  if(!Array.isArray(x.ledger))x.ledger=[]; if(x.bufferTarget===undefined)x.bufferTarget=null; if(!x.step)x.step=1; return x}
let data=loadMonth();
const inc=()=>+data.income.husband + +data.income.wife + +data.income.other;
const fixed=()=>data.expenses.reduce((s,x)=>s+(+x.amount||0),0);
const spent=()=>data.ledger.reduce((s,x)=>s+(+x.amount||0),0);
const remain=()=>inc()-fixed();
const suggestedBuffer=()=>Math.max(0,Math.round(remain()*0.2));
const buffer=()=>Math.max(0,data.bufferTarget===null?suggestedBuffer():(+data.bufferTarget||0));
const dailyBudget=()=>Math.max(0,remain()-buffer());
const avail=()=>dailyBudget()-spent();
function save(){localStorage.setItem(key(),JSON.stringify(data));render()}
function setStep(n){data.step=n;localStorage.setItem(key(),JSON.stringify(data));$$('.stepPanel').forEach(p=>p.classList.toggle('active',+p.dataset.panel===n));$$('#steps button').forEach(b=>b.classList.toggle('now',+b.dataset.step===n))}
function expenses(){let g=$('#expenses');g.innerHTML='';data.expenses.forEach((x,i)=>{let d=document.createElement('div');d.className='expense';let opts=CATS.map(c=>`<option ${x.category===c?'selected':''}>${c}</option>`).join('');d.innerHTML=`<div class="expenseMain"><span class="expenseName cat-${x.category}">${catIcon(x.category)}<b>${x.name}</b></span><select class="catSelect">${opts}</select></div><input type="number" inputmode="numeric" value="${x.amount}"><button class="deleteExpense">×</button>`;d.querySelector('input').onchange=e=>{data.expenses[i].amount=+e.target.value||0;save()};d.querySelector('select').onchange=e=>{data.expenses[i].category=e.target.value;save()};d.querySelector('button').onclick=()=>{if(confirm(`刪除「${x.name}」？`)){data.expenses.splice(i,1);save()}};g.appendChild(d)});renderCategorySummary()}
function renderCategorySummary(){let g=$('#categorySummary');let totals=Object.fromEntries(CATS.map(c=>[c,0]));data.expenses.forEach(e=>totals[e.category||'其他']+=+e.amount||0);g.innerHTML=CATS.map(c=>`<div class="catSummary cat-${c}">${catIcon(c)}<div><small>${c}</small><b>${fmt(totals[c])}</b></div></div>`).join('')}
function dailyDetails(){let el=$('#dailyDetails'),items=[...data.ledger].reverse();if(!items.length){el.innerHTML='<div class="dailyEmpty">本月還沒有開銷，按「記一筆今日開銷」就會立即扣除。</div>';return}el.innerHTML=items.map(x=>`<div class="dailyRow"><div class="dailyDate">${x.date||'今天'}</div><div class="dailyInfo"><b>${x.note||x.category}</b><small>${x.category}・${x.method||'現金'}</small></div><div class="dailyAmount">-${fmt(x.amount)}</div></div>`).join('')}
function ledger(){let l=$('#ledger');l.innerHTML=data.ledger.length?'':'<p class="hint">本月還沒有記帳。</p>';[...data.ledger].reverse().forEach((x,ri)=>{let i=data.ledger.length-1-ri,d=document.createElement('div');d.className='ledger';d.innerHTML=`<div><b>${x.note||x.category}</b><small>${x.category}・${x.method||'現金'}・${x.date}</small></div><div><b>${fmt(x.amount)}</b> <button>刪除</button></div>`;d.querySelector('button').onclick=()=>{data.ledger.splice(i,1);save()};l.appendChild(d)})}

// ----- 信用卡：跨月份儲存，結帳週期可跨月 -----
const CARD_KEY='liyunjia-creditcards-v1';
const CARDS={ctbc:{name:'中國信託',closeDay:25},fubon:{name:'台北富邦',closeDay:24}};
let cardTxs=loadCards(),cardFilter='all';
function loadCards(){try{let x=JSON.parse(localStorage.getItem(CARD_KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return []}}
function saveCards(){localStorage.setItem(CARD_KEY,JSON.stringify(cardTxs));renderCards()}
const pad=n=>String(n).padStart(2,'0');
const iso=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
function prevMonth(y,m){return m===1?[y-1,12]:[y,m-1]}
function nextMonth(y,m){return m===12?[y+1,1]:[y,m+1]}
function daysInMonth(y,m){return new Date(y,m,0).getDate()}
function statementCycle(y,m,closeDay){let [py,pm]=prevMonth(y,m);let startDay=Math.min(closeDay+1,daysInMonth(py,pm));let endDay=Math.min(closeDay,daysInMonth(y,m));return {start:iso(py,pm,startDay),end:iso(y,m,endDay)}}
function inRange(date,start,end){return date>=start&&date<=end}
function txSum(items){return items.reduce((s,x)=>s+(+x.amount||0),0)}
function selectedMonthTxs(){let prefix=`${cur.y}-${pad(cur.m)}-`;return cardTxs.filter(x=>(x.date||'').startsWith(prefix))}
function statementTxs(cardId){let c=CARDS[cardId],cyc=statementCycle(cur.y,cur.m,c.closeDay);return cardTxs.filter(x=>x.card===cardId&&inRange(x.date,cyc.start,cyc.end))}
function shortDate(s){let [y,m,d]=s.split('-').map(Number);return `${m}/${d}`}
function statementStatus(end){let today=new Date();let t=iso(today.getFullYear(),today.getMonth()+1,today.getDate());if(t>end)return ['已結帳','closed'];let start=end.slice(0,8)+'01';if(t<start&&cur.y*12+cur.m>today.getFullYear()*12+today.getMonth()+1)return ['尚未開始','future'];return ['累計中','']}
function renderCards(){
  let monthItems=selectedMonthTxs(),mt=txSum(monthItems);$('#ccMonthTotal').textContent=fmt(mt);$('#ccListTotal').textContent=fmt(mt);$('#ccListTitle').textContent=`${cur.y}/${cur.m} 刷卡紀錄`;
  for(const id of ['ctbc','fubon']){let card=CARDS[id],cyc=statementCycle(cur.y,cur.m,card.closeDay),sum=txSum(statementTxs(id)),[txt,cls]=statementStatus(cyc.end);$(`#${id}Bill`).textContent=fmt(sum);$(`#${id}Estimate`).textContent=fmt(sum);$(`#${id}Cycle`).textContent=`${shortDate(cyc.start)}～${shortDate(cyc.end)}`;let st=$(`#${id}Status`);st.textContent=txt;st.className='ccStatus'+(cls?' '+cls:'')}
  let filtered=monthItems.filter(x=>cardFilter==='all'||x.card===cardFilter).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(+b.created||0)-(+a.created||0));let el=$('#ccLedger');if(!filtered.length){el.innerHTML='<div class="ccEmpty">這個月還沒有信用卡消費。</div>';return}el.innerHTML=filtered.map(x=>`<div class="ccTx"><div class="ccTxDate">${shortDate(x.date)}</div><div class="ccTxInfo"><b>${escapeHtml(x.note||x.category||'刷卡')}</b><small>${CARDS[x.card]?.name||'信用卡'}・${escapeHtml(x.category||'其他')}${x.synced?'・已同步每日開銷':''}</small></div><div class="ccTxAmount">${fmt(x.amount)}</div><button class="ccTxDelete" data-id="${x.id}">×</button></div>`).join('');$$('.ccTxDelete').forEach(b=>b.onclick=()=>deleteCardTx(b.dataset.id))
}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function addDailyFromCard(tx){let [y,m,d]=tx.date.split('-').map(Number),md=loadMonth(y,m);let display=`${m}/${d}`;md.ledger.push({amount:+tx.amount,category:tx.category,method:CARDS[tx.card].name,note:tx.note||'信用卡消費',date:display,source:'credit-card',sourceId:tx.id});localStorage.setItem(key(y,m),JSON.stringify(md));if(y===cur.y&&m===cur.m)data=md}
function removeDailyFromCard(tx){let [y,m]=tx.date.split('-').map(Number),md=loadMonth(y,m);let before=md.ledger.length;md.ledger=md.ledger.filter(x=>x.sourceId!==tx.id);if(md.ledger.length!==before)localStorage.setItem(key(y,m),JSON.stringify(md));if(y===cur.y&&m===cur.m)data=md}
function deleteCardTx(id){let tx=cardTxs.find(x=>x.id===id);if(!tx)return;if(!confirm(`刪除這筆 ${CARDS[tx.card]?.name||''} ${fmt(tx.amount)} 消費？`))return;if(tx.synced)removeDailyFromCard(tx);cardTxs=cardTxs.filter(x=>x.id!==id);localStorage.setItem(CARD_KEY,JSON.stringify(cardTxs));render()}

function render(){let r=remain(),rate=inc()>0?fixed()/inc()*100:0,a=avail(),db=dailyBudget(),b=buffer(),pct=db>0?Math.min(100,Math.max(0,spent()/db*100)):0;
 $('#month').textContent=`${cur.y}/${cur.m}`;$('#husband').value=data.income.husband;$('#wife').value=data.income.wife;$('#other').value=data.income.other;
 $('#heroAvail').textContent=fmt(Math.max(0,a));$('#heroSub').textContent=`收入 ${fmt(inc())}・固定支出 ${fmt(fixed())}・已花 ${fmt(spent())}`;$('#meterFill').style.width=pct+'%';
 $('#dailyRemain').textContent=fmt(Math.max(0,a));$('#dailyBudget').textContent=fmt(db);$('#dailySpent').textContent=fmt(spent());$('#dailyAvailable').textContent=fmt(Math.max(0,a));$('#dailyMeterFill').style.width=pct+'%';dailyDetails();ledger();
 $('#sIncome').textContent=fmt(inc());$('#sRemain').textContent=fmt(Math.max(0,r));$('#sFixed').textContent=fmt(fixed());$('#sDone').textContent=data.finished?'✓ 已完成':'待確認';
 $('#incomeTotal').textContent=fmt(inc());$('#remainSummary').textContent=fmt(Math.max(0,r));$('#fixedTotal').textContent=fmt(fixed());$('#doneSummary').textContent=data.finished?'✓ 已完成':'待確認';$('#fixedRate').textContent=Math.round(rate)+'%';$('#fixedHint').textContent=rate<=80?'仍有保留彈性':'固定支出占比較高';$('#postFixed').textContent=fmt(Math.max(0,r));$('#bufferSuggest').textContent=fmt(suggestedBuffer());$('#spendSuggest').textContent=fmt(Math.max(0,r-suggestedBuffer()));
 $('#adviceMsg').innerHTML=r<0?`目前固定支出比收入多 <b>${fmt(Math.abs(r))}</b>，建議先檢查可調整項目。`:`固定支出後剩下 <b>${fmt(r)}</b>，系統先保留 <b>${fmt(suggestedBuffer())}</b> 作為緩衝。`;
 $('#miniIncome').textContent=fmt(inc());$('#miniFixed').textContent=fmt(fixed());$('#miniRemain').textContent=fmt(Math.max(0,r));$('#fIncome').textContent=fmt(inc());$('#fFixed').textContent=fmt(fixed());$('#fSpend').textContent=fmt(db);$('#fBuffer').textContent=fmt(b);$('#bufferTarget').value=b;
 $('#dIncome').textContent=fmt(inc());$('#dFixed').textContent=fmt(fixed());$('#dSpent').textContent=fmt(spent());$('#dAvail').textContent=fmt(Math.max(0,a));$('#diagIncome').textContent=fmt(inc());$('#diagFixed').textContent=fmt(fixed());$('#diagSpent').textContent=fmt(spent());$('#diagAvail').textContent=fmt(Math.max(0,a));$('#diagMsg').innerHTML=a>=0?`扣除固定支出、緩衝金與每日開銷後，目前還有 <b>${fmt(a)}</b> 可以使用。`:`每日開銷已超過設定的日常額度 <b>${fmt(Math.abs(a))}</b>。`;
 expenses();setStep(data.step||1);renderCards()}
['husband','wife','other'].forEach(id=>$('#'+id).onchange=()=>{data.income.husband=+$('#husband').value||0;data.income.wife=+$('#wife').value||0;data.income.other=+$('#other').value||0;data.finished=false;save()});
$$('#steps button').forEach(b=>b.onclick=()=>setStep(+b.dataset.step));$$('.nextStep').forEach(b=>b.onclick=()=>setStep(+b.dataset.next));
$('#bufferTarget').onchange=()=>{data.bufferTarget=Math.max(0,+$('#bufferTarget').value||0);data.finished=false;save()};
function openQuick(){ $('#quickForm').classList.remove('hidden');$('#openQuick').classList.add('hidden');$('#qAmount').focus();window.scrollTo({top:$('#quickForm').getBoundingClientRect().top+scrollY-80,behavior:'smooth'}) }
function closeQuick(){ $('#quickForm').classList.add('hidden');$('#openQuick').classList.remove('hidden') }
$('#openQuick').onclick=openQuick;$('#navQuick').onclick=()=>{if(!$('#budget').classList.contains('active'))showView('budget');openQuick()};$('#cancelQuick').onclick=closeQuick;
$('#saveQ').onclick=()=>{let amount=+$('#qAmount').value||0;if(amount<=0){alert('請輸入開銷金額');$('#qAmount').focus();return}data.ledger.push({amount,category:$('#qCategory').value,method:'現金',note:$('#qNote').value.trim(),date:new Date().toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'})});$('#qAmount').value='';$('#qNote').value='';data.finished=false;save();closeQuick()};
$('#finish').onclick=()=>{data.finished=true;data.step=4;save();alert('本月預算已完成 ✓')};$('#addExpense').onclick=()=>$('#dlg').showModal();$('#eSave').onclick=e=>{let name=$('#eName').value.trim(),amount=+$('#eAmount').value||0;if(!name||amount<=0){e.preventDefault();return alert('請輸入名稱與金額')}data.expenses.push({name,amount,category:$('#eCategory').value});data.finished=false;$('#eName').value='';$('#eAmount').value='';save()};
// 信用卡表單
function defaultCardDate(){let now=new Date(),ym=now.getFullYear()===cur.y&&now.getMonth()+1===cur.m?[cur.y,cur.m,now.getDate()]:[cur.y,cur.m,1];return iso(...ym)}
function openCardForm(){ $('#cardForm').classList.remove('hidden');$('#toggleCardForm').classList.add('hidden');$('#ccDate').value=defaultCardDate() }
function closeCardForm(){ $('#cardForm').classList.add('hidden');$('#toggleCardForm').classList.remove('hidden') }
$('#toggleCardForm').onclick=openCardForm;$('#cancelCard').onclick=closeCardForm;
$('#saveCard').onclick=()=>{let amount=+$('#ccAmount').value||0,date=$('#ccDate').value;if(!date){alert('請選擇消費日期');return}if(amount<=0){alert('請輸入刷卡金額');return}let tx={id:'cc-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),date,card:$('#ccCard').value,amount,category:$('#ccCategory').value,note:$('#ccNote').value.trim(),synced:$('#ccSyncDaily').checked,created:Date.now()};cardTxs.push(tx);localStorage.setItem(CARD_KEY,JSON.stringify(cardTxs));if(tx.synced)addDailyFromCard(tx);$('#ccAmount').value='';$('#ccNote').value='';closeCardForm();render()};
$$('.ccFilters button').forEach(b=>b.onclick=()=>{cardFilter=b.dataset.cardfilter;$$('.ccFilters button').forEach(x=>x.classList.toggle('active',x===b));renderCards()});
function move(n){cur.m+=n;if(cur.m<1){cur.m=12;cur.y--}if(cur.m>12){cur.m=1;cur.y++}data=loadMonth();render()};$('#prev').onclick=()=>move(-1);$('#next').onclick=()=>move(1);
function showView(v){$$('.view').forEach(x=>x.classList.remove('active'));$$('nav button').forEach(x=>x.classList.remove('active'));$('#'+v).classList.add('active');$$('nav button').find(x=>x.dataset.v===v)?.classList.add('active')}
$$('nav button[data-v]').forEach(b=>b.onclick=()=>showView(b.dataset.v));
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));
render();
