/* ===========================================================
   APTITUDES-DATA — Arbre d'Aptitudes (données pures).
   Progression par quêtes. ⚠ v1.01 — RÉPARTITION IRRÉGULIÈRE, calée sur les
   moments forts (et non plus 1 PA par quête, ni 5 PA en Q2→Q5 puis plus rien) :
     Q2 (découverte) · Q5 (l'espace) · Q8 et Q12 (les descentes) · Q14
     (l'émission) · Q15 (la bête) = 6 PA à la fin de Q15, pour 30 PA d'arbre.
   Les quêtes sont la SEULE source de PA (gagnerPA ← terminerQuete).
   Chaque voie = chaîne linéaire de 4 nœuds ; prérequis = nœud précédent.
   Coûts : nœuds 1-3 = 1 PA ; nœud 4 (capstone) = APT_CAP_COUT.
   Voir Aptitudes_Nova_Epic.md (v0.3) pour le design figé.
   =========================================================== */
const APT_CAP_COUT = 2;        // coût du capstone (nœud 4)
const APT_RESPEC   = 50000;    // coût d'une réattribution complète, en crédits

// Un nœud : { id, nom, effet, deblocage?:true }
// Ordre du plus faible (haut) au plus fort (capstone) — requis par la chaîne stricte.

/* ---------- Tronc commun (accessible à tous) ---------- */
const APT_TRONC = [
  { id:"survie", nom:"Survie", noeuds:[
    { id:"sv1", nom:"Poumons d'acier", effet:"Coût O₂ des actions −1 (cumulable avec Agilité)." },
    /* v1.25 — Métabolisme et Récupération INVERSÉS (décision de l'autrice).
       Les identifiants suivent leur effet : sv3 reste Métabolisme, sv2
       Récupération. La migration (aptitudes.js, _aptMigrer) rend les PA
       d'une chaîne cassée par l'inversion. */
    { id:"sv3", nom:"Métabolisme",     effet:"Quand une patrouille a le dessus sur toi, tu perds 25 % de santé et de moral en moins." },
    { id:"sv2", nom:"Récupération",    effet:"Régénération d'énergie +2 %/h (base 10 %/h ; au total 13,5 %/h au plus, avec Organisme et les racines de ta cité)." },
    { id:"sv4", nom:"Endurance",       effet:"Énergie −15 % : terrain, mine, chantiers, déplacements (à pied, en vol, en atmosphère), gravier, sondes et choix de quête." }
  ]},
  { id:"prospecteur", nom:"Prospection", noeuds:[
    { id:"pr1", nom:"Filon profond",   effet:"Nouvelles mines : réserve +50 % (500 → 750)." },
    { id:"pr2", nom:"Cultures vivaces",effet:"Bio-dôme : croissance +25 % ; Enclos : +1 produit à la tonte." },
    { id:"pr3", nom:"Œil du mineur",   effet:"+chance de minerais rares en minant." },
    { id:"pr4", nom:"Sac renforcé",    effet:"+15 places de sac (50 → 65)." }
  ]},
  { id:"artisan", nom:"Artisanat", noeuds:[
    { id:"ar1", nom:"Récup d'atelier",   effet:"20 % de chance de récupérer 1 unité de l'ingrédient le plus abondant de la recette." },
    { id:"ar2", nom:"Production en série",effet:"10 % de chance de fabriquer 2 objets pour 1." },
    { id:"ar3", nom:"Apprentissage",     effet:"+1 point de formation bonus par objet fabriqué." },
    { id:"ar4", nom:"Maître-artisan",    effet:"Une recette consomme 1 matière première de moins sur son plus gros lot (min 1).", deblocage:true }
  ]},
  { id:"traqueur", nom:"Combativité", noeuds:[
    /* v1.25 — Cuirasse et Instinct INVERSÉS ; Fléau du Protocole (tr4)
       SUPPRIMÉ, remplacé par Traque (identifiant `traque`, lu par le serveur :
       a_aptitude_traque). Les PA de tr4 sont rendus par la migration. */
    { id:"tr2", nom:"Cuirasse",           effet:"En expédition ou contre une attaque du Protocole, tu perds 30 % de santé et de moral en moins si ton camp est battu." },   // v1.36r
    { id:"tr1", nom:"Instinct de combat", effet:"+8 points de chance de victoire contre les patrouilles ; +1 salve contre les sondes (6 au lieu de 5)." },
    { id:"tr3", nom:"Pillage",            effet:"Butin de combat (crédits) +25 %." },
    { id:"traque", nom:"Traque",          effet:"Chasseur de primes : pister et traquer les têtes mises à prix (Prison → Wanted).", deblocage:true }
  ]},
  /* ⚠ v0.94b — RENOMMÉE « Furtivité ». « Ombre » est aussi le nom du rôle
     d'espion au gouvernement (GOUV_ROLES) : deux choses sans rapport portaient
     le même mot, dans deux écrans voisins.
     ⚠ L'IDENTIFIANT reste `ombre`, et les nœuds restent om1..om4 : ce sont eux
       qui sont écrits dans `donnees.aptitudes.pris`. Renommer l'id effacerait
       les aptitudes déjà prises par tout le monde. Seul le libellé change. */
  { id:"ombre", nom:"Furtivité", noeuds:[
    { id:"om1", nom:"Discrétion", effet:"Réduit le risque de tomber sur une patrouille du Protocole en te déplaçant." },
    { id:"om2", nom:"Repérage",   effet:"Déplacements à découvert : −10 % d'O₂ ; butin de patrouille +25 %." },
    { id:"om3", nom:"Pas léger",  effet:"Énergie −20 % pour te déplacer : à pied (Silène, La Braise, Le Suaire), en vaisseau dans Triptolème et lors des sauts en atmosphère." },
    { id:"om4", nom:"Intrusion",  effet:"Ouvre le piratage des joueurs (onglet Voler/Hacker) ; +25 points pour pirater une patrouille ou brouiller une sonde.", deblocage:true }
  ]}
];

