// v1.17 — bugs de synchronisation (node o_banc.js .. sync)
(async function(){
  const r = {};
  const dort = ms => new Promise(x => setTimeout(x, ms));
  const rpcOrig = sb.rpc.bind(sb);
  const appels = [];
  let rep = {};
  sb.rpc = (nom, args) => { appels.push({ nom, args: JSON.parse(JSON.stringify(args||{})) });
    if(rep[nom]) return rep[nom](args); return rpcOrig(nom, args); };
  const PIST = "fab_pistolet_cinetique", CASQ = "fab_casque_leger", IMPL = "fab_implant_de_force";

  // 1. Lecture périmée : sac_lire part AVANT ranger et revient APRÈS.
  etat.equipement = {}; _appliquerEtatStocks({ sac:{ [PIST]:1 }, coffre:{}, soute:{}, lots:[], equipe:{} });
  rep.sac_lire = () => dort(200).then(() => ({ data:{ sac:{ [PIST]:1 }, coffre:{}, soute:{}, lots:[], equipe:{} }, error:null }));
  rep.ranger   = () => dort(30).then(() => ({ data:{ ok:true, etat:{ sac:{}, coffre:{}, soute:{}, lots:[], equipe:{ [PIST]:1 } } }, error:null }));
  const lecture = chargerStocksServeur();
  await dort(10); await equiper(PIST); await lecture;
  r.lecturePerimee = { sac: etat.sac[PIST]||0, arme: etat.equipement.arme, arme2: etat.equipement.arme2||null, force: equipForce() };

  // 2. Réconciliation : arme fantôme retirée, casque gardé, implant orphelin replacé.
  etat.equipement = { arme: PIST, tete: CASQ };
  _appliquerEtatStocks({ sac:{}, coffre:{}, soute:{}, lots:[], equipe:{ [CASQ]:1, [IMPL]:1 } });
  r.reconcilie = { arme: etat.equipement.arme, tete: etat.equipement.tete, implant: etat.equipement.implant, force: equipForce() };
  // 2b. une réponse SANS `equipe` ne touche pas aux emplacements
  _appliquerEtatStocks({ sac:{}, coffre:{}, soute:{}, lots:[] });
  r.sansChampEquipe = { tete: etat.equipement.tete, implant: etat.equipement.implant };
  // 2c. deux armes identiques portées, une seule au serveur
  etat.equipement = { arme: PIST, arme2: PIST };
  _appliquerEtatStocks({ sac:{}, coffre:{}, soute:{}, lots:[], equipe:{ [PIST]:1 } });
  r.doublon = [etat.equipement.arme, etat.equipement.arme2];

  // 3. ranger → manque : relecture immédiate
  appels.length = 0;
  rep.ranger = () => Promise.resolve({ data:{ ok:false, err:"manque" }, error:null });
  rep.sac_lire = () => Promise.resolve({ data:{ sac:{}, coffre:{}, soute:{}, lots:[], equipe:{} }, error:null });
  await rangerServeur(CASQ, 1, "sac", "equipe"); await dort(50);
  r.manqueRelit = appels.filter(a => a.nom === "sac_lire").length;

  // 4. File : un changement fait PENDANT une sauvegarde en vol repart dans une 2ᵉ.
  appels.length = 0;
  let n = 0;
  rep.sauver_profil = () => { n++; return dort(80).then(() => ({ data:{ ok:true, rev: 100+n, maj: 1000+n }, error:null })); };
  const p1 = sauverSurServeur();
  await dort(40);   // p1 est partie (photo prise)
  etat.quetes.active = { id:"q2", etape:0 };
  const p2 = sauverSurServeur();
  await p1; await p2; await dort(20);
  const sv = appels.filter(a => a.nom === "sauver_profil");
  r.file = { nb: sv.length, derniereAQuete: !!(sv.length && sv[sv.length-1].args.p_maj.donnees.quetes.active) };

  // 5. Conflit refusé : la page se bloque et n'écrit plus.
  appels.length = 0;
  rep.sauver_profil = () => Promise.resolve({ data:{ err:"conflit", rev:999, maj:99999, sid:"autre" }, error:null });
  await sauverSurServeur();
  const bloc = document.querySelector("#page-perimee");
  await sauverSurServeur(); await sauverSurServeur();
  r.gel = { ecran: !!bloc, gelee: _pageGelee, appelsApres: appels.filter(a => a.nom === "sauver_profil").length,
            diag: JSON.parse(localStorage.getItem("nova_diag")||"[]").map(e => e.type).filter((v,i,a)=>a.indexOf(v)===i) };

  // 6. hydraterEtat garde paRecu ; absent = reconstruit comme avant
  r.paRecu = [ hydraterEtat({ inscrit:true, quetes:{ done:["q1"], active:null, paRecu:["q1","q2"] } }).quetes.paRecu,
               hydraterEtat({ inscrit:true, quetes:{ done:["q1"], active:null } }).quetes.paRecu ];
  return r;
})()
