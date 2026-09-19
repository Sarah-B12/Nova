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
  {id:"vol",nom:"Vols/hacks"}, {id:"eco",nom:"Économie"}, {id:"social",nom:"Social"},
  {id:"poste",nom:"La Poste"},         // v0.69 : séparé du social — colis, envois, retours, refus
  /* v0.91 — déplacements : marche sur Silène, vols dans Nielle, décollages,
     rentrées, remorquages. Ils noyaient « Système », qui doit rester le journal
     des choses qu'on n'a pas demandées. */
  {id:"voyage",nom:"Voyage"}
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
  // La Poste avant « social » : « message » et « envoi » se ressemblent trop.
  if(/poste|colis|envoi|envoy[ée]|exp[ée]diteur|destinataire|paquet|courrier|contre-remboursement/.test(s)) return "poste";
  if(/\bami\b|amis|message|annonce|\bmur\b|demande d'ami|bloqu[ée]|débloqu/.test(s)) return "social";
  return "systeme";
}
/* v0.75 — le journal reste en texte : les emojis (🏪 📮 ⚔️…) juraient avec le
   reste de l'interface. Ce filet attrape aussi ceux qui viennent du SERVEUR
   (événements hors ligne) sans qu'il faille repasser du SQL. */
const _RE_EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu;
function sansEmoji(t){ return String(t).replace(_RE_EMOJI, "").replace(/\s{2,}/g, " ").trim(); }
/* ⚠ v0.94b — `quand` (optionnel) : l'heure RÉELLE du fait, pour les évènements
   serveur. Sans lui, le client horodatait à la LECTURE : tout ce qui s'était
   accumulé depuis la dernière synchro portait la même seconde, et se rangeait
   au-dessus d'actions pourtant postérieures. Un testeur a ainsi lu une évasion
   AVANT l'emprisonnement qui l'avait causée. */
function journal(t, type="", cat=null, quand=null){
  if(!etat.journal) etat.journal=[];
  const d = (typeof quand==="number" && isFinite(quand)) ? quand : Date.now();
  t = sansEmoji(t);
  /* ⚠ Entrées identiques qui se suivent : on incrémente un compteur au lieu
     d'empiler. Acheter dix graines produisait dix lignes rigoureusement
     semblables, qui noyaient le reste du journal. */
  const der = etat.journal[0];
  if(der && der.t === t && der.type === type){
    der.n = (der.n || 1) + 1; der.d = Math.max(der.d||0, d);
    majJournal(); _bulle(t, type); return;
  }
  /* Le journal est trié du plus récent au plus ancien. Une entrée datée du
     passé ne peut donc PAS être simplement empilée en tête : on la glisse à sa
     place. ⚠ Sans ça, corriger l'heure aurait affiché la bonne date au mauvais
     endroit — plus trompeur encore que le bug d'origine. */
  const e = { t, type, cat: cat || _categoriser(t), d };
  let i = 0; while(i < etat.journal.length && (etat.journal[i].d||0) > d) i++;
  etat.journal.splice(i, 0, e);
  _purgerJournal();
  majJournal();
  _bulle(t, type);          // retour immédiat : le journal seul passe inaperçu
}

/* ===========================================================
   BULLES — retour visuel passager sur chaque entrée de journal.
   Beaucoup d'actions (miner, se déplacer, manquer d'énergie) n'avaient AUCUN
   retour à l'écran : le joueur cliquait sans rien voir et ne découvrait
   l'effet qu'en ouvrant son sac ou en lisant le journal. Comme les 418 appels
   à journal() couvrent déjà tous les cas, on s'y accroche une seule fois
   plutôt que d'instrumenter chaque action.
   ⚠ Trois garde-fous : 3 bulles visibles au maximum (cliquer cinquante fois
   sur la carte ne doit pas empiler cinquante bulles), les répétitions
   immédiates incrémentent un compteur « ×N » au lieu de s'ajouter, et
   l'animation se désactive si le système demande moins de mouvement.
   =========================================================== */
const BULLE_MS = 3600, BULLE_MAX = 3;
let _bulleDer = "", _bulleDerEl = null, _bulleDerN = 1;

