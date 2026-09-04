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
  if(!x)x=fresh(); if(!x.income)x.income=fresh().income;
  ['husband','wife','other'].forEach(k=>{if(x.income[k]===undefined||x.income[k]===null)x.income[k]=fresh().income[k]});
  if(Number(x.income.husband)+Number(x.income.wife)+Number(x.income.other)===0)x.income=fresh().income;
  if(!Array.isArray(x.expenses)||!x.expenses.length)x.expenses=fresh().expenses;
  if(x.expenses.every(e=>(+e.amount||0)===0))x.expenses=fresh().expenses;
  x.expenses=x.expenses.map((e,i)=>({...e,amount:+e.amount||0,category:e.category||defaults[i]?.[2]||'其他'}));
  if(!Array.isArray(x.ledger))x.ledger=[]; if(x.bufferTarget===undefined)x.bufferTarget=null; if(!x.step)x.step=1; return x}
let data=loadMonth();
const inc=()=>+data.income.husband + +data.income.wife + +data.income.other;
const fixed=()=>data.expenses.reduce((s,x)=>s+(+x.amount||0),0);
const spent=()=>data.ledger.reduce((s,x)=>s+(x.budgetImpact===false?0:(+x.amount||0)),0);
const allSpent=()=>data.ledger.reduce((s,x)=>s+(+x.amount||0),0);
const pocketSpent=()=>data.ledger.reduce((s,x)=>s+(x.fundingSource==='pocket'?(+x.amount||0):0),0);
const remain=()=>inc()-fixed();
const suggestedBuffer=()=>Math.max(0,Math.round(remain()*0.2));
const buffer=()=>Math.max(0,data.bufferTarget===null?suggestedBuffer():(+data.bufferTarget||0));
const dailyBudget=()=>Math.max(0,remain()-buffer());
const avail=()=>dailyBudget()-spent();
function save(){localStorage.setItem(key(),JSON.stringify(data));render()}
function setStep(n){data.step=n;localStorage.setItem(key(),JSON.stringify(data));$$('.stepPanel').forEach(p=>p.classList.toggle('active',+p.dataset.panel===n));$$('#steps button').forEach(b=>b.classList.toggle('now',+b.dataset.step===n))}
function expenses(){let g=$('#expenses');g.innerHTML='';data.expenses.forEach((x,i)=>{let d=document.createElement('div');d.className='expense';let opts=CATS.map(c=>`<option ${x.category===c?'selected':''}>${c}</option>`).join('');d.innerHTML=`<div class="expenseMain"><span class="expenseName cat-${x.category}">${catIcon(x.category)}<b>${x.name}</b>${x.autoCardId?'<em class="autoBadge">自動</em>':''}</span><select class="catSelect" ${x.autoCardId?'disabled':''}>${opts}</select></div><input type="number" inputmode="numeric" value="${x.amount}" ${x.autoCardId?'readonly':''}>${x.autoCardId?'':'<button class="deleteExpense">×</button>'}`;d.querySelector('input').onchange=e=>{if(x.autoCardId)return;data.expenses[i].amount=+e.target.value||0;save()};d.querySelector('select').onchange=e=>{if(x.autoCardId)return;data.expenses[i].category=e.target.value;save()};let del=d.querySelector('button');if(del)del.onclick=()=>{if(confirm(`刪除「${x.name}」？`)){data.expenses.splice(i,1);save()}};g.appendChild(d)});renderCategorySummary()}
function renderCategorySummary(){let g=$('#categorySummary');let totals=Object.fromEntries(CATS.map(c=>[c,0]));data.expenses.forEach(e=>totals[e.category||'其他']+=+e.amount||0);g.innerHTML=CATS.map(c=>`<div class="catSummary cat-${c}">${catIcon(c)}<div><small>${c}</small><b>${fmt(totals[c])}</b></div></div>`).join('')}
function ledger(){let l=$('#ledger');l.innerHTML=data.ledger.length?'':'<p class="hint">本月還沒有記帳。</p>';[...data.ledger].reverse().forEach((x,ri)=>{let i=data.ledger.length-1-ri,d=document.createElement('div');d.className='ledger';let source=x.fundingSource==='pocket'?'手頭上現金':x.fundingSource==='living'?'當月生活費':'';let methodText=[x.method||'現金',source].filter(Boolean).join('・');d.innerHTML=`<div><b>${escapeHtml(x.note||x.category)}</b><small>${escapeHtml(x.category)}・${escapeHtml(methodText)}・${escapeHtml(x.date)}</small></div><div><b>${fmt(x.amount)}</b> <button>刪除</button></div>`;d.querySelector('button').onclick=()=>{if(x.sourceId){cardTxs=cardTxs.filter(t=>t.id!==x.sourceId);localStorage.setItem(CARD_KEY,JSON.stringify(cardTxs))}if(x.fundingSource==='pocket'){loans.cash=(+loans.cash||0)+(+x.amount||0);localStorage.setItem(LOAN_KEY,JSON.stringify(loans))}data.ledger.splice(i,1);save()};l.appendChild(d)})}

