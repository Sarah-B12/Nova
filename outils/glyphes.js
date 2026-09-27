// v1.28 — écriture de l'ancien : rendu SVG dans le mini-jeu glyphes (node banc.js .. glyphes)
(function(){
  const r = {};
  const h = _htmlGlyphes({ texte:["t"], paires:[
    { picto:"▣", glyphe:"ΛΞ", sons:["PERI","METRE"], sens:"Périmètre" },
    { picto:"✕", glyphe:"?", sons:["FER","ME","TURE","PERI","METRE"], sens:"Fermeture du périmètre" } ], distracteurs:["Irrigation"] });
  const d = document.createElement("div"); d.innerHTML = h;
  r.svgParCarte = [...d.querySelectorAll(".q-gly-sym")].map(z=>z.querySelectorAll("svg.gly").length);
  r.options = [...d.querySelector("select").options].map(o=>o.value).filter(Boolean).sort();
  const sons = Object.keys(GLYPHES_ANCIEN);
  const formes = sons.map(k=>GLYPHES_ANCIEN[k].join("/"));
  r.nbSons = sons.length;
  r.formesUniques = new Set(formes).size === formes.length;
  r.xBarreLibre = !formes.includes("C/barre");
  r.inconnu = glypheSVG("ZZZ").includes("?");
  return r;
})()
