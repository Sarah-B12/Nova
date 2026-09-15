/* ===========================================================
   ESPACE — DONNÉES (v0.83, noms AREPO en v0.91)

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
     verrou null, ou l'identifiant d'une condition (ex. "q20" pour le trou noir)
     officiel  nom AREPO, JAMAIS AFFICHÉ SUR LA CARTE (v0.91)
     libelle   pour les objets SANS nom courant : une désignation commune
               (« Une étoile », « Une sonde à la dérive »), pas un nom propre.

   ⚠ POURQUOI `libelle` ET PAS UN NOM. Les décors n'ont pas de nom courant dans
   le lore, et leur en inventer ferait une liste à retenir pour rien. Mais les
   laisser muets au survol serait pire qu'un détail cosmétique : le joueur
   apprendrait que « pas de texte = pas une destination », ce qui recrée
   exactement le SPOIL DE CURSEUR corrigé en v0.91. Une désignation commune
   garde l'uniformité sans rien ajouter à mémoriser.

   ⚠ DEUX REGISTRES (LORE_Corporation.md §4). Chaque objet porte le nom que
   disent les équipages (`nom`, cru et descriptif) et le nom qu'AREPO avait
   gravé sur ses plaques (`officiel`, un nom de plante ou un matricule
   `Nielle-n`). **L'écart entre les deux EST une information** : un joueur qui
   trouve une plaque « Nielle-4 » là où tout le monde dit « La Cassée » tient
   une trace d'AREPO, pas une coquetterie d'habillage. `officiel` est donc
   RÉSERVÉ AUX QUÊTES — il ne doit apparaître nulle part dans l'interface tant
   qu'une quête ne le révèle pas.

   ⚠ Deux absences volontaires : le trou noir n'a **pas** de nom officiel (les
   registres s'arrêtent là, ce qui est plus inquiétant qu'un nom), et le portail
   n'est que numéroté zéro — de quoi l'accrocher au lore sans rien promettre,
   puisque c'est un leurre.

   ⚠ Les identifiants techniques (`id`) ne changent JAMAIS : seuls les noms
   affichés bougent.
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
  { id:"base", nom:"Le Perchoir", officiel:"Relais Nielle-1", img:"base1.png", x:685, y:728, t:312, type:"lieu", halo:"#ff9a3d",
    usage:"Auberge · Boutique · Poste · Quêtes", desc:"Un moyeu de service accroché à rien. On y dort, on y boit, on y repart." },
  { id:"planete_chaude", nom:"La Braise", officiel:"Ancolie", img:"planete_chaude_1.png", x:1669, y:760, t:312, type:"lieu",
    usage:"Descente au sol · zone chaude", desc:"La croûte n'a jamais fini de refroidir. L'air y coûte cher." },
  { id:"planete_froide", nom:"Le Suaire", officiel:"Gypsophile", img:"planete_froide_1.png", x:203, y:967, t:312, type:"lieu",
    usage:"Descente au sol · zone froide", desc:"Blanche jusqu'à l'horizon. Rien n'y bouge, et c'est le problème." },
  /* ⚠ RÉSERVÉE À L'ARC SUIVANT : reste un `lieu`, mais ne mène nulle part pour l'instant. */
  { id:"planete_bleue", nom:"Les Deux Sœurs", officiel:"Consoude", img:"planete_bleue.png", x:1093, y:316, t:312, type:"lieu",
    usage:"À venir", desc:"De loin, on ne sait plus laquelle tourne autour de l'autre." },
  { id:"planete_cassee", nom:"La Cassée", officiel:"Nielle-4", img:"planete_cassee.png", x:2150, y:864, t:406, type:"lieu",
    usage:"À venir", desc:"Quelque chose l'a ouverte, et ça brûle encore à l'intérieur." },
  { id:"etoile", nom:null, libelle:"Une étoile", officiel:"Digitale", img:"etoile_violet_iodes.png", x:2004, y:169, t:312, type:"decor",
    usage:"", desc:"" },
  /* ⚠ AUCUN nom officiel : les registres d'AREPO s'arrêtent là. Verrou porté de
     q15 à q20 — le trou noir ouvre la carte SUIVANTE, pas celle-ci. */
  { id:"trou_noir", nom:"La Gorge", officiel:null, img:"trou_noir_bleu.png", x:1163, y:824, t:312, type:"lieu", verrou:"q20",
    usage:"Verrouillé", desc:"Elle avale la lumière sans un bruit. Personne n'en est revenu pour le raconter." },
  /* ⚠ LEURRE : ne mène à rien, jamais. Non répertorié, seulement numéroté zéro. */
  { id:"portail", nom:"L'Arche", officiel:"Structure NL-0", img:"portail.png", x:528, y:1394, t:344, type:"leurre",
    usage:"Inerte", desc:"L'anneau tourne encore, régulier. Il n'a jamais rien laissé passer." },
  { id:"epave", nom:"La Carcasse", officiel:"NL-217", img:"ruine_vaisseau.png", x:747, y:1270, t:133, type:"lieu",
    usage:"Réparation de coque", desc:"Une coque éventrée. Quelqu'un s'y est installé et découpe dedans ce qui manque aux autres." },
  { id:"antenne", nom:"Le Muet", officiel:"Relais Nielle-2", img:"antene.png", x:1253, y:118, t:312, type:"lieu",
    usage:"Écoute", desc:"Il émet encore. Vers quoi, c'est une autre question." },
  { id:"satellite1", nom:null, libelle:"Une sonde à la dérive", officiel:"Sonde Bardane", img:"satellite1.png", x:1610, y:1353, t:109, type:"decor",
    usage:"", desc:"" },
  { id:"satellite2", nom:null, libelle:"Une sonde à la dérive", officiel:"Sonde Chardon", img:"satellite2.png", x:668, y:142, t:156, type:"decor",
    usage:"", desc:"" },
  { id:"asteroides", nom:"Le Gravier", officiel:"Jachère haute", img:"cailloux_grands.png", x:2113, y:1393, t:203, type:"lieu",
    usage:"Cristal de Nyx", desc:"Roches lentes. On en ressort toujours avec la coque rayée." },
  { id:"cailloux2", nom:null, libelle:"Un chapelet de cailloux", officiel:"Jachère basse", img:"cailloux_petits.png", x:325, y:273, t:312, type:"decor",
    usage:"", desc:"" },
  { id:"asteroide_v", nom:"Le Vert", officiel:"Prêle", img:"asteroide_vert.png", x:1154, y:1490, t:156, type:"decor",
    usage:"", desc:"Un vert qui n'a rien à faire là. Personne n'est allé voir." },
  { id:"comete", nom:"La Traînée", officiel:"Sarriette", img:"comete_bleue.png", x:306, y:457, t:156, type:"decor",
    usage:"", desc:"Elle repasse. Personne ne tient le compte." },
  { id:"anneaux_b", nom:null, libelle:"Une planète à anneaux", officiel:"Campanule", img:"planete_anneaux_bleu.png", x:1087, y:1003, t:141, type:"decor",
    usage:"", desc:"" },
  { id:"pp_vert", nom:null, libelle:"Une petite planète", officiel:"Mousseron", img:"petite_planete_vert.png", x:1461, y:1285, t:109, type:"decor",
    usage:"", desc:"" },
  { id:"pp_violet", nom:null, libelle:"Une petite planète", officiel:"Aubépine", img:"petite_planete_violet.png", x:2204, y:250, t:109, type:"decor",
    usage:"", desc:"" }
];


function espaceLieu(id){ return ESPACE_LIEUX.find(l => l.id === id) || null; }
/* Ce qu'on montre au joueur : nom courant, sinon désignation commune. */
function espaceNom(l){ return (l && (l.nom || l.libelle)) || "Objet stellaire"; }
function espaceRayon(l){ return l.r || Math.round(l.t/2) + 20; }
