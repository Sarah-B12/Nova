// v1.33 — niveau requis pour utiliser un objet + nouvelle courbe (node o_banc.js .. niveaux)
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  const appels = []; const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => { appels.push({ n, a }); return n === "ranger" ? Promise.resolve({ data:{ ok:true }, error:null }) : orig(n, a); };
  const journ = []; journal = (t) => { journ.push(t); };
  sauverMaintenant = async () => {};

  // 1. Courbe : inchangée jusqu'à 20, cubique au-delà
  r.courbe = [2,5,10,19,20,21,25,33,40].map(n => [n, xpCumulPour(n)]);
  r.niveaux = [0, 3799, 3800, 4409, 4410, 31199, 31200].map(x => [x, niveauDeXp(x)]);

  // 2. Équiper : refus sous le niveau, accepté au niveau
  etat.niveau = 39; etat.sac.fab_canon_a_singularite = 1; etat.equipement.arme = null; etat.equipement.arme2 = null;
  const avant = appels.length;
  await equiper("fab_canon_a_singularite");
  r.equiperNiv39 = { message: journ.slice(-1)[0], rangerAppele: appels.slice(avant).some(a => a.n === "ranger"), equipe: etat.equipement.arme };
  etat.niveau = 40;
  await equiper("fab_canon_a_singularite"); await dort(20);
  r.equiperNiv40 = { rangerAppele: appels.slice(avant).some(a => a.n === "ranger"), equipe: etat.equipement.arme || etat.equipement.arme2 };
  etat.niveau = 1; etat.sac.fab_couteau_de_survie = 1; etat.equipement.arme = null; etat.equipement.arme2 = null;   // le Canon est à deux mains
  await equiper("fab_couteau_de_survie"); await dort(20);
  r.couteauNiv1 = etat.equipement.arme === "fab_couteau_de_survie" || etat.equipement.arme2 === "fab_couteau_de_survie";

  // 3. Vaisseau et drone de hangar
  etat.niveau = 19; etat.sac.fab_vaisseau_cargo = 1; etat.permisVaisseau = true;
  let agirs = 0; const agOrig = agirServeur; agirServeur = async () => { agirs++; return { ok:true, ajoutes:{} }; };
  await equiperVaisseau("fab_vaisseau_cargo");
  r.vaisseauNiv19 = { message: journ.slice(-1)[0], agir: agirs };
  etat.niveau = 21; etat.sac.fab_drone_de_recolte = 1;
  etat.terrain = etat.terrain || {}; etat.terrain.parcelles = [{ type:"hangar", drones:[null,null] }];
  structSel = 0;
  await placerDrone(0, "recolte");
  r.droneNiv21 = { message: journ.slice(-1)[0], agir: agirs, pose: etat.terrain.parcelles[0].drones[0] };
  agirServeur = agOrig;

  // 4. Affichage
  etat.niveau = 10;
  const tip = document.createElement("div"); tip.innerHTML = infoItemHTML("fab_fusil_a_ions");
  r.infobulle = tip.textContent.match(/Utilisable dès le niveau \d+/g);
  r.infobulleManque = !!tip.querySelector(".mention-niveau.manque");
  const tip2 = document.createElement("div"); tip2.innerHTML = infoItemHTML("fab_couteau_de_survie");
  r.couteauSansMention = !/Utilisable dès/.test(tip2.textContent);
  const tip3 = document.createElement("div"); tip3.innerHTML = infoItemHTML("fab_lame_a_plasma");
  r.lameNiv10 = { mention: /niveau 10/.test(tip3.textContent), orange: !!tip3.querySelector(".manque") };
  r.recette = _mentionNivFab("Canon à singularité").replace(/<[^>]+>/g, "");
  r.recetteDrone = _mentionNivFab("Drone d'élevage").replace(/<[^>]+>/g, "");
  etat.sac.fab_implant_maitre = 1;
  ouvrirMenuObjet("fab_implant_maitre");
  const mo = document.querySelector(".menu-niveau");
  r.ficheObjet = mo && mo.textContent;
  // Toutes les entrées de la table existent comme objets
  r.idsInconnus = Object.keys(NIVEAUX_OBJETS).filter(id => !item(id));
  return r;
})();
