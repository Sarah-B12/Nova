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
   joueur sur la Base de l'Écart, le retour le repose dans SA cité.

   ⚠ Le serveur, lui, ne connaît que pos_x / pos_y : pour lui, un joueur parti
   en orbite est encore là où il a décollé (donc en ville : air respirable,
   présent en expédition). À traiter côté SQL avant l'ouverture — voir
   PASSATION. En attendant, le retour repose bien le joueur dans sa cité, donc
   la position reste cohérente au sol. */
/* ⚠ v0.91 — « L'Écart » servait à la fois de nom de SECTEUR et de nom de BASE,
   ce que le lore contredit : le secteur s'appelle Nielle (LORE_Corporation §4)
   et « L'Écart » n'était que le nom courant de la base — devenue Le Perchoir.
   ⚠ L'identifiant technique ne change PAS : `profils.secteur` vaut toujours
   'ecart', et `enEcart()` garde son nom. Seuls les textes bougent. */
const SECTEUR_NOM = "Nielle";
const ECART_NOM   = SECTEUR_NOM;   // ancien nom, conservé pour ne rien casser

/* Coût du saut Silène ⇄ L'Écart. C'est une SORTIE D'ATMOSPHÈRE, pas un vol
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
  return { litres: Math.ceil(SAUT_UNITES * (v.conso||1) * ((typeof malusCarburant==="function")?malusCarburant():1)),
           energie: SAUT_ENERGIE + (v.energie||0) * 2,
           carb: v.carb, reservoir: v.reservoir, nom: v.nom };
}
function _texteSaut(c){
  return `${c.litres} L de ${(typeof item==="function" && item(c.carb)) ? item(c.carb).nom : "carburant"} et ${c.energie} % d'énergie`;
}

function enEcart(){ return etat.secteur === "ecart"; }

/* Sur la Base de l'Écart : c'est elle qui ouvre les services (auberge,
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
async function _payerSaut(quoi){
  const c = coutSaut();
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
  if(typeof villeActuelle==="function" && !villeActuelle()){
    journal("On ne décolle pas depuis la nature : rejoins une ville d'abord.","alerte"); return;
  }
  /* ⚠ v0.91 — un vaisseau cloué au SOL ne décolle pas non plus. C'est le seul
     cas sans issue du système : il n'y a pas de réparateur sur Silène. C'est
     pour ça que le remorquage dépose au Perchoir et jamais au sol. */
  if(typeof vaisseauCloue==="function" && vaisseauCloue()){
    journal("Coque hors service : ton vaisseau ne quittera pas le sol.","alerte"); return;
  }
  if(!await _payerSaut("Décollage")) return;
  const base = espaceLieu("base");
  etat.secteur   = "ecart";
  etat.posEspace = base ? { x:base.x, y:base.y } : { x:ESPACE_MONDE.w/2, y:ESPACE_MONDE.h/2 };
  journal(`Décollage. Arrivée : ${base?base.nom:"la base"} — secteur ${SECTEUR_NOM}.`,"gain","voyage");
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
   VOL DANS NIELLE — v0.91, brique 1
   Coût PROPORTIONNEL à la distance, comme sur Silène (`coutTrajet`).
   ⚠ Pas de table de prix entre lieux : 19 objets font 171 paires, et le mode
   placement peut tout déplacer — la table serait fausse au premier glissement.
   La « table des distances » du lore reste un AFFICHAGE, pas une source.
   =========================================================== */
const PAS_ESPACE_E = 120;   // unités monde par 1 % d'énergie
const PAS_ESPACE_C = 200;   // unités monde par litre (× conso du vaisseau)

