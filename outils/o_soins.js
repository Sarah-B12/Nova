// v2.92 (v294, K266) — les soins calculés par le serveur. Vérifie : utiliser un kit appelle soin_consommer (aucun
// agir, aucun soin annoncé) et le journal dit le gain réel renvoyé ; le repos appelle repos() (refus « déjà »
// dit et retenu) ; la régénération des aptitudes appelle regen_aptitudes au plus toutes les 10 minutes, jamais sans
// aptitude ; les séquelles de bataille sont prises dans la réponse de consommer_effets (aucun agir), mort comprise.
//   node outils/o_banc.js . soins
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const appels = []; const rpc0 = sb.rpc.bind(sb); const rep = {};
  sb.rpc = (n, a) => { appels.push(n + (a && a.p_item ? ":" + a.p_item : "") + (n === "agir" ? ":" + JSON.stringify(a.p_jauges || {}) : ""));
    if(n in rep) return Promise.resolve({ data: typeof rep[n] === "function" ? rep[n](a) : rep[n], error: null });
    return rpc0(n, a); };
  const dernier = () => (etat.journal[0] || {}).t;
  // 1. Un kit de soin : le serveur applique le soin
  etat.jauges = { o2:100, sante:50, moral:90 }; etat.sac.fab_kit_de_soin = 2;
  rep.soin_consommer = { ok:true, item:"fab_kit_de_soin", soin:{ sante:26, moral:26 }, jauges:{ o2:100, sante:76, moral:100 },
                         etat:{ sac:{ fab_kit_de_soin:1 }, coffre:{}, soute:{}, equipe:{}, lots:[] }, energie:etat.energie };
  appels.length = 0; await utiliser("fab_kit_de_soin");
  r.kit = { appels: appels.filter(x => /soin_consommer|agir/.test(x)), jauges: { ...etat.jauges }, sac: etat.sac.fab_kit_de_soin, journal: dernier() };
  rep.soin_consommer = { ok:false, err:"prison" }; etat.sac.fab_kit_de_soin = 1;
  await utiliser("fab_kit_de_soin"); r.kitPrison = dernier();
  // 2. Le repos
  etat.secteur = "silene"; etat.pos = { x:1250, y:770 }; etat.faction = "cultivateurs"; etat.reposLe = 0; etat.enPause = false;
  etat.jauges = { o2:100, sante:30, moral:30 };
  rep.repos = { ok:true, sante:25, moral:25, chez_soi:true, cap:80, jauges:{ o2:100, sante:55, moral:55 } };
  appels.length = 0; await reposer();
  r.repos = { appels: appels.filter(x => /repos|agir/.test(x)), jauges: { ...etat.jauges }, retenu: memeJour(etat.reposLe), journal: dernier() };
  etat.reposLe = 0; rep.repos = { ok:false, err:"deja" }; await reposer();
  r.reposDeja = { journal: dernier(), retenu: memeJour(etat.reposLe) };
  etat.reposLe = 0; etat.pos = { x:600, y:600 }; appels.length = 0; await reposer();
  r.reposHorsVille = { appels: appels.filter(x => /repos/.test(x)).length, journal: dernier() };
  // 3. La régénération des aptitudes
  const pris = aptEtat().pris.slice(); aptEtat().pris = []; _regenDer = 0; appels.length = 0;
  rep.regen_aptitudes = { ok:true, o2:5, sante:1, moral:1, jauges:{ o2:60, sante:41, moral:41 } };
  etat.jauges = { o2:55, sante:40, moral:40 };
  regenPassif(); await new Promise(x => setTimeout(x, 30));
  r.regenSansAptitude = appels.filter(x => /regen|agir/.test(x)).length;
  aptEtat().pris = ["cu3", "cu4"]; regenPassif(); await new Promise(x => setTimeout(x, 30));
  regenPassif(); await new Promise(x => setTimeout(x, 30));
  r.regen = { appels: appels.filter(x => /regen|agir/.test(x)), jauges: { ...etat.jauges } };
  _regenDer = Date.now() - 11 * 60000; regenPassif(); await new Promise(x => setTimeout(x, 30));
  r.regenApres10min = appels.filter(x => /regen/.test(x)).length;
  aptEtat().pris = pris;
  // 4. Les séquelles de bataille
  etat.jauges = { o2:100, sante:50, moral:50 };
  rep.consommer_effets = { sante:0, moral:0, sante_appliquee:-12, moral_appliquee:10, mort:false, jauges:{ o2:100, sante:38, moral:60 },
                           cristaux:0, energie:0, xp:0, xp_total: etat.xpTotal || 0 };
  rep.consommer_evenements = [];
  appels.length = 0; await syncEffetsCombat();
  r.sequelles = { appels: appels.filter(x => /agir/.test(x)), jauges: { ...etat.jauges }, journal: (etat.journal.find(e => /Séquelles/.test(e.t)) || {}).t };
  let couloir = 0; const oc = ouvrirCouloirMort; ouvrirCouloirMort = () => { couloir++; };
  rep.consommer_effets = { sante:0, moral:0, sante_appliquee:-12, moral_appliquee:-12, mort:true, jauges:{ o2:100, sante:0, moral:38 }, cristaux:0, energie:0, xp:0, xp_total: etat.xpTotal || 0 };
  await syncEffetsCombat(); r.sequellesMortelles = { couloir, sante: etat.jauges.sante };
  ouvrirCouloirMort = oc; sb.rpc = rpc0;
  return r;
})()
