// v2.90 (v292, K263) — le vaisseau équipé est un lot du serveur (lieu « vaisseau », le hangar).
// Vérifie : équiper / ranger par vaisseau_equiper / vaisseau_ranger (sauvegarde avant, aucun agir), etat.vaisseau
// et etat.vaisseauDate pris dans la réponse (date du LOT), un refus dit, et l'usure : à échéance, la soute revient
// au sac PUIS le lot du hangar est périmé au serveur.
//   node outils/o_banc.js . hangar
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(400);
  const appels = []; const rpc0 = sb.rpc.bind(sb); let rep = {};
  sb.rpc = (n, a) => { appels.push(n + (a && a.p_item ? ":" + a.p_item : "") + (a && a.p_lots ? ":" + a.p_lots.map(l => l.lieu + "/" + l.item).join(",") : ""));
    return rep[n] ? Promise.resolve(rep[n](a)) : rpc0(n, a); };
  const J = JOUR_MS, t0 = Date.now() - 3 * J;
  const etatAvec = (v, sac) => ({ sac: sac || {}, coffre:{}, soute:{}, equipe:{}, vaisseau: v,
    lots: v ? [{ item:v, lieu:"vaisseau", qte:1, acquis:t0 }] : [] });
  etat.permisVaisseau = true; etat.vaisseau = null; etat.vaisseauDate = null; etat.vaisseauAge = {};
  etat.sac = { fab_navette_legere:1 }; etat.soute = {};
  // 1. Équiper
  rep.vaisseau_equiper = () => ({ data:{ ok:true, vaisseau:"fab_navette_legere", etat: etatAvec("fab_navette_legere") }, error:null });
  appels.length = 0; await equiperVaisseau("fab_navette_legere");
r.equiper = { appels: appels.filter(a => /vaisseau_|agir|sauver_profil/.test(a)), vaisseau: etat.vaisseau, dateDuLot: etat.vaisseauDate === t0 };
  // 2. Refus (soute pleine côté serveur)
  rep.vaisseau_ranger = () => ({ data:{ ok:false, err:"soute" }, error:null });
  await desequiperVaisseau();
  r.refus = { journal: (etat.journal[0] || {}).t, toujoursEquipe: etat.vaisseau };
  // 3. Ranger
  rep.vaisseau_ranger = () => ({ data:{ ok:true, range:"fab_navette_legere", etat: { sac:{ fab_navette_legere:1 }, coffre:{}, soute:{}, equipe:{},
    vaisseau:null, lots:[{ item:"fab_navette_legere", lieu:"sac", qte:1, acquis:t0 }] } }, error:null });   // la date du lot suit au sac
  appels.length = 0; await desequiperVaisseau();
r.ranger = { appels: appels.filter(a => /vaisseau_|agir/.test(a)), vaisseau: etat.vaisseau, garde: etat.vaisseauAge.fab_navette_legere === t0, age: ageVaisseau("fab_navette_legere") === t0 };
  // 4. Une réponse SANS le champ « vaisseau » (serveur d'avant v292) ne touche à rien
  etat.vaisseau = "fab_vaisseau_cargo"; _appliquerEtatStocks({ sac:{}, coffre:{}, soute:{}, lots:[] });
  r.sansChamp = etat.vaisseau;
  // 5. Usure : le cargo (30 jours) équipé depuis 40 jours, 2 Cendrite en soute
  const vieux = Date.now() - 40 * J;
  _appliquerEtatStocks({ sac:{}, coffre:{}, soute:{ cendrite:2 }, equipe:{}, vaisseau:"fab_vaisseau_cargo",
    lots:[{ item:"fab_vaisseau_cargo", lieu:"vaisseau", qte:1, acquis:vieux }, { item:"cendrite", lieu:"soute", qte:2, acquis:Date.now() }] });
  etat.vaisseauAge = {};
  rep.ranger = () => ({ data:{ ok:true, deplace:2, etat:{ sac:{ cendrite:2 }, coffre:{}, soute:{}, equipe:{}, vaisseau:"fab_vaisseau_cargo",
    lots:[{ item:"fab_vaisseau_cargo", lieu:"vaisseau", qte:1, acquis:vieux }, { item:"cendrite", lieu:"sac", qte:2, acquis:Date.now() }] } }, error:null });
  rep.perimer = (a) => ({ data:{ ok:true, lots:a.p_lots.length, etat:{ sac:{ cendrite:2 }, coffre:{}, soute:{}, equipe:{}, vaisseau:null, lots:[] } }, error:null });
  secoursOrbite = async () => {};
  appels.length = 0; etat._lotsSynchro = true; etat.enPause = false;
  await majUsure(); await dort(30);
  r.usure = { ordre: appels.filter(a => /^(ranger|perimer)/.test(a)), vaisseau: etat.vaisseau,
              journal: (etat.journal || []).map(e => e.t).find(t => /rendu l'âme/.test(t)) || null };
  sb.rpc = rpc0;
  return r;
})()
