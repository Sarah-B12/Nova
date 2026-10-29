// v2.04 — Entretien (K117, remplace l'Apprentissage) : ce qui s'équipe et les vaisseaux durent
// 20 % plus longtemps (36 j au lieu de 30) pour qui a l'aptitude ; rien d'autre ne change.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {};
  const arme = Object.keys(EQUIP_EFFETS).find(id => slotEquip(id) === "arme" || slotEquip(id) === "torse") || "fab_lame_a_plasma";
  const vais = Object.keys(VAISSEAUX).find(id => id !== "navette_reserve");
  const ids = { equip: arme, vaisseau: vais, lingot: "fab_lingot_de_cendrite", navette: "navette_reserve", ration: "fab_ration_chaude" };
  etat.aptitudes = { pa:0, pris:[] };
  r.sans = Object.fromEntries(Object.entries(ids).map(([k, id]) => [k, dureeViePerso(id)]));
  etat.aptitudes = { pa:0, pris:["ar1","ar2","ar3"] };
  r.avec = Object.fromEntries(Object.entries(ids).map(([k, id]) => [k, dureeViePerso(id)]));   // equip 36, vaisseau 36, lingot 30, navette 10, ration 5
  r.commun = dureeVie(arme);                                                                     // 30 : la durée commune (marché) ne bouge pas
  // Un objet porté depuis 33 jours : vivant avec l'Entretien, à remplacer sans.
  const slot = slotEquip(arme); etat.equipement[slot] = arme; etat.equipementDate = etat.equipementDate || {}; etat.equipementDate[slot] = Date.now() - 33*86400000;
  const vraiDE = dateEquipe; dateEquipe = (s) => etat.equipementDate[s];
  r.porte33jAvec = Math.round(joursRestantsEquipe(slot));                                        // 3
  etat.aptitudes = { pa:0, pris:[] }; r.porte33jSans = Math.round(joursRestantsEquipe(slot));   // 0
  dateEquipe = vraiDE; etat.equipement[slot] = null;
  r.aptitude = APT_TRONC.find(v => v.id === "artisan").noeuds.find(n => n.id === "ar3").nom;      // Entretien
  r.plusDePointBonus = aptFabPoints() === 0;
  r.armeTestee = arme; r.vaisseauTeste = vais;
  return r;
})();
