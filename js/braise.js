/* ===========================================================
   SURFACES PLANÉTAIRES — La Braise (v0.98) et Le Suaire (v0.99). GDD « La Braise —
   sous-carte ». Secteurs `braise` / `suaire` (serveur : v098_braise.sql, déjà prêt).

   ⚠ POSITION AU SOL : `etat.surface = { x, y, abord }`, JAMAIS `etat.pos`.
     `etat.pos` reste la position sur Silène (pos_x/pos_y côté serveur, lus par
     ressusciter et dans_zone_faction). `etat.surface` part dans `donnees`, que
     le serveur lit pour l'air : `air_respirable` → vrai seulement si `abord`.
   ⚠ `etat.posEspace` ne bouge pas pendant le séjour : le joueur redécolle
     au-dessus de La Braise, là où il était en orbite.

   RÈGLES
   - Descendre : depuis l'orbite, SUR La Braise (onglet « La Braise »). Coût
     d'un saut (carburant + énergie) ; il faut l'autonomie d'un aller-retour.
   - Au sol, pas d'air : chaque déplacement coûte énergie + O₂, avec les MÊMES
     fonctions que Silène (aptitudes comprises). Tout est zone chaude
     (enZoneChaude, data.js) : l'aptitude d'Ignis joue.
   - L'O₂ se recharge À BORD. Rejoindre le vaisseau est un déplacement comme un
     autre : il coûte. Emporter des recharges vaut mieux que les allers-retours.
   - On ne redécolle qu'à bord.
   =========================================================== */
/* v0.99 — DEUX PLANÈTES, UN SEUL MODULE. La configuration vit dans SURFACES,
   indexée par le secteur (`etat.secteur`). Tout le reste est commun : descente,
   bord, décollage, déplacement, carte, onglet. La Braise ne change pas.
   ⚠ Ajouter une planète = une entrée ici + sa valeur dans sauver_profil /
     air_respirable (serveur, déjà prêts pour 'suaire') + enZone* (data.js). */