// ----- 信用卡 -----
const CARD_KEY='liyunjia-creditcards-v1';
const CARD_SETTINGS_KEY='liyunjia-creditcard-settings-v5';
const cardDefaults={ctbcCarry:173114,ctbcApr:15,ctbcMinDue:0,fubonCarry:0,fubonApr:10.88,fubonInst1Amount:4290,fubonInst1Count:2,fubonInst2Amount:1260,fubonInst2Count:1,yuniFubonCloseDay:8,cathayCloseDay:17};
function loadCardSettings(){let old={};for(const k of ['liyunjia-creditcard-settings-v2','liyunjia-creditcard-settings-v3','liyunjia-creditcard-settings-v4']){try{old={...old,...(JSON.parse(localStorage.getItem(k)||'null')||{})}}catch(e){}}try{let x=JSON.parse(localStorage.getItem(CARD_SETTINGS_KEY)||'null');if(x)return {...cardDefaults,...old,...x}}catch(e){}return {...cardDefaults,...old}}
let cardSettings=loadCardSettings();
function saveCardSettings(){localStorage.setItem(CARD_SETTINGS_KEY,JSON.stringify(cardSettings));renderCards()}
function fubonInstallmentDue(){return (cardSettings.fubonInst1Count>0?+cardSettings.fubonInst1Amount||0:0)+(cardSettings.fubonInst2Count>0?+cardSettings.fubonInst2Amount||0:0)}
function est30DayInterest(balance,apr){return Math.max(0,Math.round((+balance||0)*(+apr||0)/100*30/365))}
const CARDS={ctbc:{name:'中國信託',closeDay:()=>25},fubon:{name:'台北富邦',closeDay:()=>24},yuni_fubon:{name:'芋泥台北富邦',closeDay:()=>+cardSettings.yuniFubonCloseDay||0},cathay:{name:'國泰世華',closeDay:()=>+cardSettings.cathayCloseDay||0}};
let cardTxs=loadCards(),cardFilter='all';
function loadCards(){try{let x=JSON.parse(localStorage.getItem(CARD_KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return []}}
const pad=n=>String(n).padStart(2,'0');
const iso=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
function prevMonth(y,m){return m===1?[y-1,12]:[y,m-1]}
function daysInMonth(y,m){return new Date(y,m,0).getDate()}
function statementCycle(y,m,closeDay){let [py,pm]=prevMonth(y,m);let startDay=Math.min(closeDay+1,daysInMonth(py,pm));let endDay=Math.min(closeDay,daysInMonth(y,m));return {start:iso(py,pm,startDay),end:iso(y,m,endDay)}}
function inRange(date,start,end){return date>=start&&date<=end}
function txSum(items){return items.reduce((s,x)=>s+(+x.amount||0),0)}
function selectedMonthTxs(){let prefix=`${cur.y}-${pad(cur.m)}-`;return cardTxs.filter(x=>(x.date||'').startsWith(prefix))}
function cardMonthTxs(cardId){return selectedMonthTxs().filter(x=>x.card===cardId)}
function statementTxs(cardId){let day=CARDS[cardId].closeDay();if(!day)return cardMonthTxs(cardId);let cyc=statementCycle(cur.y,cur.m,day);return cardTxs.filter(x=>x.card===cardId&&inRange(x.date,cyc.start,cyc.end))}
function shortDate(s){let [y,m,d]=s.split('-').map(Number);return `${m}/${d}`}
function statementStatus(end){let today=new Date();let t=iso(today.getFullYear(),today.getMonth()+1,today.getDate());if(t>end)return ['已結帳','closed'];return ['累計中','']}
function nextMonthYM(y=cur.y,m=cur.m){return m===12?[y+1,1]:[y,m+1]}
function cardEstimate(cardId){
  const newSpend=txSum(statementTxs(cardId));
  const ctbcInterest=est30DayInterest(cardSettings.ctbcCarry,cardSettings.ctbcApr);
  const fubonInterest=est30DayInterest(cardSettings.fubonCarry,cardSettings.fubonApr);
  const extra=cardId==='ctbc'?(+cardSettings.ctbcCarry||0)+ctbcInterest:cardId==='fubon'?(+cardSettings.fubonCarry||0)+fubonInterest+fubonInstallmentDue():0;
  return Math.max(0,newSpend+extra);
}
function cardDueForNextFixed(cardId){
  // 中信採「最低應繳」；因 GitHub 靜態版無法連銀行帳單，最低應繳由使用者依實際帳單輸入。
  if(cardId==='ctbc')return Math.max(0,+cardSettings.ctbcMinDue||0);
  return cardEstimate(cardId);
}
function syncCardsToNextMonth(){
  const [ny,nm]=nextMonthYM();
  const target=loadMonth(ny,nm);
  // 第一次由分卡自動同步時，移除舊版預設的籠統「分期／卡費」，避免重複計算。
  const hasAuto=target.expenses.some(e=>e.autoCardId);
  if(!hasAuto){
    target.expenses=target.expenses.filter(e=>!(e.name==='分期／卡費' && (+e.amount||0)===9390));
  }
  const labels={ctbc:'信用卡｜中國信託',fubon:'信用卡｜台北富邦',yuni_fubon:'信用卡｜芋泥台北富邦',cathay:'信用卡｜國泰世華'};
  for(const id of Object.keys(CARDS)){
    const amount=cardDueForNextFixed(id);
    const idx=target.expenses.findIndex(e=>e.autoCardId===id);
    const row={name:labels[id],amount,category:'債務',autoCardId:id,autoSourceMonth:`${cur.y}-${pad(cur.m)}`};
    if(idx>=0)target.expenses[idx]={...target.expenses[idx],...row}; else target.expenses.push(row);
  }
  target.finished=false;
  localStorage.setItem(key(ny,nm),JSON.stringify(target));
}
function renderCards(){
  let monthItems=selectedMonthTxs(),mt=txSum(monthItems);$('#ccMonthTotal').textContent=fmt(mt);$('#ccListTotal').textContent=fmt(mt);$('#ccListTitle').textContent=`${cur.y}/${cur.m} 刷卡紀錄`;
  const ctbcInterest=est30DayInterest(cardSettings.ctbcCarry,cardSettings.ctbcApr),fubonInterest=est30DayInterest(cardSettings.fubonCarry,cardSettings.fubonApr);
  const estimates={};
  for(const id of Object.keys(CARDS)){
    let card=CARDS[id],day=card.closeDay(),estimate=cardEstimate(id);estimates[id]=estimate;
    let status=['待設定','future'],cycle='請設定結帳日';if(day){let cyc=statementCycle(cur.y,cur.m,day);cycle=`${shortDate(cyc.start)}～${shortDate(cyc.end)}`;status=statementStatus(cyc.end)}
    $(`#${id}Bill`).textContent=fmt(estimate);$(`#${id}Estimate`).textContent=fmt(estimate);$(`#${id}Cycle`).textContent=cycle;let st=$(`#${id}Status`);st.textContent=status[0];st.className='ccStatus'+(status[1]?' '+status[1]:'')
  }
  $('#ctbcCarry').value=cardSettings.ctbcCarry;$('#ctbcMinDue').value=cardSettings.ctbcMinDue||'';$('#fubonCarry').value=cardSettings.fubonCarry||0;$('#fubonInst1Amount').value=cardSettings.fubonInst1Amount;$('#fubonInst1Count').value=cardSettings.fubonInst1Count;$('#fubonInst2Amount').value=cardSettings.fubonInst2Amount;$('#fubonInst2Count').value=cardSettings.fubonInst2Count;$('#ctbcCarryView').textContent=fmt(cardSettings.ctbcCarry);$('#ctbcInterestView').textContent=fmt(ctbcInterest);$('#ctbcInterestSummary').textContent=fmt(ctbcInterest);$('#fubonCarryView').textContent=fmt(cardSettings.fubonCarry||0);$('#fubonInterestView').textContent=fmt(fubonInterest);$('#fubonInstallmentDue').textContent=fmt(fubonInstallmentDue());$('#yuniFubonCloseDay').value=cardSettings.yuniFubonCloseDay||'';$('#cathayCloseDay').value=cardSettings.cathayCloseDay||'';
  const [ny,nm]=nextMonthYM();
  $('#ccSyncMonth').textContent=`${ny}/${nm}`;
  $('#syncCtbc').textContent=cardSettings.ctbcMinDue>0?fmt(cardSettings.ctbcMinDue):'待輸入';
  $('#syncFubon').textContent=fmt(estimates.fubon);$('#syncYuniFubon').textContent=fmt(estimates.yuni_fubon);$('#syncCathay').textContent=fmt(estimates.cathay);
  syncCardsToNextMonth();
  let filtered=monthItems.filter(x=>cardFilter==='all'||x.card===cardFilter).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(+b.created||0)-(+a.created||0));let el=$('#ccLedger');if(!filtered.length){el.innerHTML='<div class="ccEmpty">這個月還沒有信用卡消費；請從「今日開銷」新增。</div>';return}el.innerHTML=filtered.map(x=>`<div class="ccTx readOnly"><div class="ccTxDate">${shortDate(x.date)}</div><div class="ccTxInfo"><b>${escapeHtml(x.note||x.category||'刷卡')}</b><small>${escapeHtml(CARDS[x.card]?.name||'信用卡')}・${escapeHtml(x.category||'其他')}</small></div><div class="ccTxAmount">${fmt(x.amount)}</div></div>`).join('')
}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function defaultCardDate(){let now=new Date(),same=now.getFullYear()===cur.y&&now.getMonth()+1===cur.m;return same?iso(cur.y,cur.m,now.getDate()):iso(cur.y,cur.m,1)}

// ----- 借款 / 手頭現金 -----
const LOAN_KEY='liyunjia-loans-v1';
const loanFresh=()=>({cash:0,funds:{大寶:0,二寶:0,三寶:0},owed:{姐姐:32000,大寶:0,二寶:0,三寶:0},txs:[]});
function loadLoans(){let x=null;try{x=JSON.parse(localStorage.getItem(LOAN_KEY)||'null')}catch(e){};let d=loanFresh();if(!x)return d;x.cash=+x.cash||0;x.funds={...d.funds,...(x.funds||{})};x.owed={...d.owed,...(x.owed||{})};x.txs=Array.isArray(x.txs)?x.txs:[];return x}
let loans=loadLoans();
function saveLoans(){localStorage.setItem(LOAN_KEY,JSON.stringify(loans));renderLoans()}
const childMap={大寶:'大寶',二寶:'二寶',三寶:'三寶'};
function totalOwed(){return Object.values(loans.owed).reduce((s,v)=>s+(+v||0),0)}
function renderLoans(){
  $('#loanTotal').textContent=fmt(totalOwed());
  $('#fundBig').value=loans.funds.大寶;$('#fundSecond').value=loans.funds.二寶;$('#fundThird').value=loans.funds.三寶;
  $('#oweSister').value=loans.owed.姐姐;$('#oweBig').value=loans.owed.大寶;$('#oweSecond').value=loans.owed.二寶;$('#oweThird').value=loans.owed.三寶;
  let el=$('#loanLedger');if(!loans.txs.length){el.innerHTML='<div class="loanEmpty">目前還沒有新增借款明細；姐姐既有欠款 $32,000 已列在上方。</div>';return}
  el.innerHTML=[...loans.txs].reverse().map(x=>`<div class="loanTx"><div class="loanTxIcon ${x.type}">${x.type==='borrow'?'借':'還'}</div><div class="loanTxInfo"><b>${escapeHtml(x.person)}・${x.type==='borrow'?'借入':'還款'}</b><small>${escapeHtml(x.note||'—')}・${escapeHtml(x.date||'')}</small></div><div class="loanTxAmount ${x.type}">${x.type==='borrow'?'+':'-'}${fmt(x.amount)}</div><button data-loanid="${x.id}">刪除</button></div>`).join('');
  $$('[data-loanid]').forEach(b=>b.onclick=()=>deleteLoanTx(b.dataset.loanid));
}
function addLoanTx(){let type=$('#loanType').value,person=$('#loanPerson').value,amount=+$('#loanAmount').value||0,note=$('#loanNote').value.trim(),sync=$('#loanSyncCash').checked;if(amount<=0){alert('請輸入借款或還款金額');return}let before={cash:loans.cash,fund:loans.funds[person]??null,owed:loans.owed[person]||0};if(type==='borrow'){loans.owed[person]=(loans.owed[person]||0)+amount;if(childMap[person])loans.funds[person]=Math.max(0,(+loans.funds[person]||0)-amount);if(sync)loans.cash=(+loans.cash||0)+amount}else{let actual=Math.min(amount,+loans.owed[person]||0);if(actual<=0){alert('這個對象目前沒有尚欠借款');return}amount=actual;loans.owed[person]=Math.max(0,(+loans.owed[person]||0)-amount);if(childMap[person])loans.funds[person]=(+loans.funds[person]||0)+amount;if(sync)loans.cash=Math.max(0,(+loans.cash||0)-amount)}let now=new Date();loans.txs.push({id:'loan-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),type,person,amount,note,sync,date:now.toLocaleDateString('zh-TW',{year:'numeric',month:'numeric',day:'numeric'}),before});$('#loanAmount').value='';$('#loanNote').value='';saveLoans()}
function deleteLoanTx(id){let i=loans.txs.findIndex(x=>x.id===id);if(i<0)return;let x=loans.txs[i];if(!confirm('刪除這筆借款明細並還原當時的餘額？'))return;let b=x.before||{};if(b.cash!==undefined)loans.cash=+b.cash||0;if(b.owed!==undefined)loans.owed[x.person]=+b.owed||0;if(childMap[x.person]&&b.fund!==null&&b.fund!==undefined)loans.funds[x.person]=+b.fund||0;loans.txs.splice(i,1);saveLoans()}

function render(){let r=remain(),rate=inc()>0?fixed()/inc()*100:0,a=avail(),db=dailyBudget(),b=buffer(),pct=db>0?Math.min(100,Math.max(0,spent()/db*100)):0;
 $('#month').textContent=`${cur.y}/${cur.m}`;$('#husband').value=data.income.husband;$('#wife').value=data.income.wife;$('#other').value=data.income.other;
 $('#heroAvail').textContent=fmt(Math.max(0,a));$('#heroSub').textContent=`收入 ${fmt(inc())}・固定支出 ${fmt(fixed())}・已花 ${fmt(spent())}`;$('#meterFill').style.width=pct+'%';
 $('#dailyPageAvail').textContent=fmt(Math.max(0,a));$('#dailyPageSpent').textContent=fmt(allSpent());$('#quickCashView').textContent=fmt(loans.cash);$('#quickCashOnHand').value=loans.cash;$('#dailyToday').textContent=new Date().toLocaleDateString('zh-TW',{month:'numeric',day:'numeric',weekday:'short'});$('#dailyListTitle').textContent=`${cur.y}/${cur.m} 開銷紀錄`;$('#dailyBudget').textContent=fmt(db);$('#dailySpent').textContent=fmt(spent());$('#pocketSpent').textContent=fmt(pocketSpent());$('#dailyAvailable').textContent=fmt(Math.max(0,a));$('#dailyMeterFill').style.width=pct+'%';ledger();
 $('#sIncome').textContent=fmt(inc());$('#sRemain').textContent=fmt(Math.max(0,r));$('#sFixed').textContent=fmt(fixed());$('#sDone').textContent=data.finished?'✓ 已完成':'待確認';
 $('#incomeTotal').textContent=fmt(inc());$('#remainSummary').textContent=fmt(Math.max(0,r));$('#fixedTotal').textContent=fmt(fixed());$('#doneSummary').textContent=data.finished?'✓ 已完成':'待確認';$('#fixedRate').textContent=Math.round(rate)+'%';$('#fixedHint').textContent=rate<=80?'仍有保留彈性':'固定支出占比較高';$('#postFixed').textContent=fmt(Math.max(0,r));$('#bufferSuggest').textContent=fmt(suggestedBuffer());$('#spendSuggest').textContent=fmt(Math.max(0,r-suggestedBuffer()));
 $('#adviceMsg').innerHTML=r<0?`目前固定支出比收入多 <b>${fmt(Math.abs(r))}</b>，建議先檢查可調整項目。`:`固定支出後剩下 <b>${fmt(r)}</b>，系統先保留 <b>${fmt(suggestedBuffer())}</b> 作為緩衝。`;
 $('#miniIncome').textContent=fmt(inc());$('#miniFixed').textContent=fmt(fixed());$('#miniRemain').textContent=fmt(Math.max(0,r));$('#fIncome').textContent=fmt(inc());$('#fFixed').textContent=fmt(fixed());$('#fSpend').textContent=fmt(db);$('#fBuffer').textContent=fmt(b);$('#bufferTarget').value=b;
 $('#dSpent').textContent=fmt(spent());$('#diagIncome').textContent=fmt(inc());$('#diagFixed').textContent=fmt(fixed());$('#diagSpent').textContent=fmt(spent());$('#diagAvail').textContent=fmt(Math.max(0,a));$('#diagMsg').innerHTML=a>=0?`扣除固定支出、緩衝金與每日開銷後，目前還有 <b>${fmt(a)}</b> 可以使用。`:`每日開銷已超過設定的日常額度 <b>${fmt(Math.abs(a))}</b>。`;
 expenses();setStep(data.step||1);renderCards();renderLoans()}

['husband','wife','other'].forEach(id=>$('#'+id).onchange=()=>{data.income.husband=+$('#husband').value||0;data.income.wife=+$('#wife').value||0;data.income.other=+$('#other').value||0;data.finished=false;save()});
$$('#steps button').forEach(b=>b.onclick=()=>setStep(+b.dataset.step));$$('.nextStep').forEach(b=>b.onclick=()=>setStep(+b.dataset.next));
$('#bufferTarget').onchange=()=>{data.bufferTarget=Math.max(0,+$('#bufferTarget').value||0);data.finished=false;save()};
let quickPayMethod='cash',quickCashSource='living';
function renderQuickPayChoice(){$$('#payMethodTabs button').forEach(x=>x.classList.toggle('active',x.dataset.method===quickPayMethod));$('#qCardWrap').classList.toggle('hidden',quickPayMethod!=='credit');$('#qCashSourceWrap').classList.toggle('hidden',quickPayMethod!=='cash')}
$$('#payMethodTabs button').forEach(b=>b.onclick=()=>{quickPayMethod=b.dataset.method;renderQuickPayChoice()});
$$('#cashSourceTabs button').forEach(b=>b.onclick=()=>{quickCashSource=b.dataset.source;$$('#cashSourceTabs button').forEach(x=>x.classList.toggle('active',x===b));$('#cashSourceHint').textContent=quickCashSource==='pocket'?`這筆會從手頭上現金 ${fmt(loans.cash)} 扣除，不重複扣當月生活費。`:'這筆會從「本月目前可用」扣除。'});
$('#saveQ').onclick=()=>{let amount=+$('#qAmount').value||0;if(amount<=0){alert('請輸入開銷金額');$('#qAmount').focus();return}let category=$('#qCategory').value,note=$('#qNote').value.trim(),now=new Date(),sameMonth=now.getFullYear()===cur.y&&now.getMonth()+1===cur.m,displayDate=sameMonth?now.toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'}):`${cur.m}/1`;if(quickPayMethod==='credit'){let card=$('#qCard').value,date=defaultCardDate(),tx={id:'cc-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),date,card,amount,category,note,synced:true,created:Date.now()};cardTxs.push(tx);localStorage.setItem(CARD_KEY,JSON.stringify(cardTxs));data.ledger.push({amount,category,method:CARDS[card].name,note:note||'信用卡消費',date:displayDate,source:'credit-card',sourceId:tx.id,budgetImpact:true})}else if(quickCashSource==='pocket'){if(amount>(+loans.cash||0)){alert(`手頭上現金目前只有 ${fmt(loans.cash)}，不足以支付這筆開銷。`);return}loans.cash=Math.max(0,(+loans.cash||0)-amount);localStorage.setItem(LOAN_KEY,JSON.stringify(loans));data.ledger.push({amount,category,method:'現金',fundingSource:'pocket',budgetImpact:false,note:note||'現金開銷',date:displayDate})}else{data.ledger.push({amount,category,method:'現金',fundingSource:'living',budgetImpact:true,note:note||'現金開銷',date:displayDate})}$('#qAmount').value='';$('#qNote').value='';data.finished=false;save()};
$('#finish').onclick=()=>{data.finished=true;data.step=4;save();alert('本月預算已完成 ✓')};$('#addExpense').onclick=()=>$('#dlg').showModal();$('#eSave').onclick=e=>{let name=$('#eName').value.trim(),amount=+$('#eAmount').value||0;if(!name||amount<=0){e.preventDefault();return alert('請輸入名稱與金額')}data.expenses.push({name,amount,category:$('#eCategory').value});data.finished=false;$('#eName').value='';$('#eAmount').value='';save()};
$$('.ccFilters button').forEach(b=>b.onclick=()=>{cardFilter=b.dataset.cardfilter;$$('.ccFilters button').forEach(x=>x.classList.toggle('active',x===b));renderCards()});
['ctbcCarry','ctbcMinDue','fubonCarry','fubonInst1Amount','fubonInst1Count','fubonInst2Amount','fubonInst2Count','yuniFubonCloseDay','cathayCloseDay'].forEach(id=>$('#'+id).onchange=()=>{cardSettings[id]=Math.max(0,+$('#'+id).value||0);saveCardSettings()});
['fundBig','fundSecond','fundThird','oweSister','oweBig','oweSecond','oweThird'].forEach(id=>$('#'+id).onchange=()=>{const v=Math.max(0,+$('#'+id).value||0);if(id==='fundBig')loans.funds.大寶=v;if(id==='fundSecond')loans.funds.二寶=v;if(id==='fundThird')loans.funds.三寶=v;if(id==='oweSister')loans.owed.姐姐=v;if(id==='oweBig')loans.owed.大寶=v;if(id==='oweSecond')loans.owed.二寶=v;if(id==='oweThird')loans.owed.三寶=v;saveLoans()});
$('#quickCashOnHand').onchange=()=>{loans.cash=Math.max(0,+$('#quickCashOnHand').value||0);saveLoans();render()};
$('#saveLoan').onclick=addLoanTx;
function move(n){cur.m+=n;if(cur.m<1){cur.m=12;cur.y--}if(cur.m>12){cur.m=1;cur.y++}data=loadMonth();render()};$('#prev').onclick=()=>move(-1);$('#next').onclick=()=>move(1);
function showView(v){const target=document.getElementById(v);if(!target)return;$$('.view').forEach(x=>x.classList.remove('active'));$$('nav button[data-v]').forEach(x=>x.classList.remove('active'));target.classList.add('active');const btn=$$('nav button[data-v]').find(x=>x.dataset.v===v);if(btn)btn.classList.add('active');window.scrollTo({top:0,behavior:'instant'});if(v==='cards')renderCards();if(v==='quick'){ledger();$('#quickCashView').textContent=fmt(loans.cash);$('#quickCashOnHand').value=loans.cash}if(v==='loans')renderLoans()}
$$('nav button[data-v]').forEach(b=>{b.type='button';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showView(b.dataset.v)})});
if('serviceWorker' in navigator){window.addEventListener('load',async()=>{try{const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs){if(!String(r.active?.scriptURL||'').includes('service-worker.js?v=14.0.0'))await r.unregister()}}catch(e){}try{await navigator.serviceWorker.register('./service-worker.js?v=14.0.0',{updateViaCache:'none'})}catch(e){}})}
render();
