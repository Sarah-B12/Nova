// v3.00 (v302, K272) — la coque des vaisseaux par le serveur. Vérifie :
//   · kit : `coque_reparer_kit` (aucun agir), la coque RENVOYÉE adoptée, la phrase ; un refus est dit ;
//   · réparateur : `coque_reparateur` par rpcAvecSolde — la page ne débite rien, le solde renvoyé s'applique ;
//   · remorquage d'un vaisseau cloué : `coque_remorquage` (crédits et coque par le serveur), le déplacement ici ;
//     v3.02 (v304) : `secours_orbite` (le secours entier, déplacement compris) ;
//   · tir de sonde : appliqué ici tout de suite ET envoyé à `coque_abimer` (raison « sonde ») ;
//   · Gravier : la coque renvoyée par gravier_miner, annonce d'avarie au passage du seuil ;
//   · enfant mécano : la coque réparée par le serveur, adoptée ;
//   · sauvegarde : la coque renvoyée (`coque`) adoptée — sauf si un appel de coque a eu lieu pendant ce temps.
//   node outils/o_banc.js . coque
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
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
  const appels = []; const rpc0 = sb.rpc.bind(sb); let rep = {}, sauveRep = null;
  sb.rpc = (n, a) => {
    if(/^coque_|^agir$|^crediter$|^enfant_coque_prendre$|^secours_orbite$/.test(n)) appels.push(n + (n === "coque_abimer" ? `:${a.p_points}:${a.p_raison}` : "") + (n === "agir" ? ":" + a.p_motif : "") + (n === "crediter" ? ":" + a.delta : ""));
    if(rep[n]) return Promise.resolve({ data: typeof rep[n] === "function" ? rep[n](a) : rep[n], error: null });
    if(n === "sauver_profil" && sauveRep) return Promise.resolve({ data: sauveRep(a), error: null });
    if(n === "agir") return Promise.resolve({ data: { ok: true, energie: 70, jauges: { o2: 100, sante: 90, moral: 80 } }, error: null });
    return rpc0(n, a);
  };
  const dernier = () => (etat.journal[0] || {}).t || "";
  const V = "fab_navette_legere";
  etat.vaisseau = V; etat.vaisseauPv = { [V]: 30 }; etat.sac.kit_reparation = 2; etat.credits = 1000;
  if(typeof initCredits === "function") initCredits(1000);
  tenterPatrouille = () => {};

  // 1. kit
  rep.coque_reparer_kit = { ok: true, vaisseau: V, avant: 30, coque: 70, max: 120, gagne: 40 };
  appels.length = 0; await utiliserKitReparation("kit_reparation");
  r.kit = { appels: appels.slice(), pv: pvVaisseau(), journal: dernier() };
  rep.coque_reparer_kit = { ok: false, err: "fleau" };
  await utiliserKitReparation("kit_reparation");
  r.kitRefus = dernier();

  // 2. réparateur
  etat.secteur = "ecart"; const ep = espaceLieu("epave"); etat.posEspace = { x: ep.x, y: ep.y };
  rep.coque_reparateur = { ok: true, vaisseau: V, avant: 70, coque: 120, max: 120, gagne: 50, cout: 75, solde: 925 };
  appels.length = 0; await reparerChezReparateur();
  r.reparateur = { appels: appels.slice(), pv: pvVaisseau(), credits: etat.credits, journal: etat.journal.slice(0, 2).map(e => e.t).find(t => /neuf/.test(t)) };

  // 3. remorquage d'un vaisseau cloué (Triptolème)
  etat.vaisseauPv = { [V]: 0 }; etat.posEspace = { x: 2000, y: 1400 }; etat.credits = 925;
  rep.coque_remorquage = { ok: true, vaisseau: V, coque: 30, max: 120, frais: 200, du: 200, solde: 725 };
  rep.secours_orbite = { ok: true, cas: "cloue", vaisseau: V, coque: 30, max: 120, frais: 200, du: 200, solde: 725, palier: false,
                        secteur: "ecart", posEspace: { x: espaceLieu("base").x, y: espaceLieu("base").y } };   // v3.02 (v304) : le secours entier
  appels.length = 0; const ok = await secoursOrbite();
  const b = espaceLieu("base");
  r.remorquage = { ok, appels: appels.slice(), pv: pvVaisseau(), credits: etat.credits, auPerchoir: etat.posEspace.x === b.x && etat.posEspace.y === b.y,
                   journal: (etat.journal.find(e => /remorque/.test(e.t)) || {}).t };

  // 4. tir de sonde
  etat.vaisseauPv = { [V]: 100 }; rep.coque_abimer = a => ({ ok: true, vaisseau: V, avant: 100, coque: 100 - a.p_points, max: 120 });
  appels.length = 0; abimerVaisseau(32, "tir de sonde"); const pvTout = pvVaisseau();
  await new Promise(x => setTimeout(x, 50));
  r.sonde = { appels: appels.slice(), pvTout, pvApres: pvVaisseau() };

  // 5. Gravier (le serveur tire les éraflures) : passage du seuil d'avarie
  etat.vaisseauPv = { [V]: 37 };
  annoncerCoqueServeur({ vaisseau: V, coque: 35 }, "éraflures d'astéroïdes");
  r.gravier = { pv: pvVaisseau(), journal: dernier() };

  // 6. enfant mécano
  etat.vaisseauPv = { [V]: 100 };
  rep.enfant_coque_prendre = { ok: true, points: 5, prenom: "Lune", vaisseau: V, coque: 105, max: 120, gagne: 5 };
  _coqueTs = 0; await _coqueEnfant();
  r.enfant = { pv: pvVaisseau(), journal: (etat.journal.find(e => /Lune/.test(e.t)) || {}).t };

  // 7. sauvegarde
  etat.vaisseauPv = { [V]: 120 };
  sauveRep = a => ({ ok: true, rev: 300, maj: 9, coque: { [V]: 42 } });
  await sauverMaintenant();
  r.sauveCoque = pvVaisseau();
  sauveRep = a => { _coqueSeq++; return { ok: true, rev: 301, maj: 10, coque: { [V]: 12 } }; };   // un appel de coque pendant l'envoi
  await sauverMaintenant();
  r.sauvePendantAppel = pvVaisseau();
  sauveRep = null;

  sb.rpc = rpc0;
  return r;
})()
