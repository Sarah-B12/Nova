/* ===========================================================
   ORBITE — 2ᵉ carte : « Orbite basse ».
   Débloquée par le drapeau etat.espace1 (récompense de Q5) ET la possession
   d'un vaisseau (etat.vaisseau). Tant que ce n'est pas le cas, le bouton
   est ABSENT (pas grisé) : c'est une surprise.

   Même repère que Silène (MONDE.w × MONDE.h) : l'image de fond est étirée,
   les coordonnées restent en unités monde, comme pour carte.jpg.

   ⚠ Les destinations ci-dessous sont des PLACEHOLDERS dessinés en SVG.
   Quand les images d'objets stellaires seront prêtes, remplacer le champ
   `forme` par `img:"images/orbite/station.png"` et adapter _destHtml().
   =========================================================== */

/* Le fond et les dimensions vivent dans js/espace-data.js (ESPACE_FOND, ESPACE_MONDE). */

/* DESTINATIONS supprimé en v0.83 : remplacé par ESPACE_LIEUX (js/espace-data.js). */

/* ===========================================================
   VOYAGE ENTRE LES DEUX SECTEURS (v0.86)

   On ne passe pas d'une carte à l'autre en cliquant : il faut EMBARQUER.
   `etat.secteur` vaut "silene" (par défaut) ou "ecart". Le départ pose le
   joueur sur le Perchoir, le retour le repose dans SA cité.

   ⚠ Le serveur, lui, ne connaît que pos_x / pos_y : pour lui, un joueur parti
   en orbite est encore là où il a décollé (donc en ville : air respirable,
   présent en expédition). À traiter côté SQL avant l'ouverture — voir
   PASSATION. En attendant, le retour repose bien le joueur dans sa cité, donc
   la position reste cohérente au sol. */
/* ⚠ v0.91 — « L'Écart » servait à la fois de nom de SECTEUR et de nom de BASE.
   v0.97 (LORE.md §9) : la base s'appelle Le Perchoir (officiel : Relais
   Triptolème-1) ; le SECTEUR s'appelle officiellement « Secteur Triptolème »
   (ancien « Nielle », abandonné). Décision LORE.md §13 : l'interface affiche
   « Triptolème » (exception voulue à la règle « officiel réservé aux quêtes »
   d'espace-data.js, qui vaut pour les LIEUX).
   ⚠ L'identifiant technique ne change PAS : `profils.secteur` vaut toujours
   'ecart', et `enEcart()` garde son nom. Seuls les textes bougent. */
const SECTEUR_NOM = "Triptolème";

/* Coût du saut Silène ⇄ Triptolème. C'est une SORTIE D'ATMOSPHÈRE, pas un vol
   d'orbite : distance fixe, donc coût fixe en unités de vol. Le carburant
   dépend du vaisseau (conso × unités), l'énergie du pilote.
      Navette légère  : 18 L sur 40  → 2 allers-retours par plein
      Vaisseau maître : 54 L sur 100 → 1 aller-retour (+ un peu)
      Cargo           : 108 L sur 200 → 1 aller-retour (il est lourd) */
const SAUT_UNITES  = 18;
const SAUT_ENERGIE = 12;

function coutSaut(){
  const v = (typeof vaisseauActif==="function") ? vaisseauActif() : null;
  if(!v) return null;
  /* v0.91 — la majoration d'avarie s'applique aussi au saut : sinon on
     décollerait indéfiniment avec une coque en ruine sans rien sentir. */
  const l = Math.ceil(SAUT_UNITES * (v.conso||1) * ((typeof malusCarburant==="function")?malusCarburant():1));
  return { litres: (typeof aptCarburant==="function") ? aptCarburant(l) : l,   // v1.26 : Voyageur −20 %
           energie: (typeof aptSaut==="function" ? aptSaut : (x=>x))(SAUT_ENERGIE + (v.energie||0) * 2),   // v1.34b : Endurance −15 % et Pas léger −20 %
           carb: v.carb, reservoir: v.reservoir, nom: v.nom };
}

function enEcart(){ return etat.secteur === "ecart"; }

/* ===========================================================
   v1.96 — DEUX CARTES SPATIALES : Triptolème et Cérès (CADRAGE_CERES §5)
   Une seule fenêtre (#modale-orbite), une seule position (`etat.posEspace`),
   lue selon `etat.secteur` : "ecart" (Triptolème) ou "ceres". On passe de
   l'une à l'autre par la Gorge (K75), dans les deux sens.
   ⚠ `enEcart()` garde son sens : TRIPTOLÈME seulement (le Perchoir, La Carcasse,
   Le Gravier, les descentes, les missions n'existent que là). « Dans l'espace,
   où que ce soit » se dit `enEspace()`.
   ⚠ `surLieuEspace(l)` vérifie que le lieu est sur la carte où l'on vole : les
   deux cartes ont le même repère (2400 × 1600), un lieu de Triptolème ne doit
   jamais être « atteint » depuis Cérès parce que ses coordonnées y tombent.
   =========================================================== */
const CARTES_ESPACE = {
  ecart: { id:"ecart", nom:"Triptolème", base:"base", img:"images/espace/",
           lieux:() => ESPACE_LIEUX, fond:() => ESPACE_FOND, monde:() => ESPACE_MONDE,
           sortie:"Rentrée vers Silène : depuis le Perchoir uniquement." },
  ceres: { id:"ceres", nom:"Cérès", base:"e2_base",
           img:(typeof ESPACE2_IMG !== "undefined") ? ESPACE2_IMG : "images/espace2/",
           lieux:() => (typeof ESPACE2_LIEUX !== "undefined") ? ESPACE2_LIEUX : [],
           fond:() => (typeof ESPACE2_FOND !== "undefined") ? ESPACE2_FOND : ESPACE_FOND,
           monde:() => (typeof ESPACE2_MONDE !== "undefined") ? ESPACE2_MONDE : ESPACE_MONDE,
           sortie:"Retour vers Triptolème : par la Gorge uniquement." }
};
function enCeres(){ return !!(etat && etat.secteur === "ceres"); }
function enEspace(){ return enEcart() || enCeres(); }
/* La carte spatiale « d'ici » : Cérès si l'on y est, Triptolème sinon (au sol, la
   fenêtre de l'orbite ne s'ouvre que pour partir vers Triptolème). */
function secteurEspaceIci(){ return enCeres() ? "ceres" : "ecart"; }
function carteEspace(s){ return CARTES_ESPACE[s || secteurEspaceIci()] || CARTES_ESPACE.ecart; }
function secteurDuLieu(l){
  if(!l) return null;
  return (typeof ESPACE2_LIEUX !== "undefined" && ESPACE2_LIEUX.includes(l)) ? "ceres" : "ecart";
}
function baseEspace(s){ return espaceLieu(carteEspace(s).base); }
function ceresConnue(){ return !!(etat && etat.ceres === true); }
function surNid(){ return enCeres() && surLieuEspace(espaceLieu("e2_base")); }

/* Sur le Perchoir : c'est lui qui ouvre les services (auberge,
   comptoir, poste, gouvernement, quêtes). Ailleurs dans le secteur, on est
   « en vol » et les hubs se ferment, comme en pleine nature sur Silène. */
/* v0.91 — La Carcasse, comme le Perchoir : un lieu ou les hubs s'ouvrent.
   Ailleurs dans le secteur, on est « en vol » et tout se ferme. */
/* ⚠ v0.91 — À APPELER APRÈS TOUT CHANGEMENT DE LIEU. La liste des onglets
   dépend de l'endroit : sans ce rappel, on garde ceux du lieu qu'on vient de
   quitter — on atterrit sur Silène avec l'onglet du Gisement, seul et vide.
   C'est arrivé parce que l'appel n'était que dans `volVers` : décollage,
   rentrée et remorquage l'avaient oublié. Un seul point d'entrée, désormais. */
function majApresDeplacement(){
  if(typeof queteArrivee==="function") queteArrivee();   // v0.97 : les quêtes ont des étapes en orbite
  if(typeof majHub==="function")   majHub();
  if(typeof majOrbite==="function") majOrbite();
  if(typeof afficher==="function") afficher();
}

function surCarcasse(){ return enEcart() && surLieuEspace(espaceLieu("epave")); }
function surGravier(){  return enEcart() && surLieuEspace(espaceLieu("asteroides")); }

function surBase(){
  if(!enEcart()) return false;
  const b = espaceLieu("base"); if(!b) return false;
  const p = etat.posEspace; if(!p) return false;
  return Math.hypot(p.x - b.x, p.y - b.y) <= espaceRayon(b);
}

function _villeDeMaFaction(){
  const v = VILLES[etat.faction];
  return v ? { x:v.x, y:v.y } : (typeof posDefaut==="function" ? posDefaut() : { x:0, y:0 });
}

/* Vérifie PUIS débite. Comme pour les trajets au sol, on refuse avant de
   toucher à quoi que ce soit : jamais de panne en cours de route. */