const SURFACES = {
  braise: {
    nom:"La Braise", orbite:"planete_chaude", img:"images/carte_braise.png", w:2400, h:1600,
    o2Mult:2,                                     // O₂ ×2 : pas d'air, chaleur, cendre
    vaisseau:{ x:1656, y:875, r:70 },
    lieux:[
      { id:"atterrissage", nom:"Aire d'atterrissage", x:1656, y:875,  r:70,  desc:"La seule plaine assez lisse pour se poser." },
      { id:"solfatares",   nom:"Les Solfatares",      x:2078, y:391,  r:110, desc:"Un grand cratère qui fume jaune. L'air y pique les yeux à travers le casque." },
      { id:"aiguilles",    nom:"Le Champ d'aiguilles",x:547,  y:420,  r:110, desc:"Des aiguilles d'obsidienne à perte de vue. On s'y perd." },
      { id:"cuvette",      nom:"La Cuvette",          x:422,  y:1359, r:100, desc:"Un cratère ancien, trop rond pour être tout à fait naturel." },
      { id:"failles",      nom:"Les Failles",         x:1297, y:1094, r:100, desc:"Un réseau de fissures où la lave affleure encore." }
    ],
    descente:"Une planète brûlée, orange sous sa croûte. Les équipages disent qu'elle n'a pas toujours été comme ça. En bas : <b>pas d'air</b>. L'O₂ ne se recharge qu'à bord de ton vaisseau — emporte des recharges.",
    arrivee:"Le vaisseau se pose dans un nuage de cendre. Dehors, tout est noir, rouge et silencieux. À bord, l'air tient ; dehors, il n'y en a pas.",
    depart:"Le vaisseau s'arrache à la cendre. En dessous, La Braise redevient une boule orange, lointaine.",
    couleur:"#f59e0b"
  },
  /* Le Suaire (officiel : Gypsophila). Lieux lus sur carte_suaire.png
     (1536×1024 → monde ×1.5625). Noms provisoires tant que Q12-Q13 ne sont pas
     écrites. Tout est zone FROIDE (enZoneFroide) : l'aptitude de la Toundra joue. */
  suaire: {
    nom:"Le Suaire", orbite:"planete_froide", img:"images/carte_suaire.png", w:2400, h:1600,
    o2Mult:2,                                     // O₂ ×2 : pas d'air, froid mordant
    vaisseau:{ x:1000, y:610, r:70 },
    lieux:[
      { id:"atterrissage", nom:"Aire d'atterrissage", x:1000, y:610,  r:70,  desc:"Un champ de neige damée par le vent. Le seul endroit plat." },
      { id:"crevasse",     nom:"La Grande Crevasse",  x:1280, y:760,  r:110, desc:"Une fracture qui traverse le glacier de part en part. Le fond ne se voit pas." },
      { id:"lac",          nom:"Le Lac bleu",         x:1560, y:1090, r:110, desc:"Une glace si claire qu'on voit dessous. Il y a quelque chose, dessous." },
      { id:"verriere",     nom:"La Verrière",         x:1800, y:520,  r:120, desc:"Un glacier suspendu, bleu, lisse comme une vitre." },
      { id:"dents",        nom:"Les Dents",           x:2150, y:320,  r:110, desc:"Des pics noirs qui percent la neige comme une mâchoire." },
      { id:"pics",         nom:"Les Pics blancs",     x:470,  y:1330, r:110, desc:"Une chaîne de sommets où le vent ne s'arrête jamais." }
    ],
    descente:"Une planète blanche, entièrement couverte de glace, comme d'un drap. En bas : <b>pas d'air</b>, et un froid qui mord à travers la combinaison. L'O₂ ne se recharge qu'à bord de ton vaisseau — emporte des recharges.",
    arrivee:"Le vaisseau se pose dans une gerbe de neige. Dehors, tout est blanc, bleu et silencieux. À bord, l'air tient ; dehors, il n'y en a pas.",
    depart:"Le vaisseau arrache ses patins à la glace. En dessous, Le Suaire redevient une bille blanche.",
    couleur:"#7dd3fc"
  },
  /* v1.85 — ANCOLIE (MAAR-12), K6, K23. Sur Maar, comme Silène, mais « très très
     loin » : on y va depuis Silène (bouton « Partir pour Ancolie »), pas depuis
     l'orbite. Deux zones thermiques (enZoneChaude / enZoneFroide, data.js). Pas de
     Protocole, pas de patrouille. Fond carte_ancolie.png (1536 × 1024 → monde × 1,5625).
     ⚠ v1.87 — K47 : UN HAUT PLATEAU. L'air y est bon, mais mince : dehors, l'O₂
     coûte DEUX FOIS plus que sur Silène et ne se refait jamais. Il ne se recharge
     que dans la zone de la station (`abri`, qui englobe le quai : la station EST le
     quai, K23), où les automates tiennent l'air au standard du personnel ; ailleurs,
     Recharges et Tanks. Serveur : air_respirable (v204), même centre, même rayon.
     ⚠ `abri` existe des DEUX côtés (ici et dans v204) : un rayon changé d'un côté =
     un joueur qui suffoque devant une porte que le client croit ouverte. */
  ancolie: {
    nom:"Ancolie", orbite:null, img:"images/carte_ancolie.png", w:2400, h:1600,
    /* v1.87m — retour de l'autrice : 27 L pour Silène ⇄ Ancolie (un saut × 1,5) contre
       18 L pour monter à Triptolème, c'était à l'envers. C'est un trajet sur la même
       planète, sans sortir en orbite : la moitié d'un saut. */
    o2Mult:2, depuisSilene:true, coutMult:0.5,
    abri:{ x:1031, y:880, r:160 },
    /* v1.87j — retour de l'autrice : pas de quai à part. On se pose et on décolle À LA
       STATION (la station EST le quai, K23), où l'on respire. Rayon 120 : couvre aussi
       l'ancien point d'atterrissage (1110, 960), où dorment les vaisseaux déjà posés. */
    vaisseau:{ x:1031, y:880, r:120 },
    zonesTh:{ chaude:{ x:360, y:270, r:540 }, froide:{ x:1910, y:380, r:580 } },
    lieux:[
      { id:"station",      nom:"La station", x:1031, y:880, r:110, desc:"Un bâtiment rond au milieu de l'ancolie. Des machines y vont et viennent sans se presser ; ton vaisseau attend devant la baie." },
      { id:"chute",        nom:"Le point de chute", x:391, y:1250, r:90, desc:"Un sillon de fleurs couchées, et au bout, la place exacte d'un mauvais atterrissage." },
      { id:"cratere",      nom:"Le Cratère", x:359, y:230, r:130, desc:"Le volcan fume encore. La chaleur traverse les semelles." },
      { id:"glaces",       nom:"Les Glaces", x:1953, y:391, r:150, desc:"Des crêtes blanches où le vent ne s'arrête pas." },
      /* v1.87 — K48 : le gisement de Sélénite, au lac gelé. Invisible tant que Q23 ne
         l'a pas fait trouver (`si` : drapeau de etat). Mécanique : selenite.js. */
      { id:"selenite",     nom:"Le lac gelé", x:1780, y:600, r:70, si:"seleniteConnue", desc:"Des aiguilles pâles poussent dans la glace bleue. Quand le vent passe, elles brillent." }
    ],
    arrivee:"Le vaisseau se pose devant la station, dans un souffle de pétales. Dehors, l'ancolie à perte de vue, bleue sous la lumière. L'air est bon, mais il est mince : au bout de dix pas, on a le souffle court. Seule la station le tient au standard.",
    depart:"Le vaisseau décolle de devant la station. En dessous, Ancolie s'efface : une tache bleue, puis plus rien. Silène est loin.",
    couleur:"#8fb8ff"
  }
};
/* v1.85 — coût d'un trajet Silène ⇄ Ancolie : un saut × coutMult (0,5 depuis v1.87m). */
function coutSautSurface(c){
  const cs = (typeof coutSaut==="function") ? coutSaut() : null; if(!cs) return null;
  const m = (c && c.coutMult) || 1;
  return Object.assign({}, cs, { litres:Math.ceil(cs.litres * m), energie:Math.ceil(cs.energie * m) });
}
/* Compatibilité : BRAISE désigne la configuration de La Braise. */
const BRAISE = SURFACES.braise;
const PAS_SURF_E  = (typeof PAS    !== "undefined") ? PAS    : 63;   // mêmes pas que Silène (carte.js)
const PAS_SURF_O2 = (typeof PAS_O2 !== "undefined") ? PAS_O2 : 80;   // divisé par cfg.o2Mult au sol
function surfaceCfg(secteur){ return SURFACES[secteur || (etat && etat.secteur)] || null; }
function enSurfaceIci(){ return !!surfaceCfg(); }
function posSurface(){
  if(etat.surface && typeof etat.surface.x === "number") return etat.surface;
  const c=surfaceCfg()||BRAISE;
  return { x:c.vaisseau.x, y:c.vaisseau.y, abord:true };
}
/* v1.87 — K47 : la zone de la station d'Ancolie (quai compris). On y respire ; on y
   prend les quêtes de 42-U1F (_priseIci, quetes.js). */
