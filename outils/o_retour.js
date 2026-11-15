// v2.18 — Le carburant du retour, d'où qu'on soit (node outils/o_banc.js .. retour).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
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
  etat.espace1 = true; etat.permisVaisseau = true; etat.ceres = true; etat.vaisseau = "fab_vaisseau_cargo"; etat.vaisseauPv = {};
  etat.sac = {}; sauverMaintenant = async () => {};
  etat.nidOuvert = true;   // v2.32 (K155) : le Nid vend du carburant après Q32 (le cas fermé : plus bas)
  const c = coutSaut(), b = espaceLieu("base"), t = espaceLieu("trou_noir"), g = espaceLieu("e2_gorge"), nid = espaceLieu("e2_base");
  const vp = coutVol({ x:b.x, y:b.y }, { x:t.x, y:t.y }).litres;
  r.couts = { saut:c.litres, gorgeVersPerchoir:vp };
  const cas = (secteur, pos, carb, credits) => { etat.secteur = secteur; etat.posEspace = pos; etat.carburant = carb; etat.credits = credits; return vaisseauSansRetour(); };
  // 1. Triptolème (inchangé)
  r.triptoleme = { assez: cas("ecart", { x:b.x, y:b.y }, c.litres, 0), peuEtRiche: cas("ecart", { x:b.x, y:b.y }, c.litres - 1, 99999), peuEtPauvre: cas("ecart", { x:b.x, y:b.y }, c.litres - 1, 0) };
  // 2. Cérès, au Nid : il faut le trajet jusqu'à la Gorge + le saut + la bouche → Perchoir
  const vg = coutVol({ x:g.x, y:g.y }, { x:nid.x, y:nid.y }).litres, besoin = vg + c.litres + vp;
  r.ceres = { besoinDepuisNid: besoin,
    unSautEtDemi_pauvre: cas("ceres", { x:nid.x, y:nid.y }, c.litres + vp, 0),          // avant : « il peut rentrer » (faux)
    unSautEtDemi_riche: cas("ceres", { x:nid.x, y:nid.y }, c.litres + vp, 99999),         // il achètera au Nid
    assez: cas("ceres", { x:nid.x, y:nid.y }, besoin, 0) };
  // v2.32 (K155) : avant la fin de Q32, le Nid ne vend rien → riche mais à court = sans retour (évacué).
  etat.nidOuvert = false; r.ceres.nidFerme_riche = cas("ceres", { x:nid.x, y:nid.y }, c.litres + vp, 99999);   // vrai
  etat.nidOuvert = true;
  // 3. Une surface (Ancolie) : décollage ×1,5, pas de carburant en vente
  etat.secteur = "ancolie"; etat.surface = { ...SURFACES.ancolie.abri };
  const cs = coutSautSurface(surfaceCfg());
  etat.carburant = cs.litres - 1; etat.credits = 99999;
  r.ancolie = { decollage: cs.litres, pasAssezMaisRiche: vaisseauSansRetour() };        // avant : « il achètera » (faux : rien à acheter ici)
  etat.carburant = cs.litres; r.ancolie.assez = vaisseauSansRetour();
  etat.surface = null;
  // 4. Entrer à Cérès : deux sauts ne suffisent plus, il faut aussi la bouche → Perchoir
  const lignes = []; const vj = journal; journal = (x, ...y) => { lignes.push(String(x)); return vj(x, ...y); };
  const rpc0 = sb.rpc.bind(sb); sb.rpc = (n, a) => n === "agir" ? Promise.resolve({ data:{ ok:true, energie:90, jauges:etat.jauges }, error:null }) : rpc0(n, a);
  /* v3.01 (v303) : sauts, vols et pleins passent par le serveur (saut_payer, espace_voler, carburant_plein) : on rejoue
     ici ce qu'il fait, avec les formules du jeu, pour comparer aux versions d'avant (qui n'appellent pas ces fonctions). */
  { const rpcE = sb.rpc;
    const verser = () => { const v = vaisseauActif(); if(!v) return null; if((etat.carburant || 0) >= v.reservoir) return { err:"plein" };
      const lieu = (etat.sac[v.carb] || 0) > 0 ? "sac" : ((etat.soute && etat.soute[v.carb]) || 0) > 0 ? "soute" : null;
      if(!lieu) return { err:"manque" };
      if(lieu === "sac") etat.sac[v.carb]--; else etat.soute[v.carb]--;
      const av = etat.carburant || 0; etat.carburant = Math.min(v.reservoir, av + (CARBURANT_LITRES[v.carb] || 0));
      return { ok:true, ajoute:etat.carburant - av, carburant:etat.carburant, reservoir:v.reservoir }; };
    sb.rpc = (n, a) => {
      if(n === "saut_payer"){ const c = a.p_type === "gorge" ? coutSaut(true) : a.p_type === "ancolie" ? coutSautSurface(SURFACES.ancolie) : coutSaut();
        if(!c) return Promise.resolve({ data:{ ok:false, err:"aucun" }, error:null });
        if((etat.carburant || 0) < c.litres) return Promise.resolve({ data:{ ok:false, err:"carburant", litres:c.litres, carburant:etat.carburant || 0 }, error:null });
        return Promise.resolve({ data:{ ok:true, type:a.p_type, litres:c.litres, cout_e:c.energie, carburant:Math.max(0, (etat.carburant || 0) - c.litres), reservoir:c.reservoir }, error:null }); }
      if(n === "carburant_plein"){ const x = verser(); return Promise.resolve({ data: x && x.ok ? x : { ok:false, err:(x && x.err) || "aucun" }, error:null }); }
      if(n === "espace_voler"){ const dest = { x:a.p_x, y:a.p_y }, j = volPossible(dest);
        if(!j.ok) return Promise.resolve({ data: j.err === "retour" ? { ok:false, err:"retour", besoin:j.besoin, autonomie:autonomieCarburant() }
                                                              : { ok:false, err:j.err, cout:j.cout && j.cout.energie }, error:null });
        const pleins = []; let g = 0;
        while((etat.carburant || 0) < j.cout.litres && g++ < 20){ const x = verser(); if(!x || !x.ok) break; pleins.push({ ajoute:x.ajoute, carburant:x.carburant }); }
        if((etat.carburant || 0) < j.cout.litres) return Promise.resolve({ data:{ ok:false, err:"transfert", pleins, carburant:etat.carburant }, error:null });
        return Promise.resolve({ data:{ ok:true, x:dest.x, y:dest.y, d:j.cout.d, cout_e:j.cout.energie, litres:j.cout.litres,
                                        carburant:Math.max(0, (etat.carburant || 0) - j.cout.litres), pleins }, error:null }); }
      return rpcE(n, a); }; }
  // v2.63 (K217) : sans crédits — avec de quoi payer le reste au Nid, le passage est désormais permis.
  etat.secteur = "ecart"; etat.posEspace = { x:t.x, y:t.y }; etat.carburant = 2 * c.litres; etat.energie = 100; etat.credits = 0;
  await passerLaGorge();
  r.entree = { deuxSautsRefuse: etat.secteur === "ecart" && lignes.some(l => /rejoindre le Perchoir coûte/.test(l)) };
  etat.carburant = 2 * c.litres + vp; await passerLaGorge();
  r.entree.avecLeRetourPasse = etat.secteur === "ceres";
  // 5. Coincé à Cérès sans rien : évacuation chez soi (K100)
  etat.secteur = "ceres"; etat.posEspace = { x:nid.x, y:nid.y }; etat.carburant = 0; etat.credits = 0;
  if(typeof initCredits === "function") initCredits(0);   // v3.02 : aucun écart en attente (le secours passe par le serveur)
  const ok = await secoursOrbite();
  r.evacuation = { secours: ok, chezSoi: etat.secteur === "silene" };
  journal = vj; sb.rpc = rpc0;
  return r;
})();