function posEspace(){
  if(etat.posEspace && typeof etat.posEspace.x === "number") return etat.posEspace;
  const b = espaceLieu("base");
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
    energie: Math.max(1, Math.round(d / PAS_ESPACE_E)),
    litres:  Math.ceil(Math.max(1, Math.round(d / PAS_ESPACE_C)) * (v.conso || 1)
                       * ((typeof malusCarburant==="function") ? malusCarburant() : 1)) };
}
/* Ce que coûterait le retour à la base DEPUIS un point donné. */
function _coutRetourBase(depuis){
  const b = espaceLieu("base"); if(!b) return null;
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
  if(!enEcart()) return false;
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
  if(!await agirServeur({ cout:j.cout.energie, motif:"vol_nielle" })) return false;
  etat.carburant = Math.max(0, (etat.carburant||0) - j.cout.litres);
  etat.posEspace = dest;
  journal(`Cap sur ${espaceNom(l)} — ${Math.round(j.cout.d)} u, ${j.cout.energie} % d'énergie, ${j.cout.litres} L. Réservoir ${Math.round(etat.carburant)} L.`,"gain","voyage");
  /* v0.91 — une sonde peut couper la route. ⚠ APRÈS l'arrivée, jamais pendant :
     un joueur intercepté à mi-parcours ne saurait plus où il est, et les
     dégâts de coque changeraient le coût du vol déjà payé. */
  if(typeof tenterSonde==="function") tenterSonde();
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  majApresDeplacement();
  return true;
}

/* Mémoire du bandeau d'info pendant un survol (voir majOrbite). */
let _orbInfoFige = null;

/* Ligne d'aperçu affichée au survol d'un objet. */
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
    : `il faut ${j.besoin} L pour aller ET revenir à la base`;
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
  const lieux = ESPACE_LIEUX.filter(l => l.type !== "decor")
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
    En rouge : pas de quoi <b>aller ET revenir au Perchoir</b>.</p>`;

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
async function volVersPoint(pt){
  if(!pt) return;
  pt.x = Math.max(0, Math.min(ESPACE_MONDE.w, pt.x));
  pt.y = Math.max(0, Math.min(ESPACE_MONDE.h, pt.y));
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
  const r = await agirServeur({ cout:GRAVIER_ENERGIE, ajouter:gains, motif:"gravier" });
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
function surLieuEspace(l){ return !!l && _distEsp(posEspace(), {x:l.x, y:l.y}) <= espaceRayon(l); }

/* ===========================================================
   SECOURS — v0.91
   ⚠ Un joueur sans vaisseau à l'Écart est BLOQUÉ HORS DE LA CARTE PRINCIPALE :
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
async function secoursOrbite(){
  if(!enEcart()) return false;
  const cloue = (typeof vaisseauCloue==="function") && vaisseauCloue();
  if(etat.vaisseau && !cloue) return false;       // il lui reste un moyen de rentrer
  /* ⚠ ORDRE AVEC LA MORT. Un joueur mort est derrière un écran bloquant : le
     redescendre pendant ce temps contredirait la règle « mourir à l'Écart ne
     fait pas descendre », et il se réveillerait chez lui sans avoir rien payé.
     On attend donc la résurrection — `ressusciter` rappelle le secours juste
     après, et il joue à ce moment-là, dans le bon ordre : on se réveille à la
     base, PUIS on est rapatrié. */
  if(typeof _mortInfo !== "undefined" && _mortInfo && _mortInfo.mort) return false;
  const du = Math.min(SECOURS_FRAIS, Math.max(0, etat.credits||0));
  etat.credits = Math.max(0, (etat.credits||0) - SECOURS_FRAIS);
  const impaye = du < SECOURS_FRAIS ? " Tu n'avais pas de quoi payer : tu leur dois le reste." : "";

  /* ⚠ DEUX DESTINATIONS, et la différence compte. Un vaisseau CLOUÉ ramené au
     sol ne pourrait plus jamais remonter — il n'y a pas de réparateur sur
     Silène. On remorque donc jusqu'au PERCHOIR, avec une navigabilité minimale
     rendue, de quoi rejoindre La Carcasse. Sans vaisseau du tout, en revanche,
     il n'y a plus rien à faire là-haut : retour au sol. */
  if(cloue){
    const b = espaceLieu("base");
    if(b) etat.posEspace = { x:b.x, y:b.y };
    if(typeof reparerPv==="function") reparerPv(Math.ceil(pvMax()*PV_REMORQUAGE));
    journal(`Appel de détresse : on te remorque jusqu'au ${b?b.nom:"Perchoir"} et on te rend juste de quoi voler. −${SECOURS_FRAIS} ₡.${impaye} Fais réparer la coque pour de bon.`,"alerte","voyage");
    if(typeof sauverMaintenant==="function") await sauverMaintenant();
    majApresDeplacement();
    return true;
  }

  const p = _villeDeMaFaction();
  etat.secteur = "silene";
  etat.pos = { x:p.x, y:p.y };
  journal(`Appel de détresse : un cargo de passage te redescend chez toi. −${SECOURS_FRAIS} ₡ de frais de secours.${impaye}`,"alerte","voyage");
  if(typeof fermerOrbite==="function") fermerOrbite();
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  majApresDeplacement();
  return true;
}

