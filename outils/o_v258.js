// v2.58 — bogue : le bouton « plein » se grisait avec des bidons en soute et rien au sac.
// node o_banc.js .. v258
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  etat.permisVaisseau = true; etat.vaisseau = "fab_navette_legere"; etat.carburant = 10;
  if(!document.querySelector("#vaisseau-vue")){ const d = document.createElement("div"); d.id = "vaisseau-vue"; document.body.appendChild(d); }
  etat.soute = etat.soute || {};
  const etatBouton = () => { majVaisseau(); const b = document.querySelector("#vais-plein"); return b ? (b.disabled ? "grisé" : "actif") : "absent"; };
  etat.sac.fab_biocarburant = 0; etat.soute.fab_biocarburant = 2; r.souteSeule = etatBouton();     // actif (était grisé)
  etat.sac.fab_biocarburant = 1; etat.soute.fab_biocarburant = 0; r.sacSeul = etatBouton();        // actif
  etat.sac.fab_biocarburant = 0; etat.soute.fab_biocarburant = 0; r.rien = etatBouton();           // grisé
  etat.sac.fab_biocarburant = 1; etat.carburant = 40;             r.reservoirPlein = etatBouton(); // grisé
  return r;
})();
