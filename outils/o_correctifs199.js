// v1.99 — correctifs du 29/10 (retours de l'autrice) : boissons et vols, coût affiché d'un
// vol, combat sans « ta force », images par bête de Q26 ét. 3, Asulf dans le journal,
// bannière du bar, largeur de la console. Tout ce qui est noté « vrai » doit l'être.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {};
  etat.aptitudes = { pa:0, pris:[] };
  const fin = new Date(Date.now() + 3600e3).toISOString();
  // 2. Les boissons : déplacement → vols et sauts ; action → vol (Remontant 15 → 19).
  etat.boisson = null; const base = aptSaut(100);
  etat.boisson = { active:true, fin, mods:{ energie_depl:0.8 } }; const trouble = aptSaut(100);
  etat.boisson = { active:true, fin, mods:{ energie_cout:1.25 } }; const remontantSaut = aptSaut(100), remontantVol = _coutVol();
  r.boissons = { base, trouble, remontantSaut, remontantVol };                // 100, 80, 100, 19
  etat.boisson = null;
  // 3. Le combat : plus de « ta force » (la ligne de journal est dans une fonction : on lit son texte).
  r.combatSansForce = Object.keys(window).filter(k => /^arene/i.test(k) && typeof window[k] === "function").every(k => !/ta force/.test(String(window[k])));
  // 5. Q26 ét. 3 : une image par bête, repli sur q26/3.png.
  const im = queteData("q26").etapes[2].image;
  r.q26e3 = im && im.selon === "bete.espece" && ["chaume","braisillon","sentinelle","goupille","iris","aucune"].every(k => /^images\/quetes\/q26\/3(_[a-z]+)?\.png$/.test(im.valeurs[k])) && im.valeurs[im.defaut] === "images/quetes/q26/3.png";
  // 6. Asulf dans le journal, 42-U1F à l'occasion (une fois sur quatre environ).
  let mat = 0; for(let i = 0; i < 400; i++) if(/42-U1F/.test(_imputeA("matricule"))) mat++;
  r.matriculeParfois = mat > 50 && mat < 160;                                   // ≈ 100 sur 400
  r.asulfSinon = /Asulf/.test((() => { const v = Math.random; Math.random = () => 0.9; const t = _imputeA("habilitation"); Math.random = v; return t; })());
  // 8. La bannière du bar et la console : les règles de style.
  const css = [...document.querySelectorAll("style")].map(s => s.textContent).join("\n");
  r.barBanniere = /\.bar-banniere\{[^}]*aspect-ratio:3\/1[^}]*max-height:340px/.test(css);
  // (la largeur de la console dev, 900 px, se vérifie à l'œil : son style n'existe qu'à l'ouverture)
  return r;
})();
