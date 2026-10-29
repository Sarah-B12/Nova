// v1.93e — le canon de bord du Vaisseau maître : +1 salve contre les sondes, affiché au Garage.
// v1.93f — les astéroïdes cachés du tir de sondage.
// v2.06 (K83) — la salve du canon se CHARGE (une cellule) : sans charge, 5 salves pour tous ;
//   chargé, le maître en a 6 (7 avec l'Instinct). Détail du chargement : o_fleau.js.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}, vraiApt = (typeof _apt === "function") ? _apt : null;
  _apt = () => false;
  for(const v of ["fab_navette_legere","fab_vaisseau_cargo","fab_vaisseau_maitre"]){ etat.vaisseau = v; _tirCanon = 0; r[v] = _tirSalves(); }
  _tirCanon = canonVaisseau(); r.maitreCharge = _tirSalves();
  _apt = (id) => id === "tr1"; r.maitreInstinct = _tirSalves(); _tirCanon = 0;
  _apt = () => false;
  lancerTirSonde(() => {}, () => {}); const m = document.querySelector("#tir-modale");
  r.texteDuel = /une de plus si tu charges ton canon de bord/.test(m.innerHTML); _tirFermer();
  etat.vaisseau = "fab_vaisseau_cargo"; lancerTirSonde(() => {}, () => {}); r.texteCargo = !/canon de bord/.test(document.querySelector("#tir-modale").innerHTML); _tirFermer();
  let vv = document.querySelector("#vaisseau-vue"); if(!vv){ vv = document.createElement("div"); vv.id = "vaisseau-vue"; document.body.appendChild(vv); }
  etat.permisVaisseau = true; etat.vaisseau = "fab_vaisseau_maitre"; majVaisseau(); r.garageMaitre = /Canon de bord/.test(vv.innerHTML);
  etat.vaisseau = "fab_vaisseau_cargo"; majVaisseau(); r.garageCargo = !/Canon de bord/.test(vv.innerHTML);
  r.conso = ["fab_navette_legere","fab_vaisseau_cargo","fab_vaisseau_maitre"].map(v => VAISSEAUX[v].conso).join("/");

  // v1.93f — les astéroïdes
  intelBonusVaisseau = () => 0;
  etat.vaisseau = "fab_navette_legere"; etat.permisVaisseau = true;
  let gagne = 0, perdu = 0;
  const essai = [];
  for(let k = 0; k < 30; k++){
    lancerTirSonde(() => gagne++, () => perdu++);
    essai.push({ n:_tirAst.size, N:_tirN, coeurLibre:!_tirAst.has(_tirCoeur.x + "," + _tirCoeur.y) }); _tirFermer();
  }
  r.ast = { nbEgalLignes:essai.every(e => e.n === e.N), coeurJamaisDessous:essai.every(e => e.coeurLibre) };
  // Toucher un astéroïde : salve perdue, ☄, pas d'écho, coque −5 à −10.
  lancerTirSonde(() => gagne++, () => perdu++); _tirRendre();
  const [ax, ay] = [..._tirAst][0].split(",").map(Number);
  const pv0 = pvVaisseau(etat.vaisseau), s0 = _tirRestant;
  _tirSalve(ax, ay);
  const cas = document.querySelector(`#tir-modale .sd-case[data-x="${ax}"][data-y="${ay}"]`);
  r.ast.salvePerdue = _tirRestant === s0 - 1;
  r.ast.marque = !!cas && cas.textContent === "☄" && cas.classList.contains("ast");
  r.ast.degats = pv0 - pvVaisseau(etat.vaisseau);
  r.ast.degatsOk = r.ast.degats >= 5 && r.ast.degats <= 10;
  // On peut toujours gagner ensuite.
  gagne = 0; _tirSalve(_tirCoeur.x, _tirCoeur.y); await new Promise(x => setTimeout(x, 800)); r.ast.gagneApres = gagne === 1;
  // Coque presque vide : un astéroïde ne cloue jamais.
  lancerTirSonde(() => {}, () => {}); _tirRendre();
  _poserPv(etat.vaisseau, 3);
  const [bx, by] = [..._tirAst][0].split(",").map(Number); _tirSalve(bx, by);
  r.ast.jamaisCloue = pvVaisseau(etat.vaisseau) === 1;
  // Toutes les salves sur des astéroïdes : défaite.
  _poserPv(etat.vaisseau, pvMax(etat.vaisseau));
  perdu = 0; lancerTirSonde(() => {}, () => perdu++); _tirRendre();
  for(const c of [..._tirAst].slice(0, _tirRestant)){ const [x, y] = c.split(",").map(Number); _tirSalve(x, y); }
  await new Promise(x => setTimeout(x, 1100)); r.ast.defaite = perdu === 1;
  _tirFermer();
  if(vraiApt) _apt = vraiApt;
  return r;
})();
