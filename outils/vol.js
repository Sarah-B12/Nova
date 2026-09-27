// v1.22 — vrai vol : deux appels serveur, rien n'est tiré ici (node banc.js .. vol)
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  const appels = []; let rep = {};
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => { appels.push({ n, a }); return rep[n] ? Promise.resolve({ data: rep[n](a), error: null }) : orig(n, a); };
  let issue = true, joue = 0;
  lancerMiniVol  = (win, lose) => { joue++; return issue ? win() : lose(); };
  lancerMiniHack = (win, lose) => { joue++; return issue ? win() : lose(); };
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); };
  etat.aptitudes = { pa:0, pris: ["om1","om2","om3","om4"], v:125 };   // v1.25 : chaîne complète (la migration rend un om4 orphelin) etat.equipement = etat.equipement || {}; etat.equipement.arme = ITEM_HACK_VOL;
  etat.prisonJusqua = 0; etat.energie = 80;
  _enVille = () => true;
  const avantRandom = Math.random; let hasard = 0; Math.random = () => { hasard++; return avantRandom(); };

  // 1. personne : ni mini-jeu, ni conclusion
  rep.vol_preparer = () => ({ ok:false, err:"personne" });
  await tenterVoler(); await dort(20);
  r.personne = { joue, conclure: appels.some(a=>a.n==="vol_conclure"), msg: journ.slice(-1)[0] };

  // 2. vol réussi, signé
  rep.vol_preparer = (a) => ({ ok:true, id:42, cible:"Bob", energie:65, _cout:a.p_cout });
  rep.vol_conclure = (a) => ({ ok:true, mode:"vol", reussi:true, signe:true, cible:"Bob", butin:{ cendrite:3 }, gain:0, sac_plein:false,
                               etat:{ sac:{ cendrite:15 }, coffre:{}, soute:{}, lots:[] }, energie:65, solde:4321 });
  appels.length = 0; hasard = 0;
  await tenterVoler(); await dort(50);
  const pc = appels.find(a=>a.n==="vol_conclure");
  r.reussi = { ordre: appels.map(a=>a.n).filter(n=>/^vol_/.test(n)), cout: appels.find(a=>a.n==="vol_preparer").a.p_cout,
               args: pc && pc.a, energie: etat.energie, sacCendrite: etat.sac.cendrite, msg: journ.slice(-1)[0], tiragesClient: hasard };

  // 3. hack raté avec prison
  issue = false;
  rep.vol_preparer = () => ({ ok:true, id:43, cible:"Bob", energie:50 });
  rep.vol_conclure = () => ({ ok:true, reussi:false, signe:false, prison:true, prison_faction:"ignis", jusqua:new Date(Date.now()+86400e3).toISOString(), mode:"hack", cible:"Bob", energie:50 });
  appels.length = 0;
  _ordiEquipe = () => true;   // la synchro de fond du banc (sac serveur sans équipement) vide l'emplacement : sans rapport avec le hack
  await tenterHacker(); await dort(50);
  r.hackRate = { reussi: appels.find(a=>a.n==="vol_conclure").a.p_reussi, prison: enPrison(), faction: etat.prisonFaction, msgs: journ.slice(-2) };

  // 4. abandon qui mène en prison
  etat.prisonJusqua = 0;
  rep.vol_preparer = () => ({ ok:false, err:"prison", abandon:true });
  await tenterVoler(); await dort(50);
  r.abandon = journ.slice(-1)[0];

  // 5. encart
  etat.prisonJusqua = 0; majVoler();
  r.encart = (document.querySelector("#voler-vue")||{}).textContent;
  r.encart = r.encart ? r.encart.replace(/\s+/g," ").match(/Moins payant[^.]*\.[^.]*\.[^.]*\./)?.[0] : "(pas de #voler-vue)";
  Math.random = avantRandom; journal = jOrig;
  return r;
})()
