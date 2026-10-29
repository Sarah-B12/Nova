// v2.02 — le barème des points de formation (révision du 29/10) : chaque objet, ses points,
// comparés au tableau validé par l'autrice ; aucun objet ne dépasse le prochain palier.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const attendu = {
    "Lingot de Cendrite":1,"Couteau de survie":1,"Munitions cinétiques ×10":1,"Pistolet cinétique":2,"Casque léger":1,"Plastron léger":1,"Jambières légères":1,
    "Munitions à plasma ×10":1,"Lame à plasma":1,"Pistolet à plasma":1,"Lingot de Givrite":1,"Munitions à ions ×10":1,"Fusil à ions":3,"Tourelle de vaisseau":3,
    "Casque lourd":2,"Plastron lourd":3,"Jambières lourdes":2,"Lame à singularité":3,"Canon à singularité":4,
    "Lingot de Voltane":1,"Composant simple":1,"Circuit imprimé":1,"Câblage":1,"Panneau renforcé":1,"Servomoteur":2,"Composant avancé":2,"Panneau composite":2,
    "Noyau de calcul":3,"Ordinateur de hacking":3,"Supraconducteur":3,"IA d'assistance":3,"Drone de récolte":4,"Drone d'élevage":4,"Drone récupérateur":4,"Drone de combat":4,
    "Fil":1,"Panneau de Sylve":1,"Biogel":1,"Ration chaude":1,"Recharge d'oxygène":1,"Kit de soin":1,"Biocarburant":1,"Stimulant":1,"Antidote":1,
    "Boîte de soin":2,"Tank à oxygène":2,"Biofil renforcé":1,"Combinaison pressurisée":2,"Biocarburant raffiné":2,"Implant de force":3,"Implant d'agilité":3,"Implant maitre":4,
    "Lingot de Silite":1,"Plaque de coque":1,"Réservoir":1,"Cellule d'énergie":1,"Propulseur d'appoint":2,"Cockpit léger":2,"Moteur basique":2,"Navette légère":3,
    "Bloc de propulsion":3,"Soute cargo":2,"Vaisseau Cargo":4,"Coque blindée":3,"Cockpit blindé":5,"Moteur à distorsion":3,"Vaisseau maitre":5 };
  const r = { ecarts:[], nb:0, cinq:[] };
  for(const f of Object.values(FORMATIONS)) for(const [, nom] of f.recettes){
    r.nb++; const p = ptsFab(nom);
    if(attendu[nom] !== p) r.ecarts.push(`${nom} : ${p} (attendu ${attendu[nom]})`);
    if(p === 5) r.cinq.push(nom);
  }
  // Jamais au-delà du prochain palier : à 119 pts, un objet à 3 pts ne mène qu'à 120.
  const fo = FORMATIONS.ingenieur; let points = 0; const fait = {};
  let depasse = false;
  for(let tour = 0; tour < 400; tour++){
    const dispo = fo.recettes.filter(([s]) => s <= points);
    const [s, nom] = dispo[Math.floor(Math.random() * dispo.length)];
    const g = Math.min(ptsFab(nom) + 1, CAP_RECETTE - (fait[s] || 0));   // avec Apprentissage, le cas le plus large
    if(g > 0){ fait[s] = (fait[s] || 0) + g; points += g; }
    const prochain = fo.recettes.find(([x]) => x > Math.max(...dispo.map(d => d[0])));
    if(prochain && points > prochain[0]) depasse = true;
  }
  r.jamaisAuDela = !depasse; r.pointsFinaux = points;                                          // vrai ; 160
  return r;
})();