function aLaStation(depuis){
  if(!(etat && etat.secteur === "ancolie")) return false;
  const a = SURFACES.ancolie.abri, p = depuis || posSurface();
  return Math.hypot(p.x - a.x, p.y - a.y) <= a.r;
}
function lieuVisible(l){ return !l.si || !!(etat && etat[l.si]); }   // v1.87 : un lieu caché tant qu'une quête ne l'a pas révélé
function surfaceLieu(secteur, id){ const c=surfaceCfg(secteur); return c ? (c.lieux.find(l => l.id === id) || null) : null; }
function lieuBraiseIci(){ const c=surfaceCfg(); if(!c) return null; const p=posSurface(); return c.lieux.find(l => lieuVisible(l) && Math.hypot(p.x-l.x, p.y-l.y) <= l.r) || null; }
function auVaisseauBraise(){ const c=surfaceCfg(); if(!c) return false; const p=posSurface(), v=c.vaisseau; return Math.hypot(p.x-v.x, p.y-v.y) <= v.r; }
/* En orbite, au-dessus d'une planète à surface : renvoie son secteur ('braise',
   'suaire') ou null. C'est de là qu'on descend. */
function surOrbitePlanete(){
  if(!((typeof enEcart==="function") && enEcart() && typeof surLieuEspace==="function" && typeof espaceLieu==="function")) return null;
  for(const k in SURFACES) if(SURFACES[k].orbite && surLieuEspace(espaceLieu(SURFACES[k].orbite))) return k;   // v1.85 : Ancolie n'a pas d'orbite
  return null;
}
function surOrbiteBraise(){ return !!surOrbitePlanete(); }       // compatibilité (navigation.js)

