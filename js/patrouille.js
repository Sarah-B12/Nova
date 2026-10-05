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
const PATROUILLE_DROP_TAUX     = 0.55;   // v1.11 : 0,35 → 0,55 (butin plus souvent)
const PATROUILLE_DROP_DOUBLE   = 0.25;   // v1.11 : et, dans ce cas, 1 fois sur 4 un SECOND objet
const PATROUILLE_CRISTAL       = 0.02;   // chance de lâcher un Cristal de Nyx (seule source ordinaire du jeu)
/* ⚠ v0.94b — L'XP DES PATROUILLES ÉTAIT DÉJÀ DONNÉE, mais INVISIBLE :
   `gagnerXp()` ne journalise rien, et le message ne parlait que des crédits.
   Un testeur a donc demandé « un peu d'XP en gagnant contre une patrouille »
   alors qu'il en recevait dix depuis toujours. Les montants ne changent pas,
   on les ANNONCE — et ils sont nommés ici plutôt qu'écrits en dur dans deux
   fichiers, pour ne pas créer un barème en double de plus. */
const XP_PATROUILLE      = 10;   // vaincue au combat (actions.js)
const XP_PATROUILLE_HACK = 8;    // piratée sans dégâts (ici)
const ITEM_HACK = "fab_ordinateur_de_hacking";
/* v1.11 — BUTIN ÉLARGI (demande de l'autrice : « que ça renfloue le marché »).
   Une patrouille vaincue lâchait 5 objets possibles ; elle en lâche désormais
   15, tous de DÉBUT ou de MILIEU de formation — lingots, fils, panneaux,
   consommables courants. ⚠ Volontairement AUCUN objet de fin de formation, ni
   arme lourde, ni vaisseau : ce sont des patrouilleurs dépouillés, pas un
   entrepôt. ⚠ Ces objets se revendent : garder la liste au ras des matières
   premières, sinon le marché n'a plus besoin des artisans. */
const PATROUILLE_DROPS = [
  "fab_composant_simple","fab_circuit_imprime","fab_cablage","voltane","silite",
  "fab_fil","fab_lingot_de_voltane","fab_lingot_de_givrite","fab_lingot_de_cendrite",
  "fab_panneau_de_sylve","fab_plaque_de_coque","fab_biofil_renforce",
  "fab_panneau_composite","fab_composant_avance","fab_servomoteur"
];
/* ⚠ AUCUN CONSOMMABLE dans cette liste (décision du 23/09) : ration, kit de
   soin, recharge d'O₂ se consomment et se rachètent — les faire tomber gratuit
   couperait l'herbe sous le pied des Biotech, qui en vivent. Le butin doit être
   de la MATIÈRE et des PIÈCES, revendables et retransformables. */

/* v1.12 — LES HEURES NE SE VALENT PLUS. Le serveur tire six segments de 4 h par
   jour : calme ×0,5, ordinaire ×1, dense ×1,6 (table `patrouille_horaires`).
   Le client ne connaît que le facteur de L'HEURE EN COURS — on sent qu'il y a
   du monde dehors, on ne lit pas le programme. Celui-ci s'achète : c'est le
   guet du Stratège (`guet_payer`, Bureau).
   ⚠ `chancePatrouille()` est SYNCHRONE (appelée au milieu d'un déplacement) :
   on garde donc le facteur en mémoire et on le rafraîchit à part. En cas de
   doute — jamais chargé, hors ligne — il vaut 1 : le comportement d'avant. */
let _facteurPatrouille = 1;
async function chargerFacteurPatrouille(){
  chargerRegistre();                                                       // v1.45 : le palier, au même rythme
  if(typeof sb === "undefined" || !sb) return;
  try{ const { data } = await sb.rpc("patrouille_facteur");
    if(data && data.facteur) _facteurPatrouille = Number(data.facteur) || 1;
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "patrouille.js#facteur"); }
}
/* Un segment dure 4 h : toutes les 10 min suffisent largement, et on relit
   au retour au premier plan (les minuteries d'un onglet caché sont gelées). */
setInterval(chargerFacteurPatrouille, 600000);
document.addEventListener("visibilitychange", ()=>{ if(!document.hidden) chargerFacteurPatrouille(); });

/* ===========================================================
   v1.45 — LE REGISTRE DU PROTOCOLE (PASSATION F ; serveur v170).
   Une priorité par joueur, jamais montrée en chiffre : le serveur ne renvoie
   que le PALIER. Effets sur les patrouilles, par palier (F12, validés 03/10).
   Gains déclarés : registre_patrouille('battue' +3 | 'piratee' +2), 5 par jour.
   =========================================================== */
