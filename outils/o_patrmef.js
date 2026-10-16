// v1.83 — Les patrouilles se méfient (node outils/o_banc.js . patrmef)
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  etat.patrJour = null;
  r.debut = { butin: patrouilleAvecButin(), durete: patrouilleMefianceDurete(), hack: patrouilleMefianceHack() };
  for(let k = 0; k < 5; k++) patrouilleCompter();
  r.apres5 = { butin: patrouilleAvecButin(), durete: patrouilleMefianceDurete(), hack: patrouilleMefianceHack() };
  for(let k = 0; k < 4; k++) patrouilleCompter();
  r.apres9 = { durete: patrouilleMefianceDurete(), hack: +patrouilleMefianceHack().toFixed(2) };
  for(let k = 0; k < 20; k++) patrouilleCompter();
  r.plafond = { durete: patrouilleMefianceDurete(), hack: +patrouilleMefianceHack().toFixed(2) };
  etat.patrJour.jour = "2000-01-01";
  r.lendemain = { n: _patrJour().n, butin: patrouilleAvecButin() };
  return r;
})();
