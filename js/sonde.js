/* ===========================================================
   LES SONDES — patrouilles automatiques du secteur Nielle (v0.91)

   ⚠ CE NE SONT PAS DES PATROUILLES DU PROTOCOLE. Lui tient un périmètre AU SOL
   et n'a rien à faire en orbite. Ce sont des sondes automatiques d'AREPO
   toujours en service, qui patrouillent parce que leur programme n'a jamais été
   arrêté — comme les relais émettent encore et comme la navette attendait sa
   rotation.

   ⚠ CE QUE ÇA APPORTE AU RÉCIT. Pendant Q1→Q5 le joueur CROIT que le Protocole
   est fait de robots, et l'arc lui apprend patiemment que non : ce sont des
   gens. À Nielle il rencontre les vraies machines, qui ne se comportent en rien
   comme le Protocole — elles n'escortent pas, n'appellent pas, n'ont aucune
   procédure d'accueil. Le contraste RENFORCE la révélation de Q5.

   ⚠ AUCUNE OPTION « PARLER » OU « NÉGOCIER ». Ce sont des machines, et la règle
   R2 interdit de toute façon qu'on apprenne quoi que ce soit par la
   conversation. Tout passe par des traces et des actes.

   ⚠ NE JAMAIS LES APPELER « QUARANTAINE » EN JEU : la consigne sanitaire est
   réservée au second étage (LORE_Protocole.md §6). Le joueur voit des machines
   butées, rien de plus. Elles n'ont pas non plus de nom courant — les équipages
   disent « une sonde », point.
   =========================================================== */

const SONDE_TAUX      = 0.15;    // probabilité d'interception par vol dans Nielle
const SONDE_PV_RIPOSTE= [15, 25];// dégâts quand elle tire la première
const SONDE_PV_DEFAITE= [25, 40];// dégâts quand on l'attaque et qu'on perd
const SONDE_GAIN      = [40, 90];// crédits en cas de victoire

/* ⚠ Butin en CRÉDITS uniquement, jamais d'objet — et surtout pas de Cristal de
   Nyx : Le Gravier doit rester la seule source fiable du secteur, sinon son
   quota quotidien ne sert plus à rien. */

function tenterSonde(){
  if(!enEcart()) return false;
  if(Math.random() >= SONDE_TAUX) return false;
  ouvrirSonde();
  return true;
}

let _sondeMonte = false;
function monterSonde(){
  if(_sondeMonte) return;
  /* ⚠ Les classes `.patr-*` sont injectées par `monterPatrouille()` — donc
     SEULEMENT après une première patrouille au sol. Sans cet appel, la modale
     des sondes s'affichait sans aucune mise en forme pour qui n'avait pas
     encore croisé le Protocole. On monte la patrouille (sa modale reste
     cachée) puis on surcharge la couleur : bleu pour les machines. */
  if(typeof monterPatrouille==="function") monterPatrouille();
  const st = document.createElement("style");
  st.textContent = `
    #sonde-modale{ position:fixed; inset:0; z-index:200; background:rgba(4,8,20,.82); display:grid; place-items:center; padding:20px; }
    #sonde-modale[hidden]{ display:none; }
    #sonde-modale .patr-cadre{ border-color:var(--bleu,#5aa8e6); }
    #sonde-modale .patr-tete{ color:var(--bleu,#5aa8e6); }
  `;
  document.head.appendChild(st);
  const m = document.createElement("div"); m.id="sonde-modale"; m.hidden=true;
  document.body.appendChild(m);
  _sondeMonte = true;
}
function fermerSonde(){ const m=document.querySelector("#sonde-modale"); if(m) m.hidden=true; }

