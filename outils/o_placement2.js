// v1.95 — Placement de la carte 2 (au-delà de la Gorge), outil de la console dev.
(async () => {
  const r = {}; const msgs = [];
  const jOrig = journal; journal = (m) => msgs.push(m);
  const devOrig = estDev;
  estDev = () => false; placement2Ouvrir();
  r.refuseHorsStaff = !document.querySelector("#p2-carte") && msgs.includes("Réservé au staff.");
  estDev = () => true; placement2Ouvrir();
  const svg = document.querySelector("#p2-carte");
  r.fond = !!svg.querySelector('image[href="images/carte_espace_2.png"]');
  r.objets = svg.querySelectorAll("[data-p2]").length;
  r.chemins = [...svg.querySelectorAll("[data-p2] image")].every(i => i.getAttribute("href").startsWith("images/espace2/"));
  // Sélection par le clic (sans coordonnées en jsdom : on sélectionne à la main), puis clavier.
  _p2Sel = ESPACE2_LIEUX.find(l => l.id === "e2_comete");
  const x0 = _p2Sel.x, y0 = _p2Sel.y, t0 = _p2Sel.t;
  const touche = (key, shiftKey) => document.dispatchEvent(new window.KeyboardEvent("keydown", { key, shiftKey, bubbles:true }));
  touche("ArrowRight"); touche("ArrowDown", true);
  r.fleches = _p2Sel.x === x0 + 1 && _p2Sel.y === y0 + 10;
  touche("+"); r.plus = _p2Sel.t === Math.round(t0 * 1.05);
  touche("-"); r.moins = _p2Sel.t < Math.round(t0 * 1.05);
  _p2Sel.x = -50; _p2Borner(_p2Sel); r.borne = _p2Sel.x === 0;
  _p2Sel.x = x0 + 1;
  r.infos = document.querySelector("#p2-sel").textContent.startsWith("e2_comete — x:");
  // Export : relu, il redonne le tableau, champs ajoutés compris.
  ESPACE2_LIEUX[0].nom = "Essai"; ESPACE2_LIEUX[0].type = "decor";
  const txt = placement2Export();
  const relu = new Function(txt.replace("const ESPACE2_LIEUX =", "return") )();
  r.exportFidele = JSON.stringify(relu) === JSON.stringify(ESPACE2_LIEUX);
  r.champsGardes = relu[0].nom === "Essai" && relu[0].type === "decor";
  delete ESPACE2_LIEUX[0].nom; delete ESPACE2_LIEUX[0].type;
  // La carte du jeu n'a pas bougé.
  r.triptoIntact = typeof ESPACE_LIEUX !== "undefined" && ESPACE_LIEUX.find(l => l.id === "trou_noir").x === 1163;
  touche("Escape");
  r.ferme = document.querySelector("#p2-fenetre").hidden === true && !_p2Ouvert;
  journal = jOrig; estDev = devOrig;
  r.attendu = r.refuseHorsStaff && r.fond && r.objets === 10 && r.chemins && r.fleches && r.plus && r.moins && r.borne && r.infos && r.exportFidele && r.champsGardes && r.triptoIntact && r.ferme;
  return r;
})()
