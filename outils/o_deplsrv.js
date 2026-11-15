// v2.98 (v300, K271) — les déplacements sur Silène payés au serveur (deplacer). Produit :
//   · `o2` : le surcoût d'O₂ de l'équipement (EQUIP_EFFETS, js/equipement.js), copié dans `_equip_o2_bareme()` ;
//   · `bonus` : force / agi / int / munition de chaque équipement (pour remplir equip_bonus dans la base d'essai) ;
//   · `cas` : 600 trajets tirés au hasard (graine fixe), calculés par le JEU (coutTrajet, coutRetourO2) avec des
//     aptitudes, boissons, Agilité, équipements et positions variés. Le banc SQL refait chaque trajet avec
//     `_deplacement_cout` et compare : aucun écart permis.
// Changer PAS, PAS_O2, une ville, le Protocole, une zone, une aptitude de déplacement ou EQUIP_EFFETS, c'est changer
// le serveur (barème dupliqué, BACKEND_PLAN §6) : relancer, recopier `o2` dans une migration.
//   node outils/o_banc.js . deplsrv
(async function(){
  await new Promise(x => setTimeout(x, 300));
  const O2 = {}, BONUS = {};
  for(const [id, e] of Object.entries(EQUIP_EFFETS)){
    if(e.o2) O2[id] = e.o2;
    BONUS[id] = { force: e.force || 0, agi: e.agi || 0, intel: e.int || 0, munition: MUNITION_ARME[id] || null };
  }
  let g = 20261115;
  const alea = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  const choix = t => t[Math.floor(alea() * t.length)];
  const villes = Object.values(VILLES);
  const point = (entier) => {
    const t = alea(); let p;
    if(t < 0.25){ const v = choix(villes); p = { x: v.x, y: v.y }; }
    else if(t < 0.45){ const v = choix(villes), a = alea() * 6.283, d = alea() * 130; p = { x: v.x + Math.cos(a) * d, y: v.y + Math.sin(a) * d }; }
    else if(t < 0.55){ const a = alea() * 6.283, d = alea() * 200; p = { x: ZONE_PROTOCOLE.x + Math.cos(a) * d, y: ZONE_PROTOCOLE.y + Math.sin(a) * d }; }
    else if(t < 0.70){ const z = choix([ZONE_CHAUDE, ZONE_FROIDE]), a = alea() * 6.283, d = alea() * 420; p = { x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d }; }
    else if(t < 0.75){ p = { x: -100 + alea() * 2600, y: -100 + alea() * 1800 }; }
    else p = { x: alea() * 2400, y: alea() * 1600 };
    if(entier){ p.x = Math.max(0, Math.min(MONDE.w, Math.round(p.x))); p.y = Math.max(0, Math.min(MONDE.h, Math.round(p.y))); }
    return p;
  };
  const APTS = ["om3", "sv4", "ig1", "to1", "om2", "sv1"];
  const BOISSONS = [null, null, { energie_depl: 0.8 }, { energie_depl: 0.75, o2_cout: 1.2 }, { agilite: 15 }, { o2_cout: 0.75 }, { agilite: -6, energie_depl: 1.25 }];
  const EQUIPS = [{}, {}, { tete: "fab_casque_lourd" }, { tete: "fab_casque_lourd", torse: "fab_plastron_lourd", jambes: "fab_jambieres_lourdes" },
                  { arme: "fab_lame_a_singularite", arme2: "fab_lame_a_singularite" }, { arme: "fab_canon_a_singularite", implant: "fab_implant_d_agilite" },
                  { implant: "fab_implant_d_agilite", arme: "fab_couteau_de_survie" }, { arme: "fab_lame_a_plasma", torse: "fab_plastron_leger" }];
  const s0 = JSON.stringify({ pos: etat.pos, ap: etat.aptitudes, comp: etat.competences, eq: etat.equipement, b: etat.boisson, j: etat.jauges, sec: etat.secteur, sac: etat.sac });
  const cas = [];
  for(let i = 0; i < 600; i++){
    const depart = point(true), dest = point(false);
    const pris = APTS.filter(() => alea() < 0.3), mods = choix(BOISSONS), equipement = choix(EQUIPS);
    const agilite = 10 + Math.floor(alea() * 191), moral = alea() < 0.15 ? 0 : 60;
    etat.secteur = "silene"; etat.pos = { x: depart.x, y: depart.y };
    aptEtat().pris = pris.slice(); etat.competences.agilite = agilite; etat.equipement = { ...equipement };
    etat.boisson = mods ? { id: "essai", mods: { ...mods }, fin: new Date(Date.now() + 3600e3).toISOString() } : null;
    etat.jauges.moral = moral; etat.sac = {};
    // même chemin que voyager() : bornes, projection hors du Protocole, puis coutTrajet
    let x = Math.max(0, Math.min(MONDE.w, dest.x)), y = Math.max(0, Math.min(MONDE.h, dest.y));
    const z = ZONE_PROTOCOLE;
    if(dist(x, y, z.x, z.y) < z.r){ const a = Math.atan2(y - z.y, x - z.x); x = z.x + Math.cos(a) * z.r; y = z.y + Math.sin(a) * z.r; }
    const c = coutTrajet(x, y);
    const retour = c ? coutRetourO2({ x, y }) : null;
    const proche = c ? citeLaPlusProche({ x, y }) : null;
    cas.push({ i, depart, dest, pris, mods, equipement, agilite, moral,
               court: !c, x: Math.round(x), y: Math.round(y),
               d: c ? Math.round(c.dOpen * 1000) / 1000 : null, e: c ? c.coutE : null, o: c ? c.coutO : null,
               retour, cite: proche ? proche.f : null,
               agi: agiliteEffective(), eqo2: equipO2() });
  }
  const s = JSON.parse(s0);
  etat.pos = s.pos; etat.aptitudes = s.ap; etat.competences = s.comp; etat.equipement = s.eq; etat.boisson = s.b; etat.jauges = s.j; etat.secteur = s.sec; etat.sac = s.sac;
  return { n: cas.length, courts: cas.filter(c => c.court).length, gratuits: cas.filter(c => c.e === 0).length,
           o2: JSON.stringify(O2), bonus: BONUS, cas };
})()
