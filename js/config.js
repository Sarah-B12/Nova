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

/* ===========================================================
   ⚠ v0.92 — LE SERVEUR N'ÉCRIT PLUS DE LIBELLÉS DE FACTION.

   `evenements.texte` contenait du texte DÉJÀ RENDU : « Raid contre
   Cultivateurs ». Le libellé de `cultivateurs` est pourtant « Le Rhizome »
   depuis longtemps ici — mais le serveur ne le savait pas, et fabriquait le
   sien à partir de l'identifiant.

   La sortie facile aurait été de donner au serveur sa propre table de noms.
   C'est-à-dire une DEUXIÈME copie de FACTIONS, à tenir à jour — précisément le
   motif (a) des pièges du projet. Et la preuve que ces libellés bougent, c'est
   qu'on est en train d'en renommer un.

   Le serveur écrit donc un MARQUEUR, `{fac:cultivateurs}`, et le client le
   rend. Un seul endroit connaît les noms : celui-ci.

   ⚠ TOUT AFFICHAGE d'un texte venu du serveur doit passer par cette fonction.
   Il y en a trois aujourd'hui : le journal du joueur (gouvernement.js) et les
   deux consultations admin (dev-console.js, profil-page.js). Un quatrième
   lecteur qui l'oublierait afficherait le marqueur brut.
   ⚠ Repli volontaire sur l'identifiant capitalisé si l'id est inconnu : mieux
   vaut « Cultivateurs » qu'une accolade à l'écran.
   ⚠ Les événements ÉCRITS AVANT la v0.92 ne contiennent aucun marqueur : ils
   traversent cette fonction sans être modifiés, et gardent leur ancien nom.
   C'est voulu — on ne réécrit pas un journal déjà lu.
   =========================================================== */
function rendreLibelles(t){
  if(typeof t !== "string" || t.indexOf("{") < 0) return t;
  return t
    .replace(/\{fac:([a-z0-9_]+)\}/g, (m, id) => {
      const f = FACTIONS.find(x => x.id === id);
      return f ? f.nom : (id.charAt(0).toUpperCase() + id.slice(1));
    })
    /* ⚠ MÊME MALADIE POUR LES OBJECTIFS. Le serveur écrivait `initcap(objectif)`,
       donc « Raid », pendant que l'interface annonce « Raid éclair » (OBJECTIFS,
       gouvernement.js). Deux noms pour la même opération dans deux écrans du
       même jeu. ⚠ `OBJECTIFS` vit dans gouvernement.js, chargé APRÈS ce
       fichier : l'appel est protégé, et le repli reste l'identifiant capitalisé. */
    .replace(/\{obj:([a-z0-9_]+)\}/g, (m, id) => {
      const o = (typeof OBJECTIFS !== "undefined") ? OBJECTIFS.find(x => x.id === id) : null;
      return o ? o.nom : (id.charAt(0).toUpperCase() + id.slice(1));
    });
}