/* Coût d'un déplacement au sol. MÊMES fonctions que coutTrajet (carte.js) :
   aptitudes, Endurance, zone chaude. Pas de cercle d'abri : tout est à découvert. */
function coutBraise(x, y, depuis){
  const c = surfaceCfg() || BRAISE, src = depuis || posSurface();
  x = Math.max(0, Math.min(c.w, x)); y = Math.max(0, Math.min(c.h, y));
  const d = Math.hypot(x - src.x, y - src.y);
  if(d < 6) return null;
  return {
    d,
    coutE: aptEnergieDeplacement(Math.max(1, Math.round(d/PAS_SURF_E))),
    coutO: aptO2Deplacement(coutO2(Math.max(1, Math.round(d/(PAS_SURF_O2/(c.o2Mult||1))))))
  };
}
/* O₂ pour rejoindre le vaisseau depuis un point (0 si on y est).
   v1.87 — en Ancolie, l'abri n'est pas le vaisseau mais la station (qui l'englobe). */
function coutRetourVaisseau(depuis){
  const cfg=surfaceCfg()||BRAISE, v=cfg.abri || cfg.vaisseau, p=depuis||posSurface();
  if(Math.hypot(p.x-v.x, p.y-v.y) <= v.r) return 0;
  const c = coutBraise(v.x, v.y, p); return c ? c.coutO : 0;
}

/* ---------- Descente, bord, décollage ---------- */
async function descendreBraise(){
  const cle = surOrbitePlanete(), c = surfaceCfg(cle);
  if(!c){ journal("Il faut être en orbite au-dessus d'une planète pour descendre.","alerte"); return; }
  if(typeof vaisseauCloue==="function" && vaisseauCloue()){ journal("Coque hors service : ton vaisseau ne se posera nulle part.","alerte"); return; }
  const cs = coutSaut(); if(!cs){ journal("Aucun vaisseau équipé.","alerte"); return; }
  // Comme au décollage de Silène : pas de descente sans de quoi REMONTER.
  const auto = (typeof autonomieCarburant==="function") ? autonomieCarburant() : (etat.carburant||0);
  if(auto < 2*cs.litres){
    journal(`Descente refusée : il faut de quoi remonter. Se poser et redécoller coûte ${2*cs.litres} L, tu n'as que ${Math.round(auto)} L en tout.`,"alerte","voyage");
    return;
  }
  if(!await _payerSaut(`Descente sur ${c.nom}`)) return;
  etat.secteur = cle;
  etat.surface = { x:c.vaisseau.x, y:c.vaisseau.y, abord:true };
  journal(c.arrivee,"gain","voyage");
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  if(typeof fermerOrbite==="function") fermerOrbite();
  if(typeof majApresDeplacement==="function") majApresDeplacement();
  ouvrirCarteBraise();
}
async function monterABord(){
  if(!enSurfaceIci()) return;
  if(!auVaisseauBraise()){ journal("Ton vaisseau est à l'aire d'atterrissage. Rejoins-le d'abord.","alerte"); return; }
  etat.surface = { ...posSurface(), abord:true };
  if(_viseeSol) _viseeSol.effacer();   // v1.34f : plus de cercle orange oublié
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  // L'O₂ est une jauge serveur : un appel sans coût la fait remonter (air_respirable = à bord).
  await agirServeur({ motif:"bord_braise" });
  journal("Le sas se referme derrière toi. Tu retires ton casque : l'air du bord, enfin.","gain","voyage");
  apresBraise();
}
async function decollerBraise(){
  const c = surfaceCfg(); if(!c) return;
  // v1.56 — plus de vaisseau (périmé, détruit) ou coque hors service : le secours
  // rapatrie sur Silène (frais de secours), au lieu de bloquer au sol.
  if(!etat.vaisseau || (typeof vaisseauCloue==="function" && vaisseauCloue())){
    if(typeof secoursOrbite==="function" && await secoursOrbite()) return;
  }
  /* v1.34f — On décolle DIRECTEMENT depuis l'aire d'atterrissage : on monte à
     bord au passage. Avant, « Décoller » restait grisé tant qu'on n'avait pas
     appuyé sur « Monter à bord » : les testeurs se croyaient bloqués. */
  if(!(posSurface().abord)){
    if(!auVaisseauBraise()){ journal("Ton vaisseau est à l'aire d'atterrissage. Rejoins-le d'abord.","alerte"); return; }
    etat.surface = { ...posSurface(), abord:true };
  }
  if(_viseeSol) _viseeSol.effacer();
  if(c.depuisSilene){ await _decollerVersSilene(c); return; }
  if(!await _payerSaut(`Décollage — ${c.nom}`)) return;
  etat.secteur = "ecart";
  etat.surface = null;
  journal(c.depart,"gain","voyage");
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  fermerCarteBraise();
  if(typeof majApresDeplacement==="function") majApresDeplacement();
  if(typeof ouvrirOrbite==="function") ouvrirOrbite();
}

