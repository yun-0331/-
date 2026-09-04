const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const fmt=n=>'$'+Math.round(Number(n)||0).toLocaleString('zh-TW');
let cur={y:2026,m:9};
const installmentAmount=(y,m)=>(y<2026||(y===2026&&m<=12))?2980:0;
const cardFeeAmount=(y,m)=>({202610:3000,202611:3000,202612:2000,202701:1200}[y*100+m]||0);
const defaultsFor=(y=cur.y,m=cur.m)=>{let rows=[['先生生活費',12000,'必要'],['孝親費',12000,'必要'],['大寶生活費',1200,'必要'],['二寶生活費',400,'必要'],['保險',16500,'必要'],['信貸(1)',7496,'債務'],['信貸(2)',6100,'債務'],['信貸(3)',6844,'債務']];if(installmentAmount(y,m)>0)rows.push(['分期（至115年12月）',installmentAmount(y,m),'債務']);if(cardFeeAmount(y,m)>0)rows.push(['卡費（10月～1月）',cardFeeAmount(y,m),'債務']);rows.push(['補習與英文',17100,'小孩'],['ETC 與加油',9000,'交通'],['電話',4000,'必要'],['長照',1500,'必要'],['捐款與 ETF',1600,'可調整']);return rows};
const defaults=defaultsFor();
const CATS=['必要','可調整','債務','小孩','交通','其他'];
const CAT_ICON={必要:'M12 3l7 4v5c0 4.8-3 8-7 9-9-2-7-9-7-9V7l7-4z',可調整:'M4 7h16M7 7v13h10V7M9 4h6l1 3H8l1-3z',債務:'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 4h6M8 12h8M8 16h5',小孩:'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-6 8a6 6 0 0 1 12 0',交通:'M5 17h14l-1-7a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2l-1 7zm2 0v2m10-2v2M7 13h10',其他:'M12 5v14M5 12h14'};
const catIcon=c=>`<svg class="catIcon" viewBox="0 0 24 24"><path d="${CAT_ICON[c]||CAT_ICON.其他}"/></svg>`;
const key=(y=cur.y,m=cur.m)=>`liyunjia-${y}-${String(m).padStart(2,'0')}`;
const fresh=(y=cur.y,m=cur.m)=>({income:{husband:67000,wife:33000,other:8000},expenses:defaultsFor(y,m).map(([name,amount,category])=>({name,amount,category})),ledger:[],incomeLedger:[],finished:false,savedAmount:0,step:1});
function loadMonth(y=cur.y,m=cur.m){let x=null;try{x=JSON.parse(localStorage.getItem(key(y,m))||'null')}catch(e){}
  if(!x)x=fresh(y,m); if(!x.income)x.income=fresh(y,m).income;
  ['husband','wife','other'].forEach(k=>{if(x.income[k]===undefined||x.income[k]===null)x.income[k]=fresh(y,m).income[k]});
  if(Number(x.income.husband)+Number(x.income.wife)+Number(x.income.other)===0)x.income=fresh(y,m).income;
  if(!Array.isArray(x.expenses)||!x.expenses.length)x.expenses=fresh(y,m).expenses;
  if(x.expenses.every(e=>(+e.amount||0)===0))x.expenses=fresh(y,m).expenses;
  // v25：固定前五項順序；兩位孩子生活費改為「必要」的一般固定支出。到期排程直接從畫面移除。
  x.expenses=x.expenses.filter(e=>e.name!=='分期／卡費');
  const renameChild={'大寶生活費（300×4週）':'大寶生活費','二寶生活費（100×4週）':'二寶生活費'};
  x.expenses.forEach(e=>{if(renameChild[e.name]){e.name=renameChild[e.name];e.category='必要';delete e.scheduleId}});
  const ensureNormal=(name,amount)=>{let e=x.expenses.find(e=>e.name===name);if(e){e.amount=amount;e.category='必要';delete e.scheduleId}else x.expenses.push({name,amount,category:'必要'})};
  ensureNormal('大寶生活費',1200); ensureNormal('二寶生活費',400);
  const syncTimed=(name,amount,scheduleId)=>{x.expenses=x.expenses.filter(e=>!(e.name===name||e.scheduleId===scheduleId));if(amount>0)x.expenses.push({name,amount,category:'債務',scheduleId})};
  syncTimed('分期（至115年12月）',installmentAmount(y,m),'installment-2026-12');
  syncTimed('卡費（10月～1月）',cardFeeAmount(y,m),'cardfee-2026-10-2027-01');
  // v24：修正三筆信貸的正確每月繳款金額。
  const correctLoanPayments={'信貸(1)':7496,'信貸(2)':6100,'信貸(3)':6844};
  x.expenses.forEach(e=>{if(correctLoanPayments[e.name]!==undefined){e.amount=correctLoanPayments[e.name];e.category='債務';e.correctLoanPayment=true}});
  const fixedOrder=['先生生活費','孝親費','大寶生活費','二寶生活費','保險','信貸(1)','信貸(2)','信貸(3)','分期（至115年12月）','卡費（10月～1月）','補習與英文','ETC 與加油','電話','長照','捐款與 ETF'];
  x.expenses.sort((a,b)=>{let ai=fixedOrder.indexOf(a.name),bi=fixedOrder.indexOf(b.name);ai=ai<0?999:ai;bi=bi<0?999:bi;return ai-bi});
  x.expenses=x.expenses.map((e,i)=>({...e,amount:+e.amount||0,category:e.category||defaultsFor(y,m)[i]?.[2]||'其他'}));
  if(!Array.isArray(x.ledger))x.ledger=[]; if(!Array.isArray(x.incomeLedger))x.incomeLedger=[]; if(x.savedAmount===undefined)x.savedAmount=0; if(!x.step)x.step=1; if(x.step===2)x.step=1; else if(x.step===3)x.step=2; return x}
