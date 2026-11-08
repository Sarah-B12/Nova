// v2.52 / v2.53 — le dosage des aptitudes : Cœur de forge (K183, K186), Veine de cristal (K184), Survie (K185), l'arrondi dit (K187).
// node o_banc.js .. v252
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  const prendre = ids => { etat.aptitudes = etat.aptitudes || {}; etat.aptitudes.pris = ids.slice(); };
  // 1. Cœur de forge : +15 avec une arme, rien sans arme
  etat.competences.force = 40; etat.equipement = etat.equipement || {}; etat.equipement.arme = null; etat.equipement.arme2 = null;
  prendre(["ig4"]); const sansArme = aptForceForge();
  etat.equipement.arme = "fab_pistolet_cinetique"; r.forge = [APT_FORGE_FORCE, sansArme, aptForceForge()];   // [15, 0, 15]
  r.quete = [forceEffective(), _combatStats().force];                                                  // [55, 40] : le combat de quête ne compte pas la forge (K186)
  r.forgeTexte = Object.values(APT_FACTIONS).flatMap(f => f.noeuds).find(n => n.id === "ig4").effet;                           // « … patrouilles, expéditions et défense (pas l'Arène). »
  // 2. Survie : Récupération +1 %/h, Endurance −10 %
  prendre(["sv1","sv3","sv2","sv4"]);
  r.recup = aptRegenEnergie();                                                                        // 1
  r.endurance = [2, 3, 8, 10, 15, 20].map(c => aptEnergieAction(c));                                  // [2, 3, 7, 9, 14, 18] (hors zone, sans boisson)
  r.arrondi = ["sv4","om3","ig1","to1"].map(id => [...APT_TRONC.flatMap(v => v.noeuds), ...Object.values(APT_FACTIONS).flatMap(f => f.noeuds)]
    .find(n => n.id === id).effet.match(/coûte (\d) ou plus/)[1]).join(" ");                       // « 6 3 4 4 » (K187)
  r.survieTextes = APT_TRONC.find(v => v.id === "survie").noeuds.filter(n => n.id === "sv2" || n.id === "sv4").map(n => n.effet.slice(0, 40));
  // 3. Veine de cristal : la Sélénite, 2,5 %
  r.veine = [APT_VEINE_ITEM, APT_VEINE_CHANCE];                                                       // ["selenite", 0,025]
  prendre(["to4"]); const zf = enZoneFroide; enZoneFroide = () => true;
  let n = 0; for(let i = 0; i < 40000; i++) if(aptVeineCristal()) n++;
  r.veineTirage = Math.round(n / 400 * 10) / 10;                                                      // ≈ 2,5 (%)
  enZoneFroide = zf;
  r.veineTexte = Object.values(APT_FACTIONS).flatMap(f => f.noeuds).find(n => n.id === "to4").effet;                         // « 2,5 % … Cristal de Sélénite … »
  return r;
})();
