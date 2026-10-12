// v1.72 — Chasseur OU voleur (node outils/o_banc.js . chasseur)
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1500));
  const e = aptEtat();
  const furt = APT_TRONC.find(c => c.id === "ombre"), comb = APT_TRONC.find(c => c.noeuds.some(n => n.id === "traque"));
  // 1. Chasseur : la Furtivité grisée, avec l'infobulle ; achat refusé.
  e.pris = comb.noeuds.map(n => n.id); e.pa = 5;
  const c0 = aptCarte(furt, 0);
  r.furtGrisee = c0.classList.contains("exclu") && c0.textContent.includes("Un chasseur de primes ne suit pas la voie de la Furtivité.");
  acheterApt(furt, 0); r.achatRefuse = !aptPris("om1") && e.pa === 5;
  // 2. Voleur : Traque grisée.
  e.pris = ["om1"]; const ti = comb.noeuds.findIndex(n => n.id === "traque");
  const ct = aptCarte(comb, ti);
  r.traqueGrisee = ct.classList.contains("exclu") && ct.textContent.includes("Un voleur ne suit pas la voie de la traque.");
  r.textes = { om1: furt.noeuds[0].effet.includes("Ouvre la voie du vol mais ferme celle de la traque."),
               traque: comb.noeuds[ti].effet.includes("ferme celle de la furtivité (vols/hacks)") };
  // 3. Déjà dans les deux camps : l'encart, puis le choix.
  e.pris = [...comb.noeuds.map(n => n.id), "om1", "om2"]; e.pa = 0;
  r.conflit = aptConflit();
  majAptitudes();
  r.encart = !!document.querySelector(".apt-conflit") && document.querySelector(".apt-conflit").textContent.includes("Chasseur ou voleur ?");
  aptChoisirCamp(true);
  r.chasseur = { furtivite: aptFurtivitePrise(), traque: aptPris("traque"), pa: e.pa };
  e.pris = [...comb.noeuds.map(n => n.id), "om1"]; e.pa = 0;
  aptChoisirCamp(false);
  r.voleur = { traque: aptPris("traque"), om1: aptPris("om1"), pa: e.pa };
  return r;
})();