function ouvrirSonde(){
  monterSonde();
  const m = document.querySelector("#sonde-modale");
  const aHack  = (typeof ordiHackEquipe==="function") && ordiHackEquipe();
  const aSoute = (typeof itemsSoute==="function") && itemsSoute() > 0;
  m.innerHTML = `<div class="patr-cadre">
    <div class="patr-tete">⚠ Sonde automatique</div>
    <p class="patr-desc">Un appareil sans cockpit s'aligne sur toi et se met à ta vitesse. Il n'émet rien qui ressemble à un appel.
      Une lumière balaie ta coque, s'arrête, recommence.</p>
    <div class="patr-choix">
      <button class="patr-opt" data-s="attaquer"><b>Ouvrir le feu</b><span class="patr-sous">La seule option qui rapporte · perdre abîme la coque</span></button>
      <button class="patr-opt" data-s="scanner"><b>Se laisser scanner</b><span class="patr-sous">${aSoute?"Elle prélèvera un échantillon dans ta soute":"Ta soute est vide — elle ne trouvera rien à prendre"}</span></button>
      <button class="patr-opt" data-s="deriver"><b>Couper les moteurs et dériver</b><span class="patr-sous">Intelligence · échec = elle tire la première</span></button>
      <button class="patr-opt" data-s="brouiller" ${aHack?"":"disabled"}><b>Brouiller son scanner</b><span class="patr-sous">${aHack?"Ordinateur de hacking équipé · aucun dégât si réussi":"Équipe un Ordinateur de hacking"}</span></button>
    </div>
  </div>`;
  m.hidden = false;
  m.querySelectorAll("[data-s]").forEach(b=>b.addEventListener("click", ()=>sondeChoix(b.dataset.s)));
}

async function sondeChoix(s){
  fermerSonde();
  if(s==="attaquer")       await sondeCombat();
  else if(s==="scanner")   await sondeScanner();
  else if(s==="deriver")   await sondeDeriver();
  else if(s==="brouiller") await sondeBrouiller();
}

/* ---------- Fin de rencontre (commune aux cinq issues) ----------
   ⚠ v0.92 — les cinq issues finissaient par les deux MÊMES lignes. Elles en
   ont maintenant une troisième, et c'est la raison de cette fonction : une
   rencontre peut retirer au joueur son dernier moyen de rentrer, soit en
   PRÉLEVANT son dernier bidon, soit en ABÎMANT la coque (l'avarie majore la
   consommation de moitié, donc le coût du retour vers Silène). `volVers` ne
   contrôle pas ce cas quand une sonde intercepte — il attend justement ici. */
function _sondeFin(){
  if(typeof apresAction==="function") apresAction();
  if(typeof majOrbite==="function") majOrbite();
  if(typeof secoursOrbite==="function") secoursOrbite();
}

/* ---------- Ouvrir le feu ---------- */
async function sondeCombat(){
  lancerTirSonde(_sondeGagne, _sondePerdu);
}
function _sondeGagne(){
  const g = alea(SONDE_GAIN[0], SONDE_GAIN[1]) + ((typeof bonusCredits==="function") ? bonusCredits() : 0);
  etat.credits += g;
  if(typeof gagnerXp==="function") gagnerXp(10);
  journal(`La sonde se disloque. Tu récupères ${g} ₡ de pièces revendables dans les débris, +10 XP.`,"gain");
  _sondeFin();
}
function _sondePerdu(){
  abimerVaisseau(alea(SONDE_PV_DEFAITE[0], SONDE_PV_DEFAITE[1]), "tir de sonde");
  journal("Elle encaisse et riposte. Tu romps le contact, coque touchée.","alerte");
  _sondeFin();
}

/* ===========================================================
   ⚠ LES TROIS OPTIONS CI-DESSOUS ONT ÉTÉ PERDUES puis réécrites.
   `sondeChoix` les appelait, elles n'existaient plus : trois boutons sur
   quatre fermaient la modale et ne faisaient RIEN (ReferenceError avalée par
   l'async). Le fichier restait syntaxiquement valide — `node --check` ne voit
   pas ce genre de trou. Le témoin qui a permis de le retrouver :
   SONDE_PV_RIPOSTE était déclarée et utilisée nulle part.
   =========================================================== */

