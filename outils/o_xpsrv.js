// v2.93 (v295, K267) — la courbe des niveaux copiée au serveur (`_niveau_de_xp`, niveau_monter) : xpCumulPour(n) pour
// n = 1 … NIVEAU_MAX + 1, et niveauDeXp aux bornes. Changer la courbe ou NIVEAU_MAX = changer aussi le serveur
// (BACKEND_PLAN §6) : relancer, comparer `seuils` avec `select public._xp_seuil(n)`.
//   node outils/o_banc.js . xpsrv
(async function(){
  await new Promise(x => setTimeout(x, 300));
  const seuils = []; for(let n = 1; n <= NIVEAU_MAX + 1; n++) seuils.push(xpCumulPour(n));
  const essais = {}; for(const xp of [0, 9, 19, 20, 59, 60, 3799, 3800, 100000, 252799, 252800, 999999]) essais[xp] = niveauDeXp(xp);
  return { niveauMax: NIVEAU_MAX, seuils: seuils.join(","), essais };
})()
