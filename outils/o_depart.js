// v2.63 — partir avec l'aller seulement (K217), le kit au Nid, le Perchoir sans « Le »
// node o_banc.js .. depart
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  const journ = []; const jOrig = journal; journal = (t) => journ.push(t);
  const sauve = { orbiteDebloquee, verrouMaar, villeActuelle, vaisseauCloue, _payerSaut, autonomieCarburant, ouvrirOrbite, majApresDeplacement };
  orbiteDebloquee = () => true; verrouMaar = () => false; villeActuelle = () => ({ id:"x" }); vaisseauCloue = () => false;
  let payes = 0; _payerSaut = async () => { payes++; return false; };   // on s'arrête juste après la décision
  etat.vaisseau = "fab_vaisseau_cargo"; etat.secteur = "silene";
  const cs = coutSaut(); const prixPlein = _prixPleinComptoir(cs.carb, cs.litres);
  r.saut = { litres: cs.litres, carburant: cs.carb, prixDuRetourAuPerchoir: prixPlein };
  const essai = async (nom, litres, credits) => {
    autonomieCarburant = () => litres; etat.credits = credits; journ.length = 0; payes = 0;
    await partirVersEcart();
    r[nom] = { part: payes > 0, journal: journ[0] };
  };
  await essai("aller-retour emporté", 2*cs.litres, 0);
  await essai("aller seul, de quoi payer", cs.litres, prixPlein);
  await essai("aller seul, pas assez de crédits", cs.litres, prixPlein - 1);
  await essai("pas même l'aller", cs.litres - 1, 99999);
  Object.assign(window, {}); for(const k in sauve) eval(`${k} = sauve.${k}`);
  // Le comptoir du Nid.
  const sNid = surNid; surNid = () => true; const sOuv = nidOuvert; nidOuvert = () => true;
  r.nid = { articles: _catalogueBoutique().map(a => a.id), onglets: _catsBoutique().map(c => c.id) };
  surNid = sNid; nidOuvert = sOuv;
  journal = jOrig;
  return r;
})();