/* ---------- Se laisser scanner ----------
   Aucun dégât de coque : le prix est un objet.
   ⚠ SOUTE D'ABORD, SAC ENSUITE. Ne regarder que la soute aurait donné une
   parade gratuite — tout remonter dans le sac (50 places) avant de décoller, et
   l'option ne coûtait plus rien. Une option qu'on annule d'un clic n'est pas un
   choix. Le serveur ne repart bredouille que si les DEUX sont vides.
   ⚠ Le choix du lot appartient au SERVEUR (`sonde_prelever`) : le client ne
   propose rien, sinon il suffirait de mentir sur ce qu'on transporte. */
async function sondeScanner(){
  let d = null;
  try{
    const r = await sb.rpc("sonde_prelever");
    if(r && r.error) throw new Error(r.error.message);
    d = r && r.data;
  }catch(e){
    if(typeof _catchLog==="function") _catchLog(e, "sonde.js#1");
    journal("La sonde t'immobilise, puis relâche sans rien prendre — liaison perdue.","alerte");
    return;
  }
  if(d && d.etat && typeof _appliquerEtatStocks==="function") _appliquerEtatStocks(d.etat);
  if(d && d.pris){
    const it = (typeof item==="function") ? item(d.item) : null;
    const ou = (d.lieu === "soute") ? "ta soute" : "ton sac";
    journal(`Un bras s'ouvre, fouille ${ou} et ressort avec 1 ${it ? it.nom : d.item}. La sonde se détourne et reprend sa ronde.`,"alerte");
  } else {
    journal("La lumière te balaie une dernière fois. Tu ne transportes rien : elle décroche.","");
  }
  _sondeFin();
}

/* ---------- Couper les moteurs et dériver ----------
   Jet d'Intelligence : se faire passer pour un débris demande de savoir ce
   qu'une sonde cherche. Échec = elle tire la première (SONDE_PV_RIPOSTE, plus
   clément que la défaite au combat : on n'a pas engagé le tir). */
async function sondeDeriver(){
  const int = (typeof intelligenceEffective==="function") ? intelligenceEffective() : 10;
  const p = Math.min(0.90, 0.35 + int/300);
  if(Math.random() < p){
    journal("Moteurs coupés, signature éteinte. Elle te prend pour un débris, te contourne et poursuit sa route.","gain");
  } else {
    abimerVaisseau(alea(SONDE_PV_RIPOSTE[0], SONDE_PV_RIPOSTE[1]), "tir de sonde");
    journal("Trop tard : elle avait déjà verrouillé. Elle tire la première, coque touchée.","alerte");
  }
  _sondeFin();
}

/* ---------- Brouiller son scanner ----------
   ⚠ AUCUN GAIN EN CAS DE RÉUSSITE, et c'est volontaire : le bouton « Ouvrir le
   feu » annonce « la seule option qui rapporte ». Brouiller achète une sortie
   propre, rien de plus — sinon l'Ordinateur de hacking rendrait le combat
   inutile. Échec = riposte, comme la dérive. */
async function sondeBrouiller(){
  if(typeof ordiHackEquipe==="function" && !ordiHackEquipe()) return;
  const int = (typeof intelligenceEffective==="function") ? intelligenceEffective() : 10;
  const bonus = (typeof aIntrusion==="function" && aIntrusion()) ? 0.25 : 0;   // Intrusion (om4)
  const p = Math.min(0.90, 0.45 + int/500 + bonus);
  if(Math.random() < p){
    journal("Ton ordinateur noie son scanner sous de faux échos. Elle cherche, ne trouve plus rien, et s'éloigne.","gain");
  } else {
    abimerVaisseau(alea(SONDE_PV_RIPOSTE[0], SONDE_PV_RIPOSTE[1]), "tir de sonde");
    journal("Le brouillage ne prend pas — elle isole ta signature et ouvre le feu.","alerte");
  }
  _sondeFin();
}

