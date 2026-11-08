// v2.49 (K173) — l'XP d'atelier : seuls les gros objets (niveau 20+), 15 par Sélénite, 8 par Nyx, 15 au moins.
// node o_banc.js .. atelierxp
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1200);
  // 1. Le barème, objet par objet (tableau validé par l'autrice, K173 option C)
  const attendu = { "Fusil à ions":15, "Casque lourd":15, "Plastron lourd":15, "Jambières lourdes":15, "Lame à singularité":23,
    "Canon à singularité":54, "Drone de récolte":69, "Drone d'élevage":69, "Drone récupérateur":69, "Drone de combat":69,
    "Implant de force":38, "Implant d'agilité":38, "Implant maitre":54, "Vaisseau Cargo":15, "Vaisseau maitre":206 };
  r.ecarts = []; r.avecXp = 0;
  for(const f of Object.values(FORMATIONS)) for(const [, nom] of f.recettes){
    const x = xpAtelier(nom), a = attendu[nom] || 0;
    if(x !== a) r.ecarts.push(`${nom} : ${x} (attendu ${a})`);
    if(x > 0) r.avecXp++;
  }                                                                                   // ecarts [] ; avecXp 15
  r.navette = xpAtelier("Navette légère");                                            // 0 (niveau 5)
  r.cockpit = xpAtelier("Cockpit blindé");                                            // 0 (une pièce, pas un objet utilisable)

  // 2. Fabriquer : le Vaisseau maître rapporte 206 XP, annoncés dans la même ligne
  const xps = []; gagnerXp = n => xps.push(n);
  const journ = []; journal = (t) => journ.push(t);
  agirServeur = async () => ({ ok:true, ajoutes:{} });
  _remonterDuCoffre = async () => true;
  const garnir = nom => { const rec = Object.values(FORMATIONS).flatMap(f => f.recettes).find(x => x[1] === nom);
    for(const g of parseIngredients(rec[2])) etat.sac[g.id] = 99; return rec[0]; };
  etat.permisVaisseau = true;
  etat.formation = { cle:"constructeur", points:150, fait:{} };
  const rnd = Math.random; Math.random = () => 0.99;                                  // ni série, ni récup
  const sMaitre = garnir("Vaisseau maitre");
  await fabriquer(sMaitre); await dort(20);
  r.maitre = { xp: xps.slice(), ligne: journ.find(t => /Fabriqué : Vaisseau maitre/.test(t)) };   // [206] ; « … +5 pts de formation. +206 XP. »
  // 3. Recette épuisée : l'XP continue (seuls les points s'arrêtent)
  etat.formation.fait[sMaitre] = CAP_RECETTE; xps.length = 0; journ.length = 0;
  await fabriquer(sMaitre); await dort(20);
  r.epuisee = { xp: xps.slice(), ligne: journ.find(t => /Fabriqué/.test(t)) };      // [206] ; « (recette épuisée, +0 pt) +206 XP. »
  // 4. Production en série : deux objets, deux fois l'XP
  const serie = aptFabSerie; aptFabSerie = () => true; Math.random = () => 0.05; xps.length = 0;
  await fabriquer(sMaitre); await dort(20);
  r.serie = xps.slice();                                                              // [412]
  aptFabSerie = serie; Math.random = () => 0.99;
  // 5. Un petit objet : rien, et pas de mention d'XP
  xps.length = 0; journ.length = 0;
  const sLingot = garnir("Lingot de Silite"); await fabriquer(sLingot); await dort(20);
  r.lingot = { xp: xps.slice(), sansXp: !/XP/.test(journ.join(" ")) };                // [] ; true
  Math.random = rnd;
  // 6. L'atelier affiche l'XP à côté des points
  const div = document.createElement("div"); renderAtelier(div);
  const lignes = [...div.querySelectorAll(".recette-ligne")].map(l => l.querySelector(".recette-gain").textContent);
  r.affichageMaitre = lignes.find(t => /206 XP/.test(t)) || null;                     // « +5 pts · +206 XP »
  r.affichageLingot = lignes[0];                                                      // « +1 pt »
  r.aide = /gros objets/.test(div.textContent);                                       // true
  return r;
})();
