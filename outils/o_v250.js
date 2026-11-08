// v2.50 — la pente des récompenses (K174), les gardiens recalés (K177), le niveau maximum (K178).
// node o_banc.js .. v250
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  // 1. Les 45 récompenses suivent la pente : 20 + 16,5 par quête, arrondi à 5 ; crédits et PA inchangés (K175, K176)
  const r5 = x => Math.round(x / 5) * 5;
  r.ecartsXp = QUETES.map((q, i) => q.recompense.xp === r5(20 + 16.5 * i) ? null : `${q.id}:${q.recompense.xp}`).filter(Boolean);   // []
  r.croissante = QUETES.every((q, i) => i === 0 || q.recompense.xp > QUETES[i - 1].recompense.xp);                                   // true
  r.extremes = [QUETES[0].recompense.xp, QUETES[29].recompense.xp, QUETES[30].recompense.xp, QUETES[44].recompense.xp];              // [20, 500, 515, 745]
  r.credits = [QUETES[0].recompense.credits, QUETES[29].recompense.credits, QUETES[30].recompense.credits, QUETES[44].recompense.credits]; // [120, 3300, 2400, 4000]
  r.pa = QUETES.filter(q => q.recompense.pa).map(q => q.id).join(" ");                                                                // q2 q5 q8 q12 q14 q15 q20 q30 q31 q45
  // 2. Gardiens (K177)
  r.gardiens = ["q11","q16","q19","q27","q30"].map(id => id + ":" + queteData(id).etapes.find(e => e.defi.type === "combat" && e.image).defi.puissance).join(" ");   // 62 82 97 114 117
  // 3. Niveau maximum (K178)
  r.max = [NIVEAU_MAX, xpCumulPour(80), niveauDeXp(252799), niveauDeXp(252800), niveauDeXp(10000000)];   // [80, 252800, 79, 80, 80]
  journal = () => {}; _monterNiveauServeur = async () => {}; sauvegarder = () => {};
  etat.xpTotal = xpCumulPour(79); etat.niveauCredite = 79; majNiveauDepuisXp(); const p0 = etat.pointsCompetence;
  etat.xpTotal = 10000000; majNiveauDepuisXp();
  r.pointsAu80 = { niveau: etat.niveau, points: etat.pointsCompetence - p0, credite: etat.niveauCredite };        // { 80, 3, 80 }
  afficher(); r.entete = document.querySelector("#stat-xp").textContent;                                         // « niveau max »
  etat.xpTotal = 900; etat.niveauCredite = 10; majNiveauDepuisXp(); afficher(); r.enteteNiv10 = document.querySelector("#stat-xp").textContent;   // « 0/200 »
  return r;
})();
