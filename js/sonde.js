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
   MINI-JEU — VISÉE À FENÊTRE MOBILE

   Un réticule balaie la coque de la sonde ; un point faible s'ouvre quelque
   part sur la piste. On tire quand le réticule passe dessus.

   ⚠ POURQUOI PAS UN SHOOTER À DÉPLACEMENT LIBRE. Il serait plus spectaculaire
   mais injouable au doigt, et il faudrait l'équilibrer séparément pour chaque
   support. Ici, un seul geste — tirer — au bon moment : identique à la souris,
   au doigt et au clavier, et dans la même famille que les trois mini-jeux de
   `voler.js` (précision et rythme, pas réflexes purs).

   ⚠ LE PREMIER PASSAGE EST UN ENTRAÎNEMENT. Il est lent, annoncé, et ne compte
   NI en réussite NI en échec. Personne ne doit perdre sa coque sur un jeu dont
   il découvrait les règles à l'instant.
   =========================================================== */
const TIR_TOUCHES  = 5;      // plaques à arracher pour l'emporter
const TIR_RATES    = 3;      // ratés tolérés avant de rompre le contact
const TIR_TEMPS    = 4200;   // ms accordées par passage (hors entraînement)

let _tirRaf = null, _tirMonte = false, _tirWin = null, _tirLose = null;
let _tirTouches = 0, _tirRates = 0, _tirEssai = true, _tirActif = false;

function _tirStyle(){
  if(_tirMonte) return;
  const st = document.createElement("style");
  st.textContent = `
    #tir-modale{ position:fixed; inset:0; z-index:210; background:rgba(4,8,20,.88); display:grid; place-items:center; padding:20px; }
    #tir-modale[hidden]{ display:none; }
    .sd-cadre{ width:min(520px,96vw); background:var(--surface,#0d1e30); border:1px solid var(--bleu,#5aa8e6); border-radius:14px 6px 14px 6px; padding:18px 20px; box-shadow:0 20px 60px rgba(0,0,0,.6); color:var(--texte,#dfe8f2); font-family:"Exo 2",sans-serif; }
    .sd-tete{ display:flex; align-items:baseline; gap:10px; font-family:"Space Mono",monospace; letter-spacing:.08em; text-transform:uppercase; color:var(--bleu,#5aa8e6); font-size:13px; margin-bottom:10px; }
    .sd-tete .sd-chrono{ margin-left:auto; color:var(--orange,#ff8a3d); }
    .sd-sous{ font-size:13.5px; line-height:1.5; margin:0 0 12px; }
    .sd-piste{ position:relative; height:54px; background:rgba(6,14,30,.85); border:1px solid var(--line,#243a52); border-radius:8px; overflow:hidden; cursor:crosshair; touch-action:manipulation; }
    .sd-zone{ position:absolute; top:0; bottom:0; background:rgba(90,168,230,.22); border-left:1px solid var(--bleu,#5aa8e6); border-right:1px solid var(--bleu,#5aa8e6); }
    .sd-vise{ position:absolute; top:-2px; bottom:-2px; width:3px; background:var(--orange,#ff8a3d); box-shadow:0 0 10px var(--orange,#ff8a3d); }
    .sd-piste.touche{ background:rgba(139,212,80,.18); }
    .sd-piste.rate{ background:rgba(255,82,87,.18); }
    .sd-etat{ font-family:"Space Mono",monospace; font-size:12px; color:var(--sourdine,#7f93a8); margin-top:10px; display:flex; gap:14px; }
    .sd-barres{ margin-left:auto; }
    #tir-modale .mini{ background:rgba(16,41,78,.7); border:1px solid var(--line,#243a52); color:var(--texte,#dfe8f2); border-radius:8px; padding:8px 14px; font-family:inherit; font-size:13px; cursor:pointer; margin-top:12px; }
    #tir-modale .mini:hover{ border-color:var(--orange,#ff8a3d); }
  `;
  document.head.appendChild(st);
  const m = document.createElement("div"); m.id="tir-modale"; m.hidden=true;
  document.body.appendChild(m);
  _tirMonte = true;
}
function _tirModal(){ _tirStyle(); return document.querySelector("#tir-modale"); }
function _tirStop(){ if(_tirRaf){ cancelAnimationFrame(_tirRaf); _tirRaf=null; } _tirActif=false; }
function _tirFermer(){ _tirStop(); const m=document.querySelector("#tir-modale"); if(m){ m.hidden=true; m.innerHTML=""; } document.removeEventListener("keydown", _tirTouche); }