let data=loadMonth();
const inc=()=>+data.income.husband + +data.income.wife + +data.income.other;
const fixed=()=>data.expenses.reduce((s,x)=>s+(+x.amount||0),0);
const spent=()=>data.ledger.reduce((s,x)=>s+(x.budgetImpact===false?0:(+x.amount||0)),0);
const allSpent=()=>data.ledger.reduce((s,x)=>s+(+x.amount||0),0);
const livingExtraIncome=()=>data.incomeLedger.reduce((s,x)=>s+(x.destination==='living'?(+x.amount||0):0),0);
const allDailyIncome=()=>data.incomeLedger.reduce((s,x)=>s+(+x.amount||0),0);
const pocketSpent=()=>data.ledger.reduce((s,x)=>s+(x.fundingSource==='pocket'?(+x.amount||0):0),0);
const remain=()=>inc()-fixed();
const SAVINGS_RATE=10;
const suggestedSavings=()=>Math.max(0,Math.round(inc()*SAVINGS_RATE/100));
const saved=()=>Math.max(0,+data.savedAmount||0);
const baseAvailable=()=>Math.max(0,remain()-saved());
const dailyBudget=()=>baseAvailable();
const avail=()=>dailyBudget()+livingExtraIncome()-spent();
function save(){localStorage.setItem(key(),JSON.stringify(data));render()}
function setStep(n){data.step=n;localStorage.setItem(key(),JSON.stringify(data));$$('.stepPanel').forEach(p=>p.classList.toggle('active',+p.dataset.panel===n));$$('#steps button').forEach(b=>b.classList.toggle('now',+b.dataset.step===n))}
function expenses(){let g=$('#expenses');g.innerHTML='';data.expenses.forEach((x,i)=>{let d=document.createElement('div');d.className='expense';let opts=CATS.map(c=>`<option ${x.category===c?'selected':''}>${c}</option>`).join('');d.innerHTML=`<div class="expenseMain"><span class="expenseName cat-${x.category}">${catIcon(x.category)}<b>${x.name}</b>${x.autoCardId?'<em class="autoBadge">自動</em>':x.scheduleId?'<em class="autoBadge">排程</em>':''}</span><select class="catSelect" ${(x.autoCardId||x.scheduleId)?'disabled':''}>${opts}</select></div><input type="number" inputmode="numeric" value="${x.amount}" ${(x.autoCardId||x.scheduleId)?'readonly':''}>${(x.autoCardId||x.scheduleId)?'':'<button class="deleteExpense">×</button>'}`;d.querySelector('input').onchange=e=>{if(x.autoCardId||x.scheduleId)return;data.expenses[i].amount=+e.target.value||0;save()};d.querySelector('select').onchange=e=>{if(x.autoCardId||x.scheduleId)return;data.expenses[i].category=e.target.value;save()};let del=d.querySelector('button');if(del)del.onclick=()=>{if(confirm(`刪除「${x.name}」？`)){data.expenses.splice(i,1);save()}};g.appendChild(d)});renderCategorySummary()}
function renderCategorySummary(){let g=$('#categorySummary');let totals=Object.fromEntries(CATS.map(c=>[c,0]));data.expenses.forEach(e=>totals[e.category||'其他']+=+e.amount||0);g.innerHTML=CATS.map(c=>`<div class="catSummary cat-${c}">${catIcon(c)}<div><small>${c}</small><b>${fmt(totals[c])}</b></div></div>`).join('')}
function ledger(){let l=$('#ledger');let rows=[];data.ledger.forEach((x,i)=>rows.push({kind:'expense',x,i,sort:i+(x.created||0)}));data.incomeLedger.forEach((x,i)=>rows.push({kind:'income',x,i,sort:i+(x.created||0)}));rows.sort((a,b)=>(b.x.date||'').localeCompare(a.x.date||'')||(b.x.created||0)-(a.x.created||0));l.innerHTML=rows.length?'':'<p class="hint">本月還沒有收支紀錄。</p>';rows.forEach(r=>{let x=r.x,d=document.createElement('div');d.className='ledger'+(r.kind==='income'?' incomeEntry':'');if(r.kind==='income'){let dest=x.destination==='pocket'?'手頭上現金':'當月生活費';d.innerHTML=`<div><b>${escapeHtml(x.note||x.category||'今日收入')}</b><small>${escapeHtml(x.category||'其他收入')}・${dest}・${escapeHtml(x.date)}</small></div><div><b>+${fmt(x.amount)}</b> <button>刪除</button></div>`;d.querySelector('button').onclick=()=>{if(x.destination==='pocket'){loans.cash=Math.max(0,(+loans.cash||0)-(+x.amount||0));localStorage.setItem(LOAN_KEY,JSON.stringify(loans))}data.incomeLedger.splice(r.i,1);save()}}else{let source=x.fundingSource==='pocket'?'手頭上現金':x.fundingSource==='living'?'當月生活費':'';let methodText=[x.method||'現金',source].filter(Boolean).join('・');d.innerHTML=`<div><b>${escapeHtml(x.note||x.category)}</b><small>${escapeHtml(x.category)}・${escapeHtml(methodText)}・${escapeHtml(x.date)}</small></div><div><b>-${fmt(x.amount)}</b> <button>刪除</button></div>`;d.querySelector('button').onclick=()=>{if(x.sourceId){cardTxs=cardTxs.filter(t=>t.id!==x.sourceId);localStorage.setItem(CARD_KEY,JSON.stringify(cardTxs))}if(x.fundingSource==='pocket'){loans.cash=(+loans.cash||0)+(+x.amount||0);localStorage.setItem(LOAN_KEY,JSON.stringify(loans))}data.ledger.splice(r.i,1);save()}}l.appendChild(d)})}

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
function ceil100(n){return Math.ceil(Math.max(0,n)/100)*100}
function ctbcAutoMinDue(){
  const newSpend=txSum(statementTxs('ctbc'));
  const carry=Math.max(0,+cardSettings.ctbcCarry||0);
  const interest=est30DayInterest(carry,cardSettings.ctbcApr);
  const total=carry+newSpend+interest;
  if(total<=0)return 0;
  // 預估：當期新增一般消費 10% + 其餘未繳餘額 5% + 預估循環利息，百元進位。
  // 實際帳單仍可能因入帳日、費用、逾期款、超額、分期等不同。
  let due=ceil100(newSpend*0.10+carry*0.05+interest);
  if(total<1000)return Math.round(total);
  return Math.min(total,Math.max(1000,due));
}
function ctbcDueForNextFixed(){
  // 若使用者有手動修正，以手動值優先；0 / 空白則使用自動預估。
  const manual=Math.max(0,+cardSettings.ctbcMinDue||0);
  return manual>0?manual:ctbcAutoMinDue();
}
function cardDueForNextFixed(cardId){
  if(cardId==='ctbc')return ctbcDueForNextFixed();
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
  $('#syncCtbc').textContent=fmt(ctbcDueForNextFixed());
  const autoMin=ctbcAutoMinDue();
  const autoMinEl=$('#ctbcAutoMinDue'); if(autoMinEl)autoMinEl.textContent=fmt(autoMin);
  const totalEstEl=$('#ctbcTotalEstimate'); if(totalEstEl)totalEstEl.textContent=fmt(estimates.ctbc);
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


function renderDiagnosis(){
  const total=allSpent();
  const totals={};
  data.ledger.forEach(x=>{const c=x.category||'其他';totals[c]=(totals[c]||0)+(+x.amount||0)});
  const rows=Object.entries(totals).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const list=$('#diagCategoryList'), advice=$('#diagAdvice');
  if(!list||!advice)return;
  if(!rows.length){
    list.innerHTML='<div class="diagEmpty">本月還沒有開銷紀錄。從「今日開銷」開始記帳後，這裡會自動分析。</div>';
    advice.innerHTML='<div class="diagAdviceItem neutral"><b>先記錄幾筆開銷</b><p>有實際資料後，我會依照餐飲、購物、交通、生活等分類，找出比較有機會調整的項目。</p></div>';
    return;
  }
  list.innerHTML=rows.map(([c,v],i)=>{const pct=total?Math.round(v/total*100):0;return `<div class="diagCatRow"><div><b>${i+1}. ${escapeHtml(c)}</b><small>${pct}%</small></div><strong>${fmt(v)}</strong><span><i style="width:${Math.min(100,pct)}%"></i></span></div>`}).join('');
  const flexible=['購物','餐飲','其他','生活','交通'];
  const messages=[];
  rows.filter(([c])=>flexible.includes(c)).slice(0,3).forEach(([c,v])=>{
    const pct=total?Math.round(v/total*100):0;
    let text='';
    if(c==='購物') text=`本月購物 ${fmt(v)}，占生活開銷 ${pct}%。可以先看看是否有非急需、重複購買或可以延到下個月的項目。`;
    else if(c==='餐飲') text=`本月餐飲 ${fmt(v)}，占生活開銷 ${pct}%。若外食、飲料或臨時加買較多，可以從其中挑一小部分減少，不必把正常吃飯預算壓得太低。`;
    else if(c==='交通') text=`本月交通 ${fmt(v)}，占生活開銷 ${pct}%。可以檢查是否有可合併的行程、停車費或非必要往返；固定通勤則不列為優先刪減。`;
    else if(c==='生活') text=`本月生活類 ${fmt(v)}，占生活開銷 ${pct}%。可以打開明細找一次性或可延後採買的項目。`;
    else text=`本月其他類 ${fmt(v)}，占生活開銷 ${pct}%。「其他」通常最容易藏著零碎支出，建議先檢查明細，看哪些其實可以少買或重新分類。`;
    messages.push({c,v,text});
  });
  const adjustable=data.expenses.filter(x=>x.category==='可調整'&&(+x.amount||0)>0).sort((a,b)=>b.amount-a.amount);
  if(adjustable.length){const x=adjustable[0];messages.push({c:'固定支出',v:+x.amount,text:`固定支出中「${escapeHtml(x.name)}」被標成可調整，目前 ${fmt(x.amount)}。如果這筆不是必要支出，可以再評估是否要降低。`})}
  if(!messages.length) messages.push({c:'本月狀況',v:0,text:'目前記錄多集中在必要、醫療或孩子相關項目，暫時沒有很明顯適合直接刪減的支出。可以繼續記帳，資料越完整判斷越準。'});
  advice.innerHTML=messages.slice(0,4).map((x,i)=>`<div class="diagAdviceItem ${i===0?'priority':''}"><span>${i===0?'優先看看':'再檢查'}</span><b>${escapeHtml(x.c)}</b><p>${x.text}</p></div>`).join('');
}
function render(){let r=remain(),rate=inc()>0?fixed()/inc()*100:0,a=avail(),db=dailyBudget(),sv=saved(),pct=db>0?Math.min(100,Math.max(0,spent()/db*100)):0;
 $('#month').textContent=`${cur.y}/${cur.m}`;$('#husband').value=data.income.husband;$('#wife').value=data.income.wife;$('#other').value=data.income.other;
 $('#heroAvail').textContent=fmt(Math.max(0,a));$('#heroSub').textContent=`收入 ${fmt(inc())}・固定支出 ${fmt(fixed())}・已花 ${fmt(spent())}`;$('#meterFill').style.width=pct+'%';
 $('#dailyPageAvail').textContent=fmt(Math.max(0,a));$('#dailyPageSpent').textContent=fmt(allSpent());$('#quickCashView').textContent=fmt(loans.cash);$('#quickCashOnHand').value=loans.cash;$('#dailyToday').textContent=new Date().toLocaleDateString('zh-TW',{month:'numeric',day:'numeric',weekday:'short'});$('#dailyListTitle').textContent=`${cur.y}/${cur.m} 收支紀錄`;$('#dailyBudget').textContent=fmt(db);$('#dailySpent').textContent=fmt(spent());$('#pocketSpent').textContent=fmt(pocketSpent());$('#dailyAvailable').textContent=fmt(Math.max(0,a));$('#dailyMeterFill').style.width=pct+'%';ledger();
 $('#sIncome').textContent=fmt(inc());$('#sRemain').textContent=fmt(Math.max(0,r));$('#sFixed').textContent=fmt(fixed());$('#sDone').textContent=data.finished?'✓ 已完成':'待確認';
 $('#incomeTotal').textContent=fmt(inc());$('#remainSummary').textContent=fmt(baseAvailable());$('#fixedTotal').textContent=fmt(fixed());$('#doneSummary').textContent=data.finished?'✓ 已完成':'待確認';$('#availIncome').textContent=fmt(inc());$('#availFixed').textContent=fmt(fixed());$('#suggestedSavings').textContent=fmt(suggestedSavings());$('#availSaved').textContent=fmt(sv);$('#availSpend').textContent=fmt(baseAvailable());
 
 $('#miniIncome').textContent=fmt(inc());$('#miniFixed').textContent=fmt(fixed());$('#miniRemain').textContent=fmt(Math.max(0,r));$('#fIncome').textContent=fmt(inc());$('#fFixed').textContent=fmt(fixed());$('#fSpend').textContent=fmt(db);$('#fSaved').textContent=fmt(sv);$('#savedAmount').value=sv;
 $('#dSpent').textContent=fmt(spent());$('#diagIncome').textContent=fmt(inc());$('#diagFixed').textContent=fmt(fixed());$('#diagSpent').textContent=fmt(allSpent());$('#diagAvail').textContent=fmt(Math.max(0,a));$('#diagMsg').innerHTML=a>=0?`扣除固定支出、已存入儲蓄與本月生活開銷後，目前還有 <b>${fmt(a)}</b> 可以使用。`:`本月生活開銷已超過設定額度 <b>${fmt(Math.abs(a))}</b>。`;renderDiagnosis();
 expenses();setStep(data.step||1);renderCards();renderLoans()}

['husband','wife','other'].forEach(id=>$('#'+id).onchange=()=>{data.income.husband=+$('#husband').value||0;data.income.wife=+$('#wife').value||0;data.income.other=+$('#other').value||0;data.finished=false;save()});
$$('#steps button').forEach(b=>b.onclick=()=>setStep(+b.dataset.step));$$('.nextStep').forEach(b=>b.onclick=()=>setStep(+b.dataset.next));
$('#savedAmount').onchange=()=>{data.savedAmount=Math.max(0,+$('#savedAmount').value||0);data.finished=false;save()};
let quickPayMethod='cash',quickCashSource='living';
function renderQuickPayChoice(){$$('#payMethodTabs button').forEach(x=>x.classList.toggle('active',x.dataset.method===quickPayMethod));$('#qCardWrap').classList.toggle('hidden',quickPayMethod!=='credit');$('#qCashSourceWrap').classList.toggle('hidden',quickPayMethod!=='cash')}
$$('#payMethodTabs button').forEach(b=>b.onclick=()=>{quickPayMethod=b.dataset.method;renderQuickPayChoice()});
$$('#cashSourceTabs button').forEach(b=>b.onclick=()=>{quickCashSource=b.dataset.source;$$('#cashSourceTabs button').forEach(x=>x.classList.toggle('active',x===b));$('#cashSourceHint').textContent=quickCashSource==='pocket'?`這筆會從手頭上現金 ${fmt(loans.cash)} 扣除，不重複扣當月生活費。`:'這筆會從「本月目前可用」扣除。'});
let quickEntryType='expense';
const expenseCategories=['餐飲','購物','交通','小孩','生活','醫療','其他'];
const incomeCategories=['薪資','補貼','退款','獎金','現金回饋','其他收入'];
function setQuickCategories(list){const sel=$('#qCategory');const keep=sel.value;sel.innerHTML=list.map(x=>`<option>${x}</option>`).join('');if(list.includes(keep))sel.value=keep}
function renderEntryType(){
  const income=quickEntryType==='income';
  $$('#entryTypeTabs button').forEach(x=>x.classList.toggle('active',x.dataset.entry===quickEntryType));
  $('#saveQ').textContent=income?'＋ 加入今日收入':'＋ 加入今日開銷';
  $('#payMethodTabs').style.display=income?'none':'';
  $('#qCardWrap').classList.add('hidden');
  $('#qCashSourceWrap').classList.remove('hidden');
  $('#qCashSourceWrap .fieldTitle').textContent=income?'收入放到哪裡？':'現金從哪裡扣？';
  setQuickCategories(income?incomeCategories:expenseCategories);
  $('#qNote').placeholder=income?'例如：退款、獎金':'例如：午餐';
  $('#cashSourceHint').textContent=income
    ?(quickCashSource==='pocket'?'這筆收入會增加「手頭上現金」。':'這筆收入會增加「本月目前可用」。')
    :(quickCashSource==='pocket'?'這筆會從「手頭上現金」扣除。':'這筆會從「本月目前可用」扣除。');
}
$$('#entryTypeTabs button').forEach(b=>b.addEventListener('click',()=>{quickEntryType=b.dataset.entry;renderEntryType()}));
$('#saveQ').addEventListener('click',()=>{
  const amount=Number($('#qAmount').value)||0;
  if(amount<=0){alert(quickEntryType==='income'?'請輸入收入金額':'請輸入開銷金額');$('#qAmount').focus();return}
  const category=$('#qCategory').value;
  const note=$('#qNote').value.trim();
  const now=new Date();
  const sameMonth=now.getFullYear()===cur.y&&now.getMonth()+1===cur.m;
  const displayDate=sameMonth?now.toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'}):`${cur.m}/1`;
  if(!Array.isArray(data.incomeLedger))data.incomeLedger=[];
  if(!Array.isArray(data.ledger))data.ledger=[];
  if(quickEntryType==='income'){
    const destination=quickCashSource==='pocket'?'pocket':'living';
    if(destination==='pocket'){
      loans.cash=(+loans.cash||0)+amount;
      localStorage.setItem(LOAN_KEY,JSON.stringify(loans));
    }
    data.incomeLedger.push({id:'inc-'+Date.now(),amount,category,note:note||category||'今日收入',destination,date:displayDate,created:Date.now()});
  }else if(quickPayMethod==='credit'){
    const card=$('#qCard').value,date=defaultCardDate(),tx={id:'cc-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),date,card,amount,category,note,synced:true,created:Date.now()};
    cardTxs.push(tx);localStorage.setItem(CARD_KEY,JSON.stringify(cardTxs));
    data.ledger.push({amount,category,method:CARDS[card].name,note:note||'信用卡消費',date:displayDate,source:'credit-card',sourceId:tx.id,budgetImpact:true,created:Date.now()});
  }else if(quickCashSource==='pocket'){
    if(amount>(+loans.cash||0)){alert(`手頭上現金目前只有 ${fmt(loans.cash)}，不足以支付這筆開銷。`);return}
    loans.cash=Math.max(0,(+loans.cash||0)-amount);localStorage.setItem(LOAN_KEY,JSON.stringify(loans));
    data.ledger.push({amount,category,method:'現金',fundingSource:'pocket',budgetImpact:false,note:note||'現金開銷',date:displayDate,created:Date.now()});
  }else{
    data.ledger.push({amount,category,method:'現金',fundingSource:'living',budgetImpact:true,note:note||'現金開銷',date:displayDate,created:Date.now()});
  }
  $('#qAmount').value='';$('#qNote').value='';data.finished=false;save();
});
renderEntryType();
$('#quickCashOnHand').onchange=()=>{loans.cash=Math.max(0,+$('#quickCashOnHand').value||0);saveLoans();render()};
$('#saveLoan').onclick=addLoanTx;
function move(n){cur.m+=n;if(cur.m<1){cur.m=12;cur.y--}if(cur.m>12){cur.m=1;cur.y++}data=loadMonth();render()};$('#prev').onclick=()=>move(-1);$('#next').onclick=()=>move(1);


// ----- 銀行貸款 / 大額還款試算 -----
const BANK_LOAN_KEY='family-five-bank-loans-v1';
const bankLoanDefaults=[
  {id:'loan1',name:'貸款(一)',principal:422574,start:'2025-10-01',end:'2032-10-01',payment:7496,extra:0},
  {id:'loan2',name:'貸款(二)',principal:298073,start:'2024-04-12',end:'2031-04-12',payment:6100,extra:0},
  {id:'loan3',name:'貸款(三)',principal:219138,start:'2022-07-14',end:'2029-07-14',payment:6844,extra:0}
];
function loadBankLoans(){try{let x=JSON.parse(localStorage.getItem(BANK_LOAN_KEY)||'null');if(Array.isArray(x)&&x.length)return bankLoanDefaults.map((d,i)=>{let saved=x.find(v=>v.id===d.id)||x[i]||{};return {...d,...saved,payment:d.payment}})}catch(e){}return bankLoanDefaults.map(x=>({...x}))}
let bankLoans=loadBankLoans();
function saveBankLoans(){localStorage.setItem(BANK_LOAN_KEY,JSON.stringify(bankLoans));renderBankLoans()}
function monthDiffTo(dateStr){let d=new Date(dateStr+'T00:00:00'),n=new Date();let m=(d.getFullYear()-n.getFullYear())*12+(d.getMonth()-n.getMonth());if(d.getDate()>n.getDate())m++;return Math.max(0,m)}
function elapsedPercent(start,end){let s=new Date(start+'T00:00:00').getTime(),e=new Date(end+'T00:00:00').getTime(),n=Date.now();if(e<=s)return 100;return Math.max(0,Math.min(100,((n-s)/(e-s))*100))}
function zhDate(s){let [y,m,d]=s.split('-');return `${y}/${m}/${d}`}
function loanBalanceAtRate(rate,n,payment){if(n<=0)return 0;if(Math.abs(rate)<1e-10)return payment*n;return payment*(1-Math.pow(1+rate,-n))/rate}
function impliedMonthlyRate(principal,payment,n){principal=+principal||0;payment=+payment||0;if(principal<=0||payment<=0||n<=0)return 0;if(payment*n<=principal)return 0;let lo=0,hi=.1;for(let i=0;i<100;i++){let mid=(lo+hi)/2,b=loanBalanceAtRate(mid,n,payment);if(b>principal)lo=mid;else hi=mid}return (lo+hi)/2}
function paymentFor(principal,rate,n){if(principal<=0||n<=0)return 0;if(rate<=0)return Math.round(principal/n);return Math.round(principal*rate/(1-Math.pow(1+rate,-n)))}
function renderBankLoans(){
  const wrap=$('#bankLoanCards');if(!wrap)return;
  const total=bankLoans.reduce((s,x)=>s+(+x.principal||0),0);
  const monthly=bankLoans.reduce((s,x)=>s+(+x.payment||0),0);
  $('#bankLoanTotal').textContent=fmt(total);$('#bankLoanMonthly').textContent=fmt(monthly);
  wrap.innerHTML=bankLoans.map((x,i)=>{
    const p=Math.max(0,+x.principal||0),extra=Math.max(0,Math.min(p,+x.extra||0)),after=Math.max(0,p-extra),months=monthDiffTo(x.end),pay=Math.max(0,+x.payment||0);
    const monthlyRate=impliedMonthlyRate(p,pay,months),annualRate=monthlyRate*12*100;
    const recast=paymentFor(after,monthlyRate,months);
    const elapsed=Math.round(elapsedPercent(x.start,x.end));
    const status=after===0?'這筆已可清償 🎉':months>0?`距離到期約 ${months} 個月`:'已到到期日';
    return `<section class="bankLoanCard" data-bankloan="${i}">
      <div class="bankLoanTop"><div><small>${x.name}</small><strong>${fmt(p)}</strong><span>剩餘本金</span></div><div class="bankLoanStatus"><b>${status}</b><small>${zhDate(x.start)} → ${zhDate(x.end)}</small></div></div>
      <div class="termTrack"><div style="width:${elapsed}%"></div></div><div class="termLabels"><span>貸款日</span><b>時間進度 ${elapsed}%</b><span>到期日</span></div>
      <div class="bankLoanEditGrid"><label>剩餘本金<input data-bl="principal" type="number" min="0" inputmode="numeric" value="${p}"></label><label>目前每期應繳<input data-bl="payment" type="number" min="0" inputmode="numeric" value="${pay}"></label></div>
      <div class="loanRateRow"><div><small>依目前資料反推年利率</small><b>${annualRate>0?annualRate.toFixed(2)+'%':'無法反推'}</b></div><span>依剩餘本金＋每期金額＋到期日估算</span></div>
      <div class="extraPayBox"><div class="extraPayTitle"><div><small>大額還款試算</small><b>這次想多還多少本金？</b></div><input data-bl="extra" type="number" min="0" max="${p}" inputmode="numeric" value="${extra}" placeholder="例如 50000"></div>
        <div class="extraResults"><div><small>還款後剩餘本金</small><b>${fmt(after)}</b></div><div><small>剩餘期數</small><b>${months} 期左右</b></div><div class="accent"><small>重新攤還每期約</small><b>${fmt(recast)}</b></div></div>
        <p>試算假設剩餘期數不變、利率與原貸款條件不變，銀行願意按新本金重新攤還。實際每期金額請以銀行核算為準。</p>
      </div>
    </section>`
  }).join('');
  $$('#bankLoanCards [data-bankloan]').forEach(card=>{let i=+card.dataset.bankloan;card.querySelectorAll('[data-bl]').forEach(inp=>inp.addEventListener('change',()=>{let k=inp.dataset.bl,v=Math.max(0,+inp.value||0);if(k==='extra')v=Math.min(v,+bankLoans[i].principal||0);bankLoans[i][k]=v;saveBankLoans()}))})
}

function showView(v){const target=document.getElementById(v);if(!target)return;$$('.view').forEach(x=>x.classList.remove('active'));$$('nav button[data-v]').forEach(x=>x.classList.remove('active'));target.classList.add('active');const btn=$$('nav button[data-v]').find(x=>x.dataset.v===v);if(btn)btn.classList.add('active');window.scrollTo({top:0,behavior:'instant'});if(v==='cards')renderCards();if(v==='quick'){ledger();$('#quickCashView').textContent=fmt(loans.cash);$('#quickCashOnHand').value=loans.cash}if(v==='loans')renderLoans();if(v==='bankloans')renderBankLoans()}
$$('nav button[data-v]').forEach(b=>{b.type='button';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showView(b.dataset.v)})});
renderBankLoans();
if('serviceWorker' in navigator){window.addEventListener('load',async()=>{try{const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs){if(!String(r.active?.scriptURL||'').includes('service-worker.js?v=25.0.0'))await r.unregister()}}catch(e){}try{await navigator.serviceWorker.register('./service-worker.js?v=25.0.0',{updateViaCache:'none'})}catch(e){}})}
render();