function _bulleStyle(){
  if(document.querySelector("#bulles-style")) return;
  const st=document.createElement("style"); st.id="bulles-style";
  st.textContent = `
    #bulles{ position:fixed; right:14px; bottom:14px; z-index:9000;
      display:flex; flex-direction:column; gap:7px; align-items:flex-end;
      pointer-events:none; max-width:min(360px, calc(100vw - 28px)); }
    .bulle{ background:rgba(14,22,42,.96); border:1px solid var(--line,#24344d);
      border-left:3px solid var(--sourdine,#8b95a8); border-radius:10px 4px 10px 4px;
      color:var(--texte,#dfe8f2); font-size:13px; line-height:1.4; padding:9px 12px;
      box-shadow:0 6px 22px rgba(0,0,0,.5); animation:bulle-in .18s ease-out;
      pointer-events:auto; cursor:pointer; }
    .bulle:hover{ border-color:var(--orange,#ff8a3d); }
    .bulle::after{ content:"×"; float:right; margin-left:10px; color:var(--sourdine,#8b95a8); font-weight:700; }
    .bulle.gain{ border-left-color:#8bd450; }
    .bulle.alerte{ border-left-color:#ff8a3d; }
    .bulle.poste{ border-left-color:#6cc8ff; }
    .bulle .bn{ font-family:"Space Mono",monospace; font-size:11px; color:var(--sourdine,#8b95a8); margin-left:6px; }
    .bulle.part{ animation:bulle-out .45s ease-in forwards; }
    @keyframes bulle-in{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:none; } }
    @keyframes bulle-out{ to{ opacity:0; transform:translateY(-6px); } }
    @media (max-width:560px){ #bulles{ left:14px; align-items:stretch; } }
    @media (prefers-reduced-motion: reduce){
      .bulle{ animation:none; } .bulle.part{ animation:none; opacity:0; }
    }
  `;
  document.head.appendChild(st);
}

function _bulle(t, type){
  if(!t) return;
  if(typeof document === "undefined" || !document.body) return;
  _bulleStyle();
  let z = document.querySelector("#bulles");
  if(!z){ z = document.createElement("div"); z.id = "bulles"; document.body.appendChild(z); }

  // Répétition immédiate : on incrémente au lieu d'empiler.
  if(t === _bulleDer && _bulleDerEl && z.contains(_bulleDerEl)){
    _bulleDerN++;
    let n = _bulleDerEl.querySelector(".bn");
    if(!n){ n = document.createElement("span"); n.className = "bn"; _bulleDerEl.appendChild(n); }
    n.textContent = "×" + _bulleDerN;
    clearTimeout(_bulleDerEl._t);
    _bulleDerEl._t = setTimeout(()=>_bulleFermer(_bulleDerEl), BULLE_MS);
    return;
  }

  const b = document.createElement("div");
  b.className = "bulle " + (type || "");
  b.textContent = t;
  b.title = "Cliquer pour fermer";
  // v0.66 : un clic la fait disparaître (elle masquait parfois un bouton).
  b.addEventListener("click", ()=>_bulleFermer(b, true));
  z.appendChild(b);
  _bulleDer = t; _bulleDerEl = b; _bulleDerN = 1;

  while(z.children.length > BULLE_MAX) _bulleFermer(z.firstElementChild, true);
  b._t = setTimeout(()=>_bulleFermer(b), BULLE_MS);
}

/* v0.66 — les bulles suivaient le joueur d'un écran à l'autre et se
   superposaient aux boutons. On vide la pile à chaque changement de vue. */
