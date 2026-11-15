// v2.99 (v301, K271) — les déplacements au sol des surfaces (La Braise, Le Suaire, Ancolie) payés au serveur
// (deplacer_sol). Produit :
//   · `cfg` : ce que le serveur doit connaître de SURFACES (js/braise.js) — taille, O₂ ×, vaisseau, abri, arrivées
//     de quête (défis « saut » vers une surface, js/quetes-data.js) —, copié dans `_surfaces_cfg()` ;
//   · `cas` : 600 trajets tirés au hasard (graine fixe), calculés par le JEU (coutBraise, coutRetourVaisseau) avec
//     des aptitudes, boissons, Agilité, équipements et positions variés. Le banc SQL refait chaque trajet avec
//     `_deplacement_sol_cout` et compare : aucun écart permis.
// Changer une surface (taille, vaisseau, abri, o2Mult), PAS, PAS_O2 ou une aptitude de déplacement, c'est changer
// le serveur (barème dupliqué, BACKEND_PLAN §6) : relancer, recopier `cfg` dans une migration.
//   node outils/o_banc.js . solsrv
(async function(){
  await new Promise(x => setTimeout(x, 300));
  const CFG = {};
  for(const [k, c] of Object.entries(SURFACES)){
    CFG[k] = { w: c.w, h: c.h, o2: c.o2Mult || 1, air: !!c.air, vaisseau: { x: c.vaisseau.x, y: c.vaisseau.y, r: c.vaisseau.r } };
    if(c.abri) CFG[k].abri = { x: c.abri.x, y: c.abri.y, r: c.abri.r };
    CFG[k].arrivees = [];
  }
  for(const q of QUETES) for(const e of (q.etapes || [])){
    const d = e.defi; if(!d || d.type !== "saut" || !CFG[d.carte || ""]) continue;
    const l = surfaceLieu(d.carte, d.lieu || "chute");
    if(l && !CFG[d.carte].arrivees.some(a => a.x === l.x && a.y === l.y)) CFG[d.carte].arrivees.push({ x: l.x, y: l.y, quete: q.id });
  }
  let g = 20261116;
  const alea = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  const choix = t => t[Math.floor(alea() * t.length)];
  const APTS = ["om3", "sv4", "ig1", "to1", "om2", "sv1"];
  const BOISSONS = [null, null, { energie_depl: 0.8 }, { energie_depl: 0.75, o2_cout: 1.2 }, { agilite: 15 }, { o2_cout: 0.75 }, { agilite: -6, energie_depl: 1.25 }];
  const EQUIPS = [{}, {}, { tete: "fab_casque_lourd" }, { tete: "fab_casque_lourd", torse: "fab_plastron_lourd", jambes: "fab_jambieres_lourdes" },
                  { arme: "fab_lame_a_singularite", arme2: "fab_lame_a_singularite" }, { arme: "fab_canon_a_singularite", implant: "fab_implant_d_agilite" },
                  { implant: "fab_implant_d_agilite", arme: "fab_couteau_de_survie" }];
  const s0 = JSON.stringify({ sec: etat.secteur, surf: etat.surface, ap: etat.aptitudes, comp: etat.competences, eq: etat.equipement, b: etat.boisson, j: etat.jauges, sac: etat.sac });
  const point = (c, entier) => {
    const t = alea(); let p;
    if(t < 0.2) p = { x: c.vaisseau.x, y: c.vaisseau.y };
    else if(t < 0.35){ const z = choix([c.vaisseau, c.abri || c.vaisseau]), a = alea() * 6.283, d = alea() * 220; p = { x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d }; }
    else if(t < 0.45){ const z = choix([{ x: 360, y: 270 }, { x: 1910, y: 380 }]), a = alea() * 6.283, d = alea() * 650; p = { x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d }; }
    else if(t < 0.5) p = { x: -100 + alea() * 2600, y: -100 + alea() * 1800 };
    else p = { x: alea() * c.w, y: alea() * c.h };
    if(entier){ p.x = Math.max(0, Math.min(c.w, Math.round(p.x))); p.y = Math.max(0, Math.min(c.h, Math.round(p.y))); }
    return p;
  };
  const cas = [];
  for(let i = 0; i < 600; i++){
    const sect = choix(["braise", "suaire", "ancolie"]), c = SURFACES[sect];
    const depart = point(c, true), dest = point(c, false), abord = alea() < 0.3;
    const pris = APTS.filter(() => alea() < 0.3), mods = choix(BOISSONS), equipement = choix(EQUIPS);
    const agilite = 10 + Math.floor(alea() * 191), moral = alea() < 0.15 ? 0 : 60;
    etat.secteur = sect; etat.surface = { x: depart.x, y: depart.y, abord };
    aptEtat().pris = pris.slice(); etat.competences.agilite = agilite; etat.equipement = { ...equipement };
    etat.boisson = mods ? { id: "essai", mods: { ...mods }, fin: new Date(Date.now() + 3600e3).toISOString() } : null;
    etat.jauges.moral = moral; etat.sac = {};
    const k = coutBraise(dest.x, dest.y);
    const x = Math.max(0, Math.min(c.w, dest.x)), y = Math.max(0, Math.min(c.h, dest.y));
    const retour = k ? coutRetourVaisseau({ x, y }) : null;
    const abriAvant = c.abri ? aLaStation() : false;
    cas.push({ i, sect, depart, abord, dest, pris, mods, equipement, agilite, moral, court: !k,
               x: Math.round(x), y: Math.round(y), d: k ? Math.round(k.d * 1000) / 1000 : null,
               e: k ? k.coutE : null, o: k ? k.coutO : null, retour, abriAvant,
               abriApres: c.abri && k ? aLaStation({ x: Math.round(x), y: Math.round(y) }) : false,
               chaud: enZoneChaude(), froid: enZoneFroide() });
  }
  const s = JSON.parse(s0);
  etat.secteur = s.sec; etat.surface = s.surf; etat.aptitudes = s.ap; etat.competences = s.comp; etat.equipement = s.eq; etat.boisson = s.b; etat.jauges = s.j; etat.sac = s.sac;
  return { n: cas.length, courts: cas.filter(c => c.court).length, cfg: JSON.stringify(CFG), cas };
})()