async function _payerSaut(quoi, cout){
  const c = cout || coutSaut();   // v1.85 : coût fourni (Silène ⇄ Ancolie, × 1,5)
  if(!c){ journal("Aucun vaisseau équipé.","alerte"); return false; }
  const cuve = etat.carburant || 0;
  if(cuve < c.litres){
    journal(`${quoi} impossible : il faut ${c.litres} L, tu en as ${Math.round(cuve)}. Fais le plein (${item(c.carb)?item(c.carb).nom:"carburant"}).`,"alerte","voyage");
    return false;
  }
  // L'énergie est vérifiée et débitée par le serveur (agir), comme au sol.
  const r = await agirServeur({ cout:c.energie, motif:"saut_orbital" });
  if(!r) return false;
  etat.carburant = Math.max(0, cuve - c.litres);
  journal(`${quoi} : −${c.litres} L (reste ${Math.round(etat.carburant)}/${c.reservoir} L), −${c.energie} % d'énergie.`);
  return true;
}

async function partirVersEcart(){
  if(!orbiteDebloquee()){
    journal(etat.espace1 ? "Il te faut un vaisseau ÉQUIPÉ pour quitter Silène." : "Tu ne connais pas encore de route vers l'orbite.","alerte");
    return;
  }
  if(enEcart()){ ouvrirOrbite(); return; }
  if(enCeres()){ repasserLaGorge(); return; }   // v1.96 : de Cérès, Triptolème est derrière la Gorge
  /* v1.85 — K16 : de la fin de Q20 à la fin de Q30, pas de vol hors de Maar.
     v1.87l — K54 : parce que 42-U1F a cassé le calculateur de saut en détournant le
     vaisseau ; il ne connaît plus que Maar. 42-U1F le réparera en fin de Q30. */
  if(typeof verrouMaar==="function" && verrouMaar()){
    journal("Le calculateur de saut cherche la route de Triptolème, ne la trouve pas, et affiche MAAR. Rien que MAAR. Dans la radio, une voix enrhumée : « Ah. Oui. Ça, c'est toujours cassé. Fais mes trucs, et je te le répare. Silène, Ancolie, ça, il sait encore. »","alerte","voyage");
    return;
  }
  if(typeof villeActuelle==="function" && !villeActuelle()){
    journal("On ne décolle pas depuis la nature : rejoins une ville d'abord.","alerte"); return;
  }
  /* ⚠ v0.91 — un vaisseau cloué au SOL ne décolle pas non plus. C'est le seul
     cas sans issue du système : il n'y a pas de réparateur sur Silène. C'est
     pour ça que le remorquage dépose au Perchoir et jamais au sol. */
  if(typeof vaisseauCloue==="function" && vaisseauCloue()){
    journal("Coque hors service : ton vaisseau ne quittera pas le sol.","alerte"); return;
  }
  /* ⚠ ON NE DÉCOLLE PAS SANS DE QUOI REVENIR (v0.92). Même principe que
     volVers(), qui refuse déjà tout saut intra-secteur dont le retour n'est pas
     couvert — ici c'est le retour vers SILÈNE qui est en jeu.
     ⚠ Le test porte sur l'AUTONOMIE (cuve + bidons du sac ET de la soute), pas
     sur la cuve seule : le Cargo (108 L par saut, 200 L de cuve) et le Vaisseau
     maître (54 L, 100 L) ne PEUVENT PAS emporter leur aller-retour dans le
     réservoir. Exiger 2 × le saut en cuve les clouerait au sol définitivement.
     Le déficit réel est de 16 L et 8 L : un seul bidon suffit. */
  const csDep = coutSaut();
  const autoDep = (typeof autonomieCarburant==="function") ? autonomieCarburant() : (etat.carburant||0);
  if(csDep && autoDep < 2*csDep.litres){
    const nomCarb = (typeof item==="function" && item(csDep.carb)) ? item(csDep.carb).nom : "carburant";
    journal(`Décollage refusé : il faut de quoi revenir. L'aller-retour coûte ${2*csDep.litres} L, tu n'as que ${Math.round(autoDep)} L en tout (réservoir + bidons). Emporte ${Math.ceil(2*csDep.litres - autoDep)} L de ${nomCarb} de plus.`,"alerte","voyage");
    return;
  }
  if(!await _payerSaut("Décollage")) return;
  const base = espaceLieu("base");
  etat.secteur   = "ecart";
  etat.posEspace = base ? { x:base.x, y:base.y } : { x:ESPACE_MONDE.w/2, y:ESPACE_MONDE.h/2 };
  journal(`Décollage. Arrivée : ${base?base.nom:"la base"} — secteur ${SECTEUR_NOM}.`,"gain","voyage");
  /* v0.97 — LE CHEMIN VERS Q6. Au premier décollage (tant que Q6 n'est pas COMMENCÉE),
     la coque encaisse un choc léger et un pilote du Perchoir envoie le joueur chez
     Galm, à La Carcasse : c'est là que se prennent les quêtes de Triptolème.
     8 % des PV : assez pour se voir, jamais assez pour franchir le seuil d'avarie. */
  const _q6Commencee = typeof queteEtat==="function"
        && (queteEtat().done.includes("q6") || (queteEtat().active && queteEtat().active.id==="q6"));
  if(!etat.premierSautQ6 && typeof queteEtat==="function" && !_q6Commencee
     && typeof abimerVaisseau==="function" && typeof pvMax==="function" && etat.vaisseau){
    etat.premierSautQ6 = true;
    abimerVaisseau(Math.max(1, Math.round(pvMax()*0.08)), "sortie d'atmosphère");
    journal("En sortant de l'atmosphère, un choc sourd secoue la coque — quelques plaques ont pris un coup. Au Perchoir, un pilote jette un œil à tes rivets et hausse les épaules : « Va voir Galm, à La Carcasse. Elle rafistole tout ce qui vole. Et elle cherche toujours des bras. »","alerte","voyage");
  }
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  majApresDeplacement();
  ouvrirOrbite();
}

const RENTREE_RP = "Le couloir de rentrée se calcule au relais de la base — Le Muet, lui, n'émet plus rien d'exploitable.";
function surLaBase(){ return surLieuEspace(espaceLieu("base")); }

