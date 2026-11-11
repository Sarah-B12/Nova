// v2.75 (K240) — partir de la fenêtre du Fléau en plein combat = défaite ; pas de réparation pendant ;
// pas d'écran « nouvelle version » pendant. node o_banc.js .. fleau_partir
(async function(){
  const r = {}; const att = ms => new Promise(x => setTimeout(x, ms)); await att(1500);
  const msgs = []; const jOrig = journal; journal = (t) => msgs.push(String(t));
  const appels = []; const orig = sb.rpc.bind(sb);
  let serveur = null;   // le combat côté serveur
  sb.rpc = async (n, a) => {
    if(!/^fleau_/.test(n)) return orig(n, a);
    appels.push(n);
    if(n === "fleau_etat") return { data:{ ok:true, bande:"vif", combat:serveur }, error:null };
    if(n === "fleau_objets_lire") return { data:{ ok:true, objets:{} }, error:null };
    if(n === "fleau_rompre"){ serveur = Object.assign({}, serveur, { statut:"perdu", score:12.5 }); return { data:{ ok:true, combat:serveur }, error:null }; }
    return { data:{ ok:false }, error:null };
  };
  const combat = () => ({ vaisseau:"fab_vaisseau_cargo", coque:120, coque_max:260, fleau_pct:70, emballe:false, tour:3, tours:12, annonces:["rayon"], cellules:0, statut:"en_cours", score:null, gain:0, puissance:4, canon:false });
  // 1. Un combat commencé dans cette page ; on part ailleurs (la boutique).
  serveur = combat(); _fleauEtat = { ok:true, bande:"vif", combat:serveur }; _fleauEngageIci = true;
  r.enCours = fleauCombatEnCours();
  // 2. En plein combat : le kit est refusé.
  etat.vaisseau = "fab_vaisseau_cargo"; etat.sac.kit_reparation = 2; const pv0 = pvVaisseau();
  _poserPv(etat.vaisseau, 100); msgs.length = 0;
  await utiliserKitReparation();
  r.kit = { refuse: /Pas en plein combat/.test(msgs[0] || ""), kitsRestants: etat.sac.kit_reparation, coque: pvVaisseau() };
  // 3. Pas d'écran de version pendant le combat (même si une version plus récente est en ligne).
  const fOrig = window.fetch; window.fetch = async (u) => ({ ok:true, text: async () => /version\.txt/.test(u) ? String(versionLocale() + 1) : `bootstrap.js?v=${versionLocale() + 1}` });
  r.versionPendantCombat = { bloque: await versionVerifier(), ecran: !!document.querySelector("#ecran-version") };
  window.fetch = fOrig;
  // 4. Partir ailleurs : le combat est rompu.
  msgs.length = 0; appels.length = 0;
  changerHub("boutique"); await att(80);
  r.partir = { rompu: appels.includes("fleau_rompre"), statut: _fleauEtat.combat.statut, plusEnCours: !fleauCombatEnCours(), journal: msgs.find(t => /Fléau/.test(t)) };
  // 5. Une simple mise à jour de l'écran (afficher) ne rompt rien.
  serveur = combat(); _fleauEtat = { ok:true, bande:"vif", combat:serveur }; _fleauEngageIci = true; appels.length = 0;
  changerHub("fleau", true); await att(40);
  r.rafraichirNeRompPas = !appels.includes("fleau_rompre") && fleauCombatEnCours();
  // 6. Après un rechargement : le combat resté ouvert au serveur est rompu en revenant.
  _fleauEtat = null; _fleauEngageIci = false; serveur = combat(); appels.length = 0; msgs.length = 0;
  await majFleau(); await att(40);
  r.apresRechargement = { rompu: appels.includes("fleau_rompre"), statut: _fleauEtat && _fleauEtat.combat.statut, journal: msgs.find(t => /Fléau/.test(t)) };
  // 7. Hors combat : le kit répare.
  const aOrig = agirServeur; agirServeur = async () => { etat.sac.kit_reparation--; return { ok:true }; };   // le serveur (imité) accepte
  msgs.length = 0; await utiliserKitReparation(); agirServeur = aOrig;
  r.kitHorsCombat = { kitsRestants: etat.sac.kit_reparation, coque: pvVaisseau(), journal: msgs[0] };
  sb.rpc = orig; journal = jOrig;
  return r;
})();