/* ===========================================================
   MINI-JEU — TIR DE SONDAGE (duel de vaisseaux)

   La coque de la sonde est une grille 5 × 5. Son CŒUR est dans une case, et
   une seule. Tu as cinq salves. Chaque tir qui rate renvoie un ÉCHO : la
   distance en cases jusqu'au cœur. À toi de recouper.

   ⚠ POURQUOI PAS UN JEU DE VISÉE. La première version faisait tirer sur un
   réticule qui balaie — c'est-à-dire la même idée que « Grille laser » et
   « Bypass du pare-feu » : viser au bon moment. Six mini-jeux sur sept auraient
   reposé sur le même geste.
   ⚠ Celui-ci ne demande AUCUN réflexe : c'est de la déduction pure, au tour par
   tour. Il est donc rigoureusement identique au doigt et à la souris — pas de
   temps de réaction à compenser, pas de précision de pointage — et il récompense
   la tête plutôt que le matériel. C'est aussi le seul qui fasse vraiment
   « duel » : on cherche l'autre, on encaisse, on recommence.
   =========================================================== */
/* ⚠ LA GRILLE RÉTRÉCIT AVEC L'INTELLIGENCE. Un capteur mieux réglé balaie une
   zone plus étroite : 7 × 7 au départ, 5 × 5 pour qui a travaillé la compétence.
   C'est le premier mini-jeu dont la difficulté dépend du personnage — les six
   autres ne récompensent que l'adresse du joueur.
   📌 À revoir avec l'arène : compétences et aptitudes seront rééquilibrées
   d'un bloc à ce moment-là, ces seuils avec. */
const TIR_SALVES  = 5;   // tirs disponibles, quelle que soit la grille
function _tirTaille(){
  const i = (typeof intelligenceEffective==="function") ? intelligenceEffective() : 10;
  if(i >= 55) return 5;
  if(i >= 30) return 6;
  return 7;
}

let _tirMonte = false, _tirWin = null, _tirLose = null;
let _tirCoeur = null, _tirRestant = 0, _tirVus = {}, _tirN = 7;

function _tirStyle(){
  if(_tirMonte) return;
  const st = document.createElement("style");
  st.textContent = `
    #tir-modale{ position:fixed; inset:0; z-index:210; background:rgba(4,8,20,.88); display:grid; place-items:center; padding:20px; }
    #tir-modale[hidden]{ display:none; }
    .sd-cadre{ width:min(460px,96vw); background:var(--surface,#0d1e30); border:1px solid var(--bleu,#5aa8e6); border-radius:14px 6px 14px 6px; padding:18px 20px; box-shadow:0 20px 60px rgba(0,0,0,.6); color:var(--texte,#dfe8f2); font-family:"Exo 2",sans-serif; }
    .sd-tete{ display:flex; align-items:baseline; gap:10px; font-family:"Space Mono",monospace; letter-spacing:.08em; text-transform:uppercase; color:var(--bleu,#5aa8e6); font-size:13px; margin-bottom:10px; }
    .sd-tete .sd-salves{ margin-left:auto; color:var(--orange,#ff8a3d); }
    .sd-sous{ font-size:13.5px; line-height:1.5; margin:0 0 12px; }
    .sd-grille{ display:grid; gap:6px; }   /* les colonnes sont posées à la volée : la taille dépend du personnage */
    .sd-case{ aspect-ratio:1; display:grid; place-items:center; background:rgba(6,14,30,.85); border:1px solid var(--line,#243a52);
      border-radius:8px; cursor:pointer; font-family:"Space Mono",monospace; font-size:15px; color:var(--sourdine,#7f93a8);
      transition:border-color .12s, background .12s; touch-action:manipulation; }
    .sd-case:hover:not(.joue){ border-color:var(--orange,#ff8a3d); }
    .sd-case.joue{ cursor:default; }
    .sd-case.p1{ color:#ff5257; border-color:rgba(255,82,87,.5); }   /* tout près */
    .sd-case.p2{ color:#ff8a3d; border-color:rgba(255,138,61,.4); }
    .sd-case.p3{ color:#ffc061; }
    .sd-case.loin{ color:var(--sourdine,#7f93a8); }
    .sd-case.touche{ background:rgba(139,212,80,.25); border-color:#8bd450; color:#8bd450; }
    #tir-modale .mini{ background:rgba(16,41,78,.7); border:1px solid var(--line,#243a52); color:var(--texte,#dfe8f2); border-radius:8px; padding:8px 14px; font-family:inherit; font-size:13px; cursor:pointer; margin-top:12px; }
    #tir-modale .mini:hover{ border-color:var(--orange,#ff8a3d); }
  `;
  document.head.appendChild(st);
  const m = document.createElement("div"); m.id="tir-modale"; m.hidden=true;
  document.body.appendChild(m);
  _tirMonte = true;
}
function _tirModal(){ _tirStyle(); return document.querySelector("#tir-modale"); }
function _tirFermer(){ const m=document.querySelector("#tir-modale"); if(m){ m.hidden=true; m.innerHTML=""; } }