async function revenirVersSilene(){
  if(!enEcart()) return;
  /* ⚠ v0.91 — on ne redescend QUE depuis la base. Sans ça, on rentrait chez soi
     depuis n'importe quel point du secteur, ce qui vidait de son sens la règle
     « il faut de quoi revenir à la base » posée juste au-dessus.
     ⚠ La raison est DITE AU JOUEUR avant qu'il parte (texte d'accueil de la
     carte + infobulle du bouton), pas seulement au moment du refus : découvrir
     la contrainte une fois à sec, c'est du carburant gâché pour rien. */
  if(typeof vaisseauCloue==="function" && vaisseauCloue()){
    journal("Coque hors service : impossible de tenter une rentrée atmosphérique.","alerte"); return; }
  if(!surLaBase()){
    const b = espaceLieu("base");
    const c = b ? coutVol({x:b.x, y:b.y}) : null;
    journal(`${RENTREE_RP} Rejoins-la d'abord${c?` — ${c.energie} % d'énergie, ${c.litres} L`:""}.`,"alerte","voyage");
    return;
  }
  if(!await _payerSaut("Rentrée")) return;
  const p = _villeDeMaFaction();
  etat.secteur = "silene";
  etat.pos = { x:p.x, y:p.y };                 // retour DANS sa cité, jamais en pleine nature
  journal("Retour sur Silène. Tu te poses chez toi.","gain","voyage");
  fermerOrbite();
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  majApresDeplacement();
}

/* ===========================================================
   VOL DANS TRIPTOLÈME (ex-« Nielle ») — v0.91, brique 1
   Coût PROPORTIONNEL à la distance, comme sur Silène (`coutTrajet`).
   ⚠ Pas de table de prix entre lieux : 19 objets font 171 paires, et le mode
   placement peut tout déplacer — la table serait fausse au premier glissement.
   La « table des distances » du lore reste un AFFICHAGE, pas une source.
   =========================================================== */
const PAS_ESPACE_E = 120;   // unités monde par 1 % d'énergie
const PAS_ESPACE_C = 200;   // unités monde par litre (× conso du vaisseau)

function posEspace(){
  if(etat.posEspace && typeof etat.posEspace.x === "number") return etat.posEspace;
  const b = baseEspace();   // v1.96 : le Perchoir à Triptolème, Le Nid à Cérès
  return b ? { x:b.x, y:b.y } : { x:ESPACE_MONDE.w/2, y:ESPACE_MONDE.h/2 };
}
function _distEsp(a, b){ return Math.hypot(a.x-b.x, a.y-b.y); }

/* Coût d'un vol depuis la position actuelle. null = déjà sur place. */
function coutVol(dest, depuis){
  const v = (typeof vaisseauActif==="function") ? vaisseauActif() : null;
  if(!v || !dest) return null;
  const d = _distEsp(depuis || posEspace(), dest);
  if(d < 6) return null;
  return { d,
    energie: (typeof aptSaut==="function" ? aptSaut : (x=>x))(Math.max(1, Math.round(d / PAS_ESPACE_E))),   // v1.34c : Endurance −15 % et Pas léger −20 %
    litres:  (typeof aptCarburant==="function" ? aptCarburant : (x=>x))(Math.ceil(Math.max(1, Math.round(d / PAS_ESPACE_C)) * (v.conso || 1)
                       * ((typeof malusCarburant==="function") ? malusCarburant() : 1))) };   // v1.26 : Voyageur −20 %
}
/* Ce que coûterait le retour à la base DEPUIS un point donné. */
function _coutRetourBase(depuis){
  const b = baseEspace(); if(!b) return null;   // v1.96 : à Cérès, Le Nid (on y vend le carburant, K93)
  if(_distEsp(depuis, {x:b.x, y:b.y}) < 6) return { energie:0, litres:0, d:0 };
  return coutVol({ x:b.x, y:b.y }, depuis);
}

/* ⚠ LA RÈGLE QUI FERME L'IMPASSE. Rien n'empêcherait un joueur d'aller au
   Gravier avec juste assez de carburant, d'arriver à sec, et d'être bloqué là —
   pas même à la base, donc sans pouvoir en racheter. Le calculateur de bord
   refuse donc de larguer si le RETOUR n'est pas couvert. On raisonne en
   `autonomieCarburant()` (réservoir + unités transportées), pas sur le seul
   réservoir : refuser le départ à qui a dix unités en soute serait absurde. */
function volPossible(dest){
  const c = coutVol(dest); if(!c) return { ok:false, err:"surplace" };
  const retour = _coutRetourBase(dest);
  const litresTotal = c.litres + (retour ? retour.litres : 0);
  if((etat.energie|0) < c.energie) return { ok:false, err:"energie", cout:c };
  if(autonomieCarburant() < litresTotal)
    return { ok:false, err:"retour", cout:c, besoin:litresTotal, retour:retour };
  return { ok:true, cout:c, retour:retour };
}

/* Déplacement effectif. Le carburant se prend d'abord au réservoir ; s'il n'y
   en a plus assez, on verse une unité transportée et on recommence. */
async function volVers(l){
  if(!enEspace()) return false;   // v1.96 : Triptolème ou Cérès
  if(typeof vaisseauCloue==="function" && vaisseauCloue()){
    journal("Coque hors service : ton vaisseau ne décolle pas. Fais-le réparer.","alerte"); return false; }
  const dest = { x:l.x, y:l.y };
  const j = volPossible(dest);
  if(!j.ok){
    if(j.err === "surplace")      journal("Tu y es déjà.","alerte");
    else if(j.err === "energie")  journal(`Trop peu d'énergie : il t'en faut ${j.cout.energie} %.`,"alerte");
    else if(j.err === "retour"){
      const v = vaisseauActif();
      journal(`Le calculateur de bord refuse : ${j.besoin} L nécessaires pour aller là-bas ET revenir à la base, tu n'en as que ${Math.round(autonomieCarburant())}. Fais des réserves de ${item(v.carb).nom}.`,"alerte");
    }
    return false;
  }
  // Carburant : on complète le réservoir depuis les réserves autant que nécessaire.
  let garde = 0;
  while((etat.carburant||0) < j.cout.litres && garde++ < 20){
    if(!await ravitailler()) break;
  }
  if((etat.carburant||0) < j.cout.litres){
    journal("Impossible de transférer assez de carburant dans le réservoir.","alerte"); return false;
  }
  if(!await agirServeur({ cout:j.cout.energie, motif:"vol_espace" })   /* v0.97 : ex-« vol_nielle ». Aucune fonction serveur ne lit ce motif (vérifié : 0 occurrence) ; hors MOTIFS_ACTION exprès. */) return false;
  etat.carburant = Math.max(0, (etat.carburant||0) - j.cout.litres);
  etat.posEspace = dest;
  journal(`Cap sur ${espaceNom(l)} — ${Math.round(j.cout.d)} u, ${j.cout.energie} % d'énergie, ${j.cout.litres} L. Réservoir ${Math.round(etat.carburant)} L.`,"gain","voyage");
  if(l.type === "decor") journal(`${espaceNom(l)} : ${l.ici || "rien, pour l'instant."}`, "", "voyage");   // v1.01
  else if(enCeres() && l.id && !ongletLieuEspace(l) && (l.ici || l.desc)) journal(`${espaceNom(l)} : ${l.ici || l.desc}`, "", "voyage");   // v1.96 : à Cérès, un lieu sans onglet (la Gorge) se raconte
  /* v0.91 — une sonde peut couper la route. ⚠ APRÈS l'arrivée, jamais pendant :
     un joueur intercepté à mi-parcours ne saurait plus où il est, et les
     dégâts de coque changeraient le coût du vol déjà payé. */
  const sondeOuverte = (typeof tenterSonde==="function") ? tenterSonde() : false;
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  majApresDeplacement();
  /* v0.92 — un vol intra-secteur peut consommer la dernière réserve : volVers()
     ne garantit que le retour à la BASE, pas le retour vers Silène. On contrôle
     donc ici. ⚠ PAS si une sonde vient d'ouvrir sa modale : le joueur y a un
     choix en attente, le rapatrier sous la fenêtre serait incompréhensible — et
     la rencontre peut encore changer la donne (bidon prélevé, coque touchée,
     donc consommation majorée). Le cas est repris à la fin de la rencontre,
     dans `_sondeFin()` (sonde.js). */
  if(!sondeOuverte && typeof secoursOrbite==="function") await secoursOrbite();
  return true;
}

/* Mémoire du bandeau d'info pendant un survol (voir majOrbite). */
let _orbInfoFige = null;

/* Ligne d'aperçu affichée au survol d'un objet. */
let _orbSel = null, _orbPointeur = "mouse";   // v1.88f : l'objet touché une première fois, et le type de pointeur
function _apercuVol(l){
  const nom = espaceNom(l);
  if(surLieuEspace(l)) return `<b>${nom}</b> — <span class="itip-gris">tu y es.</span>`;
  const c = coutVol({x:l.x, y:l.y});
  if(!c) return `<b>${nom}</b>`;
  const j = volPossible({x:l.x, y:l.y});
  const cout = `${c.energie} % d'énergie · ${c.litres} L`;
  if(j.ok) return `<b>${nom}</b> — ${cout}`;
  const raison = (j.err==="energie")
    ? "énergie insuffisante"
    : `il faut ${j.besoin} L pour aller ET revenir ${_alaBaseTxt()}`;
  return `<b>${nom}</b> — <span style="color:var(--coral,#ff5257)">${cout} — ${raison}</span>`;
}

/* ===========================================================
   FENÊTRE DISTANCES — l'équivalent spatial de celle de Silène.
   ⚠ C'est un AFFICHAGE, pas une source : tout est recalculé depuis les
   positions réelles, donc un objet déplacé au mode placement met la table à
   jour tout seul.
   =========================================================== */
function ouvrirDistancesEspace(){
  const z = document.querySelector("#modale-distances"); if(!z) return;
  const v = (typeof vaisseauActif==="function") ? vaisseauActif() : null;
  /* ⚠ UNE SEULE SECTION. J'en avais mis deux (depuis ta position ET depuis la
     base), soit 22 lignes pour 11 lieux : la fenêtre n'en finissait plus. Celle
     de Silène tient en 5 lignes. Ici, « depuis ta position » suffit — la base
     figure dans la liste comme les autres. */
  const lieux = carteEspace().lieux().filter(l => l.type !== "decor")   // v1.96 : la carte d'ici
    .map(l => ({ l, c: coutVol({x:l.x, y:l.y}) }))
    .sort((a,b) => ((a.c&&a.c.energie)||0) - ((b.c&&b.c.energie)||0));

  let h = `<h4 class="gsec">Depuis ta position</h4><div class="dist-depuis">`;
  for(const d of lieux){
    if(!d.c){ h += `<div class="dist-ligne"><b>${espaceNom(d.l)}</b><span>tu y es</span></div>`; continue; }
    const j = volPossible({x:d.l.x, y:d.l.y});
    h += `<div class="dist-ligne${j.ok?"":" ko"}"><b>${espaceNom(d.l)}</b><span>${d.c.energie} % · ${d.c.litres} L</span></div>`;
  }
  h += `</div>`;
  h += `<p class="vide" style="margin:10px 0 0">Trajets <b>directs</b>${v?`, ${v.nom} (conso ${v.conso} L/u)`:""}.
    En rouge : pas de quoi <b>aller ET revenir ${_alaBaseTxt()}</b>.</p>`;

  z.querySelector("#distances-corps").innerHTML = h;
  z.classList.add("ouverte"); z.setAttribute("aria-hidden","false");
}

/* ===========================================================
   VOL LIBRE — cliquer n'importe où, comme sur Silène (v0.91)
   ⚠ Sans ça, on ne pouvait rejoindre QUE les objets dessinés : la carte
   cessait d'être un espace pour devenir une liste de boutons.
   =========================================================== */
function _coordEspace(svg, e){
  if(!svg.createSVGPoint) return null;
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const m = svg.getScreenCTM(); if(!m) return null;
  const p = pt.matrixTransform(m.inverse());
  return { x:Math.round(p.x), y:Math.round(p.y) };
}
let _viseeEsp = null;   // v1.34e : visée au doigt (carte.js, viseeTactile)
async function volVersPoint(pt){
  if(!pt) return;
  const M = carteEspace().monde();   // v1.96
  pt.x = Math.max(0, Math.min(M.w, pt.x));
  pt.y = Math.max(0, Math.min(M.h, pt.y));
  await volVers({ x:pt.x, y:pt.y, nom:null, libelle:"ce point du secteur", id:null });
}

/* ===========================================================
   LE GRAVIER — gisement de Cristal de Nyx (v0.91)

   ⚠ UN SEUL MINERAI, et un QUOTA QUOTIDIEN. Le lore veut un gisement qui « se
   recharge une fois par jour » ; l'économie l'exige aussi. Le Cristal de Nyx
   est la matière la plus rare du jeu (butin de patrouille 5 %, aptitude Toundra
   *Veine de cristal* 5 %) et il verrouille la Lame et le Canon à singularité.
   20 % par tentative, c'est QUATRE FOIS le taux de l'aptitude : sans plafond,
   on dévalue le seul bonus identitaire de la Toundra et on inonde le marché.

   ⚠ Chaque tentative RAYE LA COQUE (1 à 3 PV). Un champ d'astéroïdes n'est pas
   un jardin. C'est la source de dégâts régulière et prévisible, celle qu'on
   planifie — l'autre étant la défaite contre une sonde.
   =========================================================== */
const GRAVIER_ESSAIS   = 8;      // tentatives par jour de jeu
const GRAVIER_CHANCE   = 0.20;   // probabilité de sortir un cristal
const GRAVIER_ENERGIE  = 4;      // par tentative (le minage au sol coûte 8)
/* v1.33h — coût réel, Endurance comprise : affichage ET débit (garage.js, ici). */
function coutGravier(){ return (typeof aptEndurance==="function" ? aptEndurance : (x=>x))(GRAVIER_ENERGIE); }
const GRAVIER_PV       = [1, 3]; // dégâts de coque par tentative

function _gravierJour(){ return (typeof jourDeJeu==="function") ? jourDeJeu() : new Date().toDateString(); }
function gravierRestants(){
  const g = etat.gravier;
  if(!g || g.jour !== _gravierJour()) return GRAVIER_ESSAIS;
  return Math.max(0, GRAVIER_ESSAIS - (g.essais||0));
}
async function minerGravier(){
  const l = espaceLieu("asteroides");
  if(!surLieuEspace(l)){ journal(`Il faut être au ${espaceNom(l)} pour ça.`,"alerte"); return; }
  if(!etat.vaisseau){ journal("Il te faut un vaisseau pour travailler ici.","alerte"); return; }
  if(vaisseauCloue()){ journal("Coque hors service : impossible de manœuvrer dans les cailloux.","alerte"); return; }
  if(gravierRestants() <= 0){ journal("Le gisement est épuisé pour aujourd'hui. Il se recharge demain.","alerte"); return; }
  if(placesLibres() <= 0){ journal("Sac plein.","alerte"); return; }

  const touche = Math.random() < GRAVIER_CHANCE;
  const gains  = touche ? { cristal:1 } : {};
  const r = await agirServeur({ cout:coutGravier(), ajouter:gains, motif:"gravier" });
  if(!r) return;

  const g = (etat.gravier && etat.gravier.jour === _gravierJour()) ? etat.gravier : { jour:_gravierJour(), essais:0 };
  g.essais = (g.essais||0) + 1;
  etat.gravier = g;

  abimerVaisseau(alea(GRAVIER_PV[0], GRAVIER_PV[1]), "éraflures d'astéroïdes");
  if(touche && (r.ajoutes||{}).cristal) journal(`Une veine s'ouvre : +1 Cristal de Nyx. (${gravierRestants()} tentative(s) restante(s))`,"gain","minage");
  else journal(`Rien que de la roche morte. (${gravierRestants()} tentative(s) restante(s))`,"alerte","minage");
  if(typeof gagnerXp==="function") gagnerXp(3);
  if(typeof majOrbite==="function") majOrbite();
  if(typeof apresAction==="function") apresAction();
}

/* ===========================================================
   LE RÉPARATEUR DE LA CARCASSE — v0.91
   ⚠ Il répare les PV, JAMAIS la durée de vie : sinon le Constructeur perdrait
   le marché que la Navette de réserve lui protège déjà mal.
   ⚠ Il doit rester MOINS CHER que le kit du comptoir, sinon personne ne ferait
   le détour — et le kit doit rester achetable, sinon une coque clouée au
   Perchoir ne pourrait plus bouger. C'est cet écart qui fait vivre les deux.
   =========================================================== */
const REPARATEUR_PRIX_PV = 1.5;          // crédits par PV manquant
function coutReparateur(){
  if(!etat.vaisseau) return 0;
  return Math.ceil((pvMax() - pvVaisseau()) * REPARATEUR_PRIX_PV);
}
async function reparerChezReparateur(){
  if(!etat.vaisseau){ journal("Aucun vaisseau équipé.","alerte"); return; }
  const l = espaceLieu("epave");
  if(!surLieuEspace(l)){ journal(`Il faut être à ${espaceNom(l)} pour ça.`,"alerte"); return; }
  const c = coutReparateur();
  if(c <= 0){ journal("La coque est déjà intacte.","alerte"); return; }
  if((etat.credits||0) < c){ journal(`Il te faut ${c} ₡ pour cette réparation.`,"alerte"); return; }
  etat.credits -= c;
  const gagne = reparerPv(pvMax());
  journal(`Coque remise à neuf : +${gagne} PV (${pvVaisseau()}/${pvMax()}). −${c} ₡.`,"gain");
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  if(typeof majOrbite==="function") majOrbite();
  if(typeof afficher==="function") afficher();
}

/* Est-on à portée d'un lieu ? ⚠ Même logique que Silène : on arrive DANS le
   rayon, pas sur le pixel. `espaceRayon` existait déjà. */
/* v1.96 — et sur la CARTE où l'on est (voir CARTES_ESPACE, plus haut). */
function surLieuEspace(l){ return !!l && secteurDuLieu(l) === secteurEspaceIci() && _distEsp(posEspace(), {x:l.x, y:l.y}) <= espaceRayon(l); }
/* « au Perchoir » / « au Nid » : le point de repli de la carte d'ici. */
function _alaBaseTxt(){ const b = baseEspace(); const n = b ? espaceNom(b) : "la base";
  return (typeof aLieu === "function") ? aLieu(n) : "à " + n; }
/* Un lieu qui a un ÉCRAN (onglet) : sinon son arrivée se raconte dans le journal. */
function ongletLieuEspace(l){ return !!l && ["base","epave","asteroides","planete_chaude","planete_froide","e2_base","e2_oeil_piques"].includes(l.id); }   // v2.06 : le Fléau

/* ===========================================================
   SECOURS — v0.91
   ⚠ Un joueur sans vaisseau à Triptolème est BLOQUÉ HORS DE LA CARTE PRINCIPALE :
   il ne peut ni descendre, ni miner, ni cultiver, ni même mourir utilement.
   C'est une impasse, pas une difficulté. Le cas devient courant depuis que la
   Navette de réserve expire au bout de dix jours.
   Appel de détresse automatique : on redescend dans sa cité, on paie un
   forfait. ⚠ Forfait FIXE et non pourcentage — un pourcentage punit les riches
   et laisse indifférent le joueur sans réserve, qui est justement celui qu'on
   veut faire réfléchir avant de monter.
   ⚠ Si le joueur ne peut pas payer, il descend QUAND MÊME, solde à zéro.
   On ne laisse jamais personne coincé là-haut. */
const SECOURS_FRAIS = 200;

/* ⚠ LE SEUIL DÉPEND DU VAISSEAU, jamais d'un forfait. Une Navette se remplit
   avec du Biocarburant (320 ₡ les 20 L) et il lui faut 18 L : une unité suffit.
   Un Cargo brûle 108 L de raffiné (1 400 ₡ les 60 L) : il lui en faut DEUX,
   soit 2 800 ₡. Un seuil unique aurait laissé un pilote de Cargo coincé avec
   1 000 ₡ en poche, ce qui est précisément le cas qu'on cherche à fermer.
   On demande le prix au comptoir via `_prixBoutique()` plutôt que de recopier
   le barème : une règle de prix de plus serait une divergence de plus. */
function _prixPleinComptoir(carb, litresManquants){
  if(typeof BASE_BOUTIQUE === "undefined") return null;
  const ligne = BASE_BOUTIQUE.find(a => a.id === carb);
  if(!ligne) return null;
  const parUnite = (typeof CARBURANT_LITRES !== "undefined") ? (CARBURANT_LITRES[carb]||0) : 0;
  if(parUnite <= 0) return null;
  const prix = (typeof _prixBoutique === "function") ? _prixBoutique(ligne) : ligne.prix;
  return Math.ceil(litresManquants / parUnite) * prix;
}

/* Vrai si le joueur ne peut NI rentrer, NI faire le plein, NI en acheter un. */
function vaisseauSansRetour(){
  const c = coutSaut(); if(!c) return false;
  const auto = (typeof autonomieCarburant==="function") ? autonomieCarburant() : (etat.carburant||0);
  if(auto >= c.litres) return false;                       // il peut rentrer, ou se remplir depuis ses bidons
  const cout = _prixPleinComptoir(c.carb, c.litres - auto);
  if(cout == null) return true;                            // ce carburant ne se vend pas là-haut
  return (etat.credits||0) < cout;                         // il ne peut pas non plus l'acheter
}

async function secoursOrbite(){
  /* v1.56 — retour de l'autrice : posée sur Le Suaire, son vaisseau a PÉRIMÉ, et
     « Aucun vaisseau équipé » la bloquait au sol sans recours. Le secours vaut
     désormais AUSSI sur une sous-carte (La Braise, Le Suaire). */
  const enSurface = (typeof enSurfaceIci === "function") && enSurfaceIci();
  if(!enEspace() && !enSurface) return false;   // v1.96 : Cérès aussi
  const cloue = (typeof vaisseauCloue==="function") && vaisseauCloue();
  /* v0.92 — TROISIÈME CAS : le vaisseau est intact mais à sec, sans bidon et
     sans de quoi en acheter. Le secours n'existait que pour le vaisseau absent
     ou cloué : un pilote sans carburant restait en haut sans aucun recours, et
     sans revenu possible puisqu'il ne pouvait plus voler. */
  const aSec = !!etat.vaisseau && !cloue && vaisseauSansRetour();
  if(etat.vaisseau && !cloue && !aSec) return false;       // il lui reste un moyen de rentrer
  /* ⚠ ORDRE AVEC LA MORT. Un joueur mort est derrière un écran bloquant : le
     redescendre pendant ce temps contredirait la règle « mourir à Triptolème ne
     fait pas descendre », et il se réveillerait chez lui sans avoir rien payé.
     On attend donc la résurrection — `ressusciter` rappelle le secours juste
     après, et il joue à ce moment-là, dans le bon ordre : on se réveille à la
     base, PUIS on est rapatrié. */
  if(typeof _mortInfo !== "undefined" && _mortInfo && _mortInfo.mort) return false;
  /* ⚠ v0.92 — LE REMORQUAGE À SEC N'A PAS LE MÊME TARIF, et ce n'est pas une
     punition : c'est ce qui l'empêche de devenir un taxi. Redescendre un Cargo
     brûle 108 L de raffiné, soit ~2 500 ₡ ; à 200 ₡ forfaitaires, tout le monde
     serait arrivé à sec exprès et le carburant n'aurait plus servi à rien.
     On facture donc le plein qu'il n'a pas pu payer — et comme le secours ne se
     déclenche QUE si ses crédits sont inférieurs à ce prix, cela revient à
     prendre ce qu'il a. Il descend quoi qu'il arrive, même à zéro : la règle
     d'or est intacte, l'arbitrage ne l'est plus.
     ⚠ Un FORFAIT ne peut pas marcher, quel que soit son montant : bas, il offre
     le taxi ; haut, il laisse un pilote de Navette avec 300 ₡ coincé en haut. */
  const frais  = aSec ? Math.max(0, etat.credits||0) : SECOURS_FRAIS;
  const du     = Math.min(frais, Math.max(0, etat.credits||0));
  etat.credits = Math.max(0, (etat.credits||0) - frais);
  const impaye = du < frais ? " Tu n'avais pas de quoi payer : tu leur dois le reste." : "";

  /* ⚠ DEUX DESTINATIONS, et la différence compte. Un vaisseau CLOUÉ ramené au
     sol ne pourrait plus jamais remonter — il n'y a pas de réparateur sur
     Silène. On remorque donc jusqu'au PERCHOIR, avec une navigabilité minimale
     rendue, de quoi rejoindre La Carcasse. Sans vaisseau du tout, en revanche,
     il n'y a plus rien à faire là-haut : retour au sol. */
  /* v1.96 — CÉRÈS (choix A de l'autrice, 28/10, comme Ancolie, K41). Un vaisseau
     CLOUÉ y est remorqué jusqu'au Nid (K93), avec la même navigabilité minimale :
     de quoi rejoindre la Gorge et La Carcasse. Sans vaisseau, ou à sec sans de quoi
     racheter du carburant : évacuation d'urgence, chez soi, sur Silène. ⚠ Jamais
     « un cargo de passage » : aucun vaisseau ne vient de Cérès (K79). */
  if(enCeres()){
    if(cloue){
      const n = baseEspace("ceres");
      if(n) etat.posEspace = { x:n.x, y:n.y };
      if(typeof reparerPv==="function") reparerPv(Math.ceil(pvMax()*PV_REMORQUAGE));
      journal(`Appel de détresse : on te remorque jusqu'au Nid et on te rend juste de quoi voler. −${SECOURS_FRAIS} ₡.${impaye} Fais réparer la coque pour de bon, à La Carcasse.`,"alerte","voyage");
    } else {
      const p = _villeDeMaFaction();
      etat.secteur = "silene";
      etat.pos = { x:p.x, y:p.y };
      journal(aSec
        ? `Réservoir à sec, plus un bidon et pas de quoi en acheter. Évacuation d'urgence : tu reprends tes esprits chez toi, sur Silène. ${du > 0 ? `Elle te prend tout ce qu'il te restait — ${du} ₡.` : "Tu n'avais rien à donner."}`
        : `Plus de vaisseau pour repasser la Gorge. Évacuation d'urgence : tu reprends tes esprits chez toi, sur Silène. −${SECOURS_FRAIS} ₡ de frais de secours.${impaye}`,"alerte","voyage");
      if(typeof fermerOrbite==="function") fermerOrbite();
    }
    if(typeof sauverMaintenant==="function") await sauverMaintenant();
    majApresDeplacement();
    return true;
  }
  if(cloue){
    if(enSurface){ etat.secteur = "ecart"; etat.surface = null; if(typeof fermerCarteBraise==="function") fermerCarteBraise(); }   // v1.56
    const b = espaceLieu("base");
    if(b) etat.posEspace = { x:b.x, y:b.y };
    if(typeof reparerPv==="function") reparerPv(Math.ceil(pvMax()*PV_REMORQUAGE));
    journal(`Appel de détresse : on te remorque jusqu'au ${b?b.nom:"Perchoir"} et on te rend juste de quoi voler. −${SECOURS_FRAIS} ₡.${impaye} Fais réparer la coque pour de bon.`,"alerte","voyage");
    if(typeof sauverMaintenant==="function") await sauverMaintenant();
    majApresDeplacement();
    return true;
  }

  const p = _villeDeMaFaction();
  if(enSurface){ etat.surface = null; if(typeof fermerCarteBraise==="function") fermerCarteBraise(); }   // v1.56
  etat.secteur = "silene";
  etat.pos = { x:p.x, y:p.y };
  journal(aSec
    ? `Réservoir à sec, plus un bidon et pas de quoi en acheter : un cargo de passage te prend en remorque. ${du > 0 ? `Le remorquage te prend tout ce qu'il te restait — ${du} ₡.` : "Tu n'avais rien à leur donner ; ils te redescendent quand même."}`
    : `Appel de détresse : un cargo de passage te redescend chez toi. −${SECOURS_FRAIS} ₡ de frais de secours.${impaye}`,"alerte","voyage");
  if(typeof fermerOrbite==="function") fermerOrbite();
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  majApresDeplacement();
  return true;
}

/* v1.85 — un lieu `verrou:"q20"` (la Gorge) s'ouvre SEULEMENT pendant la
   première étape de Q20 ; il se referme ensuite jusqu'à l'arc suivant (K27).
   v1.96 — verrou "gorge" (`gorgeOuverte`) : Q20 étape 1 comme avant ; toute étape
   de quête marquée `gorge:true` (Q31 n'aura qu'à le déclarer) ; puis pour de bon
   une fois Cérès connue (`etat.ceres`, posé par la récompense de Q31). Un autre
   verrou reste l'identifiant d'une quête, ouverte à sa première étape. */
function gorgeOuverte(){
  const a = (typeof queteActive==="function") ? queteActive() : null;
  if(a && a.id === "q20" && a.etape === 0) return true;
  const e = (typeof etapeActive==="function") ? etapeActive() : null;
  if(a && !a._resolu && e && e.gorge === true) return true;
  return ceresConnue();
}
function lieuOuvert(l){
  if(!l || !l.verrou) return true;
  if(l.verrou === "gorge") return gorgeOuverte();
  const a = (typeof queteActive==="function") ? queteActive() : null;
  return !!(a && a.id === l.verrou && a.etape === 0);
}
/* Ce que dit la ligne « usage » d'un lieu : celle de la Gorge suit son verrou. */
function usageLieu(l){
  if(!l) return "";
  if(l.id === "trou_noir") return gorgeOuverte() ? (ceresConnue() ? "Passage vers Cérès" : "Ouverte") : "Verrouillé";
  return l.usage || "";
}

/* ===========================================================
   v1.96 — PASSER LA GORGE (K75) : Triptolème ⇄ Cérès.
   On ne passe que depuis l'une de ses deux bouches (le trou noir de Triptolème,
   `trou_noir` ; l'autre bouche, `e2_gorge`). Coût : un saut (carburant + énergie,
   comme tout changement de carte). Comme partout, on ne part pas sans de quoi
   revenir : à l'aller, deux sauts (le retour se paie aussi) ; au retour, le saut
   et le trajet jusqu'au Perchoir. Arrivée : sur l'autre bouche.
   Aucune quête ici : Q31 ouvrira la route (`etat.ceres`).
   =========================================================== */
function surGorgeTriptoleme(){ return enEcart() && surLieuEspace(espaceLieu("trou_noir")); }
function surGorgeCeres(){ return enCeres() && surLieuEspace(espaceLieu("e2_gorge")); }
async function passerLaGorge(){
  if(!enEcart()) return;
  if(!ceresConnue() || !gorgeOuverte()){ journal("La Gorge est fermée. Rien ne passe, pas même la lumière.","alerte","voyage"); return; }
  if(!surGorgeTriptoleme()){ journal("Pour passer la Gorge, rejoins-la d'abord sur la carte de Triptolème.","alerte","voyage"); return; }
  if(typeof vaisseauCloue==="function" && vaisseauCloue()){ journal("Coque hors service : tu n'entreras pas dans la Gorge comme ça.","alerte"); return; }
  const cs = coutSaut(); if(!cs){ journal("Aucun vaisseau équipé.","alerte"); return; }
  const auto = (typeof autonomieCarburant==="function") ? autonomieCarburant() : (etat.carburant||0);
  if(auto < 2*cs.litres){
    journal(`Passage refusé : il faut de quoi revenir. Passer la Gorge et la repasser coûte ${2*cs.litres} L, tu n'as que ${Math.round(auto)} L en tout (réservoir + bidons).`,"alerte","voyage");
    return;
  }
  if(!await _payerSaut("La Gorge", cs)) return;
  const g = espaceLieu("e2_gorge");
  etat.secteur = "ceres";
  etat.posEspace = g ? { x:g.x, y:g.y } : { x:ESPACE_MONDE.w/2, y:ESPACE_MONDE.h/2 };
  journal("Tu entres dans la Gorge. Le noir, la pression, la coque qui chante. Puis tout lâche d'un coup, et tu ressors de l'autre côté, au milieu d'étoiles que tu ne connais pas. Secteur Cérès.","gain","voyage");
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  majApresDeplacement();
  ouvrirOrbite();
}
async function repasserLaGorge(){
  if(!enCeres()) return;
  if(!surGorgeCeres()){ journal("Pour rentrer à Triptolème, rejoins d'abord la Gorge, sur la carte de Cérès.","alerte","voyage"); return; }
  if(typeof vaisseauCloue==="function" && vaisseauCloue()){ journal("Coque hors service : tu n'entreras pas dans la Gorge comme ça.","alerte"); return; }
  const cs = coutSaut(); if(!cs){ journal("Aucun vaisseau équipé.","alerte"); return; }
  const t = espaceLieu("trou_noir"), b = espaceLieu("base");
  const versPerchoir = (t && b) ? coutVol({ x:b.x, y:b.y }, { x:t.x, y:t.y }) : null;
  const besoin = cs.litres + (versPerchoir ? versPerchoir.litres : 0);
  const auto = (typeof autonomieCarburant==="function") ? autonomieCarburant() : (etat.carburant||0);
  if(auto < besoin){
    journal(`Passage refusé : de l'autre côté, il faudra encore rejoindre le Perchoir. La Gorge puis le Perchoir coûtent ${besoin} L, tu n'as que ${Math.round(auto)} L en tout. Le Nid vend du carburant.`,"alerte","voyage");
    return;
  }
  if(!await _payerSaut("La Gorge", cs)) return;
  etat.secteur = "ecart";
  etat.posEspace = t ? { x:t.x, y:t.y } : { x:ESPACE_MONDE.w/2, y:ESPACE_MONDE.h/2 };
  journal(`La Gorge te reprend, te serre, et te rend à Triptolème. Le Perchoir est là où tu l'as laissé.`,"gain","voyage");
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  majApresDeplacement();
  ouvrirOrbite();
}

/* Conditions d'accès */
function orbiteDebloquee(){ return etat.espace1===true && !!etat.vaisseau; }

/* v1.93t — LES TROIS BOUTONS, TOUJOURS (demande de l'autrice). « Carte de Silène »,
   « Triptolème », « Ancolie » restent affichés partout (dès que la route est connue) :
   celui de la carte où l'on est ouvre sa carte ; les deux autres y partent — mais on ne
   change de carte que depuis une VILLE de Silène, le PERCHOIR (Triptolème) ou la STATION
   (Ancolie). Ailleurs, le bouton reste visible, grisé, et dit d'où l'on part.
   Routes neuves : Triptolème ⇄ Ancolie (Perchoir ⇄ station), un saut. La Braise et Le
   Suaire ne changent pas : on en DÉCOLLE (bouton de leur carte) pour rejoindre l'orbite.
   Plus besoin des « Rentrer / Redescendre sur Silène » des cartes : retirés. */
function _lieuNav(){
  if(typeof enEcart === "function" && enEcart()) return "ecart";
  if(enCeres()) return "ceres";   // v1.96
  if(etat.secteur === "ancolie") return "ancolie";
  if(typeof enSurface === "function" && enSurface()) return "autre";   // La Braise, Le Suaire
  return "silene";
}
function _txtCout(c){ return c ? `${c.litres} L carburant · ${c.energie} % énergie` : "en vaisseau"; }
function _boutonNav(sel, titre, cout, dispo){
  const b = document.querySelector(sel); if(!b) return;
  const t = b.querySelector("span"); if(t) t.textContent = titre;
  const k = b.querySelector(".cout"); if(k) k.textContent = cout;
  b.disabled = false; b.style.opacity = dispo ? "" : ".55";
}
function _montrer(sel, oui){ const b = document.querySelector(sel); if(b){ b.hidden = !oui; b.style.display = oui ? "" : "none"; } }
function majBoutonOrbite(){
  const ici = _lieuNav(), surf = ici === "ancolie" || ici === "autre";
  /* La Braise / Le Suaire : la carte de la planète (on remonte par le vaisseau). */
  const bb = document.querySelector("#ouvrir-braise");
  if(bb){ const autre = ici === "autre"; bb.hidden = !autre; bb.style.display = autre ? "" : "none";
    const c = (typeof surfaceCfg === "function") ? surfaceCfg() : null; const sp = bb.querySelector("span");
    if(sp && c) sp.textContent = `Carte — ${c.nom}`; }
  const verrou = (typeof verrouMaar === "function" && verrouMaar());
  const base = (typeof surBase === "function") && surBase();
  const station = (typeof aLaStation === "function") && ici === "ancolie" && aLaStation();
  const csT = coutSaut(), csA = (typeof coutSautSurface === "function" && typeof SURFACES !== "undefined") ? coutSautSurface(SURFACES.ancolie) : null;
  const decolle = "décolle d'abord";
  /* v1.96 — CÉRÈS : on n'en sort que par la Gorge, vers Triptolème. Le bouton de
     Triptolème y passe (depuis la Gorge) ; Silène et Ancolie restent grisés. */
  const okC = ceresConnue() && !!etat.vaisseau; _montrer("#ouvrir-ceres", okC || ici === "ceres");
  if(ici === "ceres"){
    const gorge = surGorgeCeres();
    _boutonNav("#ouvrir-carte", "Partir pour Silène", "par la Gorge", false);
    _montrer("#ouvrir-orbite", true);
    _boutonNav("#ouvrir-orbite", `Partir pour ${SECTEUR_NOM}`, gorge ? `la Gorge · ${_txtCout(csT)}` : "depuis la Gorge", gorge);
    const okA2 = (typeof ancolieConnue === "function") && ancolieConnue() && !!etat.vaisseau; _montrer("#ouvrir-ancolie", okA2);
    if(okA2) _boutonNav("#ouvrir-ancolie", "Partir pour Ancolie", "par la Gorge", false);
    _boutonNav("#ouvrir-ceres", "Carte de Cérès", "tu y es", true);
    return;
  }
  if(okC){
    if(ici === "ecart"){ const g = surGorgeTriptoleme(); _boutonNav("#ouvrir-ceres", "Partir pour Cérès", g ? `la Gorge · ${_txtCout(csT)}` : "depuis la Gorge", g); }
    else _boutonNav("#ouvrir-ceres", "Partir pour Cérès", "par la Gorge", false);
  }
  // Silène
  if(ici === "silene") _boutonNav("#ouvrir-carte", "Carte de Silène", "se déplacer", true);
  else if(ici === "ecart") _boutonNav("#ouvrir-carte", "Partir pour Silène", base ? _txtCout(csT) : "depuis le Perchoir", base);
  else if(ici === "ancolie") _boutonNav("#ouvrir-carte", "Partir pour Silène", station ? _txtCout(csA) : "depuis la station", station);
  else _boutonNav("#ouvrir-carte", "Partir pour Silène", decolle, false);
  // Triptolème
  const okT = orbiteDebloquee(); _montrer("#ouvrir-orbite", okT);
  if(okT){
    if(ici === "ecart") _boutonNav("#ouvrir-orbite", `Carte de ${SECTEUR_NOM}`, "tu y es", true);
    else if(ici === "autre") _boutonNav("#ouvrir-orbite", `Carte de ${SECTEUR_NOM}`, decolle, false);
    else if(verrou) _boutonNav("#ouvrir-orbite", `Partir pour ${SECTEUR_NOM}`, "calculateur en panne", false);
    else if(ici === "ancolie") _boutonNav("#ouvrir-orbite", `Partir pour ${SECTEUR_NOM}`, station ? _txtCout(csT) : "depuis la station", station);
    else _boutonNav("#ouvrir-orbite", `Partir pour ${SECTEUR_NOM}`, _txtCout(csT), true);
  }
  // Ancolie
  const okA = (typeof ancolieConnue === "function") && ancolieConnue() && !!etat.vaisseau; _montrer("#ouvrir-ancolie", okA);
  if(okA){
    if(ici === "ancolie") _boutonNav("#ouvrir-ancolie", "Carte d'Ancolie", "tu y es", true);
    else if(ici === "ecart") _boutonNav("#ouvrir-ancolie", "Partir pour Ancolie", base ? _txtCout(csT) : "depuis le Perchoir", base);
    else if(ici === "autre") _boutonNav("#ouvrir-ancolie", "Partir pour Ancolie", decolle, false);
    else _boutonNav("#ouvrir-ancolie", "Partir pour Ancolie", _txtCout(csA), true);
  }
}
const NAV_DECOLLE = "Décolle d'abord : ton vaisseau t'attend à l'aire d'atterrissage, et c'est l'orbite qui mène ailleurs.";
const NAV_CERES = "Cérès ne communique avec rien d'autre que Triptolème : repasse d'abord la Gorge.";
function boutonSilene(){
  const ici = _lieuNav();
  if(ici === "ceres"){ journal(NAV_CERES, "alerte", "voyage"); return; }   // v1.96
  if(ici === "silene"){ if(typeof ouvrirCarte === "function") ouvrirCarte(); return; }
  if(ici === "ecart"){ revenirVersSilene(); return; }
  if(ici === "ancolie"){ if(typeof rentrerDepuisAncolie === "function") rentrerDepuisAncolie(); return; }
  journal(NAV_DECOLLE, "alerte", "voyage");
}
function boutonTriptoleme(){
  const ici = _lieuNav();
  if(ici === "ceres"){ repasserLaGorge(); return; }   // v1.96 : par la Gorge
  if(ici === "ancolie"){ if(typeof partirEcartDepuisAncolie === "function") partirEcartDepuisAncolie(); return; }
  if(ici === "autre"){ journal(NAV_DECOLLE, "alerte", "voyage"); return; }
  partirVersEcart();   // depuis Silène ; en orbite, ouvre la carte
}
function boutonAncolie(){
  const ici = _lieuNav();
  if(ici === "ceres"){ journal(NAV_CERES, "alerte", "voyage"); return; }   // v1.96
  if(ici === "ancolie"){ if(typeof ouvrirCarteBraise === "function") ouvrirCarteBraise(); return; }
  if(ici === "ecart"){ if(typeof partirAncolieDepuisEcart === "function") partirAncolieDepuisEcart(); return; }
  if(ici === "autre"){ journal(NAV_DECOLLE, "alerte", "voyage"); return; }
  if(typeof partirVersAncolie === "function") partirVersAncolie();
}
/* v1.96 — le quatrième bouton : Cérès. On n'y entre que par la Gorge (K75). */
function boutonCeres(){
  const ici = _lieuNav();
  if(ici === "ceres"){ ouvrirOrbite(); return; }
  if(ici === "ecart"){ passerLaGorge(); return; }
  journal("Cérès est de l'autre côté de la Gorge, dans le secteur Triptolème : monte d'abord en orbite, puis rejoins la Gorge.", "alerte", "voyage");
}

/* ⚠ v0.83 — les destinations dessinées « à la main » (rectangles, cercles)
   sont remplacées par les IMAGES de js/espace-data.js. Le décor n'est pas
   cliquable, le leurre l'est mais ne mène à rien. */
function _espaceHtml(l){
  /* ⚠ v0.85 — en PLACEMENT, tout doit s'attraper, décor compris : `decor` porte
     pointer-events:none pour le jeu, ce qui le rendait aussi indéplaçable dans
     l'outil (astéroïdes, satellites, petites planètes). */
  /* ⚠ v0.91 — SPOIL DE CURSEUR. Seuls les lieux visitables portaient
     `cursor:pointer` : il suffisait de balayer la carte à la souris pour savoir
     lesquels mènent quelque part, sans rien avoir découvert. Tout répond
     désormais au survol de la même façon ; c'est le CLIC qui distingue, et
     cliquer est un acte, pas un balayage. */
  const clic = true;
  const r = espaceRayon(l);
  const demi = l.t/2;
  let h = `<g class="orb-lieu${clic?" cliquable":""}${(_placementSel&&_placementSel.id===l.id)?" sel":""}"`
        + (clic ? ` data-lieu="${l.id}" style="cursor:pointer"` : ` style="pointer-events:none"`)
        + (_placementActif ? ` data-plac="${l.id}"` : ``) + `>`;
  if(_placementActif){
    h += `<circle cx="${l.x}" cy="${l.y}" r="${r}" fill="none" stroke="#ff8a3d" stroke-opacity=".5" stroke-dasharray="6 6"/>`;
  }
  if(l.halo){
    /* Deux cercles : un voile large et un anneau net. Le voile suffit à faire
       ressortir une image sombre sans la masquer. */
    const rh = l.t*0.52;
    /* v1.93t — retour de l'autrice : blanc et en pointillé, comme la station d'Ancolie. */
    h += `<circle cx="${l.x}" cy="${l.y}" r="${rh}" fill="#ffffff14" stroke="${l.halo}" stroke-opacity=".85" stroke-width="3" stroke-dasharray="8 10"/>`;
  }
  h += `<image href="${carteEspace(secteurDuLieu(l)).img}${l.img}" x="${l.x-demi}" y="${l.y-demi}" width="${l.t}" height="${l.t}" preserveAspectRatio="xMidYMid meet"/>`;
  /* ⚠ v0.84 — ZONE DE SAISIE. Une image de 109 u est minuscule à l'écran : on
     n'arrivait ni à la sélectionner ni à la déplacer. Ce carré invisible, d'au
     moins 160 u, se superpose à l'objet et reçoit les clics. En jeu, il sert
     aussi de cible pour les petits lieux, au doigt comme à la souris. */
  const zone = Math.max(l.t, 160), zd = zone/2;
  /* Le liseré bleu ne sert QU'À L'OUTIL : en jeu, la zone reste invisible. */
  h += `<rect x="${l.x-zd}" y="${l.y-zd}" width="${zone}" height="${zone}" fill="transparent"${_placementActif?' stroke="#5aa8e6" stroke-opacity=".25"':''}/>`;
  /* ⚠ v0.85 — AUCUNE étiquette sur la carte, même en placement : les images se
     suffisent, et les textes se chevauchaient. Le nom de l'objet sélectionné
     s'affiche dans la barre du mode placement ; en jeu, il apparaît au clic
     dans le bandeau sous la carte. */
  return h + `</g>`;
}

function majOrbite(){
  const svg=document.querySelector("#carte-orbite"); if(!svg) return;
  /* v1.96 — la carte d'ICI : Triptolème, ou Cérès si l'on y est. L'outil de
     placement (console dev) ne connaît que Triptolème : il la garde toujours. */
  const C = _placementActif ? CARTES_ESPACE.ecart : carteEspace();
  const M = C.monde(), LIEUX = C.lieux();
  const tt = document.querySelector("#orbite-titre"); if(tt) tt.textContent = `Secteur ${C.nom}`;
  svg.setAttribute("viewBox",`0 0 ${M.w} ${M.h}`);
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");

  const barre=document.querySelector("#orbite-barre-plac");
  if(barre) barre.innerHTML = (typeof placementBarreHtml==="function") ? placementBarreHtml() : "";

  let html = `<image href="${C.fond()}" x="0" y="0" width="${M.w}" height="${M.h}" preserveAspectRatio="none"/>`;
  if(typeof placementGrilleHtml==="function") html += placementGrilleHtml();
  if(_placementActif){
    /* ⚠ v0.85 — en placement, TOUT est attrapable : on dessine du plus grand au
       plus petit, pour qu'une grosse zone de saisie ne recouvre jamais un petit
       objet (une planète de 406 u cachait l'astéroïde voisin). */
    LIEUX.slice().sort((a,b)=>b.t-a.t).forEach(l=>{ html += _espaceHtml(l); });
  } else {
    // En jeu : décor d'abord, les lieux passent au-dessus.
    LIEUX.filter(l=>l.type==="decor").forEach(l=>{ html += _espaceHtml(l); });
    LIEUX.filter(l=>l.type!=="decor").forEach(l=>{ html += _espaceHtml(l); });
  }
  /* v0.88 — marqueur du joueur, comme sur Silène (carte.js) : sans lui, on ne
     sait pas où l'on est dans le secteur. Dessiné EN DERNIER, donc au-dessus. */
  if(!_placementActif && typeof marqueursQueteEspaceHtml==="function") html += marqueursQueteEspaceHtml();   // v0.97
  if(etat.posEspace && !_placementActif){
    const col = (FACTIONS.find(f=>f.id===etat.faction)||{}).couleur || "#ff9a44";   // même source que carte.js
    const px = etat.posEspace.x, py = etat.posEspace.y;
    html += `<circle cx="${px}" cy="${py}" r="34" fill="none" stroke="${col}" stroke-opacity=".35" stroke-width="2"/>`
          + `<circle cx="${px}" cy="${py}" r="17" fill="#0a1730" stroke="${col}" stroke-width="4"/>`
          + `<circle cx="${px}" cy="${py}" r="7" fill="${col}"/>`;
  }
  svg.innerHTML = html;
  if(_viseeEsp) _viseeEsp.redessiner();   // v1.34e : la visée survit au redessin

  /* ⚠ v0.91 — DÉLÉGATION, ET SURTOUT PAS D'ÉCOUTEUR SUR LES BOUTONS.
     L'aperçu au survol remplace le contenu du bandeau et le RESTAURE via
     `innerHTML` : le bouton réapparaissait identique mais SANS son écouteur,
     donc mort. Un seul écouteur posé une fois sur le bandeau, qui lit
     `data-orb`, survit à n'importe quel remplacement de contenu. */
  /* Clic dans le vide : on y va. ⚠ Posé sur le SVG, donc après les objets —
     un clic sur un objet ne remonte pas jusqu'ici (il s'arrête sur son <g>). */
  if(!svg.dataset.branche){
    svg.dataset.branche = "1";
    svg.addEventListener("click", e=>{
      if(_placementActif || !enEspace()) return;   // v1.96 : Cérès aussi
      if(e.target.closest("[data-lieu]")) return;      // un objet : sa fiche s'ouvre
      const p = _coordEspace(svg, e); if(!p) return;
      _orbSel = null;             // v1.88f : un toucher dans le vide oublie la planète choisie
      _viseeEsp.clic(p.x, p.y);   // v1.34e : au doigt, visée d'abord
    });
    svg.addEventListener("pointerdown", e => { _orbPointeur = e.pointerType || "mouse"; });   // v1.88f
    _viseeEsp = viseeTactile(svg, {
      cout: (x, y) => { const k = (typeof coutVol === "function") ? coutVol({ x, y }) : null;
                        return k ? `−${k.energie} % én. · ${k.litres} L` : null; },
      partir: (x, y) => volVersPoint({ x, y })
    });
  }

  /* ⚠ v0.91 — RÉINITIALISATION. Le bandeau gardait le contenu du dernier
     survol, donc un coût calculé depuis une position qu'on avait quittée :
     « La Carcasse — 11 % · 11 L » restait affiché après s'en être éloigné.
     Chaque rendu de la carte le remet à son texte d'accueil. */
  const zi = document.querySelector("#orbite-info");
  if(zi){
    _orbInfoFige = null; _orbSel = null;   // v1.88f
    zi.innerHTML = `Clique un point de la carte pour t'y rendre. <span class="itip-gris">${C.sortie}</span>`;   // v1.96
  }
  if(zi && !zi.dataset.branche){
    zi.dataset.branche = "1";
    zi.addEventListener("click", e=>{
      const b = e.target.closest("[data-orb]"); if(!b || b.disabled) return;
      if(b.dataset.orb === "voler"){ const l = espaceLieu(b.dataset.id); if(l) volVers(l); }
      else if(b.dataset.orb === "reparer") reparerChezReparateur();
      else if(b.dataset.orb === "miner")   minerGravier();
    });
  }

  /* v0.91 — APERÇU AU SURVOL, équivalent de `_apercuCout` sur Silène. Le prix
     d'un vol doit se lire en balayant la carte, pas en cliquant partout.
     ⚠ On réutilise le bandeau `#orbite-info` : au survol il affiche le coût, et
     il RESTAURE au départ de la souris ce que le dernier clic y avait mis. */
  svg.querySelectorAll("[data-lieu]").forEach(g=>{
    g.addEventListener("mouseenter", ()=>{
      if(_placementActif || !enEspace()) return;
      const l = espaceLieu(g.dataset.lieu); if(!l) return;
      const z = document.querySelector("#orbite-info"); if(!z) return;
      if(_orbInfoFige === null) _orbInfoFige = z.innerHTML;
      z.innerHTML = _apercuVol(l);
    });
    g.addEventListener("mouseleave", ()=>{
      const z = document.querySelector("#orbite-info");
      if(z && _orbInfoFige !== null){ z.innerHTML = _orbInfoFige; _orbInfoFige = null; }
    });
    g.addEventListener("click", ()=>{
      _orbInfoFige = null;                     // le clic remplace l'aperçu
      if(_placementActif) return;                 // en placement, le clic sert à glisser
      const l = espaceLieu(g.dataset.lieu); if(!l) return;
      const z=document.querySelector("#orbite-info"); if(!z) return;
      /* v1.88f — AU DOIGT (iPad, téléphone), comme sur Silène : le premier toucher sur
         un objet montre son nom et le coût du vol ; le second, sur le même objet, y
         emmène. À la souris, rien ne change (le survol montre déjà le nom). */
      if(_orbPointeur === "touch" && enEspace() && !surLieuEspace(l) && !(l.verrou && !lieuOuvert(l)) && _orbSel !== l.id){
        _orbSel = l.id; if(_viseeEsp) _viseeEsp.effacer();
        z.innerHTML = `${_apercuVol(l)}<br><span class="itip-gris">Touche-le encore pour y aller.</span>`;
        return;
      }
      _orbSel = null;
      /* v1.01 — LE DÉCOR SE VISITE. Avant, il répondait « rien qui mérite le
         carburant d'un détour » : on n'y allait jamais, et on n'y dépensait rien.
         Désormais on y vole comme vers un lieu (même coût, mêmes sondes) et on
         constate sur place qu'il n'y a rien — pour l'instant (`ici`, espace-data). */
      if(l.type === "decor"){
        if(surLieuEspace(l)){ z.innerHTML = `<b>${espaceNom(l)}</b><br><span class="itip-gris">Tu y es. ${l.ici||"Rien, pour l'instant."}</span>`; return; }
        if(!enEspace()){ z.innerHTML = `<b>${espaceNom(l)}</b><br><span class="itip-gris">${l.desc||"Décolle pour t'y rendre."}</span>`; return; }
        volVers(l); return;
      }
      if(l.verrou && !lieuOuvert(l)){
        z.innerHTML = `<b>${espaceNom(l)}</b> — <span style="color:#ff6b6b">verrouillé</span>.<br><span class="itip-gris">${l.desc}</span>`;
        return;
      }
      /* v0.91 — le bandeau annonce le coût du vol et propose de partir.
         ⚠ Le bouton n'apparaît QUE si l'on est à Triptolème : depuis Silène, la
         carte spatiale se consulte mais ne se parcourt pas. */
      /* ⚠ v0.91 — AUCUN BOUTON DANS CE BANDEAU. Il est à hauteur fixe : une
         ligne de trop ne se rogne pas, elle DISPARAÎT, et le bouton avec.
         Le clic sur un objet EMMÈNE, comme sur Silène et comme le vol libre ;
         les services d'un lieu vivent dans son onglet (Le Garage, Le Gisement),
         qui a la place de respirer. Ici : uniquement de l'information. */
      const us = usageLieu(l);   // v1.96 : la Gorge dit si elle est ouverte
      if(surLieuEspace(l)){
        /* v1.96 — un lieu SANS onglet (les deux bouches de la Gorge) dit plutôt quoi
           faire ici ; les autres renvoient à leur onglet, comme avant. */
        const g = (l.id === "trou_noir" && ceresConnue() && gorgeOuverte()) ? "« Partir pour Cérès », sous la carte, te fait passer."
                : (l.id === "e2_gorge") ? "« Partir pour Triptolème », sous la carte, te fait repasser."
                : (ongletLieuEspace(l) || !enCeres()) ? "Ferme la carte : son onglet t'attend." : (l.ici || l.desc || "");
        z.innerHTML = `<b>${espaceNom(l)}</b>${us?` — ${us}`:""}<br><span class="itip-gris">Tu y es. ${l.type==="decor"?"Rien à y faire.":g}</span>`;
        return;
      }
      if(!enEspace()){
        z.innerHTML = `<b>${espaceNom(l)}</b>${us?` — ${us}`:""}<br><span class="itip-gris">${l.desc||"Décolle pour t'y rendre."}</span>`;
        return;
      }
      volVers(l);
    });
  });

  if(typeof placementBrancher==="function") placementBrancher(svg);

  const br=document.querySelector("#orbite-retour");   // v1.93t : retiré (le bouton « Partir pour Silène » du panneau fait la même chose)
  if(br){ br.hidden = true; br.style.display = "none"; }
  if(false){
    const cs=coutSaut();
    if(enEcart() && cs){
      const alaBase = surLaBase();
      br.disabled = !alaBase;
      br.textContent = alaBase
        ? `Redescendre sur Silène — ${cs.litres} L carburant, ${cs.energie} % énergie`
        : `Redescendre — rejoins d'abord la base`;
      br.title = alaBase
        ? `Il te reste ${Math.round(etat.carburant||0)}/${cs.reservoir} L.`
        : RENTREE_RP; } }

  /* v0.91 — le sous-titre dit OÙ L'ON EST, comme sur Silène (« La Toundra —
     ta zone de faction »). Le vaisseau a déjà sa fiche ; savoir où l'on se
     trouve dans le secteur est bien plus utile en un coup d'œil. */
  const nav=document.querySelector("#orbite-vaisseau");
  if(nav){
    if(!enEspace()){ nav.textContent = "— vu depuis Silène"; }
    else {
      const ici = LIEUX.find(l => l.type !== "decor" && surLieuEspace(l));
      nav.textContent = ici ? `— ${espaceNom(ici)}` : "— en vol";
    }
  }
}

/* p_forcer : réservé au mode placement (outil de dev), qui doit pouvoir
   ouvrir la carte sans posséder ni vaisseau ni route. */
function ouvrirOrbite(p_forcer){
  if(!p_forcer && !orbiteDebloquee()){
    journal(etat.espace1 ? "Il te faut un vaisseau pour rejoindre l'orbite." : "Tu ne connais pas encore de route vers l'orbite.","alerte");
    return;
  }
  document.querySelector("#modale-orbite").classList.add("ouverte");
  majOrbite();
}
function fermerOrbite(){ document.querySelector("#modale-orbite").classList.remove("ouverte"); if(_viseeEsp) _viseeEsp.effacer(); }   // v1.34f
