const TARGET=25000, STORE="fab-matrix-2027-v1";
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
let data=JSON.parse(localStorage.getItem(STORE)||'{"entries":{},"prep":{}}');
function save(){localStorage.setItem(STORE,JSON.stringify(data));}
function weekKey(d=today()){const x=new Date(d+"T12:00:00");const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x.toISOString().slice(0,10)}
function fmt(n){return Number(n||0).toLocaleString("fr-FR")}
function entries(){return Object.entries(data.entries).sort((a,b)=>b[0].localeCompare(a[0]))}
function render(){
 const all=entries(),total=all.reduce((s,[,v])=>s+Number(v.count||0),0),wk=weekKey();
 const weekly=all.filter(([d])=>weekKey(d)===wk).reduce((s,[,v])=>s+Number(v.count||0),0);
 const record=all.reduce((m,[,v])=>Math.max(m,Number(v.count||0)),0);
 $("totalSheep").textContent=fmt(total);$("weekTotal").textContent=fmt(weekly);$("record").textContent=fmt(record);$("daysCount").textContent=fmt(all.length);
 const pct=Math.min(100,total/TARGET*100);$("progressFill").style.width=pct+"%";$("progressPercent").textContent=pct.toFixed(1).replace(".",",")+" %";$("remaining").textContent=fmt(Math.max(0,TARGET-total))+" restants";
 const x=8+(pct/100)*600;const y=160-(pct/100)*105;$("sheepMarker").setAttribute("transform",`translate(${x} ${y-20})`);
 $("history").innerHTML=all.length?all.slice(0,7).map(([d,v])=>`<div class="history-item"><div><b>${new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"})}</b><small>${esc(v.physical)} • ${esc(v.quality)}${v.note?" • "+esc(v.note):""}</small></div><div><strong>${fmt(v.count)}</strong><small>moutons</small></div><button aria-label="Supprimer la journée" data-delete="${d}">×</button></div>`).join(""):'<p class="empty">Aucune journée enregistrée pour le moment.</p>';
}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("entryDate").value=today();
$("dailyForm").addEventListener("submit",e=>{e.preventDefault();const d=$("entryDate").value,count=Number($("sheepCount").value);if(!d||!Number.isFinite(count)||count<0)return;data.entries[d]={count,physical:$("physical").value,quality:$("quality").value,note:$("note").value.trim()};save();render();$("formMessage").textContent="Journée enregistrée sur ce téléphone ✓";$("sheepCount").value="";$("note").value="";});
$("history").addEventListener("click",e=>{const d=e.target.dataset.delete;if(d&&confirm("Supprimer la journée du "+d+" ?")){delete data.entries[d];save();render()}});
$("exportBtn").addEventListener("click",()=>{const rows=[["Date","Moutons","Etat physique","Qualité","Note"],...entries().map(([d,v])=>[d,v.count,v.physical,v.quality,v.note||""])];const csv=rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(";")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="fab-matrix-2027.csv";a.click();URL.revokeObjectURL(a.href)});
function prepKey(){return weekKey()+":"+today()}
function getPrep(){const k=prepKey();if(!data.prep[k])data.prep[k]={exercises:[false,false,false],food:[false,false,false,false]};return data.prep[k]}
function renderPrep(){const p=getPrep();document.querySelectorAll("[data-exercise]").forEach(el=>el.checked=!!p.exercises[Number(el.dataset.exercise)]);document.querySelectorAll("[data-food]").forEach(el=>el.checked=!!p.food[Number(el.dataset.food)]);const n=p.exercises.filter(Boolean).length,f=p.food.filter(Boolean).length;$("exerciseCount").textContent=n+" / 3";$("exerciseFill").style.width=(n/3*100)+"%";$("foodCount").textContent=f+" / 4";save()}
document.querySelectorAll("[data-exercise],[data-food]").forEach(el=>el.addEventListener("change",()=>{const p=getPrep();if(el.dataset.exercise!==undefined)p.exercises[Number(el.dataset.exercise)]=el.checked;else p.food[Number(el.dataset.food)]=el.checked;save();renderPrep()}));
$("resetWeek").addEventListener("click",()=>{if(confirm("Remettre à zéro le suivi hors saison pour démarrer une nouvelle semaine ?")){data.prep[prepKey()]={exercises:[false,false,false],food:[false,false,false,false]};save();renderPrep();$("prepMessage").textContent="Nouvelle semaine prête ✓"}});
function switchView(view){
  $("seasonView").classList.toggle("hidden",view!=="season");
  $("prepView").classList.toggle("hidden",view!=="prep");
  document.querySelectorAll(".menu-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("menuPanel").classList.add("hidden");
  $("menuButton").setAttribute("aria-expanded","false");
}
$("menuButton").addEventListener("click",()=>{const open=$("menuPanel").classList.toggle("hidden")===false;$("menuButton").setAttribute("aria-expanded",String(open));});
document.querySelectorAll(".menu-item[data-view]").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.view)));
$("menuExport").addEventListener("click",()=>{$("menuPanel").classList.add("hidden");$("exportBtn").click();});
document.addEventListener("click",e=>{if(!e.target.closest(".menu-wrap")){$("menuPanel").classList.add("hidden");$("menuButton").setAttribute("aria-expanded","false");}});
window.addEventListener("online",()=>$("offlineBadge").textContent="● CONNECTÉ");window.addEventListener("offline",()=>$("offlineBadge").textContent="● HORS LIGNE");
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();renderPrep();