function lancerTirSonde(onWin, onLose){
  _tirWin=onWin; _tirLose=onLose; _tirTouches=0; _tirRates=0; _tirEssai=true;
  const m=_tirModal();
  m.innerHTML = `<div class="sd-cadre">
    <div class="sd-tete"><b>🎯 Tir de précision</b></div>
    <p class="sd-sous">Un réticule balaie la coque de la sonde. Un <b>point faible</b> s'ouvre par intermittence :
      tire quand le réticule passe dedans.<br><br>
      <b>${TIR_TOUCHES} plaques</b> à arracher. <b>${TIR_RATES} ratés</b> et tu romps le contact.
      Le point faible rétrécit et le balayage accélère à chaque coup au but.<br><br>
      <span class="itip-gris">Clique la piste, appuie sur <b>Espace</b>, ou touche l'écran. Le premier passage est un entraînement : il ne compte pas.</span></p>
    <div><button class="mini" id="sd-jouer">▶ Commencer</button>
         <button class="mini" id="sd-fuir" style="margin-left:8px">Renoncer</button></div>
  </div>`;
  m.hidden=false;
  m.querySelector("#sd-jouer").addEventListener("click", _tirTour);
  m.querySelector("#sd-fuir").addEventListener("click", ()=>{ _tirFermer(); if(_tirLose) _tirLose(); });
}

/* Un passage : zone tirée au hasard, réticule qui va et vient. */
function _tirTour(){
  const m=_tirModal();
  const n = _tirTouches;                                   // 0 → 4 : difficulté croissante
  const largeur = _tirEssai ? 32 : Math.max(11, 26 - n*3.5);   // % de la piste
  const gauche  = 6 + Math.random() * (88 - largeur);
  const vitesse = (_tirEssai ? 26 : 46 + n*9) / 1000;      // % de piste par ms
  const limite  = _tirEssai ? 9000 : TIR_TEMPS;

  m.innerHTML = `<div class="sd-cadre">
    <div class="sd-tete"><b>🎯 ${_tirEssai ? "Entraînement" : "Tir de précision"}</b><span class="sd-chrono" id="sd-chrono"></span></div>
    <p class="sd-sous">${_tirEssai
      ? "Passage d'essai, il ne compte pas. Tire quand le trait orange entre dans la zone bleue."
      : "Tire quand le réticule entre dans la zone."}</p>
    <div class="sd-piste" id="sd-piste">
      <div class="sd-zone" style="left:${gauche}%;width:${largeur}%"></div>
      <div class="sd-vise" id="sd-vise" style="left:0%"></div>
    </div>
    <div class="sd-etat"><span>Plaques ${_tirTouches}/${TIR_TOUCHES}</span><span>Ratés ${_tirRates}/${TIR_RATES}</span>
      <span class="sd-barres">${_tirEssai ? "essai" : `passage ${_tirTouches+1}`}</span></div>
    <button class="mini" id="sd-feu">FEU</button>
  </div>`;

  const piste=m.querySelector("#sd-piste"), vise=m.querySelector("#sd-vise"), chrono=m.querySelector("#sd-chrono");
  let pos=0, sens=1, t0=performance.now(), dernier=t0;
  _tirActif=true;

  const tirer = ()=>{
    if(!_tirActif) return;
    _tirActif=false; _tirStop();
    const dedans = pos >= gauche && pos <= gauche+largeur;
    piste.classList.add(dedans ? "touche" : "rate");
    if(!_tirEssai){ if(dedans) _tirTouches++; else _tirRates++; }
    setTimeout(()=>{ _tirEssai=false; _tirSuite(); }, 420);
  };
  piste.addEventListener("click", tirer);
  m.querySelector("#sd-feu").addEventListener("click", tirer);
  document.removeEventListener("keydown", _tirTouche);
  _tirTouche = e => { if(e.code==="Space" || e.key===" "){ e.preventDefault(); tirer(); } };
  document.addEventListener("keydown", _tirTouche);

  const boucle = (t)=>{
    if(!_tirActif) return;
    const dt = t - dernier; dernier = t;
    pos += sens * vitesse * dt;
    if(pos >= 100){ pos = 100; sens = -1; } else if(pos <= 0){ pos = 0; sens = 1; }
    vise.style.left = pos + "%";
    const reste = limite - (t - t0);
    if(chrono) chrono.textContent = (reste/1000).toFixed(1) + " s";
    /* ⚠ Ne pas tirer compte comme un raté : sans ça, attendre serait la
       meilleure stratégie du joueur prudent, et le mini-jeu n'aurait plus
       d'enjeu. */
    if(reste <= 0){ tirer(); return; }
    _tirRaf = requestAnimationFrame(boucle);
  };
  _tirRaf = requestAnimationFrame(boucle);
}
let _tirTouche = null;

