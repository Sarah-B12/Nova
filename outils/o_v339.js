// v3.39 — « Ta messagerie est presque pleine » une seule fois, même après un rechargement (node outils/o_banc.js . v339) : K336 (A).
(async () => {
  const r = {}; const msgs = []; let sauves = 0;
  journal = (m, t, c) => { msgs.push(m); }; sauvegarder = () => { sauves++; };
  delete etat._boitePalier; _boiteAlertee = null;
  _alerteBoite(26);
  r.premiereFois = msgs.length === 1 && /presque pleine \(26\/30\)/.test(msgs[0]) && etat._boitePalier === "presque" && sauves === 1;
  // Rechargements, autres onglets, mises à jour : la mémoire de page repart de zéro, la sauvegarde reste.
  for(let i = 0; i < 10; i++){ _boiteAlertee = null; _alerteBoite(26); }
  r.dixRechargementsSilencieux = msgs.length === 1;
  _alerteBoite(27); r.memePalierSilencieux = msgs.length === 1;
  _alerteBoite(30); r.pleinePrevenue = msgs.length === 2 && /est pleine \(30\/30\)/.test(msgs[1]);
  _alerteBoite(28); r.triPartielSilencieux = msgs.length === 2;
  _alerteBoite(12); r.videeSilencieux = msgs.length === 2 && etat._boitePalier === "ok";
  _alerteBoite(25); r.remplieDeNouveauPrevenue = msgs.length === 3;
  // Un personnage déjà prévenu avant la mise à jour n'a pas de palier enregistré : une alerte, une seule.
  delete etat._boitePalier; _boiteAlertee = "presque"; msgs.length = 0;
  _alerteBoite(26); _alerteBoite(26);
  r.ancienJoueurUneFois = msgs.length === 1;
  delete etat._boitePalier;
  return r;
})()
