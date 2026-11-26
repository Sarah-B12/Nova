// v3.38 — les bulles de notification suivent les couleurs du journal (node outils/o_banc.js . v338) : K335 (A).
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  // Chaque bulle est regardée aussitôt (la pile n'en garde que quelques-unes).
  const vues = {};
  for(const [c, t] of [["gain","Essai bleu."],["alerte","Essai rouge."],["message","Essai vert."],["annonce","Essai jaune."],["bataille","Essai violet."]]){
    journal(t, c, "systeme"); const z = document.querySelector("#bulles");
    vues[c] = !!(z && z.lastElementChild && z.lastElementChild.classList.contains(c) && z.lastElementChild.textContent.startsWith(t));
  }
  const st = (document.querySelector("#bulles-style") || {}).textContent || "";
  const barre = c => { const m = new RegExp("\\.bulle\\." + c + "\\{\\s*border-left-color:(#[0-9a-f]+)").exec(st); return m ? m[1] : null; };
  r.barres = { gain:barre("gain"), alerte:barre("alerte"), message:barre("message"), annonce:barre("annonce"), bataille:barre("bataille"), poste:barre("poste") };
  r.attendu = r.barres.gain === "#5aa8e6" && r.barres.alerte === "#ff5257" && r.barres.message === "#8bd450"
           && r.barres.annonce === "#ffb060" && r.barres.bataille === "#b48cff";
  r.verteSeulementMessage = Object.entries(r.barres).filter(([k, v]) => v === "#8bd450").map(([k]) => k).join(",") === "message";
  r.bullesAffichees = Object.values(vues).every(Boolean);
  r.version = document.querySelector('link[href*="base.css"]').getAttribute("href");
  return r;
})()