/* ---------- Branches de faction (une seule visible : la sienne) ---------- */
const APT_FACTIONS = {
  ignis: { nom:"Ignis — Forge & Feu", noeuds:[
    { id:"ig1", nom:"Sang de magma", effet:"Coûts d'énergie (actions et déplacements) et d'O₂ −15 % en zone chaude (autour de la Forge)." },
    { id:"ig2", nom:"Fournaise",     effet:"En zone chaude : minage +25 % et butin de patrouille +25 %." },
    { id:"ig3", nom:"Combustion",    effet:"+6 points de chance de victoire contre les patrouilles.", deblocage:true },
    { id:"ig4", nom:"Cœur de forge", effet:"+5 de Force tant qu'une arme est équipée (patrouilles, expéditions, défense).", deblocage:true }
  ]},
  cultivateurs: { nom:"Le Rhizome — Symbiose & Bio", noeuds:[
    { id:"cu1", nom:"Autarcie",      effet:"Consommables et plantes soignent +30 %." },
    { id:"cu2", nom:"Verger",        effet:"Bio-dôme : récolte 5-9 → 7-11." },
    { id:"cu3", nom:"Photosynthèse", effet:"Régénère +5 O₂ par heure (la flore recycle l'air)." },
    { id:"cu4", nom:"Organisme",     effet:"Régénération passive : +1 santé, +1 moral et +1 énergie par heure (santé/moral plafonnés à 60 ; énergie : 13,5 %/h au plus en tout).", deblocage:true }
  ]},
  toundra: { nom:"La Toundra — Givre & Endurance", noeuds:[
    { id:"to1", nom:"Isolation",       effet:"Coûts d'énergie (actions et déplacements) et d'O₂ −15 % en zone froide ; +chance de Givrite au minage." },
    { id:"to2", nom:"Trempe",          effet:"Quand une patrouille a le dessus sur toi, tu perds 10 % de santé et de moral en moins." },   // v1.36r : précisé
    { id:"to3", nom:"Réserves d'hiver",effet:"+2 places de coffre par palier de maison (stockage accru)." },
    { id:"to4", nom:"Veine de cristal",effet:"5 % de chance d'extraire un Cristal de Nyx à chaque minage en zone froide.", deblocage:true }
  ]},
  rouage: { nom:"Le Rouage — Machines & Récup", noeuds:[
    { id:"ro1", nom:"Réparateur", effet:"Mines +30 % de réserve." },
    /* v1.25 — Recyclage et Chantier INVERSÉS (décision de l'autrice). */
    { id:"ro3", nom:"Recyclage",  effet:"Démolir rembourse 50 % des crédits/matériaux.", deblocage:true },
    { id:"ro2", nom:"Chantier",   effet:"Construire une structure coûte 25 % de crédits en moins ; les attaques du Protocole abîment tes structures 25 % moins." },
    { id:"ro4", nom:"Surrégime",  effet:"Toutes tes structures produisent +50 % (mines, bio-dôme, enclos)." }
  ]},
  nomades: { nom:"Les Nomades — Route & Négoce", noeuds:[
    { id:"no1", nom:"Boutique mobile",effet:"Achat à la boutique depuis n'importe où (+10 % de surcoût).", deblocage:true },
    { id:"no2", nom:"Marchand",       effet:"Taxe de mise en vente au marché réduite de moitié : 5 % au lieu de 10 % (4 % avec le Fragment du négoce)." },
    { id:"no3", nom:"Négociant",      effet:"+15 % de crédits sur les butins, les récompenses de quête et la brade." },
    { id:"no4", nom:"Voyageur",       effet:"Vaisseau : −20 % de carburant pour les vols et les sauts." }
  ]}
};

// Coût d'un nœud selon sa position (0-3) dans sa chaîne.
function aptCout(idx){ return idx === 3 ? APT_CAP_COUT : 1; }
