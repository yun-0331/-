const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>'$'+Math.round(Number(n)||0).toLocaleString('zh-TW');
let cur={y:2026,m:9};
const defaults=[['先生生活費',12000,'必要'],['孝親費',12000,'必要'],['保險',16500,'必要'],['信貸(1)',7000,'債務'],['信貸(2)',6000,'債務'],['信貸(3)',7500,'債務'],['分期／卡費',9390,'債務'],['補習與英文',17100,'小孩'],['ETC 與加油',9000,'交通'],['電話',4000,'必要'],['長照',1500,'必要'],['捐款與 ETF',1600,'可調整']];
const CATS=['必要','可調整','債務','小孩','交通','其他'];
const CAT_ICON={必要:'M12 3l7 4v5c0 4.8-3 8-7 9-9-2-7-9-7-9V7l7-4z',可調整:'M4 7h16M7 7v13h10V7M9 4h6l1 3H8l1-3z',債務:'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 4h6M8 12h8M8 16h5',小孩:'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-6 8a6 6 0 0 1 12 0',交通:'M5 17h14l-1-7a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2l-1 7zm2 0v2m10-2v2M7 13h10',其他:'M12 5v14M5 12h14'};
const catIcon=c=>`<svg class="catIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="${CAT_ICON[c]||CAT_ICON.其他}"/></svg>`;
const key=()=>`liyunjia-${cur.y}-${String(cur.m).padStart(2,'0')}`;
const fresh=()=>({income:{husband:67000,wife:35000,other:8000},expenses:defaults.map(([name,amount,category])=>({name,amount,category})),ledger:[],finished:false,bufferTarget:null,step:3});
function load(){let x;try{x=JSON.parse(localStorage.getItem(key())||'null')}catch(e){};x=x||fresh();if(x.bufferTarget===undefined)x.bufferTarget=null;if(!x.step)x.step=3;if(!Array.isArray(x.expenses))x.expenses=[];x.expenses=x.expenses.map((e,i)=>({...e,category:e.category||defaults[i]?.[2]||'其他'}));return x}
let data=load();
const inc=()=>+data.income.husband + +data.income.wife + +data.income.other;
const fixed=()=>data.expenses.reduce((s,x)=>s+(+x.amount||0),0);
const spent=()=>data.ledger.reduce((s,x)=>s+(+x.amount||0),0);
const remain=()=>inc()-fixed();
const suggestedBuffer=()=>Math.max(0,Math.round(remain()*0.20));
const buffer=()=>Math.max(0,data.bufferTarget===null?suggestedBuffer():(+data.bufferTarget||0));
const dailyBudget=()=>Math.max(0,remain()-buffer());
const avail=()=>dailyBudget()-spent();
function save(){localStorage.setItem(key(),JSON.stringify(data));render()}
function setStep(n){data.step=n;localStorage.setItem(key(),JSON.stringify(data));$$('.stepPanel').forEach(p=>p.classList.toggle('active',+p.dataset.panel===n));$$('#steps button').forEach(b=>b.classList.toggle('now',+b.dataset.step===n));window.scrollTo({top:0,behavior:'smooth'})}
function expenses(){let g=$('#expenses');g.innerHTML='';data.expenses.forEach((x,i)=>{let d=document.createElement('div');d.className='expense';let opts=CATS.map(c=>`<option ${x.category===c?'selected':''}>${c}</option>`).join('');d.innerHTML=`<div class="expenseMain"><span class="expenseName ${'cat-'+(x.category||'其他')}">${catIcon(x.category)}<b>${x.name}</b></span><select class="catSelect" aria-label="${x.name}分類">${opts}</select></div><input type="number" inputmode="numeric" value="${x.amount}"><button class="deleteExpense" aria-label="刪除">×</button>`;d.querySelector('input').onchange=e=>{data.expenses[i].amount=+e.target.value||0;save()};d.querySelector('select').onchange=e=>{data.expenses[i].category=e.target.value;save()};d.querySelector('button').onclick=()=>{if(confirm(`刪除「${x.name}」？`)){data.expenses.splice(i,1);save()}};g.appendChild(d)});renderCategorySummary()}
function renderCategorySummary(){let g=$('#categorySummary');if(!g)return;let totals=Object.fromEntries(CATS.map(c=>[c,0]));data.expenses.forEach(e=>totals[e.category||'其他']=(totals[e.category||'其他']||0)+(+e.amount||0));g.innerHTML=CATS.map(c=>`<div class="catSummary cat-${c}">${catIcon(c)}<div><small>${c}</small><b>${fmt(totals[c])}</b></div></div>`).join('')}
function ledger(){let l=$('#ledger');l.innerHTML=data.ledger.length?'':'<p class="hint">本月還沒有快速記帳。</p>';[...data.ledger].reverse().forEach((x,ri)=>{let i=data.ledger.length-1-ri,d=document.createElement('div');d.className='ledger';d.innerHTML=`<div><b>${x.note||x.category}</b><small>${x.category}・${x.method}・${x.date}</small></div><div><b>${fmt(x.amount)}</b> <button>刪除</button></div>`;d.querySelector('button').onclick=()=>{data.ledger.splice(i,1);save()};l.appendChild(d)})}
function dailyDetails(){
  const el=$('#dailyDetails'); if(!el)return;
  const items=[...data.ledger].reverse();
  if(!items.length){el.innerHTML='<div class="dailyEmpty">本月還沒有開銷，按下面「記一筆今日開銷」開始吧。</div>';return}
  el.innerHTML=items.map(x=>{
    const date=(x.date||'').replaceAll('/','/');
    return `<div class="dailyRow"><div class="dailyDate">${date||'今天'}</div><div class="dailyInfo"><b>${x.note||x.category}</b><small>${x.category}・${x.method}</small></div><div class="dailyAmount">-${fmt(x.amount)}</div></div>`;
  }).join('');
}
function render(){
  let r=remain(), rate=inc()>0?fixed()/inc()*100:0, a=avail(), db=dailyBudget(), b=buffer();
  $('#month').textContent=`${cur.y}/${cur.m}`;
  $('#husband').value=data.income.husband;$('#wife').value=data.income.wife;$('#other').value=data.income.other;
  $('#sIncome').textContent=fmt(inc());$('#sRemain').textContent=fmt(Math.max(0,r));$('#sFixed').textContent=fmt(fixed());$('#sDone').textContent=data.finished?'已完成':'待確認';
  $('#incomeTotal').textContent=fmt(inc());$('#remainSummary').textContent=fmt(Math.max(0,r));$('#fixedTotal').textContent=fmt(fixed());$('#doneSummary').textContent=data.finished?'✓ 已完成':'待確認';
  $('#fixedRate').textContent=Math.round(rate)+'%';$('#fixedHint').textContent=rate<=80?'仍有保留彈性':'固定支出占比較高';$('#postFixed').textContent=fmt(Math.max(0,r));$('#bufferSuggest').textContent=fmt(suggestedBuffer());$('#spendSuggest').textContent=fmt(Math.max(0,r-suggestedBuffer()));
  $('#adviceMsg').innerHTML=r<0?`目前固定支出比收入多 <b>${fmt(Math.abs(r))}</b>，建議先檢查是否有重複或可調整項目。`:rate>90?`固定支出約占收入 <b>${Math.round(rate)}%</b>，本月可運用空間較小；建議先保留必要支出，再決定日常額度。`:`固定支出後剩下 <b>${fmt(r)}</b>。系統先用其中 20% 當緩衝金，你也可以在第 4 步自行修改。`;
  $('#miniIncome').textContent=fmt(inc());$('#miniFixed').textContent=fmt(fixed());$('#miniRemain').textContent=fmt(Math.max(0,r));
  $('#fIncome').textContent=fmt(inc());$('#fFixed').textContent=fmt(fixed());$('#fSpend').textContent=fmt(db);$('#fBuffer').textContent=fmt(b);$('#bufferTarget').value=b;
  $('#heroAvail').textContent=fmt(Math.max(0,a));$('#heroSub').textContent=`日常額度 ${fmt(db)}・已記帳 ${fmt(spent())}`;let pct=db>0?Math.min(100,Math.max(0,spent()/db*100)):0;$('#meterFill').style.width=pct+'%';
  $('#dailyBudget').textContent=fmt(db);$('#dailySpent').textContent=fmt(spent());$('#dailyAvailable').textContent=fmt(Math.max(0,a));$('#dailyRemain').textContent=fmt(Math.max(0,a));$('#dailyMeterFill').style.width=pct+'%';
  $('#spent').textContent=fmt(spent());$('#dIncome').textContent=fmt(inc());$('#dFixed').textContent=fmt(fixed());$('#dSpent').textContent=fmt(spent());$('#dAvail').textContent=fmt(Math.max(0,a));
  $('#diagMsg').innerHTML=a>=0?`目前仍在日常預算內，扣除固定支出、緩衝金與已記帳後，尚可使用 <b>${fmt(a)}</b>。`:`本月日常支出已超過設定額度 <b>${fmt(Math.abs(a))}</b>。`;
  expenses();ledger();dailyDetails();setStep(data.step||3)
}
['husband','wife','other'].forEach(id=>$('#'+id).onchange=()=>{data.income.husband=+$('#husband').value||0;data.income.wife=+$('#wife').value||0;data.income.other=+$('#other').value||0;data.finished=false;save()});
$$('#steps button').forEach(b=>b.onclick=()=>setStep(+b.dataset.step));$$('.nextStep').forEach(b=>b.onclick=()=>setStep(+b.dataset.next));
$('#bufferTarget').onchange=()=>{data.bufferTarget=Math.max(0,+$('#bufferTarget').value||0);data.finished=false;save()};
$('#saveQ').onclick=()=>{let amount=+$('#qAmount').value||0;if(amount<=0)return alert('請輸入金額');data.ledger.push({amount,category:$('#qCategory').value,method:$('#qMethod').value,note:$('#qNote').value.trim(),date:new Date().toLocaleDateString('zh-TW')});$('#qAmount').value='';$('#qNote').value='';save();alert('已記帳')};
$('#finish').onclick=()=>{data.finished=true;data.step=4;save();alert('本月預算已完成 ✓')};
$('#addExpense').onclick=()=>$('#dlg').showModal();
$('#eSave').onclick=e=>{let name=$('#eName').value.trim(),amount=+$('#eAmount').value||0;if(!name||amount<=0){e.preventDefault();return alert('請輸入名稱與金額')}data.expenses.push({name,amount,category:$('#eCategory').value});data.finished=false;$('#eName').value='';$('#eAmount').value='';save()};
function move(n){cur.m+=n;if(cur.m<1){cur.m=12;cur.y--}if(cur.m>12){cur.m=1;cur.y++}data=load();render()}
$('#prev').onclick=()=>move(-1);$('#next').onclick=()=>move(1);
$$('[data-open-quick]').forEach(b=>b.onclick=()=>{ $$('.view').forEach(v=>v.classList.remove('active'));$$('nav button').forEach(x=>x.classList.remove('active'));$('#quick').classList.add('active');$$('nav button').find(x=>x.dataset.v==='quick')?.classList.add('active');$('#qAmount').focus();});
$$('nav button').forEach(b=>b.onclick=()=>{$$('.view').forEach(v=>v.classList.remove('active'));$$('nav button').forEach(x=>x.classList.remove('active'));$('#'+b.dataset.v).classList.add('active');b.classList.add('active')});
$('#export').onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`莉芸家預算_${cur.y}-${String(cur.m).padStart(2,'0')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$('#importFile').onchange=async e=>{let f=e.target.files?.[0];if(!f)return;try{let x=JSON.parse(await f.text());if(!x.income||!Array.isArray(x.expenses))throw 0;data=x;if(data.bufferTarget===undefined)data.bufferTarget=null;if(!data.step)data.step=3;save();alert('備份已匯入')}catch(err){alert('這個檔案不是有效的莉芸家預算備份')}e.target.value=''};
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));
render();
