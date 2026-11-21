// v3.24 — le cambriolage (node outils/o_banc.js . v324) : le choix du geste, l'appel, les textes.
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
             texte: txt().includes("dans une maison") && txt().includes("même absent") && txt().includes("sa soute sont intouchables") };

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

  // 5. Hors de Silène : pas de cambriolage (bouton grisé, aucun appel).
  etat.secteur = "ecart"; etat.posEspace = { x:-9999, y:-9999 };
  majVoler(); await dort(20);
  const bc2 = vue() && vue().querySelector("#vol-cambrioler");
  appels.length = 0; await tenterCambrioler(); await dort(30);
  r.horsSilene = { grise: !bc2 || bc2.disabled, appel: appels.some(a => a.n === "vol_preparer"), msg: journ.slice(-1)[0] };
  journal = jOrig;
  return r;
})();
