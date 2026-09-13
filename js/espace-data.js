/* ===========================================================
   ESPACE — DONNÉES (v0.83)

   Catalogue des objets stellaires posés sur `images/carte_espace_1.png`.
   Séparé d'orbite.js pour que ce fichier reste ÉDITABLE À LA MAIN : c'est lui
   que le mode placement (console dev → Placement) régénère.

   Le monde spatial garde les dimensions de Silène (2400 × 1600, même rapport
   que le fond 1536 × 1024) pour que les deux cartes se comportent pareil :
   même viewBox, même calcul de distance, mêmes repères.

   Champs :
     id     identifiant unique (sert au code et aux quêtes)
     nom    affiché sous l'objet ; null = aucune étiquette (décor)
     img    fichier dans images/espace/
     x, y   CENTRE de l'objet, en unités monde
     t      taille d'affichage en unités monde (largeur)
     type   "lieu"   = visitable, cliquable, étiquette
            "decor"  = purement visuel, aucun clic
            "leurre" = cliquable, mais ne mène à rien (le portail)
     r      rayon d'arrivée (lieux seulement) ; défaut = t/2 + 20
     usage  une ligne, affichée au clic
     desc   deux lignes d'ambiance
     verrou null, ou l'identifiant d'une condition (ex. "q15" pour le trou noir)
   =========================================================== */

const ESPACE_MONDE = { w: 2400, h: 1600 };
const ESPACE_FOND  = "images/carte_espace_1.png";

/* ⚠ Positions PROVISOIRES : réparties pour ne pas se chevaucher, à replacer
   avec le mode placement. Seuls x, y et t sont censés bouger. */
const ESPACE_LIEUX = [
  /* ---- Points d'ancrage ---- */
  { id:"base",        nom:"Base de l'Écart",      img:"base1.png",              x:1180, y:800,  t:200, type:"lieu",
    usage:"Auberge · Boutique · Poste · Quêtes",
    desc:"Un moyeu de service accroché à rien. On y dort, on y boit, on y repart." },
  { id:"planete_chaude", nom:"Braisier",           img:"planete_chaude_1.png",   x:1900, y:1180, t:200, type:"lieu",
    usage:"Descente au sol · zone chaude",
    desc:"La croûte n'a jamais fini de refroidir. L'air y coûte cher." },
  { id:"planete_froide", nom:"Le Suaire",          img:"planete_froide_1.png",   x:480,  y:420,  t:200, type:"lieu",
    usage:"Descente au sol · zone froide",
    desc:"Blanche jusqu'à l'horizon. Rien n'y bouge, et c'est le problème." },
  { id:"planete_bleue",  nom:"Halde",              img:"planete_bleue.png",      x:700,  y:1220, t:200, type:"lieu",
    usage:"À venir",
    desc:"Une lune la suit de près, comme si elle n'osait pas s'éloigner." },
  { id:"planete_cassee", nom:"Ce qu'il en reste",  img:"planete_cassee.png",     x:1680, y:340,  t:230, type:"lieu",
    usage:"À venir",
    desc:"Quelque chose l'a ouverte, et ça brûle encore à l'intérieur." },
  { id:"etoile",         nom:"Iode",               img:"etoile_violet_iodes.png",x:2120, y:700,  t:190, type:"decor",
    usage:"", desc:"" },

  /* ---- Le trou noir : la carte suivante, plus tard ---- */
  { id:"trou_noir",   nom:"La Gorge",              img:"trou_noir_bleu.png",     x:220,  y:840,  t:200, type:"lieu", verrou:"q15",
    usage:"Verrouillé",
    desc:"Elle avale la lumière sans un bruit. Personne n'en est revenu pour le raconter." },

  /* ---- Le portail : LEURRE. Il ne mène nulle part, et c'est voulu. ---- */
  { id:"portail",     nom:"L'Arche",               img:"portail.png",            x:1420, y:1320, t:210, type:"leurre",
    usage:"Inerte",
    desc:"L'anneau tourne encore, régulier. Il n'a jamais rien laissé passer." },

  /* ---- Petits lieux ---- */
  { id:"epave",       nom:"L'épave",               img:"ruine_vaisseau.png",     x:960,  y:480,  t:110, type:"lieu",
    usage:"Fouille",
    desc:"Une coque éventrée, dérivant depuis trop longtemps pour qu'on sache d'où." },
  { id:"antenne",     nom:"Relais orphelin",       img:"antene.png",             x:1560, y:980,  t:150, type:"lieu",
    usage:"Écoute",
    desc:"Il émet encore. Vers quoi, c'est une autre question." },
  { id:"satellite1",  nom:"Sonde muette",          img:"satellite1.png",         x:1340, y:560,  t:80,  type:"decor", usage:"", desc:"" },
  { id:"satellite2",  nom:null,                    img:"satellite2.png",         x:2020, y:1420, t:110, type:"decor", usage:"", desc:"" },

  /* ---- Astéroïdes et décor ---- */
  { id:"asteroides",  nom:"Champ d'astéroïdes",    img:"cailloux_grands.png",    x:820,  y:900,  t:170, type:"lieu",
    usage:"Minage",
    desc:"Roches lentes et riches. Le minerai y vaut ce qu'il coûte à remonter." },
  { id:"cailloux2",   nom:null,                    img:"cailloux_petits.png",    x:1020, y:1080, t:150, type:"decor", usage:"", desc:"" },
  { id:"asteroide_v", nom:null,                    img:"asteroide_vert.png",     x:600,  y:760,  t:90,  type:"decor", usage:"", desc:"" },
  { id:"comete",      nom:null,                    img:"comete_bleue.png",       x:1780, y:1560, t:100, type:"decor", usage:"", desc:"" },
  { id:"anneaux_b",   nom:null,                    img:"planete_anneaux_bleu.png",x:380, y:1480, t:100, type:"decor", usage:"", desc:"" },
  { id:"pp_vert",     nom:null,                    img:"petite_planete_vert.png",x:2240, y:1100, t:80,  type:"decor", usage:"", desc:"" },
  { id:"pp_violet",   nom:null,                    img:"petite_planete_violet.png",x:160, y:180, t:80,  type:"decor", usage:"", desc:"" }
];

function espaceLieu(id){ return ESPACE_LIEUX.find(l => l.id === id) || null; }
function espaceRayon(l){ return l.r || Math.round(l.t/2) + 20; }
