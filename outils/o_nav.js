// v1.93t — les trois boutons de voyage, partout ; Triptolème ⇄ Ancolie ; carte d'Ancolie ; journal.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
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
  const r = {}, att = ms => new Promise(x=>setTimeout(x,ms)), msgs = [];
  journal = (m) => msgs.push(m); sauverMaintenant = async () => {}; agirServeur = async () => ({ ok:true });
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
  ouvrirOrbite = () => {}; fermerOrbite = () => {}; ouvrirCarteBraise = () => {}; fermerCarteBraise = () => {}; ouvrirCarte = () => { r.carteOuverte = true; };
  etat.espace1 = true; etat.vaisseau = "fab_navette_legere"; etat.ancolie = true; etat.verrouMaar = false; etat.carburant = 40;
  etat.sac = Object.assign(etat.sac || {}, { fab_biocarburant:5 });
  const lire = () => ["#ouvrir-carte","#ouvrir-orbite","#ouvrir-ancolie"].map(s => { const b = document.querySelector(s);
    return b.hidden ? "—" : `${b.querySelector("span").textContent} [${b.querySelector(".cout").textContent}]${b.style.opacity ? " (grisé)" : ""}`; });
  const base = espaceLieu("base");
  // 1. Silène, en ville
  etat.secteur = "silene"; etat.surface = null; etat.pos = { ...VILLES[etat.faction] }; majBoutonOrbite(); r.silene = lire();
  // 2. Triptolème, au Perchoir / ailleurs
  etat.secteur = "ecart"; etat.posEspace = { x:base.x, y:base.y }; majBoutonOrbite(); r.perchoir = lire();
  etat.posEspace = { x:base.x + 900, y:base.y }; majBoutonOrbite(); r.horsPerchoir = lire();
  // 3. Ancolie, à la station / ailleurs
  etat.secteur = "ancolie"; etat.posEspace = null; etat.surface = { x:1063, y:905, abord:false }; majBoutonOrbite(); r.station = lire();
  etat.surface = { x:400, y:1200, abord:false }; majBoutonOrbite(); r.horsStation = lire();
  etat.verrouMaar = true; etat.surface = { x:1063, y:905 }; majBoutonOrbite(); r.verrou = lire()[1]; etat.verrouMaar = false;
  // 4. La Braise (au sol)
  etat.secteur = "braise"; etat.surface = { x:500, y:500 }; majBoutonOrbite(); r.braise = lire(); r.boutonBraise = !document.querySelector("#ouvrir-braise").hidden;
  msgs.length = 0; boutonAncolie(); r.braiseClic = msgs[0];
  // 5. Les nouvelles routes
  etat.secteur = "ancolie"; etat.surface = { x:1063, y:905, abord:false }; etat.carburant = 40;
  await partirEcartDepuisAncolie(); r.ancolieVersTripto = { secteur:etat.secteur, auPerchoir:surBase(), carburant:etat.carburant };
  etat.carburant = 40; await partirAncolieDepuisEcart(); r.triptoVersAncolie = { secteur:etat.secteur, surface:etat.surface, aLaStation:aLaStation() };
  etat.surface = { x:400, y:1200 }; msgs.length = 0; await partirEcartDepuisAncolie(); r.refusHorsStation = etat.secteur === "ancolie" && /rejoins-la/.test(msgs[0]);
  etat.surface = { x:1063, y:905 }; msgs.length = 0; boutonSilene(); await att(150); r.ancolieVersSilene = etat.secteur;
  // 6. La carte d'Ancolie : la station (blanche, recentrée) et rien d'autre (le lac gelé seulement s'il est connu)
  etat.secteur = "ancolie"; etat.surface = { x:1063, y:905 }; etat.seleniteConnue = true;
  let svg = document.querySelector("#carte-braise"); if(!svg){ svg = document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.id = "carte-braise"; document.body.appendChild(svg); }
  majCarteBraise(); const t = svg.innerHTML;
  r.carteAncolie = { station:/La station/.test(t), lac:/Le lac gelé/.test(t), cratere:/Le Cratère/.test(t), glaces:/Les Glaces/.test(t), chute:/point de chute/.test(t),
                     stationBlanche:/cx="1063" cy="905" r="110"[^>]*stroke="#ffffff"/.test(t), boutonRentrer:document.querySelector("#braise-decoller").style.display };
  r.quetesTrouventEncore = !!surfaceLieu("ancolie", "chute") && !!surfaceLieu("ancolie", "cratere");
  // 7. Le journal
  r.journal = _categoriser("Vortex a tenté de te faire les poches — tu l'as repéré à temps.");
  return r;
})();
