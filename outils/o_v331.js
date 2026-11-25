// v3.31 — vérification de l'économie (node outils/o_banc.js . v331) : K317 (contre paiement), K320/K321
// (refus du serveur dits au joueur), K322 (boutique mobile hors de Silène), prix de la brade.
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const journ = []; journal = t => journ.push(String(t));
  const appels = []; let REP = {};
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => { appels.push({ nom, a });
    if(REP[nom]) return Promise.resolve({ data:REP[nom], error:null });
    return orig(nom, a); };
  sauverMaintenant = async () => {};

  // 1. Boutique mobile (K322) : sur Silène hors cité 340 → 374 ; hors de Silène, au moins le Perchoir (520 → 572).
  const rech = BOUTIQUE.find(a => a.id === "fab_recharge_d_oxygene");
  const kit  = BOUTIQUE.find(a => a.id === "fab_kit_de_soin");
  const bio  = BOUTIQUE.find(a => a.id === "fab_biocarburant");
  const gr   = BOUTIQUE.find(a => a.id === "graine_sylve");
  villeActuelle = () => null; surBase = () => false; surNid = () => false;
  etat.boisson = null;
  etat.secteur = "silene";
  r.mobileSilene = [_prixBoutique(rech), _prixBoutique(kit)].join("/");          // 374/176
  etat.secteur = "ecart";
  r.mobileOrbite = [_prixBoutique(rech), _prixBoutique(kit), _prixBoutique(bio), _prixBoutique(gr)].join("/");   // 572/286/352/9
  etat.secteur = "ancolie";
  r.mobileAncolie = _prixBoutique(rech);                                            // 572
  surBase = () => true; etat.secteur = "ecart";
  const rechP = BASE_BOUTIQUE.find(a => a.id === "fab_recharge_d_oxygene");
  r.comptoirPerchoir = _prixBoutique(rechP);                                        // 520
  surBase = () => false; etat.secteur = "silene"; villeActuelle = () => FACTIONS[0].id;
  r.cite = _prixBoutique(rech);                                                     // 340
  villeActuelle = () => null;

  // 2. Brade : Négociant (+15 %) et boisson « crédits », arrondi sur le total comme le serveur.
  const prisAvant = (etat.aptitudes && etat.aptitudes.pris) ? etat.aptitudes.pris.slice() : null;
  r.bradeBase = bradeTotal("cristal", 3);                                            // 400/2 × 3 = 600
  _apt = id => id === "no3";
  r.bradeNego = bradeTotal("cristal", 3);                                            // 690
  r.bradeNegoCendrite = bradeTotal("cendrite", 7);                                   // round(2×7×1,15) = 16
  boissonMod = (c, d) => c === "credits" ? 0.8 : d;
  r.bradeNegoBoisson = bradeTotal("cristal", 1);                                     // round(200×1,15×0,8) = 184

  // 3. Contre paiement (K317) : sac trop petit → message, AUCUN appel au serveur.
  etat.sac = etat.sac || {};
  placesLibres = () => 20;
  _posteCache = [{ id:77, statut:"attente", type:"objet", montant:300, quantite:80, item_id:"cendrite", deNom:"Eve", a_id:"moi" }];
  etat.credits = 5000;
  const n0 = appels.length;
  await posteRecuperer(77);
  r.contrePaiementMsg = journ.some(t => t.includes("Il te faut 80 places libres pour récupérer ce colis (contre paiement)"));
  r.contrePaiementSansAppel = !appels.slice(n0).some(x => x.nom === "poste_recuperer");
  // Le serveur dit la même chose s'il est appelé quand même (autre appareil, place changée).
  placesLibres = () => 999;
  REP.poste_recuperer = { ok:false, err:"sac_plein", contre_paiement:true, requis:80, place:20 };
  await posteRecuperer(77);
  r.contrePaiementServeur = journ.filter(t => t.includes("Il te faut 80 places libres")).length === 2;

  // 4. Refus du serveur dits au joueur (pause, lieu, périmé, trop cher, propre offre).
  r.ecoPause = ecoRefusTexte({ err:"pause" }) === "Tu es en pause : sors de pause pour commercer.";
  r.ecoLieu = ecoRefusTexte({ err:"lieu" }) === "Il faut être dans la cité de ce marché.";
  r.ecoInconnu = ecoRefusTexte({ err:"fonds" }) === null;
  REP.poste_refuser = { ok:false, err:"pause" };
  await posteRefuser(77);
  r.refusPause = journ.some(t => t === "Tu es en pause : sors de pause pour commercer.");
  REP.caisse_don = { ok:false, err:"mort" };
  if(typeof faireDon === "function"){ try{ await faireDon(100); }catch(e){} }
  // achat au marché hors de la cité
  _offresCache = [{ id:5, item_id:"cendrite", vendeur_id:"x", prix:5, quantite:1, acquis_le:new Date().toISOString(), faction:FACTIONS[0].id }];
  placesLibres = () => 10; etat.permisVaisseau = true;
  REP.acheter_offre = { ok:false, err:"lieu", faction:FACTIONS[0].id };
  renderMarche = async () => {};
  await acheterOffre(5);
  r.marcheLieu = journ.some(t => t === "Il faut être dans la cité de ce marché.");
  REP.acheter_offre_faction = { ok:false, err:"soi" };
  await acheterOffreFaction(5);
  r.factionSoi = journ.some(t => t === "La caisse ne paie pas tes propres offres.");
  REP.acheter_offre_faction = { ok:false, err:"trop_cher", cout:60, plafond:48 };
  await acheterOffreFaction(5);
  r.factionTropCher = journ.some(t => t.startsWith("Ce lot est vendu trop cher pour la caisse"));
  // brade d'un lot périmé
  etat.sac.sylve = 2;
  REP.brader = { ok:false, err:"perime", possede:0, etat:null };
  await braderObjet("sylve", 1);
  r.bradePerime = journ.some(t => t === "Cet objet a périmé : il ne t'en reste que 0.");
  if(prisAvant && etat.aptitudes) etat.aptitudes.pris = prisAvant;
  return r;
})();