/* ---------- v1.85 — Silène ⇄ Ancolie ---------- */
function ancolieConnue(){ return etat.ancolie === true; }
function verrouMaar(){ return etat.verrouMaar === true; }    // K16 : de la fin de Q20 à la fin de Q30
function _qActiveId(){ const a = (typeof queteActive==="function") ? queteActive() : null; return a ? a.id : null; }
async function partirVersAncolie(){
  const c = SURFACES.ancolie;
  if(!ancolieConnue()){ journal("Tu ne connais pas de route vers Ancolie.","alerte"); return; }
  if(enSurfaceIci()){ ouvrirCarteBraise(); return; }
  if(typeof enEcart==="function" && enEcart()){ journal("Ancolie est sur Maar : redescends d'abord sur Silène.","alerte"); return; }
  if(!etat.vaisseau){ journal("Il te faut un vaisseau équipé pour rejoindre Ancolie.","alerte"); return; }
  if(typeof villeActuelle==="function" && !villeActuelle()){ journal("On ne décolle pas depuis la nature : rejoins une ville d'abord.","alerte"); return; }
  if(typeof vaisseauCloue==="function" && vaisseauCloue()){ journal("Coque hors service : ton vaisseau ne quittera pas le sol.","alerte"); return; }
  const cs = coutSautSurface(c); if(!cs){ journal("Aucun vaisseau équipé.","alerte"); return; }
  const auto = (typeof autonomieCarburant==="function") ? autonomieCarburant() : (etat.carburant||0);
  if(auto < 2*cs.litres){
    journal(`Départ refusé : il faut de quoi revenir. L'aller-retour coûte ${2*cs.litres} L, tu n'as que ${Math.round(auto)} L en tout.`,"alerte","voyage");
    return;
  }
  if(!await _payerSaut("Départ pour Ancolie", cs)) return;
  etat.secteur = "ancolie";
  etat.surface = { x:c.vaisseau.x, y:c.vaisseau.y, abord:true };
  journal(c.arrivee,"gain","voyage");
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  /* v1.87 — K47 : on se pose à la station (v1.87j). L'O₂ est une jauge serveur :
     un appel sans coût la fait remonter tout de suite (comme « Monter à bord »). */
  await agirServeur({ motif:"air_station" });
  if(typeof majApresDeplacement==="function") majApresDeplacement();
  ouvrirCarteBraise();
}
async function _decollerVersSilene(c){
  if(_qActiveId() === "q20"){
    journal("Les commandes ne répondent pas. Dans la radio, une voix bâille : « Non non non. Pas tant qu'on n'a pas causé, toi et moi. »","alerte","voyage");
    return;
  }
  const cs = coutSautSurface(c); if(!cs){ journal("Aucun vaisseau équipé.","alerte"); return; }
  if(!await _payerSaut(`Retour sur Silène — ${c.nom}`, cs)) return;
  etat.secteur = "silene";
  etat.surface = null;
  journal(c.depart,"gain","voyage");
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  fermerCarteBraise();
  if(typeof majApresDeplacement==="function") majApresDeplacement();
}

