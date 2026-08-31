/* ===========================================================
   PATROUILLE — Rencontres du Protocole pendant les déplacements à découvert.
   Déclenchée depuis voyager() (carte.js) quand le trajet sort des cercles
   (dOpen > 0). Une patrouille surgit avec une probabilité de base, réduite par
   l'aptitude Discrétion. Une fenêtre propose 4 options :
     • Combattre        — Force + équipement (moteur resoudreCombat).
     • Se faufiler      — Agilité + Discrétion ; échec = combat en embuscade.
     • Hacker           — si Ordinateur de hacking au sac ; ↑ avec Intrusion + Intelligence.
     • Créer une diversion — sacrifie un objet du sac, fuite assurée.
   Remplace l'ancienne action « Chasser une créature » (plus d'animaux).
   =========================================================== */
const PATROUILLE_TAUX          = 0.15;   // probabilité de base par déplacement à découvert
const PATROUILLE_TAUX_DISCRET  = 0.10;   // avec Discrétion (om1)
const PATROUILLE_DROP_TAUX     = 0.35;   // chance de récupérer de la tech sur une patrouille vaincue
const PATROUILLE_CRISTAL       = 0.02;   // chance de lâcher un Cristal de Nyx (seule source ordinaire du jeu)
const ITEM_HACK = "fab_ordinateur_de_hacking";
const PATROUILLE_DROPS = ["fab_composant_simple","fab_circuit_imprime","fab_cablage","voltane","silite"];

function chancePatrouille(){ return (typeof _apt==="function" && _apt("om1")) ? PATROUILLE_TAUX_DISCRET : PATROUILLE_TAUX; }
// L'Ordinateur de hacking doit être ÉQUIPÉ (en main) pour pouvoir hacker.
function ordiHackEquipe(){ return !!(etat.equipement && (etat.equipement.arme===ITEM_HACK || etat.equipement.arme2===ITEM_HACK)); }

// Butin technologique d'une patrouille neutralisée (chance + place au sac). Renvoie l'id lâché ou null.
function butinPatrouille(){
  if(placesLibres() <= 0) return null;
  // Cristal de Nyx : butin très rare du Protocole (seule source ordinaire, en attendant les zones/l'espace).
  if(Math.random() < PATROUILLE_CRISTAL && typeof item==="function" && item("cristal")){ ajouterAuSac("cristal",1); return "cristal"; }
  if(Math.random() > PATROUILLE_DROP_TAUX) return null;
  const pool = PATROUILLE_DROPS.filter(id => typeof item==="function" && item(id));
  if(!pool.length) return null;
  const id = pool[alea(0, pool.length-1)];
  ajouterAuSac(id, 1);
  return id;
}

// Tentée à chaque déplacement à découvert.
function tenterPatrouille(){
  if(etat.enPause) return;
  if(etat.protocoleActif===false) return;
  if(Math.random() < chancePatrouille()) ouvrirPatrouille();
}

/* ---------- Modale ---------- */
let _patrMonte = false;
function monterPatrouille(){
  if(_patrMonte) return;
  const st = document.createElement("style");
  st.textContent = `
    #patrouille-modale{ position:fixed; inset:0; z-index:200; background:rgba(4,8,20,.82); display:grid; place-items:center; padding:20px; }
    #patrouille-modale[hidden]{ display:none; }
    .patr-cadre{ width:min(460px,96vw); max-height:92vh; overflow:auto; background:var(--surface,#0d1e30); border:1px solid var(--coral,#ff5257); border-radius:var(--r-s,14px 6px 14px 6px); padding:18px 20px; box-shadow:0 20px 60px rgba(0,0,0,.6); color:var(--texte,#dfe8f2); font-family:"Exo 2",sans-serif; }
    .patr-tete{ font-family:"Space Mono",monospace; letter-spacing:.10em; text-transform:uppercase; color:var(--coral,#ff5257); font-size:13px; margin-bottom:6px; }
    .patr-desc{ font-size:14px; margin:0 0 14px; line-height:1.4; }
    .patr-choix{ display:flex; flex-direction:column; gap:8px; }
    .patr-opt{ text-align:left; background:rgba(16,41,78,.5); border:1px solid var(--line,#243a52); border-left:2px solid var(--line,#243a52); border-radius:10px 4px 10px 4px; padding:10px 12px; cursor:pointer; color:var(--texte,#dfe8f2); font-family:inherit; }
    .patr-opt:hover:not(:disabled){ border-left-color:var(--orange,#ff8a3d); background:rgba(255,138,61,.06); }
    .patr-opt:disabled{ opacity:.45; cursor:not-allowed; }
    .patr-opt b{ display:block; font-size:14px; font-weight:600; }
    .patr-opt .patr-sous{ font-family:"Space Mono",monospace; font-size:10.5px; color:var(--sourdine,#7f93a8); }
    .patr-div-liste{ display:flex; flex-direction:column; gap:6px; max-height:min(46vh,320px); overflow-y:auto; margin-top:4px; padding-right:4px; }
    .patr-div-ligne{ display:flex; align-items:center; gap:8px; background:rgba(16,41,78,.5); border:1px solid var(--line,#243a52); border-radius:8px; padding:7px 10px; cursor:pointer; color:var(--texte,#dfe8f2); }
    .patr-div-ligne:hover{ border-color:var(--orange,#ff8a3d); }
    .patr-div-ligne .qte{ margin-left:auto; font-family:"Space Mono",monospace; font-size:11px; color:var(--sourdine,#7f93a8); }
    #patrouille-modale .mini{ background:rgba(16,41,78,.7); border:1px solid var(--line,#243a52); color:var(--texte,#dfe8f2); border-radius:8px; padding:7px 12px; font-family:inherit; font-size:12px; cursor:pointer; margin-top:10px; }
    #patrouille-modale .mini:hover{ border-color:var(--orange,#ff8a3d); }
  `;
  document.head.appendChild(st);
  const m = document.createElement("div"); m.id="patrouille-modale"; m.hidden=true;
  document.body.appendChild(m);
  _patrMonte = true;
}
function fermerPatrouille(){ const m=document.querySelector("#patrouille-modale"); if(m) m.hidden=true; }

