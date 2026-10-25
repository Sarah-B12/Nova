// v1.93y (K73, SQL v219) — les dés du fond : plafond propre (500 ₡) et gains ×2 / ×4.
(async () => {
  const r = {};
  const z = document.createElement("div"); document.body.appendChild(z);
  _barJeux = { ok:true, jeux:{ des:"ok" }, mise_max:1000, mise_max_des:500, mise_min:50, joues_aujourdhui:0 };
  _tableDes(z);
  r.maxServeur = z.querySelector("#des-mise").max;
  r.options = [...z.querySelectorAll("#des-pari option")].map(o => o.textContent).join(" | ");
  _barJeux = { ok:true, jeux:{ des:"ok" }, mise_max:1000, mise_min:50, joues_aujourdhui:0 };   // serveur d'avant v219
  _tableDes(z);
  r.maxAncienServeur = z.querySelector("#des-mise").max;
  _barJeux = { ok:true, jeux:{ des:"ok" }, mise_max:300, mise_max_des:300, mise_min:50, joues_aujourdhui:0 };   // niveau 3
  _tableDes(z);
  r.maxNiveau3 = z.querySelector("#des-mise").max;
  r.carte = BAR_JEUX.find(j => j.id === "des").gains;
  r.attendu = r.maxServeur === "500" && r.maxAncienServeur === "500" && r.maxNiveau3 === "300" && !/2,2|5,5/.test(r.options + r.carte);
  return r;
})()
