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
  /* Descriptions volontairement évocatrices : elles disent à quoi sert la
     compétence, pas ses formules. Les chiffres changent, ces textes non. */
  { id:"force", nom:"Force", desc:"Fait de toi un combattant qu'on évite : tu l'emportes plus souvent, tu encaisses moins, et tu pèses lourd dans les expéditions de ta faction." },
  { id:"agilite", nom:"Agilité", desc:"Te rend vif et discret : tu ménages ton oxygène en chemin, tu esquives les coups, tu passes sous le nez des patrouilles et tu as la main leste." },
  { id:"intelligence", nom:"Intelligence", desc:"Aiguise ton flair : meilleure négociation, récoltes plus généreuses, chapardage plus rentable et systèmes qui cèdent plus vite." }
];
const FACTIONS = [
  { id:"ignis",        nom:"Ignis",        avantage:"Zones chaudes moins coûteuses",            couleur:"#f2743a" },
  { id:"cultivateurs", nom:"Le Rhizome",   avantage:"Recyclage de l'air et régénération passive", couleur:"#6fd08a" },
  { id:"toundra",      nom:"La Toundra",   avantage:"Zones froides moins coûteuses",            couleur:"#5fb7e6" },
  { id:"rouage",       nom:"Le Rouage",    avantage:"Entretien et récupération à bas coût",     couleur:"#c08cf0" },
  { id:"nomades",      nom:"Les Nomades",  avantage:"Carburant et déplacements avantageux",     couleur:"#e6b84f" }
];
