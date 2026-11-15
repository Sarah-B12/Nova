// v3.03 (v305, K273) — les rencontres de sondes tirées et réglées par le serveur. Produit :
//   · `cfg` : ce que le serveur doit connaître — SONDE_TAUX, FLEAU_LENTILLE, SONDE_PV_RIPOSTE, SONDE_PV_DEFAITE
//     (js/sonde.js, js/fleau.js), la dérive (35 % + Int ÷ 300, 90 % au plus), le brouillage (chanceHack : HACK_BASE,
//     HACK_INTRUSION, HACK_PLAFOND, ITEM_HACK, js/patrouille.js), l'anticipation (intelBonusVaisseau : Int ÷ 1000,
//     20 % au plus) — copié dans `_sonde_cfg()` ;
//   · `cas` : 600 personnages tirés au hasard (graine fixe) — Intelligence, aptitude Intrusion (om4), boisson,
//     équipement (dont l'Ordinateur de hacking), moral — avec les chances calculées par le JEU (dérive, brouillage,
//     anticipation, matériel). Le banc SQL refait chaque cas avec `_sonde_chances` et compare : aucun écart permis.
//   node outils/o_banc.js . sondesrv
(async function(){
  await new Promise(x => setTimeout(x, 300));
  const CFG = { taux: SONDE_TAUX, lentille: FLEAU_LENTILLE, riposte: SONDE_PV_RIPOSTE, defaite: SONDE_PV_DEFAITE,
                deriver: (typeof SONDE_DERIVE !== "undefined") ? { base: SONDE_DERIVE.base, int: SONDE_DERIVE.par, max: SONDE_DERIVE.max }
                                                               : { base: 0.35, int: 300, max: 0.90 },
                hack: { base: HACK_BASE, intrusion: HACK_INTRUSION, int: 500, max: HACK_PLAFOND, item: ITEM_HACK },
                anticipe: { int: 1000, max: 0.20 } };
  let g = 20261116;
  const alea = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  const choix = t => t[Math.floor(alea() * t.length)];
  const BOISSONS = [null, null, { intelligence: 20 }, { intelligence: -8 }, { intelligence: 35 }];
  const EQUIPS = [{}, {}, { arme: ITEM_HACK }, { arme2: ITEM_HACK, arme: "fab_pistolet_a_plasma" }, { tete: "fab_casque_lourd" }, { implant: "fab_implant_maitre" }];
  const s0 = JSON.stringify({ ap: etat.aptitudes, comp: etat.competences, eq: etat.equipement, b: etat.boisson, j: etat.jauges });
  const cas = [];
  for(let i = 0; i < 600; i++){
    const intel = 10 + Math.floor(alea() * 220), om4 = alea() < 0.3, mods = choix(BOISSONS), equipement = choix(EQUIPS), moral = alea() < 0.15 ? 0 : 60;
    aptEtat().pris = om4 ? ["om1", "om2", "om3", "om4"] : []; etat.competences.intelligence = intel; etat.equipement = { ...equipement };
    etat.boisson = mods ? { id: "essai", mods: { ...mods }, fin: new Date(Date.now() + 3600e3).toISOString() } : null;
    etat.jauges.moral = moral;
    const int = intelligenceEffective();
    cas.push({ i, intel, om4, mods, equipement, moral, int,
               deriver: Math.min(CFG.deriver.max, CFG.deriver.base + int / CFG.deriver.int),
               brouiller: chanceHack(), anticipe: intelBonusVaisseau(), materiel: ordiHackEquipe() });
  }
  const s = JSON.parse(s0);
  etat.aptitudes = s.ap; etat.competences = s.comp; etat.equipement = s.eq; etat.boisson = s.b; etat.jauges = s.j;
  // La dérive : la formule du jeu (avant v3.03, dans sondeDeriver) — relue dans le code pour s'assurer qu'elle n'a pas bougé.
  // (v3.03 : la formule est au serveur ; le jeu garde ses chiffres dans SONDE_DERIVE, js/sonde.js.)
  const src = typeof sondeDeriver === "function" ? sondeDeriver.toString() : "";
  const deriveLue = /Math\.min\(0\.90, 0\.35 \+ int\/300\)/.test(src) || (typeof SONDE_DERIVE !== "undefined" && SONDE_DERIVE.base === 0.35 && SONDE_DERIVE.par === 300 && SONDE_DERIVE.max === 0.90);
  return { n: cas.length, materiel: cas.filter(c => c.materiel).length, om4: cas.filter(c => c.om4).length, deriveLue,
           cfg: JSON.stringify(CFG), cas };
})()