const REGISTRE_PALIERS = {
  inconnu:     { nom:"Inconnu du registre", freq:1,    durete:0, butin:1,    xp:1,    cristal:PATROUILLE_CRISTAL },
  signale:     { nom:"Signalé",             freq:1.08, durete:1, butin:1.15, xp:1.10, cristal:PATROUILLE_CRISTAL },
  recherche:   { nom:"Recherché",           freq:1.15, durete:2, butin:1.30, xp:1.20, cristal:0.025 },
  prioritaire: { nom:"Prioritaire",         freq:1.25, durete:4, butin:1.50, xp:1.30, cristal:0.03  }
};
let _registrePalier = "inconnu";
function registreEffets(){ return REGISTRE_PALIERS[_registrePalier] || REGISTRE_PALIERS.inconnu; }
/* v1.45b — infobulle du palier (même modèle que les compétences : survol à la
   souris, tap au doigt via TIP_SEL dans systeme.js). Elle dit aussi les deux
   plafonds : 5 patrouilles et 10 sondes comptées par jour. */
function _registreEffetsTexte(R){
  if(R.freq === 1) return "Aucun effet pour l'instant.";
  const pct = x => Math.round((x - 1) * 100);
  return `Patrouilles ${pct(R.freq)} % plus fréquentes, dureté +${R.durete}, crédits +${pct(R.butin)} %, XP +${pct(R.xp)} %, Cristal ${String(R.cristal * 100).replace(".", ",")} %.`;
}
function _majFicheRegistre(){
  const el = document.querySelector("#stat-registre"); if(!el) return;
  const R = registreEffets();
  el.hidden = false;
  el.innerHTML = `<span class="reg-note" tabindex="0">Registre du Protocole : <b>${R.nom}</b> <span class="reg-i">ⓘ</span>`
    + `<span class="tip" role="tooltip"><b>Le Registre du Protocole</b><br>`
    + `Le Protocole tient un registre de ceux qu'il cherche. Chaque action contre lui t'y fait monter ; le calme t'en fait redescendre, un peu chaque jour (pas pendant une pause ni au Couloir).<br>`
    + `Plus tu es haut, plus ses patrouilles te trouvent et résistent — mais plus elles rapportent.<br><br>`
    + `<b>Ton palier : ${R.nom}</b><br>${_registreEffetsTexte(R)}<br><br>`
    + `<b>Ce qui compte</b><br>Patrouille battue ou piratée (<b>5 par jour au plus</b>), expédition victorieuse contre le Protocole, hack de l'Ombre, sonde détruite (<b>10 par jour au plus</b>). Au-delà, tu gagnes toujours ton butin, mais le Registre ne compte plus.<br><br>`
    + `Paliers : Inconnu du registre → Signalé → Recherché → Prioritaire.</span></span>`;
}
async function chargerRegistre(){
  try{ const { data } = await sb.rpc("registre_lire"); if(data && data.ok && REGISTRE_PALIERS[data.palier]) _registrePalier = data.palier; }
  catch(e){ if(typeof _catchLog==="function") _catchLog(e, "patrouille.js#registre"); }
  _majFicheRegistre();
}
// Une patrouille battue ou piratée : le serveur compte (5 par jour au plus) et renvoie le palier.
async function registreSignaler(type){
  try{
    const { data } = await sb.rpc("registre_patrouille", { p_type:type });
    // v1.45b : prévenir une fois par jour quand le plafond de 5 patrouilles est atteint.
    if(data && data.ok && data.compte === false){
      const j = (typeof jourDeJeu === "function") ? jourDeJeu() : new Date().toDateString();
      if(etat._registrePlafond !== j){ etat._registrePlafond = j;
        journal("Registre du Protocole : 5 patrouilles comptées aujourd'hui. Les suivantes rapportent toujours leur butin, mais ne font plus monter ton palier avant demain.", "poste"); }
    }
    if(data && data.ok && REGISTRE_PALIERS[data.palier]){
      const avant = _registrePalier; _registrePalier = data.palier; _majFicheRegistre();
      if(avant !== _registrePalier && Object.keys(REGISTRE_PALIERS).indexOf(_registrePalier) > Object.keys(REGISTRE_PALIERS).indexOf(avant))
        journal(`Registre du Protocole : tu es désormais « ${registreEffets().nom} ». Les patrouilles te cherchent davantage — et rapportent plus.`, "alerte");
    }
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "patrouille.js#registreSignaler"); }
}

function chancePatrouille(){
  const base = (typeof _apt==="function" && _apt("om1")) ? PATROUILLE_TAUX_DISCRET : PATROUILLE_TAUX;
  const m = (typeof boissonMod==="function") ? boissonMod("patrouille", 1) : 1;   // v0.79 : Poussière de route / Le coup du départ
  const deb = (typeof debrisPatrouilleIci==="function" && debrisPatrouilleIci()) ? DEBRIS_PATR_FREQ : 1;   // v1.31 : carte des débris ×1,5
  return Math.max(0, Math.min(0.6, base * m * _facteurPatrouille * deb * registreEffets().freq));   // v1.45 : Registre
}
// L'Ordinateur de hacking doit être ÉQUIPÉ (en main) pour pouvoir hacker.
function ordiHackEquipe(){ return !!(etat.equipement && (etat.equipement.arme===ITEM_HACK || etat.equipement.arme2===ITEM_HACK)); }

