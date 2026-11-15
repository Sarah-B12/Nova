// v3.09 (K279, balance) — la Navette de réserve dure 20 jours (au lieu de 10) ; son préavis (3, 2 et 1 jour avant,
// une fois par jour de jeu, depuis la v0.91) dit aussi où trouver le vaisseau suivant.
//   node outils/o_banc.js . navette20
(async function(){
  await new Promise(x => setTimeout(x, 400));
  const r = {}, J = JOUR_MS, now = Date.now();
  r.duree = dureeVie("navette_reserve");
  etat.navetteFin = 0; const fin = navetteCadeauPosee(); r.echeanceJours = Math.round((fin - now) / J * 10) / 10;
  etat._lotsSynchro = true;
  const preavis = async (id, ilReste) => {
    etat.vaisseau = id; etat.vaisseauPreavis = null; etat.journal = [];
    etat.vaisseauDate = now - (dureeViePerso(id) - ilReste) * J;
    if(id === "navette_reserve") etat.navetteFin = etat.vaisseauDate + dureeVie(id) * J;
    try{ await majUsure(); }catch(e){ return "erreur " + e; }
    return etat.journal.map(e => e.t).find(t => /plus que/.test(t)) || null;
  };
  r.navetteA15jours = await preavis("navette_reserve", 15.5);
  r.navetteA3jours  = await preavis("navette_reserve", 2.5);
  r.navetteA1jour   = await preavis("navette_reserve", 0.5);
  r.navetteLegereA2jours = await preavis("fab_navette_legere", 1.5);
  return r;
})()
