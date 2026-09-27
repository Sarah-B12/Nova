// v1.25 — arbre remanié : migration, salves, effets (node banc.js .. aptitudes)
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); };
  etat.aptitudes = { pa:1, pris:["sv1","sv2","tr2","tr1","tr3","tr4","ro1","ro2","om1"] };
  aptEtat(); await dort(20);
  r.migration = { pris: etat.aptitudes.pris.slice(), pa: etat.aptitudes.pa, v: etat.aptitudes.v, msg: journ.slice(-1)[0] };
  aptEtat(); await dort(20);
  r.uneSeuleFois = { pa: etat.aptitudes.pa, messages: journ.length };
  r.ordre = {
    survie: APT_TRONC.find(c=>c.id==="survie").noeuds.map(n=>n.nom),
    combat: APT_TRONC.find(c=>c.id==="traqueur").noeuds.map(n=>n.nom+" ("+aptCout(APT_TRONC.find(c=>c.id==="traqueur").noeuds.indexOf(n))+" PA)"),
    rouage: APT_FACTIONS.rouage.noeuds.map(n=>n.nom) };
  r.salves = { sans: (etat.aptitudes.pris=etat.aptitudes.pris.filter(x=>x!=="tr1"), _tirSalves()), avec: (etat.aptitudes.pris.push("tr1"), _tirSalves()) };
  etat.aptitudes.pris.push("om2");
  r.reperage = { deplEnergie100: aptEnergieDeplacement(100), o2_100: aptO2Deplacement(100), explore100: aptEnergieExplore(100), butinCombat100: aptButinCombat(100), bonusProtocole: aptCombatBonusProtocole() };
  // v1.26 — Voyageur, Cœur de forge
  etat.aptitudes.pris = ["no4"]; r.voyageur = { carb100: aptCarburant(100), carb1: aptCarburant(1), depl100: aptEnergieDeplacement(100) };
  etat.aptitudes.pris = []; r.sansVoyageur = aptCarburant(100);
  etat.equipement = etat.equipement || {}; const f0 = forceEffective();
  etat.aptitudes.pris = ["ig4"]; etat.equipement.arme = null; etat.equipement.arme2 = null; const fVide = forceEffective();
  etat.equipement.arme = "fab_ordinateur_de_hacking"; const fHack = forceEffective();
  etat.equipement.arme = "fab_lame_courte"; const fArme = forceEffective();
  r.forge = { sansApt: f0, mainsVides: fVide, ordinateur: fHack, arme: fArme, butin100: aptButinCombat(100) };
  // v1.26 — dons de PA
  const rpcO = sb.rpc.bind(sb); let n = 4;
  sb.rpc = (nom,a) => nom==="consommer_dons_pa" ? Promise.resolve({ data: n, error:null }) : rpcO(nom,a);
  const avant = aptEtat().pa; await aptConsommerDons(); n = 0; await aptConsommerDons();
  r.dons = { recus: aptEtat().pa - avant, msg: journ.slice(-1)[0] };
  sb.rpc = rpcO;
  journal = jOrig;
  return r;
})()
