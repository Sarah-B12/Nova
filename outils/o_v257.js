// v2.57 — le vaisseau maître dure 45 jours (K192).
// node o_banc.js .. v257
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  etat.aptitudes = { pris:[], pa:0, v:254 };
  r.duree = ["fab_vaisseau_maitre","fab_vaisseau_cargo","fab_navette_legere","selenite","fab_canon_a_singularite"].map(id => id + ":" + dureeVie(id)).join(" ");   // 45 30 30 35 30
  etat.aptitudes.pris = ["ar1","ar2","ar3"];
  r.entretien = ["fab_vaisseau_maitre","fab_vaisseau_cargo"].map(id => dureeViePerso(id)).join(" / ");   // 54 / 36
  return r;
})();
