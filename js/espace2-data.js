/* ===========================================================
   CARTE 2 — CÉRÈS, AU-DELÀ DE LA GORGE : DONNÉES DE PLACEMENT (v1.95)
   (nom décidé en K76 : LORE §3 ; les fichiers gardent « espace2 » / `e2_`)

   ✅ v1.96 (28/10) — UNE CARTE DE JEU. orbite.js la lit comme celle de
   Triptolème (même fenêtre, secteur `ceres`, position dans `posEspace`) ;
   l'outil de placement la lit toujours (« Placement carte 2 »).
   Noms : CADRAGE_CERES_DECISIONS §2 (K97 → K99). Mêmes champs que
   espace-data.js : nom, type ("lieu" | "decor"), usage, desc, ici, halo.
   ⚠ Textes SOBRES : rien n'y révèle ce qu'est un lieu (ni le Bureau, ni le
   quai, ni l'antenne) ; la bestiole n'a pas de nom (Le Nid est la base bâtie
   dessus) ; JAMAIS un mot sur l'œil fermé. Les deux PNJ du Nid ne sont pas
   évoquées (K95 : rien d'inventé à leur sujet).
   ⚠ Pas de nom officiel (`officiel`) : aucun n'est décidé. Ne pas en inventer.
   Six lieux sont des DÉCORS qu'on visite (`ici`). ✅ v2.06 : Le Fléau est un LIEU,
   avec son onglet de combat (fleau.js, étape 3 du cadrage). Sa position et son
   rayon sont aussi au serveur (table vol_lieux : fleau_engager exige d'y être).

   Mêmes conventions que js/espace-data.js (Triptolème) :
     monde 2400 × 1600 (le fond fait 1536 × 1024 : 1 px = 1,5625 u) ;
     x, y = CENTRE de l'objet ; t = largeur affichée, en unités monde.
   Les tailles de départ suivent la capture de l'autrice (25/10) ; la taille
   « native » d'une image (sa largeur × 1,5625) est rappelée par l'outil.

   ⚠ Identifiants préfixés `e2_` pour ne jamais croiser ceux de Triptolème (il y
   existe déjà un `trou_noir` et une `comete`). Deux sont FIGÉS (v1.95b, K75) :
     e2_base   la « bestiole » : la base de la carte, un bâtiment posé dessus
               (son contenu — PNJ, boutique… — viendra plus tard) ;
     e2_gorge  le trou noir du bas à droite : l'AUTRE BOUCHE de la Gorge. On en
               sort en venant de Triptolème ; on y repasse pour y retourner.
   Les autres restent PROVISOIRES jusqu'au cadrage, avant qu'une quête ne s'en
   serve.

   Images : images/espace2/<img>. Fond : images/carte_espace_2.png.
   L'outil régénère le tableau ENTIER (« Copier le bloc ») en recopiant
   TOUS les champs de chaque objet : un champ ajouté plus tard ne se perd pas.
   =========================================================== */

const ESPACE2_MONDE = { w: 2400, h: 1600 };
const ESPACE2_FOND  = "images/carte_espace_2.png";
const ESPACE2_IMG   = "images/espace2/";

const ESPACE2_LIEUX = [
  { id:"e2_oeil_espace", img:"oeil_espace.png", x:348, y:254, t:276, nom:"La Vigie", type:"decor", desc:"Une boule de métal tressé, une lentille orange au milieu.", ici:"La lentille ne te suit pas. Elle regarde ailleurs, et ne s'en laisse pas détourner." },
  { id:"e2_planete_violette", img:"planete_violette.png", x:1299, y:272, t:269, nom:"Le Trouble", type:"decor", desc:"Une géante de gaz violet. Rien où se poser.", ici:"Tu longes les nuées violettes. Elles bougent sans vent, et rien n'y offre de prise." },
  { id:"e2_planete_glace_doree", img:"planete_glace_doree.png", x:1958, y:225, t:683, nom:"Le Terminus", type:"decor", desc:"Une planète prise dans un anneau de glace. Sur l'anneau, des structures dorées, éteintes.", ici:"Les structures dorées sont rangées le long de l'anneau, à intervalles réguliers. Aucune lumière. Tout est fermé." },
  { id:"e2_cercles_bleus", img:"cercles_bleus.png", x:1280, y:798, t:300, nom:"La Couronne", type:"decor", desc:"Des arcs sombres autour d'une lueur bleue.", ici:"Les arcs tournent autour de la lueur, lentement, sans un bruit. Tes instruments grésillent tant que tu restes près d'elle." },
  { id:"e2_etoile_bleue", img:"etoile_bleue.png", x:2287, y:770, t:220, nom:"La Lanterne", type:"decor", desc:"Une étoile bleue, petite et violente.", ici:"Tu approches autant que la coque le permet. La lumière bleue traverse le hublot et la peau des mains." },
  { id:"e2_oeil_piques", img:"oeil_piques.png", x:286, y:864, t:385, nom:"Le Fléau", type:"lieu", usage:"Une attaque par jour", desc:"Des piques noires autour d'un point rouge.", ici:"Des piques plus longues que ton vaisseau, et au milieu, le point rouge. Il ne bouge pas." },
  { id:"e2_base", img:"bestiole.png", x:1675, y:1052, t:382, nom:"Le Nid", type:"lieu", halo:"#ffffff", usage:"Carburant · Remorquage", desc:"Des abris arrimés à une grande forme sombre qui dérive. Des lumières s'y allument, s'y éteignent." },
  { id:"e2_planete_oeil", img:"planete_oeil.png", x:649, y:1277, t:438, nom:"La Bogue", type:"decor", desc:"Une boule de plaques serrées, close de partout.", ici:"Tu en fais le tour. Pas une fente, pas une porte. Au fond, entre deux plaques, quelque chose rougeoie." },
  { id:"e2_comete", img:"comete.png", x:1481, y:1474, t:141, nom:"La Fugueuse", type:"decor", desc:"Une comète bleue, très vite.", ici:"Tu la rattrapes un moment. Elle te givre le hublot, et elle est déjà repartie." },
  { id:"e2_gorge", img:"trou_noir.png", x:2146, y:1371, t:324, nom:"La Gorge", type:"lieu", usage:"Passage vers Triptolème", desc:"La même gueule noire, vue de l'autre côté. C'est par là qu'on rentre." }
];
