// v1.60 — SOURCE de la table serveur `prix_moyen` (v183_missions_coffre.sql,
// BACKEND_PLAN §80) : remboursement du matériel des missions (C12).
//   node outils/o_banc.js . prixmoyen
// Sortie : [item_id, moy] pour chaque objet de PRIX_ITEM. ⚠ Changer un prix
// dans js/prix.js, c'est changer la table : recoller le bloc
// `insert into public.prix_moyen` (barème dupliqué, BACKEND_PLAN §6).
(function(){
  const out = Object.keys(PRIX_ITEM||{}).sort().map(id=>[id, PRIX_ITEM[id].moy]);
  return { n: out.length, sql: out.map(([i,m])=>`  ('${i}', ${m})`).join(",\n") };
})()