/* ---------- Déplacement au sol ---------- */
async function voyagerBraise(x, y){
  const cfg = surfaceCfg(); if(!cfg) return;
  if(etat.enPause){ journal("Personnage en pause.","alerte"); return; }
  // Clic près d'un repère ★ ou d'un lieu : on va à son centre (même confort que Silène).
  const rq = (typeof repereQueteSousCarte==="function") ? repereQueteSousCarte(etat.secteur, x, y) : null;
  if(rq){ x = rq.x; y = rq.y; }
  const c = coutBraise(x, y); if(!c) return;
  const o2 = etat.jauges ? (etat.jauges.o2|0) : 0;
  if(c.coutO >= o2 && !cfg.air){
    journal(`Pas assez d'O₂ pour ce trajet (−${c.coutO}, il t'en reste ${o2}). Respire une recharge, ou avance moins loin.`,"alerte");
    return;
  }
  // Point de non-retour : on AVERTIT (comme sur Silène), on n'interdit pas.
  const reste = o2 - c.coutO, retour = cfg.air ? 0 : coutRetourVaisseau({ x, y });
  if(retour > 0 && retour >= reste){
    if(!await confirmerJoli("Point de non-retour", `Après ce trajet il te restera ${Math.max(0,reste)} d'O₂, et il en faut ${retour} pour revenir ${cfg.abri ? "à la station" : "au vaisseau"}.\n\nSans recharge dans ton sac, tu ne reviendras pas. Continuer ?`, "Continuer", true)) return;
  }
  const dansAbri = cfg.abri ? aLaStation() : false;
  if(!await agirServeur({ cout:c.coutE, jauges:{ o2:-c.coutO }, motif:"deplacement" })) return;
  // On quitte le bord APRÈS l'appel : le premier pas se fait avec un plein d'air.
  etat.surface = { x:Math.round(x), y:Math.round(y), abord:false };
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  const l = lieuBraiseIci();
  journal(`Déplacement — ${cfg.nom} (${Math.round(c.d)} u). −${c.coutE} % énergie, −${c.coutO} O₂.${l?` Tu es à ${l.nom}.`:""}`,"","voyage");
  /* v1.87 — K47 : en entrant dans la zone de la station, l'air se refait. Le serveur
     lit la position SAUVÉE (donnees.surface) : l'appel vient donc après la sauvegarde,
     comme pour « Monter à bord ». */
  if(cfg.abri && !dansAbri && aLaStation()){
    await agirServeur({ motif:"air_station" });
    journal("Tu passes sous l'auvent de la station. L'air y est épais, tiède, réglementaire : tu respires enfin à fond.","gain","voyage");
  }
  if(typeof queteArrivee==="function") queteArrivee();
  apresBraise();
  /* v1.31 — au sol, AUCUNE patrouille d'ordinaire. Pendant une chute de débris,
     la carte tirée en a (plus fréquentes, plus fortes : patrouille.js/actions.js).
     La Braise et Le Suaire restent sans patrouille le reste du temps. */
  if(typeof debrisApresDeplacement==="function") debrisApresDeplacement();
  if(typeof missionsApresPas==="function") missionsApresPas();   // v1.65 : relevé de l'entrepôt (H49)
  if(typeof debrisPatrouilleIci==="function" && debrisPatrouilleIci() && typeof tenterPatrouille==="function") tenterPatrouille();
}

