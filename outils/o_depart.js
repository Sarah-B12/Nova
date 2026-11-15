// v2.63 — partir avec l'aller seulement (K217), le kit au Nid, le Perchoir sans « Le »
// node o_banc.js .. depart
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  /* v3.02 (v304) : changements de carte, sauts de quête et secours passent par le serveur (carte_changer, carte_quete,
     secours_orbite) : on rejoue ici ce qu'il fait, avec les règles du jeu, pour comparer aux versions d'avant (qui
     n'appellent pas ces fonctions). L'arrivée reste posée par la page, comme avant. */
  { const rpc304 = sb.rpc;
    sb.rpc = (n, a) => {
      const rep = d => Promise.resolve({ data:d, error:null });
      if(n === "carte_changer"){
        const v = a.p_vers, de = etat.secteur || "silene";
        const type = (de === "ecart" && v === "ceres") || (de === "ceres" && v === "ecart") ? "gorge"
                   : (de === "silene" && v === "ancolie") || (de === "ancolie" && v === "silene") ? "ancolie" : "saut";
        const c = type === "gorge" ? coutSaut(true) : type === "ancolie" ? coutSautSurface(SURFACES.ancolie) : coutSaut();
        if(!c) return rep({ ok:false, err:"aucun" });
        if((etat.carburant || 0) < c.litres) return rep({ ok:false, err:"carburant", litres:c.litres, carburant:etat.carburant || 0 });
        return rep({ ok:true, type, litres:c.litres, cout_e:c.energie, carburant:Math.max(0, (etat.carburant || 0) - c.litres), reservoir:c.reservoir, de, secteur:v });
      }
      if(n === "carte_quete") return rep({ ok:true, secteur:a.p_carte });
      if(n === "secours_orbite"){
        const cloue = !!etat.vaisseau && vaisseauCloue(), sec = !!etat.vaisseau && !cloue && vaisseauSansRetour();
        if(etat.vaisseau && !cloue && !sec) return rep({ ok:false, err:"pas_de_secours" });
        const p25 = repPalier(typeof REP_PALIER_RAPATRIEMENT !== "undefined" ? REP_PALIER_RAPATRIEMENT : 25), cr = Math.max(0, etat.credits || 0);
        const frais = sec ? Math.floor(cr * (p25 ? SECOURS_SEC_PALIER : SECOURS_SEC)) : (!etat.vaisseau && p25) ? SECOURS_FRAIS_PALIER : SECOURS_FRAIS;
        const du = Math.min(frais, cr), d = { ok:true, cas: cloue ? "cloue" : sec ? "sec" : "sans", frais, du, solde:cr - du, palier:p25 };
        if(cloue) Object.assign(d, { vaisseau:etat.vaisseau, coque:Math.ceil(pvMax() * PV_REMORQUAGE), max:pvMax(), secteur: enCeres() ? "ceres" : "ecart" });
        else d.secteur = "silene";
        return rep(d);
      }
      return rpc304(n, a); }; }
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
  // v2.70 (K234) : l'énergie des changements de carte ; la phrase du secours à sec sans crédits.
  etat.vaisseau = "fab_vaisseau_cargo"; r.energieSaut = coutSaut().energie; r.energieGorge = coutSaut(true).energie;
  const s2 = { enEspace, vaisseauSansRetour, majApresDeplacement };
  enEspace = () => true; vaisseauSansRetour = () => true; majApresDeplacement = () => {}; window.sauverMaintenant = async () => {};
  etat.secteur = "ecart"; etat.credits = 3; journ.length = 0;
  if(typeof initCredits === "function") initCredits(3);   // v3.02 : aucun écart en attente (le secours passe par le serveur)
  await secoursOrbite();
  r.secoursTroisCredits = { pris: 3 - etat.credits, texte: journ[0] };
  enEspace = s2.enEspace; vaisseauSansRetour = s2.vaisseauSansRetour; majApresDeplacement = s2.majApresDeplacement;
  journal = jOrig;
  return r;
})();
