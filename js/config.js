/* ===========================================================
   CONFIG — Constantes de jeu, compétences et factions.
   =========================================================== */
/* ===========================================================
   LOGIQUE — rien ne bouge sans action. Compétences plafonnées à 200.
   =========================================================== */
const MAX = 100;
const CAP_COMP = 200;
const CLE = "nova-epic-save";
const PTS_PAR_NIVEAU = 3;
const MS_JOUR = 86400000;

const COMPETENCES = [
  { id:"force", nom:"Force", desc:"Améliore tes chances au combat et réduit les dégâts subis en cas de défaite." },
  { id:"agilite", nom:"Agilité", desc:"Réduit le coût en oxygène de tes actions (−1 O₂ tous les 5 points)." },
  { id:"intelligence", nom:"Intelligence", desc:"Augmente les crédits gagnés par tes actions (+1 tous les 5 points)." }
];
const FACTIONS = [
  { id:"ignis",        nom:"Ignis",        avantage:"Zones chaudes moins coûteuses",            couleur:"#f2743a" },
  { id:"cultivateurs", nom:"Le Rhizome",   avantage:"Recyclage de l'air et régénération passive", couleur:"#6fd08a" },
  { id:"toundra",      nom:"La Toundra",   avantage:"Zones froides moins coûteuses",            couleur:"#5fb7e6" },
  { id:"rouage",       nom:"Le Rouage",    avantage:"Entretien et récupération à bas coût",     couleur:"#c08cf0" },
  { id:"nomades",      nom:"Les Nomades",  avantage:"Carburant et déplacements avantageux",     couleur:"#e6b84f" }
];
