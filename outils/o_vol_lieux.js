#!/usr/bin/env node
/* ===========================================================
   v1.97 — LES LIEUX OÙ L'ON FAIT LES POCHES, HORS DE SILÈNE (K103)
   Le serveur doit savoir où sont les lieux de chaque carte (table
   `vol_lieux`, v222) ; le client les a déjà (espace-data.js,
   espace2-data.js, SURFACES de braise.js). Cet outil LIT le client et
   écrit les lignes SQL, pour que les deux copies ne divergent jamais.
     node outils/o_vol_lieux.js            → affiche le SQL (à recopier)
     node outils/o_vol_lieux.js --verifier sql/v222_vol_partout.sql
                                           → compare avec la migration
   Règle : TOUT LIEU NOMMÉ d'une carte hors de Silène (lieux et décors à nom,
   aires, sites des planètes, station et lac d'Ancolie). Rayon : celui du client
   (`espaceRayon` pour l'espace, `r` pour le sol).
   ⚠ Un lieu ajouté, déplacé ou agrandi côté client → relancer, et passer les
   lignes au serveur (BACKEND_PLAN §6, « Lieux de vol »).
   =========================================================== */
const fs = require("fs"), path = require("path"), vm = require("vm");
const racine = path.join(__dirname, "..");
const lire = f => fs.readFileSync(path.join(racine, f), "utf8");

function lieuxVol(){
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(lire("js/espace-data.js") + "\n;this.ESPACE_LIEUX=ESPACE_LIEUX; this.espaceRayon=espaceRayon;", ctx);
  vm.runInContext(lire("js/espace2-data.js") + "\n;this.ESPACE2_LIEUX=ESPACE2_LIEUX;", ctx);
  const b = lire("js/braise.js"); const i = b.indexOf("const SURFACES"); const j = b.indexOf("\n};", i);
  if(i < 0 || j < 0) throw new Error("SURFACES introuvable dans js/braise.js");
  vm.runInContext(b.slice(i, j + 3) + "\n;this.SURFACES=SURFACES;", ctx);
  const L = [];
  const espace = (secteur, liste) => liste.filter(l => l.nom).forEach(l =>
    L.push({ secteur, id:l.id, nom:l.nom, x:Math.round(l.x), y:Math.round(l.y), r:ctx.espaceRayon(l) }));
  espace("ecart", ctx.ESPACE_LIEUX);
  espace("ceres", ctx.ESPACE2_LIEUX);
  Object.keys(ctx.SURFACES).forEach(s => (ctx.SURFACES[s].lieux || []).filter(l => l.nom).forEach(l =>
    L.push({ secteur:s, id:l.id, nom:l.nom, x:Math.round(l.x), y:Math.round(l.y), r:Math.round(l.r) })));
  return L;
}
function sqlValeurs(L){
  const q = s => "'" + String(s).replace(/'/g, "''") + "'";
  return L.map(l => `  (${q(l.secteur)}, ${q(l.id)}, ${q(l.nom)}, ${l.x}, ${l.y}, ${l.r})`).join(",\n");
}
module.exports = { lieuxVol, sqlValeurs };

if(require.main === module){
  const L = lieuxVol();
  const i = process.argv.indexOf("--verifier");
  if(i < 0){ console.log(sqlValeurs(L)); process.exit(0); }
  const sql = fs.readFileSync(path.resolve(process.argv[i+1]), "utf8");
  const manquants = L.filter(l => !sql.includes(`('${l.secteur}', '${l.id}', '${l.nom.replace(/'/g,"''")}', ${l.x}, ${l.y}, ${l.r})`));
  const n = (sql.match(/^\s+\('(ecart|ceres|braise|suaire|ancolie)'/gm) || []).length;
  console.log(JSON.stringify({ lieuxClient: L.length, lignesSql: n, manquants: manquants.map(l => l.secteur + ":" + l.id), conforme: !manquants.length && n === L.length }, null, 1));
  process.exit(manquants.length || n !== L.length ? 1 : 0);
}