function ouvrirPatrouille(){
  monterPatrouille();
  const m = document.querySelector("#patrouille-modale");
  const aHack  = ordiHackEquipe();
  const aObjet = placesUtilisees() > 0;
  m.innerHTML = `<div class="patr-cadre">
    <div class="patr-tete">⚠ Patrouille du Protocole</div>
    <p class="patr-desc">Une patrouille de sentinelles du Protocole te barre la route. Que fais-tu ?</p>
    <div class="patr-choix">
      <button class="patr-opt" data-p="combattre"><b>Combattre</b><span class="patr-sous">Force + équipement · butin possible</span></button>
      <button class="patr-opt" data-p="faufiler"><b>Se faufiler</b><span class="patr-sous">Agilité + Discrétion · échec = embuscade</span></button>
      <button class="patr-opt" data-p="hacker" ${aHack?"":"disabled"}><b>Hacker la patrouille</b><span class="patr-sous">${aHack?"Ordinateur de hacking équipé · aucun dégât si réussi":"Équipe un Ordinateur de hacking"}</span></button>
      <button class="patr-opt" data-p="diversion" ${aObjet?"":"disabled"}><b>Créer une diversion</b><span class="patr-sous">${aObjet?"Sacrifie un objet du sac · fuite assurée":"Aucun objet à sacrifier"}</span></button>
    </div>
  </div>`;
  m.hidden = false;
  m.querySelectorAll("[data-p]").forEach(b=>b.addEventListener("click", ()=>patrouilleChoix(b.dataset.p)));
}

function patrouilleChoix(p){
  if(p==="combattre"){ fermerPatrouille(); resoudreCombat({}); }
  else if(p==="faufiler"){ patrouilleFaufiler(); }
  else if(p==="hacker"){ patrouilleHacker(); }
  else if(p==="diversion"){ patrouilleDiversionListe(); }
}

function patrouilleFaufiler(){
  fermerPatrouille();
  const p = Math.min(0.90, 0.30 + agiliteEffective()/300 + (_apt("om1")?0.15:0));   // Agilité + Discrétion
  if(Math.random() < p){ journal("Tu te faufiles hors de portée de la patrouille. Rien perdu.","gain"); apresAction(); }
  else { journal("Repéré ! La patrouille te tombe dessus.","alerte"); resoudreCombat({ embuscade:true }); }
}

function patrouilleHacker(){
  if(!ordiHackEquipe()){ fermerPatrouille(); return; }
  fermerPatrouille();
  const p = Math.min(0.90, 0.45 + (_apt("om4")?0.25:0) + intelligenceEffective()/500);   // Intrusion + Intelligence
  if(Math.random() < p){
    const g = aptButinCombat(alea(10,22)+bonusCredits()); etat.credits += g;
    const drop = butinPatrouille(); gagnerXp(8);
    journal(`Patrouille piratée et neutralisée : +${g} ₡${drop?`, +1 ${item(drop).nom}`:""}. Aucun dégât.`,"gain");
    apresAction();
  } else { journal("Le piratage échoue — la patrouille riposte.","alerte"); resoudreCombat({}); }
}

function patrouilleDiversionListe(){
  const m = document.querySelector("#patrouille-modale");
  const stacks = (etat.sacOrdre||[]).filter(id => (etat.sac[id]||0)>0);
  let html = `<div class="patr-cadre">
    <div class="patr-tete">⚠ Créer une diversion</div>
    <p class="patr-desc">Choisis un objet à abandonner pour détourner la patrouille et filer.</p>
    <div class="patr-div-liste">`;
  for(const id of stacks){ const it=item(id); if(!it) continue;
    html += `<div class="patr-div-ligne" data-div="${id}"><span>${it.nom}</span><span class="qte">×${etat.sac[id]}</span></div>`;
  }
  html += `</div><button class="mini" data-retour="1">← Retour</button></div>`;
  m.innerHTML = html;
  m.querySelectorAll("[data-div]").forEach(b=>b.addEventListener("click", ()=>patrouilleDiversion(b.dataset.div)));
  m.querySelector("[data-retour]").addEventListener("click", ouvrirPatrouille);
}
function patrouilleDiversion(id){
  if((etat.sac[id]||0) <= 0) return;
  retirerDuSac(id, 1);
  fermerPatrouille();
  journal(`Diversion : tu abandonnes 1 ${item(id).nom}. La patrouille se détourne, tu files.`,"gain");
  apresAction();
}