/* ---------- Affichage ---------- */
function apresBraise(){
  majCarteBraise();
  if(typeof majHub==="function") majHub();
  if(typeof afficher==="function") afficher();
}
let _viseeSol = null;   // v1.34e : visée au doigt (carte.js, viseeTactile)
function construireCarteBraise(){
  const svg = document.querySelector("#carte-braise"); if(!svg || svg.dataset.branche) return;
  svg.dataset.branche = "1";
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.addEventListener("click", e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM(); if(!m) return;
    const p = pt.matrixTransform(m.inverse());
    const c = surfaceCfg() || BRAISE;
    if(p.x < 0 || p.y < 0 || p.x > c.w || p.y > c.h) return;   // hors de l'image (bandes vides)
    _viseeSol.clic(p.x, p.y);   // v1.34e : au doigt, visée d'abord
  });
  /* v1.51 — aperçu du coût AU SURVOL de la souris, comme sur Silène (carte.js) :
     même calcul que le déplacement (coutBraise). Au doigt, c'est la visée qui l'affiche. */
  const apercu = (x, y) => {
    const z = document.querySelector("#braise-apercu"); if(!z) return;
    const k = (x === null) ? null : coutBraise(x, y);
    if(!k){ z.innerHTML = ""; return; }
    const manqueE = (etat.energie|0) < k.coutE, manqueO = (etat.jauges && (etat.jauges.o2|0) <= k.coutO);
    z.innerHTML = `<span class="${manqueE?"ap-ko":"ap-ok"}">−${k.coutE} énergie</span> <span class="${manqueO?"ap-ko":"ap-ok"}">−${k.coutO} O₂</span>`;
  };
  svg.addEventListener("pointermove", e => {
    if((e.pointerType||"mouse") === "touch") return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM(); if(!m) return;
    const p = pt.matrixTransform(m.inverse()), c = surfaceCfg() || BRAISE;
    if(p.x < 0 || p.y < 0 || p.x > c.w || p.y > c.h){ apercu(null); return; }
    apercu(p.x, p.y);
  });
  svg.addEventListener("pointerleave", () => apercu(null));
  _viseeSol = viseeTactile(svg, {
    cout: (x, y) => { const k = (typeof coutBraise === "function") ? coutBraise(x, y) : null;
                      return k ? `−${k.coutE} % én. · −${k.coutO} O₂` : null; },
    partir: (x, y) => voyagerBraise(x, y),
    /* v1.88f — au doigt, le premier toucher dit quel lieu on vise (s'il y en a un). */
    nom: (x, y) => { const c = surfaceCfg() || BRAISE;
      const l = (c.lieux || []).find(l => (typeof lieuVisible !== "function" || lieuVisible(l)) && Math.hypot(x - l.x, y - l.y) <= l.r);
      return l ? l.nom : null; }
  });
}
function majCarteBraise(){
  const svg = document.querySelector("#carte-braise"); if(!svg) return;
  construireCarteBraise();
  const cfg = surfaceCfg() || BRAISE;
  svg.setAttribute("viewBox", `0 0 ${cfg.w} ${cfg.h}`);
  const tt = document.querySelector("#surface-titre"); if(tt) tt.textContent = cfg.nom;
  let h = `<image href="${cfg.img}" x="0" y="0" width="${cfg.w}" height="${cfg.h}" preserveAspectRatio="none"/>`;
  for(const l of cfg.lieux){
    if(!lieuVisible(l)) continue;   // v1.87 : le gisement de Sélénite, après Q23
    const vaiss = (l.id === "atterrissage");   // v1.87k : pas de 🚀 sur la station d'Ancolie (choix de l'autrice)
    h += `<g style="pointer-events:none"><circle cx="${l.x}" cy="${l.y}" r="${l.r}" fill="${vaiss?"#ffffff14":"#00000033"}" stroke="${vaiss?"#f5e9d3":cfg.couleur}" stroke-opacity=".7" stroke-width="3" stroke-dasharray="${vaiss?"":"8 10"}"/>
      <text x="${l.x}" y="${l.y + l.r + 34}" text-anchor="middle" class="vlabel" style="fill:#f5e9d3">${vaiss?"🚀 ":""}${l.nom}</text></g>`;
  }
  if(typeof marqueursQueteCarteHtml==="function") h += marqueursQueteCarteHtml(etat.secteur);
  if(typeof missionsMarqueursCarte==="function") h += missionsMarqueursCarte(etat.secteur);   // v1.64 : la balise (H37)
  const p = posSurface(), col = (FACTIONS.find(f=>f.id===etat.faction)||{}).couleur || "#ff9a44";
  h += `<circle cx="${p.x}" cy="${p.y}" r="15" fill="#0a1730" stroke="${col}" stroke-width="4"/><circle cx="${p.x}" cy="${p.y}" r="6" fill="${col}"/>`;
  svg.innerHTML = h;
  if(_viseeSol) _viseeSol.redessiner();   // v1.34e : la visée survit au redessin

  const e = document.querySelector("#braise-energie"); if(e) e.textContent = Math.floor(etat.energie||0);
  const o = document.querySelector("#braise-o2");      if(o) o.textContent = Math.floor((etat.jauges&&etat.jauges.o2)||0);
  const ici = lieuBraiseIci(), abord = !!posSurface().abord;
  const info = document.querySelector("#braise-info");
  if(info){
    const ret = coutRetourVaisseau();
    /* v1.87k — UNE seule ligne sous la carte (retour de l'autrice) : la description du
       lieu passe en bulle (title, au survol) ; le chiffre utile (retour en O₂) vient
       juste après le nom ; #braise-info coupe proprement si l'écran est trop étroit. */
    const nomIci = ici ? `<b title="${ici.desc.replace(/"/g,"&quot;")}">${ici.nom}</b>` : "";
    info.innerHTML = cfg.abri   /* v1.87 — K47 : Ancolie */
      ? (aLaStation() ? `<b>${abord ? "À bord de ton vaisseau, devant la station." : "À la station."}</b> <span class="itip-gris">· l'air y est au standard : ton O₂ se refait</span>`
                      : `${nomIci || "<b>Dans l'ancolie.</b>"} <span class="itip-gris">· retour à la station : ${ret} O₂ · l'air est mince</span>`)
      : cfg.air
      ? (abord ? `<b>À bord de ton vaisseau.</b> <span class="itip-gris">· l'air est bon</span>`
               : `${nomIci || "<b>Dans l'ancolie.</b>"} <span class="itip-gris">· l'air est respirable</span>`)
      : abord
      ? `<b>À bord de ton vaisseau.</b> <span class="itip-gris">· ici tu respires ; dehors, chaque pas coûte de l'O₂</span>`
      : `${nomIci || ((typeof missionsLieuIci==="function" && missionsLieuIci()) || "<b>À découvert.</b>")} <span class="itip-gris">· retour au vaisseau : ${ret} O₂</span>`;
  }
  const bb = document.querySelector("#braise-bord"), bd = document.querySelector("#braise-decoller");
  if(bb){ const ok = !abord && auVaisseauBraise(); bb.disabled = !ok; bb.style.display = abord ? "none" : ""; }
  if(bd){ bd.disabled = !(abord || auVaisseauBraise());   /* v1.34f : depuis l'aire aussi */ const cs = (typeof coutSaut==="function") ? coutSaut() : null;
    const cs2 = cfg.depuisSilene ? coutSautSurface(cfg) : cs;
    bd.textContent = cs2 ? `${cfg.depuisSilene ? "Rentrer sur Silène" : "Décoller"} — ${cs2.litres} L, ${cs2.energie} % énergie` : "Décoller"; }
  if(typeof majDebris==="function") majDebris();   // v1.31 : panneau des débris
}
function ouvrirCarteBraise(){
  if(!enSurfaceIci()){ journal("Tu n'es sur aucune planète.","alerte"); return; }
  document.querySelector("#modale-braise").classList.add("ouverte"); majCarteBraise();
}
function fermerCarteBraise(){ const m=document.querySelector("#modale-braise"); if(m) m.classList.remove("ouverte"); if(_viseeSol) _viseeSol.effacer(); }

