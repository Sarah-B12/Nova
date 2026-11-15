// v3.01 (v303, K271/K272) — le carburant et les vols dans l'espace payés au serveur. Produit :
//   · `cfg` : ce que le serveur doit connaître — VAISSEAUX (conso, réservoir, carburant, énergie), CARBURANT_LITRES,
//     cartes de Triptolème et Cérès (taille, base, Gorge, Nid), PAS_ESPACE_E / _C, SAUT_UNITES, SAUT_ENERGIE,
//     GORGE_ENERGIE, coutMult d'Ancolie, majorations (avarie, régulateur) — copié dans `_espace_cfg()` ;
//   · `cas` : 600 vols et sauts tirés au hasard (graine fixe), calculés par le JEU (coutVol, coutSaut, coutSautSurface,
//     _coutRetourBase) avec vaisseaux, coques (avarie ou non), régulateur, aptitudes, Intelligence, boissons variés.
//     Le banc SQL refait chaque cas avec `_carburant_vol` / `_carburant_saut` et compare : aucun écart permis.
//   node outils/o_banc.js . espsrv
(async function(){
  await new Promise(x => setTimeout(x, 300));
  const V = {};
  for(const [id, v] of Object.entries(VAISSEAUX)) V[id] = { conso: v.conso || 1, reservoir: v.reservoir, carb: v.carb, energie: v.energie || 0 };
  const L = id => { const l = espaceLieu(id); return l ? { x: l.x, y: l.y, r: espaceRayon(l) } : null; };
  const CFG = { vaisseaux: V, litres: CARBURANT_LITRES, pas_e: PAS_ESPACE_E, pas_c: PAS_ESPACE_C, saut_unites: SAUT_UNITES,
                saut_energie: SAUT_ENERGIE, gorge_energie: GORGE_ENERGIE, ancolie_mult: SURFACES.ancolie.coutMult,
                avarie: PV_SEUIL_AVARIE, malus_avarie: PV_MALUS_CARBURANT, regulateur: REGULATEUR_FACTEUR,
                cartes: { ecart: { w: ESPACE_MONDE.w, h: ESPACE_MONDE.h, base: L("base"), gorge: L("trou_noir") },
                          ceres: { w: ESPACE2_MONDE.w, h: ESPACE2_MONDE.h, base: L("e2_base"), gorge: L("e2_gorge") } } };
  let g = 20261117;
  const alea = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  const choix = t => t[Math.floor(alea() * t.length)];
  const APTS = ["no4", "sv4", "om3"];
  const BOISSONS = [null, null, { energie_depl: 0.8 }, { energie_depl: 1.25 }, { intelligence: 20 }, { intelligence: -8, energie_depl: 0.75 }];
  const EQUIPS = [{}, {}, { tete: "fab_casque_lourd" }, { implant: "fab_implant_maitre" }, { arme: "fab_pistolet_a_plasma" }];
  const s0 = JSON.stringify({ sec: etat.secteur, pe: etat.posEspace, v: etat.vaisseau, pv: etat.vaisseauPv, ap: etat.aptitudes, comp: etat.competences, eq: etat.equipement, b: etat.boisson, j: etat.jauges, sac: etat.sac });
  const mod0 = Object.assign({}, _modulesVaisseau);
  const cas = [];
  for(let i = 0; i < 600; i++){
    const sect = choix(["ecart", "ceres"]), carte = CFG.cartes[sect];
    const vid = choix(Object.keys(VAISSEAUX)), vv = VAISSEAUX[vid];
    const regul = alea() < 0.25, module = alea() < 0.2;
    _modulesVaisseau = {}; if(regul) _modulesVaisseau.regulateur = new Date(Date.now() + 86400e3).toISOString();
    if(module) _modulesVaisseau.module = new Date(Date.now() + 86400e3).toISOString();
    const pmax = pvMax(vid), pv = choix([pmax, Math.floor(pmax * 0.31), Math.floor(pmax * 0.29), 1, Math.floor(pmax * alea())]);
    const pris = APTS.filter(() => alea() < 0.3), mods = choix(BOISSONS), equipement = choix(EQUIPS);
    const intel = 10 + Math.floor(alea() * 220), moral = alea() < 0.15 ? 0 : 60;
    const pt = () => { const t = alea(); if(t < 0.2) return { x: carte.base.x, y: carte.base.y };
      if(t < 0.3) return { x: carte.gorge.x, y: carte.gorge.y };
      return { x: Math.round(alea() * carte.w), y: Math.round(alea() * carte.h) }; };
    const depart = pt(), dest = pt();
    etat.secteur = sect; etat.posEspace = { ...depart }; etat.vaisseau = vid; etat.vaisseauPv = { [vid]: pv };
    aptEtat().pris = pris.slice(); etat.competences.intelligence = intel; etat.equipement = { ...equipement };
    etat.boisson = mods ? { id: "essai", mods: { ...mods }, fin: new Date(Date.now() + 3600e3).toISOString() } : null;
    etat.jauges.moral = moral; etat.sac = {};
    const c = coutVol(dest), r = c ? _coutRetourBase(dest) : null;
    const s = coutSaut(false), sg = coutSaut(true), sa = coutSautSurface(SURFACES.ancolie);
    cas.push({ i, sect, vid, pv, regul, module, pris, mods, equipement, intel, moral, depart, dest,
               court: !c, d: c ? Math.round(c.d * 1000) / 1000 : null, e: c ? c.energie : null, l: c ? c.litres : null,
               retour: r ? r.litres : null, saut: [s.litres, s.energie], gorge: [sg.litres, sg.energie], ancolie: [sa.litres, sa.energie],
               avarie: vaisseauAvarie(), int: intelligenceEffective() });
  }
  const s = JSON.parse(s0);
  etat.secteur = s.sec; etat.posEspace = s.pe; etat.vaisseau = s.v; etat.vaisseauPv = s.pv; etat.aptitudes = s.ap; etat.competences = s.comp;
  etat.equipement = s.eq; etat.boisson = s.b; etat.jauges = s.j; etat.sac = s.sac; _modulesVaisseau = mod0;
  return { n: cas.length, courts: cas.filter(c => c.court).length, avaries: cas.filter(c => c.avarie).length, cfg: JSON.stringify(CFG), cas };
})()
