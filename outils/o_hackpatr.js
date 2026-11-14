// v2.61 — pirater une patrouille, brouiller une sonde (K201 → K203)
// node o_banc.js .. hackpatr
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  const pris = () => { etat.aptitudes = etat.aptitudes || {}; etat.aptitudes.pris = etat.aptitudes.pris || []; return etat.aptitudes.pris; };
  const intrusion = (oui) => { const p = pris(); const i = p.indexOf("om4"); if(oui && i < 0) p.push("om4"); if(!oui && i >= 0) p.splice(i, 1); };
  etat.jauges = Object.assign({}, etat.jauges, { moral:100, sante:100 });
  // 1. Les chances (Intelligence effective lue, pour tenir compte de l'équipement).
  r.chances = [];
  for(const I of [false, true]) for(const v of [20, 50, 100, 200]){
    intrusion(I); etat.competences.intelligence = v;
    r.chances.push(`${I ? "Intrusion" : "sans"} Int ${intelligenceEffective()} → ${Math.round(chanceHack() * 1000) / 10} %`);
  }
  // 2. Une patrouille piratée : ni crédits ni objets ; XP, Registre, compteur.
  intrusion(true); etat.competences.intelligence = 100; etat.patrJour = null;
  etat.equipement = Object.assign({}, etat.equipement, { arme:"fab_ordinateur_de_hacking" });
  const appels = []; const journ = [];
  const orig = { rc: resoudreCombat, pn: patrouilleNeutraliseeServeur, rs: registreSignaler, gx: gagnerXp, j: journal, rnd: Math.random };
  resoudreCombat = async (o) => { appels.push(["combat", o]); };
  // v2.89 (v291) : la patrouille piratée est COMPTÉE au serveur, sans butin (doublure du serveur).
  patrouilleNeutraliseeServeur = async (m) => { appels.push(["serveur", m]);
    etat.patrJour = { jour: jourDeJeu(), n: ((etat.patrJour && etat.patrJour.n) || 0) + 1 };
    return { ok:true, n: etat.patrJour.n, butin:false }; };
  registreSignaler = async (t) => { appels.push(["registre", t]); };
  gagnerXp = (n) => { appels.push(["xp", n]); };
  journal = (t) => journ.push(t);
  const cr = etat.credits;
  Math.random = () => 0.10;
  await patrouilleHacker();
  r.reussi = { credits: etat.credits - cr, appels: appels.slice(), journal: journ.slice(), compteur: etat.patrJour.n };
  // 3. Raté : embuscade.
  appels.length = 0; journ.length = 0; Math.random = () => 0.99;
  await patrouilleHacker();
  r.rate = { appels: appels.slice(), journal: journ.slice() };
  // 4. La méfiance s'applique encore (au-delà de 5 par jour).
  etat.patrJour.n = 9; r.mefiance = Math.round(Math.max(0.05, chanceHack() - patrouilleMefianceHack()) * 1000) / 10 + " %";
  // 5. Le bouton et Intrusion.
  ouvrirPatrouille();
  const bt = document.querySelector('#patrouille-modale [data-p="hacker"] .patr-sous');
  r.bouton = bt ? bt.textContent : null; fermerPatrouille();
  r.texteIntrusion = /\+20 points pour pirater/.test(document.documentElement.outerHTML + JSON.stringify(typeof APTITUDES !== "undefined" ? APTITUDES : "")) || (typeof aptDef === "function" && /\+20 points/.test((aptDef("om4") || {}).effet || ""));
  // 6. La sonde : même chance (lue dans sondeBrouiller).
  const src = sondeBrouiller.toString();
  r.sonde = { chanceHack: /chanceHack\(\)/.test(src), ancienneFormule: /0\.45|0\.90/.test(src) };
  resoudreCombat = orig.rc; patrouilleNeutraliseeServeur = orig.pn; registreSignaler = orig.rs; gagnerXp = orig.gx; journal = orig.j; Math.random = orig.rnd;
  return r;
})();