function lancerTirSonde(onWin, onLose){
  _tirWin=onWin; _tirLose=onLose;
  _tirN = _tirTaille();
  _tirCoeur = { x:Math.floor(Math.random()*_tirN), y:Math.floor(Math.random()*_tirN) };
  _tirRestant = TIR_SALVES; _tirVus = {};
  const m=_tirModal();
  m.innerHTML = `<div class="sd-cadre">
    <div class="sd-tete"><b>🎯 Tir de sondage</b></div>
    <p class="sd-sous">La coque de la sonde tient dans une grille de ${_tirN} × ${_tirN}.
      Son <b>cœur</b> est dans une case, et une seule.<br><br>
      Tu as <b>${TIR_SALVES} salves</b>. Chaque tir manqué te renvoie un <b>écho</b> : le nombre de cases
      qui te séparent du cœur, en comptant tout droit puis de côté.<br>
      <b>1</b> = juste à côté. Recoupe deux échos et tu le tiens.<br><br>
      <span class="itip-gris">Aucun réflexe : prends ton temps, la sonde ne bouge pas.
      ${_tirN>5?`Une meilleure <b>Intelligence</b> resserrera la grille — ${_tirN} × ${_tirN} pour l'instant.`:"Tes capteurs sont au mieux : grille resserrée au minimum."}</span></p>
    <div><button class="mini" id="sd-jouer">▶ Commencer</button>
         <button class="mini" id="sd-fuir" style="margin-left:8px">Renoncer</button></div>
  </div>`;
  m.hidden=false;
  m.querySelector("#sd-jouer").addEventListener("click", _tirRendre);
  m.querySelector("#sd-fuir").addEventListener("click", ()=>{ _tirFermer(); if(_tirLose) _tirLose(); });
}

function _tirRendre(){
  const m=_tirModal();
  let cases = "";
  for(let y=0;y<_tirN;y++) for(let x=0;x<_tirN;x++){
    const v = _tirVus[x+","+y];
    const cls = v==null ? "" : ` joue ${v===0?"touche":(v===1?"p1":(v===2?"p2":(v===3?"p3":"loin")))}`;
    cases += `<div class="sd-case${cls}" data-x="${x}" data-y="${y}">${v==null?"":(v===0?"✷":v)}</div>`;
  }
  m.innerHTML = `<div class="sd-cadre">
    <div class="sd-tete"><b>🎯 Tir de sondage</b><span class="sd-salves">${_tirRestant} salve(s)</span></div>
    <p class="sd-sous">Tire sur une case. L'écho te dira à combien de cases se trouve le cœur.</p>
    <div class="sd-grille" style="grid-template-columns:repeat(${_tirN},1fr)">${cases}</div>
  </div>`;
  m.querySelectorAll(".sd-case:not(.joue)").forEach(c=>c.addEventListener("click", ()=>_tirSalve(+c.dataset.x, +c.dataset.y)));
}

function _tirSalve(x, y){
  const d = Math.abs(x-_tirCoeur.x) + Math.abs(y-_tirCoeur.y);
  _tirVus[x+","+y] = d;
  _tirRestant--;
  _tirRendre();
  if(d === 0){ setTimeout(()=>{ _tirFermer(); if(_tirWin) _tirWin(); }, 600); return; }
  if(_tirRestant <= 0){ setTimeout(()=>{ _tirFermer(); if(_tirLose) _tirLose(); }, 900); }
}
