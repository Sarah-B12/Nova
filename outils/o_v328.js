// v3.28 — fouiller une soute hors de Silène (node outils/o_banc.js . v328) ; le cambriolage sur Silène, inchangé.
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1200);
  const appels = []; let rep = {};
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => { appels.push({ n, a }); return rep[n] ? Promise.resolve({ data: rep[n](a), error: null }) : orig(n, a); };
  let issue = true;
  lancerMiniVol = (win, lose) => issue ? win() : lose();
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); };
  etat.aptitudes = { pa:0, pris: ["om1","om2","om3","om4"], v:125 };
  etat.prisonJusqua = 0; etat.energie = 80;
  const vue = () => document.querySelector("#voler-vue");
  const txt = () => (vue() ? vue().textContent : "").replace(/\s+/g, " ");

  // 1. Dans une cité, sur Silène : les deux gestes.
  etat.secteur = "silene"; villeActuelle = () => etat.faction;
  changerHub("voler"); majVoler(); await dort(30);
  const bp = vue().querySelector("#vol-voler"), bc = vue().querySelector("#vol-cambrioler");
  r.cite = { poches: bp && bp.textContent, pochesActif: bp && !bp.disabled, maison: bc && bc.textContent, maisonActif: bc && !bc.disabled,
             texte: txt().includes("dans une maison") && txt().includes("même absent") && txt().includes("le carburant d'une soute") };

  // 2. Cambriolage réussi : p_geste « maison », le texte du voleur.
  rep.vol_preparer = (a) => ({ ok:true, id:50, cible:"Ana", geste:a.p_geste, energie:65 });
  rep.vol_conclure = () => ({ ok:true, mode:"vol", geste:"maison", reussi:true, signe:false, cible:"Ana", butin:{ cuir:2 }, gain:0, sac_plein:false, energie:65 });
  appels.length = 0;
  bc.click(); await dort(80);
  const pp = appels.find(a => a.n === "vol_preparer");
  r.cambriolage = { geste: pp && pp.a.p_geste, conclure: appels.some(a => a.n === "vol_conclure"), msg: journ.slice(-1)[0] };

  // 3. Les poches, comme avant : p_geste « poches ».
  rep.vol_conclure = () => ({ ok:true, mode:"vol", geste:"poches", reussi:true, signe:true, cible:"Cyl", butin:{ cuir:1 }, gain:0, sac_plein:false, energie:50 });
  appels.length = 0; majVoler(); await dort(20);
  vue().querySelector("#vol-voler").click(); await dort(80);
  r.poches = { geste: (appels.find(a => a.n === "vol_preparer") || {}).a?.p_geste, msg: journ.slice(-1)[0] };

  // 4. Échec, vide, refus « personne », pique : les mots du cambriolage.
  issue = false;
  rep.vol_conclure = () => ({ ok:true, reussi:false, signe:true, prison:false, mode:"vol", geste:"maison", cible:"Ana", energie:40 });
  await tenterCambrioler(); await dort(60);
  r.echec = journ.slice(-1)[0];
  issue = true;
  rep.vol_conclure = () => ({ ok:true, mode:"vol", geste:"maison", reussi:true, vide:true, sac_plein:false, cible:"Ana", energie:40 });
  await tenterCambrioler(); await dort(60);
  r.vide = journ.slice(-1)[0];
  rep.vol_conclure = () => ({ ok:true, reussi:false, pique:true, mode:"vol", geste:"maison", cible:"Ana", energie:40 });
  await tenterCambrioler(); await dort(60);
  r.pique = journ.slice(-1)[0];
  rep.vol_preparer = () => ({ ok:false, err:"personne" });
  await tenterCambrioler(); await dort(60);
  r.personne = journ.slice(-1)[0];
  rep.vol_preparer = () => ({ ok:false, err:"personne" });
  await tenterVoler(); await dort(60);
  r.personnePoches = journ.slice(-1)[0];

  // 5. Hors de Silène, sur un lieu : « Fouiller une soute » remplace « Cambrioler une maison ».
  etat.secteur = "ecart"; const ici0 = _volIci; _volIci = () => true;
  majVoler(); await dort(20);
  const bs = vue().querySelector("#vol-soute");
  r.horsSilene = { soute: bs && bs.textContent, souteActif: bs && !bs.disabled, plusDeMaison: !vue().querySelector("#vol-cambrioler"),
                   texte: txt().includes("dans une soute") && txt().includes("jamais le carburant") };
  rep.vol_preparer = (a) => ({ ok:true, id:60, cible:"Sora", geste:a.p_geste, energie:30 });
  rep.vol_conclure = () => ({ ok:true, mode:"vol", geste:"soute", reussi:true, signe:true, cible:"Sora", butin:{ cuir:2 }, gain:0, sac_plein:false, energie:30 });
  appels.length = 0; issue = true; etat.energie = 80;
  bs.click(); await dort(80);
  r.soute = { geste: (appels.find(a => a.n === "vol_preparer") || {}).a?.p_geste, msg: journ.slice(-1)[0] };
  rep.vol_conclure = () => ({ ok:true, mode:"vol", geste:"soute", reussi:true, vide:true, sac_plein:false, cible:"Sora", energie:30 });
  await tenterFouillerSoute(); await dort(60); r.souteVide = journ.slice(-1)[0];
  issue = false; rep.vol_conclure = () => ({ ok:true, reussi:false, signe:true, prison:false, mode:"vol", geste:"soute", cible:"Sora", energie:30 });
  await tenterFouillerSoute(); await dort(60); r.souteEchec = journ.slice(-1)[0]; issue = true;
  rep.vol_preparer = () => ({ ok:false, err:"personne" });
  await tenterFouillerSoute(); await dort(60); r.soutePersonne = journ.slice(-1)[0];
  // 6. Sur Silène, la soute ne se fouille pas (aucun appel).
  etat.secteur = "silene"; appels.length = 0;
  await tenterFouillerSoute(); await dort(30);
  r.silene = { appel: appels.some(a => a.n === "vol_preparer"), msg: journ.slice(-1)[0] };
  _volIci = ici0;
  journal = jOrig;
  return r;
})();
