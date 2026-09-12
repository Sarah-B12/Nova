/* ===========================================================
   APTITUDES-DATA — Arbre d'Aptitudes (données pures).
   Progression par quêtes : 1 point d'Aptitude (PA) par quête.
   Chaque voie = chaîne linéaire de 4 nœuds ; prérequis = nœud précédent.
   Coûts : nœuds 1-3 = 1 PA ; nœud 4 (capstone) = APT_CAP_COUT.
   Voir Aptitudes_Nova_Epic.md (v0.3) pour le design figé.
   =========================================================== */
const APT_CAP_COUT = 2;        // coût du capstone (nœud 4)
const APT_RESPEC   = 50000;    // coût d'une réattribution complète, en crédits
const APT_QUETES_V1 = 15;      // nombre de quêtes prévues en v1 (info)

// Un nœud : { id, nom, effet, deblocage?:true }
// Ordre du plus faible (haut) au plus fort (capstone) — requis par la chaîne stricte.

/* ---------- Tronc commun (accessible à tous) ---------- */
const APT_TRONC = [
  { id:"survie", nom:"Survie", noeuds:[
    { id:"sv1", nom:"Poumons d'acier", effet:"Coût O₂ des actions −1 (cumulable avec Agilité)." },
    { id:"sv2", nom:"Récupération",    effet:"Régénération d'énergie +2 %/h." },
    { id:"sv3", nom:"Métabolisme",     effet:"Pertes de santé/moral en cas d'échec −25 %." },
    { id:"sv4", nom:"Endurance",       effet:"Coût en énergie de toutes tes actions −15 %." }
  ]},
  { id:"prospecteur", nom:"Prospecteur", noeuds:[
    { id:"pr1", nom:"Filon profond",   effet:"Nouvelles mines : réserve +50 % (500 → 750)." },
    { id:"pr2", nom:"Cultures vivaces",effet:"Bio-dôme : croissance +25 % ; Enclos : +1 produit à la tonte." },
    { id:"pr3", nom:"Œil du mineur",   effet:"+chance de minerais rares en minant." },
    { id:"pr4", nom:"Sac renforcé",    effet:"+15 places de sac (50 → 65)." }
  ]},
  { id:"artisan", nom:"Artisan", noeuds:[
    { id:"ar1", nom:"Récup d'atelier",   effet:"20 % de chance de récupérer 1 unité de l'ingrédient le plus abondant de la recette." },
    { id:"ar2", nom:"Production en série",effet:"10 % de chance de fabriquer 2 objets pour 1." },
    { id:"ar3", nom:"Apprentissage",     effet:"+1 point de formation bonus par objet fabriqué." },
    { id:"ar4", nom:"Maître-artisan",    effet:"Une recette consomme 1 matière première de moins sur son plus gros lot (min 1).", deblocage:true }
  ]},
  { id:"traqueur", nom:"Traqueur", noeuds:[
    { id:"tr1", nom:"Instinct de combat", effet:"+8 points de chance de victoire contre les patrouilles." },
    { id:"tr2", nom:"Cuirasse",           effet:"Dégâts subis en défaite −30 %." },
    { id:"tr3", nom:"Pillage",            effet:"Butin de combat (crédits) +25 %." },
    { id:"tr4", nom:"Fléau du Protocole", effet:"Contre le Protocole : +10 % de victoire et +25 % de butin en patrouille ; force ×1,25 en expédition contre lui.", deblocage:true }
  ]},
  { id:"ombre", nom:"Ombre", noeuds:[
    { id:"om1", nom:"Discrétion", effet:"Réduit le risque de tomber sur une patrouille du Protocole en te déplaçant." },
    { id:"om2", nom:"Repérage",   effet:"Déplacements à découvert : −10 % d'énergie et d'O₂ ; butin de patrouille +25 %." },
    { id:"om3", nom:"Pas léger",  effet:"Coût énergie de déplacement −20 %." },
    { id:"om4", nom:"Intrusion",  effet:"Améliore le piratage des patrouilles du Protocole ; ouvrira la posture vol/hack sur les joueurs (PvP à venir).", deblocage:true }
  ]}
];

/* ---------- Branches de faction (une seule visible : la sienne) ---------- */
const APT_FACTIONS = {
  ignis: { nom:"Ignis — Forge & Feu", noeuds:[
    { id:"ig1", nom:"Sang de magma", effet:"Coûts d'énergie (actions et déplacements) et d'O₂ −15 % en zone chaude (autour de la Forge)." },
    { id:"ig2", nom:"Fournaise",     effet:"En zone chaude : minage +25 % et butin de patrouille +25 %." },
    { id:"ig3", nom:"Combustion",    effet:"+6 points de chance de victoire contre les patrouilles.", deblocage:true },
    { id:"ig4", nom:"Cœur de forge", effet:"Toute arme équipée gagne un bonus permanent ; +10 % butin de combat en attendant.", deblocage:true }
  ]},
  cultivateurs: { nom:"Le Rhizome — Symbiose & Bio", noeuds:[
    { id:"cu1", nom:"Autarcie",      effet:"Consommables et plantes soignent +30 %." },
    { id:"cu2", nom:"Verger",        effet:"Bio-dôme : récolte 5-9 → 7-11." },
    { id:"cu3", nom:"Photosynthèse", effet:"Régénère +2 O₂ par heure (la flore recycle l'air)." },
    { id:"cu4", nom:"Organisme",     effet:"Régénération passive : +1 santé, +1 moral et +1 énergie par heure (santé/moral plafonnés à 60).", deblocage:true }
  ]},
  toundra: { nom:"La Toundra — Givre & Endurance", noeuds:[
    { id:"to1", nom:"Isolation",       effet:"Coûts d'énergie (actions et déplacements) et d'O₂ −15 % en zone froide ; +chance de Givrite au minage." },
    { id:"to2", nom:"Trempe",          effet:"Dégâts subis en défaite −10 %." },
    { id:"to3", nom:"Réserves d'hiver",effet:"+2 places de coffre par palier de maison (stockage accru)." },
    { id:"to4", nom:"Veine de cristal",effet:"5 % de chance d'extraire un Cristal de Nyx à chaque minage en zone froide.", deblocage:true }
  ]},
  rouage: { nom:"Le Rouage — Machines & Récup", noeuds:[
    { id:"ro1", nom:"Réparateur", effet:"Mines +30 % de réserve." },
    { id:"ro2", nom:"Chantier",   effet:"Bâtir une structure −25 % crédits." },
    { id:"ro3", nom:"Recyclage",  effet:"Démolir rembourse 50 % des crédits/matériaux.", deblocage:true },
    { id:"ro4", nom:"Surrégime",  effet:"Toutes tes structures produisent +50 % (mines, bio-dôme, enclos)." }
  ]},
  nomades: { nom:"Les Nomades — Route & Négoce", noeuds:[
    { id:"no1", nom:"Boutique mobile",effet:"Achat à la boutique depuis n'importe où (+10 % de surcoût).", deblocage:true },
    { id:"no2", nom:"Marchand",       effet:"Taxe de mise en vente au marché réduite de moitié : 5 % au lieu de 10 % (4 % avec le Fragment du négoce)." },
    { id:"no3", nom:"Négociant",      effet:"+15 % de crédits sur les butins, les récompenses de quête et la brade." },
    { id:"no4", nom:"Voyageur",       effet:"Coût énergie de déplacement −20 %." }
  ]}
};

// Coût d'un nœud selon sa position (0-3) dans sa chaîne.
function aptCout(idx){ return idx === 3 ? APT_CAP_COUT : 1; }
