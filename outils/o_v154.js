// v1.54 — ordre des onglets, auberge, boutique, labyrinthe, traversée (node o_banc.js .. v154)
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  const ordre = [...document.querySelectorAll(".hub-lien")].map(b => b.dataset.hub);
  r.descenteAvantQuete = ordre.indexOf("descente") < ordre.indexOf("quete");
  etat.faction = "toundra"; _innBanniere();
  const img = document.querySelector("#inn-img");
  r.auberge = { present: !!img, demande: img && img.getAttribute("src") };
  etat.secteur = "ecart"; _boutiqueBanniere(); r.boutiquePerchoir = document.querySelector("#boutique-img").getAttribute("src");
  etat.secteur = "silene"; _boutiqueBanniere(); r.boutiqueSilene = document.querySelector("#boutique-img").getAttribute("src");
  const lab = _labGenerer(7, 8); r.labSortie = { ligne: Math.floor(lab.sortie / 7), pasHautDroite: lab.sortie !== 6 || "parfois" };
  r.fouilleTexte = (_htmlTriangulation({ precision:70 }).match(/atteint au moins (\d+)/) || [])[1];
  return r;
})();
