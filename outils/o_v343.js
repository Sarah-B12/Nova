// v3.43 — le mot de la développeuse à la première quête (node outils/o_banc.js . v343).
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  journal = () => {}; sauverMaintenant = async () => {};
  delete etat._avisQuetes;
  const qe = queteEtat(); qe.active = null; qe.done = (qe.done || []).filter(x => x !== "q1");
  const fen = () => document.querySelector("#cj-fond");
  accepterQuete("q1"); await dort(20);
  const f = fen();
  r.fenetre = !!f;
  r.titre = f ? f.querySelector("h4").textContent : null;
  r.texteComplet = !!f && /ne partage pas les réponses des quêtes/.test(f.textContent) && /Merci infiniment de jouer le jeu\./.test(f.textContent);
  r.unSeulBouton = !!f && f.querySelectorAll("button").length === 1 && f.querySelector(".cj-ok").textContent === "C'est promis";
  r.sansEmoji = !!f && !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(f.textContent);
  r.retenu = typeof etat._avisQuetes === "number";
  if(f) f.querySelector(".cj-ok").click(); await dort(20);
  r.fermee = !fen();
  // Abandon puis nouvelle acceptation : pas de seconde fenêtre
  qe.active = null; accepterQuete("q1"); await dort(20);
  r.uneSeuleFois = !fen();
  // Une autre quête, pour un personnage qui ne l'a jamais vue : pas de fenêtre
  delete etat._avisQuetes; qe.active = null; qe.done = Array.from(new Set([...(qe.done || []), "q1"]));
  accepterQuete("q2"); await dort(20);
  r.pasPourLesAutresQuetes = !fen();
  if(fen()) fen().remove();
  qe.active = null; delete etat._avisQuetes;
  return r;
})()
