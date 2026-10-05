// v1.46 — Registre, briques 4-7 côté client : renseignement, rapport, calendrier (node o_banc.js .. registre2)
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1200));
  r.ancien = hpLecture("defense", "45");
  r.date = hpLecture("defense", "62|2026-10-09||expedition");
  r.jour = hpLecture("defense", "75|2026-10-05||");
  r.forteresse = hpLecture("defense", "250|2026-10-13|forteresse|expedition");
  r.forteresseJour = hpLecture("defense", "250|2026-10-05|forteresse|");
  const d = document.createElement("div");
  d.innerHTML = _expRapportHtml({ rapport:{ objectif:"protocole", succes:false, p_att:90, p_def:320, nb_att:4, forteresse:true }, date_prevue:"2026-10-13T16:00:00Z" });
  r.rapport = d.querySelector("p").textContent;
  return r;
})();
