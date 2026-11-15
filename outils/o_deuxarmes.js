// v3.06 (v308, K276) — deux fois la même arme à une main : le bonus compte deux fois au serveur aussi. Produit :
//   · `cas` : 600 personnages (graine fixe) — compétences, moral, boisson, armes portées (une, deux DIFFÉRENTES, deux
//     IDENTIQUES, arme à deux mains, avec ou sans munitions), implants — avec l'Agilité et l'Intelligence du JEU
//     (agiliteEffective, intelligenceEffective) et l'équipement tel que le serveur le range (une ligne par objet, quantité).
//     Le banc SQL refait chaque cas avec `_agi_effective` / `_int_effective` : aucun écart permis.
//   node outils/o_banc.js . deuxarmes
(async function(){
  await new Promise(x => setTimeout(x, 300));
  let g = 20261118;
  const alea = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  const choix = t => t[Math.floor(alea() * t.length)];
  const UNE = Object.keys(EQUIP_EFFETS).filter(id => slotEquip(id) === "arme" && !estDeuxMains(id) && id !== "fab_ordinateur_de_hacking");
  const DEUX = [...ARME_DEUX_MAINS].filter(id => id !== "fab_ordinateur_de_hacking");
  const IMPL = Object.keys(EQUIP_EFFETS).filter(id => slotEquip(id) && slotEquip(id) !== "arme");
  const BOISSONS = [null, null, { agilite: 15 }, { intelligence: 20 }, { agilite: -5, intelligence: 10 }];
  const s0 = JSON.stringify({ c: etat.competences, e: etat.equipement, b: etat.boisson, j: etat.jauges, s: etat.sac, n: etat.niveau, x: etat.xpTotal });
  const cas = [];
  for(let i = 0; i < 600; i++){
    const t = alea(); const eq = {};
    if(t < 0.30){ const a = choix(UNE); eq.arme = a; eq.arme2 = a; }                 // deux fois la même
    else if(t < 0.50){ eq.arme = choix(UNE); eq.arme2 = choix(UNE); }              // deux (souvent différentes)
    else if(t < 0.65){ eq.arme = choix(UNE); }
    else if(t < 0.75){ eq.arme = choix(DEUX); }
    if(alea() < 0.4){ const im = choix(IMPL); eq[slotEquip(im)] = im; }
    const mun = alea() < 0.6, comp = { force: 10 + Math.floor(alea() * 60), agilite: 10 + Math.floor(alea() * 120), intelligence: 10 + Math.floor(alea() * 120) };
    const moral = alea() < 0.1 ? 0 : 60, mods = choix(BOISSONS);
    etat.competences = { ...comp }; etat.equipement = { ...eq }; etat.jauges.moral = moral; etat.niveau = 80; etat.xpTotal = 9999999;
    etat.boisson = mods ? { id: "essai", mods: { ...mods }, fin: new Date(Date.now() + 3600e3).toISOString() } : null;
    etat.sac = {}; const munitions = [];
    if(mun) for(const id of Object.values(eq)){ const m = munitionDe(id); if(m){ etat.sac[m] = 5; if(!munitions.includes(m)) munitions.push(m); } }
    const lignes = {}; for(const id of Object.values(eq)) lignes[id] = (lignes[id] || 0) + 1;
    cas.push({ i, comp, moral, mods, lignes, munitions, agi: agiliteEffective(), int: intelligenceEffective() });
  }
  const s = JSON.parse(s0);
  etat.competences = s.c; etat.equipement = s.e; etat.boisson = s.b; etat.jauges = s.j; etat.sac = s.s; etat.niveau = s.n; etat.xpTotal = s.x;
  return { n: cas.length, deuxFois: cas.filter(c => Object.values(c.lignes).some(q => q > 1)).length, cas };
})()
