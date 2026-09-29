// v1.35 — terrain côté serveur, brique 7 (node o_banc.js .. terrain)
(async function(){
  const r = {};
  const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);                                   // démarrage + syncApresConnexion
  const rpcOrig = sb.rpc.bind(sb);
  const appels = []; let rep = {};
  sb.rpc = (nom, args) => { appels.push({ nom, args: JSON.parse(JSON.stringify(args || {})) });
    if(rep[nom]) return Promise.resolve(rep[nom](args)); return rpcOrig(nom, args); };
  const journ = []; const jOrig = journal; journal = (t, c) => { journ.push(t); };
  window.confirm = () => true;
  const T = (parc, maison) => ({ parcelles: Array.from({ length: 24 }, (_, i) => parc[i] || null),
                                 maison: maison || { palier: 1, plot: 0, chantier: null }, integrite: {} });
  const base = () => JSON.parse(JSON.stringify(etat.terrain.parcelles));

  // 1. Le terrain arrive par terrain_lire au démarrage.
  r.demarrage = { synchro: _terrainSynchro, n: etat.terrain.parcelles.length, mine: etat.terrain.parcelles[1],
                  palier: etat.maison.palier, abandonClient: typeof verifierAbandonTerrain };

  // 2. Ni le terrain ni la maison ne partent dans donnees ni dans localStorage.
  appels.length = 0;
  rep.sauver_profil = () => ({ data: { ok: true, rev: 50, maj: 5 }, error: null });
  await sauverSurServeur(); await dort(50);
  const sv = appels.filter(a => a.nom === "sauver_profil").pop();
  const don = sv && sv.args.p_maj && sv.args.p_maj.donnees;
  sauvegarder(); await dort(50);
  const loc = JSON.parse(localStorage.getItem("nova-epic-save") || "{}");
  r.persistance = { envoye: !!sv, terrainDansDonnees: !!(don && "terrain" in don), maisonDansDonnees: !!(don && "maison" in don),
                    terrainLocal: "terrain" in loc, maisonLocal: "maison" in loc };

  // 3. Bâtir : un appel, la réponse fait foi (terrain + solde).
  etat.pos = { x: VILLES[etat.faction].x, y: VILLES[etat.faction].y }; etat.secteur = "silene";
  etat.credits = 5000; appels.length = 0;
  rep.terrain_batir = (a) => ({ data: { ok: true, prix: 150, solde: 4850, energie: 70,
    terrain: T(Object.assign(base(), { [a.p_plot]: { type: "mine", stock: 750, max: 750 } })) }, error: null });
  plotSel = 5; await batirParcelle("mine");
  const b = appels.find(a => a.nom === "terrain_batir");
  r.batir = { args: b && b.args, p5: etat.terrain.parcelles[5], energie: etat.energie, credits: etat.credits, msg: journ.slice(-1)[0] };

  // 4. Démolir : hangar avec drone refusé AVANT l'appel ; mine démolie avec recyclage.
  appels.length = 0;
  etat.terrain.parcelles[3] = { type: "hangar", drones: [{ type: "recolte", cible: 4, maj: 0, pose: Date.now() }, null] };
  await demolir(3);
  r.demolirHangar = { appels: appels.filter(a => a.nom === "terrain_demolir").length, msg: journ.slice(-1)[0] };
  rep.terrain_demolir = (a) => ({ data: { ok: true, type: "mine", rembourse: 75, solde: 4925,
    terrain: T(Object.assign(base(), { [a.p_plot]: null })) }, error: null });
  await demolir(5);
  r.demolirMine = { p5: etat.terrain.parcelles[5], msg: journ.slice(-1)[0], credits: etat.credits };

  // 5. Miner : tirage client (≤ 6 sans aptitude), réserve lue dans la réponse.
  appels.length = 0;
  rep.terrain_miner = (a) => { const n = Object.values(a.p_gains).reduce((x, y) => x + y, 0);
    return { data: { ok: true, ajoutes: a.p_gains, stock: 200 - n, max: 500,
      terrain: T(Object.assign(base(), { 1: { type: "mine", stock: 200 - n, max: 500 } })) }, error: null }; };
  await recolterMine(1);
  const m = appels.find(a => a.nom === "terrain_miner");
  const tot = m ? Object.values(m.args.p_gains).reduce((x, y) => x + y, 0) : 0;
  r.miner = { plot: m && m.args.p_plot, total: tot, borne: tot >= 1 && tot <= 6, stock: etat.terrain.parcelles[1].stock, msg: journ.slice(-1)[0] };

  // 6. Refus serveur : message propre à l'action.
  etat.terrain.parcelles[4] = { type: "biodome", cases: [{ plante: "sylve", croissance: 40, arrose: 0, soin: Date.now() }, null, null, null] };
  rep.terrain_arroser = () => ({ data: { ok: false, err: "deja" }, error: null });
  structSel = 4; await arroserCase(0);
  r.refusDeja = journ.slice(-1)[0];
  rep.terrain_arroser = () => ({ data: { ok: false, err: "hs" }, error: null });
  await arroserCase(0);
  r.refusHS = journ.slice(-1)[0];

  // 7. Maison : déposer (quantité), travailler en série, fin annoncée.
  etat.maison = { palier: 1, plot: 0, chantier: { cible: 2, depose: {}, travail: 0 } };
  etat.sac.cendrite = 12; appels.length = 0;
  rep.maison_deposer = (a) => ({ data: { ok: true, depose: 10, total: 10, besoin: 10, fini: false,
    terrain: T(base(), { palier: 1, plot: 0, chantier: { cible: 2, depose: { cendrite: 10 }, travail: 0 } }) }, error: null });
  await deposerMat("cendrite", true);
  r.deposer = { args: (appels.find(a => a.nom === "maison_deposer") || {}).args, depose: etat.maison.chantier.depose, msg: journ.slice(-1)[0] };
  rep.maison_travailler = (a) => ({ data: { ok: true, fait: 5, travail: 5, total: 20, fini: false,
    terrain: T(base(), { palier: 1, plot: 0, chantier: { cible: 2, depose: { cendrite: 10 }, travail: 5 } }) }, error: null });
  await travaillerMaison(5);
  r.travailler = { args: (appels.find(a => a.nom === "maison_travailler") || {}).args, msg: journ.slice(-1)[0] };
  rep.maison_travailler = () => ({ data: { ok: true, fait: 15, travail: 20, total: 20, fini: true,
    terrain: T(base(), { palier: 2, plot: 0, chantier: null }) }, error: null });
  await travaillerMaison(50);
  r.finie = { palier: etat.maison.palier, chantier: etat.maison.chantier, msg: journ.slice(-1)[0] };

  await dort(150);                                    // un passage lancé par afficher() se termine
  // 8. Drones : UN appel par passage, tirages pour chaque case, messages au journal.
  etat.terrain.parcelles[3] = { type: "hangar", drones: [{ type: "recolte", cible: 4, maj: 0, pose: Date.now() }, null] };
  etat.terrain.parcelles[4] = { type: "biodome", cases: [{ plante: "sylve", croissance: 100, arrose: 0, soin: Date.now() }, null, { plante: "nectine", croissance: 40, arrose: 0, soin: Date.now() }, null] };
  appels.length = 0; _droneProchain = 0;
  rep.terrain_drones = (a) => ({ data: { ok: true, niveau: null, messages: [{ texte: "Drone de récolte : +7 Sylve (au coffre).", cat: "gain" }],
    terrain: T(Object.assign(base(), { 3: { type: "hangar", drones: [{ type: "recolte", cible: 4, maj: Date.now(), pose: Date.now() }, null] } })) }, error: null });
  await majDrones();
  const d1 = appels.filter(a => a.nom === "terrain_drones");
  await majDrones();                                   // même jour : plus rien à faire → aucun appel
  r.drones = { appels: d1.length, cles: d1[0] && Object.keys(d1[0].args.p_tirages).sort(),
               apresDeuxieme: appels.filter(a => a.nom === "terrain_drones").length, msg: journ.find(t => t.startsWith("Drone de récolte")) };
  // Niveau : dit une fois, pas de nouvel essai immédiat.
  etat.terrain.parcelles[3].drones[0].maj = 0; _droneProchain = 0; appels.length = 0;
  rep.terrain_drones = () => ({ data: { ok: true, niveau: { requis: 21, niveau: 3 }, messages: [], terrain: null }, error: null });
  await majDrones(); await majDrones();
  r.droneNiveau = { appels: appels.filter(a => a.nom === "terrain_drones").length, msg: journ.filter(t => t.includes("drones ne travaillent")).length };
  // Hangar à l'arrêt : aucun appel.
  _droneProchain = 0; appels.length = 0; _appliquerIntegrite({ "3": 0 });
  await majDrones();
  r.hangarHS = appels.filter(a => a.nom === "terrain_drones").length;
  _appliquerIntegrite({});

  // 9. Retirer un drone sac plein : refusé avant l'appel (décision B).
  structSel = 3; appels.length = 0;
  const lib = placesLibres; placesLibres = () => 0;
  await retirerDrone(0);
  placesLibres = lib;
  r.retirerSacPlein = { appels: appels.filter(a => a.nom === "drone_retirer").length, msg: journ.slice(-1)[0] };

  // 10. L'usure ne touche plus aux drones côté client.
  etat.terrain.parcelles[3].drones[0].pose = Date.now() - 40 * 86400000;
  if(typeof majUsure === "function") await majUsure();
  r.usureClient = !!etat.terrain.parcelles[3].drones[0];

  journal = jOrig;
  return r;
})();
