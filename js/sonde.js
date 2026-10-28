/* ===========================================================
   LES SONDES — patrouilles automatiques du secteur Triptolème (v0.91)

   ⚠ CE NE SONT PAS DES PATROUILLES DU PROTOCOLE. Lui tient un périmètre AU SOL
   et n'a rien à faire en orbite. Ce sont des sondes automatiques d'AREPO
   toujours en service, qui patrouillent parce que leur programme n'a jamais été
   arrêté — comme les relais émettent encore et comme la navette attendait sa
   rotation.

   ⚠ CE QUE ÇA APPORTE AU RÉCIT. Pendant Q1→Q5 le joueur CROIT que le Protocole
   est fait de robots, et l'arc lui apprend patiemment que non : ce sont des
   gens. Dans Triptolème il rencontre les vraies machines, qui ne se comportent en rien
   comme le Protocole — elles n'escortent pas, n'appellent pas, n'ont aucune
   procédure d'accueil. Le contraste RENFORCE la révélation de Q5.

   ⚠ AUCUNE OPTION « PARLER » OU « NÉGOCIER ». Ce sont des machines, et la règle
   R2 interdit de toute façon qu'on apprenne quoi que ce soit par la
   conversation. Tout passe par des traces et des actes.

   ⚠ NE JAMAIS LES APPELER « QUARANTAINE » EN JEU : la consigne sanitaire est
   réservée au second étage (LORE.md §6). Le joueur voit des machines
   butées, rien de plus. Elles n'ont pas non plus de nom courant — les équipages
   disent « une sonde », point.
   =========================================================== */

const SONDE_TAUX      = 0.15;    // probabilité d'interception par vol dans Triptolème
const SONDE_PV_RIPOSTE= [15, 25];// dégâts quand elle tire la première
const SONDE_PV_DEFAITE= [25, 40];// dégâts quand on l'attaque et qu'on perd
/* v1.36ab — décision de l'autrice (03/10, idée d'un testeur) : l'Intelligence
   anticipe le tir de la sonde. Chance = Intelligence ÷ 10 %, 20 % au plus
   (atteint à 200), que la coque n'encaisse que la MOITIÉ des dégâts. */
function _degatsSonde(n){
  const ch = (typeof intelBonusVaisseau === "function") ? intelBonusVaisseau() : 0;
  if(ch > 0 && Math.random() < ch){
    journal("Tu avais anticipé son tir : la coque n'encaisse que la moitié du choc.", "gain");
    return Math.max(1, Math.ceil(n / 2));
  }
  return n;
}
/* ⚠ v1.20 — LE GAIN EST FIXÉ PAR LE SERVEUR (RPC sonde_victoire). Les sondes
   étaient trop rentables : 40–90 ₡ par duel, sans coût ni limite, et le client
   décidait seul du montant. Désormais : 1re victoire du jour de jeu 40–90 ₡,
   les suivantes ÷3 (13–30 ₡), 0 ₡ au-delà de 10 victoires payées ; + bonus
   d'Intelligence lu par le serveur. Ouvrir le feu coûte SONDE_ENERGIE, gagné
   ou perdu. Barème dupliqué ici pour l'affichage seulement : il fait foi côté
   serveur (BACKEND_PLAN §36). */
const SONDE_ENERGIE   = 5;       // % d'énergie pour ouvrir le feu
/* v1.33h — coût réel, Endurance comprise : affichage ET débit. */
function coutSonde(){ return (typeof aptEndurance==="function" ? aptEndurance : (x=>x))(SONDE_ENERGIE); }

/* ⚠ Butin en CRÉDITS uniquement, jamais d'objet — et surtout pas de Cristal de
   Nyx : Le Gravier doit rester la seule source fiable du secteur, sinon son
   quota quotidien ne sert plus à rien. */