// Butin technologique d'une patrouille neutralisée (chance + place au sac). Renvoie l'id lâché ou null.
/* ⚠ Renvoie un TABLEAU d'identifiants depuis la v1.11 (0, 1 ou 2 objets) :
   les appelants (actions.js, le hack de patrouille) l'affichent en liste. */
async function butinPatrouille(){
  if(placesLibres() <= 0) return [];
  // Cristal de Nyx : butin très rare du Protocole (seule source ordinaire, en attendant les zones/l'espace).
  if(Math.random() < registreEffets().cristal && typeof item==="function" && item("cristal")){   // v1.45 : 2 → 3 % selon le Registre
    const rc = await agirServeur({ ajouter:{ cristal:1 }, motif:"patrouille" });
    return (rc && (rc.ajoutes||{}).cristal) ? ["cristal"] : [];
  }
  if(Math.random() > PATROUILLE_DROP_TAUX) return [];
  const pool = PATROUILLE_DROPS.filter(x => typeof item==="function" && item(x));
  if(!pool.length) return [];
  const gains = {};
  const n = (Math.random() < PATROUILLE_DROP_DOUBLE && placesLibres() > 1) ? 2 : 1;
  for(let k=0; k<n; k++){ const id = pool[alea(0, pool.length-1)]; gains[id] = (gains[id]||0) + 1; }
  const r = await agirServeur({ ajouter:gains, motif:"patrouille" });
  const pris = (r && r.ajoutes) ? r.ajoutes : {};
  const liste = [];
  for(const id in pris) for(let k=0; k<pris[id]; k++) liste.push(id);
  return liste;
}
/* Rend « 2× Fil, 1× Lingot de voltane » à partir de la liste. */
function _butinTexte(liste){
  if(!liste || !liste.length) return "";
  const n = {}; for(const id of liste) n[id] = (n[id]||0) + 1;
  return Object.keys(n).map(id => `+${n[id]} ${item(id) ? item(id).nom : id}`).join(", ");
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
  // v0.97 — un objet lié ne se sacrifie pas : il ne compte pas comme « de quoi faire diversion ».
  const aObjet = (etat.sacOrdre||[]).some(id => (etat.sac[id]||0)>0 && !(typeof estObjetLie==="function" && estObjetLie(id)));
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

async function patrouilleChoix(p){
  if(p==="combattre"){ fermerPatrouille(); await resoudreCombat({}); }
  else if(p==="faufiler"){ patrouilleFaufiler(); }
  else if(p==="hacker"){ patrouilleHacker(); }
  else if(p==="diversion"){ patrouilleDiversionListe(); }
}

async function patrouilleFaufiler(){
  fermerPatrouille();
  const p = Math.min(0.90, 0.30 + agiliteEffective()/300 + (_apt("om1")?0.15:0));   // Agilité + Discrétion
  if(Math.random() < p){ journal("Tu te faufiles hors de portée de la patrouille. Rien perdu.","gain"); apresAction(); }
  else { journal("Repéré ! La patrouille te tombe dessus.","alerte"); await resoudreCombat({ embuscade:true }); }
}

async function patrouilleHacker(){
  if(!ordiHackEquipe()){ fermerPatrouille(); return; }
  fermerPatrouille();
  const p = Math.min(0.90, 0.45 + (_apt("om4")?0.25:0) + intelligenceEffective()/500);   // Intrusion + Intelligence
  if(Math.random() < p){
    const R = registreEffets();                                           // v1.45 : Registre
    const g = Math.round(aptButinCombat(alea(10,22)+bonusCredits()) * R.butin); etat.credits += g;
    const xpH = Math.round(XP_PATROUILLE_HACK * R.xp);
    const drop = await butinPatrouille(); gagnerXp(xpH);   // v1.11 : tableau
    journal(`Patrouille piratée et neutralisée : +${g} ₡${drop.length?`, ${_butinTexte(drop)}`:""}, +${xpH} XP. Aucun dégât.`,"gain");
    registreSignaler("piratee");
    apresAction();
  } else { journal("Le piratage échoue — la patrouille riposte.","alerte"); await resoudreCombat({}); }
}

function patrouilleDiversionListe(){
  const m = document.querySelector("#patrouille-modale");
  const stacks = (etat.sacOrdre||[]).filter(id => (etat.sac[id]||0)>0 && !(typeof estObjetLie==="function" && estObjetLie(id)));   // v0.97
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
async function patrouilleDiversion(id){
  if((etat.sac[id]||0) <= 0) return;
  if(!await agirServeur({ retirer:{ [id]:1 }, motif:"divertir" })) return;
  fermerPatrouille();
  journal(`Diversion : tu abandonnes 1 ${item(id).nom}. La patrouille se détourne, tu files.`,"gain");
  apresAction();
}
