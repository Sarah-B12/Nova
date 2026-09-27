// v1.29 — mini-jeu « ordre » avec glyphes (Q14E2) (node banc.js .. ordre)
(function(){
  const r = {};
  let ok = null; const rOk = reussirDefi, rKo = echouerDefi;
  reussirDefi = () => { ok = true; }; echouerDefi = () => { ok = false; };
  const d = { texte:["t"], elements:[ "EN-TÊTE", { sons:["EVA","CU","ATION"], texte:"RADIER." }, { sons:["DE","LAI"], texte:"PARTIR." } ] };
  const z = document.createElement("div"); z.innerHTML = _htmlOrdre(d); document.body.appendChild(z); _wireOrdre(z, d);
  r.svgBoutons = [...z.querySelectorAll(".q-ordre-el")].map(b=>b.querySelectorAll("svg.gly").length).sort();
  const clic = i => z.querySelector(`.q-ordre-el[data-i="${i}"]`).click();
  clic(0); clic(1); clic(2);
  r.chipsAvecGlyphes = [...z.querySelectorAll(".q-ordre-chip")].map(c=>c.querySelectorAll("svg").length);
  z.querySelector("#q-ordre-valider").click(); r.bonOrdre = ok;
  z.querySelector("#q-ordre-reset").click(); clic(0); clic(2); clic(1); z.querySelector("#q-ordre-valider").click(); r.mauvaisOrdre = ok;
  // les chaînes simples (autres quêtes) restent inchangées
  const z2 = document.createElement("div"); z2.innerHTML = _htmlOrdre({ texte:["t"], elements:["A","B"] });
  r.chaines = [...z2.querySelectorAll(".q-ordre-el")].map(b=>b.textContent).sort();
  reussirDefi = rOk; echouerDefi = rKo;
  return r;
})()
