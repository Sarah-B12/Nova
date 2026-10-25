/* ===========================================================
   CARTE 2 — CÉRÈS, AU-DELÀ DE LA GORGE : DONNÉES DE PLACEMENT (v1.95)
   (nom décidé en K76 : LORE §3 ; les fichiers gardent « espace2 » / `e2_`)

   ⚠ PAS ENCORE UNE CARTE DE JEU. Ce fichier ne sert, pour l'instant, qu'à
   l'outil de placement de la console dev (« Placement carte 2 »,
   js/placement2.js). Aucun écran du jeu ne le lit : ni le vol, ni les
   quêtes, ni le serveur. Le cadrage de l'arc d'après la Gorge décidera de
   ce que sont ces objets (noms, lieux, décors, textes) ; d'ici là, rien
   d'autre que des positions.

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
  { id:"e2_oeil_espace", img:"oeil_espace.png", x:348, y:254, t:305 },
  { id:"e2_planete_violette", img:"planete_violette.png", x:1299, y:272, t:269 },
  { id:"e2_planete_glace_doree", img:"planete_glace_doree.png", x:1958, y:225, t:683 },
  { id:"e2_cercles_bleus", img:"cercles_bleus.png", x:1280, y:798, t:316 },
  { id:"e2_etoile_bleue", img:"etoile_bleue.png", x:2287, y:770, t:220 },
  { id:"e2_oeil_piques", img:"oeil_piques.png", x:311, y:883, t:497 },
  { id:"e2_base", img:"bestiole.png", x:1675, y:1052, t:382 },
  { id:"e2_planete_oeil", img:"planete_oeil.png", x:649, y:1277, t:485 },
  { id:"e2_comete", img:"comete.png", x:1481, y:1474, t:141 },
  { id:"e2_gorge", img:"trou_noir.png", x:2146, y:1371, t:324 }
];