/* Conditions d'accès */
function orbiteDebloquee(){ return etat.espace1===true && !!etat.vaisseau; }

/* Le bouton n'apparaît que si tout est réuni */
function majBoutonOrbite(){
  const b=document.querySelector("#ouvrir-orbite"); if(!b) return;
  const ok = orbiteDebloquee();
  b.hidden = !ok;
  // button.action impose display:flex, qui l'emporterait sur l'attribut hidden.
  b.style.display = ok ? "" : "none";
  if(ok){
    b.querySelector("span").textContent = enEcart() ? `Carte de ${SECTEUR_NOM}` : `Partir pour ${SECTEUR_NOM}`;
    const cs=coutSaut();
    const c=b.querySelector(".cout");
    if(c) c.textContent = enEcart() ? "tu y es"
      : (cs ? `${cs.litres} L carburant · ${cs.energie} % énergie` : "en vaisseau");
  }
  // La carte de Silène n'a pas de sens depuis l'orbite.
  const bc=document.querySelector("#ouvrir-carte");
  if(bc){ const loin = enEcart();
    bc.disabled = loin;
    bc.style.opacity = loin ? ".45" : "";
    const c2=bc.querySelector(".cout"); if(c2) c2.textContent = loin ? "tu es en orbite" : "se déplacer"; }
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
    h += `<circle cx="${l.x}" cy="${l.y}" r="${rh*1.25}" fill="${l.halo}" opacity=".10"/>`
       + `<circle cx="${l.x}" cy="${l.y}" r="${rh}" fill="none" stroke="${l.halo}" stroke-width="3" opacity=".75"/>`
       + `<circle cx="${l.x}" cy="${l.y}" r="${rh}" fill="none" stroke="${l.halo}" stroke-width="10" opacity=".18"/>`;
  }
  h += `<image href="images/espace/${l.img}" x="${l.x-demi}" y="${l.y-demi}" width="${l.t}" height="${l.t}" preserveAspectRatio="xMidYMid meet"/>`;
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
  svg.setAttribute("viewBox",`0 0 ${ESPACE_MONDE.w} ${ESPACE_MONDE.h}`);
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");

  const barre=document.querySelector("#orbite-barre-plac");
  if(barre) barre.innerHTML = (typeof placementBarreHtml==="function") ? placementBarreHtml() : "";

  let html = `<image href="${ESPACE_FOND}" x="0" y="0" width="${ESPACE_MONDE.w}" height="${ESPACE_MONDE.h}" preserveAspectRatio="none"/>`;
  if(typeof placementGrilleHtml==="function") html += placementGrilleHtml();
  if(_placementActif){
    /* ⚠ v0.85 — en placement, TOUT est attrapable : on dessine du plus grand au
       plus petit, pour qu'une grosse zone de saisie ne recouvre jamais un petit
       objet (une planète de 406 u cachait l'astéroïde voisin). */
    ESPACE_LIEUX.slice().sort((a,b)=>b.t-a.t).forEach(l=>{ html += _espaceHtml(l); });
  } else {
    // En jeu : décor d'abord, les lieux passent au-dessus.
    ESPACE_LIEUX.filter(l=>l.type==="decor").forEach(l=>{ html += _espaceHtml(l); });
    ESPACE_LIEUX.filter(l=>l.type!=="decor").forEach(l=>{ html += _espaceHtml(l); });
  }
  /* v0.88 — marqueur du joueur, comme sur Silène (carte.js) : sans lui, on ne
     sait pas où l'on est dans le secteur. Dessiné EN DERNIER, donc au-dessus. */
  if(etat.posEspace && !_placementActif){
    const col = (FACTIONS.find(f=>f.id===etat.faction)||{}).couleur || "#ff9a44";   // même source que carte.js
    const px = etat.posEspace.x, py = etat.posEspace.y;
    html += `<circle cx="${px}" cy="${py}" r="34" fill="none" stroke="${col}" stroke-opacity=".35" stroke-width="2"/>`
          + `<circle cx="${px}" cy="${py}" r="17" fill="#0a1730" stroke="${col}" stroke-width="4"/>`
          + `<circle cx="${px}" cy="${py}" r="7" fill="${col}"/>`;
  }
  svg.innerHTML = html;

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
      if(_placementActif || !enEcart()) return;
      if(e.target.closest("[data-lieu]")) return;      // un objet : sa fiche s'ouvre
      volVersPoint(_coordEspace(svg, e));
    });
  }

  /* ⚠ v0.91 — RÉINITIALISATION. Le bandeau gardait le contenu du dernier
     survol, donc un coût calculé depuis une position qu'on avait quittée :
     « La Carcasse — 11 % · 11 L » restait affiché après s'en être éloigné.
     Chaque rendu de la carte le remet à son texte d'accueil. */
  const zi = document.querySelector("#orbite-info");
  if(zi){
    _orbInfoFige = null;
    zi.innerHTML = `Clique un point de la carte pour t'y rendre. <span class="itip-gris">Rentrée vers Silène : depuis le Perchoir uniquement.</span>`;
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
      if(_placementActif || !enEcart()) return;
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
      // v0.91 : le décor répond, mais ne mène nulle part. Il n'est plus muet.
      if(l.type === "decor"){
        z.innerHTML = `<b>${espaceNom(l)}</b><br><span class="itip-gris">${l.desc||"Rien qui mérite le carburant d'un détour."}</span>`;
        return;
      }
      if(l.verrou){
        z.innerHTML = `<b>${l.nom}</b> — <span style="color:#ff6b6b">verrouillé</span>.<br><span class="itip-gris">${l.desc}</span>`;
        return;
      }
      /* v0.91 — le bandeau annonce le coût du vol et propose de partir.
         ⚠ Le bouton n'apparaît QUE si l'on est à l'Écart : depuis Silène, la
         carte spatiale se consulte mais ne se parcourt pas. */
      /* ⚠ v0.91 — AUCUN BOUTON DANS CE BANDEAU. Il est à hauteur fixe : une
         ligne de trop ne se rogne pas, elle DISPARAÎT, et le bouton avec.
         Le clic sur un objet EMMÈNE, comme sur Silène et comme le vol libre ;
         les services d'un lieu vivent dans son onglet (Le Garage, Le Gisement),
         qui a la place de respirer. Ici : uniquement de l'information. */
      if(surLieuEspace(l)){
        z.innerHTML = `<b>${espaceNom(l)}</b>${l.usage?` — ${l.usage}`:""}<br><span class="itip-gris">Tu y es. ${l.type==="decor"?"Rien à y faire.":"Ferme la carte : son onglet t'attend."}</span>`;
        return;
      }
      if(!enEcart()){
        z.innerHTML = `<b>${espaceNom(l)}</b>${l.usage?` — ${l.usage}`:""}<br><span class="itip-gris">${l.desc||"Décolle pour t'y rendre."}</span>`;
        return;
      }
      volVers(l);
    });
  });

  if(typeof placementBrancher==="function") placementBrancher(svg);

  const br=document.querySelector("#orbite-retour");
  if(br){ br.hidden = !enEcart(); br.style.display = enEcart() ? "" : "none";
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
    if(!enEcart()){ nav.textContent = "— vu depuis Silène"; }
    else {
      const ici = ESPACE_LIEUX.find(l => l.type !== "decor" && surLieuEspace(l));
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
function fermerOrbite(){ document.querySelector("#modale-orbite").classList.remove("ouverte"); }
