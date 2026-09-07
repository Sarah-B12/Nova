/* ===========================================================
   SYSTEME — Systèmes de fond : énergie (régénération), journal d'événements, expérience et niveaux.
   =========================================================== */

/* ---------- Énergie ---------- */
// Coût en % par action (se déplacer en vaisseau coûtera peu ; miner beaucoup).
const ACTION_COUT = { miner:12, explorer:10, combattre:8, reposer:0 };
// Régénération : +10 %/heure. Recalculée en continu, y compris hors ligne.
function regenEnergie(){
  const now = Date.now();
  const heures = (now - etat.energieMaj) / 3600000;
  if (heures > 0) { etat.energie = Math.min(100, etat.energie + heures * (10 + aptRegenEnergie())); etat.energieMaj = now; }
}
// Dépense l'énergie d'une action ; refuse (et prévient) si insuffisant.
function depenserEnergie(cout){
  if(typeof enPrison==="function" && enPrison()){ journal("Tu es en prison — impossible d'agir jusqu'à ta libération.","alerte"); return false; }
  regenEnergie();
  if (etat.energie < cout) { journal("Pas assez d'énergie. Attends (+10 %/h) ou monte de niveau.", "alerte"); return false; }
  etat.energie -= cout; return true;
}
/* ---------- Journal (persistant, catégorisé, rétention 2 j) ---------- */
const JOURNAL_CATS = [
  {id:"tout",nom:"Tout"}, {id:"systeme",nom:"Système"}, {id:"quete",nom:"Quêtes"},
  {id:"minage",nom:"Minage"}, {id:"agri",nom:"Agri./élevage"}, {id:"combat",nom:"Combats"},
  {id:"vol",nom:"Vols/hacks"}, {id:"eco",nom:"Économie"}, {id:"social",nom:"Social"}
];
const JOURNAL_MAX = 300;
const JOURNAL_RETENTION = 2*86400000;         // 2 jours réels (indépendant de JOUR_MS)
// Purge = 100 % côté client : le journal vit dans etat.journal, donc dans profils.donnees.
// Un cron serveur serait inutile (la prochaine sauvegarde du client réécrit tout le JSON).
let _journalFiltre = "tout";
let _journalStyleMonte = false;
function _categoriser(t){
  const s=(t||"").toLowerCase();
  if(/quête|quete|vieux sorn|glyphe|relais|étape|défi/.test(s)) return "quete";
  if(/vol[ée]|volé|hack|pirat|dérob|prison|démasqu|sonde|siphonn|intrusion|discrétion|cambafre/.test(s)) return "vol";
  if(/combat|patrouille|protocole|vaincu|défaite|assaut|attaqu|blessé|riposte|évacuation/.test(s)) return "combat";
  if(/min[ée]|minage|minerai|filon|extra|foreuse|for[ée]|gisement|foraouse/.test(s)) return "minage";
  if(/récolt|plant[ée]|sem[ée]|bio-dôme|biodome|serre|animal|élevage|elevage|nourri|enclos|troupeau|traite|tonte|fourrage/.test(s)) return "agri";
  if(/vendu|achet[ée]|achat|brad[ée]|march[ée]|commission|crédit|₡|revend|boutique|permis/.test(s)) return "eco";
  if(/\bami\b|amis|message|annonce|\bmur\b|demande d'ami|bloqu[ée]|débloqu/.test(s)) return "social";
  return "systeme";
}
function journal(t, type="", cat=null){
  if(!etat.journal) etat.journal=[];
  etat.journal.unshift({ t, type, cat: cat || _categoriser(t), d: Date.now() });
  _purgerJournal();
  majJournal();
}
function _purgerJournal(){
  if(!etat.journal) return;
  const min=Date.now()-JOURNAL_RETENTION;
  etat.journal = etat.journal.filter(e=>e && e.d>=min);
  if(etat.journal.length>JOURNAL_MAX) etat.journal.length=JOURNAL_MAX;
}
function _catNom(id){ const c=JOURNAL_CATS.find(x=>x.id===id); return c?c.nom:id; }
function _echapJ(t){ return (t||"").replace(/</g,"&lt;"); }
function _journalStyle(){
  if(_journalStyleMonte) return; _journalStyleMonte=true;
  const st=document.createElement("style");
  st.textContent=`
    .journal-filtres{ display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px; }
    .jf-b{ font-size:11px; padding:2px 8px; border-radius:8px 3px 8px 3px; background:rgba(16,40,37,.7); color:var(--sourdine); border:1px solid var(--line); cursor:pointer; }
    .jf-b.actif{ color:var(--orange-hi,#ffb060); border-color:var(--orange,#ff8a3d); }
    #journal{ max-height:340px; overflow:auto; }
    .j-cat{ display:inline-block; font-size:9px; font-weight:700; padding:1px 5px; border-radius:5px; margin-right:6px; vertical-align:middle; text-transform:uppercase; letter-spacing:.4px; }
    .j-systeme{ background:#3a4a5a; color:#cdd8e6; } .j-quete{ background:#6b53d6; color:#fff; }
    .j-minage{ background:#8a6a3a; color:#ffe1b0; } .j-agri{ background:#3f7a42; color:#dfffcf; }
    .j-combat{ background:#9c3d3d; color:#ffd6d6; } .j-vol{ background:#7a3a7a; color:#ffd6ff; }
    .j-eco{ background:#2f6f6f; color:#d6ffff; } .j-social{ background:#3a5aa0; color:#d6e4ff; }
    .msg.poste{ font-weight:700; color:var(--orange-hi,#ffb060); text-shadow:0 0 8px rgba(255,138,61,.55); }
  `;
  document.head.appendChild(st);
}
function majJournal(){
  const z=document.querySelector("#journal"); if(!z) return;
  _journalStyle();
  if(!etat.journal) etat.journal=[];
  _purgerJournal();
  const sig=_journalFiltre+"|"+etat.journal.length+"|"+(etat.journal[0]?etat.journal[0].d:0);
  if(z.dataset.jsig===sig) return;
  z.dataset.jsig=sig;
  const bar=document.querySelector("#journal-filtres");
  if(bar){
    bar.innerHTML=JOURNAL_CATS.map(c=>`<button class="jf-b${_journalFiltre===c.id?" actif":""}" data-jf="${c.id}">${c.nom}</button>`).join("");
    bar.querySelectorAll("[data-jf]").forEach(b=>b.addEventListener("click",()=>{ _journalFiltre=b.dataset.jf; z.dataset.jsig=""; majJournal(); }));
  }
  const list=etat.journal.filter(e=>_journalFiltre==="tout"||e.cat===_journalFiltre).slice(0,80);
  z.innerHTML = list.length
    ? list.map(e=>`<div class="msg ${e.type||""}"><span class="j-cat j-${e.cat||"systeme"}">${_catNom(e.cat)}</span>${_echapJ(e.t)}</div>`).join("")
    : `<p class="vide" style="margin:6px 0">Aucune entrée${_journalFiltre!=="tout"?" dans cette catégorie":""}.</p>`;
}

/* ---------- Niveaux ---------- */
function seuilXp(n){ return 20*n; }
function gagnerXp(n){
  etat.xp += n;
  while (etat.xp >= seuilXp(etat.niveau)) { etat.xp -= seuilXp(etat.niveau); etat.niveau++; etat.pointsCompetence += PTS_PAR_NIVEAU; etat.energie = 100; etat.energieMaj = Date.now(); journal(`Niveau ${etat.niveau} atteint ! +${PTS_PAR_NIVEAU} points, énergie pleine.`,"gain"); }
}