function tenterSonde(){
  /* v1.96 — à Cérès aussi (K81 : « en vol, à l'improviste »), avec le tir durci. */
  if(!((typeof enEspace === "function") ? enEspace() : enEcart())) return false;
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
  m.innerHTML = `<div class="patr-cadre">
    <div class="patr-tete">⚠ Sonde automatique</div>
    <p class="patr-desc">Un appareil sans cockpit s'aligne sur toi et se met à ta vitesse. Il n'émet rien qui ressemble à un appel.
      Une lumière balaie ta coque, s'arrête, recommence.</p>
    <div class="patr-choix">
      <button class="patr-opt" data-s="attaquer" ${(etat.energie||0) < coutSonde() ? "disabled" : ""}><b>Ouvrir le feu</b><span class="patr-sous">${(etat.energie||0) < coutSonde()
        ? `Pas assez d'énergie (${coutSonde()} % requis)`
        : `La seule option qui rapporte — surtout la première du jour · ${coutSonde()} % d'énergie · perdre abîme la coque`}</span></button>
      <button class="patr-opt" data-s="scanner"><b>Se laisser scanner</b><span class="patr-sous">Elle prélèvera un objet au hasard, dans ta soute ou dans ton sac</span></button>
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
  /* v1.20 — l'énergie est débitée AVANT le duel, gagné ou perdu. Si le serveur
     refuse (plus assez d'énergie), agirServeur() l'a déjà dit : on rouvre la
     rencontre pour que le joueur choisisse une autre issue. */
  const r = await agirServeur({ cout:coutSonde(), motif:"sonde" });
  if(!r){ ouvrirSonde(); return; }
  lancerTirSonde(_sondeGagne, _sondePerdu, { durci: (typeof enCeres === "function") && enCeres() });   // v1.96 : K65 à Cérès
}
async function _sondeGagne(){
  let d = null;
  try{
    const r = await rpcAvecSolde("sonde_victoire", {});   // applique le solde renvoyé
    if(r && r.error) throw new Error(r.error.message);
    d = r && r.data;
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "sonde.js#victoire"); }
  if(typeof gagnerXp==="function") gagnerXp(10);
  if(!d || !d.ok){
    journal("La sonde se disloque. Le serveur n'a pas répondu : aucun crédit versé. +10 XP.","alerte");
  } else if(d.gain > 0){
    journal(`La sonde se disloque. Tu récupères ${d.gain} ₡ de pièces revendables dans les débris, +10 XP.`
      + (d.rang === 1 ? "" : " La première sonde du jour rapporte davantage."),"gain");
  } else {
    journal("La sonde se disloque. Rien de revendable dans les débris aujourd'hui — tu en as déjà trop rapporté. +10 XP.","");
  }
  if(typeof bulleTenace==="function") bulleTenace();
  _sondeFin();
}
function _sondePerdu(){
  abimerVaisseau(_degatsSonde(alea(SONDE_PV_DEFAITE[0], SONDE_PV_DEFAITE[1])), "tir de sonde");
  journal("Elle encaisse et riposte. Tu romps le contact, coque touchée.","alerte"); if(typeof bulleTenace==="function") bulleTenace();
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
    journal("La sonde t'immobilise, puis relâche sans rien prendre — liaison perdue.","alerte"); if(typeof bulleTenace==="function") bulleTenace();
    return;
  }
  if(d && d.etat && typeof _appliquerEtatStocks==="function") _appliquerEtatStocks(d.etat);
  if(d && d.pris){
    const it = (typeof item==="function") ? item(d.item) : null;
    const ou = (d.lieu === "soute") ? "ta soute" : "ton sac";
    journal(`Un bras s'ouvre, fouille ${ou} et ressort avec 1 ${it ? it.nom : d.item}. La sonde se détourne et reprend sa ronde.`,"alerte"); if(typeof bulleTenace==="function") bulleTenace();
  } else {
    journal("La lumière te balaie une dernière fois. Tu ne transportes rien : elle décroche.",""); if(typeof bulleTenace==="function") bulleTenace();
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
    journal("Moteurs coupés, signature éteinte. Elle te prend pour un débris, te contourne et poursuit sa route.","gain"); if(typeof bulleTenace==="function") bulleTenace();
  } else {
    abimerVaisseau(_degatsSonde(alea(SONDE_PV_RIPOSTE[0], SONDE_PV_RIPOSTE[1])), "tir de sonde");
    journal("Trop tard : elle avait déjà verrouillé. Elle tire la première, coque touchée.","alerte"); if(typeof bulleTenace==="function") bulleTenace();
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
    journal("Ton ordinateur noie son scanner sous de faux échos. Elle cherche, ne trouve plus rien, et s'éloigne.","gain"); if(typeof bulleTenace==="function") bulleTenace();
  } else {
    abimerVaisseau(_degatsSonde(alea(SONDE_PV_RIPOSTE[0], SONDE_PV_RIPOSTE[1])), "tir de sonde");
    journal("Le brouillage ne prend pas — elle isole ta signature et ouvre le feu.","alerte"); if(typeof bulleTenace==="function") bulleTenace();
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
/* v1.93f — LES ASTÉROÏDES (demande de l'autrice ; grille, salves et gains inchangés).
   Autant d'astéroïdes que de lignes (5 à 7), CACHÉS, jamais sur le cœur. Un tir qui en
   touche un : la salve est perdue, aucun écho, la case se marque ☄, et les éclats rayent
   la coque de 5 à 10 PV (réduits comme un tir de sonde par _degatsSonde). Un astéroïde ne
   CLOUE jamais le vaisseau en plein duel : la coque garde au moins 1 PV.
   Simulé (joueur qui joue bien, 5 salves) : ~98 à 100 % de victoires, un astéroïde touché
   environ un duel sur cinq. La vraie difficulté (la sonde qui glisse) est gardée pour la
   carte qu'ouvre la Gorge (K65). */
const TIR_ASTEROIDES_PV = [5, 10];
let _tirAst = new Set();
/* v1.96 — LE TIR DURCI DE CÉRÈS (K65, choix B de l'autrice). Trois changements,
   tous annoncés avant le premier tir :
   · la grille a DEUX cases de plus de côté (9 / 8 / 7 selon l'Intelligence) ;
   · autant d'astéroïdes que de lignes, comme à Triptolème ;
   · la sonde GLISSE : tous les deux tirs manqués (un astéroïde compte), son cœur
     passe sur une case voisine (haut, bas, gauche, droite), jamais hors de la
     grille, ni sur un astéroïde, ni sur une case déjà jouée. Les échos d'avant restent affichés, grisés :
     ils disent où elle ÉTAIT (à une case près par glissade).
   Simulé (outils/o_ceres.js, joueur qui recoupe bien) : ~65 % de victoires à 5
   salves, ~82 % à 6 (canon du maître ou Instinct). La salve du canon coûtera une
   cellule (K83) : étape du Fléau, pas encore ici. */
const TIR_DURCI_GRILLE = 2;   // cases de plus de côté
const TIR_DURCI_GLISSE = 2;   // tirs manqués avant une glissade
let _tirDurci = false, _tirRates = 0, _tirGlisse = 0, _tirVieux = new Set();
/* v1.25 — Instinct de combat (tr1) : +1 salve (décision de l'autrice). */
/* v1.93e — le canon de bord du Vaisseau maître : +1 salve (canonVaisseau, vaisseau.js). */
function _tirSalves(){ return TIR_SALVES + ((typeof _apt==="function" && _apt("tr1")) ? 1 : 0) + ((typeof canonVaisseau==="function") ? canonVaisseau() : 0); }
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
    .sd-case.ast{ background:rgba(120,96,72,.35); border-color:rgba(176,140,100,.6); color:#c9a77c; }   /* v1.93f : astéroïde */
    .sd-case.vieux:not(.ast){ opacity:.45; border-style:dashed; }   /* v1.96 : écho d'avant une glissade (Cérès) */
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

function lancerTirSonde(onWin, onLose, opts){
  _tirWin=onWin; _tirLose=onLose;
  _tirDurci = !!(opts && opts.durci); _tirRates = 0; _tirGlisse = 0; _tirVieux = new Set();   // v1.96
  _tirN = _tirTaille() + (_tirDurci ? TIR_DURCI_GRILLE : 0);
  _tirCoeur = { x:Math.floor(Math.random()*_tirN), y:Math.floor(Math.random()*_tirN) };
  _tirRestant = _tirSalves(); _tirVus = {};
  _tirAst = new Set();
  while(_tirAst.size < _tirN){
    const ax = Math.floor(Math.random()*_tirN), ay = Math.floor(Math.random()*_tirN);
    if(ax === _tirCoeur.x && ay === _tirCoeur.y) continue;
    _tirAst.add(ax + "," + ay);
  }
  const m=_tirModal();
  m.innerHTML = `<div class="sd-cadre">
    <div class="sd-tete"><b>🎯 Tir de sondage</b></div>
    <p class="sd-sous">La coque de la sonde tient dans une grille de ${_tirN} × ${_tirN}.
      Son <b>cœur</b> est dans une case, et une seule.<br><br>
      Tu as <b>${_tirSalves()} salves</b>${(typeof canonVaisseau==="function" && canonVaisseau()) ? `, dont ${canonVaisseau()} de ton canon de bord` : ""}. Chaque tir manqué te renvoie un <b>écho</b> : le nombre de cases
      qui te séparent du cœur, en comptant tout droit puis de côté.<br>
      <b>1</b> = juste à côté. Recoupe deux échos et tu le tiens.<br><br>
      ☄ <b>${_tirN} astéroïdes</b> dérivent dans la grille, invisibles à tes capteurs. Une salve qui en touche un
      éclate contre lui : pas d'écho, et les éclats rayent ta coque (${TIR_ASTEROIDES_PV[0]} à ${TIR_ASTEROIDES_PV[1]} PV). Le cœur n'est jamais derrière un astéroïde.<br><br>
      ${_tirDurci ? `↻ <b>Celle-ci ne se laisse pas viser.</b> Tous les <b>${TIR_DURCI_GLISSE} tirs manqués</b>, son cœur <b>glisse d'une case</b>
      (en haut, en bas, à gauche ou à droite). Les échos d'avant restent grisés : ils disent où il était.<br><br>` : ""}
      <span class="itip-gris">Aucun réflexe : prends ton temps, la sonde ne bouge pas.
      ${_tirN>5+(_tirDurci?TIR_DURCI_GRILLE:0)?`Une meilleure <b>Intelligence</b> resserrera la grille — ${_tirN} × ${_tirN} pour l'instant.`:"Tes capteurs sont au mieux : grille resserrée au minimum."}</span></p>
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
    const cls = v==null ? "" : ` joue ${v==="ast"?"ast":(v===0?"touche":(v===1?"p1":(v===2?"p2":(v===3?"p3":"loin"))))}${_tirVieux.has(x+","+y)?" vieux":""}`;   // v1.96 : écho d'avant une glissade
    cases += `<div class="sd-case${cls}" data-x="${x}" data-y="${y}">${v==null?"":(v==="ast"?"☄":(v===0?"✷":v))}</div>`;
  }
  m.innerHTML = `<div class="sd-cadre">
    <div class="sd-tete"><b>🎯 Tir de sondage</b><span class="sd-salves">${_tirRestant} salve(s)</span></div>
    <p class="sd-sous">Tire sur une case. L'écho te dira à combien de cases se trouve le cœur. ☄ = astéroïde.${_tirDurci
      ? `<br>${_tirGlisse ? `<b style="color:var(--orange,#ff8a3d)">↻ Le cœur a glissé${_tirGlisse>1?` (${_tirGlisse} fois)`:""}.</b> Les échos grisés datent d'avant.` : "↻ Le cœur glisse d'une case tous les deux tirs manqués."}` : ""}</p>
    <div class="sd-grille" style="grid-template-columns:repeat(${_tirN},1fr)">${cases}</div>
  </div>`;
  m.querySelectorAll(".sd-case:not(.joue)").forEach(c=>c.addEventListener("click", ()=>_tirSalve(+c.dataset.x, +c.dataset.y)));
}

function _tirSalve(x, y){
  if(_tirAst.has(x + "," + y)){                                  // v1.93f : un astéroïde
    _tirVus[x+","+y] = "ast"; _tirRestant--;
    if(typeof abimerVaisseau === "function" && typeof pvVaisseau === "function" && etat.vaisseau){
      const pv = pvVaisseau(etat.vaisseau);
      const n = Math.min(_degatsSonde(alea(TIR_ASTEROIDES_PV[0], TIR_ASTEROIDES_PV[1])), Math.max(0, pv - 1));
      if(n > 0) abimerVaisseau(n, "éclats d'astéroïde");
      journal(`☄ Ta salve éclate contre un astéroïde. Des éclats rayent la coque${n > 0 ? ` (−${n} PV)` : ""}.`, "alerte");
    }
    _tirManque();
    _tirRendre();
    if(_tirRestant <= 0){ setTimeout(()=>{ _tirFermer(); if(_tirLose) _tirLose(); }, 900); }
    return;
  }
  const d = Math.abs(x-_tirCoeur.x) + Math.abs(y-_tirCoeur.y);
  _tirVus[x+","+y] = d;
  _tirRestant--;
  _tirRendre();
  if(d === 0){ setTimeout(()=>{ _tirFermer(); if(_tirWin) _tirWin(); }, 600); return; }
  if(_tirManque()) _tirRendre();   // v1.96 : la glissade s'affiche tout de suite
  if(_tirRestant <= 0){ setTimeout(()=>{ _tirFermer(); if(_tirLose) _tirLose(); }, 900); }
}

/* v1.96 — un tir manqué (écho ou astéroïde). Au tir durci, tous les
   TIR_DURCI_GLISSE manqués, le cœur glisse d'une case voisine libre. Renvoie vrai
   s'il a glissé. Les cases déjà jouées deviennent « vieilles » (grisées). */
function _tirManque(){
  if(!_tirDurci) return false;
  _tirRates++;
  if(_tirRates % TIR_DURCI_GLISSE !== 0) return false;
  const v = [[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy]) => ({ x:_tirCoeur.x+dx, y:_tirCoeur.y+dy }))
    .filter(p => p.x>=0 && p.y>=0 && p.x<_tirN && p.y<_tirN && !_tirAst.has(p.x+","+p.y)
              && _tirVus[p.x+","+p.y] == null);   // jamais sur une case déjà jouée : elle ne se viserait plus
  if(!v.length) return false;
  _tirCoeur = v[Math.floor(Math.random()*v.length)];
  _tirGlisse++;
  Object.keys(_tirVus).forEach(k => _tirVieux.add(k));
  return true;
}
