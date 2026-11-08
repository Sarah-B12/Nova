// v2.45 — Planche récapitulative de l'écriture de l'ancien (tous les sons, et les mots vus en jeu).
// Usage : node outils/o_planche_glyphes.js [sortie.svg]   (depuis la racine du jeu)
// Produit un SVG autonome (fond sombre, glyphes bleus) ; à convertir en PNG avec n'importe quel outil
// (ex. : un navigateur, Inkscape, ou cairosvg). Les formes viennent de js/glyphes.js : la planche suit le jeu.
const fs = require("fs"), path = require("path");
const racine = path.resolve(__dirname, "..");
const src = fs.readFileSync(path.join(racine, "js/glyphes.js"), "utf8").split("(function(){")[0];
eval(src.replace(/^const /gm, "var "));   // GLYPHES_ANCIEN, glypheSVG, glyphesMot

// L'ordre et les libellés du LORE (§11 bis) : par famille de forme, puis dans l'ordre d'arrivée.
const ORDRE = ["PERI","MEDI","METRE","EM","FER","ALI","BARQUE","TURE","POINT","RASSEMBLE","EVA","DE","AC","LAI","PRO","GRAMME",
  "FIRM","PART","CES","ME","MENT","POSTE","CU","ATION","CON","CAL","RESTREINT","RE","MANDE","SERV","DES","TIN","PUL","SION","CEN",
  "TRE","CUL","TOUR","RAN","QUA","TAINE"];
const LIBELLE = { PERI:"PÉRI", MEDI:"MÉDI", METRE:"MÈTRE", EVA:"ÉVA", DE:"DÉ", CES:"CÈS" };   // v2.46 : TRE (et non TRÉ), comme dans les quêtes
// Les mots vus en jeu (quête de première apparition, sens, sons).
const MOTS = [
  ["Q4","Périmètre",["PERI","METRE"]], ["Q4","Alimentation",["ALI","MENT","ATION"]],
  ["Q4","Point de rassemblement",["POINT","RASSEMBLE","MENT"]], ["Q4","Départ programmé",["DE","PART","PRO","GRAMME"]],
  ["Q4","Poste médical",["POSTE","MEDI","CAL"]], ["Q4","Accès restreint",["AC","CES","RESTREINT"]],
  ["Q9","Évacuation",["EVA","CU","ATION"]], ["Q9","Point d'embarquement",["POINT","EM","BARQUE","MENT"]],
  ["Q9","Confirmation",["CON","FIRM","ATION"]], ["Q9","Délai",["DE","LAI"]],
  ["Q9","Fermeture du périmètre",["FER","ME","TURE","PERI","METRE"]],
  ["Q16","Demande de confirmation",["DE","MANDE","CON","FIRM","ATION"]], ["Q16","Relais",["RE","LAI"]],
  ["Q16","Conservation",["CON","SERV","ATION"]], ["Q16","Destination",["DES","TIN","ATION"]],
  ["Q27","Embarquement",["EM","BARQUE","MENT"]], ["Q27","Départ",["DE","PART"]],
  ["Q31","Cultures",["CUL","TURE"]], ["Q32","Retour",["RE","TOUR"]],
  ["Le Nid","Propulsion",["PRO","PUL","SION"]], ["Le Nid","Concentré",["CON","CEN","TRE"]],
  ["Q42","Rencontre",["RAN","CON","TRE"]], ["Q43","Quatre",["QUA","TRE"]], ["Q44","Centaine",["CEN","TAINE"]],
  ["Q45","Quarantaine (⚠ révélation de l'arc)",["QUA","RAN","TAINE"]]
];
const manquants = Object.keys(GLYPHES_ANCIEN).filter(k => !ORDRE.includes(k));
if(manquants.length) console.error("⚠ sons absents de la planche :", manquants.join(", "));
// La quête où chaque son apparaît pour la première fois.
const premier = {}; MOTS.forEach(([q, , sons]) => sons.forEach(s => { if(!premier[s]) premier[s] = q; }));

const L = 1000, COL = 9, CW = 108, CH = 112, X0 = 20, Y0 = 70;
const lignes = Math.ceil(ORDRE.length / COL), yMots = Y0 + lignes * CH + 30, MH = 80;
const H = yMots + Math.ceil(MOTS.length / 2) * MH + 20;
const FOND = "#0f1e2b", BLEU = "#7db3f2", TEXTE = "#cdd6df", PALE = "#8fa3b5";
const glyphe = (son, x, y, w, h) => glypheSVG(son).replace("<svg", `<svg x="${x}" y="${y}" width="${w}" height="${h}" color="${BLEU}"`);
let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}" viewBox="0 0 ${L} ${H}" font-family="DejaVu Sans, Arial, sans-serif">
<rect width="100%" height="100%" fill="${FOND}"/>
<text x="${X0}" y="40" font-size="21" fill="#e6edf3">L'écriture de l'ancien — ${ORDRE.length} sons</text>\n`;
ORDRE.forEach((son, i) => {
  const cx = X0 + (i % COL) * CW + CW / 2, y = Y0 + Math.floor(i / COL) * CH;
  s += glyphe(son, cx - 16, y, 32, 52);
  s += `<text x="${cx}" y="${y + 74}" font-size="12.5" fill="${TEXTE}" text-anchor="middle">${LIBELLE[son] || son}</text>`;
  s += `<text x="${cx}" y="${y + 90}" font-size="10" fill="${PALE}" text-anchor="middle">${premier[son] || ""}</text>\n`;
});
s += `<text x="${X0}" y="${yMots - 6}" font-size="15" fill="#e6edf3">Les mots lus en jeu</text>\n`;
MOTS.forEach(([q, sens, sons], i) => {
  const x = X0 + (i % 2) * 490, y = yMots + 16 + Math.floor(i / 2) * MH;
  s += `<text x="${x}" y="${y}" font-size="13" fill="${PALE}">${q} — ${sens.replace(/'/g, "&#39;")}</text>`;
  sons.forEach((son, j) => { s += glyphe(son, x + j * 30, y + 8, 24, 40); });
  s += `<text x="${x + sons.length * 30 + 8}" y="${y + 34}" font-size="10.5" fill="${PALE}">${sons.map(k => LIBELLE[k] || k).join("·")}</text>\n`;
});
s += `</svg>`;
const sortie = process.argv[2] || "glyphes_ancien.svg";
fs.writeFileSync(sortie, s);
console.log(`${ORDRE.length} sons, ${MOTS.length} mots → ${sortie} (${L} × ${H})`);
