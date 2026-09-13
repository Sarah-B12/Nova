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
     t      taille d'affichage en unités monde (largeur).
            ⚠ Le fond fait 1536 px pour 2400 unités monde : une image de 200 px
            doit valoir 200 × 1,5625 ≈ 313 u pour s'afficher à SA taille. C'est
            la valeur posée par défaut — le mode placement ne la change plus.
     type   "lieu"   = visitable, cliquable, étiquette
            "decor"  = purement visuel, aucun clic
            "leurre" = cliquable, mais ne mène à rien (le portail)
     r      rayon d'arrivée (lieux seulement) ; défaut = t/2 + 20
     usage  une ligne, affichée au clic
     desc   deux lignes d'ambiance
     verrou null, ou l'identifiant d'une condition (ex. "q15" pour le trou noir)
     halo   couleur CSS d'un liseré lumineux (facultatif), pour les lieux
            qu'on doit retrouver d'un coup d'œil
   =========================================================== */

const ESPACE_MONDE = { w: 2400, h: 1600 };
const ESPACE_FOND  = "images/carte_espace_1.png";

/* Positions posées au mode placement (console dev → Placement carte spatiale).
   Pour les rejouer : ouvrir le mode, glisser, « Copier le bloc », coller ici. */
const ESPACE_LIEUX = [
  /* halo : liseré lumineux autour de l'objet (les images sombres se perdent
     sur un fond d'étoiles). Valeur = couleur CSS. Réservé aux lieux qui
     doivent SE REPÉRER : la base d'abord. */
  { id:"base", nom:"Base de l'Écart", img:"base1.png", x:685, y:728, t:312, type:"lieu", halo:"#ff9a3d",
    usage:"Auberge · Boutique · Poste · Quêtes", desc:"Un moyeu de service accroché à rien. On y dort, on y boit, on y repart." },
  { id:"planete_chaude", nom:"Braisier", img:"planete_chaude_1.png", x:1669, y:760, t:312, type:"lieu",
    usage:"Descente au sol · zone chaude", desc:"La croûte n'a jamais fini de refroidir. L'air y coûte cher." },
  { id:"planete_froide", nom:"Le Suaire", img:"planete_froide_1.png", x:203, y:967, t:312, type:"lieu",
    usage:"Descente au sol · zone froide", desc:"Blanche jusqu'à l'horizon. Rien n'y bouge, et c'est le problème." },
  { id:"planete_bleue", nom:"Halde", img:"planete_bleue.png", x:1093, y:316, t:312, type:"lieu",
    usage:"À venir", desc:"Une lune la suit de près, comme si elle n'osait pas s'éloigner." },
  { id:"planete_cassee", nom:"Ce qu'il en reste", img:"planete_cassee.png", x:2150, y:864, t:406, type:"lieu",
    usage:"À venir", desc:"Quelque chose l'a ouverte, et ça brûle encore à l'intérieur." },
  { id:"etoile", nom:"Iode", img:"etoile_violet_iodes.png", x:2004, y:169, t:312, type:"decor",
    usage:"", desc:"" },
  { id:"trou_noir", nom:"La Gorge", img:"trou_noir_bleu.png", x:1163, y:824, t:312, type:"lieu", verrou:"q15",
    usage:"Verrouillé", desc:"Elle avale la lumière sans un bruit. Personne n'en est revenu pour le raconter." },
  { id:"portail", nom:"L'Arche", img:"portail.png", x:528, y:1394, t:344, type:"leurre",
    usage:"Inerte", desc:"L'anneau tourne encore, régulier. Il n'a jamais rien laissé passer." },
  { id:"epave", nom:"L'épave", img:"ruine_vaisseau.png", x:747, y:1270, t:133, type:"lieu",
    usage:"Fouille", desc:"Une coque éventrée, dérivant depuis trop longtemps pour qu'on sache d'où." },
  { id:"antenne", nom:"Relais orphelin", img:"antene.png", x:1253, y:118, t:312, type:"lieu",
    usage:"Écoute", desc:"Il émet encore. Vers quoi, c'est une autre question." },
  { id:"satellite1", nom:"Sonde muette", img:"satellite1.png", x:1610, y:1353, t:109, type:"decor",
    usage:"", desc:"" },
  { id:"satellite2", nom:null, img:"satellite2.png", x:668, y:142, t:156, type:"decor",
    usage:"", desc:"" },
  { id:"asteroides", nom:"Champ d'astéroïdes", img:"cailloux_grands.png", x:2113, y:1393, t:203, type:"lieu",
    usage:"Minage", desc:"Roches lentes et riches. Le minerai y vaut ce qu'il coûte à remonter." },
  { id:"cailloux2", nom:null, img:"cailloux_petits.png", x:325, y:273, t:312, type:"decor",
    usage:"", desc:"" },
  { id:"asteroide_v", nom:null, img:"asteroide_vert.png", x:1154, y:1490, t:156, type:"decor",
    usage:"", desc:"" },
  { id:"comete", nom:null, img:"comete_bleue.png", x:306, y:457, t:156, type:"decor",
    usage:"", desc:"" },
  { id:"anneaux_b", nom:null, img:"planete_anneaux_bleu.png", x:1087, y:1003, t:141, type:"decor",
    usage:"", desc:"" },
  { id:"pp_vert", nom:null, img:"petite_planete_vert.png", x:1461, y:1285, t:109, type:"decor",
    usage:"", desc:"" },
  { id:"pp_violet", nom:null, img:"petite_planete_violet.png", x:2204, y:250, t:109, type:"decor",
    usage:"", desc:"" }
];


function espaceLieu(id){ return ESPACE_LIEUX.find(l => l.id === id) || null; }
function espaceRayon(l){ return l.r || Math.round(l.t/2) + 20; }
