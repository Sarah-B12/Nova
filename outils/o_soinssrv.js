// v2.92 (v294, K266) — les soins copiés au serveur. Produit le catalogue de `_soins_catalogue()` (copie de
// EFFET_CONSO / effetConso, sans les vivres des réserves, déjà au serveur : reserves_manger) et vérifie le
// coefficient d'Autarcie (aptSoin). Changer un soin, c'est changer le serveur (barème dupliqué, BACKEND_PLAN §6) :
// relancer, recopier `catalogue` dans v294 (ou une migration suivante).
//   node outils/o_banc.js . soinssrv
(async function(){
  await new Promise(x => setTimeout(x, 300));
  const C = {};
  const ids = new Set([...Object.keys(EFFET_CONSO), ...TOUS_ITEMS.map(i => i.id)]);
  for(const id of ids){
    if(typeof VIVRES_STATION !== "undefined" && VIVRES_STATION[id]) continue;
    const e = effetConso(id); if(!e) continue;
    const o = {}; for(const g of ["o2","sante","moral"]) if(e[g]) o[g] = e[g];
    if(Object.keys(o).length) C[id] = o;
  }
  const pris = aptEtat().pris; const sans = aptSoin(100); aptEtat().pris = [...pris, "cu1"]; const avec = aptSoin(100); aptEtat().pris = pris;
  return { n: Object.keys(C).length, autarcie: avec / sans, catalogue: JSON.stringify(C) };
})()
