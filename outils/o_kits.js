// v2.79 (K246, K250) — les kits de réparation : prix aux comptoirs, kit lourd au Nid SEUL, PV rendus.
// v2.80 (K252) — et la boutique des cités : Kit de soin 160 ₡, Biocarburant 320 ₡.
//   node outils/o_banc.js . kits
(async function(){
  const r = {};
  const nid = _surNidBoutique, base = _surBaseBoutique;
  _surNidBoutique = () => false; _surBaseBoutique = () => true;
  r.perchoir = _catalogueBoutique().filter(a => /kit/.test(a.id)).map(a => `${a.id}:${a.prix}`);
  _surNidBoutique = () => true;
  r.nid = _catalogueBoutique().filter(a => /kit/.test(a.id)).map(a => `${a.id}:${a.prix}`);
  _surNidBoutique = () => false; _surBaseBoutique = () => false;   // v2.80 (K252) : la boutique d'une cité
  r.ville = _catalogueBoutique().filter(a => a.id === "fab_kit_de_soin" || a.id === "fab_biocarburant").map(a => `${a.id}:${a.prix}`);
  _surNidBoutique = nid; _surBaseBoutique = base;
  r.marche = { kit:PRIX_ITEM.kit_reparation, lourd:PRIX_ITEM.kit_reparation_lourd };
  r.marcheSousComptoir = PRIX_ITEM.kit_reparation.max < 150 && PRIX_ITEM.kit_reparation_lourd.max < 560;
  r.nom = item("kit_reparation_lourd") && item("kit_reparation_lourd").nom;
  r.image = IMG_ITEM.kit_reparation_lourd;
  // réparer : un cargo à 50 PV, un kit lourd puis un petit
  const appels = []; const ag = agirServeur;
  agirServeur = async (o) => { appels.push(o); for(const [k, n] of Object.entries(o.retirer || {})) etat.sac[k] = (etat.sac[k] || 0) - n; return true; };
  /* v3.00 (v302) : le kit passe par coque_reparer_kit ; on rejoue ici ce que fait le serveur (retirer le kit, réparer
     de KITS_PV, plafonné) et on note le même retrait, pour comparer aux versions d'avant. */
  const rpcK = sb.rpc;
  sb.rpc = (n, a) => { if(n !== "coque_reparer_kit") return rpcK(n, a);
    if((etat.sac[a.p_item] || 0) < 1) return Promise.resolve({ data:{ ok:false, err:"manque" }, error:null });
    appels.push({ retirer:{ [a.p_item]:1 }, motif:"reparer_coque" }); etat.sac[a.p_item]--;
    const avant = pvVaisseau(), apres = Math.min(pvMax(), avant + KITS_PV[a.p_item]);
    return Promise.resolve({ data:{ ok:true, vaisseau:etat.vaisseau, avant, coque:apres, max:pvMax(), gagne:apres - avant }, error:null }); };
  etat.vaisseau = "fab_vaisseau_cargo"; etat.vaisseauPv = { fab_vaisseau_cargo:50 };
  etat.sac.kit_reparation_lourd = 1; etat.sac.kit_reparation = 1;
  await utiliserKitReparation("kit_reparation_lourd"); r.apresLourd = pvVaisseau();
  await utiliserKitReparation("kit_reparation");       r.apresPetit = pvVaisseau();
  await utiliserKitReparation("kit_reparation_lourd"); r.sansKitLourd = pvVaisseau();   // plus de kit lourd : rien ne bouge
  r.retraits = appels.map(o => Object.keys(o.retirer || {})[0]);
  agirServeur = ag; sb.rpc = rpcK;
  return r;
})()