function fermerToutesBulles(){
  const z=document.querySelector("#bulles"); if(!z) return;
  [...z.children].forEach(b=>_bulleFermer(b, true));
}
function _bulleFermer(b, tout_de_suite){
  if(!b || !b.parentNode) return;
  clearTimeout(b._t);
  if(b === _bulleDerEl){ _bulleDerEl = null; _bulleDer = ""; }
  if(tout_de_suite){ b.remove(); return; }
  b.classList.add("part");
  setTimeout(()=>{ if(b.parentNode) b.remove(); }, 450);
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
    .j-n{ font-family:"Space Mono",monospace; font-size:10px; font-weight:700; color:var(--orange-hi,#ffb060); }
    /* v0.94b : l'heure de chaque entrée. Discrète, largeur fixe pour que les
       lignes restent alignées, et invisible à la copie ? non : elle part avec
       le texte, c'est justement ce qu'on veut pour les rapports de bug. */
    .j-h{ font-family:"Space Mono",monospace; font-size:9px; color:var(--sourdine); margin-right:6px; opacity:.75; }
    .j-cat{ display:inline-block; font-size:9px; font-weight:700; padding:1px 5px; border-radius:5px; margin-right:6px; vertical-align:middle; text-transform:uppercase; letter-spacing:.4px; }
    .j-systeme{ background:#3a4a5a; color:#cdd8e6; } .j-quete{ background:#6b53d6; color:#fff; }
    .j-minage{ background:#8a6a3a; color:#ffe1b0; } .j-agri{ background:#3f7a42; color:#dfffcf; }
    .j-combat{ background:#9c3d3d; color:#ffd6d6; } .j-vol{ background:#7a3a7a; color:#ffd6ff; }
    .j-eco{ background:#2f6f6f; color:#d6ffff; } .j-social{ background:#3a5aa0; color:#d6e4ff; }
    .j-voyage{ background:#2f5a7a; color:#cfe8ff; }
    .msg.poste{ font-weight:700; color:var(--orange-hi,#ffb060); text-shadow:0 0 8px rgba(255,138,61,.55); }
  `;
  document.head.appendChild(st);
}
/* v0.94b — L'HEURE DE CHAQUE ENTRÉE. Elle existait dans les données (`e.d`)
   mais n'était affichée nulle part : impossible de situer un évènement, et
   impossible pour un testeur de rapporter un enchaînement.
   Aujourd'hui → « 00:54 ». Un autre jour → « 19/09 00:54 », parce que le
   journal garde plusieurs jours et qu'une heure seule y serait trompeuse. */
function _heureJ(d){
  if(!d) return "";
  const t = new Date(d), n = new Date();
  const hh = String(t.getHours()).padStart(2,"0") + ":" + String(t.getMinutes()).padStart(2,"0");
  const memeJour = t.getDate()===n.getDate() && t.getMonth()===n.getMonth() && t.getFullYear()===n.getFullYear();
  return memeJour ? hh : `${String(t.getDate()).padStart(2,"0")}/${String(t.getMonth()+1).padStart(2,"0")} ${hh}`;
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
    ? list.map(e=>`<div class="msg ${e.type||""}"><span class="j-h">${_heureJ(e.d)}</span><span class="j-cat j-${e.cat||"systeme"}">${_catNom(e.cat)}</span>${e.n>1?`<span class="j-n">${e.n}×</span> `:""}${_echapJ(e.t)}</div>`).join("")
    : `<p class="vide" style="margin:6px 0">Aucune entrée${_journalFiltre!=="tout"?" dans cette catégorie":""}.</p>`;
}

/* ---------- Niveaux ---------- */
/* ⚠⚠ v0.94 — L'XP EST UNE DONNÉE SERVEUR. AVANT : `etat.xp` et `etat.niveau`
   vivaient dans `donnees`, et `consommer_effets()` — une lecture DESTRUCTRICE —
   déposait l'XP d'un duel dans cette mémoire-là sans que rien ne la sauvegarde.
   Un onglet fermé ou un conflit de révision, et le niveau redescendait : un
   testeur est repassé de 9 à 8 avec `profils.niveau = 9` en base.
   MAINTENANT : `profils.xp` porte le TOTAL CUMULÉ et fait foi. Le niveau et
   l'XP dans le niveau se CALCULENT à partir de lui.
   ⚠ Le barème reste ici, côté client : le serveur ne range qu'un entier.
   ⚠ `xp`, `niveau` et `xpTotal` sont dans CLES_SERVEUR : plus jamais persistés
     dans `donnees`. Ce sont des valeurs dérivées, pas un état à garder. */
function seuilXp(n){ return 20*n; }
// Total cumulé nécessaire pour ATTEINDRE le niveau n : somme(20k, k=1..n-1).
function xpCumulPour(n){ return 10*n*(n-1); }
function niveauDeXp(total){
  let n = 1;
  while(n < 999 && (total|0) >= xpCumulPour(n+1)) n++;
  return n;
}
function xpDansNiveau(total){ return (total|0) - xpCumulPour(niveauDeXp(total)); }

/* Recalcule niveau et XP affichée depuis le total serveur, et crédite les
   points de compétence des niveaux pas encore crédités.
   ⚠ `niveauCredite` est le registre des points DÉJÀ donnés. Il reste dans
     `donnees`, avec les compétences qu'il finance : si `donnees` revient en
     arrière, les points reviennent avec, et sont re-crédités ici. Les deux
     restent cohérents, c'est tout l'intérêt de ne pas le mettre au serveur. */
function majNiveauDepuisXp(){
  if(typeof etat.xpTotal !== "number") return false;   // colonne pas encore lue
  /* ⚠⚠ v0.94b — LE REPLI NE DOIT PAS S'APPUYER SUR `etat.niveau`. C'était le
     bug : `niveau` venant d'être retiré de CLES_SERVEUR, il disparaît de
     `donnees` à la PREMIÈRE sauvegarde. Au chargement SUIVANT, `hydraterEtat`
     repart du défaut de `nouvelEtat()` — niveau 1 — et le registre croyait
     qu'aucun point n'avait jamais été distribué : huit montées de niveau
     rejouées d'un coup, +24 points offerts. En l'absence de registre, la seule
     hypothèse sûre est que TOUT EST DÉJÀ CRÉDITÉ : on ne redonne rien pour le
     passé, on ne crédite que ce qui monte à partir de maintenant.
     ⚠ Ne jamais remplacer ce repli par une valeur tirée de `donnees` : c'est
       précisément ce qui n'y est plus. */
  if(typeof etat.niveauCredite !== "number") etat.niveauCredite = niveauDeXp(etat.xpTotal);
  const n = niveauDeXp(etat.xpTotal);
  etat.niveau = n;
  etat.xp     = xpDansNiveau(etat.xpTotal);
  let monte = false;
  while(etat.niveauCredite < n){
    etat.niveauCredite++;
    etat.pointsCompetence += PTS_PAR_NIVEAU;
    monte = true;
    journal(`Niveau ${etat.niveauCredite} atteint ! +${PTS_PAR_NIVEAU} points, énergie pleine.`,"gain");
  }
  if(monte){ _monterNiveauServeur(n); if(typeof sauvegarder==="function") sauvegarder(); }
  return monte;
}

/* Reste SYNCHRONE : une quinzaine d'appelants, aucun n'attend. On applique le
   gain tout de suite pour l'affichage, et le serveur tranche à sa réponse. */
function gagnerXp(n){
  if(!(n > 0)) return;
  etat.xpTotal = (etat.xpTotal || 0) + n;
  majNiveauDepuisXp();
  _pousserXpServeur(n);
}

/* ⚠ L'INCRÉMENT SE FAIT EN BASE (`xp = xp + n`), pas « je lis, j'ajoute,
   j'écris » : deux onglets qui gagnent de l'XP en même temps doivent compter
   tous les deux. On adopte ensuite le total renvoyé, qui fait foi. */
async function _pousserXpServeur(n){
  if(typeof SERVEUR_DISPO === "undefined" || !SERVEUR_DISPO) return;
  try{
    const { data, error } = await sb.rpc("xp_gagner", { p_n: n|0 });
    if(error){ if(typeof _catchLog==="function") _catchLog(error, "systeme.js#xp"); return; }
    if(data && data.ok && typeof data.xp === "number") adopterXpTotal(data.xp);
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "systeme.js#xp2"); }
}

/* Le serveur annonce un total : on le prend tel quel, SANS rien ajouter.
   ⚠ Utilisée par `consommer_effets`, qui a DÉJÀ crédité l'XP en base. Y
     appeler `gagnerXp()` la compterait deux fois. */
function adopterXpTotal(total){
  if(typeof total !== "number") return;
  etat.xpTotal = total;
  majNiveauDepuisXp();
  if(typeof afficher==="function") afficher();
}

async function _monterNiveauServeur(niveau){
  if(typeof SERVEUR_DISPO === "undefined" || !SERVEUR_DISPO) return;
  try{
    const { data, error } = await sb.rpc("niveau_monter", { p_niveau: niveau|0 });
    if(error){ if(typeof _catchLog==="function") _catchLog(error, "systeme.js#niveau"); return; }
    if(!data || !data.ok){
      console.warn("[niveau_monter]", (data && data.err) || "réponse inattendue", "— niveau client", niveau);
      return;
    }
    etat.energie = data.energie; etat.energieMaj = Date.now();
    if(typeof afficher==="function") afficher();
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "systeme.js#niveau2"); }
}

