// v2.56 — le maître consomme 1,5 (K190) ; la Gorge coûte moins d'énergie qu'un saut d'atmosphère (K191).
// node o_banc.js .. v256
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  etat.aptitudes = { pris:[], pa:0, v:254 };
  const saut = id => { etat.vaisseau = id; const a = coutSaut(), g = coutSaut(true); return `${a.litres} L ${a.energie} % | Gorge ${g.litres} L ${g.energie} %`; };
  r.navette = saut("fab_navette_legere");     // 18 L 14 % | Gorge 18 L 8 %
  r.cargo   = saut("fab_vaisseau_cargo");     // 36 L 16 % | Gorge 36 L 10 %
  r.maitre  = saut("fab_vaisseau_maitre");    // 27 L 18 % | Gorge 27 L 12 %
  r.conso = VAISSEAUX.fab_vaisseau_maitre.conso;                                                   // 1,5
  // Un vol dans Triptolème, en maître : Perchoir → Gravier (8 étapes × 1,5 = 12 L)
  const b = espaceLieu("base"), g = espaceLieu("asteroides");
  r.gravier = coutVol({ x:g.x, y:g.y }, { x:b.x, y:b.y }).litres;                                   // 12
  // Avec Endurance et Pas léger (déplacements) : la Gorge reste moins chère
  etat.aptitudes.pris = ["sv4", "om3"]; r.gorgeAptitudes = coutSaut(true).energie + " / " + coutSaut().energie;   // 9 / 13 (maître)
  return r;
})();