/* ---------- Onglet « La Braise », en orbite au-dessus de la planète ---------- */
function majDescente(){
  const z = document.querySelector("#hub-descente"); if(!z) return;
  const c = surfaceCfg(surOrbitePlanete()); if(!c){ z.innerHTML=""; return; }
  const cs = (typeof coutSaut==="function") ? coutSaut() : null;
  // v1.54 — bannière hors quête au-dessus de « Descendre » : images/lieux/<braise|suaire>.png
  const sect = (typeof surOrbitePlanete === "function") ? surOrbitePlanete() : "";
  z.innerHTML = `<h3 style="margin:2px 0">${c.nom}</h3>
    <div class="lieu-banniere"><img src="images/lieux/${sect}.png" alt="" onerror="this.parentElement.remove()"></div>
    <p class="vide">${c.descente}</p>
    <div class="actions"><button class="action" id="braise-descendre"><span>Descendre — ${c.nom}</span><span class="cout">${cs?`${cs.litres} L carburant · ${cs.energie} % énergie`:"vaisseau requis"}</span></button></div>`;
  const b = z.querySelector("#braise-descendre"); if(b) b.addEventListener("click", descendreBraise);
}

/* Branchement des boutons (les éléments existent : ce script est chargé en bas de page). */
(function(){
  const q = s => document.querySelector(s);
  if(q("#braise-fermer"))   q("#braise-fermer").addEventListener("click", fermerCarteBraise);
  if(q("#braise-bord"))     q("#braise-bord").addEventListener("click", monterABord);
  if(q("#braise-decoller")) q("#braise-decoller").addEventListener("click", decollerBraise);
  if(q("#ouvrir-braise"))   q("#ouvrir-braise").addEventListener("click", ouvrirCarteBraise);
  if(q("#ouvrir-ancolie"))  q("#ouvrir-ancolie").addEventListener("click", partirVersAncolie);   // v1.85
})();