function _tirSuite(){
  if(_tirTouches >= TIR_TOUCHES){ _tirFermer(); if(_tirWin) _tirWin(); return; }
  if(_tirRates   >= TIR_RATES)  { _tirFermer(); if(_tirLose) _tirLose(); return; }
  _tirTour();
}

/* ---------- Se laisser scanner ----------
   Elle prélève UNE unité au hasard dans la soute. ⚠ AREPO collectait des
   échantillons : c'est le geste le plus juste qu'une de ses machines puisse
   avoir. Gratuit quand on voyage à vide, cher quand on rentre chargé — c'est
   ce qui rend le choix intéressant plutôt qu'automatique. */
async function sondeScanner(){
  const soute = etat.soute || {};
  const ids = Object.keys(soute).filter(k => (soute[k]||0) > 0);
  if(!ids.length){
    journal("La lumière passe sur une soute vide. L'appareil s'écarte sans un signal.","gain");
    if(typeof apresAction==="function") apresAction(); return;
  }
  const id = ids[Math.floor(Math.random()*ids.length)];
  /* ⚠ On passe par la soute → le sac → le retrait : deux chemins déjà éprouvés
     plutôt qu'une suppression directe. Si le sac est plein, elle renonce —
     mieux vaut un prélèvement raté qu'un objet détruit par un cas limite. */
  if(typeof placesLibres==="function" && placesLibres() <= 0){
    journal("Elle tente un prélèvement, n'y parvient pas, et s'écarte.","alerte");
    if(typeof apresAction==="function") apresAction(); return;
  }
  if(typeof rangerServeur!=="function" || !await rangerServeur(id, 1, "sac", "soute")) return;
  if(!await agirServeur({ retirer:{ [id]:1 }, motif:"sonde_prelevement" })) return;
  journal(`Un bras sort, prélève 1 ${item(id).nom} dans ta soute, et rentre. L'appareil s'écarte.`,"alerte");
  if(typeof apresAction==="function") apresAction();
}

/* ---------- Dériver, moteurs coupés ---------- */
async function sondeDeriver(){
  const p = Math.min(0.85, 0.35 + (typeof intelligenceEffective==="function" ? intelligenceEffective()/300 : 0));
  if(Math.random() < p){
    journal("Moteurs coupés, tu dérives comme un débris. La lumière passe sur toi et poursuit sa route.","gain");
    if(typeof gagnerXp==="function") gagnerXp(5);
  } else {
    abimerVaisseau(alea(SONDE_PV_RIPOSTE[0], SONDE_PV_RIPOSTE[1]), "tir de sonde");
    journal("Elle ne s'y trompe pas et tire sans sommation. Coque touchée.","alerte");
  }
  if(typeof apresAction==="function") apresAction();
  if(typeof majOrbite==="function") majOrbite();
}

/* ---------- Brouiller ---------- */
async function sondeBrouiller(){
  if(typeof ordiHackEquipe!=="function" || !ordiHackEquipe()) return;
  const p = Math.min(0.90, 0.45 + ((typeof _apt==="function" && _apt("om4")) ? 0.25 : 0)
                     + (typeof intelligenceEffective==="function" ? intelligenceEffective()/500 : 0));
  if(Math.random() < p){
    journal("Son scanner se remplit de bruit. Elle te classe comme roche et s'en va.","gain");
    if(typeof gagnerXp==="function") gagnerXp(8);
  } else {
    abimerVaisseau(alea(SONDE_PV_RIPOSTE[0], SONDE_PV_RIPOSTE[1]), "tir de sonde");
    journal("Le brouillage ne prend pas. Elle tire.","alerte");
  }
  if(typeof apresAction==="function") apresAction();
  if(typeof majOrbite==="function") majOrbite();
}
