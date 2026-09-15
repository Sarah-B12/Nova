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

/* ---------- Ouvrir le feu ---------- */
async function sondeCombat(){
  lancerTirSonde(_sondeGagne, _sondePerdu);
}
function _sondeGagne(){
  const g = alea(SONDE_GAIN[0], SONDE_GAIN[1]) + ((typeof bonusCredits==="function") ? bonusCredits() : 0);
  etat.credits += g;
  if(typeof gagnerXp==="function") gagnerXp(10);
  journal(`La sonde se disloque. Tu récupères ${g} ₡ de pièces revendables dans les débris.`,"gain");
  if(typeof apresAction==="function") apresAction();
  if(typeof majOrbite==="function") majOrbite();
}
function _sondePerdu(){
  abimerVaisseau(alea(SONDE_PV_DEFAITE[0], SONDE_PV_DEFAITE[1]), "tir de sonde");
  journal("Elle encaisse et riposte. Tu romps le contact, coque touchée.","alerte");
  if(typeof apresAction==="function") apresAction();
  if(typeof majOrbite==="function") majOrbite();
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
const TIR_GRILLE  = 5;   // côté de la grille
const TIR_SALVES  = 5;   // tirs disponibles

let _tirMonte = false, _tirWin = null, _tirLose = null;
let _tirCoeur = null, _tirRestant = 0, _tirVus = {};

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
    .sd-grille{ display:grid; grid-template-columns:repeat(${TIR_GRILLE},1fr); gap:6px; }
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
  _tirCoeur = { x:Math.floor(Math.random()*TIR_GRILLE), y:Math.floor(Math.random()*TIR_GRILLE) };
  _tirRestant = TIR_SALVES; _tirVus = {};
  const m=_tirModal();
  m.innerHTML = `<div class="sd-cadre">
    <div class="sd-tete"><b>🎯 Tir de sondage</b></div>
    <p class="sd-sous">La coque de la sonde tient dans une grille de ${TIR_GRILLE} × ${TIR_GRILLE}.
      Son <b>cœur</b> est dans une case, et une seule.<br><br>
      Tu as <b>${TIR_SALVES} salves</b>. Chaque tir manqué te renvoie un <b>écho</b> : le nombre de cases
      qui te séparent du cœur, en comptant tout droit puis de côté.<br>
      <b>1</b> = juste à côté. Recoupe deux échos et tu le tiens.<br><br>
      <span class="itip-gris">Aucun réflexe : prends ton temps, la sonde ne bouge pas.</span></p>
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
  for(let y=0;y<TIR_GRILLE;y++) for(let x=0;x<TIR_GRILLE;x++){
    const v = _tirVus[x+","+y];
    const cls = v==null ? "" : ` joue ${v===0?"touche":(v===1?"p1":(v===2?"p2":(v===3?"p3":"loin")))}`;
    cases += `<div class="sd-case${cls}" data-x="${x}" data-y="${y}">${v==null?"":(v===0?"✷":v)}</div>`;
  }
  m.innerHTML = `<div class="sd-cadre">
    <div class="sd-tete"><b>🎯 Tir de sondage</b><span class="sd-salves">${_tirRestant} salve(s)</span></div>
    <p class="sd-sous">Tire sur une case. L'écho te dira à combien de cases se trouve le cœur.</p>
    <div class="sd-grille">${cases}</div>
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
