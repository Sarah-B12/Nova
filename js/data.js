/* ===========================================================
   DATA — Données statiques : icônes SVG, objets/matières/plantes/animaux, monde (villes, lieux) et helpers de géographie.
   =========================================================== */
// --- Objets du jeu : consommables (achetables) + matières (récoltées) ---
// Chaque objet a une icône SVG. Tout va dans le sac (50 places, 1 par unité).
const SVG = {
  o2:      `<svg viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="18" rx="4" fill="none" stroke="#4fd6e6" stroke-width="1.6"/><path d="M12 7v8M9 10l3-3 3 3" stroke="#4fd6e6" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  kit:     `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="3" fill="none" stroke="#4fd07a" stroke-width="1.6"/><path d="M12 9v7M8.5 12.5h7" stroke="#4fd07a" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  ration:  `<svg viewBox="0 0 24 24"><path d="M5 10h14l-1.4 9H6.4z" fill="none" stroke="#ffb060" stroke-width="1.6"/><path d="M8 10c0-3 8-3 8 0" fill="none" stroke="#ffb060" stroke-width="1.6"/></svg>`,
  cendrite:`<svg viewBox="0 0 24 24"><path d="M6 14l3-7 6 1 3 6-5 4z" fill="rgba(255,138,61,.18)" stroke="#ff9a44" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  voltane: `<svg viewBox="0 0 24 24"><path d="M13 3L6 13h5l-1 8 8-11h-5z" fill="rgba(79,214,230,.18)" stroke="#4fd6e6" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  givrite: `<svg viewBox="0 0 24 24"><path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9" stroke="#8fd8ff" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`,
  biofibre:`<svg viewBox="0 0 24 24"><path d="M12 20c0-6 6-9 6-14-6 0-10 4-10 9M12 20c0-4-2-7-6-8" fill="none" stroke="#6fd08a" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  silite:  `<svg viewBox="0 0 24 24"><path d="M12 4l6 6-6 10-6-10z" fill="rgba(230,184,79,.18)" stroke="#e6b84f" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  cristal: `<svg viewBox="0 0 24 24"><path d="M12 3l6 6-6 12-6-12z" fill="rgba(154,123,240,.2)" stroke="#c08cf0" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 9h12" stroke="#c08cf0" stroke-width="1"/></svg>`,
  sylve:   `<svg viewBox="0 0 24 24"><path d="M12 21V7M12 11c-3 0-5-2-5-5 3 0 5 2 5 5zM12 13c3 0 5-2 5-4-3 0-5 1-5 4z" fill="none" stroke="#8fcf6f" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  filaine: `<svg viewBox="0 0 24 24"><path d="M5 8c4-3 10-3 14 0M5 12c4-3 10-3 14 0M5 16c4-3 10-3 14 0" fill="none" stroke="#e0a86f" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  cuir:    `<svg viewBox="0 0 24 24"><path d="M6 5c4-2 8-2 12 0 1 5-1 9-6 14-5-5-7-9-6-14z" fill="rgba(180,120,70,.18)" stroke="#b4784a" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  proteines:`<svg viewBox="0 0 24 24"><ellipse cx="12" cy="13" rx="7" ry="6" fill="rgba(230,110,120,.18)" stroke="#e66e78" stroke-width="1.4"/><path d="M9 6l2 3M13 6l1 3" stroke="#e66e78" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  sporelle: `<svg viewBox="0 0 24 24"><path d="M12 21v-8" stroke="#7fe0a0" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="9" r="5" fill="rgba(127,224,160,.2)" stroke="#7fe0a0" stroke-width="1.4"/><circle cx="10" cy="8" r="1" fill="#7fe0a0"/><circle cx="14" cy="10" r="1" fill="#7fe0a0"/></svg>`,
  nectine:  `<svg viewBox="0 0 24 24"><path d="M12 21v-7" stroke="#9fd06f" stroke-width="1.6" stroke-linecap="round"/><path d="M12 14c-4 0-6-3-5-7 4 0 6 3 5 7zM12 14c2-2 5-2 7-1-1 3-4 4-7 1z" fill="rgba(159,208,111,.2)" stroke="#9fd06f" stroke-width="1.3"/></svg>`,
  ferragave:`<svg viewBox="0 0 24 24"><path d="M12 21l-5-4M12 21l5-4M12 21V6M12 8L6 5M12 10l6-4M12 12l-5-2M12 13l5-2" stroke="#e6c24f" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg>`,
  cuprin:   `<svg viewBox="0 0 24 24"><ellipse cx="11" cy="14" rx="7" ry="5" fill="rgba(224,168,111,.2)" stroke="#e0a86f" stroke-width="1.4"/><circle cx="18" cy="10" r="3" fill="rgba(224,168,111,.2)" stroke="#e0a86f" stroke-width="1.4"/><path d="M6 18l1 2M10 19l0 2M15 18l1 2M17 9l1-2M19 9l1-2" stroke="#e0a86f" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  cuirasson:`<svg viewBox="0 0 24 24"><path d="M4 16a8 5 0 0 1 16 0z" fill="rgba(200,138,90,.2)" stroke="#c88a5a" stroke-width="1.4"/><path d="M8 14v2M12 13v3M16 14v2" stroke="#c88a5a" stroke-width="1.2"/><path d="M5 16l1 3M19 16l-1 3" stroke="#c88a5a" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  toisard:  `<svg viewBox="0 0 24 24"><path d="M6 16a3.5 3.5 0 0 1 0-7 3.5 3.5 0 0 1 5-2 3.5 3.5 0 0 1 5 2 3.5 3.5 0 0 1 0 7z" fill="rgba(216,224,208,.25)" stroke="#cbd3c0" stroke-width="1.4"/><path d="M8 16v3M12 16v3M16 16v3" stroke="#cbd3c0" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  nourrin:  `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="5" ry="6.5" fill="rgba(224,196,111,.25)" stroke="#e0c46f" stroke-width="1.4"/><path d="M9 11c1-1.6 5-1.6 6 0" stroke="#e0c46f" stroke-width="1.2" fill="none"/></svg>`
};
const CONSOMMABLES = [
  { id:"o2",     nom:"Recharge O₂",   prix:40, jauge:"o2",    soin:40, type:"conso" },
  { id:"kit",    nom:"Kit médical",   prix:80, jauge:"sante", soin:40, type:"conso" },
  { id:"ration", nom:"Ration chaude", prix:60, jauge:"moral", soin:30, type:"conso" }
];
// Matières : les mêmes partout. Minerais (raretés), organiques et animales.
const MATIERES = [
  { id:"cendrite", nom:"Cendrite", type:"matiere", cat:"minerai", poids:40 },
  { id:"voltane",  nom:"Voltane",  type:"matiere", cat:"minerai", poids:30 },
  { id:"silite",   nom:"Silite",   type:"matiere", cat:"minerai", poids:18 },
  { id:"givrite",  nom:"Givrite",  type:"matiere", cat:"minerai", poids:9  },
  { id:"cristal",  nom:"Cristal de Nyx", type:"matiere", cat:"minerai", poids:3 },
  { id:"biofibre", nom:"Biofibre", type:"matiere", cat:"organique" },
  { id:"filaine",  nom:"Filaine",  type:"matiere", cat:"animal" },
  { id:"cuir",     nom:"Cuir",     type:"matiere", cat:"animal" },
  { id:"proteines",nom:"Protéines",type:"matiere", cat:"animal" }
];
const MINERAIS = MATIERES.filter(m => m.cat === "minerai");
// Plantes cultivées dans le bio-dôme (croissance = % gagné par arrosage quotidien).
// Noms et images provisoires — à remplacer quand tu me donneras tes visuels.
const PLANTES = [
  { id:"sylve",     nom:"Sylve",     type:"matiere", cat:"organique", croissance:30 },  // matériau (pas du fourrage : cat ≠ plante)
  { id:"sporelle",  nom:"Sporelle",  type:"matiere", cat:"plante", croissance:34 },  // ~3 jours
  { id:"nectine",   nom:"Nectine",   type:"matiere", cat:"plante", croissance:25 },  // ~4 jours
  { id:"ferragave", nom:"Ferragave", type:"matiere", cat:"plante", croissance:20 }   // ~5 jours
];
function plante(id){ return PLANTES.find(p=>p.id===id); }
// Animaux élevés dans l'enclos.
const ANIMAUX = [
  { id:"cuprin",    nom:"Cuprin",    repasAdulte:4, produit:"filaine" },   // fibre fine
  { id:"cuirasson", nom:"Cuirasson", repasAdulte:6, produit:"cuir" },      // grosse bête cuirassée : mue et perd sa peau dure (récolte non létale)
  { id:"toisard",   nom:"Toisard",   repasAdulte:5, produit:"biofibre" },  // laine blanche rêche, pour les recettes (pas comestible)
  { id:"nourrin",   nom:"Nourrin",   repasAdulte:5, produit:"proteines" }  // pond une substance riche en protéines (récolte non létale)
];
function animal(id){ return ANIMAUX.find(a=>a.id===id); }
const TOUS_ITEMS = [...CONSOMMABLES, ...MATIERES, ...PLANTES];
function item(id){ return TOUS_ITEMS.find(i => i.id === id); }

// --- Icônes-images : remplacent le SVG quand une image existe (sinon fallback SVG).
// Chemins relatifs à la page (le rendu se fait via JS dans le document).
const IMG_ITEM = {
  o2:"images/items/o2.png", kit:"images/items/kit.png", ration:"images/items/ration.png",
  cendrite:"images/items/cendrite.png", voltane:"images/items/voltane.png",
  silite:"images/items/silite.png",     givrite:"images/items/givrite.png",
  cristal:"images/items/cristal.png",   biofibre:"images/items/biofibre.png",
  filaine:"images/items/filaine.png",   sylve:"images/items/sylve.png",
  sporelle:"images/items/sporelle.png", nectine:"images/items/nectine.png", ferragave:"images/items/ferragave.png",
  fab_lingot_de_cendrite:"images/items/lingot_cendrite.png",
  fab_lingot_de_voltane: "images/items/lingot_voltane.png",
  fab_lingot_de_silite:  "images/items/lingot_silite.png",
  fab_lingot_de_givrite: "images/items/lingot_givrite.png",
  fab_couteau_de_survie:   "images/items/couteau.png",
  fab_munitions_cinetiques:"images/items/munitions_cinetiques.png",
  fab_pistolet_cinetique:  "images/items/pistolet.png",
  fab_munitions_a_plasma:  "images/items/munitions_plasma.png",
  fab_lame_a_plasma:       "images/items/lame_plasma.png",
  fab_pistolet_a_plasma:   "images/items/pistolet_plasma.png",
  fab_munitions_a_ions:    "images/items/munitions_ions.png",
  fab_fusil_a_ions:        "images/items/fusil_ions.png",
  fab_tourelle_de_vaisseau:"images/items/tourelle.png",
  fab_lame_a_singularite:  "images/items/lame_singularite.png",
  fab_canon_a_singularite: "images/items/canon_singularite.png"
};
function iconeItem(id){ return IMG_ITEM[id] ? `<img src="${IMG_ITEM[id]}" alt="">` : (SVG[id]||""); }

// --- Carte continue (à la Kingdom Epic) : un vaste monde en coordonnées.
// Chaque (x,y) est un endroit distinct ; entre les points marqués, le vide est
// traversable — d'où la possibilité (à venir) de se cacher ou de traquer. ---
const MONDE = { w:2400, h:1600 };
// Villes de faction : centre + rayon (zone où l'on peut se reposer / acheter).
const VILLES = {
  ignis:        { x:1225, y:325,  r:100 },   // volcan (haut-milieu)
  cultivateurs: { x:1250, y:770,  r:100 },   // forêt centrale (Le Rhizome)
  nomades:      { x:1195, y:1250, r:100 },   // campement (bas-milieu)
  toundra:      { x:1920, y:355,  r:100 },   // glace (haut-droite)
  rouage:       { x:1895, y:1050, r:100 }     // ruines rouillées (bas-droite)
};
// Zone de l'antagoniste : entrée interdite ; on ne peut que toucher l'ANNEAU (pour hacker/espionner).
const ZONE_PROTOCOLE = { x:450, y:1042, r:115 };
const TOL_PROTOCOLE  = 70;   // tolérance (unités monde) pour être considéré « sur l'anneau »
// Lieux spéciaux dans la nature (rayon d'effet plus petit).
const LIEUX = [
  { type:"mine",   x:900,  y:520,  r:60 }, { type:"mine",   x:1720, y:1010, r:60 }, { type:"mine",   x:620,  y:980,  r:60 },
  { type:"chasse", x:1460, y:360,  r:60 }, { type:"chasse", x:1920, y:720,  r:60 }, { type:"chasse", x:860,  y:1260, r:60 },
  { type:"quete",  x:1360, y:1180, r:60 }, { type:"quete",  x:520,  y:660,  r:60 }
];

function dist(x1,y1,x2,y2){ return Math.hypot(x1-x2, y1-y2); }
function posDefaut(){ const v=VILLES[etat.faction]||VILLES.ignis; return {x:v.x, y:v.y}; }
// Ville dont on est dans le rayon (ou null).
function villeActuelle(){ for(const fid in VILLES){ const v=VILLES[fid]; if(dist(etat.pos.x,etat.pos.y,v.x,v.y)<=v.r) return fid; } return null; }
function enZoneFaction(){ return villeActuelle(); }
// Vrai si le joueur est sur l'anneau du Protocole (à TOL près) — servira au hack/espionnage.
function surAnneauProtocole(){ if(!etat.pos) return false; return Math.abs(dist(etat.pos.x,etat.pos.y,ZONE_PROTOCOLE.x,ZONE_PROTOCOLE.y) - ZONE_PROTOCOLE.r) <= TOL_PROTOCOLE; }
// Lieu spécial dont on est dans le rayon (ou null).
function lieuActuel(){ for(const l of LIEUX){ if(dist(etat.pos.x,etat.pos.y,l.x,l.y)<=l.r) return l; } return null; }
function materiauMaison(){ return "cendrite"; }

// Tirage d'un minerai selon sa rareté ; bonus augmente la chance des rares.
function tirerMatiere(bonusRare=0){
  const pool = MINERAIS.map(m => ({ id:m.id, p: m.poids + (m.poids<20 ? bonusRare : 0) }));
  const total = pool.reduce((a,b)=>a+b.p,0);
  let x = Math.random()*total;
  for(const m of pool){ if((x-=m.p)<0) return m.id; }
  return pool[0].id;
}

